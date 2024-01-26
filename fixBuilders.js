const fs = require('fs')

const buildsFileName = './builders.json'
if ( !fs.existsSync(buildsFileName) ) return

const builderJson = fs.readFileSync(buildsFileName).toString()
const builderObject = JSON.parse(builderJson)

if ( typeof builderObject != 'object' ) return
if ( !builderObject.builders ) return
if ( !builderObject.builders.karma ) return

if ( !builderObject.builders.karma.schema || fs.existsSync(builderObject.builders.karma.schema) ) return
if ( !builderObject.builders.karma.schemaOld || !fs.existsSync(builderObject.builders.karma.schemaOld) ) return

builderObject.builders.karma.schema = builderObject.builders.karma.schemaOld

fs.writeFileSync(buildsFileName,JSON.stringify(builderObject,null,2))