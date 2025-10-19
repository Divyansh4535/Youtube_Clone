import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});


const uploadOnCloudinary = async (localFilePath, resourceType = "auto") => {
    if (!localFilePath) return null;
    const absolutePath = path.resolve(localFilePath);

    if (!fs.existsSync(absolutePath)) {
        console.error("❌ Local file not found:", absolutePath);
        return null;
    }

    try {
        let response;
        // Use upload_large for big videos
        if (resourceType === "video") {
            response = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_large(absolutePath, {
                    resource_type: "video",
                    chunk_size: 6_000_000, // 6MB chunks
                },
                    (err, result) => {
                        if (err) reject(err)
                        else resolve(result)
                    });
            })
        } else {
            response = await cloudinary.uploader.upload(absolutePath, {
                resource_type: resourceType,
            });
        }
        console.log("✅ Cloudinary upload success:", response);

        // Delete local file after upload
        fs.unlink(absolutePath, (err) => {
            if (err) console.warn("⚠️ Failed to delete local file:", err.message);
        });

        return response;
    } catch (error) {
        console.error("❌ Cloudinary upload failed:", error.message || error);
        if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);
        return null;
    }
};

export { uploadOnCloudinary };
