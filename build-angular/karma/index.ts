import * as rewire from '../../test-lib/rewire'
const karma = require('../../../../@angular-devkit/build-angular/src/karma') // eslint-disable-line @typescript-eslint/no-var-requires
Object.defineProperty(exports, "__esModule", { value: true });
rewire.init(true)
exports.execute = karma.execute
exports.default = karma.default
