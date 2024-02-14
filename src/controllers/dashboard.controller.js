import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const getChannelStats = asyncHandler(async (req, res) => {
    const channelId = req.params.channelId;

    try {
        if (!channelId) {
            throw new ApiError(400, "channelId is missing");
        }

        const totalVideoViews = await Video.aggregate([
            { $match: { channel: mongoose.Types.ObjectId(channelId) } },
            { $group: { _id: null, totalViews: { $sum: "$views" } } }
        ]);

        if (!totalVideoViews || totalVideoViews.length === 0) {
            throw new ApiError(404, "No videos found for the specified channel");
        }

        const totalSubscribers = await Subscription.countDocuments({ channel: channelId });
        if (totalSubscribers === undefined || totalSubscribers === null) {
            throw new ApiError(500, "Error while fetching channel totalSubscribers");
        }

        const totalVideos = await Video.countDocuments({ channel: channelId });
        if (totalVideos === undefined || totalVideos === null) {
            throw new ApiError(500, "Error while fetching channel totalVideos");
        }

        const totalLikes = await Like.countDocuments({ channel: channelId });
        if (totalLikes === undefined || totalLikes === null) {
            throw new ApiError(500, "Error while fetching channel totalLikes");
        }

        const channelStats = {
            totalVideoViews: totalVideoViews[0].totalViews,
            totalSubscribers,
            totalVideos,
            totalLikes
        };

        res.json(new ApiResponse("Channel stats retrieved successfully", channelStats));
    } catch (error) {
        res.status(error.status || 500).json(new ApiResponse(error.message || "Internal Server Error", null, error));
    }
});
const getChannelVideos = asyncHandler(async (req, res) => {
    const channelId = req.params.channelId;

    try {
        if (!channelId) {
            throw new ApiError(400, "channelId is missing");
        }

        const channelVideos = await Video.find({ channel: channelId }).populate('likes');

        if (!channelVideos || channelVideos.length === 0) {
            throw new ApiError(404, "No videos found for the specified channel");
        }

        res.json(new ApiResponse("Channel videos retrieved successfully", channelVideos));
    } catch (error) {
        res.status(error.status || 500).json(new ApiResponse(error.message || "Internal Server Error", null, error));
    }
});

export {
    getChannelStats,
    getChannelVideos
};
