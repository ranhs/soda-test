
import * as testLib from './test-lib'
import * as testBed from './test-lib/testbed'
import { setJest } from './test-lib/executables'
export {
    SinonSpy,
    SinonStub,
    SinonSandbox,
    SinonFakeTimers,
    FakeTimerInstallOpts,
    Done,
    Rewire,
    TR,
    PTR,
    CreatableClass
} from './test-lib'

export {
    TestBed,
    ComponentFixture,
    SodaFixture
} from './test-lib/testbed'

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
        comment: testLib.comment,
        pending: testLib.pending, 
        expect: testLib.expect,
        spy: testLib.spy,
        stub: testLib.stub,
        fixture: testBed.fixture,
        component: testBed.component,
        before: testLib.before, 
        after: testLib.after, 
        beforeEach: testLib.beforeEach, 
        afterEach: testLib.afterEach,
        global: testLib.global,
        importPrivate: testLib.importPrivate,
        rewire: testLib.rewire,
        useFakeTimers: testLib.useFakeTimers,
        sandbox: testLib.sandbox,
        testStep,
        testCase,
        environment: testLib.environment
    })
} else {
    mergeInfo( exports, {
        context: testLib.context, 
        it: testLib.it, 
        comment: testLib.comment,
        pending: testLib.pending, 
        before: testLib.before, 
        after: testLib.after, 
        beforeEach: testLib.beforeEach, 
        afterEach: testLib.afterEach, 
        describe: testLib.describe,
        spy: testLib.spy,
        stub: testLib.stub,
        fixture: testBed.fixture,
        component: testBed.component,
        global: testLib.global,
        importPrivate: testLib.importPrivate,
        useFakeTimers: testLib.useFakeTimers,
        createStub: testLib.createStub,
        createAggregation: testLib.createAggregation,
        createAgrigation: testLib.createAggregation, // temporaray save wrong spelling for backword competability
        rewire: testLib.rewire,
        expect: testLib.expect,
        request: testLib.request,
        sandbox: testLib.sandbox,
        testStep,
        testCase,
        environment: testLib.environment
    })
}
