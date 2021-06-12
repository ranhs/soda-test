<h1 align=center>
    <a href="https://github.com/ranhs/soda-test/wiki/01-home">
        <img alt="Soda-Test" width="40%" height="40%" src="https://raw.githubusercontent.com/ranhs/soda-test/main/logo.jpg">
    </a>
    <br>
    Soda -test
</h1>
<p align=center>
    package for unit and component testing Of Nodejs and Angular projects.
</p>

<br><br>
<h2 name="Installation">Installation</h2>

via [npm](https://github.com/npm/npm)

    $ npm install soda-test --save-dev

<br><br>
<h2>Usage</h2>
In your project write your test files under <b>test</b> folder, or side by side with your project files, name them *.spec.ts<br>
In your test file, define a class with <b>describe</b> decorator, and in it write your test methods with <b>it</b> decorator<br>
use <i>spies</i> and <i>stubs</i> by defining member variables or arguments with decorators.

```ts
@describe('demo')
class TestDemoTest {

    @stub(User, "findById").returns("dummy-user")
    findStub: SinonStub

    @it('should get user by id')
    GetById(): TR {
        const user = getUser({id:123})
        expect(user).to.equal("dummy-user")
        expect(this.findStub).to.have.been.calledOnce.calledWith(123)
    }

}
```
For full documentation and many sample test, see <a href="https://github.com/ranhs/soda-test/wiki/01-home">soda-test wiki</a><br>
<br>
Define API test-cases by using the <b>testCase</b> decorator on a method, and define its steps in it

```ts
   @testCase("sample case", SampleTestStepsTest)
   checkGetApi(step: stepMethod<SampleTestStepsTest>): void {
       step("define dummy REST server").StartRestServer({expect: "GET /", return: "dummy"})
       step("send get request").SendRequest({method:"GET", url: "/", expectresponse: "dummy"})
       step("validate get request").ValidateRequest({method: "GET", url: "/"})
       step("stop dummy Rest server").StopRestServer()
   }
```

For more details about API test case see <a href="https://github.com/ranhs/soda-test/wiki/22-testcases">Soda-test test-cases documenation</a>

<br><br>
<h2>Goals</h2>
<ul>
<li>Write Your unit test in a type-script way (e.g. classes, decorators, promises)</li>
<li>Your test may be run under mocha, jest or Karma</li>
<li>All relevant packages are included and exported from one place (chai, sinon, super-test, etc...)</li>
<li>Using <b>sinon</b> library to create spies and stubs</li>
<li>Define sinon as class member or method argument</li>
<li>Sinons clean-up are done automatically, don't need to worry about it</li>
<li>Divide your test method to different <b>context</b>s in the same test class</li>
<li>Stub and spy cases in an easy way the difficult cases</li>
<li>"rewire" is used under the hood. you don't need to worry about it</li>
<li>"rewire" works also when testing angular (using Jest or Karam) as well as when testing NodeJS projects</li>
<li>easy access to private methods in a module for testing and stubbing</li>
<li>can call/stub abstract and/or private methods in class for unit-testing</li>
<li>Use sinon fake timers to simulate time features without waiting the time during the unit tests</li>
<li>Also support API tests by using test-cases and test-steps method</li>
<li>Test steps can be reused in the same test-case or in different test-case with different arguments</li>
</ul>

<br><br>
<h2>Summary</h2>
<font size="+1" color="yellow"><b>Soda-Test helps you write good unit and API tests with high coverage.</b></font>

<br><br>
<h2>Documentation</h2>
Soda-test has full documentation with sample code.<br>
To learn using soda-test, you don't need to have previous knowledge of mocha, chai, or jasmine.<br>
You do need knowledge of typescript.<br>
It is recommended to go over the documentation in GitHub wiki, by its order<br>
<br>
Following are all the pages available in GitHub wiki:<br> 
<ul>
<li><a href="https://github.com/ranhs/soda-test/wiki/01-home">Table of Content (Home)</a></li>
<li><a href="https://github.com/ranhs/soda-test/wiki/02-about-soda-test">About Soda Test</a></li>
<li><a href="https://github.com/ranhs/soda-test/wiki/03-getting-started">Getting Started with soda-test using <b>Mocha</b> (for testing NodeJS projects)</a></li>
<li><a href="https://github.com/ranhs/soda-test/wiki/03.1 getting started jest">Getting started with soda-test using <b>Jest</b> (for testing Angular projects)</a></li>
<li><a href="https://github.com/ranhs/soda-test/wiki/03.2 getting started karma">Getting started with soda-test using <b>Karma</b> (for testing Angular projects)</a></li>
<li><a href="https://github.com/ranhs/soda-test/wiki/04-describe-it">using the <b>describe</b> and <b>it</b> decorators for building simple unit testing</a></li>
<li><a href="https://github.com/ranhs/soda-test/wiki/05-Asynchronous test step with callback">Testing Async methods that use Call-backs</a></li>
<li><a href="https://github.com/ranhs/soda-test/wiki/06-Asynchronous test step with Promise">Testing Async methods that return Promises</a></li>
<li><a href="https://github.com/ranhs/soda-test/wiki/07-context">Divide your Test Class into <b>Context</b>s</a></li>
<li><a href="https://github.com/ranhs/soda-test/wiki/08-pending">Set a test-method as <b>Pending</b> (until it is ready to be used, or if you what to temporary don't run it)</a></li>
<li><a href="https://github.com/ranhs/soda-test/wiki/09-control-methods">Use the <b>Control Methods</b> to define what to run before/after each test method, or before/after all tests/context</a></li>
<li><a href="https://github.com/ranhs/soda-test/wiki/10-spies"><b>Spy</b> a method to find out if it was called, how many times, and with which arguments</a></li>
<li><a href="https://github.com/ranhs/soda-test/wiki/11-stubs"><b>Stub</b> a method to make it do something else, so it will not be really called during your unit-tests</a></li>
<li><a href="https://github.com/ranhs/soda-test/wiki/12-sendbox">Run your test code in a <b>Sandbox</b></a></li>
<li><a href="https://github.com/ranhs/soda-test/wiki/13-rewire">Use Soda-Test <b>Rewire</b> implementation to access non-exported functions/variables</a></li>
<li><a href="https://github.com/ranhs/soda-test/wiki/14-importprivate"><b>Import Private</b> method, so you can call it to test it.</a></li>
<li><a href="https://github.com/ranhs/soda-test/wiki/15-supertest">Use <b>Super Test</b> to test express based REST application without doing any real web actions</a></li>
<li><a href="https://github.com/ranhs/soda-test/wiki/16-createstub">You can <b>Create Stub</b> when importing a module to avoid it from doing external actions</a></li>
<li><a href="https://github.com/ranhs/soda-test/wiki/17-timers">Use sinon <b>Fake-Timers</b> to simulate time advancing without waiting it to pass</a></li>
<li><a href="https://github.com/ranhs/soda-test/wiki/18-creatableclass"><b>Creatable Class</b> feature allows you create an instance of an abstract or private class, so you can test it</a></li>
<li><a href="https://github.com/ranhs/soda-test/wiki/19-agrigation">You can use <b>Aggregation</b> of method during import, so when you stub them during the test it will take effect, even if the function was saved in advanced</a></li>
<li><a href="https://github.com/ranhs/soda-test/wiki/20-expect">Learn how to use the <b>expect</b> method (originally defined in chai library) for validating values during unit-tests</a></li>
<li><a href="https://github.com/ranhs/soda-test/wiki/21-global">Use <b>Global Sinons</b> if you want your spy/stubs to keep running during all context/class without resetting</a></li>
<li><a href="https://github.com/ranhs/soda-test/wiki/22-testcases">Use Soda-Test for doing API testing by using <b>Test Cases</b></a></li>
<li><a href="https://github.com/ranhs/soda-test/wiki/23-testplan">Use Soda-Test to generate a JSON document about your tests</a></li>
<li><a href="https://github.com/ranhs/soda-test/wiki/24-configuration">Use Soda-Test configuration file to costumize soda-test abilities</a></li>
</ul>
<h2>Sample Code</h2>
The following GitHub repositories holds sample codes for soda-test:
<ul>
<li><a href="https://github.com/ranhs/soda-test-mocha-samples">soda-test-mocha-samples</a></li>
<li><a href="https://github.com/ranhs/soda-test-jest-samples.git">soda-test-jest-samples</a></li>
<li><a href="https://github.com/ranhs/soda-test-karma-samples.git">soda-test-karma-samples</a></li>
</ul>