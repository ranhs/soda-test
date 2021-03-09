import { expect, describe, it, context, TR, spy, SinonSpy, stub, SinonStub } from '.'
import { createFunc } from './createFunction'

@describe('createFunction')
class createFunctionTest {
    @it('shoud spy on generate-function method')
    spy1(@spy('generate-function') genFuncSpy: SinonSpy): TR {
        const func = createFunc()
        expect(genFuncSpy).to.have.been.calledOnce
        expect(func.toString()).to.equal('function(v) { return v }')
    }

    @it('should stub generate-function method')
    stub1(@stub('generate-function').returns(()=>{return ()=>null}) genFuncStub: SinonStub): TR {
        const func = createFunc()
        expect(genFuncStub).to.have.been.calledOnce
        expect(func.toString()).to.equal('() => null')
    }

    @it('should restore the stub, back to normal')
    resotre1(): TR {
        const func = createFunc()
        expect(func.toString()).to.equal('function(v) { return v }')
    }

@context('spy lib self function')

    @spy('generate-function')
    genFuncSpy: SinonSpy

    @it('should spy on generate-function method')
    spy2(): TR {
        const func = createFunc()
        expect(this.genFuncSpy).to.have.been.calledOnce
        expect(func.toString()).to.equal('function(v) { return v }')
    }

@context('stub lib self function')

    @stub('generate-function').returns( () => {
        return ()=> {
            return null
        }
    })
    genFuncStub: SinonStub

    @it('should stub generate-function method')
    stub2(): TR {
        const func = createFunc()
        expect(this.genFuncStub).to.have.been.calledOnce
        expect(func.toString().split('\n').map(l=>l.trim())).to.deep.equal([
            "() => {",
            "return null;",
            "}"
        ])
    }

@context('after stub was restored')

    @it('should restore the stub, back to normal')
    resotre2(): TR {
        const func = createFunc()
        expect(func.toString()).to.equal('function(v) { return v }')
    }

}