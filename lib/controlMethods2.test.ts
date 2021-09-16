import { expect, describe, context, it, TR, beforeEach, afterEach, before, after } from '.'

let afterWasCalled = false

@describe("Control Methods 2")
class CtrlMethods2Test {
    calls: string[] = []

    before(): void {
        this.calls.push('BM')
    }

    beforeEach(): void {
        this.calls.push('BEM')
    }

    afterEach(): void {
        this.calls.push('AEM')
    }

    after(): void {
        this.calls.push('AM')
        expect(this.calls).to.deep.equal(['AE2','AEM','A2','AM'])
        afterWasCalled = true
    }

    @it()
    test1(): TR {
        expect(this.calls).to.deep.equal(['BM','BEM'])
        this.calls = []
    }

@context('context1')

    @beforeEach()
    beforeEach1(): void {
        this.calls.push('BE1')
    }

    @afterEach()
    afterEach1(): void {
        this.calls.push('AE1')
    }

    @before()
    before1(): void {
        this.calls.push('B1')
    }

    @after()
    after1(): void {
        this.calls.push('A1')
    }

    @it()
    test2(): TR {
        expect(this.calls).to.deep.equal(['AEM','B1','BEM','BE1'])
        this.calls = []
    }

    @it()
    test3(): TR {
        expect(this.calls).to.deep.equal(['AE1','AEM','BEM','BE1'])
        this.calls = []
    }

    
@context('context2')

    @beforeEach()
    beforeEach2(): void {
        this.calls.push('BE2')
    }

    @afterEach()
    afterEach2(): void {
        this.calls.push('AE2')
    }

    @before()
    before2(): void {
        this.calls.push('B2')
    }

    @after()
    after2(): void {
        this.calls.push('A2')
    }

    @it()
    test4(): TR {
        expect(this.calls).to.deep.equal(['AE1','AEM','A1','B2','BEM','BE2'])
        this.calls = []
    }

    @it()
    test5(): TR {
        expect(this.calls).to.deep.equal(['AE2','AEM','BEM','BE2'])
        this.calls = []
    }

}

@describe('controlMethods3')
class ConsoleMethods3Test {
    @it('should be after controlMethods2 after call')
    validateAfterWasCalled(): TR {
        expect(afterWasCalled).to.be.true
    }
}