import * as _parseFunction from 'parse-function'

export function parseFunctionSample(callback: () => unknown): void {
    const parseFunction = _parseFunction.default || _parseFunction
    const app = parseFunction()

    app.use( () => {
        return callback()
    })
}