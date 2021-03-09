import { expect, describe, context, it, PTR, SinonStub, stub, beforeEach, Rewire, rewire } from '.'

import { sendWelcomeEmail, sendPasswordResetEmail } from './mailer'

@describe('mailer')
class MailerTest {

    @stub('./mailer', 'sendEmail').resolves('done')
    emailStub: SinonStub
    

@context('sendWelcomeEmail')

    @it('should check for email and name')
    async checkArgs1(): PTR {
        await expect(sendWelcomeEmail(null, null)).to.eventually.be.rejectedWith('Invalid input')
        await expect(sendWelcomeEmail('foo@bar.com', null)).to.eventually.be.rejectedWith('Invalid input')
    }

    @it('should call sendEmail with email and message')
    async callSendEmail1(): PTR {
        await sendWelcomeEmail('foo@bar.com', 'foo')

        expect(this.emailStub).to.have.been.calledWith('foo@bar.com', 'Dear foo, welcome to our family!')
    }

    @context('sendPasswordResetEmail')

    @it('should check for email')
    async checkArgs2(): PTR {
        await expect(sendPasswordResetEmail(null)).to.eventually.be.rejectedWith('Invalid input')
    }

    @it('should call sendEmail with email and message')
    async callSendEmail2(): PTR {
        await sendPasswordResetEmail('foo@bar.com')

        expect(this.emailStub).to.have.been.calledWith('foo@bar.com', 'Please click http://some_link to reset your password.')
    }

@context('sendEmail')

    @rewire('./mailer')
    mailRewire: Rewire

    sendEmail: (email: string, body: string) => Promise<string>

    @beforeEach()
    sendEmailBeforeEach(): void {
        this.emailStub.restore()
        this.sendEmail = this.mailRewire.get('sendEmail')
    }

    @it('should check for email and body')
    async checkArgs3(): PTR {
        await expect(this.sendEmail(null, null)).to.eventually.be.rejectedWith('Invalid input')
        await expect(this.sendEmail('foo@bar.com', null)).to.eventually.be.rejectedWith('Invalid input')
    }

    @it('should call sendEmail with email and message')
    async callSendEmail3(): PTR {
        // stub actual mailer
        const result = await this.sendEmail('foo@bar.com', 'welcome')

        expect(result).to.equal('Email sent')
    }
}