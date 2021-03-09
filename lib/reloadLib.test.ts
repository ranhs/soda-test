import { expect, describe, context, it, TR, Rewire, rewire  } from '.'

import { value } from './reloadLib'

@describe('rewire-reload')
class RewireReloadTest {

@context('0')

    orgValue: number

    @it('should be a random value (original)')
    check0(): TR {
        this.orgValue = value
        expect(this.orgValue).to.be.a('number')
    }


@context('1')

    tempValue: number

    @rewire('./reloadLib', true)
    reloadLib1: Rewire

    @it('should be a random value (changed)')
    check1(): TR {
        this.tempValue = value
        expect(this.tempValue).to.equal(this.reloadLib1.get('value1'))
        expect(this.tempValue).to.not.equal(this.orgValue)
    }

@context('2')

    @it('should be the original value')
    check2(): TR {
        expect(value).to.equal(this.orgValue)
    }

}