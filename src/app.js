import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.routes.js";

const app = express();

// dotenv.config({
//     path: "./.env",
// });
app.use(express.urlencoded({ extends: true }));
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(express.static("public"));
app.use(cookieParser());

app.use("/user", userRouter);

export { app };
