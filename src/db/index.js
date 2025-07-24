import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";
const connectDB = async () => {
    console.log(
        "${process.env.MONGODB_URL}${DB_NAME}",
        `${process.env.MONGODB_URL}${DB_NAME}`,
    );
    try {
        const connectionsInstance = await mongoose.connect(
            `${process.env.MONGODB_URL}${DB_NAME}`,
        );
        // check connectionInstance
        console.log(
            "\n mongodb connect !! DB Host:",
            connectionsInstance.connection.host,
        );
        console.log("\n mongodb -->:", connectionsInstance);
    } catch (error) {
        console.log("MongoDB Error Connecting Failed :-  \n ", error);
        process.exit(1);
    }
};

export default connectDB;
