import {v2 as cloudinary} from "cloudinary"
import fs from "fs"


cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnClodinary = async(localFilePath) => {
    try{
        if(!localFilePath) return 'cloud find a path for saving the file'
        
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })

        //file has been upload successfully
        // console.log("file is upload on cloudinary", response.url);

        fs.unlinkSync(localFilePath)
        return response;
        
    }
    catch (error){
        fs.unlinkSync(localFilePath) //remove the locally saved 
        // tempory file as the upload opeartion got failed
        return null;

    }
}


export {uploadOnClodinary}