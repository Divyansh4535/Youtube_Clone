import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: "./.env",
});

connectDB()
  .then(() => {
    app.on("error", (err) => {
      console.log("App encountered an error:", err);
      throw err;
    });
    app.listen(process.env.PORT || 8000, () => {
      console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
    })
  })
  .catch((err) => {
    console.log("MONGO db connection failed !!! ", err);

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
})();
*/
