import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiError } from "../utils/apiError.js";

const getAllVideos = asyncHandler(async (req, res) => {
    let {
        page = 1,
        limit = 10,
        query = "",
        sortBy,
        sortType = "desc",
        userId,
    } = req.query;
    page = Number(page);
    limit = Number(limit);
    let filter = {};
    if (query) {
        filter.title = { $regex: "query", $options: "i" }; // case-insensitive
    }
    if (filter.userId) {
        filter.userId = userId;
    }
    // Sorting
    const sortOrder = sortType === "asc" ? 1 : -1;
    // pagination
    const skip = (page - 1) * limit;

    //TODO: get all videos based on query, sort, pagination
    const video = await Video.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit);

    if (!video || video.length === 0) {
        throw new ApiError(404, "No Video  found ! ");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Fetched All Videos successfully !"));
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    const user = await User.findById(req.user?._id);
    if (!user) {
        throw new ApiError(404, "User is not found !");
    }
    if (!(title || description)) {
        throw new ApiError(400, "Title and Description are  required !");
    }

    const { videoFile, thumbnailFile } = req?.file?.path;
    console.log({ videoFile, thumbnailFile });
    if (!videoFile) {
        throw new ApiError(404, "Video File is Required");
    }
    const uploadedVideoFile = await uploadOnCloudinary(videoFile);
    const uploadedThumbnailFile = thumbnailFile
        ? await uploadOnCloudinary(thumbnailFile)
        : null;
    if (!uploadedVideoFile.secure_url) {
        throw new ApiError(500, "Failed to upload Video File on Cloudinary !");
    }
    const video = await Video.create({
        title,
        description,
        videoFile: uploadedVideoFile,
        thumbnailFile: uploadedThumbnailFile,
    });

    return res
        .status(200)
        .json(new ApiResponse(200, video, " Video Upload successfully !"));

    // TODO: get video, upload to cloudinary, create video
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: get video by id


});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: update video details like title, description, thumbnail
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: delete video
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
};
