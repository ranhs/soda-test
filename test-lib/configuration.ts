import { join, sep } from 'path'

export function readConfiguration(fs: unknown): unknown {
    if ( !fs ) return null
    let i = __dirname.indexOf(`${sep}node_modules${sep}`)
    if ( i < 0 ) {
        i = __dirname.indexOf(`${sep}soda-test${sep}`)
        if ( i>=0 ) {
            i+= 11
        }
    }
    if ( i< 0) {
        return null
    }
    const filename = join(__dirname.substr(0,i),'.soda-test')
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

export function initConfiguration(config: unknown):  void {
    if (config && config['env']) {
        const envs = config['env']
        if ( typeof envs === 'object' ) {
            for ( const key in envs ) {
                const value = envs[key]
                process.env[key] = value
            }
        }
    } 
}


// for testabiliy only:
export function get(name: string): unknown {
    return eval(name)
}
export function set(name: string, value: unknown): void { // eslint-disable-line @typescript-eslint/no-unused-vars
    eval(`${name} = value`)
}