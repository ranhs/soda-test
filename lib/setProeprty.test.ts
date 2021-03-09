// This model do unit testing on the setProperty method (using the soda-test framework)
import { expect, describe, it, TR } from '.'

import { setProperty, targetObj } from '../test-lib/setProperty'
import { init } from '../test-lib/rewire'

// gets the original defineProperty method
const defineProperty: (obj: targetObj, name: string, descriptor: PropertyDescriptor) => targetObj = init['_defineProperty']

@describe('setProperty')
class SetProeprtyTest {

    @it('should create a proepty if does not exist')
    newProp(): TR {
        const obj = {}
        const restore  = setProperty(obj, "foo", 888)
        expect( obj).to.have.property("foo", 888)
        expect(restore).to.exist
        restore()
        expect( obj ).to.not.have.property("foo")
    }

    @it('should replace and restore a simple property')
    existingProp(): TR {
        const obj = { foo: 222 }
        expect( obj ).to.have.property("foo", 222)
        const restore = setProperty(obj, "foo", 888)
        expect( obj ).to.have.property("foo", 888)
        expect(restore).to.exist
        restore()
        expect( obj ).to.have.property("foo", 222)
    }

    @it('should do noting if value is the same')
    sameValue(): TR {
        const obj = { foo: 888 }
        expect( obj ).to.have.property("foo", 888)
        const restore = setProperty(obj, "foo", 888)
        expect( obj ).to.have.property("foo", 888)
        expect(restore).to.be.undefined
    }

    @it('should change read-only value')
    readonlyValue(): TR {
        const obj = { }
        defineProperty(obj, "foo", { value: 222, writable: false, enumerable: true, configurable: true})
        expect( obj ).to.have.property("foo", 222)
        const restore = setProperty(obj, "foo", 888)
        expect( obj ).to.have.property("foo", 888)
        expect(restore).to.exist
        restore()
        expect( obj ).to.have.property("foo", 222)
    }

    @it('cannot change unconfigurable readonly value')
    unconfigurableReadonlyValue(): TR {
        const obj = { }
        defineProperty(obj, "foo", { value: 222, writable: false, enumerable: true, configurable: false})
        expect( obj ).to.have.property("foo", 222)
        if ( Object.getOwnPropertyDescriptor(obj, "foo").configurable ) {
            // cannot create unconfigurable property, nothing to check here
        } else {
            const restore = setProperty(obj, "foo", 888)
            expect( obj ).to.have.property("foo", 222)
            expect(restore).to.be.null
        }
    }

    @it('should change a set/get property')
    updateSetGetProerpty(): TR {
        const obj = { }
        let _foo = 222
        defineProperty(obj, "foo", { get: ()=>_foo, set: (v)=>_foo=v, enumerable: true, configurable: false})
        expect( obj ).to.have.property("foo", 222)
        const restore = setProperty(obj, "foo", 888)
        expect( obj ).to.have.property("foo", 888)
        expect(restore).to.exist
        restore()
        expect( obj ).to.have.property("foo", 222)
    }

    @it('should change a set/get property, even if set is not working')
    updateWhenSetNotWorking(): TR {
        const obj = { }
        defineProperty(obj, "foo", { get: ()=>222, set: ()=>{/**/}, enumerable: true, configurable: true})
        expect( obj ).to.have.property("foo", 222)
        const restore = setProperty(obj, "foo", 888)
        expect( obj ).to.have.property("foo", 888)
        expect(restore).to.exist
        restore()
        expect( obj ).to.have.property("foo", 222)
    }

    @it('should change a get property, even if there is no set')
    updateGetWithoutSetProperty(): TR {
        const obj = { }
        defineProperty(obj, "foo", { get: ()=>222, enumerable: true, configurable: true})
        expect( obj ).to.have.property("foo", 222)
        const restore = setProperty(obj, "foo", 888)
        expect( obj ).to.have.property("foo", 888)
        expect(restore).to.exist
        restore()
        expect( obj ).to.have.property("foo", 222)
    }

    @it('cannnot change a get readonly property, if it is not configurable')
    unconfigurableGetProperty(): TR {
        const obj = { }
        defineProperty(obj, "foo", { get: ()=>222, enumerable: true, configurable: false})
        if ( Object.getOwnPropertyDescriptor(obj, "foo").configurable ) {
            // cannot create unconfigurable property, nothing to check here 
        } else {
            expect( obj ).to.have.property("foo", 222)
            const restore = setProperty(obj, "foo", 888)
            expect( obj ).to.have.property("foo", 222)
            expect(restore).to.be.null
        }
    }
}