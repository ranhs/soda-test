import { describe, SinonStub, stub, it, TR, expect, context, beforeEach } from '.'

import { createGreeting, isString } from './utils'
import { secret } from './config'
import * as _ from 'underscore'

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

@context('isString1')
    // this method of stubing (for underscore libraray) does not work on Angular 12
    @stub('underscore','isString').returns(true)
    iStringStub1: SinonStub

    @it('should call _.isString and return true')
    isString1(): TR {
        expect(isString(4)).to.be.true
        expect(this.iStringStub1).to.have.been.calledOnce
    }

@context('isString2')
    @stub(_,'isString').returns(false)
    iStringStub2: SinonStub

    @it('should call _.isString and return false')
    isString2(): TR {
        expect(isString('text')).to.be.false
        expect(this.iStringStub2).to.have.been.calledOnce
    }

@context('isString default')
    @it('should return true for strings when no stub')
    isString3(): TR {
        expect(isString(4)).to.be.false
        expect(isString('text')).to.be.true
    }
}

