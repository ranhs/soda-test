import * as glob from 'glob'
const fs = require('fs')
import { GetPlan, PlanReset } from './test-lib/testplan'
 import { Compiler } from 'ts-import'

const compiler = new Compiler({
    compilerOptions: {
        downlevelIteration: true,
        emitDecoratorMetadata: true,
        experimentalDecorators: true,
        module: "commonjs",
        resolveJsonModule: true,
        skipLibCheck: true,
        target: "ES6"
    } as never,
    fallback: false,
    logger: undefined,
})

// since ts-import is using fs.promises.rm, that does not exist, we set it to fs.promises.unlink that
// does the same job.
if ( !fs.promises.rm ) {
    fs.promises.rm = fs.promises.unlink
}



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
        console.log(`analizing ${match}`)
        if ( match.endsWith('.ts') ) {
            await compiler.compile(match)
        } else {
            require(match)
        }
    }
   const testplan = GetPlan()
    if ( argv.length < 4 ) {
       console.log(JSON.stringify(testplan,null,2))
       return
    }
    // save the target json
    fs.writeFileSync(argv[3], JSON.stringify(testplan,null,2))
}

createTestPlan(process.argv)
