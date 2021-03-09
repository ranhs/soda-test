export function getCurrentTime(): number {
    return Date.now()
}

export function sleep(msec: number): Promise<void> {
    return new Promise<void>( (resolve) => {
        setTimeout( resolve, msec )
    })
}