import testSuite from './testSuite'
import { createSandbox } from 'sinon'
import { SinonInfo, ControlMethods, ItInfo, DescribeInfo, SinonKind, CaseInfo, valFunction } from './testInfo'
import { createSinon } from './sinons'
import { SinonSpy, SinonStub, Rewire } from '.'

export type anyFunction = (...args: unknown[]) => unknown // eslint-disable-line @typescript-eslint/ban-types
type constructorType = anyFunction

let isJest = false
export function setJest(): void { isJest = true }

function keysof(obj: unknown): string[] {
    if ( !obj ) return []
    return Object.keys(obj)
}

export type targetType = unknown
abstract class ExecutableBase {
    abstract execute(): Promise<void> | void

    protected executeAsync(): Promise<void> {
        const rv = this.execute()
        if ( rv === undefined ) {
            // method was aynced, resove the promise
            return new  Promise<void>((resolve)=>resolve())
        }
        return rv as Promise<void>
    }
}

const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg
const ARGUMENT_NAMES = /([^\s,]+)/g
function getParamNames(func: anyFunction): string[] {
    const fnStr = func.toString().replace(STRIP_COMMENTS, '');
    let result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
    if(result === null)
        result = [];
    return result;
}

class TestStep extends ExecutableBase {
    private useDone: boolean
    private donePromise: Promise<void>
    private doneResolve: () => void
    private arguments: unknown[]

    public get UseDone(): boolean {
        return this.useDone
    }

    private doneReset(): void {
        this.donePromise = new Promise<void>((resolve)=>{
            this.doneResolve = resolve
        })
    }

    constructor(private target: targetType, private method: anyFunction, private sinons: {[parameterIndex: number]: SinonInfo}) {
        super()
        // if there is a first argumet and it is not a spy, it is the done
        this.useDone = method.length > 0 && sinons[0] === undefined
        this.arguments = []
        if ( this.useDone ) this.arguments.push(()=>this.doneResolve())
        for ( const parameterIndex of keysof(this.sinons) ) {
            const index = Number(parameterIndex)
            while ( this.arguments.length < index ) {
                this.arguments.push(null)
            }
        }
    }

    private getArguments(paramNames: string[]): unknown[] {
        const prevSinons: {[name: string]: SinonSpy | SinonStub | Rewire} = {}
        for ( const parameterIndex of keysof(this.sinons)) {
            const index = Number(parameterIndex)
            const sinonInfo = this.sinons[parameterIndex]
            const sinon = createSinon(sinonInfo, prevSinons)
            prevSinons[paramNames[index]] = sinon
            this.arguments[index] = sinon
        }
        return this.arguments
    }

    private cleanup(): void {
        for ( const parameterIndex of keysof(this.sinons)) {
            const index = Number(parameterIndex)
            if ( this.arguments[index]['restore'] ) this.arguments[index]['restore']()
            this.arguments[index] = null
        }
        if (this.useDone) {
            this.arguments[0] = null
        }
    }

    async execute(): Promise<void> {
        if (this.useDone) this.doneReset()
        const rv = this.method.apply(this.target, this.getArguments(getParamNames(this.method)))
        if ( this.useDone ) {
            await this.donePromise
        } else if ( rv !== undefined ) {
            await rv
        }

        this.cleanup()
    }
}

class TestIt extends ExecutableBase {
    constructor(private name: string, private inner: TestStep, private _pending: boolean = false) {
        super()
        this.update()
    }

    get pending(): boolean {
        return this._pending        
    }
    set pending(value: boolean) {
        this._pending = value
        this.update()
    }

    executePending(): void {
        testSuite.it(this.name)
    }

    executeJestPending(): void {
        testSuite.it['skip'](this.name, ()=>{/*skip*/})
    }

    executeRegular(): void {
        testSuite.it(this.name, ()=>this.inner.execute())
    }


    private update(): void {
        if ( this.pending ) {
            if ( isJest ) {
                this.execute = this.executeJestPending
            } else {
                this.execute = this.executePending
            }
        } else {
            this.execute = this.executeRegular
        }
    }

    execute(): void {
        // placeholder
    }
}

async function executeMethod(method: valFunction, target: targetType): Promise<unknown> {
    const result = method.apply(target)
    if ( result && result.then ) {
        return await result
    } else {
        return result
    }
}

class TestBefore extends ExecutableBase {
    constructor( private beforeInner: valFunction[], private beforeLast: valFunction, private target: targetType ) {
        super()
    }

    execute(): void {
        testSuite.before( async () => {
            if ( this.beforeInner ) {
                for ( const func of this.beforeInner ) {
                    await executeMethod(func, this.target)
                }
            }
            if ( this.beforeLast ) {
                await executeMethod(this.beforeLast, this.target)
            }
        })
    }

}

class TestAfter extends ExecutableBase {
    constructor( private afterFirst: valFunction , private afterInner: valFunction[], private target: targetType ) {
        super()
    }

    execute(): void {
        testSuite.after( async () => {
            if ( this.afterFirst ) {
                await executeMethod(this.afterFirst, this.target)
            }
            if ( this.afterInner ) {
                for ( const func of this.afterInner ) {
                    await executeMethod(func, this.target)
                }
            }
        })
    }
}

class TestBeforeEach extends ExecutableBase {
    constructor( private beforeEachInner: valFunction[], private beforeEachLast: valFunction, private target: targetType ) {
        super()
    }

    execute(): void {
        testSuite.beforeEach( async () => {
            if ( this.beforeEachInner ) {
                for ( const func of this.beforeEachInner ) {
                    await executeMethod(func, this.target)
                }
            }
            if ( this.beforeEachLast ) {
                await executeMethod(this.beforeEachLast, this.target)
            }
        })
    }
}

class TestAfterEach extends ExecutableBase {
    constructor( private afterEachFirst: valFunction , private afterEachInner: valFunction[], private target: targetType ) {
        super()
    }

    execute(): void {
        testSuite.afterEach( async () => {
            if ( this.afterEachFirst ) {
                await executeMethod(this.afterEachFirst, this.target)
            }
            if ( this.afterEachInner ) {
                for ( const func of this.afterEachInner ) {
                    await executeMethod(func, this.target)
                }
            }
        })
    }
}

export class TestContext extends ExecutableBase {
    constructor(private name: string, private inner: ExecutableBase) {
        super()
    }

    execute(): void {
        testSuite.describe(this.name, () => this.inner.execute())
    }
}

export class Sequensal extends ExecutableBase {
    private steps: ExecutableBase[] = []
    
    push(step: ExecutableBase): void {
        this.steps.push(step)
    }

    get length(): number {
        return this.steps.length
    }

    execute(): void {
        if ( !this.steps ) return
        this.steps.forEach( (step) => step.execute() )
    }

    addControlMethods(methods: ControlMethods, instance: targetType): void {
        if ( methods.beforeInner || methods.beforeLast ) {
            this.push(new TestBefore(methods.beforeInner, methods.beforeLast, instance))
        }
        if ( methods.afterFirst || methods.afterInner ) {
            this.push(new TestAfter(methods.afterFirst, methods.afterInner, instance))
        }
        if ( methods.beforeEachInner || methods.beforeEachLast ) {
            this.push(new TestBeforeEach(methods.beforeEachInner, methods.beforeEachLast, instance))
        }
        if ( methods.afterEachFirst || methods.afterEachInner ) {
            this.push(new TestAfterEach(methods.afterEachFirst, methods.afterEachInner, instance))
        }
    }

    addItsAndCases(itsAndCases: {[text: string]: ItInfo | CaseInfo}, instance: targetType): void {
        for (const name of keysof(itsAndCases)) {
            const it = itsAndCases[name] as ItInfo
            if ( it && it.method ) {
                this.push(new TestIt(it.itText, new TestStep(instance, it.method, it.sinons), it.pending))
                continue
            }
            // check if it was a case
            const tcase = itsAndCases[name] as CaseInfo
            if ( tcase && tcase.its ) {
                const steps = new Sequensal()
                steps.addControlMethods({
                    beforeInner: [function(): void {
                        let maxInstanceIndex = 0
                        for ( const it of this.its ) {
                            if ( it.instanceIndex > maxInstanceIndex ) maxInstanceIndex = it.instanceIndex
                        }
                        this.instances = []
                        for ( let i=0; i<=maxInstanceIndex; i++ ) {
                            this.instances.push(this.stepsFactory())
                        }
                    }]
                }, tcase)
                for ( const it of tcase.its ) {
                    steps.push(new TestIt(it.itText, new TestStep(tcase, it.method, it.sinons), it.pending))
                }
                this.push(new TestContext(tcase.caseText, steps))
                continue
            }
        }
    }
    
}

export class TestDescribe extends ExecutableBase {
    private mainExecution: Sequensal
    private instance: unknown

    execute(): void {
        testSuite.describe(this.name, ()=> this.mainExecution.execute())
    }

    constructor(private name: string, private info: DescribeInfo, private constructorFunc: constructorType) {
        super()

        this.defineGlobalControlMethods()
        this.createInstance()
        this.createSandboxes()
        this.createMainSeauence()
        this.createSinonsMembers()
        this.defineMainControlMethodsItsAndCases()
        this.defineContextControlMethodsItsAndCases()
    }

    private defineGlobalControlMethods() {
        // look for after and before methods:
        const beforeMethod: valFunction = this.constructorFunc.prototype.before
        const afterMethod: valFunction = this.constructorFunc.prototype.after
        const beforeEachMethod: valFunction = this.constructorFunc.prototype.beforeEach
        const afterEachMethod: valFunction = this.constructorFunc.prototype.afterEach
        // define execution of contexts
        if ( beforeMethod && !this.info.uncontext.contextControlMethods.beforeLast ) {
            this.info.uncontext.contextControlMethods.beforeLast = beforeMethod
        }
        if ( afterMethod && !this.info.uncontext.contextControlMethods.afterFirst) {
            this.info.uncontext.contextControlMethods.afterFirst = afterMethod
        }
        if ( beforeEachMethod && !this.info.uncontext.contextControlMethods.beforeEachLast) {
            this.info.uncontext.contextControlMethods.beforeEachLast = beforeEachMethod
        }
        if ( afterEachMethod && !this.info.uncontext.contextControlMethods.afterEachFirst) {
            this.info.uncontext.contextControlMethods.afterEachFirst = afterEachMethod
        }

    }

    private createInstance() {
        this.instance = Reflect.construct(this.constructorFunc, [])
    }

    private createSandboxes() {
        for (let i = 1; i<this.info.sandboxes.length; i++ ) {
            this.instance[this.info.sandboxes[i]] = createSandbox()
        }
    }

    private createMainSeauence() {
        this.mainExecution = new Sequensal()
    }
    private defineMainControlMethodsItsAndCases() {
        // update main control methods
        this.mainExecution.addControlMethods(this.info.uncontext.contextControlMethods, this.instance)
        // define execution of uncontexts
        this.mainExecution.addItsAndCases(this.info.uncontext.itsAndCases, this.instance)
    }

    private defineContextControlMethodsItsAndCases() {
        // go over contexts
        for ( const contextName of keysof(this.info.contexts) ) {
            const context = this.info.contexts[contextName]
            const contextSequence = new Sequensal()
            contextSequence.addControlMethods(context.contextControlMethods, this.instance)
            contextSequence.addItsAndCases(context.itsAndCases, this.instance)
            if ( contextSequence.length > 0 ) {
                this.mainExecution.push(new TestContext(context.contextText, contextSequence))
            }
        }
    }

    private createSinonsMembers() {

        const info = this.info
        // create sinons members
        if ( keysof(info.sinons).length>0 ) {
            const {initMethods, rapupMethods} = this.createInitAndRapupMethods(info)
            this.addInitMethodIntoBeforeEachControlMethods(info, initMethods)
            this.addRapupMethodsIntoAfterEachControlMethods(info, rapupMethods)
        }

    }

    private createInitAndRapupMethods(info: DescribeInfo): {
        initMethods: MethodsByContext,
        rapupMethods: MethodsByContext
    } {
        const initMethods: MethodsByContext = {}
        const rapupMethods: MethodsByContext = {}
        for ( const sinonName of keysof(info.sinons) ) {
            const sinonContext: string = (info.sinons[sinonName].context)?info.sinons[sinonName].context:""
            if ( ! initMethods[sinonContext ]) {
                initMethods[sinonContext] = []
                initMethods[sinonContext].push ( {
                    global: info.sinons[sinonName].global,
                    func: function() {
                        initMethods[sinonContext]['_sinons'] = {}
                    }
                })
            }
            if ( ! rapupMethods[sinonContext]) {
                rapupMethods[sinonContext] = []
            }
            initMethods[sinonContext].push( {
                global: info.sinons[sinonName].global,
                func: function() {
                    this[sinonName] = createSinon(info.sinons[sinonName], initMethods[sinonContext]['_sinons']);
                    initMethods[sinonContext]['_sinons'] = initMethods[sinonContext]['_sinons'] || {}
                    initMethods[sinonContext]['_sinons'][sinonName] = this[sinonName]
                    if ( info.sinons[sinonName].kind === SinonKind.Rewire ) {
                        if ( info.sinons[sinonName].global ) {
                            info.globalRewires.push(this[sinonName])    
                        } else {
                            info.localRewires.push(this[sinonName])
                        }
                    }
                }
            })
            rapupMethods[sinonContext].push( {
                global: info.sinons[sinonName].global,
                func: function() {
                    if ( this[sinonName] && this[sinonName].restore ) {
                        this[sinonName].restore()
                    }
                    delete this[sinonName]
                }
            })
        }
        return {initMethods, rapupMethods}
    }

    private addInitMethodIntoBeforeEachControlMethods(info: DescribeInfo, initMethods: MethodsByContext)  {
        for (const sinonContext of keysof(initMethods) ) {
            const describeControlMethods = info.getContext(sinonContext).contextControlMethods
            for ( const {global,func} of initMethods[sinonContext] ) {
                if ( global ) {
                    describeControlMethods.beforeInner = describeControlMethods.beforeInner || []
                    describeControlMethods.beforeInner.push(func)
                } else {
                    describeControlMethods.beforeEachInner = describeControlMethods.beforeEachInner || []
                    describeControlMethods.beforeEachInner.push(func)
                }
            }
        }
    }

    private addRapupMethodsIntoAfterEachControlMethods(info: DescribeInfo, rapupMethods: MethodsByContext) {
        // add code to resotre everything in the afterEach/after methods:
        for (let i= keysof(rapupMethods).length-1; i>=0; i--) {
            const sinonContext = keysof(rapupMethods)[i]
            const describeControlMethods = info.getContext(sinonContext).contextControlMethods
            const contextRapupMethods = rapupMethods[sinonContext]
            for ( const {global,func} of contextRapupMethods ) {
                if ( global) {
                    describeControlMethods.afterInner = describeControlMethods.afterInner || []
                    describeControlMethods.afterInner.push(func)
                } else {
                    describeControlMethods.afterEachInner = describeControlMethods.afterEachInner || []
                    describeControlMethods.afterEachInner.push(func)
                }
            }
            describeControlMethods.afterEachInner = describeControlMethods.afterEachInner || []
            describeControlMethods.afterEachInner.push( function() {
                // restore rewires
                for ( const rewire of info.localRewires ) {
                    rewire.restore()
                }
                info.localRewires = []
            })
            describeControlMethods.afterInner = describeControlMethods.afterInner || []
            describeControlMethods.afterInner.push( function() {
                // restore rewires
                for ( const rewire of info.globalRewires ) {
                    rewire.restore()
                }
                info.globalRewires = []
            })
        }
    }

}

interface MethodsByContext {
    [contextName: string]: {global: boolean, func: valFunction}[]   
}