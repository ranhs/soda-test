const genfunc = require('generate-function') // eslint-disable-line @typescript-eslint/no-var-requires


export function createFunc(): (v: number) => number {
    const gen = genfunc()

    return gen('function(v) { return v }')
}