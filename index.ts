
import * as testLib from './test-lib'
import { setJest } from './test-lib/executables'
export {
    SinonSpy,
    SinonStub,
    SinonSandbox,
    SinonFakeTimers,
    SinonFakeTimersConfig,
    Done,
    Rewire,
    TR,
    PTR,
    CreatableClass
} from './test-lib'

import {
    testStep,
    testCase,
} from './test-lib/testCase'

export {
    stepMethod
} from './test-lib/testCase'

declare let jest: unknown
let jest_:unknown

try {
    jest_ = jest
} catch {
    jest_ = undefined
}

function mergeInfo(target: {[key:string]: unknown}, source: {[key:string]: unknown}): void {
    for ( const key in source ) {
        target[key] = source[key]
    }
}

if ( jest_ ) {
    setJest()
    mergeInfo( exports, {
        describe: testLib.describe,
        context: testLib.context,
        it: testLib.it,
        pending: testLib.pending, 
        expect: testLib.expect,
        spy: testLib.spy,
        stub: testLib.stub,
        before: testLib.before, 
        after: testLib.after, 
        beforeEach: testLib.beforeEach, 
        afterEach: testLib.afterEach,
        global: testLib.global,
        importPrivate: testLib.importPrivate,
        rewire: testLib.rewire,
        useFakeTimers: testLib.useFakeTimers,
        assert: testLib.assert,
        sandbox: testLib.sandbox,
        testStep,
        testCase
    })
} else {
    mergeInfo( exports, {
        context: testLib.context, 
        it: testLib.it, 
        pending: testLib.pending, 
        before: testLib.before, 
        after: testLib.after, 
        beforeEach: testLib.beforeEach, 
        afterEach: testLib.afterEach, 
        describe: testLib.describe,
        spy: testLib.spy,
        stub: testLib.stub,
        global: testLib.global,
        importPrivate: testLib.importPrivate,
        useFakeTimers: testLib.useFakeTimers,
        createStub: testLib.createStub,
        createAgrigation: testLib.createAgrigation,
        rewire: testLib.rewire,
        expect: testLib.expect,
        assert: testLib.assert,
        request: testLib.request,
        sandbox: testLib.sandbox,
        testStep,
        testCase
    })
}
