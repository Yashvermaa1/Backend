import mongoose from "mongoose"
import {Comment} from "../models/comments.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    const options = {
        page,
        limit
    }
    if(!videoId){
        throw new ApiError(400, "videoId is required")
    }
    try {
            const commmentAggregate = await Comment.aggregate([
                {
                    $match:{
                        video: new mongoose.Types.ObjectId(videoId)
                    }
                },
                {
                    $lookup:{
                        from:"users",
                        localField:"owner",
                        foreignField:"_id",
                        as:"owner",
                        pipeline:[
                            {
                                $projects:{
                                    userName:1,
                                    avatar:1
                                }
                            }
                        ]
                    }
                },
                {
                    $lookup:{
                        from:"like",
                        localField:"_id",
                        foreignField:"comment",
                        as:"likedBy",
                        pipeline:[
                            {
                                $group:{
                                    _id:null,
                                    totalLikes:{
                                        $sum:1
                                    }
                                }
                            },
                            {
                                $projects:{
                                    _id:0,
                                    totalLikes:1
                                }
                            }
                        ]
                    }
                },
                {
                    $addFields:{
                        likedBy:{
                            $size:"$likedBy"
                        },
                        owner:{
                            $arrayElemAt: ["$owner", 0],
                        }
                    }
                }
            ])
            if (!commmentAggregate) {
                throw new ApiError(400, "error while fetching comments")
            }
            return res
            .status(200)
            .json(new ApiResponse(200, commmentAggregate, "comments fetched successfully"))
    } catch (error) {
        throw new ApiError(400,error?.message, "somethingn went wrong while fetching comments")
    }
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { comment } = req.body;
    const { videoId } = req.params;
    if(!comment && !videoId){
        throw new ApiError(400, "comment and videoId is required")
    }
    const commenting = await Comment.create({
        comment:comment,
        owner:req.user._id,
        video:videoId
    })
    if(!commenting){
        throw new ApiError(400, "something went wrong while commenting")
    }
    return res
    .status(200)
    .json(200, commenting, "commenting is successfully updated")
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    let {newComment} = req.body
    const {commentId} = req.params
    if(!newComment && !commentId){
        throw new ApiError(400, "newComment and commmnetId is required")
    }
    const updateComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set:{
                comment: newComment
            }
        }
    )
    if(!updateComment){
        throw new ApiError(400, "error while updating comment")
    }
    return res.status(200).json(200,updateComment, "comment is successfully is commented")
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const{commentId} = req.params
    if (commentId) {
        throw new ApiError(400, "commentId is required")
    }
    const deletedComment = await Comment.findByIdAndDelete(commentId)
    if (!deletedComment) {
        throw new ApiError(400, "Something went wrong while deleting commments")
    }
    return res.status(200).json(new ApiResponse(200, deleteComment, "comment is succesfully deleted"))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
}