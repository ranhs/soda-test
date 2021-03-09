import { describe, it, TR, pending } from '../..'

@describe('nested test')
class NestedTest {
    @it('this is from the nested file')
    @pending()
    dummy(): TR {
        // placeholder
    }
}