import { Done } from "."

function getValue(name: string): unknown {
    try {
        return eval(name)
    } catch {
        return undefined
    }
}

export interface TestSuite {
    describe: (title: string, fn?: () => void) => void
    it: (title: string, fn?: (done?: Done) => void) => void
    expect: (exp: unknown) => unknown
    before: (fn?: () => void) => void,
    after: (fn?: () => void) => void,
    beforeEach: (fn?: () => void) => void,
    afterEach: (fn?: () => void) => void,
}

const testSuite: TestSuite = {
    describe: getValue('describe') as never,
    it: getValue('it') as never,
    expect: getValue('expect') as never,
    before: (getValue('before') || getValue('beforeAll')) as never,
    after: (getValue('after') || getValue('afterAll')) as never,
    beforeEach: getValue('beforeEach') as never,
    afterEach: getValue('afterEach') as never
}


export default testSuite
