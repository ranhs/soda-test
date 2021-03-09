export interface Item {
    name: string
    price: number
}

export interface User {
    id: number
    name: string
}

export interface PackedOrder {
    ref: number
    user: string
    updatedAt: number
    status: string
    items: Item[]
    shipping: number
    total: number
}

export class Order {
    status: string
    createdAt: number
    updatedAt: number
    subtotal: number
    shipping: number
    total: number

    constructor(private ref: number, private user: User, private items: Item[]) {
        this.status = 'Pending'
        this.createdAt = Date.now()
        this.updatedAt = Date.now()
        this.subtotal = 0

        for (const item of items ) {
            // console.log(item)
            this.subtotal += item.price
        }

        if (this.subtotal <=50) {
            this.shipping = 5
        } else {
            this.shipping = 10
        }

        this.total = this.subtotal + this.shipping
    }

    save(): PackedOrder {
        //...some logic..

        this.status = 'Active'
        this.updatedAt = Date.now()

        const o: PackedOrder = {
            ref: this.ref,
            user: this.user.name,
            updatedAt: this.updatedAt,
            status: this.status,
            items: this.items,
            shipping: this.shipping,
            total: this.total
        }

        return o
    }

    cancel(): boolean {
        // ...some logic...

        this.status = 'Cancelled'
        this.updatedAt = Date.now()
        this.shipping = 0
        this.total = 0

        console.warn('Order cancelled')

        return true
    }

    ship(): void {
        this.status = 'Shipped'
        this.updatedAt = Date.now()
    }
}