import { jwt } from "jsonwebtoken";
import { cookieOption } from "../constant.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const generateAccessTokenAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const refreshToken = await user.generateRefreshToken();
        const accessToken = await user.generateAccessToken();
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        //means validate kuch bhi mat krvao direct save kr do verna password wali feild trigger ho jyege
        return { refreshToken, accessToken };
    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong while generating refreshToken and accessToken ",
        );
    }
};

const registerUser = asyncHandler(async (req, res) => {
    // try {
    const { fullName, email, userName, password } = req.body;
    if ([fullName, email, userName, password].some((field) => !field?.trim())) {
        throw new ApiError(400, "All field are required!");
    }

    const existedUser = await User.findOne({
        $or: [{ userName }, { email }],
    });
    // console.log("existedUser", existedUser);
    if (existedUser) {
        throw new ApiError(409, "User with email already existed !");
    }
    const avatarLocalPath = req?.files?.avatar[0]?.path;
    let coverImageLocalPath;
    if (
        req.file &&
        Array.isArray(req?.files?.coverImage) &&
        req.files.coverImage.length > 0
    ) {
        coverImageLocalPath = req?.files?.coverImage[0]?.path;
    }

    // console.log("req.files ===============>", req.files);
    // console.log("avatarLocalPath", avatarLocalPath);
    // console.log("coverImageLocalPath", coverImageLocalPath);
    if (!avatarLocalPath) {
        throw new ApiError(400, "avatar file is required!");
    }
    const avatarImage = await uploadOnCloudinary(avatarLocalPath);
    if (!avatarImage?.secure_url) {
        throw new ApiError(500, "Failed to upload avatar to Cloudinary");
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    // console.log("avatarImage", avatarImage);
    // console.log("coverImage", coverImage);
    const user = await User.create({
        fullName,
        userName: userName.toLowerCase(),
        email,
        password,
        avatar: avatarImage?.secure_url,
        coverImage: coverImage?.secure_url || "",
    });
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken",
    );
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registered User");
    }
    return res
        .status(201)
        .json(
            new ApiResponse(201, createdUser, "User registered successfully"),
        );
    // } catch (error) {
    //     console.log("error", error);
    //     throw new ApiError(500, `Register User Api:- ${error.message}`);
    // }
});

const loginUser = asyncHandler(async (req, res) => {
    /*
      [1] req body to data eg: username & email, password 
      [2] find user 
      [3] check password 
      [4] access and refresh token generate
      [5] send secure cookies 
      [6] send response
    */

    const { userName, email, password } = req.body;

    // if ([userName || email, password].some((i) => !i || !i.trim())) {
    //     throw new ApiError(400, "All fields are required");
    // }
    if ((!userName && !email) || !password.trim()) {
        throw new ApiError(400, "Username or Email and Password are required");
    }
    const user = await User.findOne({ $or: [{ email }, { userName }] });
    // console.log("user------------------------>", user);
    if (!user) {
        throw new ApiError(404, "User doesn't find");
    }
    const isPassword = await user.isPasswordCorrect(password);
    // console.log("isPassword", isPassword);
    if (!isPassword) {
        throw new ApiError(401, "Invalid user credentials");
    }
    const { accessToken, refreshToken } =
        await generateAccessTokenAndRefreshToken(user._id);
    // console.log("accessToken", accessToken);
    // console.log("refreshToken", refreshToken);
    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken",
    );

    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOption)
        .cookie("refreshToken", refreshToken, cookieOption)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken,
                },
                "User Logged In Successfully!",
            ),
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: { refreshToken: undefined },
            },
            { new: true },
        );
        return res
            .status(200)
            .clearCookie("accessToken", cookieOption)
            .clearCookie("refreshToken", cookieOption)
            .json(new ApiResponse(200, {}, "User Logout successfully "));
    } catch (error) {
        throw new ApiError(500, "Something went wrong ", error);
    }
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.cookies || req.body;
    if (!refreshToken) {
        throw new ApiError(401, "Request token is required");
    }

    try {
        const decodedToken = jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
        );
        console.log("decodedToken-->", decodedToken);
        const user = await User.findById(decodedToken._id);
        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }
        if (refreshToken !== user.refreshToken) {
            throw new ApiError(401, "Refresh Token is expired ans used");
        }
        const newRefreshToken = await generateAccessTokenAndRefreshToken(
            user?._id,
        );

        return res
            .status(200)
            .cookie("accessToken", newRefreshToken.accessToken, cookieOption)
            .cookie("refreshToken", newRefreshToken.refreshToken, cookieOption)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken: newRefreshToken.accessToken,
                        refreshToken: newRefreshToken.refreshToken,
                    },
                    "Refresh accessToken",
                ),
            );
    } catch (error) {
        throw new ApiError(401, error.message || "Invalid refresh token");
    }
});

export { registerUser, loginUser, logoutUser, refreshAccessToken };
