const fs = require('fs')

function getNiseFilePath() {
    let niseFileName = './node_modules/nise/nise.js'
    if ( fs.existsSync(niseFileName) ) return niseFileName
    niseFileName = '../nise/nise.js'
    if ( fs.existsSync(niseFileName) ) return niseFileName
    return null
}

function fix1(niseContent) {
    if ( niseContent.indexOf('process') < 0 ) return null
    const lines = niseContent.split('\n')
    if ( lines[2].length >0 ) return null
    lines[2] = 'try {window.process = {env:{}};} catch {}'
    return lines.join('\n')
}

const niseFileName = getNiseFilePath()

if ( niseFileName !== null ) {
    let niseContent = fs.readFileSync(niseFileName).toString()
    let changed = false
    let fixedNiseContent = fix1(niseContent)
    if ( fixedNiseContent !== null ) {
        niseContent = fixedNiseContent
        changed = true
    }

    if ( changed ) {
        fs.writeFileSync(niseFileName, niseContent)
    }
}