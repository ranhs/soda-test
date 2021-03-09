import { expect, describe, context, it, TR, SinonStub, SinonSpy, stub, spy } from '.'

import { parseFunctionSample } from './parse'

let arg: unknown

@describe('parse')
class ParseTest {
    beforeEach() {
        arg = undefined
    }

@context('stub-members')

    @stub().calls((callback: () => unknown) => arg = callback())
    useStub: SinonStub

    @stub('parse-function').construct({use: 'useStub'})
    parseFunctionStub: SinonStub

    @it('it should call parse-function (using stubs)')
    parse1(): TR {
        parseFunctionSample(()=>'DUMMY_CALLBACK')
        expect(this.parseFunctionStub).to.have.been.calledOnce
        expect(this.useStub).to.have.been.calledOnce
        expect(arg).to.equal('DUMMY_CALLBACK')
    }

@context('stub-arguments')
    @it('it should call parse-function (using stubs)')
    parse2(@stub().calls((callback: () => unknown) => arg = callback()) useStub: SinonStub,
        @stub('parse-function').construct({use: 'useStub'}) parseFunctionStub: SinonStub): TR {
        parseFunctionSample(()=>'DUMMY_CALLBACK')
        expect(parseFunctionStub).to.have.been.calledOnce
        expect(useStub).to.have.been.calledOnce
        expect(arg).to.equal('DUMMY_CALLBACK')
    }

@context('spy-members')

    @spy('parse-function')
    parseFunctionSpy: SinonSpy

    @it('it should call parse-function (using spy)')
    parse3(): TR {
        parseFunctionSample(()=>arg = 'DUMMY_VALUE')
        expect(this.parseFunctionSpy).to.have.been.calledOnce
        expect(arg).to.equal('DUMMY_VALUE')
    }

@context('spy-arguments')

    @it('it should call parse-function (using spy)')
    parse4(@spy('parse-function') parseFunctionSpy: SinonSpy): TR {
        parseFunctionSample(()=>arg = 'DUMMY_VALUE')
        expect(parseFunctionSpy).to.have.been.calledOnce
        expect(arg).to.equal('DUMMY_VALUE')
    }

}