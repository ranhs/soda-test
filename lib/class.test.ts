import { expect, describe, context, it, TR, SinonStub, stub, importPrivate } from '.'

import { DerivedClass as ExternalDerivedClass } from './class'

class BaseClass {
    public static constructorCount = 0
    constructor() {
        BaseClass.constructorCount++
    }
}

class DerivedClass extends BaseClass {
    constructor() {
        super()
    }
}

@describe('stubbing the base class')
class StubbingBaseClassTest {

@context('inner model')

    @stub(DerivedClass,'super')
    BaseClassStub: SinonStub

    @it('should stub the call to super class constructor')
    testStub(): TR {
        BaseClass.constructorCount = 0
        new DerivedClass()
        expect(this.BaseClassStub).to.have.been.called
        expect(BaseClass.constructorCount).to.equal(0)
    }

@context('other model')

    @importPrivate('./class', 'BaseClass')
    OtherBaseClass: {constructorCount: number}

    @stub('./class', 'DerivedClass', 'super')
    OtherBaseClassStub: SinonStub

    @it('should stub the call to super class constructor')
    testStubE(): TR {
        this.OtherBaseClass.constructorCount = 0
        new ExternalDerivedClass()
        expect( this.OtherBaseClassStub ).to.have.been.calledOnce
        expect(this.OtherBaseClass.constructorCount).to.equal(0)
    }

@context('cleanup')

    @importPrivate('./class', 'BaseClass')
    OtherBaseClass1: {constructorCount: number}

    @it('should not stub anymore the call to super class constructor, of inner class')
    testStubAfter(): TR {
        BaseClass.constructorCount = 0
        new DerivedClass()
        expect(BaseClass.constructorCount).to.equal(1)
    }

    @it('should not stub anymore the call to super class constructor, of external class')
    testStubEAfter(): TR {
        this.OtherBaseClass1.constructorCount = 0
        new ExternalDerivedClass()
        expect(this.OtherBaseClass1.constructorCount).to.equal(1)
    }

@context('readonly Property')

    @it('not stubbing')
    testReadOnlyProperty(): TR {
        const a = new ExternalDerivedClass()
        expect(a.Kuku).to.equal(17)
    }

    @it('stubbing readonly property')
    testReadOnlyProperty1( @stub('./class', 'DerivedClass', 'Kuku').access(5) ignoreKukuStub: SinonStub) {
        const a = new ExternalDerivedClass()
        expect(a.Kuku).to.equal(5)
    }

    @it('after restoring')
    testReadOnlyProperty2(): TR {
        const a = new ExternalDerivedClass()
        expect(a.Kuku).to.equal(17)
    }

}