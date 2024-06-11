import mongoose, {Schema, Types} from "mongoose"
import { User } from "./user.models"

const subscriptionSchema = new Schema ({
    subscriber : {
        type:  Schema.Types.ObjectId, // one who is Subscribibng
        ref: "User"
    },
    channel: {
        type:  Schema.Types.ObjectId, // one to whim 'subscriber' is subscribing
        ref: "User"
    }
}, {timestamps: true} )






export const Subscription = mongoose.model("Subscription",
    subscriptionSchema )