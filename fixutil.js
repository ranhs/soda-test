const fs = require('fs')

function getUtilFilePath() {
    let utilFileName = './node_modules/util/util.js'
    if ( fs.existsSync(utilFileName) ) return utilFileName
    utilFileName = '../util/util.js'
    if ( fs.existsSync(utilFileName) ) return utilFileName
    return null
}

function fix1(utilContent) {
    const start = utilContent.indexOf('if (process.env.NODE_DEBUG) {')
    if ( start < 0 ) return null
    if ( start > 6 &&  utilContent.substring(start-6,start) === 'try { ' ) {
        // aleady fixed
        return null
    }
    const end = findClosing(utilContent, start + 28)
    if ( end < 0 ) return null
    if ( end <= start ) return null
    const fixedUtilContent = `${utilContent.substring(0,start)}try { ${utilContent.substring(start,end+1)}} catch {}`
    return fixedUtilContent
}

function fix2(utilContent) {
    const fixedUtilContent = utilContent.replace('isString(f)', "(typeof f === 'string')")
    if ( fixedUtilContent === utilContent ) return null
    return fixedUtilContent
}

const utilFileName = getUtilFilePath()

if ( utilFileName !== null ) {
    let utilContent = fs.readFileSync(utilFileName).toString()
    let changed = false
    let fixedUtilContent = fix1(utilContent)
    if ( fixedUtilContent !== null ) {
        utilContent = fixedUtilContent
        changed = true
    }
    fixedUtilContent = fix2(utilContent)
    if ( fixedUtilContent !== null ) {
        utilContent = fixedUtilContent
        changed = true
    }

    if ( changed ) {
        fs.writeFileSync(utilFileName, fixedUtilContent)
    }
}

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