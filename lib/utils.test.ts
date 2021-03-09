import { describe, SinonStub, stub, it, TR, expect, context, beforeEach } from '.'

import * as crypto from 'crypto'
import { getHash, isString } from './utils'

@describe('utils')
class UtilsTest {

@context('getHash')

    @stub('./config', 'secret').returns('fake_secret')
    secretStub: SinonStub

    @stub().returns('ABC123')
    digentStub: SinonStub

    @stub().construct({digest: 'digentStub'})
    updateStub: SinonStub

    @stub(crypto,'createHash').construct({update: 'updateStub'})
    createHashStub: SinonStub

    hash: string

    @beforeEach()
    beforeEach1(): void {
        this.hash = getHash('foo')
    }

    @it('should return null if invalid string is passed')
    checkArgs1(): TR {
        // cancel the calls done by the beforeEach
        this.createHashStub.reset()
        let arg: unknown

        arg = null
        const hash2 = getHash(arg as string)
        arg = 123
        const hash3 = getHash(arg as string)
        arg = {name: 'bar'}
        const hash4 = getHash(arg as string)

        expect(hash2).to.be.null
        expect(hash3).to.be.null
        expect(hash4).to.be.null

        expect(this.createHashStub).to.not.have.been.called
    }

    @it('should get secret from config')
    checkSecret(): TR {
        expect(this.secretStub).to.have.been.called
    }

    @it('should call cripto with corret settings and return hash')
    checkCripto(): TR {
        expect(this.createHashStub).to.have.been.calledWith('md5')
        expect(this.updateStub).to.have.been.calledWith('foo_fake_secret')
        expect(this.digentStub).to.have.been.calledWith('hex')
        expect(this.hash).to.be.equal('ABC123')
    }

@context('isString')
    @stub('underscore','isString').returns(true)
    iStringStub: SinonStub

    @it('should call _.isString and return true')
    isString(): TR {
        expect(isString(4)).to.be.true
        expect(this.iStringStub).to.have.been.calledOnce
    }
}

