import { expect, describe, context, it, TR, PTR, useFakeTimers, SinonFakeTimers } from '.'

import { getCurrentTime, sleep } from './timers'

let realTime: number = Date.now()

@describe('initTimersTest')
class TimersInitTest {
    @it()
    saveCurrentTime(): TR {
        realTime = Date.now()
    }
}

@describe('timers')
class TimersTest {

    @useFakeTimers(1000)
    clock: SinonFakeTimers

 @context('getCurrentTime')

    @it('should return the current time')
    getCurrentTime1(): TR {
        let time = getCurrentTime()
        expect(time).to.equal(1000)
        this.clock.tick(501)
        time = getCurrentTime()
        expect(time).to.equal(1501)
    }

    @it('should reset the time back to 1000')
    getCurrentTimer2(): TR {
        expect(getCurrentTime()).to.equal(1000)
    }

@context('sleep')
    @it('wait for 500ms')
    async sleep1(): PTR {
        const p = sleep(500)
        let resolved = false
        p.then(()=>resolved = true)
        expect(resolved).to.be.false
        await this.clock.atick(499)
        expect(resolved).to.be.false
        await this.clock.atick(1)
        expect(resolved).to.be.true
    }
}

@describe('timers2')
class Timers2Test {

@context('context1')

    @useFakeTimers(1000)
    clock: SinonFakeTimers

    @it('should have a fake timer')
    getCurrentTime1(): TR {
        expect(getCurrentTime()).to.equal(1000)
    }

@context('context2')
    @it('should get the real time')
    getCurrentTime2(): TR {
        expect(getCurrentTime()).to.be.above(realTime).to.be.below(realTime+200)
    }

    @it('should have fake timers as argument')
    getCurrentTime3(@useFakeTimers(1731) ignoreClock: SinonFakeTimers): TR {
        expect(getCurrentTime()).to.equal(1731)
    }

    @it('should not have fake timers anymore')
    getCurrentTimer3(): TR {
        expect(getCurrentTime()).to.be.above(realTime).to.be.below(realTime+200)
    }
}