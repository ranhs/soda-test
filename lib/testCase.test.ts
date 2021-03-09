import { expect, describe, context, it, TR, PTR, testStep, testCase, stepMethod } from '.'
import { sleep } from './timers'

let stepsLog: string[]

class SampleTestStepsTest {

    @testStep()
    step1(): TR {
        expect(1).to.equal(1)
        console.log('step1')
        stepsLog.push('step1')
    }

    @testStep()
    async step2(name: string): PTR {
        expect(2).to.equal(2)
        console.log('step2', name)
        await sleep(100)
        stepsLog.push(`step2 ${name}`)
    }
}

@describe('with test cases')
class SampleWithTestCasesTest {

@context('Before the test Case')

    @it()
    firstStep(): TR {
        stepsLog = []
    }

@context('The test Case')

    @testCase("sample case", SampleTestStepsTest)
    case1(step: stepMethod<SampleTestStepsTest>): void {
        step("step1").step1()
        step("step2").step2("AAA")
        step("step2").step2("BBB")
        step("step1-finish").step1()
    }

@context('After the test Case')


    @it()
    lastStep(): TR {
        expect(stepsLog).to.deep.equal([
            'step1',
            'step2 AAA',
            'step2 BBB',
            'step1'
        ])
    }
}