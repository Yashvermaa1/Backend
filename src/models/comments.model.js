import mongoose, {Schema, Types} from "mongoose";
import { Video } from "./video.model";
import { User } from "./user.model";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const commentsSchema = new Schema(
    {
        content:{
            type:"String",
            required:true,
        },
        videos:{
            type:Schema.Types.ObjectId,
            ref:Video
        },
        owner:{
            type:Schema.Types.ObjectId,
            ref:User
        }
    },{timestamps:true})

    commentsSchema.plugin(mongooseAggregatePaginate)


export const Comments = mongoose.model("Comments", commentsSchema)