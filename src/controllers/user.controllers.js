// user.controllers.js
import { asyncHandler } from '../utils/AsyncHandler.js';
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/Cloudinary.js';
import {ApiResponse} from '../utils/ApiResponse.js'
const registerUser = asyncHandler(async (req, res) => {
    
    const {username, email, fullName, password} = req.body
    console.log("email: ", email);
    
    if (
        [fullName, email, username, password].some((field)=>field?.trim ==="")
    ) {
        throw new ApiError(400,"All feilds are required")
    }

    const  existedUser =User.findOne({ 
        $or: [email, username
    ]})
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

export { registerUser };
