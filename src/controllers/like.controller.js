import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

})


export {
    toggleCommentLike,
    
}