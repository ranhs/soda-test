import {describe, context, it, TR, expect, spy, stub, SinonSpy, SinonStub, rewire, Rewire} from '..'
import {getCount, setCount, advance, decrement, double, squar, DummyClass, BaseClass} from './lib'
import {getName, setName} from './lib2'

import { run } from 'argv'
import { isString, isObject, isFunction, floor } from 'lodash'

class BaseClassType extends BaseClass {
    protected kuku(ignore: string): number {
        return 0
    }

    protected get Value(): number {
        return 0
    }

    protected set Value(ignore: number) {
        // do nothing
    }

}

@describe("TestTest")
class TestTest {

    beforeEach(): void {
        setCount(18)
    }


@context("basic testings")

    @it("should get what set")
    getset(): TR {
        expect(getCount()).to.equal(18)
    }

    @it("should advance value")
    checkAdvance(): TR {
        advance()
        expect(getCount()).to.equal(19)
    }

@context("spy")

    @it("should spy as argument")
    checkSpy1(@spy('./lib', 'advance') spyAdvance: SinonSpy): TR {
        advance()
        expect(getCount()).to.equal(19)
        expect(spyAdvance).to.have.been.calledOnce
    }

    @spy('./lib', 'decrement')
    spyDecrement: SinonSpy

    @it("should spy as member")
    checkSpy2(): TR {
        decrement()
        expect(getCount()).to.equal(17)
        expect(this.spyDecrement).to.have.been.calledOnce
    }

    @it("should spy external library as argument")
    checkSpy3(@spy('lodash', 'isString') spyIsString: SinonSpy): TR {
        const b = isString('AAA')
        expect(b).to.be.true
        expect(spyIsString).to.have.been.calledOnce
    }

    @spy('lodash', 'isObject')
    spyIsObject: SinonSpy
    
    @it("should spy external library as member")
    checkSpy4(): TR {
        const b = isObject('AAA')
        expect(b).to.be.false
        expect(this.spyIsObject).to.have.been.calledOnce
    }

    @it("should spy object as argument")
    checkSpy5(@spy(console, 'log') spyLog: SinonSpy): TR {
        console.log("Spy This Log Line")
        expect(spyLog).to.have.been.calledWith("Spy This Log Line")
    }

    @spy(console, 'warn')
    spyWarn: SinonSpy

    @it("should spy object as memeber")
    checkSpy6(): TR {
        console.warn("Spy This Warn Line")
        expect(this.spyWarn).to.have.been.calledWith("Spy This Warn Line")
    }

    @it("should spy class member")
    checkSpy7(@spy('./lib', 'DummyClass', 'kuku') kukuSpy: SinonSpy): TR {
        const dummy = new DummyClass()
        const n = dummy.foo('stam')
        expect(kukuSpy).to.have.been.calledOnce
        expect(kukuSpy).to.have.been.calledWith('stam')
        expect(n).to.equal(4)
    }

@context("stub")

    @it("should stub as argument")
    checkStub1(@stub('./lib', 'double').returns(-101) stubDouble: SinonStub): TR {
        const rv = double()
        expect(rv).to.equal(-101)
        expect(getCount()).to.equal(18)
        expect(stubDouble).to.have.been.calledOnce
    }

    @it("should not be stubbed anymore")
    checkStub1After(): TR {
        const rv = double()
        expect(rv).to.equal(36)
        expect(getCount()).to.equal(36)
    }

    @stub('./lib', 'squar')
    stubSquar: SinonStub

    @it("should stub as member")
    checkStub2(): TR {
        this.stubSquar.callsFake(()=>-123)
        const rv = squar() 
        expect(rv).to.equal(-123)
        expect(getCount()).to.equal(18)
        expect(this.stubSquar).to.have.been.calledOnce
    }

    @it("should be default stubbed")
    checkStub2After(): TR {
        const rv = squar()
        expect(rv).to.be.undefined
        expect(getCount()).to.equal(18)
        expect(this.stubSquar).to.have.been.calledOnce
    }

    @it("should stub external library as argument")
    checkStub3(@stub('lodash', 'isString').returns(false) stubIsString: SinonStub): TR {
        const b = isString('AAA')
        expect(b).to.be.false
        expect(stubIsString).to.have.been.calledOnce
    }

    @it("should not be stubbed anymore")
    checkStub3After(): TR {
        const b = isString('AAA')
        expect(b).to.be.true
    }

    @stub('lodash', 'isFunction')
    stubIsFunction: SinonStub

    @it("should stub external library as member")
    checkStub4(): TR {
        this.stubIsFunction.callsFake(()=>false)
        const b = isFunction(this.checkStub4)
        expect(b).to.be.false
        expect(this.stubIsFunction).to.have.been.calledOnce
        expect(this.stubIsFunction).to.have.been.calledWith(this.checkStub4)
    }

    @it("should be default stubbed")
    checkStub4After(): TR {
        const b = isFunction(this.checkStub4)
        expect(b).to.be.undefined
        expect(this.stubIsFunction).to.have.been.calledOnce
        expect(this.stubIsFunction).to.have.been.calledWith(this.checkStub4)
    }

    @it("should stub object as argument")
    checkStub5(@stub(console, 'log') stubLog: SinonStub): TR {
        let calledWith: string = undefined
        stubLog.callsFake((f: string )=>calledWith = f)
        console.log("Stub This Log Line")
        expect(calledWith).to.equal("Stub This Log Line")
        expect(stubLog).to.have.been.calledWith("Stub This Log Line")
    }

    @stub(console, 'error')
    stubError: SinonStub

    @it("should spy object as memeber")
    checkStub6(): TR {
        let calledWith: string = undefined
        this.stubError.callsFake((f: string)=>calledWith = f)
        console.error("Stub This Error Line")
        expect(calledWith).to.equal("Stub This Error Line")
        expect(this.stubError).to.have.been.calledWith("Stub This Error Line")
    }

    @it("should stub class member")
    checkStub7(@stub('./lib', 'DummyClass', 'kuku').returns(-1) kukuSpy: SinonSpy): TR {
        const dummy = new DummyClass()
        const n = dummy.foo('stam')
        expect(kukuSpy).to.have.been.calledOnce
        expect(kukuSpy).to.have.been.calledWith('stam')
        expect(n).to.equal(-1)
    }

    @it("should stub class abstract member")
    checkStub8(@stub('./lib', 'BaseClass', 'kuku').returns(-1) kukuSpy: SinonSpy): TR {
        // workaround for creating abstract class instance
        const baseClassWorkaround = BaseClass as unknown as typeof BaseClassType
        const dummy: BaseClass = new baseClassWorkaround()
        const n = dummy.foo('stam')
        expect(kukuSpy).to.have.been.calledOnce
        expect(kukuSpy).to.have.been.calledWith('stam')
        expect(n).to.equal(-1)
    }

    @it("should stub getter member as const")
    checkStub9( @stub('./lib','DummyClass', 'Value').access(3) ignoreValueStub: SinonStub): TR {
        const dummy = new DummyClass()
        expect(dummy.callGetter()).to.equal(3)
    }

    @it("should stub getter member as method")
    checkStub10( @stub('./lib','DummyClass', 'Value').access(()=>4) ignoreValueStub: SinonStub): TR {
        const dummy = new DummyClass()
        expect(dummy.callGetter()).to.equal(4)
    }

    @it("should stub abstract getter member")
    checkStub11(@stub('./lib', 'BaseClass', 'Value').access(-1) ignoreValueStub: SinonSpy): TR {
        // workaround for creating abstract class instance
        const baseClassWorkaround = BaseClass as unknown as typeof BaseClassType
        const dummy: BaseClass = new baseClassWorkaround()
        expect(dummy.callGetter()).to.equal(-1)
    }

    static _v: number

    @it("should stub setter member")
    checkStub12( @stub('./lib','DummyClass', 'Value').access(undefined,(v: number)=>{TestTest._v = v}) ignoreValueStub: SinonStub): TR {
        const dummy = new DummyClass()
        TestTest._v = 0
        dummy.callSetter(15)
        expect(TestTest._v).to.equal(15)
    }

    @it("should stub abstract setter member")
    checkStub13( @stub('./lib','BaseClass', 'Value').access(undefined,(v: number)=>{TestTest._v = v}) ignoreValueStub: SinonStub): TR {
        // workaround for creating abstract class instance
        const baseClassWorkaround = BaseClass as unknown as typeof BaseClassType
        const dummy: BaseClass = new baseClassWorkaround()
        TestTest._v = 0
        dummy.callSetter(115)
        expect(TestTest._v).to.equal(115)
    }



@context("rewire")

    @it("should rewire lib as argument")
    checkRewire1(@rewire('./lib') libRewire: Rewire): TR {
        const count = libRewire.get('_count')
        expect(count).to.equal(18)
        libRewire.set('_count', 222)
        expect(getCount()).to.equal(222)
        libRewire.set('getCount', ()=>libRewire.get('_count')+1)
        expect(getCount()).to.equal(223)
    }

    @it("should reset rewire changes")
    checkRewire1After(): TR {
        expect(getCount()).to.equal(18)
    }

    @rewire('./lib2')
    lib2Rewire: Rewire

    @it("should rewire lib2 as member")
    checkRewire2(): TR {
        setName('Ran')       
        const name = this.lib2Rewire.get('_name')
        expect(name).to.equal('Ran')
        this.lib2Rewire.set('_name', 'Har-Shuv')
        expect(getName()).to.equal('Har-Shuv')
    }

    @it("should revert rewire changes")
    checkRewire2After(): TR {
        expect(getName()).to.equal('Ran')
    }

    @it("should rewire external lib as argument")
    checkRewire3(@rewire('argv') lodashRewire: Rewire): TR {
        let f: (arg: string[]) => string[] = lodashRewire.get('run')
        expect(f(['a','b'])).to.deep.equal({targets:["a","b"],options:{}})
        lodashRewire.set('run', (args: string[]) => args)
        expect(run(['v', '3'])).to.deep.equal(["v","3"])
        f = lodashRewire.get('run')
        expect(f(['2','3'])).to.deep.equal(['2','3'])
    }

    @it("should cancel rewire changes")
    checkRewrie3After(): TR {   
        expect(run(['Ran','Har-Shuv'])).to.deep.equal({targets:["Ran","Har-Shuv"],options:{}})
    }


    @rewire('lodash')
    LodashRewire1: Rewire

    @it("should rewire external lib as member")
    checkRewire4(): TR {
        expect(floor(5.21,1)).to.equal(5.2)
        this.LodashRewire1.set('floor', (n: number, precision?: number): number => {
            return n + precision
        })
        expect(floor(5.21,1)).to.equal(6.21)
    }

    @it("should cancel rewire changes")
    checkRewire4After(): TR {
        expect(floor(5.21,1)).to.equal(5.2)
    }

}

@describe("global changes")
class Test1Test {
    
}