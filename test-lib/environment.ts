let _env: {[key: string]: string} = undefined
let _isProcessAvailable = true
try {
    _env = process.env
} catch {
    _isProcessAvailable = false
}
if ( _env === undefined ) _env = {}
export const environment = _env
export const isProcessAvailable = _isProcessAvailable
