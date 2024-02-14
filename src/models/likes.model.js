import mongoose, {Schema} from "mongoose";
import { User } from "./user.model.js";
import { Video } from "./video.model.js";
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

export const Like = mongoose.model("Likes", likesSchema)