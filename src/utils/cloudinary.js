import dotenv from "dotenv";
dotenv.config();
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});
// console.log("Cloudinary CONFIG out side ->", cloudinary.config());
// console.log("Cloudinary CONFIG in side ->", cloudinary.config());

const uploadOnCloudinary = async (localFilePath) => {
    if (!localFilePath) return null;
    const absolutePath = path.resolve(localFilePath);

    try {
        // console.log("absolutePath", absolutePath);
        const response = await cloudinary.uploader.upload(absolutePath, {
            resource_type: "auto",
        });

        console.log("Cloudinary upload success:", response);
        return response;
    } catch (error) {
        console.error("Cloudinary upload error:", error.message || error);
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        return null;
    }
};

export { uploadOnCloudinary };
