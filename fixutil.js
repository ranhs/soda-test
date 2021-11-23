const fs = require('fs')

let utilFileName = './node_modules/util/util.js'
if ( !fs.existsSync(utilFileName) ) {
    utilFileName = '../util/util.js'
    if ( !fs.existsSync(utilFileName) ) return
}

const utilContent = fs.readFileSync(utilFileName).toString()
const start = utilContent.indexOf('if (process.env.NODE_DEBUG) {')
if ( start < 0 ) return
if ( start > 6 && utilContent.substr(start-6,6) === 'try { ' ) {
    // aleady fixed
    return
}
const end = findClosing(utilContent, start + 28)
if ( end < 0 ) return
if ( end <= start ) return
const fixedUtilContent = `${utilContent.substr(0,start)}try { ${utilContent.substring(start,end+1)}} catch {}`

fs.writeFileSync(utilFileName, fixedUtilContent)

function findClosing(content, i) {
    if ( content[i] !== '{' && content[i] !== '}' ) {
        return -1
    }
    let j = content.indexOf('}',i+1)
    let j1 = content.indexOf('{', i+1)
    if ( j1 >= 0 && j1 < j ) {
        // another open before close
        j = findClosing(content, j1)
        if ( j<0 ) return -1
        return findClosing(content, j)
    }
    return j
}