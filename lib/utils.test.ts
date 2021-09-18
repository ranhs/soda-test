import { describe, SinonStub, stub, it, TR, expect, context, beforeEach } from '.'

import { createGreeting, isString } from './utils'
import { secret } from './config'

@describe('utils')
class UtilsTest {

    @context('createGreeting')

    @stub('util','format').returns('ABC123')
    formatStub: SinonStub

    greeting: string | null

    @beforeEach()
    beforeEach1(): void {
        this.greeting = createGreeting('foo', 12)
    }

    @it('should return null if invalid string/number is passed')
    checkArgs1(): TR {
        // cancel the calls done by the beforeEach
        this.formatStub.reset()
        let name: unknown
        let age: unknown

        name = null
        age = 1
        const greeting1 = createGreeting(name as string, age as number)
        name = 123
        age = 1
        const greeting2 = createGreeting(name as string, age as number)
        name = "me"
        age = null
        const greeting3 = createGreeting(name as string, age as number)
        name = "me"
        age = "kuku"
        const greeting4 = createGreeting(name as string, age as number)

        expect(greeting1).to.be.null
        expect(greeting2).to.be.null
        expect(greeting3).to.be.null
        expect(greeting4).to.be.null

        expect(this.formatStub).to.not.have.been.called
    }

    @it('should get secret from config')
    checkSecret(): TR {
        expect(secret()).to.equal('secrete')
    }

    @it('should call format with corret settings and return is result')
    checkCripto(): TR {
        expect(this.formatStub).to.have.been.calledOnceWithExactly('Congratulate %s on his %dth birthday!', 'foo', 12)
        expect(this.greeting).to.be.equal('ABC123')
    }

@context('isString')
    @stub('underscore','isString').returns(true)
    iStringStub: SinonStub

    @it('should call _.isString and return true')
    isString(): TR {
        expect(isString(4)).to.be.true
        expect(this.iStringStub).to.have.been.calledOnce
    }

@context('isString default')
    @it('should return false when no stub')
    isString1(): TR {
        expect(isString(4)).to.be.false
    }
}

