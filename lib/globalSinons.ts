let privateMember = 0

export function getPrivateMember(): number {
    return privateMember
}

export function setPrivateMember(value: number): void {
    privateMember = value
}