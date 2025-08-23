import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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
    try {
        const { userName, email, password } = req.body;

        if ([userName || email, password].some((i) => !i.trim())) {
            throw new ApiError(400, "All field are required");
        }
        const user = await User.findOne({ $or: [{ email }, { userName }] });
        if (!user) {
            throw new ApiError(404, "User doesn't find");
        }
    } catch (error) {
        throw new ApiError(500, "Internal server error", error);
    }
});

export { registerUser, loginUser };
