// NODE ONLY
import { expect, describe, it, TR, PTR, SinonStub, createStub, createAgrigation, context, stub, importPrivate, beforeEach, request } from '.'
import * as express from 'express'
const isAuthrizedAgr = createAgrigation('./auth', 'isAuthorized')
const connectStub: SinonStub = createStub('mongoose', 'connect').returns(null)
import { app } from './app'
import { NextFunction } from 'express-serve-static-core'
connectStub.restore()
isAuthrizedAgr.restore()

@describe('app')
class AppTest {

@context('GET /')

    @it('should get /')
    async testGet1(): PTR {
        const response = await request(app).get('/').expect(200)
        expect(response.body).to.have.property('name').to.equal('Foo Fooing Bar')
    }

@context('POST /')

    @it('should call user.create')
    async testPost1(@stub('./users', "createUser").resolves({name:'foo'}) createStub: SinonStub): PTR {
        const response  = await request(app)
            .post('/user')
            .send({name: 'fake'})
            .expect(200)

        expect(createStub).to.have.been.calledOnce
        expect(response.body).to.have.property('name').to.equal('foo')
    }

    @it('should call handleError on error')
    async testPost2(@stub('./users', "createUser").rejects('fake_error') createStub: SinonStub,
                    @stub('./app', "handleError").calls((res: express.Response) => {
                        return res.status(400).json({error: 'fake'})
                    }) errorStub: SinonStub): PTR {
        const response = await request(app)
            .post('/user')
            .send({name: 'fake'})
        expect(createStub).to.have.been.calledOnce
        expect(errorStub).to.have.been.calledOnce
        expect(response.body).to.have.property('error').to.equal('fake')
    }

@context('DELETE /user/:id')

    @stub('./auth', 'isAuthorized').calls((req: express.Request,res: express.Response,next: NextFunction)=>next())
    authStub: SinonStub

    @it('should call auth check function and users.delete on success')
    async checkDelete1(@stub('./users', 'deleteUser').resolves('fake_delete') deleteStub: SinonStub): PTR {
        const response = await request(app).delete('/user/123')
            .expect(200)

        expect(this.authStub).to.have.been.calledOnce
        expect(deleteStub).to.have.been.calledWithMatch(123)
        expect(response.body).to.equal('fake_delete')
    }

    @it('should call handleError on error')
    async checkDelete2(@stub('./users', 'deleteUser').rejects('fake_error') deleteStub: SinonStub,
                    @stub('./app', "handleError").calls((res: express.Response) => {
                        return res.status(400).json({error: 'fake'})
                    }) errorStub: SinonStub): PTR {
        const response = await request(app)
            .delete('/user/123')
        expect(this.authStub).to.have.been.calledOnce
        expect(deleteStub).to.have.been.calledWithMatch(123)
        expect(errorStub).to.have.been.calledOnce
        expect(response.body).to.have.property('error').to.equal('fake')
    }

@context('hanldeError')
    @stub().returns('done')
    jsonStub: SinonStub

    @stub().construct({json: 'jsonStub'})
    statusStub: SinonStub

    @importPrivate('./app', 'handleError')
    handleError: (res: express.Response<unknown>, err: Error) => void

    res: express.Response<unknown>  | { status: SinonStub }

    @beforeEach()
    beforeEach1(): void {
        this.res = { status: this.statusStub }
    }

    @it('should check error instance and format message')
    checkHanldeError1(): TR {
        this.handleError(this.res as express.Response<unknown>, new Error('fake'))

        expect(this.statusStub).to.have.been.calledWith(400)
        expect(this.jsonStub).to.have.been.calledWith({error:'fake'})
    }

    @it('should return object without chaing it if not instance of error')
    checkHandleError2(): TR {
        this.handleError(this.res as express.Response<unknown>, {id: 1, message: 'fake error'} as never)

        expect(this.statusStub).to.have.been.calledWith(400)
        expect(this.jsonStub).to.have.been.calledWith({id:1, message:'fake error'})
    }
}