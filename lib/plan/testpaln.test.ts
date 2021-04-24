import { describe, context, it, comment, expect, spy, SinonSpy, testStep, testCase, stepMethod } from '..'
import { copyFileSync, unlinkSync, readFileSync } from 'fs'
import { join } from 'path'
import { createTestPlan } from '../../plan'
import { testPlan as testPlanRef, testPlan2 as testPlanRef2 } from './testplan.data'


@describe('TestPlan1', {description: 'Test the ability to create a test plan'})
class PlanTest {

    @spy(console, 'error')
    consoleErrorSpy: SinonSpy

    @it('Not enough arguments', {desription: "error message when only 2 arguments"})
    invalidArguments() {
        createTestPlan(['node.exe', 'plan'])
        expect(this.consoleErrorSpy).to.have.been.calledOnce.calledWith("Invalid script command")
    }

@context('More Invalid Arguments')

@comment('invalid cases', {desription: "validate error message when having invalid arguments"})

    @it('Too main arguments', {desription: "error message when 5 arguments"})
    invalidArguments1() {
        createTestPlan(['node.exe', 'plan', '**/plan/*.test.js', 'tempTestPlan.json', 'extraArgument'])
        expect(this.consoleErrorSpy).to.have.been.calledOnce.calledWith("Invalid script command")
    }

    @it('not a node command', {description: "error mesage if 1st argument is not the node command"})
    invalidArguments2() {
        createTestPlan(['cmd.exe', 'plan', '**/plan/*.test.js'])
        expect(this.consoleErrorSpy).to.have.been.calledOnce.calledWith("Invalid script command")

    }

    @it('not a plan script', {description: "error mesage if 2st argument is not the plan command"})
    invalidArguments3() {
        createTestPlan(['node.exe', 'test', '**/plan/*.test.js'])
        expect(this.consoleErrorSpy).to.have.been.calledOnce.calledWith("Invalid script command")
    }

@context('Creating a Test Plan')

@comment('Validating the JSON of the test plan')
@comment('in console or in a file')

    @it('test plan in console')
    async createTestPlan1(@spy(console, 'log') consoleLogSpy: SinonSpy)
    {
        const tempFileName = `testplan.${Math.random()}.test.js`
        const fullTempFile = join(__dirname, tempFileName)
        copyFileSync(__filename, fullTempFile)
        await createTestPlan(['node.exe', 'plan', fullTempFile])
        unlinkSync(fullTempFile)
        expect(consoleLogSpy).to.have.been.calledOnce
        expect(consoleLogSpy.getCall(0).firstArg.split('\n')).to.deep.equal(JSON.stringify(testPlanRef,null,2).split('\n'))
    }

    @it('test plan in file')
    async createTestPlan2() {
        const tempFileName = `testplan.${Math.random()}.test.js`
        const fullTempFile = join(__dirname, tempFileName)
        const tempOutoutFile = `testplan.${Math.random()}.json`
        const fullOutputFile = join(__dirname, tempOutoutFile)
        copyFileSync(__filename, fullTempFile)
        await createTestPlan(['node.exe', 'plan', fullTempFile, fullOutputFile])
        unlinkSync(fullTempFile)
        const output = readFileSync(fullOutputFile).toString()
        unlinkSync(fullOutputFile)
        expect(output.split('\n')).to.deep.equal(JSON.stringify(testPlanRef,null,2).split('\n'))       
    }

    @it('test plan from ts')
    async createTestPlan3() {
        const tempOutoutFile = `testplan.${Math.random()}.json`
        const fullOutputFile = join(__dirname, tempOutoutFile)
        await createTestPlan(['node.exe', 'plan', join(__dirname, 'testPlan2.test.ts'), fullOutputFile])
        const output = readFileSync(fullOutputFile).toString()
        unlinkSync(fullOutputFile)
        expect(output.split('\n')).to.deep.equal(JSON.stringify(testPlanRef2,null,2).split('\n'))       
    }

}

class StepClass {
    @testStep()
    Dummy() {
        expect(true).to.equal(true)
    }
}

@describe('dummy test case')
class DummyCaseTest {
    @testCase('dummy test case', StepClass, null, {description: 'The Dummy Test Case'})
    dummyTestCase(step: stepMethod<StepClass>) {
        step.comment('dummy comment')
        step("Step1",null,{id: 1}).Dummy()
        step.comment('another dummy comment')
        step.comment('dummy comment with description', {description: 'the dummy comment description'})
        step("Step2",null,{id: 2}).Dummy()
    }
}