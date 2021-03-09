import {Schema, model, Model, Document} from 'mongoose'

export interface UserInterface {
    name: string
    email: string
    age?: number
}

export interface UserModelInterface extends UserInterface, Document {
}

const UserSchema: Schema = new Schema({
    name: {type: String, required: true},
    email: {type: String, required: true},
    age: Number
}, {
    collection: 'users'
}) // overrides default collection name auto created

const UserModel: Model<UserModelInterface> = model<UserModelInterface>('User', UserSchema)

export class User extends UserModel {
}
