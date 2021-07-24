import { environment } from "../test-lib"

export function getURL(): string {
    if ( environment.NODE_ENV === 'production') {
        return 'mongodb://localhost:27017/real_db'
    } else {
        return 'mongodb://localhost:2017/test_db'
    }
}