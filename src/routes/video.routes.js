
import { Router } from "express";
import { verifyUser } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import { deleteVideo, getAllVideos, getVideoById, publishAVideo, togglePublishStatus, updateVideo } from "../controllers/video.controller.js";

const router = Router();

/* ============================================================
   📜 PUBLIC ROUTES
   ============================================================ */

// 🎬 Get list of videos (supports pagination, search, sort)
router.get("/", getAllVideos);

// 🎥 Get details of a single video
router.get("/:videoId", getVideoById);

/* ============================================================
   🔐 AUTHENTICATED ROUTES (USER MUST BE LOGGED IN)
   ============================================================ */

// ⬆️ Upload a new video (with thumbnail)
router.post(
    "/upload-video",
    verifyUser,
    upload.fields([
        { name: "videoFile", maxCount: 1 },
        { name: "thumbnailFile", maxCount: 1 },
    ]),
    publishAVideo
);

// ✏️ Update video details (title, description, thumbnail)
router.patch(
    "/:videoId",
    verifyUser,
    upload.fields([{ name: "thumbnailFile", maxCount: 1 }]),
    updateVideo
);

// 🚫 Delete a video
router.delete("/:videoId", verifyUser, deleteVideo);

// 🔄 Toggle publish/unpublish status
router.patch("/:videoId/publish-status", verifyUser, togglePublishStatus);

export default router;
