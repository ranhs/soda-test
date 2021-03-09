import { createHash } from 'crypto'
import * as _ from 'underscore'

import { secret } from './config'

//foo = 1f0c01e257f55ed3014d60bd0bd0d0373
export function getHash(string: string): string {
    if (!string || typeof string != 'string') return null

    string += '_' + secret()

    const hash = createHash('md5').update(string).digest('hex')

    // console.log('Hahs: ', hash)

    return hash
}

export function isString(value: unknown): boolean {
    return _.isString(value)
}
