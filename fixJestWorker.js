const fs = require('fs')

const superAgnetIndexFileName = '../@types/superagent/index.d.ts'
if ( !fs.existsSync(superAgnetIndexFileName) ) return

let superAgentIndexDTs = fs.readFileSync(superAgnetIndexFileName).toString()
superAgentIndexDTs = superAgentIndexDTs.replace('import { Blob } from "buffer";', '')
superAgentIndexDTs = superAgentIndexDTs.replace('Blob | Buffer', 'Buffer')

fs.writeFileSync(superAgnetIndexFileName,superAgentIndexDTs)
