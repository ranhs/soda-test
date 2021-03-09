import { expect, describe, it, TR, SinonStub, SinonSpy, stub, spy } from '.'

import { Order, Item, User } from './order'

@describe('order')
class OrderTest {
    
    @stub(console, 'warn')
    warnStub: SinonStub

    @spy(Date, 'now')
    dateSpy: SinonSpy

    user: User
    items: Item[]
    o: Order

    beforeEach(): void {
        this.user = {id: 1, name: 'foo'}
        this.items = [
            {name: 'Book', price: 10},
            {name: 'Dice set', price: 5}
        ]
        this.o = new Order(123, this.user, this.items)
    }

    @it('should create instance of Order and calculate total + shipping')
    testConstructor1(): TR {
        expect(this.o).to.be.instanceOf(Order)
        expect(this.dateSpy).to.have.been.calledTwice
        expect(this.o).to.have.property('ref').to.equal(123)
        expect(this.o).to.have.property('user').to.deep.equal(this.user)
        expect(this.o).to.have.property('items').to.deep.equal(this.items)
        expect(this.o).to.have.property('status').to.equal('Pending')
        expect(this.o).to.have.property('createdAt').to.be.a('Number')
        expect(this.o).to.have.property('updatedAt').to.be.a('Number')
        expect(this.o).to.have.property('subtotal').to.equal(15)
        expect(this.o).to.have.property('shipping').to.equal(5)
        expect(this.o).to.have.property('total').to.equal(20)

        expect(this.o.save).to.be.a('function')
        expect(this.o.cancel).to.be.a('function')
        expect(this.o.ship).to.be.a('function')
    }

    @it('should update status to active and return the order')
    testSave1(): TR {
        const result = this.o.save()
        expect(this.dateSpy).to.have.been.calledThrice
        expect(this.o.status).to.equal('Active')
        expect(result).to.be.an('Object')
        expect(result).to.have.property('ref').to.equal(123)
        expect(result).to.have.property('user').to.equal('foo')
        expect(result).to.have.property('updatedAt').to.be.a('Number')
        expect(result).to.have.property('items').to.deep.equal(this.items)
        expect(result).to.have.property('shipping').to.equal(5)
        expect(result).to.have.property('total').to.equal(20)
    }

    @it('should update status to active and return order details')
    testCancel1(): TR {
        const result = this.o.cancel()

        expect(this.warnStub).to.have.been.calledWith('Order cancelled')
        expect(this.dateSpy).to.have.been.calledThrice
        expect(this.o.status).to.equal('Cancelled')
        expect(result).to.be.true
        expect(this.o.shipping).to.equal(0)
        expect(this.o.total).to.equal(0)
    }

    @it('should update status to shipped')
    testShip1(): TR {
        this.o.ship()

        expect(this.o.status).to.equal('Shipped')
        expect(this.dateSpy).to.have.been.calledThrice
    }
}