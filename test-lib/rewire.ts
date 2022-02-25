import { dirname, join, sep} from './path'
import { anyFunction } from './executables'
import { setProperty } from './setProperty'
import { createReadConfigurationFile, initConfiguration, readConfiguration, readConfigurationFileName, getBaseDir, SodaTestConfiguration, RewireConfiguration } from './configuration'
import { WebPackTree } from './webPackTree'

const excluded_libs = [
    'soda-test',
    'webpack',
    'get-intrinsic',
    'call-bind',
    'jest',
    'jest-worker'
]

interface LibGetter {
    getLib(name: string): AnExportObject
}

class LibGetterClass implements LibGetter{
    libGetters: Record<string, ()=>AnExportObject> = {}

    addRequireCall(name: string, reqCall: () => AnExportObject): void {
        this.libGetters[name] = reqCall
    }

    getLib(name: string): AnExportObject {
        const reqCall = this.libGetters[name]
        if ( !reqCall ) return null
        return reqCall()
    }
}

// this class require the requested classes (With no mapping, not for web-pack)
// incase of relative path need to fix the relativity accoring to the caller
class LibGetterDefault implements LibGetter {
    constructor( private caller: string ) {
    }

    getLib(name: string): AnExportObject {
        if ( name.startsWith('.') ) {
            // curentRelativePath - shall include the relative path from currentPath to the target path (+ the relative libname)
            const targetPath = dirname(this.caller)
            let currentPath = __dirname
            let currentRelativePath = ''
            // going up on "currentPath" until getting to a parent of "targetPath"
            while ( !targetPath.startsWith(currentPath) ) {
                const i = currentPath.lastIndexOf(sep)
                currentPath = currentPath.substring(0,i)
                // each up folder adding ".." to relative path
                currentRelativePath = join(currentRelativePath, '..')
            }
            // add the folders from targetPath, the are not including in currentPath
            currentRelativePath = join(currentRelativePath, targetPath.substring(currentPath.length))
            // add the libraray relative path
            currentRelativePath = join(currentRelativePath, name)
            // now we can require the requres library, since the relative path is from current folder
            return require(currentRelativePath)
        }
        // node_module lib, just return it
        return require(name)
    }
}

const librariesGetters: Record<string, LibGetter> = {}

// this methods (defined as describe.mapLibraraies) is called in the test-code by the rewired code with list of libraries the calling test code needs
// each argument is and array of 2 items: the name of the library and a method calls require on that library.
// the require call might change by webpack to __webpack_require and the argument may change to the name of the libraray in web-pack
export function mapLibraries(...libmap : [name: string, reqCall: () => undefined][]) {
    // get the caller file-name
    const caller = getCallerFileName(1)
    // all that data is saved under the caller filename, so we have the data that is need by each test-code file
    const libGetters = new LibGetterClass()
    librariesGetters[caller] = libGetters
    for (const [name,reqCall] of libmap) {
        libGetters.addRequireCall(name, reqCall)
    }
}

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
        if ( filename.indexOf(`/node_modules/${name}/`) >=0 ||
             filename.indexOf(`\\node_modules\\${name}\\`) >= 0 )
            return true
    }
    return false
}

enum RewireType {
    None,
    Light,
    Regular,
    TestCode,
    JestConfigFile
}

function getRewireType(filename: string): RewireType {
    if ( !filename.endsWith('.js') && !filename.endsWith('.ts') ) return RewireType.None
    if ( filename.endsWith('d.ts') ) return RewireType.None
    if ( isExcludedLib(filename) ) return RewireType.None
    if ( filename.indexOf('node_modules') >= 0 ) return RewireType.Light
    if ( filename.endsWith('.test.js') ) return RewireType.TestCode
    if ( filename.endsWith('.test.ts') ) return RewireType.TestCode
    if ( filename.endsWith('.spec.js') ) return RewireType.TestCode
    if ( filename.endsWith('.spec.ts') ) return RewireType.TestCode
    if ( filename.endsWith('jest.config.js') ) return RewireType.JestConfigFile
    return RewireType.Regular
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

const mainFilesCache: Record<string, string[] | null> = {}

function getMainFiles(path: string): {files: string[], name: string} | null {
    const NODEMODULES = `${sep}node_modules${sep}`
    if ( path.indexOf( NODEMODULES )<0 ) return null
    if ( mainFilesCache[path] === undefined ) {
        const packageFile = join(path,'package.json')
        if ( fs['existsSync'](packageFile)) {
            try {
                const packageObj = JSON.parse(fs['readFileSync'](packageFile).toString())
                const mainFiles: string[] = []
                if ( packageObj.main) {
                    mainFiles.push(join(path,packageObj.main))
                }
                if ( packageObj.moudle) {
                    mainFiles.push(join(path,packageObj.moudle))
                }
                mainFilesCache[path] = mainFiles;
            } catch {
                mainFilesCache[path] = []
            }
        } else {
            mainFilesCache[path] = null;
        }        
    }
    if ( !mainFilesCache[path]) {
        return getMainFiles(dirname(path))
    }
    return {
        files: mainFilesCache[path],
        name: path.substring(path.indexOf(NODEMODULES) + NODEMODULES.length).replace(/\\/g,'/')
    }
}

function getNameAsMainFile(filename: string): string {
    if ( !fs ) return null
    const mainFiles = getMainFiles(dirname(filename))
    if ( !mainFiles ) return null
    if ( mainFiles.files.indexOf(filename) < 0 ) return null
    return mainFiles.name;
}

// give a file content (as tring) this method added the __get__ and __set__ method to
// code and returned the patch code
function PatchFileContent(fileContent: string | Buffer, filename: string, rewireType: RewireType): string | Buffer {
    const fileConfiguration =  (rewire_config && rewire_config.files)? rewire_config.files[filename] : undefined
    const isBuffer = Buffer.isBuffer(fileContent)
    let content: string
    if ( isBuffer ) {
        content = fileContent.toString()
    } else {
        content = fileContent as string
    }
    const ___filename = normalizeFilename(filename)
    switch ( rewireType ) {
        case RewireType.Regular:
        case RewireType.Light:
            const light = rewireType == RewireType.Light
            let shortName = null
            if ( light ) {
                shortName = getNameAsMainFile(filename)
            }
            if ( filename.endsWith('.js') ) {
                // move the map code after the new code
                const i = content.lastIndexOf('\n')
                let mapCode = ''
                if ( i > 0 && content[i+1] === '/' ) {
                    mapCode = content.substr(i+1)
                    content = content.substr(0, i)
                }
        
                content = `${(light)?'':'function __load(module,exports) {'}${content}
const __rewireArgs = [(exp,value)=>eval(exp),${light},${JSON.stringify(___filename)},${JSON.stringify(shortName)}];
(Object.__rewireQueue = Object.__rewireQueue || []).push(__rewireArgs)
${varsDefinitions(fileConfiguration)}${mapCode}${(light)?'':`
return true;
}
__load(module,exports);`}`
            } else if ( filename.endsWith('.ts') ) {
        
                content = `${(light)?'':'function __load(module: unknown, exports: Record<string, unknown>) {};'}${content}
const __rewireArgs = [(exp: string, value: unknown): unknown => eval(exp),${light},${JSON.stringify(___filename)},${JSON.stringify(shortName)}]
const __rewireQueue = eval('Object.__rewireQueue = Object.__rewireQueue || []')
__rewireQueue.push(__rewireArgs)
${varsDefinitions(fileConfiguration)}${(light)?'':`

//}
//__load(module,exports)`}`
            }
            break
        case RewireType.TestCode:
            content = TestCodeRewire(content, ___filename)
            if ( filename.endsWith('.spec.ts')) {
                content =  `${content}
/* ${'!f'}!"${___filename}" */`
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


// this method is called when need to rewire a test code (.test.js / .test.ts / .spec.js / .spec.ts)
// content - the text of the test-code (as string)
// ___filename - the name of the test-code file
// returns - the test code after the rewire
//  the write (if need to) add a function __mapLibraries() that calls the describe.mapLibraries with list of all libraries that are needed for this test code 
//  (used by stub/spy/rewire/etc...), each argument to describe.mapLibries is array of 2 arguments the name of the libraray and call to require of that libraray. 
function TestCodeRewire(content: string, ___filename: string): string {
    // if the content already include a menthon fo __mapLibraries, it is already rewired, so nothing need to be done
    if ( content.indexOf('__mapLibraries') >=0 ) {
        //already rewired
        return content;
    }
    // this array hold all the libries names that are found in the test code.
    const libNames: string[] = []
    // in JS code that are traplied from TS, you should find the "__decorate" call (instead of the @ anotetion)
    if ( content.indexOf('__decorate') >= 0) {
        // the getDecorators finds in the JS code all the descriptors (name and arguments it gets as appear in the test-code)
        let decorators = getDecorators(content)
        // if there are no "describe" decorator, nothing to do
        if ( decorators.filter(d=>d.name === 'describe').length === 0 ) return content
        // if could not found any of the soda-test sinon decorators, nothing to do
        if ( decorators.filter(d=>d.name === 'spy' || d.name === 'stub' || d.name === 'rewire' || d.name === 'importPrivate').length === 0 ) return content // no sinon
        // go over all (soda-test sinon) decorators
        for (const dec of decorators) {
            switch ( dec.name ) {
                case 'spy':
                case 'stub':
                case 'rewire':
                case 'importPrivate':
                    // find the first argument of the decorator (ends with "," or ")")
                    let i = dec.args.indexOf(',')
                    const j = dec.args.indexOf(')')
                    if ( i< 0 ) i = j
                    i = Math.min(i,j)
                    if ( i< 0 ) continue
                    let arg0: string = undefined
                    // try to evalote the code between the "(" of the arguments and the ending "," or ")" of the first argument
                    try { arg0 = eval(`${dec.args.substring(1,i)}`)} catch {}
                    // if the first argument was detected as string. this string is the libraray name this test-code is using, add it (unless was already added before)
                    if ( typeof arg0 === 'string' && libNames.indexOf(arg0)<0 ) {
                        libNames.push(arg0)
                    }
            }
        }
    } else {
        // if there is no "__decorate" in the test-code, than this is a TS code (or a code that should use the @ decorators anotation)

        // if there is not @describe decorator, nothing to do
        if ( content.indexOf('@describe') < 0 ) return content
        // if could not find any of the soda-test sinon decorators, then nothing to do
        if ( content.indexOf('@spy') < 0 && content.indexOf('@stub') < 0 && content.indexOf('@rewire') < 0  && content.indexOf('@importPrivate') < 0) return content
        let i = 0
        // this loop checks all the soda-test sinon decorators in the test-code
        // "i" is the index in the code we are look now to find the next decorator
        while (i>=0) {
            // "i1" ... "i4" are the next location of each of the soda-test sinon decorators
            // if a decorator was found set is index to be the end of the code
            let i1 = content.indexOf('@spy',i)
            i1 = (i1<0)?content.length:i1
            let i2 = content.indexOf('@stub', i)
            i2 = (i2<0)?content.length:i2
            let i3 = content.indexOf('@rewire', i) 
            i3 = (i3<0)?content.length:i3
            let i4 = content.indexOf('@importPrivate', i)
            i4 = (i4<0)?content.length:i4
            // the minimum index is the index of the next soda-test sinon decorator. 
            // we set i to be after the "@" sign, so next time we shall find the next decorator
            i = Math.min(i1,i2,i3,i4)+1
            // if we coudl not find any decorator, we are done
            if ( i >= content.length ) break
            // after the name of the decorator, we look for the "(" that starts its paramters
            // "j" is the index in the test-code of that "(" char
            let j = content.indexOf('(',i)
            if ( j < 0 ) continue
            // look for the end of the first argument. should end with "," or ")"
            // "_i" is the index of the end of the first argument
            let _i = content.indexOf(',',j)
            const _j = content.indexOf(')',j)
            if ( _i <0 ) _i = _j
            _i = Math.min(_i, _j)
            if ( _i < 0 ) continue
            // try to evaluate the value of the first argument between the "j" location  (not including the "(" char) and the "_i" location
            let arg0: string = undefined
            try { arg0 = eval(`${content.substring(j+1,_i)}`)} catch {}
            // if the first argument was detected as a string, this string is the libraray this test-code is using, add it, unless it was already added before
            if ( typeof arg0 === 'string' && libNames.indexOf(arg0)<0 ) {
                libNames.push(arg0)
            }
        }

    }
    // at this point "libNames" hold the names of all libraries this test-code is using
    if ( libNames.length > 0 ) {
        // if the test-code includes "@descirbe" than it is using the @ decorators anotations.
        let i = content.indexOf('@describe')
        let _describe = 'describe'
        if ( i>=0 ) {
            // in this case we need to add before the call the @describe decorator the call to the __mapLibraries() methods (shall be defined latter)
            content = `${content.substring(0,i)}__mapLibraries();${content.substring(i)}`
        } else {
            // this is the JS code transplied from TS

            // look for the call of the describe decorator (the call is on a requried object, that we don't know its name)
            i = content.indexOf('.describe')
            if ( i<0 ) return content
            // "i" hold the index of the "." before the call to describe
            // "j" holds the end of the previous line. We need the name of the object between them.
            let j = content.lastIndexOf('\n',i)
            if ( j<0) return content
            // get the name that is called for the describe decorator (including the object that is definding it)
            _describe = content.substring(j,i+9).trim()
            // "i" now is moved to the __decorate call before the name of the describe decorator (poting to the "=" char that shall sets the decorated class to the class name)
            i = content.lastIndexOf('= __decorate([',i)
            if ( i<0 ) return content
            // "j" is moved to the end of the line before the call to __decorate of the describe decorator
            j = content.lastIndexOf('\n', i)
            if ( j<0 ) return content
            // the text at the start of the line until the above "=" sign, is the name of the class that is decorated with the describe decorator
            const className = content.substring(j,i).trim()
            // "i" is now set to the index of where that class was defined int he JS test code (long before the decorator)
            i = content.indexOf(`let ${className}`)
            if ( i<0 ) return content
            // add a call to the __mapLibraries() function before the the class definision
            content = `${content.substring(0,i)}__mapLibraries();${content.substring(i)}`
        }
        // the "__mapLibraries method shall be added to the end of the text code (if there is a sourceMapppingURL in the code, it shall be added before it)"
        let endOfCode = content.indexOf('//# sourceMappingURL')
        if ( endOfCode < 0 ) endOfCode = content.length;
        // define the __mapLibraries() function code: it calls the describe.mapLibraries method and pass to it list of 2 arguments arrays, one for each library
        let mapLibrariesCode = `\nfunction __mapLibraries() { ${_describe}.mapLibraries(\n`
        libNames.forEach((libName,i) => {
            // first arguemnt the the libraray name, and the second is a method that calls require on that libraray name
            mapLibrariesCode += `[${JSON.stringify(libName)}, ()=>require(${JSON.stringify(libName)})]${(i===libNames.length-1)?'':','}\n`
        })
        mapLibrariesCode += `)}\n`
        // place the definision of the __mapLibraries method in the test-code.
        content = `${content.substring(0,endOfCode)}${mapLibrariesCode}${content.substring(endOfCode)}`
    }
    return content
}

function getDecorators(content: string) {
    const lines = content.split('\n').map(l => l.trim())
    const decorators: {name: string, args: string}[] = []
    let inDecorate = false
    for( const line of lines ) {
        if ( line.endsWith('__decorate([') ) {
            inDecorate = true;
            continue
        }
        if ( line.startsWith(']') ) {
            inDecorate = false;
            continue
        }
        if ( inDecorate ) {
            var i = line.indexOf('.')
            if ( i<0 ) continue
            var j = line.indexOf('(', i)
            if ( j<0 ) continue
            const name = line.substring(i+1, j)
            const args = line.substring(j, line.endsWith(',')?line.length-1:line.length)
            decorators.push({name,args})
        }
    }
    return decorators
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
    let rewireType = getRewireType(filename)
    if ( rewireType != RewireType.None ) {
        // this file is JS file that is not a test file and is not under node_modules, need to rewire it
        result = PatchFileContent(result, filename, rewireType)
    }
    return result
}

function stubImportStar(): void {
    // look for exported method __importStar on any loaded libraray
    for ( const libId in require.cache ) {
        if ( !require.cache[libId].exports) continue
        if ( !require.cache[libId].exports.__importStar ) continue
        const _importStar = require.cache[libId].exports.__importStar
        if ( _importStar.hook === 'soda-test' ) continue // already hooked
        const _importStarHook  = function(mod: unknown): unknown { // eslint-disable-line @typescript-eslint/no-unused-vars
            const rv = _importStar(mod)
            if ( rv === mod ) return rv
            if ( !Object.getOwnPropertyDescriptor(mod, 'soda-test-star') )
                Object.defineProperty(mod, 'soda-test-star', { value: [], writable: false, enumerable: false, configurable: true })
            mod['soda-test-star'].push(rv)
            return rv
        }
        _importStarHook['hook'] = "soda-test"
        setProperty(require.cache[libId].exports, '__importStar', _importStarHook)
    }
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
        // look for already loaded test files
        let firstTestCodeFile: string = null
        const stack = (new Error()).stack
        for ( const filename of Object.keys(require.cache))
        {
            if (filename.endsWith('.test.ts') ||
                filename.endsWith('.test.js') ||
                filename.endsWith('.spec.ts') ||
                filename.endsWith('.spec.js')) {
                
                if ( stack.indexOf(filename) >=0 ) {
                    // we have found a test file in the loaded libraray that is in the current stack
                    firstTestCodeFile = filename
                    break
                }
            }
        }
        if ( firstTestCodeFile ) {
            // set a default map for this test-code
            librariesGetters[firstTestCodeFile] = new LibGetterDefault(firstTestCodeFile)
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

    // each moduel that need to be rewired calls this method (indirectly) and pass to it the needed arguments in an array.
    function rewireCurrent( arg: never[]): void {
        const _eval: (exp: string, value: unknown) => unknown = arg[0]
        const light: boolean = arg[1]
        const ___filename: string = arg[2]
        const shortName: string = arg[3]
    
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
    
        if ( shortName ) {
            Object.defineProperty(_module.exports, '___shortname', {value: shortName, writable: false})
        }
    
        Object.defineProperty(_module.exports, '___filename', { value: ___filename, writable: false} )
        if ( isNonClassFunction(_module.exports) ) {
            _module.exports = _aggregateFunction(_module.exports)
        }
    }


    // if some modules that need to be rewired were loaded before we got here, they saved inside Object.__rewireQueue an array 
    // with rewire information to perform. Call rewireQueue on each item in that array to rewire those libraraies.
    if ( Array.isArray(Object['__rewireQueue'])) {
        const rewireQueue: never[][] = Object['__rewireQueue']
        for ( const rewireArg of rewireQueue ) {
            rewireCurrent(rewireArg)
        }
    }

    // from this point any module that shall be loaded and try to push its data into Object.__rewireQueue, will automaticly 
    // execute the rewireCurrent method with that data.
    Object['__rewireQueue'] = {
        push: rewireCurrent
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

// this method returns teh exports of a libraray (just like require)
// need to pass the original caller file name.
// can be used from other libraries. the result exports might be rewried
export function getLibFromPath(libname: string, caller: string, reload = false): Record<string,unknown> {
    // get the name of the library from the librariesMap (incase of webpack we might get a differnt libraray name)
    if ( librariesGetters[caller] ) {
        const _exports =  librariesGetters[caller].getLib(libname)
        // use the __reload__() method if we have the "reload" flag
        if ( reload ) {
            const _module: {exports: Record<string,unknown>} = {exports: {}}
            if ( !_exports.__reload__(_module as NodeModule,_module.exports) ) {
                throw new Error(`reloading module is not supported for ${libname}`)
            }
            return _module.exports
        }
        return _exports
    }
    throw new Error(`we don't have libraries getters for caller ${caller} - libname = ${libname}`)

}

let _webPackTree: WebPackTree = null
function getWebPackLibraray(libname: string, caller: string): Record<string, unknown> {
    loadWebPackMap()
    const lib = _webPackTree.findWebPackLibraray(libname, caller)
    return lib
}

function loadWebPackMap(): void {
    if ( _webPackTree ) return
    _webPackTree = new WebPackTree()
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

