interface PathMethods {
    dirname(p: string): string
    join(...paths: string[]): string
    get sep(): string
}
let path: PathMethods

try {
    path = require('path')
} catch {
    path = require('path-browserify')
}

export function dirname(p: string): string {
    return path.dirname(p)
}

export function join(...paths: string[]): string {
    return path.join(...paths)
}

export const sep = path.sep