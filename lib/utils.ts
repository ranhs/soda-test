import { format } from 'util'
import * as _ from 'underscore'

export function createGreeting(name: string, age: number): string | null {
    if (!name || typeof name != 'string' || !age || typeof age != 'number' ) return null

    const greeting = format('Congratulate %s on his %dth birthday!', name, age)

    return greeting
}

export function isString(value: unknown): boolean {
    return _.isString(value)
}
