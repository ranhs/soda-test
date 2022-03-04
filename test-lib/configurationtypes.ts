
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
    env: {[key: string]: string}
    rewire: RewireConfiguration
}
