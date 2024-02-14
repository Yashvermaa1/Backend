import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    if (!channelId) {
        throw new ApiError(400, "channelId is required")
    }
    const subscribed = await Subscription.findOne({
        subscriber: req.user._id,
        channel:channelId
    })
    if (!subscribed) {
        try {
            const subscribe = await Subscription.create({
                subscriber:req.user._id,
                channel:channelId
            })
            return res
            .status(200)
            .json(200, subscribe, "Subscribe successfully")
        } catch (error) {
            throw new ApiError(500, "Something went wrong while subscribing channel")
        }
    }
    try {
        const deleteSubscription = await Subscription.findByIdAndDelete(subscribed._id)
        return res
        .status(200)
        .json(200, deleteSubscription, "subscription delete successfully") 
    } catch (error) {
        throw new ApiError(400,"something went wrong while deleting Subscription")
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if (!channelId) {
        throw new ApiError(400, "channelId is required")
    }
    try {
        const subscriberCount = await mongoose.Aggregate([
            {
                $match:{
                    subscriber: new mongoose.Types.ObjectId(channelId)
                }
            },
            {
                $group:{
                    _id:null,
                    subscriberCount:{
                        $sum:1
                    }
                }
            },
            {
                $addFields:{
                    subscriberCount: subscriberCount
                }
            },
            {
                $projects:{
                    _id:0,
                    subscriberCount:1
                }
            }
        ])
        if (!subscriberCount) {
            throw new ApiError(400, "While accessing the subscribers")
        }
        return res
        .status(200)
        .json(200, subscriberCount,"subscriber fetched successfully")
    } catch (error) {
        throw new ApiError(400, error?.message || "While accessing the subscribers")
    }
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if(subscriberId){
        throw new ApiError(400, "Subscriber Id required")
    }
    try {
        const subscribedChannel = await Subscription.aggregate([
            {
                $match:{
                    subscriber:new mongoose.Types.ObjectId(subscriberId),
                }
            },
            {
                $lookup:{
                    from:"users",
                    localField:"channel",
                    foreignField:'_id',
                    as:"channel",
                    pipeline:[
                        {
                            $project:{
                                username:1,
                                avatar:1,
                                _id:1,
                                fullName:1
                            }
                        }
                    ]
                }
            },
            {
                $addFields:{
                    channel:{
                        $first:"$channel"
                    }
                }
            }
        ])
        if (!subscribedChannel) {
            throw new ApiError(400,"Error while accessing subscribed cahnnel")
        }
        return res
        .status(200)
        .json(200, subscribedChannel, "Subscribed fetched sucessfully")
    } catch (error) {
        throw new ApiError(
            400,
            error?.message || "While accessing the subscribed Channel"
          );
    }
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}