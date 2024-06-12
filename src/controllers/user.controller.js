
import { asyncHandler } from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {uploadOnClodinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"

const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const registerUser = asyncHandler( async(req, res) => {
    // get the user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for imges, check for avatar
    // upload them to cloudinay, avatar
    // create user object - create entry in db
    // remove password and refresh toekn field from esponse
    // check for user creation
    // return res

    const {fullName, email, username, password} = req.body
    // console.log("email: ", email)

    // if(fullName === ""){
    //     throw new ApiError(400, "fulname is required")
    // }

    if(
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "all fields are required")
    }







    // check if user already exists: username, email
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if(existedUser) {
        throw new ApiError(409, "User with email or username already exist")
    }
    // console.log(req.files); -- for on console print the avatar or cloudimage location

    // check for imges, check for avatar
    const avatarLocalPath =  req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    


    // upload them to cloudinay, avatar
    const avatar = await uploadOnClodinary(avatarLocalPath)
    const coverImage = await uploadOnClodinary 
    (coverImageLocalPath)
    
    if (!avatar) {
        throw new ApiError(400, "Aavtar file is required")
    }




    // create user object - create entry in db
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })




    // remove password and refresh toekn field from esponse
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )



    // check for user creation
    if(!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }




    // return res
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registed Succesfully")
    )
} )





const loginUser = asyncHandler(async (req, res) =>{
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie

    const {email, username, password} = req.body
    console.log(email);

    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }
    
    // Here is an alternative of above code based on logic discussed in video:
    // if (!(username || email)) {
    //     throw new ApiError(400, "username or email is required")
        
    // }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

   const isPasswordValid = await user.isPasswordCorrect(password)

   if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
    }

   const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

})




const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})



const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if(incomingRefreshToken) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
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
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Ivalid refresh token")
    }
})


const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword} = req.body

    /* // for confirm password
    // const {oldPassword, newPassword, confirmPassword} = req.body
    // if(!(newPassword === confirmPassword) ) {
    //     throw new(401, "new password and confirm password is not same")
    // }
    */
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new(401, "Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed Successfully"))

})


const getCurrentUser = asyncHandler(async(req, res) =>{
    return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched successfully"))
})


const updateAccountDetails = asyncHandler(async(req,res) => {
    const {fullName, email} = req.body 

    if(!fullName || !email){
        throw new ApiError(400, "All fileds are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName, // or fullName: fullName
                email: email //or email
            }
        },
        {new: true}


    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account deatils Update Succesfully"))
})


const updateUserAvatar = asyncHandler(async(req,res) => {
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath ) {
        throw new ApiError(400, "avatar file is missing")
    }

    const avatar = await uploadOnClodinary(avatarLocalPath)

    if(!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
    }

    // TODO: delete old image 


    // const user = await User.findByIdAndUpdate(
    //     req.user?._id,
    //     {
    //         $set: {
    //             avatar: avatar.url
    //         }
    //     },
    //     {new: true}
    // ).select("-password")

    // Retrieve the user to get the old avatar URL
    const user = await User.findById(req.user?._id);

    if(!user) {
        throw new ApiError(404, "User not found");
    } 

    const oldAvatarUrl = user.avatar;

    // Update the user's avatar with the new URL
    user.avatar = avatar.url;
    await user.save();

    // TODO: Delete old image from Cloudinary
    if (oldAvatarUrl) {
        await deleteFromCloudinary(oldAvatarUrl);
    }

    // Return the updated user, excluding the password
    const updatedUser = await User.findById(req.user?._id).select("-password");
    

    return res
    .status(200)
    // .json(new ApiResponse(200, user, "Avatar image updated successfuly"))
    .json(new ApiResponse(200, updatedUser, "Avatar image updated succesfully"));
})

// Helper function to delete image from clodianary
const deleteFromCloudinary = async (url) => {
    // extract the public ID from the url
    const publicId = url.split('/').pop().split('.')[0];

    // call cloudinary destroy method to delte the image
    await deleteFromCloudinary.uploader.destroy(publicId, function(error, result){
        if(error){
            console.error("Error deleting old avatar form cloudinary: ", error)
        } else{
            console.log("Old avatar delete from cloudinary: ", result)
        }
    }) 
}


const updateUserCoverImage = asyncHandler(async(req,res) =>{
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath) {
        throw new ApiError(400, "cover Image file is missing")
    }

    const coverImage = await uploadOnClodinary(coverImageLocalPath)

    if(!coverImage.url) {
        throw new ApiError(400, "Error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "cover image updated successfully"))

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
    updateUserCoverImage
    
}