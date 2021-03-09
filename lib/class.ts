class BaseClass {
    public static constructorCount = 0
    constructor() {
        BaseClass.constructorCount++
    }
}

export class DerivedClass extends BaseClass {
    constructor() {
        super()
    }

    get Kuku(): number {
        return 17
    }
}
