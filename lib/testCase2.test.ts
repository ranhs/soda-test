import { expect, describe, context, it, TR, PTR, testStep, testCase, stepMethod } from '.'

class SampleTestSteps2Test {
    constructor(private a: string, private b: number) {
    }

    @testStep()
    stepcompare(a: string, b: number): TR {
        expect(a).to.equal(this.a)
        expect(b).to.equal(this.b)
    }

}

@describe('with test cases')
class SampleWithTestCases2Test {

    @testCase("sample case2", SampleTestSteps2Test, ['XXXX', 17])
    case1(step: stepMethod<SampleTestSteps2Test>): void {
        step("step1").stepcompare('XXXX', 17)
    }


}
