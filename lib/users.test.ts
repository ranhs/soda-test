import { expect, describe, context, it, TR, PTR, Done, SinonStub, stub, SinonSandbox, sandbox, beforeEach } from '.'

import { get, deleteUser, createUser, updateUser, resetPassword } from './users'
import { User, UserInterface } from './models/user'

const sampleUserBase: UserInterface = {
    name: "foo",
    email: 'foo@bar.com',
    age: 12
}

interface UserEx extends UserInterface {
    id: number
    save?: SinonStub
}

const sampleUser: UserEx = {
    ...sampleUserBase,
    id: 123,
}


@describe('users')
class UsersTest {
    
    @sandbox()
    sandbox: SinonSandbox

@context('get')

    @stub(User, "findById").resolves(sampleUser)
    findStub: SinonStub

    @it('should check for an id')
    CheckId(done: Done): TR {
        get(null).then( () => {
            done(new Error('expected for fail'))
        }).catch((err)=> {
            expect(err).to.exist
            expect(err.message).to.equal('Invalid user id')
            done()
        })
    }

    @it('should call findById with id and return result')
    CheckResult(done: Done): TR {
        this.findStub.yields(null, {name: 'foo'})

        get(123).then((result)=>{
            expect(this.findStub).to.have.been.calledOnce
            expect(this.findStub).to.have.been.calledWith(123)
            expect(result).to.be.a('object')
            expect(result).to.have.property('name').to.equal('foo')

            done()
        }).catch((err) => {
            done(err)
        })
    }

    @it('should catch error if there is one')
    CheckError(done: Done): TR {
        this.findStub.yields(new Error('fake'))

        get(123).then( () => {
            done(new Error('expected to fail'))
        }).catch( (err) => {
            expect(err).to.exist
            expect(err).to.instanceOf(Error)
            expect(this.findStub).to.have.been.calledWith(123)
            expect(err.message).to.equal('fake')
            done()
        })
    }

@context('delete user')


    @stub(User, 'remove').resolves('fake_remove_result')
    deleteStub: SinonStub

    @it('should check for an id using return')
    async CheckDeleteId(): PTR {
        try {
            await deleteUser(null)
            throw new Error('unexpected sucess')
        } catch (ex) {
            expect (ex).to.be.instanceOf(Error)
            expect(ex.message).to.equal('Invalid id')
        }

    }

    @it('should check for error using eventually')
    async CheckDeleteEventually(): PTR {
        return await expect(deleteUser(null)).to.eventually.be.rejectedWith('Invalid id')
    }

    @it('should call deleteUser')
    async CallDeleteUser(): PTR {
        const result = await deleteUser(123)

        expect(result).to.equal('fake_remove_result')
        expect(this.deleteStub).to.have.been.calledWith({_id: 123})
    }
   
@context('create user')

    @it('should reject invalid args')
    async CheckArguments(): PTR {
        await expect(createUser(null)).to.eventually.be.rejectedWith('Ivalid arguments')
        await expect(createUser({name: 'foo', email:null})).to.eventually.be.rejectedWith('Ivalid arguments')
        await expect(createUser({email: 'foo@bar.com', name:null})).to.eventually.be.rejectedWith('Ivalid arguments')
    }

    @stub().resolves(sampleUser)
    saveStub: SinonStub
    
    @stub('./models/user', 'User').construct({save: "saveStub"})
    FakeUserClass: SinonStub

    @stub('./mailer', 'sendWelcomeEmail').resolves('fake_email')
    mailerStub: SinonStub

    @it('should call User with new (members stubs)')
    async callNewUser1(): PTR {
        await createUser(sampleUserBase)
        expect(this.FakeUserClass).to.have.been.calledWithNew
        expect(this.FakeUserClass).to.have.been.calledWith(sampleUserBase)
        expect(this.saveStub).to.have.been.calledOnce
        expect(this.mailerStub).to.have.been.calledOnce
    }

    @it('should call User with new (arguments stubs)')
    async callNewUser2(@stub().resolves(sampleUser) saveStub1: SinonStub,
                      @stub('./models/user', 'User').construct({save: "saveStub1"}) FakeUserClass1: SinonStub,
                      @stub('./mailer', 'sendWelcomeEmail').resolves('fake_email') mailerStub1: SinonStub): PTR {
        await createUser(sampleUserBase)
        expect(FakeUserClass1).to.have.been.calledWithNew
        expect(FakeUserClass1).to.have.been.calledWith(sampleUserBase)
        expect(saveStub1).to.have.been.calledOnce
        expect(mailerStub1).to.have.been.calledOnce
    }

    @it('should save the user')
    async saveTheUser(): PTR {
        await createUser(sampleUserBase)
        expect(this.saveStub).to.have.been.called
    }

    @it('should call mailer with email and name')
    async callMailer(): PTR {
        await createUser(sampleUserBase)
        expect(this.mailerStub).to.have.been.calledWith(sampleUserBase.email, sampleUserBase.name)
    }

    @it('should reject erros')
    async rejectErrors(): PTR {
        this.saveStub.rejects(new Error('fake'))
        await expect(createUser(sampleUserBase)).to.eventually.be.rejectedWith('fake')
    }
    
@context('update user')

    @stub(User, 'findById').calls((id, callback: (a: unknown, b: unknown) => void)=>callback(null,sampleUser))
    findStub1: SinonStub

    @stub().resolves()
    userSaveStub: SinonStub

    @beforeEach()
    beforeEach1(): void {
        sampleUser.save = this.userSaveStub
    }

    @it('should find user by id')
    async findUserById(): PTR {
        await updateUser(123, {name: undefined, email: undefined, age:35})

        expect(this.findStub1).to.have.been.calledWith(123)
    }

    @it('should call user.save')
    async userSaveCalled(): PTR {
        await updateUser(123, {name: undefined, email: undefined, age:35})

        expect(this.userSaveStub).to.have.been.calledOnce
    }

    @it('should reject if there is an error')
    async findUserFailure(): PTR {
        this.findStub1.throws(new Error('fake'))

        await expect(updateUser(123, {name: undefined, email: undefined, age:35})).to.eventually.be.rejectedWith('fake')
    }

@context('reset password')

    @stub('./mailer', 'sendPasswordResetEmail').resolves('reset')
    resetStub:  SinonStub

    @it('should check for email')
    async checkEmail(): PTR {
        await expect( resetPassword(null) ).to.eventually.be.rejectedWith('Invalid email')
    }

    @it('should call sendPasswordReset')
    async callSendPasswordReset(): PTR {
        await resetPassword('foo@bar.com')

        expect(this.resetStub).to.have.been.calledWith('foo@bar.com')
    }
}
