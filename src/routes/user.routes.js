import { Router } from "express";
import {
   changeCurrentPassword,
   getAllUsers,
   getCurrentUser,
   getUserChannelProfile,
   getWatchHistory,
   loginUser,
   logoutUser,
   refreshAccessToken,
   registerUser,
   updateAccountAvatar,
   updateAccountCoverImage,
   updateAccountDetails,
} from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyUser } from "../middleware/auth.middleware.js";

const router = Router();
router.post(
   "/register",
   upload.fields([
      { name: "avatar", maxCount: 1 },
      { name: "coverImage", maxCount: 2 },
   ]),
   registerUser,
);
router.get("/get-all-users", getAllUsers);
router.post("/login", loginUser);
router.get("/logout", verifyUser, logoutUser);
router.get("/refresh-token", refreshAccessToken);
router.post("/change-password", verifyUser, changeCurrentPassword)
router.get("/get-user", verifyUser, getCurrentUser);
router.patch("/update-account-details", verifyUser, updateAccountDetails)
router.patch("/update-account-cover-image", verifyUser, upload.single("coverImage"), updateAccountCoverImage)
router.patch("/update-account-avatar", verifyUser, upload.single("avatar"), updateAccountAvatar)
router.get("/channel/:userName", verifyUser,
   getUserChannelProfile)
router.get("/get-watch-history", verifyUser, getWatchHistory)

export default router;
