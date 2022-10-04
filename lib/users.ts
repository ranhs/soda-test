import { User, UserModelInterface, UserInterface } from './models/user'
import { sendWelcomeEmail, sendPasswordResetEmail } from './mailer'

export function get(id: string|number): Promise<UserModelInterface> {
    return new Promise<UserModelInterface>( (resolve, reject) => {
        if (!id) {
            return reject(new Error('Invalid user id'))
        }

        User.findById(id, function(err, result) {
            if ( err ) {
                return reject(err)
            }

            return resolve(result)
        })

    })
}

export async function deleteUser(id: string|number): Promise<unknown> {
    if ( !id ) {
        return Promise.reject(new Error('Invalid id'))
    }

    const rv = User.remove({
        _id: id
    })

    return Promise.resolve(rv)
}

export function createUser(data: UserInterface): Promise<{message: string,userId: string | number}> {
    if (!data || !data.email || !data.name) {
        return Promise.reject(new Error('Ivalid arguments'))
    }

    const user = new User(data as never)

    // console.log('user', user)

    return user.save().then((result)=>{
         return sendWelcomeEmail(data.email, data.name).then(()=>{
             return {
                 message: 'User created',
                 userId: result.id
             }
         })
     }).catch((err)=>{
         return Promise.reject(err)
     })
}

export async function updateUser(id: string|number, data: UserInterface): Promise<UserModelInterface> {
    try {
        const user = await get(id)

        for (const prop in data) {
            user[prop] = data[prop]
        }
    
        const result = await user.save()
    
        return result
    } catch ( err) {
        // console.warn(err)
        return Promise.reject(err)
    }
}

export async function resetPassword(email: string): Promise<string> {
    if ( !email ) {
        throw new Error('Invalid email')
    }

    // some operations
    
    return await sendPasswordResetEmail(email)

}