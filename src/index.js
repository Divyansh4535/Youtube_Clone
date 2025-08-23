import dotenv from "dotenv";
dotenv.config()
import connectDB from "./db/index.js";
import { PORT } from "./constant.js";
import { app } from "./app.js";

// dotenv.config({
//     path: "./.env",
// });

connectDB()
    .then(() => {
        app.on("error", (err) => {
            console.log("App encountered an error:", err);
            throw err;
        });

        app.listen(PORT, () =>
            console.log(`✅ Server is running at http://localhost:${PORT}`),
        );
    })
    .catch((err) => {
        console.error("❌ MongoDB connection failed:", err);
    });

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
