import { dirname, join, sep} from 'path'
import { anyFunction } from './executables'
import * as tslib from 'tslib'

const excluded_libs = [
    'soda-test',
    'webpack',
    'get-intrinsic',
    'call-bind'
]

let fs: unknown
let nodeJsInputFileSystem: unknown
let childProcess: unknown
try {
    fs = require('fs')
} catch (err) {
    // when using karma, there is no fs
}
try {
    childProcess = require('child_process')
} catch (err) {
}
// return the full path of the filename that called this method
// level is the number of calls to move back in the stack
export function getCallerFileName(level: number): string {
    const stack = (new Error()).stack
    const stackLine = stack.split('\n')[level+2]
    let s = stackLine.lastIndexOf('(')
    let e: number
    if ( s < 0 ) {
        s = stackLine.indexOf('at ') + 2
        e = stackLine.length
    } else {
        e = stackLine.lastIndexOf(')')
    }
    e = stackLine.lastIndexOf(':', e-1)
    e = stackLine.lastIndexOf(':', e-1)
    return stackLine.substring(s+1,e)
}

function isExcludedLib(filename: string): boolean {
    for ( const name of excluded_libs ) {
        if ( filename.indexOf(`${sep}node_modules${sep}${name}${sep}`) >=0 )
            return true
    }
    return false
}

function rewireIsNeeded(filename: string): boolean {
    if ( !filename.endsWith('.js') && !filename.endsWith('.ts') ) return false
    if ( filename.endsWith('d.ts') ) return false
    if ( isExcludedLib(filename) ) return false
    if ( filename.indexOf('node_modules') >= 0 ) return true // light rewire
    if ( filename.endsWith('.test.js') ) return false
    if ( filename.endsWith('.test.ts') ) return false
    if ( filename.endsWith('.spec.js') ) return false
    if ( filename.endsWith('.spec.ts') ) return false
    if ( filename.endsWith('jest.config.js') ) return false
    return true
}

// give a file content (as tring) this method added the __get__ and __set__ method to
// code and returned the patch code
function PatchFileContent(fileContent: string | Buffer, filename: string): string | Buffer {
    const isBuffer = Buffer.isBuffer(fileContent)
    let content: string
    if ( isBuffer ) {
        content = fileContent.toString()
    } else {
        content = fileContent as string
    }
    const light = filename.indexOf('node_modules') >=0
    if ( filename.endsWith('.js') ) {
        // move the map code after the new code
        const i = content.lastIndexOf('\n')
        let mapCode = ''
        if ( i > 0 && content[i+1] === '/' ) {
            mapCode = content.substr(i+1)
            content = content.substr(0, i)
        }
        if ( light ) {
            content = `${content}
Object.__rewireCurrent && Object.__rewireCurrent(require['cache'][module.id] || module, (exp,value)=>eval(exp), true, null)
${mapCode}`
        } else {
            content = `function __load(module,exports) {${content}

Object.__rewireCurrent && Object.__rewireCurrent(require['cache'][module.id] || module, (exp,value)=>eval(exp), false, __load)
return true
}
__load(module,exports)
${mapCode}`
        }

    } else if ( filename.endsWith('.ts') ) {
        if ( light ) {
            content = `${content}
Object['__rewireCurrent'] && Object['__rewireCurrent'](require['cache'][module.id] || module, (exp,value)=>eval(exp), true, null)
`
        } else {
            content = `function __load(module,exports) {} ${content}

Object['__rewireCurrent'] && Object['__rewireCurrent'](require['cache'][module.id] || module, (exp,value)=>eval(exp), false, __load)
//}
//__load(module,exports)
`            
        }
    }

    // turn content back to buffer if need to
    if ( isBuffer ) {
        fileContent = new Buffer(content)
    } else {
        fileContent = content
    }
return fileContent
}

// this method is called each time fs.readyFileSync is called
// fs.readFileSync is called when loading a module
// if the file loading is a file that need to be rewired, this code patches the answer
// with the rewire JS code 
function afterReadFileSync(filename: string, encoding: string, result: string | Buffer): string | Buffer {
    if ( rewireIsNeeded(filename) ) {
        // this file is JS file that is not a test file and is not under node_modules, need to rewire it
        result = PatchFileContent(result, filename)
    }
    return result
}

function stubImportStar(): void {
    if ( !tslib || !tslib.__importStar || tslib.__importStar['hook'] === "soda-test" ) return
    const _importStar = tslib.__importStar
    const _importStarHook  = function(mod: unknown): unknown { // eslint-disable-line @typescript-eslint/no-unused-vars
        const rv = _importStar(mod)
        if ( rv === mod ) return rv
        if ( !Object.getOwnPropertyDescriptor(mod, 'soda-test-star') )
            Object.defineProperty(mod, 'soda-test-star', { value: [], writable: false, enumerable: false, configurable: true })
        mod['soda-test-star'].push(rv)
        return rv
    }
    _importStar['hook'] = "soda-test"
    eval('tslib.__importStar = _importStarHook')
}

export async function init(isKarma = false): Promise<void> {
    stubImportStar()
    if ( isKarma ) {
        for (const key of Object.keys(require.cache)) {
            if ( key.endsWith('NodeJsInputFileSystem.js') ) {
                nodeJsInputFileSystem = require.cache[key].exports
                break
            }
        }
    }
    const ModulePrototype = Object.getPrototypeOf(module)
    if ( ModulePrototype.require && !ModulePrototype.require._hooked && fs) {
        const _require = ModulePrototype.require
        let rewirePath = true
        ModulePrototype.require = function(path: string): Record<string, unknown> {
            const _rewirePath = rewirePath
            if ( !path.startsWith('.') || getCallerFileName(2).indexOf('\\node_modules\\') >0 ) {
                rewirePath = false
            }
            const _exports = _require.bind(this)(path)
            rewirePath = _rewirePath
            return _exports
        }
        ModulePrototype.require._hooked = 'soda-test'
        if ( nodeJsInputFileSystem ) {
            const _readFileSync: (filename: string, encoding: string) => string | Buffer = nodeJsInputFileSystem['prototype'].readFileSync
            if ( _readFileSync['_hooked'] === 'soda-test') {
                // already hooked
            } else {
                nodeJsInputFileSystem['prototype'].readFileSync = function(filename: string, encoding: string): string | Buffer {
                    const result = _readFileSync(filename, encoding)
                    return afterReadFileSync(filename, encoding, result)
                }
            }
        } else {
            if ( fs ) {
                // hook the fs.readFileSync to call method after it
                const _fs = fs
                const _readFileSync: (filename: string, encoding: string) => string = fs['readFileSync'] as never
                if ( _readFileSync['_hooked'] === 'soda-test') {
                    // already hooked
                } else {
                    _fs['readFileSync'] = function(filename: string, encoding: string): string {
                        const result: string = _readFileSync(filename, encoding)
                        return afterReadFileSync(filename, encoding, result) as string
                    }
                    _fs['readFileSync']['_hooked'] = 'soda-test'
                }
            }
            if ( childProcess ) {
                // hook the child_process.fork to init rewire on jest chid processes
                const _fork: (modulePath: string, args?: ReadonlyArray<string>, options?: unknown) => unknown = childProcess['fork'] as never
                if ( _fork['_hooked'] === 'soda-test') {
                    // already hooked
                } else {
                    childProcess['fork'] = function(modulePath: string, args?: ReadonlyArray<string>, options?: unknown): unknown {
                        const i = __dirname.indexOf('node_modules')
                        const s = __dirname[i-1]
                        if ( modulePath ===`${__dirname.substr(0,i)}node_modules${s}jest-worker${s}build${s}workers${s}processChild.js`) {
                            modulePath = `${__dirname}${s}processChild.js`
                        }
                        return _fork(modulePath, args, options)
                    }
                    childProcess['fork']['_hooked'] = 'soda-test'
                }
            }
        }
    }
    // hook Object.defineProeprty
    // make any property define to be configurable, so we can replace it
    // TODO: keep info that the property was not supposed to be configuratble, and allow changing it only if we say the magic word
    const _defineProperty = Object.defineProperty
    init['_defineProperty'] = _defineProperty // for testing
    if ( _defineProperty['_hooked'] !== 'soda-test' ) {
        Object.defineProperty = (o: unknown, p: PropertyKey, attributes: PropertyDescriptor) => {
            const desc = Object.getOwnPropertyDescriptor(o,p)
            if ( desc && !desc.configurable ) {
                return _defineProperty(o, p, attributes)
            } else {
                return _defineProperty(o, p, {...attributes, configurable: true})
            }
        }
        Object.defineProperty['_hooked'] = 'soda-test'
    }

    function isNonClassFunction(obj: unknown): boolean {
        if ( typeof obj !== 'function' ) return false
        if ( !obj.toString().startsWith('function') ) return false
        // not handing native code
        if ( obj.toString().indexOf('[native code]')>=0 ) return false
        // if the function prototype has properites (beside 'constructor') is must be a class
        if ( Object.getOwnPropertyNames(obj.prototype).length > 1 ) return false
        // if it derives from something that is not Object, it must be a class
        if ( Object.getPrototypeOf(obj.prototype).constructor !== Object ) return false
        return true
    }

    const _agrigateFunction = function(func: unknown): unknown {
        // no need to agrigate if it is not a function
        if ( !isNonClassFunction(func) ) return func

        if ( func['__org_func__'] ) {
            // this is already the agrigated funcion
            return func
        }

        if ( func['__agr_func__'] ) {
            // there is already an agrigation for this function
            return func['__agr_func__']
        }

        // get all properties of the function 
        const props = Object.getOwnPropertyDescriptors(func)
        // remove function related properties
        delete props['arguments']
        delete props['caller']
        delete props['prototype']
        // make sure the properties are configuratable
        for (const key of Object.keys(props)) {
            props[key].configurable = true
        }

        // create a agrigation function
        const agrigateFunction = function(...args) {
            return agrigateFunction['__org_func__'].apply(this, args)
        }

        // copy original properites
        Object.defineProperties(agrigateFunction, props)

        // rewire prototypes
        const _orgPrototype = Object.getPrototypeOf(func)
        Object.setPrototypeOf(agrigateFunction, _orgPrototype)
        Object.setPrototypeOf(func, agrigateFunction)

        // save the original method
        Object.defineProperty(agrigateFunction, '__org_func__', {
            value: func,
            writable: true,
            configurable: true,
            enumerable: false
        })

        // point to agrigator
        Object.defineProperty(func, '__agr_func__', {
            value: agrigateFunction,
            writable: true,
            configurable: true,
            enumerable: false
        })

        return agrigateFunction
    }

    Object['__rewireCurrent'] = function(_module: NodeModule, _eval: (exp: string, value: unknown) => unknown, light: boolean, __load?: (module: NodeModule, exports: unknown) => void) {
        if ( !light ) {
            _module.exports.__set__ = function(name: string, value: unknown) {
                _eval(`${name} = value`, value)
            }
            _module.exports.__get__ = function(name: string) {
                return _eval(name, undefined)
            }
            _module.exports.__reload__ = __load
        }
        if ( isNonClassFunction(_module.exports) ) {
            _module.exports = _agrigateFunction(_module.exports)
        }
    }
}

function getTargetBasePath(caller: string, libname: string):{targetBasePath: string, webpackIndex: number} {
    const callerDirName = dirname(caller)
    let targetBasePath = join(callerDirName, libname)
    // check if we are in webPack
    let webpackIndex = targetBasePath.indexOf('/_karma_webpack_/')
    if ( webpackIndex>0 ) {
        targetBasePath = './' + targetBasePath.substr(webpackIndex+17)
    }
    webpackIndex = targetBasePath.indexOf('/webpack:/');
    if (webpackIndex > 0) {
        targetBasePath = './' + targetBasePath.substr(webpackIndex + 10);
    }
    return {targetBasePath, webpackIndex}
}

// this method returns teh exports of a libraray (just like require)
// need to pass the original caller file name (for local librarays)
// can be used from other libraries. the result exports might be rewried
export function getLibFromPath(libname: string, caller: string, reload = false): Record<string,unknown> {
    if (libname.startsWith('.')) {
        const {targetBasePath, webpackIndex} = getTargetBasePath(caller, libname)
        const targetPossiblePaths: string[] = [ 
            targetBasePath, 
            targetBasePath + ".js", 
            join(targetBasePath, "index.js"),
            targetBasePath + ".ts",
            join(targetBasePath, "index.ts")
        ]


        if ( webpackIndex < 0 ) {
                // requireing the raget library to make sure it is in cache 
            // (if it is already loaded, this will not have an effent)
            require(targetBasePath)
        }
        for ( const path of targetPossiblePaths ) {
            if ( require.cache[path] ) {
                const _exports = require.cache[path].exports
                if ( reload ) {
                    const _module: {exports: {[key:string]:unknown}} = {exports: {}}
                    if ( undefined === _exports.__reload__(_module,_module.exports) ) {
                        throw new Error(`reloading module is not supported for ${libname}`)
                    }
                    return _module.exports
                }
                return _exports
            }
        }
        throw new Error(`could not find libraray ${libname}`)
    }
    // node_modles lib, just return it
    try {
        return require(libname)
    } catch ( err ) {
        if ( err.code === 'MODULE_NOT_FOUND' ) {
            // search for the module
            for (const path in require.cache) {
                if (path.startsWith(`./node_modules/${libname}/`)) {
                    return require.cache[path].exports
                }
            }
        }
        throw err
    }
}

export interface Rewire {
    lib(): Record<string,unknown>
    isRewired(): boolean
    get(name: string): never
    set(name: string, value: unknown): void
    restore(): void
}

class LibRewire implements Rewire {
    _isRewired: boolean

    constructor(private _lib: Record<string,unknown>, private _err: Error = undefined) {
        this._isRewired = _lib && !!_lib["__set__"]
    }

    lib(): Record<string,unknown> {
        if ( this._err ) throw this._err
        return this._lib
    }

    isRewired(): boolean {
        if ( this._err ) throw this._err
        return this._isRewired
    }

    get(name: string): never {
        if ( this._err ) throw this._err
        if (this._isRewired) {
            const v: never = (this._lib["__get__"] as (name: string) => never)(name)
            return v
        }
        return this._lib[name] as never
    }

    private setLibValue(name: string, value: unknown): void {
        // check if we can change the property
        const desc = Object.getOwnPropertyDescriptor(this._lib, name)
        if ( desc && desc.get && !desc.set ) {
            // to change this value, we need to redefine its proeprty descriptor
            // first we need to save its current descriptor (unless we want to restore it)
            let orgDescriptors = this._lib["__orgDescriptors__"] as Record<string,PropertyDescriptor>
            if ( orgDescriptors === undefined ) {
                this._lib["__orgDescriptors__"] = orgDescriptors = {}
            }
            if ( orgDescriptors["name"] && orgDescriptors["name"].get && orgDescriptors["name"].get == value) {
                // need to restore the original descriptor
                Object.defineProperty(this._lib, name, orgDescriptors["name"])
                delete orgDescriptors["name"]
                return
            }
            // save the current descriptor
            orgDescriptors["name"] = desc
            // redefine the descriptor
            Object.defineProperty(this._lib, name, {...desc, get: ()=>value})
            return
        }
        // this property can be set, just do it
        if ( value === undefined ) {
            delete this._lib[name]
        } else {
            this._lib[name] = value
        }
    }

    set(name: string, value: unknown): void {
        if ( this._err ) throw this._err
        let orgValues = this._lib["__org__"] as Record<string,unknown>
        if ( orgValues === undefined ) {
            this._lib["__org__"] = orgValues = {}
        }
        if ( this._isRewired ) {
            const prevValue = (this._lib["__get__"] as (name: string) => never)(name)
            if ( Object.keys(orgValues).indexOf(name) < 0 ) {
                orgValues[name] = prevValue
            }
            (this._lib["__set__"] as (name: string, value: unknown) => void)(name, value)
            if ( this._lib[name] !== value ) {
                this.setLibValue(name, value)
            }
        } else {
            const prevValue = this._lib[name]
            if ( Object.keys(orgValues).indexOf(name) < 0 ) {
                orgValues[name] = prevValue
            }
            this.setLibValue(name, value)
        }
    }

    restore(): void {
        if ( this._err ) throw this._err
        const orgValues = this._lib["__org__"] as Record<string,unknown>
        if ( orgValues === undefined ) return
        for (const key of Object.keys(orgValues)) {
            this.set(key, orgValues[key])
        }
        delete this._lib["__org__"]
    }
}

export function getLibRewire(libname: string, caller: string): Rewire {
    try {
        const lib: Record<string,unknown> = getLibFromPath(libname, caller)
        return new LibRewire(lib)
    }
    catch (err) {
        return new LibRewire(null, err)
    }
}

export function reloadLibRewire(libname: string, caller: string): Rewire {
    try {
        const libOriginal: Record<string,unknown> = getLibFromPath(libname, caller, false)
        const libReloaded: Record<string,unknown> = getLibFromPath(libname, caller, true)
        const rewire = new LibRewire(libReloaded)
        const libBackup: Record<string,unknown> = {}
        for ( const key in libOriginal ) {
            libBackup[key] = libOriginal[key]
            libOriginal[key] = libReloaded[key]
        }
        const restore = rewire.restore
        rewire.restore = (): void => {
            for ( const key in libBackup ) {
                libOriginal[key] = libBackup[key]
            }
            if ( restore ) restore.bind(rewire)()
            if ( libReloaded['__restore'] ) (libReloaded['__restore'] as () => void)()
        }
        return rewire
    } catch (err) {
        return new LibRewire(null, err)        
    }
}

interface AgrigationMethod extends anyFunction {
    origin?: anyFunction
    restore?: () => void
}

export function createAgrigation(libname: string, methodName: string): AgrigationMethod {
    const caller = getCallerFileName(1)

    const rewire = getLibRewire(libname, caller)
    const lib = rewire.lib()

    const agrigateMethod = function(...args: unknown[]): unknown {
        return (lib[methodName] as anyFunction).apply(this, args)
    }

    const agrigate: AgrigationMethod = agrigateMethod

    lib[methodName] = agrigateMethod

    agrigate.origin = lib[methodName] as anyFunction

    agrigate.restore = function(): void {
        lib[methodName] = agrigate.origin
    }

    return agrigate
}