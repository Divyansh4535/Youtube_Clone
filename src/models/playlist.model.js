import mongoose, { Schema } from "mongoose";

const playListSchema = new Schema(
   {
      title: {
         type: String,
         required: true,
         max: 100,
      },
      description: {
         type: String,
         required: true,
         min: 20,
      },
      owner: {
         type: Schema.Types.ObjectId,
         ref: "User",
      },
      videos: [
         {
            type: Schema.Types.ObjectId,
            ref: "Video",
         },
      ],
   },
   { timestamps: true },
);

export const Playlist = mongoose.model("Playlist", playListSchema);
