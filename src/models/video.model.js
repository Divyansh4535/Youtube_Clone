import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema({
  videoFile: {
    type: String,
    required: true,
  },
  thumbnailUrl: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
  },
  duration: {
    type: Number,
    default: 0,
  },
  views: {
    type: Number,
    default: 0,
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

videoSchema.plugin(mongooseAggregatePaginate)
export const Video = mongoose.model("Video", videoSchema);
