// NODE ONLY
import * as express from 'express'
import { Express } from 'express'
import { urlencoded, json } from 'body-parser'
import { connect } from 'mongoose'

export const app: Express = express()

import { getURL } from '../config/database'
import { createUser, updateUser, deleteUser, resetPassword } from './users'
import { isAuthorized } from './auth'

connect(getURL())

app.use(urlencoded({
    extended: true
}))

app.use(json())

//-----------------------------------> routes
app.get('/', (req, res) => {
    res.status(200).json({
        name: 'Foo Fooing Bar'
    })
})

function handleError(res: express.Response<unknown>, err: Error): void {
    if ( err instanceof Error) {
        res.status(400).json({
            error: err.message
        })
        return
    }

    res.status(400).json(err)
}

app.post('/user', async (req, res) => {
    try {
        const result = await createUser(req.body)
        res.json(result)
    } catch (err) {
        handleError(res, err)
    }
})

app.get('/user/:id', async (req, res) => {
    // res.send('User route')
    try {
        const result = await updateUser(req.params.id, req.body)
        res.json(result)
    } catch (err) {
        handleError(res, err)
    }
})

app.delete('/user/:id', isAuthorized, async (req, res) => {
    try {
        const result = await deleteUser(req.params.id)
        res.json(result)
    } catch (err) {
        handleError(res, err)
    }
})

app.get('/reset/:email', async (req, res) => {
    try {
        await resetPassword(req.params.email)
        res.json({
            message: 'Password reset email has been send.'
        })
    } catch (err) {
        handleError(res, err)
    }
})

//-------------------------------> misc
//404
app.use((ignoreRequst, res, ignoreNext) => {
    return res.status(404).send('404 - Page Not Found.')
})

//500
app.use((ignoreRequest, res, ignoreNext) => {
    //res.status = res.status || 500
    return res.status(500).send(res.status + '. An unknown error has occured.')
})