import {asyncHandler} from '../utils/AsyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import {Video} from '../models/video.model.js'
import mongoose from 'mongoose'
import {uploadOnCloudinary , deleteVideoonCloudinary, deleteImageonCloudinary, deleteAssetOnCloudinary} from '../utils/Cloudinary.js'

const gettAllVideos = asyncHandler(async(req,res)=>{
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    if(!query && !sortBy && !sortType){
        throw new ApiError(400,"query, sortBy, sortType all are required!!!")
    }
    // create custom aggregate pipelines
    const customAggregatePipeline = [
        {
            $match:{
                $or:[
                    {title:{$regex:new RegExp(query,si)}},
                    {description:{$regex:new RegExp(query,si)}}
                ]
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
                            username:1,
                            avatar:1
                        }
                    }
                ]                
            }
        },
        {
            $addField:{
                owner:{
                    arrayElemAt:["$owner", 0]
                }
            }
        },
        {
            $sort:{
                sortBy: sortType === "asc" ? 1 : -1
            }
        }
    ]
    const videos = await Video.aggregate(customAggregatePipeline)
    if (!videos) {
        throw new ApiError(400, "No video found")
    }
    return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"));
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    if (!title && !description) {
        throw new ApiError(400,"title and description for the video is required")
    }
    // TODO: get video, upload to cloudinary, create video
    const videoLocalPath = req?.videoFile[0].path
    const thumbnailLocalPath = req?.thumbnail[0].path
    if (!videoLocalPath && !thumbnailLocalPath) {
        throw new ApiError(400, "videoLocalPath and thumbnailLocalPath both are required")
    }
    
    const video = await uploadOnCloudinary(videoLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    if (!video && !thumbnail) {
        throw new ApiError(500, "there is an error while uploading on cloudinary")
    }
    const videoResponse = await Video.create(
        {
            videoFile:{
                asset_id:video.asset_id,
                url:video.url,
                public_id:video.public_id,
                resource_type:video.resource_type
            },
            thumbnail:{
                asset_id:thumbnail.asset_id,
                url:thumbnail.url,
                public_id:thumbnail.public_id,
                resource_type:thumbnail.resource_type
            },
            duration:video.duration,
            owner:req.user._id,
            title,
            description
        }
    )
    if (!videoResponse) {
        throw new ApiError(500,"Something went wrong while uploading on MongoDB")
    }
    return res
    .status(200)
    .json(200, videoResponse, "video is sucessfully uploaded")
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if (!videoId) {
        throw new ApiError(400, "videoId is required")
    }
    if (!mongoose.Types.ObjectId.isValid({_id: videoId})) {
        throw new ApiError(400, "Invalid videoId")
    }
    const video = Video.findOne({_id:videoId})

    if (!video) {
        throw new ApiError(404,"Video is not found")
    }
    return res
    .status(200)
    .json(200, video, "video is successfully fetched")
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!videoId) {
        throw new ApiError(400, "videoId is required")
    }
    if (!mongoose.Types.ObjectId.isValid({_id: videoId})) {
        throw new ApiError(400, "Invalid videoId")
    }
    //TODO: update video details like title, description, thumbnail
    const {title, description, thumbnail} = req.body
    let deletedthumbnailStatus;
    if(!(title || description || req.file)){
        throw new ApiError(400,"Any details like title, description, thumbnail is required to update")
    }
    let updatedFields={}
    if(title){
        updatedFields.title = title
    }
    if(description){
        updatedFields.description = description
    }
    if (req.file) {
        try {
          const updatedThumbanil = await uploadOnCloudinary(req?.file.path);
          updatedFields.thumbnail = updatedThumbanil;
    
          const video = await Video.findById(videoId);
    
          deletedthumbnailStatus = await deleteAssetOnCloudinary(
            video.thumbnail.public_id
          );
        } catch (error) {
          throw new ApiError(500,"Something went wrong While updating a video on clodinary");
        }
    }
    const updatedVideo = await Video.findByIdAndUpdate(
        videoId, {
            $set:updatedFields
        },
        {
            new:true
        }
    )
    if (!updatedVideo) {
        throw new ApiError(400, "there is an error while uploading on cloudinary")
    }
    return res
    .status(200)
    .json(200, updateVideo, "vvideo is been sucessfully updated")
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if (!videoId) {
        throw new ApiError(400, "videoId is required")
    }
    if (!mongoose.Types.ObjectId.isValid({_id: videoId})) {
        throw new ApiError(400, "Invalid videoId")
    }
    const deletedVideo = Video.findByIdAndDelete({_id:videoId}, {new:true})
    let deletedVideoResult = await deleteVideoonCloudinary(
        deletedVideo.videoFile.public_id
    );
  
    let deletedThumbnailResult = await deleteImageonCloudinary(
        deletedVideo.thumbnail.public_id
    );
    if (deletedVideo) {
        throw new ApiError(400, "there is an error while deleting video")
    }
    return res
    .status(200)
    .json(200,{deletedVideo, deletedVideoResult: deletedVideoResult, deletedThumbnailResult: deletedThumbnailResult}, "videos has been sucessfully deleted")
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!videoId) {
        throw new ApiError(400, "videoId is required")
    }
    if (!mongoose.Types.ObjectId.isValid({_id: videoId})) {
        throw new ApiError(400, "Invalid videoId")
    }
    const togglePublishAggregatePipeline = [
        {
            $match:{
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $set:{
                PublishedId:{
                    $cond:{
                        if:{$eq:["$isPublished", true]},
                        then:false,
                        else:true,
                    }
                }
            }
        },
        {
            $projects:{
                _id:1,
                owner:1,
                PublishedId:1,
                title:1,
            }
        }
    ]
    const  updatedVideo = await Video.aggregate(togglePublishAggregatePipeline)
    if (!updatedVideo) {
        throw new ApiError(400, "Video not found");
    }
    
    return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
})


export {gettAllVideos, publishAVideo, getVideoById, updateVideo, deleteVideo, togglePublishStatus}