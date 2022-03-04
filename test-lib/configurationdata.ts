import { SodaTestConfiguration } from './configurationtypes'
import * as nativeConfig from './readconfiguration'

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

export function readConfiguration(): SodaTestConfiguration {
    const rv = fillMissingConfiguration(nativeConfig as never)
    return rv
}
