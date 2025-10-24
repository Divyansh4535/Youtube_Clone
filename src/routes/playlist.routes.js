import { Router } from "express";
import { verifyUser } from "../middleware/auth.middleware.js";
import {
   addVideoToPlaylist,
   createPlaylist,
   deletePlaylist,
   getPlaylistById,
   getUserPlaylists,
   removeVideoFromPlaylist,
   updatePlaylist,
} from "../controllers/playlist.controller.js";

const router = Router();
router.use(verifyUser);

router.route("/user/:userId").get(getUserPlaylists);
router.route("/").post(createPlaylist);

router
   .route("/:playlistId")
   .get(getPlaylistById)
   .patch(updatePlaylist)
   .delete(deletePlaylist);

router
   .route("/:playlistId/video/:videoId")
   .patch(addVideoToPlaylist)
   .delete(removeVideoFromPlaylist);

export default router;
