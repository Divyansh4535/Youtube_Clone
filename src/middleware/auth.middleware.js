import jwt from "jsonwebtoken";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

/**
 * 🧩 Middleware: Verify Authenticated User
 * ----------------------------------------------------------
 * ✅ Checks for access token (in cookies or Authorization header)
 * ✅ Verifies JWT and fetches the user
 * ✅ Attaches user data to req.user for downstream access
 * ✅ Handles common JWT and DB errors gracefully
 */
const verifyUser = asyncHandler(async (req, res, next) => {
  // 1️⃣ Extract token from cookies or Authorization header
  let token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "").trim();

  if (!token) {
    throw new ApiError(401, "🚫 Unauthorized: Token missing");
  }

  try {
    // 2️⃣ Verify JWT using secret
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // 3️⃣ Fetch user from DB (excluding sensitive fields)
    const user = await User.findById(decoded?._id).select(
      "-password -refreshToken"
    );
    console.log('user', user)

    if (!user) {
      throw new ApiError(401, "❌ Invalid or expired token");
    }

    // 4️⃣ Attach user object to request for downstream controllers
    req.user = user;

    // ⚠️ No need to save user here — we’re not modifying anything
    next();
  } catch (err) {
    // 5️⃣ Handle token-specific errors clearly
    if (err.name === "TokenExpiredError") {
      throw new ApiError(401, "⏰ Token expired, please log in again");
    }
    if (err.name === "JsonWebTokenError") {
      throw new ApiError(401, "⚠️ Invalid token signature");
    }

    throw new ApiError(500, "🚨 Authentication failed", err.message);
  }
});

export { verifyUser };
