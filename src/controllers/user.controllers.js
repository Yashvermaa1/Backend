// user.controllers.js
import { asyncHandler } from '../utils/AsyncHandler.js';
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/Cloudinary.js';
import {ApiResponse} from '../utils/ApiResponse.js'
import { set } from 'mongoose';
const registerUser = asyncHandler(async (req, res) => {
    
    const {username, email, fullName, password} = req.body
    console.log("email: ", email);
    
    if (
        [fullName, email, username, password].some((field)=>field?.trim ==="")
    ) {
        throw new ApiError(400,"All feilds are required")
    }

    const  existedUser = await User.findOne({ 
        $or: [
            { email: email },
            { username: username }
        ]
    })
    if (existedUser) {
        throw new ApiError (409, "User with email or username already exist")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const CoverImageLocalPath = req.files?.coverImage[0]?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(CoverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        password,
        email,
        username: username.toLowerCase()
    })
    const createduser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if (!createduser) {
        throw new ApiError(500, "SOmething went wrong while registering user")
    }
    return res.status(201).json(
        new ApiResponse(200, createduser, "User registered sucessfully")
    )
    // res.status(200).json({
    //     message: "OK"
    // });
});

const generateAccessAndRefreshTokens = async(userId) => {
try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()
    user.refreshToken = refreshToken
    await user.save({validateBeforeSave: false})
    return {accessToken, refreshToken}
} catch (error) {
    throw new ApiError (500,"Something went wrong while generating access and refresh tokens")
}
}

const loginUser = asyncHandler(async (req, res) => {
// req body se data
// username || email
// find the user
// password verify
// access and refresh token
// send cookies
const {username, email, password } = req.body
if (!(username || email)) {
    throw new ApiError(400, "username or email is required");
}
const user = await User.findOne({
    $or:[{username}, {email}]
})
if (!user) {
    throw new ApiError(404,"user doesn't exist")
}
const isPasswordValid = await user.isPasswordCorrect(password)
if (!isPasswordValid) {
    throw new ApiError(401,"Invalid user credentials")
}
const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

const options ={
    httpOnly:true,
    secure: true
}
return res
.status(200)
.cookie("accessToken", accessToken, options)
.cookie("refreshToken", refreshToken, options)
.json(new ApiResponse(200,{
    user: loggedInUser, accessToken, refreshToken
}, "User logged in sucessfully"))
})

const logoutUser = asyncHandler(async (req, res) => {
    User.findByIdAndUpdate(
        req.user._id,
        {
            $set:
            {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )
    const options ={
        httpOnly:true,
        secure: true
    }
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200,{}, "User Logged Out"))
})

const refreshAccessToken = asyncHandler(async(req, res) => {
    const incomingRefreshToken = req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request")
    }
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET
        )
        const user = await User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(401, "Invalid refresh token")
        }
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh access token is expired or used")
        }
        const options = {
            httpOnly: true,
            secure: true
        }
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Acess token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler(async(req, res) =>{
    const {oldPassword, newPassword, confirmNewPassword} = req.body
    if(!(newPassword === confirmNewPassword)){
        throw new ApiError(400,"New password doesn't match confirm new password")
    }
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = user.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }
    user.password = newPassword
    await user.save({validateBeforeSave:false})
    return res
    .status(200)
    .json(new ApiResponse(200,{},"Password change successfully"))
})

const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(200,req.user,"current user fetched successfully")
})

const updateAccountDetails = asyncHandler(async(req, res)=>{
    const {fullName, email} = req.body
    if (!(fullName || email)) {
        throw new ApiError(400, "please enter atleast email or fullname to change")
    }
    const user = await User.findById(
        req.user?._id,
        {
            $set:{
                fullName: fullName,
                email: email
            }
        },
        {new: true}).select("-password")
        return res
        .status(200)
        .json(new ApiResponse(200, user, "Accounts deatils successfully updated"))
})

const updateUserAvatar = asyncHandler(async(req, res) =>{
    const avatarLocalPath = req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if(!avatar.url){
        throw new ApiError(404, "Error while uploading avatra on cloudinary")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new:true}
    ).select("-password")
    return res
    .status(200)
    .json(200,user,"Avatar is udated successfully" )
})

const updateCoverImage = asyncHandler(async(req, res) =>{
    const coverImageLocalPath = req.file?.path
    if(!coverImageLocalPath){
        throw new ApiError(400,"coverImage file is required")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!coverImage.url){
        throw new ApiError(404, "Error while uploading coverImage on cloudinary")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new:true}
    ).select("-password")
    return res
    .status(200)
    .json(200,user,"coverImage is udated successfully" )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateCoverImage
};
