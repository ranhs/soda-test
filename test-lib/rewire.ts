import { dirname, join, sep} from './path'
import { anyFunction } from './executables'
import * as tslib from 'tslib'
import { setProperty } from './setProperty'
import { createReadConfigurationFile, initConfiguration, readConfiguration, readConfigurationFileName, getBaseDir, SodaTestConfiguration, RewireConfiguration } from './configuration'

const excluded_libs = [
    'soda-test',
    'webpack',
    'get-intrinsic',
    'call-bind'
]

export let isKarma = false

let fs: unknown
let nodeJsInputFileSystem: unknown
let childProcess: unknown
try {
    fs = require('fs')
} catch (err) {
    // when using karma, there is no fs
}
const _init_configuration = (fs)?readConfiguration(fs):null
const _readconfiguration_filename = (fs)?readConfigurationFileName():null

interface Loadable {
    __reload__(module: NodeModule, exports: Record<string,unknown>): boolean
}

interface AnExportObject extends Loadable, Record<string, unknown> {
}

const exportsCache: {[filename: string]: AnExportObject} = {}
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

function varsDefinitions(fileConfiguration: unknown): string {
    let rv = ''
    if ( fileConfiguration && fileConfiguration['insertVars'] ) {
        try {
            for ( const varInfo of fileConfiguration['insertVars']) {
                if (varInfo.name) {
                    rv += `let ${varInfo.name}\n`
                }
            }
        } catch {
            return ''
        }
    }
    return rv
}

// give a file content (as tring) this method added the __get__ and __set__ method to
// code and returned the patch code
function PatchFileContent(fileContent: string | Buffer, filename: string): string | Buffer {
    const fileConfiguration =  (rewire_config && rewire_config.files)? rewire_config.files[filename] : undefined
    const isBuffer = Buffer.isBuffer(fileContent)
    let content: string
    if ( isBuffer ) {
        content = fileContent.toString()
    } else {
        content = fileContent as string
    }
    const light = filename.indexOf('node_modules') >=0
    const ___filename = normalizeFilename(filename)
    if ( filename.endsWith('.js') ) {
        // move the map code after the new code
        const i = content.lastIndexOf('\n')
        let mapCode = ''
        if ( i > 0 && content[i+1] === '/' ) {
            mapCode = content.substr(i+1)
            content = content.substr(0, i)
        }

        content = `${(light)?'':'function __load(module,exports) {'}${content}
Object.__rewireCurrent && Object.__rewireCurrent((exp,value)=>eval(exp),${light},${JSON.stringify(___filename)})
${varsDefinitions(fileConfiguration)}${mapCode}${(light)?'':`
return true;
}
__load(module,exports);`}`
    } else if ( filename.endsWith('.ts') ) {

        content = `${(light)?'':'function __load(module: NodeModule, exports: Record<string, unknown>) {};'}${content}
const __rewireCurrent = eval('Object.__rewireCurrent')
__rewireCurrent && __rewireCurrent((exp: string, value: unknown): unknown => eval(exp),${light},${JSON.stringify(___filename)})
${varsDefinitions(fileConfiguration)}${(light)?'':`

//}
//__load(module,exports)`}`
    }
    
    // turn content back to buffer if need to
    if ( isBuffer ) {
        fileContent = new Buffer(content)
    } else {
        fileContent = content
    }
return fileContent
}

function normalizeFilename(filename: string): string {
    if (filename.startsWith(basePath)) {
        filename = filename.substr(basePath.length)
    }
    filename = filename.replace(/\\/g,'/')
    if ( !filename.startsWith('/') ) filename = `/${filename}`
    return filename
}

// this method is called each time fs.readyFileSync is called
// fs.readFileSync is called when loading a module
// if the file loading is a file that need to be rewired, this code patches the answer
// with the rewire JS code 
function afterReadFileSync(filename: string, encoding: string, result: string | Buffer): string | Buffer {
    if (filename === _readconfiguration_filename) {
        return createReadConfigurationFile(_init_configuration, Buffer.isBuffer(result))
    } 
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
    setProperty(tslib, '__importStar', _importStarHook)
}

export async function init(isKarmaParam = false): Promise<void> {
    isKarma = isKarmaParam
    stubImportStar()
    if ( isKarma ) {
        for (const key of Object.keys(require.cache)) {
            if ( key.endsWith('NodeJsInputFileSystem.js') ) {
                nodeJsInputFileSystem = require.cache[key].exports
                break
            }
        }
    }
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
            const _readFile: (path: string, options: unknown, callback: (err: NodeJS.ErrnoException | null, data: Buffer) => void) => void = fs['readFile'] as never
            if ( _readFile['_hooked'] === 'soda-test') {
                // already hooked
            } else {
                _fs['readFile'] = function (path: string, options: unknown, callback: (err: NodeJS.ErrnoException | null, data: Buffer) => void): void {
                    if ( !callback ) {
                        callback = options as never // options was not specified
                    }
                    _readFile(path, options, (err, data) => {
                        if ( !err ) {
                            data = afterReadFileSync(path, null, data) as Buffer
                            if ( path === 'node_modules/karma-source-map-support/lib/client.js' ) {
                                console.log('patched file', path, '\n', data.toString())
                            }
                        }
                        callback(err, data)
                    })
                }
                _fs['readFile']['_hooked'] = 'soda-test'
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
    // hook Object.defineProeprty
    // make any property define to be configurable, so we can replace it
    // TODO: keep info that the property was not supposed to be configuratble, and allow changing it only if we say the magic word
    const _defineProperty = Object.defineProperty
    init['_defineProperty'] = _defineProperty // for testing
    if ( _defineProperty['_hooked'] !== 'soda-test' ) {
        Object.defineProperty = (o: never, p: PropertyKey, attributes: PropertyDescriptor) => {
            if ( !Object.isExtensible(o) ) return
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
        // if the function does not have a prototype it cannot be a calss, it is a function
        if ( !obj.prototype ) return true
        // if the function prototype has properites (beside 'constructor') is must be a class
        if ( Object.getOwnPropertyNames(obj.prototype).length > 1 ) return false
        // if it derives from something that is not Object, it must be a class
        if ( Object.getPrototypeOf(obj.prototype).constructor !== Object ) return false
        return true
    }

    const _aggregateFunction = function(func: unknown): unknown {
        // no need to aggregate if it is not a function
        if ( !isNonClassFunction(func) ) return func

        if ( func['__org_func__'] ) {
            // this is already the aggregated funcion
            return func
        }

        if ( func['__agg_func__'] ) {
            // there is already an aggregation for this function
            return func['__agg_func__']
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

        // create a aggregation function
        const aggregateFunction = function(...args) {
            return aggregateFunction['__org_func__'].apply(this, args)
        }

        // copy original properites
        Object.defineProperties(aggregateFunction, props)

        // rewire prototypes
        const _orgPrototype = Object.getPrototypeOf(func)
        Object.setPrototypeOf(aggregateFunction, _orgPrototype)
        if ( Object.isExtensible(func) ) {
            Object.setPrototypeOf(func, aggregateFunction)
        }

        // save the original method
        Object.defineProperty(aggregateFunction, '__org_func__', {
            value: func,
            writable: true,
            configurable: true,
            enumerable: false
        })

        // point to aggregator
        Object.defineProperty(func, '__agg_func__', {
            value: aggregateFunction,
            writable: true,
            configurable: true,
            enumerable: false
        })

        return aggregateFunction
    }

    Object['__rewireCurrent'] = function( _eval: (exp: string, value: unknown) => unknown, light: boolean, ___filename: string) {
        function _get(exp: string): unknown {
            try {
                return _eval(exp, null)
            } catch {
                return undefined
            }
        }
        let _module: NodeModule = _get('module') as never
        if ( !_module ) {
            _module = _get('__unused_webpack_module') as never
        }
        if ( !_module ) {
            return
        }
        let __load: (module: NodeModule, exports: Record<string,unknown>) => boolean = undefined
        if ( !light ) __load = _get('__load') as never
        if ( !light ) {
            _module.exports.__set__ = function(name: string, value: unknown) {
                _eval(`${name} = value`, value)
            }
            _module.exports.__get__ = function(name: string) {
                return _eval(name, undefined)
            }
            _module.exports.__reload__ = __load
        }
        Object.defineProperty(_module.exports, '___filename', { value: ___filename, writable: false} )
        if ( isNonClassFunction(_module.exports) ) {
            _module.exports = _aggregateFunction(_module.exports)
        }
        exportsCache[___filename] = _module.exports
    }
    let config: SodaTestConfiguration = require('./readconfiguration') // eslint-disable-line @typescript-eslint/no-var-requires
    if ( config.placeholder) {
        config = readConfiguration(fs)
    } 
    initConfiguration(config)
    rewire_config = rewireConfiguration(config)
}

let rewire_config: RewireConfiguration
const basePath = getBaseDir()
const distPath = join(basePath, 'dist')

function toFullPaths(path: string): string[] {
    path = path.replace('/', sep)
    const path1 = join(distPath, path)
    path = join(basePath, path)
    if ( path.endsWith('.js') || path.endsWith('.ts') ) {
        return [path, path1]
    } else {
        return [
            path + '.js',
            path1 + '.js',
            path + '.ts',
            join(path, 'index.js'),
            join(path1, 'index.js'),
            join(path, 'index.ts')
        ]
    }
}

function rewireConfiguration(config: SodaTestConfiguration): RewireConfiguration {
    const rewireConfiguration: RewireConfiguration = {
        files: {}
    }
    
    const rewireConfig: RewireConfiguration = config.rewire
    for ( const key in rewireConfig.files ) {
        const fullPaths = toFullPaths(key)
        for (const path of fullPaths) {
            rewireConfiguration.files[path] = rewireConfig.files[key]
        }
    }

    return rewireConfiguration
}

function getTargetBasePath(caller: string, libname: string):{targetBasePath: string, fullPath?: string} {
    const callerDirName = dirname(caller)
    const fullPath = join(callerDirName, libname)
    let targetBasePath: string
    // check if we are in webPack
    const wpStrings = ['/_karma_webpack_/webpack:/', '/_karma_webpack_/', '/webpack:/']
    let webpackIndex: number
    let len: number
    for (const wpString of wpStrings ) {
        webpackIndex = fullPath.indexOf(wpString)
        if ( webpackIndex > 0 ) {
            len = wpString.length
            break
        }
    }
    if ( webpackIndex>0 ) {
        targetBasePath = '/' + fullPath.substr(webpackIndex+len)
    } else {
        targetBasePath = normalizeFilename(fullPath)
    }
    return {targetBasePath, fullPath: (webpackIndex>0)?undefined:fullPath}
}

// this method returns teh exports of a libraray (just like require)
// need to pass the original caller file name (for local librarays)
// can be used from other libraries. the result exports might be rewried
export function getLibFromPath(libname: string, caller: string, reload = false): Record<string,unknown> {
    if (libname.startsWith('.')) {
        const {targetBasePath, fullPath} = getTargetBasePath(caller, libname)
        const targetPossiblePaths: string[] = [ 
            targetBasePath, 
            targetBasePath + ".js", 
            join(targetBasePath, "index.js"),
            targetBasePath + ".ts",
            join(targetBasePath, "index.ts")
        ]


        if ( fullPath ) {
                // requireing the raget library to make sure it is in cache 
            // (if it is already loaded, this will not have an effent)
            require(fullPath)
        }
        for ( const path of targetPossiblePaths ) {
            if ( exportsCache[path] ) {
                const _exports = exportsCache[path]
                if ( reload ) {
                    const _module: {exports: Record<string,unknown>} = {exports: {}}
                    if ( !_exports.__reload__(_module as NodeModule,_module.exports) ) {
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
            for (const path in exportsCache) {
                if (path.startsWith(`/node_modules/${libname}/`) || path.startsWith(`/node_modules/${libname}-browserify/`)) {
                    return exportsCache[path]
                }
            }
        }
        const lib = getWebPackLibraray(libname)
        if ( lib ) return lib
        throw err
    }
}

let _webPackMap: Record<string, number[]> = null
function getWebPackLibraray(libname: string): Record<string, unknown> {
    loadWebPackMap()
    const libIds = _webPackMap[libname]
    if ( !libIds ) return null
    let lib: Record<string, unknown> = null
    for ( const id of libIds ) {
        try {
            lib = eval(`__webpack_require__(${id})`)
        } catch {
            lib = null
        }
        if ( lib !== null ) return lib
    }
    return null
}

const WEBPACKREQURESTARTSTR = '__webpack_require__(/*! '
function loadWebPackMap(): void {
    if ( _webPackMap ) return
    let webpackModules: Record<string, ()=>void> = null
    for ( const id in exportsCache ) {
        const alib = exportsCache[id]
        const alibRewire = new LibRewire(alib)
        if ( !alibRewire.isRewired() ) continue
        webpackModules = alibRewire.safeget('__webpack_modules__')
        if ( webpackModules ) break
    }
    _webPackMap = {}
    if ( !webpackModules ) {
        console.error('cannot get the __webpack_modules__')
        return
    }

    // collect all absolute path librarays with there id numbers
    for (const id in webpackModules ) {
        const webpackModuleText = webpackModules[id].toString()
        let j = 0
        while ( true ) {
            j = webpackModuleText.indexOf(WEBPACKREQURESTARTSTR, j)
            if ( j < 0 ) break
            const j1 = webpackModuleText.indexOf(')', j)
            if ( j1 > j ) {
                const map1 = webpackModuleText.substring(j+WEBPACKREQURESTARTSTR.length, j1).split('*/').map(s=>s.trim())
                const libNumberId = Number(map1[1])               
                if ( !map1[0].startsWith('.') && libNumberId) {
                    let ob = _webPackMap[map1[0]]
                    if ( !ob ) {
                        _webPackMap[map1[0]] = ob = []
                    }
                    if ( ob.indexOf(libNumberId) < 0 ) {
                        ob.push(libNumberId)
                    }
                }
            }
            j++;
        }
    }
}

export interface Rewire {
    lib(): Record<string,unknown>
    isRewired(): boolean
    get(name: string): never
    safeget(name: string): never
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

    safeget(name: string): never {
        if ( this._err ) throw this._err
        try {
            return this.get(name)
        } catch {
            return undefined as never
        }
    }

    private setLibValue(name: string, value: unknown): void {
        let restores = this._lib["__restores__"] as Record<string, ()=>void>
        if ( restores === undefined ) {
            this._lib["__restores__"] = restores = {}
        }
        const restore = setProperty(this._lib, name, value)
        if ( Object.keys(restores).indexOf(name) < 0 ) {
            restores[name] = restore
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
            this.setLibValue(name, value)
        }
    }

    restore(): void {
        if ( this._err ) throw this._err
        if ( this._isRewired ) {
            const orgValues = this._lib["__org__"] as Record<string,unknown>
            if ( orgValues !== undefined ) {
                for (const key of Object.keys(orgValues)) {
                    (this._lib["__set__"] as (name: string, value: unknown) => void)(key, orgValues[key])
                }
                delete this._lib["__org__"]
            }
        }
        const restores = this._lib["__restores__"]
        if ( restores !== undefined ) {
            for (const key of Object.keys(restores)) {
                restores[key]()
            }
        }
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

interface AggregationMethod extends anyFunction {
    origin?: anyFunction
    restore?: () => void
}

export function createAggregation(libname: string, methodName: string): AggregationMethod {
    const caller = getCallerFileName(1)

    const rewire = getLibRewire(libname, caller)
    const lib = rewire.lib()

    const aggregateMethod = function(...args: unknown[]): unknown {
        return (lib[methodName] as anyFunction).apply(this, args)
    }

    const aggregate: AggregationMethod = aggregateMethod

    aggregate.origin = lib[methodName] as anyFunction

    lib[methodName] = aggregateMethod

    aggregate.restore = function(): void {
        lib[methodName] = aggregate.origin
    }

    return aggregate
}

