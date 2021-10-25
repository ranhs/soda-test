
interface RequireLink {
    name: string
    id: number
}

export class WebPackTree {
    specNameToId: Record<string, number> = {}
    idToRequiredLibs: Record<number, RequireLink[]> = {}

    readonly WEBPACKREQURESTARTSTR = '__webpack_' + 'require__(/*! '

    constructor() {
        // read the __webpack_modules__ value from one of the rewired modules in cache
        let webpackModules: Record<string, ()=>void> = null
        for ( const id in require.cache ) {
            const alib = require.cache[id].exports
            if ( !alib.__get__ ) continue
            try {
                webpackModules = alib.__get__('__webpack_modules__')
            } catch {

            }
            
            if (webpackModules) break
        }
        if ( !webpackModules ) {
            throw new Error('cannot get the __webpack_modules__')
        }
        // go over all web-pack modules and create the require tree + the map to the spec files
        for (const id in webpackModules)
        {
            const webpackModuleText = webpackModules[id].toString()
            const iid = Number(id)
            if ( !iid ) continue
            // look for filename in the module
            let i = webpackModuleText.indexOf('/* !f'+'!"')
            if ( i > 0 ) {
                i+=7
                const i1 = webpackModuleText.indexOf('"',i)
                if ( i1 > i ) {
                    const filename = webpackModuleText.substring(i,i1)
                    this.specNameToId[filename] = iid
                }
            }
            // look for web-require in the module
            let j = 0
            this.idToRequiredLibs[iid] = []
            const requires = this.idToRequiredLibs[iid]
            while ( true ) {
                j = webpackModuleText.indexOf(this.WEBPACKREQURESTARTSTR, j)
                if ( j < 0 ) break
                const j1 = webpackModuleText.indexOf(')', j)
                if ( j1 > j ) {
                    const NameAndId = webpackModuleText.substring(j+this.WEBPACKREQURESTARTSTR.length, j1).split('*/').map(s=>s.trim())
                    const requriedLibName = NameAndId[0]
                    const requiredLibId = Number(NameAndId[1])               
                    if ( requiredLibId) {
                        requires.push({
                            name: requriedLibName,
                            id: requiredLibId
                        })
                    }
                }
                j++
            }
        }
    }

    findWebPackLibraray(name: string, caller: string): Record<string, unknown> {
        const callerId = this.specNameToId[caller]
        return this.findLibraryFromId(name, callerId)
    }

    findLibraryFromId(name: string, startingPoint: number): Record<string, unknown> {
        const requires: RequireLink[] = this.idToRequiredLibs[startingPoint.toString()]
        for ( const arequire of requires ) {
            if ( arequire.name === name ) {
                try {
                    const lib = eval(`__webpack_require__(${arequire.id})`)
                    if ( lib ) return lib
                } catch {
                    // cannot require this id, continue searching
                } 
            }
            if ( arequire.name.startsWith('.') ) {
                const lib = this.findLibraryFromId(name, arequire.id)
                if ( lib ) return lib               
            }
        }
        return null
    }
}