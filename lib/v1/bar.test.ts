import { it, TR, describe, context, expect, before, after, beforeEach, afterEach, pending, environment } from '..'

@describe("files to tested")
class DescribeClassTest {

    before(): void {
        console.log('==============before')
    }

    after(): void {
        console.log('==============after')
    }

    beforeEach(): void {
        console.log('==============beforeEach')
    }

    afterEach(): void {
        console.log('==============afterEach')
    }

@context("function to be tested")

    @it("should test something")
    test1(): TR {
        expect(1).to.equal(1)
        console.log("ENV:", environment.NODE_ENV)

        if ( environment.NODE_ENV === "development" ) {
            console.log('This is development mode')
        }
    }

    @it("should test something else")
    test2(): TR {
        expect({name:"joe"}).to.deep.equal({name:"joe"})
    }

@context("function2 to be tested")

    @before()
    beforeContext2(): void {
        console.log('==============before context 2')
    }

    @after()
    afterContext2(): void {
        console.log('==============after context 2')
    }

    @beforeEach()
    beforeEachContext2(): void {
        console.log('==============beforeEach context 2')
    }

    @afterEach()
    afterEachContext2(): void {
        console.log('==============afterEach context 2')
    }

    @it("this is a pending test")
    @pending()
    test3(): TR {
        // do nothing
    }

    @it()
    test4(): TR {
        // do nothing
    }

}