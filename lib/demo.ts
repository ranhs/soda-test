import theDefault from './methods'

export function add(a: number, b: number): number {
    return a + b
}

export function addCallbck(a: number, b: number, callback: (err: Error | null, result: number) => void): void {
    setTimeout(() => {
        return callback(null, a+b)
    }, 500)
}

export function addPromise(a: number, b: number): Promise<number> {
    return new Promise<number>( (resolve/*,reject*/) => {
        //reject(new Error('fake'))
        resolve(a+b)
    })
}

export function dividePromise(a: number, b: number): Promise<number> {
    return new Promise<number>( (resolve, reject) => {
        if (b === 0) {
            reject(new Error('cannot divide by 0'))
        } else {
            resolve(a/b)
        }
    })
}

export function foo(): void {
    // some operation
    console.log('console.log was called')
    console.warn('console.warn was called')

    return
}

export function createFile(ignoreFilename: string): Promise<string> {
    console.log('---in createFile')
    //fake create file
    return new Promise<string>((resolve) => {
        setTimeout(() => {
            console.log('fake file created')
            return resolve('done')
        }, 100)
    })
}

function callDB(ignoreFilename: string): Promise<string> {
    console.log('---in callDB')
    //fake call db
    return new Promise<string>((resolve) => {
        setTimeout(()=>{
            console.log('fake db call')
            resolve('saved');
        }, 100)
    })
}

export async function bar(filename: string): Promise<string> {
    await createFile(filename)
    const result = await callDB(filename)
    return result
}


export function callDefualt(): void {
    theDefault()   
}