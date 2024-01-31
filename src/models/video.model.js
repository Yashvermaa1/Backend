import mongoose, { Schema} from "mongoose";
import { User } from "./user.model";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const videoSchema = new Schema(
    {
        videoFile:{
            type:String,//cloudinary
            required:true
        },
        thumbnail:{
            type:String, //cloudinary
            required:true
        },
        owner:{
            type:Schema.Types.ObjectId,
            ref:User,
            required:true
        },
        title:{
            type:String,
            required:true,
            index:true
        },
        description:{
            type:true,
            required:true
        },
        duration:{
            type:Number,
            required:true
        },
        views:{
            tyoe:Number,
            default:0
        },
        isPublished:{
            type:Boolean,
            default:true
        },
        
    }, {timestamps:true})

    videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video", videoSchema)