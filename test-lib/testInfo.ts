import { SinonFakeTimersConfig } from 'sinon'
import { targetType, anyFunction } from './executables'
import { factoryMethod } from './testCase'

export type valFunction = () => unknown | Promise<unknown>
export type extraInfo = { [key: string]: string | number}

export interface ControlMethods {
    beforeInner?: valFunction[]
    beforeLast?: valFunction
    afterFirst?: valFunction
    afterInner?: valFunction[]
    beforeEachInner?: valFunction[]
    beforeEachLast?: valFunction
    afterEachFirst?: valFunction
    afterEachInner?: valFunction[]
}


export enum SinonKind {
    Spy,
    Stub,
    Rewire,
    RewireReload,
    Import,
    Timers
}

export enum SetStubType {
    None,
    Fake,
    Return,
    Resolve,
    Reject,
    Access,
    Construct
}

export interface SinonInfo {
    caller: string,
    target: targetType | string,
    method?: string, // might be a class name
    memberMethod?: string, // incase of class, this is the name of the method in the class
    kind: SinonKind,
    setStub?: { type: SetStubType, value: unknown },
    timersConfig?: number | Date | Partial<SinonFakeTimersConfig>
    context: string
    global?: boolean
}

export class commentInfo {
    commentText: string
    extraData?: extraInfo
}

export class ItInfo {
    comments?: commentInfo[]
    itText: string
    instanceIndex?: number
    pending: boolean
    extraData?: extraInfo
    sinons: {[paramterIndex: number]: SinonInfo} = {}
    method: anyFunction
}

export class CaseInfo {
    constructor(text: string, public stepsFactory: factoryMethod) {
        this.caseText = text
    }
    caseText: string
    extraData?: extraInfo
    its: ItInfo[] = []
    instances: unknown[] = []
}

export class ContextInfo {
    constructor(text: string) {
        this.contextText = text
    }
    contextText: string
    extraData?: extraInfo
    contextControlMethods: ControlMethods = {}

    itsAndCases: {[text: string]: ItInfo | CaseInfo} = {}
}

export class DescribeInfo {
    describeText: string
    extraData?: extraInfo

    currentContext: string
    contexts: {[text: string]: ContextInfo} = {}
    methodsContexts: {[methodName: string]: string} ={}

    uncontext: ContextInfo = new ContextInfo('')

    sandboxes: string[] = []

    sinons: {[memberName: string]: SinonInfo} = {}
    lastSinon: {name: string, sinon: SinonInfo} = null
    lastControlMethod: {name: string, context: string, controlName: string} = null

    getContext(contextName: string): ContextInfo {
        if ( contextName === '' ) return this.uncontext
        let context: ContextInfo = this.contexts[contextName]
        if ( !context ) {
            context = new ContextInfo(contextName)
            this.contexts[contextName] = context
        }
        return context
    }

    setMethodContext(methodName: string, contextName = '', contextExtraData?: extraInfo): void {

        if ( this.lastControlMethod && this.lastControlMethod.name === methodName ) {
            const prevContextMethods = this.getContext(this.lastControlMethod.context).contextControlMethods
            const func = prevContextMethods[this.lastControlMethod.controlName]
            prevContextMethods[this.lastControlMethod.controlName] = prevContextMethods[this.lastControlMethod.controlName+'.bak']
            delete prevContextMethods[this.lastControlMethod.controlName+'.bak']
            const context = this.getContext(contextName)
            context.contextControlMethods[this.lastControlMethod.controlName] = func
            if (contextExtraData) context.extraData = contextExtraData
            this.methodsContexts[methodName] = contextName
            this.currentContext = contextName
            return
        }

        const prevContext: string = this.methodsContexts[methodName]
        let it: ItInfo
        if ( prevContext !== undefined ) {
            if ( prevContext === contextName ) return
            const context = this.getContext(prevContext)
            it = context.itsAndCases[methodName] as ItInfo
            if ( !it ) return
            delete context.itsAndCases[methodName]
        } else {
            it = new ItInfo()
        }

        this.currentContext = contextName
        this.methodsContexts[methodName] = contextName
        const context = this.getContext(contextName)
        context.itsAndCases[methodName] = it
    }

    setMemberContext(memberName: string, contextName = '', extraData: extraInfo): void {
        if ( this.lastSinon && this.lastSinon.name === memberName ) {
            this.lastSinon.sinon.context = contextName
        }
        this.currentContext = contextName
        if ( extraData ) {
            const context = this.getContext(contextName)
            context.extraData = extraData
        }
    }

    getIt(methodName: string): ItInfo {
        let contextName: string = this.methodsContexts[methodName]
        if (contextName === undefined) {
            contextName=''
            this.methodsContexts[methodName] = contextName
        }
        const context = this.getContext(contextName)
        let it = context.itsAndCases[methodName] as ItInfo
        if ( !it ) {
             it = new ItInfo()
             context.itsAndCases[methodName] = it
        }
        return it
    }

    getCase(methodName: string, text: string, stepsFactory: factoryMethod): CaseInfo {
        let contextName: string = this.methodsContexts[methodName]
        if (contextName === undefined) {
            contextName=''
            this.methodsContexts[methodName] = contextName
        }
        const context = this.getContext(contextName)
        let tcase = context.itsAndCases[methodName] as CaseInfo
        if ( !tcase ) {
             tcase = new CaseInfo(text, stepsFactory)
             context.itsAndCases[methodName] = tcase
        }
        return tcase
    }

    setIt(methodName: string, itText: string, itMethod: anyFunction, extraData?: extraInfo): void {
        const it = this.getIt(methodName)
        it.itText = itText
        it.extraData = extraData
        it.method = itMethod
        if ( this.currentContext ) {
            this.setMethodContext(methodName, this.currentContext)
        }
    }

    setComment(methodName: string, commentText: string, extraData?: extraInfo): void {
        const it = this.getIt(methodName)
        if ( it.comments === undefined ) it.comments = []
        const comment = new commentInfo()
        comment.commentText = commentText
        comment.extraData = extraData
        it.comments.splice(0,0,comment)
    }

    setCase(methodName: string, caseText: string, instanceConstructor: factoryMethod): CaseInfo {
        const tcase = this.getCase(methodName, caseText, instanceConstructor)
        if ( this.currentContext ) {
            this.setMethodContext(methodName, this.currentContext)
        }
        return tcase
    }

    setPending(methodName: string): void {
        const it = this.getIt(methodName)
        it.pending = true
    }

    // add a new sinon as a member property or an argument of it
    // member:
    //  - propertyKey: name of the member
    //  - parameterIndex: undefined
    // argument:
    //  - propertyKey: name of the it function
    //  - parameterIndex: index of the argument in the function
    // both:
    //  - sinon: information of the sinon data
    addSinon(propertyKey: string, parameterIndex: number | undefined, sinon: SinonInfo): void {
        if ( parameterIndex === undefined ) {
            // member decorator
            sinon.context = this.currentContext
            this.sinons[propertyKey] = sinon
            this.lastSinon = {name: propertyKey, sinon}
        } else {
            // parameter decorator
            this.getIt(propertyKey).sinons[parameterIndex] = sinon
        }
    }

    getSinon(propertyKey: string, parameterIndex: number | undefined): SinonInfo {
        if ( parameterIndex === undefined ) {
            // member decorator
            return this.sinons[propertyKey]
        } else {
            // parameter decorator
            const itInfo = this.getIt(propertyKey)
            if ( !itInfo ) return null
            return itInfo.sinons[parameterIndex]
        }
    }
}

export function getInfo(target: targetType): DescribeInfo {
    let info: DescribeInfo

    if ( !Reflect.hasMetadata('soda-test', target) ) {
        info = new DescribeInfo()
        Reflect.defineMetadata('soda-test', info, target)
    } else {
        info = Reflect.getMetadata('soda-test', target)
    }
    return info
}
