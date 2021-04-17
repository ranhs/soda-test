import * as glob from 'glob'
import { writeFileSync } from 'fs'
import { GetPlan, PlanReset } from './test-lib/testplan'

export async function createTestPlan(argv: string[]): Promise<void> {
    if ( argv.length < 3 || argv.length > 4 || argv[0].indexOf('node') <0 || argv[1].indexOf('plan') < 0) {
        console.error('Invalid script command')
        return
    }
    process.env.PLAN_MODE = 'YES'
    const filesPattern = argv[2]
    const matches = await new Promise<string[]>((resolve,reject) => glob(filesPattern, {absolute: true}, (err, matches) => (err)?reject(err):resolve(matches)))
    PlanReset()
    for ( const match of matches ) {
        require(match)
    }
    const testplan = GetPlan()
    if ( argv.length < 4 ) {
        console.log(JSON.stringify(testplan,null,2))
        return
    }
    // save the target json
    writeFileSync(argv[3], JSON.stringify(testplan,null,2))
}

createTestPlan(process.argv)
