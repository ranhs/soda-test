import { spy as sinonSpy, stub as sinonStub, useFakeTimers } from "sinon";
import { Rewire, getLibRewire, reloadLibRewire } from "./rewire";
import { SinonInfo, SinonKind, SetStubType } from "./testInfo";
import { SinonSpy, SinonStub, SinonFakeTimers } from "./index";
import { isFunction } from "util";
import { targetType, anyFunction } from "./executables";
import { setProperty } from "./setProperty";

type sinonMethod = (...args: unknown[]) => unknown


function setStub(
        stub: SinonStub, 
        setStub: { type: SetStubType, value: unknown },
        prevSinons?: {[name: string]: SinonSpy | SinonStub | Rewire} 
    ): SinonStub {
    if ( setStub ) {
        switch ( setStub.type ) {
            case SetStubType.None:
                break;
            case SetStubType.Fake:
                stub.callsFake(setStub.value as anyFunction)
                break;
            case SetStubType.Return:
                stub.returns( setStub.value )
                break;
            case SetStubType.Resolve:
                stub.resolves( setStub.value )
                break;
            case SetStubType.Reject:
                stub.rejects(setStub.value )
                break
            case SetStubType.Access:
                if ( setStub.value['getter'] ) {
                    if ( isFunction(setStub.value['getter']) ) {
                        stub.get(setStub.value['getter'])
                    } else {
                        stub.get(()=>setStub.value['getter'])
                    }
                }
                if ( setStub.value['setter'] ) {
                    stub.set(setStub.value['setter'])
                }
                break
            case SetStubType.Construct:
                // create an object to return
                const rv: {[name: string]: SinonStub} = {}
                for (const name in setStub.value as Record<string,unknown>) {
                    rv[name] = prevSinons[setStub.value[name]] as SinonStub
                }
                // the construct stub shall return the object with the other stubs
                stub.returns( rv )
                break;
        }
    }
    return stub
}

function createSpyOrStubSinon(sinonInfo: SinonInfo, 
                                  prevSinons?: {[name: string]: SinonSpy | SinonStub | Rewire}): SinonSpy | SinonStub | Rewire {
    if ( sinonInfo.kind !== SinonKind.Spy && sinonInfo.kind !== SinonKind.Stub ) return null
    let rewire: Rewire
    let target: targetType
    if ( typeof sinonInfo.target === "string") {
        // if 'sinonInfo.target' is a string, it is the name of the library of the target to spy/stub
        // get the libraray itself, and the 'rewire' object to access the libraray
        rewire = getLibRewire(sinonInfo.target, sinonInfo.caller)
        target = rewire.lib()
    } else {
        // 'sinonInfo.target' is the 'target' object with the method to spy/stub
        // in this case 'rewire' is not defined
        target = sinonInfo.target
    }
    let targetMethodName = sinonInfo.method
    if ( target && !targetMethodName ) {
        // method name is not specified, maybe we have aggregation method
        if ( target['__org_func__'] ) {
            targetMethodName = '__org_func__'
        } else {
            // no aggregation, but maybe subbing/spying the deafult method is good enough
            if ( target['default'] ) {
                targetMethodName = 'default'
            }
        }
    }
    // create a spy/stub without puting it on exting object
    function emptySinon(orgMethod?: sinonMethod): SinonSpy | SinonStub {

        if ( sinonInfo.kind == SinonKind.Spy ) {
            if ( orgMethod ) {
                // creting a spy that execute an exting method (but does not replace it)
                return sinonSpy(orgMethod)
            }
            // creating a spy that does nothing
            return sinonSpy()
        }
        if ( sinonInfo.kind == SinonKind.Stub ) {
            // creting a stub and setting its action as specify the 'sinonInfo.setStub'
            // the stub is returned, but is not connected to an object
            return setStub(sinonStub(), sinonInfo.setStub, prevSinons)
        }
    }
    // creting a spy/stub that is replacing an exting method on a target object
    // target: the target object the method exists on
    // method: the name of the method to spy/stub on 'target' object
    function bindSinon(target: targetType, method: string): SinonSpy | SinonStub {
        let sinon: SinonSpy | SinonStub
        if ( sinonInfo.kind == SinonKind.Spy ) {
            // creating a spy on the 'method' that is on 'target'
            sinon =  sinonSpy(target, method as never)
        }
        if ( sinonInfo.kind == SinonKind.Stub ) {
            // creating a stub on the 'method' that is on 'target' and setting its action 
            // as specfiied in 'sinonInfo.setStub'
            sinon = setStub(sinonStub(target, method as never), sinonInfo.setStub, prevSinons)
        }
        if ( sinonInfo.setStub && sinonInfo.setStub.type === SetStubType.Access ) {
            // when using the access stub, we don't want to replace it with is current value
            return sinon
        }
        // make sure the sinon is to the target object
        const restore  = setProperty(target as never, method, sinon)
        if ( restore ) {
            const _restore = sinon.restore
            sinon.restore = (): void => {
                _restore()
                restore()
            }
        }
        return sinon
    }
    // rewired: whether the spy/stub method need to be set back using rewire object
    const rewired = rewire && rewire.isRewired()
// Temp code
    const sinonInfo1: SinonInfo = {...sinonInfo}
    sinonInfo1.target = target
    sinonInfo1.method = targetMethodName
    if ( target && typeof sinonInfo1.target !== "string" ) {
        sinonInfo1.target = `[${typeof sinonInfo1.target}]`
    }
    delete sinonInfo1.caller
    delete sinonInfo1.context
    sinonInfo1.kind = ((sinonInfo.kind === SinonKind.Spy)?"Spy":(sinonInfo.kind === SinonKind.Stub)?"Stub":"???") as never
    sinonInfo1['rewired'] = rewired
// Temp code
    if ( !rewired ) {
        // we don't need to use 'rewire' to set the stub/spy to the 'target'
        if ( !target && !targetMethodName ) {
            // no 'target' and no 'targetMethodName' just return an empty spy/stub
            return emptySinon()
        }
        if ( target && targetMethodName ) {
            // we have a target object and a name of a method
            if ( target[targetMethodName] ) {
                // the method exists on the target - create sinon as bining
                return bindSinon(target, targetMethodName)
            }
            if ( sinonInfo.kind == SinonKind.Stub && targetMethodName === 'super' ) {
                // incase the method name is 'super' we need to stub the prototype
                const stub = sinonStub()
                const prototype = Object.getPrototypeOf(target)
                Object.setPrototypeOf(sinonInfo.target, stub)
                const restore = stub.restore
                stub.restore = function(): void {
                    Object.setPrototypeOf(sinonInfo.target, prototype)
                    if ( restore ) restore()
                    stub.restore = restore
                }
                return setStub(stub, sinonInfo.setStub, prevSinons)
            }
            // the target method does not exist, create stub instead of it
            const sinon = emptySinon()
            target[targetMethodName] = sinon
            const restore = sinon.restore
            sinon.restore = function () {
                delete target[targetMethodName]
                if (restore)
                    restore()
                sinon.restore = restore
            }
            return sinon
        }
        // there is target or method name name but not both, not supported
        return undefined //not supported sinon
    }
    // the libraray is rewired (has get/set)
    if ( !sinonInfo.memberMethod ) {
        // not having 'memberMethod' means we need to spy/stub the method itself
        // orgMethod2: the method of the libraray before spying/stubbing
        const orgMethod2: sinonMethod = rewire.get(targetMethodName)
        if ( orgMethod2 ) {
            // the method to spy/stub exists in the libraray
            // orgMethod2: the method of the export object of the libraray (usally the same as orgMethod2)
            const orgMethod1: sinonMethod = target[targetMethodName]
            // create a spy/stub offline
            const sinon = emptySinon(orgMethod2)

            // save the spy/stub in the libraray
            rewire.set(targetMethodName, sinon)
            // if the above same did not change the exported value, change it too
            if ( orgMethod1 && target[targetMethodName] !== sinon ) {
                target[targetMethodName] = sinon
            }

            // set retore method:
            const restore = sinon.restore
            sinon.restore = function(): void {
                // save the original method in the library
                rewire.set(targetMethodName, orgMethod2)
                // restore the export value if need to
                if ( target[targetMethodName] !== orgMethod1 ) {
                    target[targetMethodName] = orgMethod1
                }
                sinon.restore = restore
                if ( restore ) restore()
            }
            return sinon 
        } 
        // trying to spy/stub a method that does not exist on the libraray
        return undefined //not supported sinon
    }
    // need to spy/stub a class method
    // class2stub: the class where the 'memberMethod' to spy/stub exists on
    const class2stub: sinonMethod = rewire.get(targetMethodName)
    if ( class2stub ) {
        const prototype = class2stub.prototype
        if ( prototype ) {
            if ( prototype.hasOwnProperty(sinonInfo.memberMethod) ) {
                return bindSinon( prototype, sinonInfo.memberMethod )
            } else { 
                // the class proeprty does not have the method member defined
                if ( sinonInfo.memberMethod === 'super') {
                    // stubbing the prototype
                    const prototype = Object.getPrototypeOf(class2stub)
                    const sinon = emptySinon(prototype)
                    Object.setPrototypeOf(class2stub, sinon)
                    const restore = sinon.restore
                    sinon.restore = function() {
                        Object.setPrototypeOf(class2stub, prototype)
                        sinon.restore = restore
                        if ( restore ) restore()
                    }
                    return sinon
                }
                // creating a stub method on the prototype
                let sinon: SinonSpy | SinonStub
                let restore: () => void
                if ( sinonInfo.setStub && sinonInfo.setStub.type === SetStubType.Access ) {
                    Object.defineProperty(prototype, sinonInfo.memberMethod, { get: () => null })
                    sinon = bindSinon(prototype,sinonInfo.memberMethod)
                    restore = () => { delete prototype[sinonInfo.memberMethod]}
                } else {
                    sinon = emptySinon()
                    restore =  setProperty(prototype,sinonInfo.memberMethod, sinon)
                }
                const _resotre = sinon.restore
                sinon.restore = () => {
                    restore && restore()
                    _resotre && _resotre()
                }
                return sinon
            }
        } else {
            // The class does not have property
            console.log('############ not supported 2')
            return undefined //not supported sinon
        }
    } else {
        // the class to stub does not exist    
        console.log('############ not supported 3')
        return undefined //not supported sinon
    }
}

export function createSinon(sinonInfo: SinonInfo, 
                                  prevSinons?: {[name: string]: SinonSpy | SinonStub | Rewire}): SinonSpy | SinonStub | Rewire {
    if ( !sinonInfo ) {
        return null
    }
    const sinon1 = createSpyOrStubSinon(sinonInfo, prevSinons)
    if ( sinon1 === undefined) return null
    if ( sinon1 ) return sinon1
    let rewire: Rewire
    if ( typeof sinonInfo.target === "string") {
        rewire = getLibRewire(sinonInfo.target, sinonInfo.caller)
    }
    switch ( sinonInfo.kind ) {
        case SinonKind.Spy:
        case SinonKind.Stub: 
            throw new Error("should handle Spy/Stub before this")
        case SinonKind.Rewire:
        case SinonKind.RewireReload:
            if (rewire) {
                const reload = sinonInfo.kind == SinonKind.RewireReload
                if ( reload ) {
                    const reloadrewire = reloadLibRewire(sinonInfo.target as string, sinonInfo.caller)
                    return reloadrewire
                }
                return rewire
            }
            return null
        case SinonKind.Import:
            if (rewire) {
                return rewire.get(sinonInfo.method)
            }
            return null
        case SinonKind.Timers:
            const fakeTimers: SinonFakeTimers = useFakeTimers(sinonInfo.timersConfig) as unknown as SinonFakeTimers
            const tick: (ms: number | string) => number = fakeTimers.tick
            fakeTimers.atick = (ms: number | string): Promise<number> => {
                return Promise.resolve(tick(ms))
            }
            return fakeTimers as never

    }
}
