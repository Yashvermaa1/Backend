import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/likes.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    if(!videoId){
        throw new ApiError(400,"videoId is required")
    }
    const likedDoc = await Like.findOne({
        likedBy:req.user._id,
        video:videoId
    })
    if (likedDoc) {
        await Like.findOneAndDelete({
            likedBy:req.user._id,
            video:videoId
        })
        return res
        .status(200)
        .json(new ApiResponse(200, {likeStatus:false}, "unliked successfully"))
    }
    await Like.create({
        likedBy:req.user._id,
        video:videoId
    })
    return res
    .status(200)
    .json(new ApiResponse(200, {likeStatus: true}, "liked successfully"))
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    if(!commentId){
        throw new ApiError(400,"commentId is required")
    }
    const likedDoc = await Comment.findOne({
        likedBy:req.user._id,
        Comment:commentId
    })
    if (likedDoc) {
        await Like.findOneAndDelete({
            likedBy:req.user._id,
            Comment:commentId
        })
        return res
        .status(200)
        .json(new ApiResponse(200, {likeStatus:false}, "unliked successfully"))
    }
    await Like.create({
        likedBy:req.user._id,
        Comment:commentId
    })
    return res
    .status(200)
    .json(new ApiResponse(200, {likeStatus: true}, "liked successfully"))
})

// const toggleTweetLike = asyncHandler(async (req, res) => {
//     const {tweetId} = req.params
//     //TODO: toggle like on tweet
// })

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const likedVideos = await Like.aggregate([
        {
            $match:{
                likedBy: new mongoose.Types.ObjectId(req.user._id),
                video:{ $ne: null },
                video:{ $exists: true },
                video:{ $ne: undefined },
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as:"likedVideosDetails",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"userDetails",
                            pipeline:[
                                {
                                    $projects:{
                                        _id:1,
                                        userName:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addField:{
                            owner:{
                                $first:"$userDetails"
                            }
                        }
                    }
                ]
            }
        },
        {
            $addField:{
                likedVideoDetails:{
                    $first:"$likedVideoDetails"
                }
            }
        }
    ])
    return res
    .status(200)
    .json(new ApiResponse(200, likedVideos, "liked Videos fetched successfully"))
})

export {
    toggleCommentLike,
    toggleVideoLike,
    getLikedVideos
}