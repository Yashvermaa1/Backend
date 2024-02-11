import mongoose, {Schema} from "mongoose";
const likesSchema = new Schema(
    {

    },{timestamps:true})

export const Likes = mongoose.model("Likes", likesSchema)