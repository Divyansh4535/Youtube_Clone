import jwt from "jsonwebtoken";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

const verifyUser = asyncHandler(async (req, _, next) => {
    try {
        const token =
            req.cookies.accessToken ||
            req.header("Authorization")?.replace("Bearer ");
        console.log("token--> ", token);
        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }
        const decodedToken = await jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET,
        );
        console.log("decodedToken", decodedToken);
        const user = await User.findById(decodedToken?._id).select(
            "-password -refreshToken",
        );
        console.log("user auth middleware :-> ", user);
        if (!user) {
            throw new ApiError(401, "Invalid Access Token ");
        }
        req.user = user;
        await user.save();
        next();
    } catch (error) {
        throw new ApiError(500, "User not verified", error);
    }
});

export { verifyUser };
