import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    //TODO: create playlist
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
})


export {
    createPlaylist,
    
}