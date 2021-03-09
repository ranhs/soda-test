import { expect, describe, it, SinonSpy, spy, TR, PTR, Done } from '.'
import { DerivedClass } from './class'
import { fail } from 'assert'

class A {
    a = 1
}

class B extends A {
    b = 2
}

@describe('expect')
class ExpectTest {
    @it('should use expect')
    expectTests(): TR {
        let obj: Record<string,unknown>
        let obj1: Record<string,unknown>


        expect(2).to.equal(2).to.equal(2)
        expect(2).equals(2)
        obj = {}
        expect(obj).to.equal(obj)
        expect(3).to.not.equal(2).to.equal(2)
        obj = {}
        obj1 = {}
        expect(obj).to.not.equal(obj1).to.equal(obj1)
        expect(2).to.deep.equal(2).to.equal(2)
        obj = {a:2,b:'#'}
        obj1 = {b:'#',a:2}
        expect(obj).to.deep.equal(obj1).to.equal({a:2,b:'#'})
        expect(3).to.not.deep.equal(2).to.equal(2)
        obj1['a'] = 3
        expect(obj).to.not.deep.equal(obj1).to.equal({a:3,b:'#'})
        expect({a:2,b:'#'}).to.have.property('a').equal(2)
        expect({a:2,b:'#'}).to.have.property('b').not.equal('$')
        expect({a:2,b:'#'}).to.not.have.property('c').to.equals('@')
        expect({a:2,b:'#'}).to.not.have.property('b','@').to.equal('%')
        expect(false).to.be.false
        expect(true).to.be.true
        expect(null).to.be.null
        expect(undefined).to.be.undefined
        expect({}).to.be.empty
        expect([]).to.be.empty
        expect(undefined).to.not.exist
        expect(null).to.not.exist
        expect(12).to.be.a('number').to.equal(12)
        expect("12").to.be.a('string').a('string')
        expect("12").a('string')
        expect({}).to.be.an('object')
        expect([]).to.be.an('array')
        expect(2).to.be.above(1)
        expect(2).to.be.greaterThan(1)
        expect(2).to.be.below(3)
        expect(2).to.be.lessThan(3)
        expect(new A()).to.be.instanceOf(A)
        expect(new B()).to.be.instanceOf(B).to.be.an('object').to.have.property('a',1)
        expect(new B()).to.be.instanceOf(A)
        expect(new A()).to.not.be.instanceOf(B)
    }

    static demo(): void {
        // do nohting
    }

    static demo1(ignored1: number, ignored2: string): void {
        // do nothing
    }

    static demo2(ignored1: Record<string, unknown>, ignored2: number): void {
        // do nothing
    }

    @it('should use expect - sinons')
    exceptSinon(@spy(ExpectTest, 'demo') demoSpy: SinonSpy,
                @spy(ExpectTest, 'demo1') demo1Spy: SinonSpy,
                @spy(ExpectTest, 'demo2') demo2Spy: SinonSpy,
                @spy('./class', 'DerivedClass') derivedclassSpy: SinonSpy): TR {
        ExpectTest.demo()
        expect(demoSpy).to.have.been.calledOnce
        ExpectTest.demo1(12,"a")
        ExpectTest.demo1(13,"B")
        expect(demo1Spy).to.have.been.calledWith(12,"a").calledWith(13, 'B')
        expect(demo1Spy).to.have.been.calledWithMatch(12).calledTwice.not.calledOnce
        ExpectTest.demo2({a:'a', b:12}, 12)
        expect(demo2Spy).to.have.been.calledWithMatch({b:12}, 12).calledWith({a:'a', b:12}, 12)
        //expect(demo2Spy).to.have.been.calledWithMatch(12)
        ExpectTest.demo1(124,'EEE')
        expect(demo1Spy).to.have.been.calledThrice
        expect(derivedclassSpy).to.not.have.been.called
        const dc = new DerivedClass()
        expect(derivedclassSpy).to.have.been.calledWithNew.calledOnce
        expect(dc).to.be.instanceOf(DerivedClass)
    }

    @it('should use expect - promise')
    async expectPromise(): PTR {
        let rv
        rv = await expect( Promise.resolve() ).to.eventually.be.fulfilled
        expect(rv).to.be.undefined
        rv = await expect( Promise.resolve(12)).to.eventually.be.equal(12)
        expect(rv).to.equal(12)
        rv = await expect( Promise.resolve(13) ).to.eventually.be.fulfilled
        expect(rv).to.equal(13)
        rv = await expect( Promise.reject() ).to.eventually.be.rejected
        expect(rv).to.be.undefined
        rv = await expect( Promise.reject(new Error('12')) ).to.eventually.be.rejectedWith('12')
        const e = new Error('kuku')
        rv = await expect( Promise.reject(e) ).to.eventually.be.rejectedWith('kuku').to.have.property('message','kuku')
        expect(e).to.have.property('message')
        const p = new Promise<number>((resolve)=>setTimeout(()=>{resolve(12)},500))
        await expect(p).to.eventually.equal(12)
        await expect(Promise.resolve(12)).to.eventually.equal(12)
        await expect(Promise.resolve(13)).to.eventually.not.equal(12)
        await expect(Promise.resolve({a:11})).to.eventually.exist
        await expect(Promise.resolve({a:11})).to.eventually.be.an('object')
        await expect(Promise.resolve({a:11})).to.eventually.have.property('a',11)
        await expect(Promise.resolve(true)).to.eventually.be.true
        await expect(Promise.resolve(100)).to.eventually.be.above(10)
        rv = await expect(Promise.resolve(100)).to.eventually.not.be.below(100)
        expect(rv).to.equal(100)
    }

    @it('should expect and done')
    expectWithDone(done: Done): TR {
        let timeout: NodeJS.Timeout = null
        setTimeout( () => {
            try {
                expect(true).to.be.true
                expect(1).to.equal(2)
                clearInterval(timeout)
                timeout = null
                //done() // should not get here
                fail('should not get here')
            } catch (e) {
                if ( timeout !== null ) {
                    clearInterval(timeout)
                }
                //throw(e)
                expect(e).to.exist.to.have.property('message').equals('expected 1 to equal 2')
                done()
            }
        },20)
        timeout = setTimeout( () => {
            expect(true).to.be.false
        }, 1000)
    }

    @it('should should take a second')
    waitawhile(done: Done): TR {
        setTimeout(()=>{
            done()
        }, 1000)
    }


}