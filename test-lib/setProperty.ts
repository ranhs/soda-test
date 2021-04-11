export type targetObj = Record<string, unknown>

// set property of the given object to the given value, include the property on the "star" 
// objects, if exist
export function setProperty(obj: targetObj, name: string, value: unknown): () => void {
    const rv = setPropertyInternal(obj, name, value)
    if ( rv === null || !obj['soda-test-star'] ) return rv
    const rvs: (() => void)[] = []
    for ( const starlib of obj['soda-test-star'] as targetObj[]) {
        const rv1 = setPropertyInternal(starlib, name, value)
        if ( rv1 ) rvs.push(rv1)
    }
    if ( rvs.length === 0 ) return rv
    return () => {
        rv && rv()
        rvs.forEach( rv => rv() )
    }
}

// set the property with the given name on the given object to the given value
// this method hanlds the case of read-only property.
// if the property is already set to the given value, this method returns undefined
// if the preopty cannot be set this method returns null
// if the property was set this method return a restore method to set it back to what it was
function setPropertyInternal(obj: targetObj, name: string, value: unknown): () => void {
    try {
        if ( !obj || typeof obj !== "object" && typeof obj !== "function") return null
        const descriptor  = Object.getOwnPropertyDescriptor(obj, name)
        if ( !descriptor ) {
            // the property does not exit
            obj[name] = value
            return () => {
                delete obj[name]
            }
        }
        if ( obj[name] === value ) {
            // the property already has the requested value
            return undefined
        }
        if ( descriptor.writable === true ) {
            // this is a writable proeprty
            const oldValue = obj[name]
            obj[name] = value
            return () => {
                obj[name] = oldValue
            }
        }
        if ( descriptor.writable === false ) {
            // this is a readonly property
            if ( descriptor.configurable ) {
                // reconfigure the property to have the requsted value
                Object.defineProperty(obj, name, {...descriptor, value})
                return () => {
                    Object.defineProperty(obj, name, descriptor)
                }
            } else {
                // readonly property that cannot be configured
                return null
            }
        }
        if ( descriptor.get ) {
            // this property has a get method
            if ( descriptor.set ) {
                // this proeprty has a set method too, try to use it to replace the value
                const oldValue = obj[name]
                obj[name] = value
                if ( obj[name] === value ) {
                    // the value was updated as needed
                    return () => {
                        obj[name] = oldValue
                    }
                }
            }
            // there is no set method, or set did not do the work
            if ( descriptor.configurable ) {
                // replace the get method with one that shall return the value we want
                Object.defineProperty(obj, name, {...descriptor, get: (): unknown => value})
                return () => {
                    Object.defineProperty(obj, name, descriptor)
                }
            } else {
                // connot reconfigure the get method
                return null
            }
            // if we got here, the propety exist, but is is not by value and does not have a get method
            // maybe it is a write only property. Anyway, there is nothing we can do
            return null
        }
    } catch {
        // somethind went wrong
        return null
    }
}