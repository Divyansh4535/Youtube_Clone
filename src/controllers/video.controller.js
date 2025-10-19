import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { formateTime } from "../utils/helper.js";

/* ============================================================
   📹 GET ALL VIDEOS
   Description: Fetch all videos with pagination, search, and sorting.
   Query Params: page, limit, query, sortBy, sortType, userId
   ============================================================ */
const getAllVideos = asyncHandler(async (req, res) => {
    let {
        page = 1,
        limit = 10,
        query = "",
        sortBy = "createdAt",
        sortType = "desc",
        userId,
    } = req.query;

    page = Number(page);
    limit = Number(limit);

    const filter = {};

    // 🔍 Apply title search (case-insensitive)
    if (query) {
        filter.title = { $regex: query, $options: "i" };
    }

    // 👤 Filter videos by specific user if provided
    if (userId && isValidObjectId(userId)) {
        filter.owner = userId;
    }

    const sortOrder = sortType === "asc" ? 1 : -1;
    const skip = (page - 1) * limit;

    // 🧾 Fetch paginated & sorted videos
    const videos = await Video.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .populate("owner", "fullName userName email");

    if (!videos.length) {
        throw new ApiError(404, "No videos found matching your criteria.");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Videos fetched successfully."));
});

/* ============================================================
   🎥 PUBLISH A VIDEO
   Description: Upload video + thumbnail to Cloudinary and save metadata in DB.
   ============================================================ */
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    // 🔐 Validate user
    if (!req.user?._id) throw new ApiError(401, "Unauthorized! Please log in first.");

    const user = await User.findById(req.user._id);
    if (!user) throw new ApiError(404, "User account not found.");

    // 📝 Validate required fields
    if (!title || !description) {
        throw new ApiError(400, "Both title and description are required.");
    }

    // 🎞️ Extract uploaded files
    const localVideoFile = req?.files?.videoFile?.[0]?.path;
    const localThumbnailFile = req?.files?.thumbnailFile?.[0]?.path;

    if (!localVideoFile) {
        throw new ApiError(400, "Please upload a valid video file.");
    }

    // ☁️ Upload files to Cloudinary
    const [uploadedVideo, uploadedThumbnail] = await Promise.all([
        uploadOnCloudinary(localVideoFile, "video"),
        localThumbnailFile ? uploadOnCloudinary(localThumbnailFile, "image") : null,
    ]);

    if (!uploadedVideo?.secure_url) {
        throw new ApiError(500, "Failed to upload video to cloud storage.");
    }

    // ⏱️ Convert Cloudinary duration (seconds) to readable time (e.g., 12:45)
    const duration = formateTime(uploadedVideo.duration);

    // 💾 Create video entry in database
    const video = await Video.create({
        owner: user._id,
        title,
        description,
        duration,
        videoFile: uploadedVideo.secure_url,
        thumbnailFile: uploadedThumbnail?.secure_url || "",
    });

    return res
        .status(201)
        .json(new ApiResponse(201, video, "Your video has been uploaded successfully!"));
});

/* ============================================================
   🎬 GET VIDEO BY ID
   Description: Fetch details of a single video by its ID.
   ============================================================ */
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID format.");
    }

    const video = await Video.findById(videoId).populate("owner", "fullName userName email");

    if (!video) {
        throw new ApiError(404, "The requested video was not found.");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video details retrieved successfully."));
});

/* ============================================================
   🛠️ UPDATE VIDEO DETAILS
   Description: Update title, description, and optionally thumbnail.
   ============================================================ */
const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID format.");
    }

    if (!title || !description) {
        throw new ApiError(400, "Title and description cannot be empty.");
    }

    let updateFields = { title, description };

    // 🖼️ If new thumbnail provided, upload it
    if (req?.files?.thumbnailFile?.[0]?.path) {
        const newThumbnail = await uploadOnCloudinary(req.files.thumbnailFile[0].path, "image");
        updateFields.thumbnailFile = newThumbnail.secure_url;
    }

    const updatedVideo = await Video.findByIdAndUpdate(videoId, updateFields, { new: true });

    if (!updatedVideo) {
        throw new ApiError(404, "Unable to update. Video not found.");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedVideo, "Video details updated successfully!"));
});

/* ============================================================
   ❌ DELETE VIDEO
   Description: Permanently remove a video from the database.
   ============================================================ */
const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID format.");
    }

    const deletedVideo = await Video.findByIdAndDelete(videoId);

    if (!deletedVideo) {
        throw new ApiError(404, "Video not found or already deleted.");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Video deleted successfully."));
});

/* ============================================================
   🚀 TOGGLE PUBLISH STATUS
   Description: Change the public visibility of a video.
   ============================================================ */
const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { isPublish } = req.body;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID format.");
    }

    const video = await Video.findByIdAndUpdate(
        videoId,
        { isPublish },
        { new: true }
    );

    if (!video) {
        throw new ApiError(404, "Video not found.");
    }

    const message = isPublish
        ? "Video has been published successfully!"
        : "Video has been unpublished.";

    return res.status(200).json(new ApiResponse(200, video, message));
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
};
