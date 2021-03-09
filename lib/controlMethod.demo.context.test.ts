import { describe, context, it, TR, beforeEach, afterEach, before, after, expect } from '.'

@describe("demo context control methods")
class DemoTest {
    before(): void {
        console.log('***before-global')
    }

    beforeEach(): void {
        console.log('***beforeEach-global')
    }

    afterEach(): void {
        console.log('***afterEach-global')
    }

    after(): void {
        console.log('***after-global')
    }

    @it()
    test1(): TR {
        console.log('***test1-global')
        expect(null).to.be.null
    }
   
@context('context1')

    @beforeEach()
    beforeEach1(): void {
        console.log('***beforeEach-context1')
    }

    @afterEach()
    afterEach1(): void {
        console.log('***afterEach-context1')
    }

    @before()
    before1(): void {
        console.log('***before-context1')
    }

    @after()
    after1(): void {
        console.log('***after-context1')
    }

    @it()
    test2(): TR {
        console.log('***test2-conext1')
        expect(null).to.be.null
    }

    @it()
    test3(): TR {
        console.log('***test3-context1')
        expect(null).to.be.null
    }

@context('context2')

    @beforeEach()
    beforeEach2(): void {
        console.log('***beforeEach-context2')
    }

    @afterEach()
    afterEach2(): void {
        console.log('***afterEach-context2')
    }

    @before()
    before2(): void {
        console.log('***before-context2')
    }

    @after()
    after2(): void {
        console.log('***after-context2')
    }

    @it()
    test4(): TR {
        console.log('***test4-conext2')
        expect(null).to.be.null
    }

    @it()
    test5(): TR {
        console.log('***test5-context2')
        expect(null).to.be.null
    }

}
