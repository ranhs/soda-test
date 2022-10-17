import "reflect-metadata"

import { SinonKind, SetStubType, SinonInfo, getInfo, extraInfo } from "./testInfo"
import { TestDescribe, targetType, anyFunction } from "./executables";
import { getCallerFileName, init as rewireInit, isKarma } from "./rewire"
export { Rewire, createAggregation } from "./rewire"
import { SuperTest, Test } from 'supertest'
import * as chai from "chai"

import * as chaiAsPromised from 'chai-as-promised'
import * as sinonChai from 'sinon-chai'
import { SinonStub as SinonSinonStub, SinonSpy as SinonSinonSpy, SinonFakeTimers as SinonSinonFakeTimers } from 'sinon'
import { FakeTimerInstallOpts } from "@sinonjs/fake-timers"
export { FakeTimerInstallOpts } from '@sinonjs/fake-timers'
import { mapLibraries } from './rewire'
export { mapLibraries } from './rewire'
import { createSinon } from "./sinons";
import testSuite from './testSuite'
import { PlanDescribe } from "./testplan";
import {environment as _env} from './environment'
export const environment = _env
// to make the types of chai-aspromised and sinon-chai loaded
export {} from 'chai-as-promised'
export {} from 'sinon-chai'


let _request: (app)=> SuperTest<Test>
let _angular_core_testing;

try {
    _angular_core_testing = require('@angular/core/testing')
} catch {
    _angular_core_testing  = null
}

export const TestBed = (_angular_core_testing)?_angular_core_testing.TestBed:null

const superLib = 'supertest'
if ( !isKarma ) {
    try {
        _request = require(superLib)
    }
    catch {
        _request = undefined
    }
}

export const request = _request

type constractorType = Function // eslint-disable-line @typescript-eslint/ban-types
type methodDecorator = (target: targetType, propertyKey: string, descriptor?: PropertyDescriptor) => void
type classDecorator = (constructor: constractorType) => void
type argumentDecorator = (target: targetType, propertyKey: string | symbol, parameterIndex?: number) => void
type memberDecorator = (prototype: targetType, propName: string) => void

chai.use(chaiAsPromised as never)
chai.use(sinonChai as never)

rewireInit()

export function context(text = '', extraData?: extraInfo): methodDecorator {
    return (target: targetType, propertyKey: string, descriptor?: PropertyDescriptor): void => {
        if ( descriptor ) {
            getInfo(target).setMethodContext(propertyKey, text, extraData)
        } else {
            getInfo(target).setMemberContext(propertyKey, text, extraData)
        }

    }
}

export function it(text?: string, extraData?: extraInfo): methodDecorator {
    return (target: targetType, propertyKey: string, descriptor: PropertyDescriptor): void => {
        if (!text) {
            text = propertyKey
        }
        getInfo(target).setIt(propertyKey, text, descriptor.value, extraData)
    }
}

export function comment(text: string, extraData?: extraInfo): methodDecorator {
    return (target: targetType, propertyKey: string, ignoreDescriptor: PropertyDescriptor): void => {
        getInfo(target).setComment(propertyKey, text, extraData)
    }
}

export function pending(): methodDecorator {
    return (target: targetType, propertyKey: string, ignoreDescriptor: PropertyDescriptor): void => {
        getInfo(target).setPending(propertyKey)
    }
}

function setControlMethod(target: targetType, propertyKey: string, descriptor: PropertyDescriptor, controlName: string): void {
    const context = getInfo(target).currentContext
    const contextCtrlMethods = getInfo(target).getContext(context).contextControlMethods
    if ( contextCtrlMethods[controlName] ) {
        // save the current control method, in case the override method will change context
        contextCtrlMethods[controlName+'.bak'] = contextCtrlMethods[controlName]
    }
    contextCtrlMethods[controlName] = descriptor.value
    getInfo(target).methodsContexts[propertyKey] = context
    getInfo(target).lastControlMethod = {name: propertyKey, context, controlName}
}

// settomg the control method, while the controlName is given as the this argument
function ctrlMethod(target: targetType, propertyKey: string, descriptor: PropertyDescriptor): void {
    setControlMethod(target, propertyKey, descriptor, this)
}

const beforeMethod: methodDecorator = ctrlMethod.bind("beforeLast")
export function before(): methodDecorator {
    return beforeMethod
}

const afterMethod: methodDecorator = ctrlMethod.bind("afterFirst")
export function after(): methodDecorator {
    return afterMethod
}

const beforeEachMethod: methodDecorator = ctrlMethod.bind("beforeEachLast")
export function beforeEach(): methodDecorator {
    return beforeEachMethod
}

const afterEachMethod: methodDecorator = ctrlMethod.bind("afterEachFirst")
export function afterEach(): methodDecorator {
    return afterEachMethod
}

export function describe(text: string, extraData?: extraInfo): classDecorator {
    return (constructor: constractorType): void => {
        const info = getInfo(constructor.prototype)
        info.describeText = text
        if (extraData) info.extraData = extraData
        const describeBlock = new TestDescribe(text, info, constructor as never)
        if ( environment.PLAN_MODE) {
            PlanDescribe(info)
        } else {
            describeBlock.execute()
        }
    }
}

describe.mapLibraries = mapLibraries

export function global(value = true): argumentDecorator {
    return (target: targetType, propertyKey: string | symbol, parameterIndex?: number): void => {
        const sinon = getInfo(target).getSinon(propertyKey as string, parameterIndex)
        if ( !sinon ) return
        sinon.global = value
    }
}

export function spy(spyTarget: string | targetType, methodName?: string, memberName: string = null): argumentDecorator {
    const caller = getCallerFileName(1)
    return (target: targetType, propertyKey: string | symbol, parameterIndex?: number): void => {
        getInfo(target).addSinon(propertyKey as string, parameterIndex, {
            caller,
            target: spyTarget,
            method: methodName,
            memberMethod: memberName,
            kind: SinonKind.Spy,
            context: null
        })
    }
}

interface StubSetterBase<T> {
    calls: (fakeMethod: anyFunction) => T
    returns: (value: unknown) => T
    resolves: (value?: unknown) => T
    rejects: (err: Error | string) => T
    access: (getter?: (() => unknown) | unknown, setter?: (value: unknown) => void) => T
    construct: (description: {[method: string]: string}) => T
}

export interface StubDecorator {
    (target: targetType, propertyKey: string | symbol, parameterIndex?: number): void
}

export interface StubSetter extends StubSetterBase<StubDecorator>,  StubDecorator{
}

export type StubCreateSetter = StubSetterBase<SinonStub>

export function createStub(stubTarget: string | targetType, methodName: string): StubCreateSetter {
    const caller = getCallerFileName(1)
    const info: SinonInfo = {
        caller,
        target: stubTarget,
        method: methodName,
        kind: SinonKind.Stub,
        context: null
    }

    const sinonStub: SinonStub = createSinon(info) as SinonStub

    return {
        calls: (fakeMethod: (...args: unknown[]) => unknown): SinonStub => {
            sinonStub.callsFake(fakeMethod)
            return sinonStub
        },
        returns: (value?: unknown): SinonStub => {
            sinonStub.returns(value)
            return sinonStub
        },
        resolves: (value: unknown): SinonStub => {
            sinonStub.resolves(value)
            return sinonStub
        },
        rejects: (err: Error | string): SinonStub => {
            sinonStub.throws((typeof err === 'string')?new Error(err):err)
            return sinonStub
        },
        access: (getter?: (() => unknown) | unknown, setter?: (v: unknown) => void ): SinonStub => {
            if ( getter ) {
                if ( typeof getter === 'function' ) {
                    sinonStub.get(getter as () => unknown)
                } else {
                    sinonStub.get(()=>getter)
                }
            }
            if ( setter ) {
                sinonStub.set(setter)
            }
            return sinonStub
        },
        construct: (ignoreDescription: {[method: string]: string}): SinonStub => {
            throw new Error('construct stub are note supported in createStub')
        }   
    }

}

export function stub(stubTarget: string | targetType = null, methodName: string = null, memberName: string = null): StubSetter {
    const caller = getCallerFileName(1)
    const info: SinonInfo = {
        caller,
        target: stubTarget,
        method: methodName,
        memberMethod: memberName,
        kind: SinonKind.Stub,
        context: null
    }
    const result1: StubDecorator = (target: targetType, propertyKey: string | symbol, parameterIndex?: number) => {
        getInfo(target).addSinon(propertyKey as string, parameterIndex, info)
    }
    const result = result1 as StubSetter
    result.calls = (fakeMethod: anyFunction): StubDecorator => {
        info.setStub = {type: SetStubType.Fake, value:fakeMethod}
        return result
    }
    result.returns = (value?: unknown): StubDecorator => {
        info.setStub = {type: SetStubType.Return, value}
        return result
    }
    result.resolves = (value: unknown): StubDecorator => {
        info.setStub = {type: SetStubType.Resolve, value}
        return result
    }
    result.rejects = (err: Error | string): StubDecorator => {
        info.setStub = {type: SetStubType.Reject, value: (typeof err === 'string')?new Error(err):err}
        return result
    }
    result.access = (getter?: (() => unknown) | unknown, setter?: (v: unknown) => void): StubDecorator => {
        info.setStub = {type: SetStubType.Access, value: {getter, setter}}
        return result
    }
    result.construct = (description: {[method: string]: string}): StubDecorator => {
        info.setStub = {type: SetStubType.Construct, value: description}
        return result
    }
    return result
}

export function rewire(libName: string, reload = false): argumentDecorator {
    const caller = getCallerFileName(1)
    return (target: targetType, propertyKey: string | symbol, parameterIndex?: number): void => {
        getInfo(target).addSinon(propertyKey as string, parameterIndex, {
            caller,
            target: libName,
            kind: reload ? SinonKind.RewireReload : SinonKind.Rewire,
            context: null

        })
    }
}

export function importPrivate(libName: string, methodName?: string): argumentDecorator {
    const caller = getCallerFileName(1)
    return (target: targetType, propertyKey: string | symbol, parameterIndex?: number): void => {
        getInfo(target).addSinon(propertyKey as string, parameterIndex, {
            caller,
            target: libName,
            method: (methodName || propertyKey as string),
            kind: SinonKind.Import,
            context: null
        })
    }
}

export function useFakeTimers(config?: number | Date | Partial<FakeTimerInstallOpts>): argumentDecorator {
    const caller = getCallerFileName(1)
    return (target: targetType, propertyKey: string | symbol, parameterIndex?: number): void => {
        getInfo(target).addSinon(propertyKey as string, parameterIndex, {
            caller,
            target: null,
            method: null,
            kind: SinonKind.Timers,
            timersConfig: config,
            context: null
        })
    }

}

export type SinonFakeTimers = SinonSinonFakeTimers & {
    atick(ms: number | string): Promise<number>
}

export let expect = chai.expect

if ( testSuite.expect  ) {
    expect = ((actual: unknown) => {
        testSuite.expect(actual)['toBe'](actual)
        return chai.expect(actual)
    }) as never
    expect.fail = chai.expect.fail
}

export type SinonSpy = SinonSinonSpy<unknown[], {}> // eslint-disable-line @typescript-eslint/ban-types

export interface SinonStub extends SinonSinonStub<unknown[], {}> { // eslint-disable-line @typescript-eslint/ban-types
    callsFake(stubMethod: anyFunction): SinonStub
}

export type SinonSandbox = sinon.SinonSandbox

export function sandbox(): memberDecorator {
    return function (prototype: targetType, propName: string): void {
        getInfo(prototype).sandboxes.push(propName)
    }
}

export type Done = (err?: Error) => void

export type TR = void // the return type of a test step (Test-Result)
export type PTR = Promise<TR> // the return type an async test step (Promise-Test-Result)

export interface CreatableClass<T1 = void, T2 = void, T3 = void> {
    new (Arg1: T1, Arg2: T2, Arg3: T3)
}