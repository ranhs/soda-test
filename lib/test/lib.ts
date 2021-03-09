let _count: number
export function getCount(): number {
    return _count
}

export function setCount(value: number): void {
    _count = value
}

export function advance(): number {
    return ++_count
}

export function decrement(): number {
    return --_count
}

export function double(): number {
    return _count *= 2
}

export function squar(): number {
    return _count *= _count
}

export class DummyClass {
    public foo(p: string): number {
        return this.kuku(p)
    }

    kuku(p: string): number {
        return p.length
    }

    _value: number

    get Value(): number {
        return this._value
    }

    set Value(v: number) {
        this._value = v
    }

    callGetter(): number {
        return this.Value
    }

    callSetter(v: number): void {
        this.Value = v
    }
}

export abstract class BaseClass {
    public foo(p: string): number {
        return this.kuku(p)
    }

    public callGetter(): number {
        return this.Value
    }

    public callSetter(v: number): void {
        this.Value = v
    }

    protected abstract kuku(p: string): number

    protected abstract get Value(): number

    protected abstract set Value(v: number) // eslint-disable-line @typescript-eslint/explicit-module-boundary-types



}

