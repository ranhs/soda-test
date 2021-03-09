import { describe, it, TR, expect } from '.'

@describe('demo global control methods')
class DemoTest {
    before(): void {
        console.log('***before')
    }
    beforeEach(): void {
        console.log('***beforeEach')
    }
    afterEach(): void {
        console.log('***afterEach')
    }
    after(): void {
        console.log('***after')
    }

    @it()
    test1(): TR {
        console.log('*** test-step 1')
        expect(null).to.be.null
    }

    @it()
    test2(): TR {
        console.log('*** test-step 2')
        expect(null).to.be.null
    }
}
