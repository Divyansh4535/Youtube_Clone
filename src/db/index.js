// import mongoose from "mongoose";
// import { DB_NAME } from "../constant.js";
// const connectDB = async () => {
//     console.log(
//         "${process.env.MONGODB_URL}${DB_NAME}",
//         `${process.env.MONGODB_URL}${DB_NAME}`,
//     );
//     try {
//         const connectionsInstance = await mongoose.connect(
//             `${process.env.MONGODB_URL}${DB_NAME}`,
//         );
//         // check connectionInstance
//         console.log(
//             "\n mongodb connect !! DB Host:",
//             connectionsInstance.connection.host,
//         );
//         console.log("\n mongodb -->:", connectionsInstance);
//     } catch (error) {
//         console.log("MongoDB Error Connecting Failed :-  \n ", error);
//         process.exit(1);
//     }
// };

// export default connectDB;
import mongoose from "mongoose";
import { DB_NAME, DB_URL } from "../constant.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(
            `${DB_URL}${DB_NAME}`,
        );
        console.log(
            `✅ MongoDB connected! Host: ${connectionInstance.connection.host}`,
        );
    } catch (error) {
        console.error("❌ MongoDB connection failed:- \n", error);
        process.exit(1);
    }
};

export default connectDB;
