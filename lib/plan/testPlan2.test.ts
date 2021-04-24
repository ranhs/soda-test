//import { describe, context, it, TR, expect, comment } from 'soda-test'
/*********************** Import soda-test from inside soda-test **************** */
import { TR } from '..'
import {sep} from 'path'
const i = __dirname.indexOf(`${sep}soda-test${sep}`)
let sodalib = 'soda-test'
if ( i > 0 ) {
    sodalib = __dirname.substr(0,i+sodalib.length+2) + 'dist'
}
const { describe, context, it, expect, comment } = require(sodalib) // eslint-disable-line @typescript-eslint/no-var-requires
/************* end of importing soda-test ******************** */

@describe('TestPlan2', {description: 'Placeholder for a test, that shall read as ts when creating testplan'})
class Plan2Test {

    @comment('Test Step outside of a context')
    @it()
    method1(): TR {
        expect(1).to.equal(1)
    }

@context('context1', {description: 'just for testplan test'})

    @comment('Test Step inside of a context')
    @it('second step', {description: 'nothing spacil'})
    method2(): TR {
        expect(2).to.equal(2)
    }
}