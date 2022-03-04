import { SodaTestConfiguration } from './configurationtypes'
import { environment } from './environment'
import { join, sep } from '../path'


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

export function readConfigurationFile(fs: unknown): SodaTestConfiguration {
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

export function readConfigurationFileName(): string {
    return join(__dirname, 'readconfiguration.js')
}

export function createReadConfigurationFile(config: unknown): string {
    return `module.exports = JSON.parse(\`
${JSON.stringify(config,null,2)}
\`)`
}

export function initConfiguration(config: SodaTestConfiguration):  void {
    for ( const key in config.env ) {
        const value = config.env[key]
        environment[key] = value
    }
}


// for testabiliy only:
export function get(name: string): unknown {
    return eval(name)
}
export function set(name: string, value: unknown): void { // eslint-disable-line @typescript-eslint/no-unused-vars
    eval(`${name} = value`)
}