import { targetType, anyFunction } from "./executables"
import { getInfo, CaseInfo, extraInfo, commentInfo } from "./testInfo"

export type factoryMethod = () => unknown

function createFactory( constructorMethod, args?: unknown[] ): factoryMethod {
    if ( !args ) args = []
    switch ( args.length ) {
        case 0:
            return (): unknown => new constructorMethod()
        case 1:
            return (): unknown => new constructorMethod(args[0])
        case 2:
            return (): unknown => new constructorMethod(args[0], args[1])
        case 3:
            return (): unknown => new constructorMethod(args[0], args[1], args[2])
        case 4:
            return (): unknown => new constructorMethod(args[0], args[1], args[2], args[3])
        case 5:
        default:
            return (): unknown => new constructorMethod(args[0], args[1], args[2], args[3], args[4])
            
    }
}


interface StepCall {
    methodName: string
    args: unknown[]
    instanceIndex: number
}

class StepsCalls {
    public __lastCall: StepCall

    public addMethod(name: string): void {
        this[name] = function(...args): void {
            this.__lastCall = {
                methodName: name,
                args
            }
        }
    }

    public append(calls: StepsCalls): void {
        for ( const name of Object.keys(calls) ) {
            if ( !this[name] ) {
                this[name] = calls[name]
            }
        }
    }
}

// The testStep descorator is defined on a method in a (test-steps) class.
// The class has a metadata named "soda-steps" of type StepsCalls that holds information about
//  all the test-step methods. This decorator adds the method name to the "soda-steps" (create it first if does not exist)
export function testStep(): (target: targetType, propertyKey: string) => void {
    return (target: targetType, propertyKey: string): void => {
        if ( !Reflect.hasMetadata("soda-steps", target) ) {
            Reflect.defineMetadata("soda-steps", new StepsCalls(), target)
        }
        const steps: StepsCalls = Reflect.getMetadata("soda-steps", target)
        steps.addMethod(propertyKey)
    }
}

type anyClass = Function // eslint-disable-line @typescript-eslint/ban-types

// this methods returns a "StepsClass" instances that holds information about all the steps in that target class type
// note taht targetType might defined from a nother class, so it should holds steps defines in base class too.
function getSodaSteps(target: targetType): StepsCalls {
    const steps = new StepsCalls()
    if (!target) return steps
    const parent = Reflect.getPrototypeOf(target as never)
    steps.append(getSodaSteps(parent))
    if ( Reflect.hasMetadata("soda-steps", target)) {
        steps.append( Reflect.getMetadata("soda-steps", target) as StepsCalls )
    }

    return steps
}

// testCase is a decorator defined on a method that defines calls to test-steps
// text - the name of the test-case
// stepsConstructor - the class that holds the test-steps to be used
// constructorArgs - optionaly arguments to the constractor for the class of the test-stpes
export function testCase(text: string, stepsConstructor: anyClass, constructorArgs?: unknown[], extraData?: extraInfo): MethodDecorator {
    return (target: targetType, propertyKey: string, descriptor: PropertyDescriptor): void => {
        // testStepsTarget is the prototype of the steps-class
        const testStepsTarget = stepsConstructor.prototype
        // validate the steps-class as an "soda-steps" metadata
        if ( !Reflect.hasMetadata("soda-steps", testStepsTarget) ) {
            console.error(`cannot create case ${text}`)
            return
        }
        // create the case info in this class info
        const tcase = getInfo(target).getCase(propertyKey, text, createFactory(stepsConstructor, constructorArgs))
        if ( extraData) {
            tcase.extraData = extraData
        }
        // get lists of the possible steps from steps-class
        const steps = getSodaSteps(testStepsTarget)
        // 
        steps.__lastCall = undefined
        let lastStep: string = undefined
        let lastInstanceIndex: number = undefined
        let lastExtraData: extraInfo = undefined
        let comments: commentInfo[] = []
        let lastComments: commentInfo[] = undefined
        const addTestStep = (): void => {
            if ( steps.__lastCall ) {
                const text = lastStep
                const instanceIndex = lastInstanceIndex
                const methodName = steps.__lastCall.methodName
                const args = steps.__lastCall.args
                tcase.its.push({
                    itText: text,
                    extraData: lastExtraData,
                    instanceIndex: lastInstanceIndex,
                    comments: lastComments,
                    pending: false,
                    sinons: null,
                    method: function(this: CaseInfo): void | Promise<void> {
                        const method: anyFunction = this.instances[instanceIndex][methodName]
                        return method.apply(this.instances[instanceIndex], args)
                    }
                })
            }
        }
        const stepMethod = (text: string, instanceIndex?: number, extraData?: extraInfo) => {
            if ( !instanceIndex ) instanceIndex = 0
            addTestStep()
            lastStep = text
            lastExtraData = extraData
            lastComments = comments
            comments = []
            lastInstanceIndex = instanceIndex
            return steps
        }
        stepMethod.comment = (text: string, extraData?: extraInfo) => {
            const comment: commentInfo = {
                commentText: text,
                extraData
            }
            comments.push(comment)
        }
        descriptor.value(stepMethod)
        addTestStep()
    }
}

export type stepMethod<TSC> = {
    (text: string, instanceIndex?: number, extraData?: extraInfo): TSC
    comment: (text: string, extraData?: extraInfo) => void
}
