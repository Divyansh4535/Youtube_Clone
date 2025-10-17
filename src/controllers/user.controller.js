import jwt from "jsonwebtoken";
import { cookieOption } from "../constant.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";

/* ===========================================================
   🧩 Helper: Generate Access & Refresh Tokens
   =========================================================== */
const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user)
      throw new ApiError(404, "User not found during token generation");

    // Generate new JWT tokens
    const refreshToken = await user.generateRefreshToken();
    const accessToken = await user.generateAccessToken();

    // Save refresh token to DB (disable validation hooks)
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { refreshToken, accessToken };
  } catch (error) {
    throw new ApiError(500, "Failed to generate authentication tokens");
  }
};

/* ===========================================================
   👤 REGISTER USER
   Steps:
   1️⃣ Validate inputs
   2️⃣ Check existing user
   3️⃣ Handle image uploads
   4️⃣ Upload to Cloudinary
   5️⃣ Create new user
   6️⃣ Respond with created user
   =========================================================== */
const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, userName, password } = req.body;

  // Step 1: Basic validation
  if ([fullName, email, userName, password].some((f) => !f?.trim())) {
    throw new ApiError(
      400,
      "All fields are required: fullName, email, userName, password",
    );
  }

  // Step 2: Check for duplicate user
  const existingUser = await User.findOne({
    $or: [{ email }, { userName }],
  });
  if (existingUser)
    throw new ApiError(
      409,
      "User with this email or username already exists",
    );

  // Step 3: Access uploaded files
  const avatarLocalPath = req?.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req?.files?.coverImage?.[0]?.path;
  if (!avatarLocalPath) throw new ApiError(400, "Avatar image is required");

  // Step 4: Upload images to Cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = coverImageLocalPath
    ? await uploadOnCloudinary(coverImageLocalPath)
    : null;

  if (!avatar?.secure_url)
    throw new ApiError(500, "Failed to upload avatar to Cloudinary");

  // Step 5: Create the user
  const user = await User.create({
    fullName,
    userName: userName.toLowerCase(),
    email,
    password,
    avatar: avatar.secure_url,
    coverImage: coverImage?.secure_url || "",
  });

  // Step 6: Return sanitized user
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );
  if (!createdUser)
    throw new ApiError(500, "User registration failed unexpectedly");

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        createdUser,
        "✅ User registered successfully",
      ),
    );
});

/* ===========================================================
   🔐 LOGIN USER
   Steps:
   1️⃣ Validate inputs
   2️⃣ Find user by email or username
   3️⃣ Check password
   4️⃣ Generate new tokens
   5️⃣ Send secure cookies
   =========================================================== */
const loginUser = asyncHandler(async (req, res) => {
  const { userName, email, password } = req.body;

  if ((!userName && !email) || !password?.trim()) {
    throw new ApiError(400, "Username/Email and Password are required");
  }

  // Step 2: Find user
  const user = await User.findOne({ $or: [{ email }, { userName }] });
  if (!user) throw new ApiError(404, "User not found. Please register first");

  // Step 3: Validate password
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) throw new ApiError(401, "Invalid credentials");

  // Step 4: Generate tokens
  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user._id);

  // Step 5: Return sanitized user + set cookies
  const safeUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  console.log("safeUser----------->", safeUser);
  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOption)
    .cookie("refreshToken", refreshToken, cookieOption)
    .json(
      new ApiResponse(
        200,
        { user: safeUser, accessToken, refreshToken },
        "✅ Login successful",
      ),
    );
});

/* ===========================================================
   🚪 LOGOUT USER
   Steps:
   1️⃣ Remove refreshToken from DB
   2️⃣ Clear cookies
   =========================================================== */
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });

  return res
    .status(200)
    .clearCookie("accessToken", cookieOption)
    .clearCookie("refreshToken", cookieOption)
    .json(new ApiResponse(200, {}, "👋 Logged out successfully"));
});

/* ===========================================================
   ♻️ REFRESH ACCESS TOKEN
   Steps:
   1️⃣ Validate refresh token
   2️⃣ Verify and decode JWT
   3️⃣ Match DB token
   4️⃣ Issue new tokens
   =========================================================== */
const refreshAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.cookies || req.body;
  if (!refreshToken) throw new ApiError(401, "Refresh token is required");

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );
    const user = await User.findById(decoded._id);

    if (!user)
      throw new ApiError(401, "Invalid refresh token: user not found");
    if (user.refreshToken !== refreshToken)
      throw new ApiError(401, "Refresh token expired or already used");

    const newTokens = await generateAccessTokenAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", newTokens.accessToken, cookieOption)
      .cookie("refreshToken", newTokens.refreshToken, cookieOption)
      .json(
        new ApiResponse(
          200,
          newTokens,
          "🔄 Token refreshed successfully",
        ),
      );
  } catch (error) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }
});

/* ===========================================================
   🔑 CHANGE PASSWORD
   Steps:
   1️⃣ Verify old password
   2️⃣ Match new & confirm password
   3️⃣ Save new password
   =========================================================== */
const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;

  const user = await User.findById(req.user?._id);
  if (!user) throw new ApiError(404, "User not found");

  const isOldPasswordValid = await user.isPasswordCorrect(oldPassword);
  if (!isOldPasswordValid) throw new ApiError(400, "Incorrect old password");

  if (newPassword !== confirmPassword)
    throw new ApiError(
      400,
      "New password and confirm password do not match",
    );

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "🔐 Password updated successfully"));
});

/* ===========================================================
   👤 GET CURRENT USER
   =========================================================== */
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        req.user,
        "👤 Current user fetched successfully",
      ),
    );
});

/* ===========================================================
   ✏️ UPDATE ACCOUNT DETAILS
   =========================================================== */
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName || !email)
    throw new ApiError(400, "Full name and email are required");

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { fullName, email } },
    { new: true },
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "✅ Account details updated"));
});

/* ===========================================================
   🖼️ UPDATE AVATAR
   =========================================================== */
const updateAccountAvatar = asyncHandler(async (req, res) => {
  const localPath = req.file?.path;
  if (!localPath) throw new ApiError(400, "Avatar image is missing");

  const avatar = await uploadOnCloudinary(localPath);
  if (!avatar?.secure_url)
    throw new ApiError(500, "Error uploading avatar image");

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { avatar: avatar.secure_url } },
    { new: true },
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "🖼️ Avatar updated successfully"));
});

/* ===========================================================
   🏞️ UPDATE COVER IMAGE
   =========================================================== */
const updateAccountCoverImage = asyncHandler(async (req, res) => {
  const localPath = req.file?.path;
  if (!localPath) throw new ApiError(400, "Cover image file is missing");

  const coverImage = await uploadOnCloudinary(localPath);
  if (!coverImage?.secure_url)
    throw new ApiError(500, "Error uploading cover image");

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { coverImage: coverImage.secure_url } },
    { new: true },
  ).select("-password");

  return res
    .status(200)
    .json(
      new ApiResponse(200, user, "🏞️ Cover image updated successfully"),
    );
});

/* ===========================================================
   📺 GET USER PROFILE (CHANNEL PAGE)
   Steps:
   1️⃣ Match username
   2️⃣ Lookup subscribers/subscribed
   3️⃣ Add subscriber counts & status
   4️⃣ Return channel data
   =========================================================== */
const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { userName } = req.params;
  if (!userName?.trim())
    throw new ApiError(400, "Username parameter is required");

  const channel = await User.aggregate([
    { $match: { userName: userName.toLowerCase() } },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscriberCount: { $size: "$subscribers" },
        subscribedCount: { $size: "$subscribedTo" },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        userName: 1,
        email: 1,
        subscriberCount: 1,
        subscribedCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
      },
    },
  ]);

  if (!channel.length) throw new ApiError(404, "Channel does not exist");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        channel[0],
        "📺 Channel profile fetched successfully",
      ),
    );
});

/* ===========================================================
    🎞️ Get Watch History (Optimized)
   =========================================================== */
const getWatchHistory = asyncHandler(async (req, res) => {
  // 1️⃣ Validate logged-in user ID
  if (!req.user?._id) {
    throw new ApiError(401, "Unauthorized access — user ID missing");
  }

  // 2️⃣ Convert user ID safely to ObjectId
  const userId = new mongoose.Types.ObjectId(req.user._id);

  // 3️⃣ Aggregate pipeline for fetching user’s watch history
  const result = await User.aggregate([
    {
      $match: { _id: userId },
    },
    {
      $lookup: {
        from: "videos", // Join with videos collection
        localField: "watchHistory", // Field from user document
        foreignField: "_id", // Match with video _id
        as: "watchHistory", // Output field
        pipeline: [
          // 👇 Nested lookup to fetch video owner's info
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    userName: 1,
                    avatar: 1,
                    email: 1,
                  },
                },
              ],
            },
          },
          // 👇 Replace array of owner with a single object
          {
            $addFields: {
              owner: { $first: "$owner" },
            },
          },
          // 👇 Select only the fields you actually need from videos
          {
            $project: {
              title: 1,
              thumbnail: 1,
              views: 1,
              duration: 1,
              createdAt: 1,
              owner: 1,
            },
          },
          // 👇 Optional: sort by most recently watched (if needed)
          { $sort: { createdAt: -1 } },
        ],
      },
    },
    // 👇 Project only the watchHistory field to keep output clean
    {
      $project: {
        watchHistory: 1,
        _id: 0,
      },
    },
  ]);

  // 4️⃣ Handle case: no user or no watch history found
  if (!result?.length) {
    throw new ApiError(404, "No watch history found for this user");
  }

  const watchHistory = result[0]?.watchHistory || [];

  // 5️⃣ Respond to client
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        watchHistory,
        "🎞️ Watch history fetched successfully!",
      ),
    );
});

/* ===========================================================
   📤 EXPORT CONTROLLERS
   =========================================================== */
export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateAccountCoverImage,
  updateAccountAvatar,
  getUserChannelProfile,
  getWatchHistory,
};
