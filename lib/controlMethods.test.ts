import { expect, describe, context, it, TR, SinonStub, stub, beforeEach, afterEach } from '.'

class ToStub {
    foo(): number {
        return 42
    }
}

const instance = new ToStub()

@describe("Control Methods")
class CtrlMethodsTest {

    cmAAA = false

    @it()
    OutOfContext(): TR {
        expect(this.cmAAA).to.be.false
        expect(instance.foo()).to.equal(42)
    }

@context("AAA")
  
    @stub(instance, 'foo').returns(12)
    instanceStubA: SinonStub


    @it("aaa1")
    aaa1(): TR {
        console.log('aaa1')
        expect(this.cmAAA).to.be.true
    }

    @beforeEach()
    beforeEachAAA(): void {
        console.log('beforeEachAAA')
        this.cmAAA = true
    }

    @afterEach()
    afterEAchAAA(): void {
        console.log('afterEachAAA')
        this.cmAAA = false
    }

    @it("aaa2")
    aaa2(): TR {
        console.log('aaa2')
        expect(this.cmAAA).to.be.true
        expect(instance.foo()).to.equal(12)
        expect(this.instanceStubA).to.have.been.calledOnce
    }

    @it("aaa3")
    aaa3(): TR {
        console.log('aaa3')
        expect(this.cmAAA).to.be.true
        expect(instance.foo()).to.equal(12)
        expect(this.instanceStubA).to.have.been.calledOnce
    }

@context("BBB")

    @it("bbb1")
    bbb1(): TR {
        console.log('bbb1')
        expect(this.cmAAA).to.be.false
        expect(instance.foo()).to.equal(42)
        expect(this.instanceStubA).to.not.exist
    }
}