import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    //TODO: create playlist
    const {name, description, arrayOfVideoId} = req.body
    if (!(name || description)) {
        throw new ApiError(400, "name or description is required")
    }
    if(!arrayOfVideoId){
        throw new ApiError(400, "arraofVideoId is required")
    }
    if(Array.isArray(arrayOfVideoId)){
        throw new ApiError(400, "Invalid video Id type")
    }
    const videoPlaylist = await Playlist.create({
        name,
        description,
        owner: req.user._id,
        video: arrayOfVideoId
    })
    if (videoPlaylist) {
        throw new ApiError(400, "error while creating playlist")
    }
    return res
    .status(200)
    .json(200, videoPlaylist,"playlist is successfully created")
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if (!userId) {
        throw new ApiError(400,"userId is required")
    }
    const videoPlaylist = await Playlist.find({
        owner:userId
    })
    if(!videoPlaylist){
        throw new ApiError(400, "Something went wrong while fetching playlist")
    }
    return res
    .status(200)
    .json(200, videoPlaylist, "Playlist is fetched successfully")
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if(!playlistId){
        throw new ApiError(400, "PlaylistID ID is required")
    }
    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(400, "Something went wrong while fetching playlist")
    }
    return res
    .status(200)
    .json(200, playlist, "playlist successfully fetched")
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!playlistId && !videoId){
        throw new ApiError(400, "playlistId and videoId is required")
    }
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $push:{
                video: videoId
            }
        },
        {new:true}
    )
    if(!updatedPlaylist){
        throw new ApiError(400, "something went wrong while updating playlist")
    }
    return res
    .status(200)
    .json(200, updatePlaylist, "playlist is successfully updated")
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if(!playlistId && !videoId){
        throw new ApiError(400, "playlistId and videoId is required")
    }
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull:{
                video: videoId
            }
        },
        {new:true}
    )
    if(!updatedPlaylist){
        throw new ApiError(400, "something went wrong while updating playlist")
    }
    return res
    .status(200)
    .json(200, updatePlaylist, "playlist is successfully updated")

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if(!playlistId){
        throw new ApiError(400, "playlistId is required")
    }
    const updatedPlaylist = await Playlist.findByIdAndDelete(
        playlistId
    )
    if(!updatedPlaylist){
        throw new ApiError(400, "something went wrong while updating playlist")
    }
    return res
    .status(200)
    .json(200, updatePlaylist, "playlist is successfully updated")


})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    if (!playlistId) {
        throw new ApiError(400, "playlistID is required")
    }
    if (!name && !description) {
        throw new ApiError(400, "name and description both are required")
    }
    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $sest:{
                name:newName,
                description : newDescription
            }
        },
        {new: true}
    )
    if(!playlist){
        throw new ApiError(400, "Something went wrong while updating playlist")
    }
    return res
    .status(200)
    .json(200, playlist, "playlist is successfully updated")
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}