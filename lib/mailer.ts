function sendEmail(email: string, body: string): Promise<string> {
    // console.log('--- in mailer > sendEmail')
    if( !email || !body) {
        return Promise.reject(new Error('Invalid input'))
    }

    return new Promise((resolve/*, rejects*/) => {
        setTimeout(()=> {
            console.log('Email Sent!')
            //return rejects(new Error('Fake Error'))
            return resolve('Email sent')
        }, 100)
    })
}

export function sendWelcomeEmail(email: string, name: string): Promise<string> {
    // console.log('--- in mailer > sendWelcomeEmail')
    if (!email || !name) {
        return Promise.reject(new Error('Invalid input'))
    }

    const body = `Dear ${name}, welcome to our family!`;

    return sendEmail(email, body)
}

export function sendPasswordResetEmail(email: string): Promise<string> {
    // console.log('--- in mailer > sendPasswordResetEmail')
    if (!email) {
        return Promise.reject(new Error('Invalid input'))
    }

    const body = 'Please click http://some_link to reset your password.'

    return sendEmail(email, body)
}
