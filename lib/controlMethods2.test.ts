import { expect, describe, context, it, TR, beforeEach, afterEach, before, after } from '.'

let BM=0,BEM=0,AEM=0,AM=0,B1=0,BE1=0,AE1=0,A1=0,B2=0,BE2=0,AE2=0,A2=0
let T1=0,T2=0,T3=0,T4=0,T5=0,T=0,TC1=0,TC2=0

function expectValue(args: number[],value: number): void {
    for (const arg of args) {
        expect(arg).to.equal(value)
    }
}

@describe("Control Methods 2")
class CtrlMethods2Test {

    before(): void {
        // nothing called until now
        expectValue([BM,BEM,AEM,AM,B1,BE1,AE1,A1,B2,BE2,AE2,A2],0)
        expectValue([T1,T2,T3,T4,T5],0)
        BM++
    }

    beforeEach(): void {
        expectValue([BM],1)
        expectValue([AEM-BEM,AM,AE1-BE1,AE2-BE2],0)
        BEM++
        T=0
    }

    afterEach(): void {
        expectValue([BM,BEM-AEM,T],1)
        expectValue([AM,BE1-AE1,BE2-AE2],0)
        AEM++
    }

    after(): void {
        expectValue([BM],1)
        expectValue([AM,AEM-BEM,A1-B1,AE1-BE1,A2-B2,AE2-BE2],0)
        expectValue([T1,T2,T3,T4,T5],1)
        AM++
    }

    @it()
    test1(): TR {
        expectValue([BM,BEM-AEM],1)
        expectValue([AM,T1,T,A1-B1,AE1-BE1,A2-B2,AE2-BE2],0)
        T1++
        T++
    }

@context('context1')

    @beforeEach()
    beforeEach1(): void {
        expectValue([BM,B1],1)
        expectValue([AM,A1,AE1-BE1,A2-B2,AE2-BE2,T],0)
        TC1=0
        BE1++
    }

    @afterEach()
    afterEach1(): void {
        expectValue([BM,B1,BE1-AE1,T,TC1],1)
        expectValue([AM,A1,B2-A2,BE2-AE2],0)
        AE1++
    }

    @before()
    before1(): void {
        expectValue([BM],1)
        expectValue([AM,B1,A1,BE1-AE1,B2-A2,BE2-AE2,T2,T3],0)
        B1++
    }

    @after()
    after1(): void {
        expectValue([BM,B1,T2,T3],1)
        expectValue([AM,A1,BEM-AEM,BE1-AE1,B2-A2,BE2-AE2],0)
        A1++
    }

    @it()
    test2(): TR {
        expectValue([BM,B1,BEM-AEM,BE1-AE1],1)
        expectValue([AM,A1,B2-A2,BE2-AE2,T,TC1,T2],0)
        T++
        TC1++
        T2++
    }

    @it()
    test3(): TR {
        expectValue([BM,B1,BEM-AEM,BE1-AE1],1)
        expectValue([AM,A1,B2-A2,BE2-AE2,T,TC1,T3],0)
        T++
        TC1++
        T3++
    }

    
@context('context2')

    @beforeEach()
    beforeEach2(): void {
        expectValue([BM,B2],1)
        expectValue([AM,A2,AE1-BE1,A1-B1,AE2-BE2,T],0)
        TC2=0
        BE2++
    }

    @afterEach()
    afterEach2(): void {
        expectValue([BM,B2,BE2-AE2,T,TC2],1)
        expectValue([AM,A2,B1-A1,BE1-AE1],0)
        AE2++
    }

    @before()
    before2(): void {
        expectValue([BM],1)
        expectValue([AM,B2,A2,BE1-AE1,B1-A1,BE2-AE2,T4,T5],0)
        B2++
    }

    @after()
    after2(): void {
        expectValue([BM,B2,T4,T5],1)
        expectValue([AM,A2,BEM-AEM,BE1-AE1,B1-A1,BE2-AE2],0)
        A2++
    }

    @it()
    test4(): TR {
        expectValue([BM,B2,BEM-AEM,BE2-AE2],1)
        expectValue([AM,A2,B1-A1,BE1-AE1,T,TC2,T4],0)
        T++
        TC2++
        T4++
    }

    @it()
    test5(): TR {
        expectValue([BM,B2,BEM-AEM,BE2-AE2],1)
        expectValue([AM,A2,B1-A1,BE1-AE1,T,TC2,T5],0)
        T++
        TC2++
        T5++
    }

}

@describe('controlMethods3')
class ConsoleMethods3Test {
    @it('should be after controlMethods2 after call')
    validateAfterWasCalled(): TR {
        expect(AM).to.equal(1)
    }
}