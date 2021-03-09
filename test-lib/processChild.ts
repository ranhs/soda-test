import { init } from './rewire'
init()

import * as processChild from 'jest-worker/build/workers/processChild'
function DoNothing(ignoreArg: unknown): void {
    // DoNothing
}
DoNothing(processChild)