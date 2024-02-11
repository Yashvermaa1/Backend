import mongoose, {Schema} from "mongoose";
import { User } from "./user.model";
import { Video } from "./video.model";
const likesSchema = new Schema(
    {
        likedBy:{
            type:Schema.Types.ObjectId,
            ref:User
        },
        videos:{
            type:Schema.Types.ObjectId,
            ref:Video
        }
    },{timestamps:true})

export const Likes = mongoose.model("Likes", likesSchema)