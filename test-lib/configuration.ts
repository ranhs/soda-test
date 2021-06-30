import { join, sep } from 'path'


export interface RewireConfiguration {
    files: {
        [key: string]: {
            insertVars: {
                name: string
            }[]
        }
    }
}


export interface SodaTestConfiguration {
    placeholder?: boolean
    env: {[key: string]: string}
    rewire: RewireConfiguration
}

function fillMissingConfiguration(config: SodaTestConfiguration): SodaTestConfiguration {
    if ( !config ) config = {} as never
    if ( !config.env ) config.env = {}
    if ( !config.rewire ) config.rewire = {} as never
    if ( !config.rewire.files ) config.rewire.files = {}
    for ( const key in config.rewire.files ) {
        if ( !config.rewire.files[key] || typeof config.rewire.files[key] !== 'object' ) {
            config.rewire.files[key] = {} as never
        }
        if ( !config.rewire.files[key].insertVars && !Array.isArray(config.rewire.files[key].insertVars) ) {
            config.rewire.files[key].insertVars = []
        }
        for ( let i=config.rewire.files[key].insertVars.length -1; i>=0; i--) {
            if ( typeof config.rewire.files[key].insertVars[i] !== 'object' || !config.rewire.files[key].insertVars[i].name ) {
                config.rewire.files[key].insertVars.splice(i,1)
            }
        }
    }
    return config
}

export function getBaseDir(): string {
    let i = __dirname.indexOf(`${sep}node_modules${sep}`)
    if ( i < 0 ) {
        i = __dirname.indexOf(`${sep}soda-test${sep}`)
        if ( i>=0 ) {
            i+= 11
        }
    }
    if ( i< 0) {
        return ''
    }
    return __dirname.substr(0,i)
}

function readConfigurationInternal(fs: unknown): SodaTestConfiguration {
    if ( !fs ) return null
    const baseDir = getBaseDir()
    if ( !baseDir ) {
        return null
    }
    const filename = join(baseDir,'.soda-test')
    try {
        if ( !fs['existsSync'](filename)) {
            console.warn(`Configuration Warnning: no configuration file exists at ${filename}`)
            return null
        } 
        const configStr = fs['readFileSync'](filename).toString()
        const config = JSON.parse(configStr)
        return config
    } catch (err) {
        console.error(`Configuration Error: ${err.message}`)
        return null
    }
}

export function readConfiguration(fs: unknown): SodaTestConfiguration {
    return fillMissingConfiguration(readConfigurationInternal(fs))
}

export function readConfigurationFileName(): string {
    return join(__dirname, 'readconfiguration.js')
}

export function createReadConfigurationFile(config: unknown, isBuffer: boolean): string | Buffer {
    const result = `module.exports = JSON.parse(\`
${JSON.stringify(config,null,2)}
\`)`
    if ( isBuffer )  {
        return new Buffer(result)
    } else {
        return result
    }
}

export function initConfiguration(config: SodaTestConfiguration):  void {
    for ( const key in config.env ) {
        const value = config.env[key]
        process.env[key] = value
    }
}


// for testabiliy only:
export function get(name: string): unknown {
    return eval(name)
}
export function set(name: string, value: unknown): void { // eslint-disable-line @typescript-eslint/no-unused-vars
    eval(`${name} = value`)
}