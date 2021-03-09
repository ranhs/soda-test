import { expect, describe, context, it, TR, PTR, spy, SinonSpy, SinonStub, stub, Done } from '.'

import { add, addCallbck, addPromise, foo, bar, dividePromise } from './demo'


@describe('demo')
class TestDemoTest {

@context('add')

    @it('should add two numbers')
    addBasic(): TR {
        expect(add(1,2)).to.equal(3)
    }

@context('callback add')

    @it('should test the callback')
    addWithCallback(done: Done): TR {
        addCallbck(1,2, (err,result) => {
            expect(err).to.not.exist
            expect(result).to.equal(3)
            done()
        })

    }

@context('test promise')

    @it('should add with promise cb')
    addWithPromise(done: Done): TR {
        addPromise(1,2).then((result) => {
            expect(result).to.equal(3)
            done()
        }).catch( (err)=> {
            console.log('error', err)
            done(err)
        })
    }

    @it('should test a promise with return')
    addReturnAPromise(): Promise<TR> {
        return addPromise(1,2).then((result)=>{
            expect(result).to.equal(3)
        })
    }

    @it('should test a promise with async await')
    async addWithAsyncAwait(): PTR {
        const result: number = await addPromise(1,2)
        expect(result).to.equal(3)
    }

    @it('should test a promise with chai-as-promise')
    async addWithChaiAsPromise(): PTR {
        await expect(addPromise(1,2)).to.eventually.equal(3)
    }

@context('divide')

    @it('should test a promise with chai-as-promise (divide success)')
    async divideSuccess(): PTR {
        await expect(dividePromise(4,2)).to.eventually.equal(2)
    }

    @it('should test a promise with chai-as-promise (divide fails)')
    async divideFails(): PTR {
        await expect(dividePromise(4,0)).to.eventually.rejectedWith('cannot divide by 0')
    }

@context('sinons')

    @it('should spy on log')
    logSpy( @spy(console, 'log') consoleLogSpy: SinonSpy ): TR {
        foo()
        expect(consoleLogSpy.calledOnce).to.be.true
        expect(consoleLogSpy).to.have.been.calledOnce
    }

    @it('should stub console.warn')
    warnStub( @stub(console, 'warn').calls(() => console.log('message from sub')) consoleWarnStub: SinonStub ): TR {
        foo()
        expect(consoleWarnStub).to.have.been.calledOnce
        expect(consoleWarnStub).to.have.been.calledWith('console.warn was called')
    }

@context('stub private function')

    @it('should stub createFile')
    async privateStub( @stub('./demo', 'createFile').resolves('create_stub') createfileStub: SinonStub, 
                       @stub('./demo', 'callDB').resolves('calldb_stub') callDbStub: SinonStub ): PTR {
        const result = await bar('test.txt')


        expect(result).to.equal('calldb_stub')
        expect(createfileStub).to.have.been.calledOnce
        expect(createfileStub).to.have.been.calledWith('test.txt')
        expect(callDbStub).to.have.been.calledOnce
    }

}

