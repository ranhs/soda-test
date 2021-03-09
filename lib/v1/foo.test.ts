import {describe, it, TR, expect} from '..'

@describe('chai-test')
class ChaiTest {
    @it('should compare some values')
    compare(): TR {
        expect(1).to.equal(1)
    }

    @it('should test some other stuff')
    compare2(): TR {
        expect({name: 'foo'}).to.deep.equal({name: 'foo'})
        expect({name: 'foo'}).to.have.property('name').to.equal('foo')
        expect(5 > 8).to.be.false
        expect({}).to.be.a('object')
        expect('foo').to.be.a('string')
        expect(3).to.be.a('number')
        expect('bar').to.be.a('string').with.lengthOf(3)
        expect([1,2,3].length).to.equal(3)
        expect(null).to.be.null
        expect(undefined).to.not.exist
        expect(1).to.exist

    }
}
