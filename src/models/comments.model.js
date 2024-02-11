import mongoose, {Schema} from "mongoose";
const commentsSchema = new Schema(
    {

    },{timestamps:true})

export const Comments = mongoose.model("Comments", commentsSchema)