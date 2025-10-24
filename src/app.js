// import dotenv from "dotenv";
// dotenv.config();
import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));

// dotenv.config({
//     path: "./.env",
// });

app.use(express.urlencoded({ extends: true }));
app.use(express.json());
app.use(express.static("public"));
app.use(cookieParser());

app.use("/api/v1/user", userRouter);
app.use("/api/v1/video", videoRouter)
app.use("/api/v1/playlist", playlistRouter)
// app.use("/api/v1/healthCheck", healthCheckRouter)
// app.use("/api/v1/tweets", tweetRouter)
// app.use("/api/v1/subscriptions", subscriptionRouter)
// app.use("/api/v1/comments", commentRouter)
// app.use("/api/v1/likes", likeRouter)
// app.use("/api/v1/dashboard", dashboardRouter)

export { app };
