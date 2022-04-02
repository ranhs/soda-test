import * as rewire from '../../test-lib/rewire'
let karma
try {
    karma = require('../../../../@angular-devkit/build-angular/src/builders/karma') // eslint-disable-line @typescript-eslint/no-var-requires
} catch {
    karma = require('../../../../@angular-devkit/build-angular/src/karma') // eslint-disable-line @typescript-eslint/no-var-requires
}
Object.defineProperty(exports, "__esModule", { value: true });
rewire.init(true)
exports.execute = karma.execute
exports.default = karma.default
