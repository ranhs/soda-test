import { expect, describe, context, it, TR, spy, SinonSpy, SinonStub, stub, global, Rewire, rewire, useFakeTimers, PTR, SinonFakeTimers } from '.'

import { getPrivateMember } from './globalSinons'


class TestObjectClass {
    func1(): number {
        return 1
    }

    func2(): number { 
        return 2
    }

    func3(): number {
        return 3
    }
}

const testObject = new TestObjectClass()

let realTime = Date.now()

@describe('pre-global Sinons')
class TakeRealTimeTest {
    @it()
    takeRealTime(): TR {
        const now = Date.now()
        expect(now-realTime).to.be.above(0).to.be.below(5000) // time it might took other tests
        realTime = now
    }
}

@describe('global Sinons')
class GlobalSinonTest {
    @it('should stub nothing')
    noStubbing(): TR {
        expect(testObject.func1()).to.equal(1)
        expect(testObject.func2()).to.equal(2)
        expect(testObject.func3()).to.equal(3)
    }

@context('Regular sinons')

    @spy(testObject,'func1')
    func1Spy1: SinonSpy

    @stub(testObject, 'func2').returns(22)
    func2Stub1: SinonStub

    @it('should called once')
    calledOnce1(): TR {
        expect(this.func1Spy1).to.not.have.been.called
        expect(this.func2Stub1).to.not.have.been.called
        expect(testObject.func1()).to.equal(1)
        expect(testObject.func2()).to.equal(22)
        expect(testObject.func3()).to.equal(3)
        expect(this.func1Spy1).to.have.been.calledOnce
        expect(this.func2Stub1).to.have.been.calledOnce
    }

    @it('should called once again')
    calledOnce2(): TR {
        expect(this.func1Spy1).to.not.have.been.called
        expect(this.func2Stub1).to.not.have.been.called
        expect(testObject.func1()).to.equal(1)
        expect(testObject.func2()).to.equal(22)
        expect(testObject.func3()).to.equal(3)
        expect(this.func1Spy1).to.have.been.calledOnce
        expect(this.func2Stub1).to.have.been.calledOnce
    }

@context('GlobalSinons')

    @global()
    @spy(testObject,'func1')
    func1Spy2: SinonSpy

    @global()
    @stub(testObject, 'func2').returns(222)
    func2Stub2: SinonStub

    @it('should called once')
    calledOnce3(): TR {
        expect(this.func1Spy2).to.not.have.been.called
        expect(this.func2Stub2).to.not.have.been.called
        expect(testObject.func1()).to.equal(1)
        expect(testObject.func2()).to.equal(222)
        expect(testObject.func3()).to.equal(3)
        expect(this.func1Spy2).to.have.been.calledOnce
        expect(this.func2Stub2).to.have.been.calledOnce
    }

    @it('should called once again')
    calledOnce4(): TR {
        expect(this.func1Spy2).to.have.been.calledOnce
        expect(this.func2Stub2).to.have.been.calledOnce
        expect(testObject.func1()).to.equal(1)
        expect(testObject.func2()).to.equal(222)
        expect(testObject.func3()).to.equal(3)
        expect(this.func1Spy2).to.have.been.calledTwice
        expect(this.func2Stub2).to.have.been.calledTwice
    }

@context('regular rewires')

    @rewire('./globalSinons')
    globalSinonsRewire: Rewire

    @it('should change a private member')
    changePrivateMember(): TR {
        expect(getPrivateMember()).to.equal(0)
        this.globalSinonsRewire.set('privateMember',17)
        expect(getPrivateMember()).to.equal(17)
    }

    @it('should restore the private member')
    privateMemberRestored(): TR {
        expect(getPrivateMember()).to.equal(0)
    }

@context('global rewires')

    @global()
    @rewire('./globalSinons')
    globalSinonsRewire1: Rewire

    @it('should change a private member')
    changePrivateMember1(): TR {
        expect(getPrivateMember()).to.equal(0)
        this.globalSinonsRewire1.set('privateMember',19)
        expect(getPrivateMember()).to.equal(19)
    }

    @it('should leave the private member')
    privateMemberRestored1(): TR {
        expect(getPrivateMember()).to.equal(19)
    }

@context('post global rewires')

    @it('should restore the private member')
    privateMemberRestored2(): TR {
        expect(getPrivateMember()).to.equal(0)
    }

@context('regular fakeTimers')

    @useFakeTimers(1000)
    clock: SinonFakeTimers

    @it('should change the time')
    async timer1(): PTR {
        expect(Date.now()).to.equal(1000)
        await this.clock.atick(100)
        expect(Date.now()).to.equal(1100)
    }

    @it('should reset the time')
    timer2(): TR {
        expect(Date.now()).to.equal(1000)
    }

@context('post regular fakeTimers')
    @it('should read the real time')
    timer3(): TR {
        expect(Date.now() - realTime).to.be.above(0).to.be.below(1000)
    }

@context('global fakeTimers')

    @global()
    @useFakeTimers(1000)
    clock1: SinonFakeTimers

    @it('should change the time')
    async timer4(): PTR {
        expect(Date.now()).to.equal(1000)
        await this.clock1.atick(100)
        expect(Date.now()).to.equal(1100)
    }

    @it('should keep the time')
    timer5(): TR {
        expect(Date.now()).to.equal(1100)
    }


}