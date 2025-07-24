import dotenv from "dotenv";
import express from "express";
import connectDB from "./db/index.js";
dotenv.config({
    path: "./env",
});
connectDB();
const app = express();

/*
(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URL}${DB_NAME}`);
        app.on("error", (error) => {
            console.log("app is not connected to database", error);
            throw error;
        });
        app.listen(PORT, () => console.log("Server is running on port ", PORT  ));
    } catch (error) {
        console.log("Error MongoDB connection", error);
        throw error;
    }
})(); */
