import mongoose, {isValidObjectId} from "mongoose"


const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

})


export {
    toggleCommentLike,
    
}