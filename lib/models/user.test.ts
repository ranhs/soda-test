import { expect, describe, it, TR, PTR, } from '..'

import { User } from './user'

@describe('User model')
class UserModelsTest {

    @it('should return error if required areas are missing')
    async Validate1(): PTR {
        const user = new User()

        const err = await expect( user.validate() ).to.eventually.rejected
        expect(err.errors.name).to.exist
        expect(err.errors.email).to.exist
        expect(err.errors.age).to.not.exist
    }

    @it('should have optional age field')
    hasOptional(): TR {
        const user = new User({
            name: 'foo',
            email: 'foo@bar.com',
            age: 35
        })

        expect(user).to.have.property('age').to.equal(35)
        expect(user).to.have.property('name').to.equal('foo')
        expect(user).to.have.property('email').to.equal('foo@bar.com')
    }
    
    @it('should not have have optional age field')
    noOptional(): TR {
        const user = new User({
            name: 'foo',
            email: 'foo@bar.com'
        })

        expect(user.age).to.not.exist
        expect(user).to.have.property('name').to.equal('foo')
        expect(user).to.have.property('email').to.equal('foo@bar.com')
    }

}