import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { Playlist } from "../models/playlist.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Video } from "../models/video.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
   const { title, description } = req.body;
   //TODO: create playlist

   if (!req.user._id) throw new ApiError(404, "Authentication is required");
   const user = await User.findById(req.user?._id);
   if (!req.user._id) throw new ApiError(404, "Authentication is required");
   if (!title || !description)
      throw new ApiError(400, "Title and Description is required!");
   const PlayList = await Playlist.create({
      title,
      description,
      owner: user._id,
   });

   return res
      .status(201)
      .json(new ApiResponse(201, PlayList, "Playlist Created Successfully!"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
   const { userId } = req.params;
   //TODO: get user playlists
   const user = await User?.findById(userId);
   if (!user) {
      throw new ApiError(404, "User not found");
   }
   const playlists = await Playlist.find({ owner: user._id });

   if (!playlists.length) {
      throw new ApiError(404, "No playlists found for this user");
   }
   return res
      .status(200)
      .json(
         new ApiResponse(
            200,
            playlists,
            "User playlists fetched successfully",
         ),
      );
});

const getPlaylistById = asyncHandler(async (req, res) => {
   const { playlistId } = req.params;
   //TODO: get playlist by id
   if (!playlistId) throw new ApiError(400, "Not found");
   const playlist = await Playlist.findById(playlistId);
   if (!playlist) {
      throw new ApiError(400, "PlayList not founded!");
   }
   return res
      .status(200)
      .json(new ApiResponse(200, playlist, "PlayList fetched Successfully!"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
   const { playlistId, videoId } = req.params;
   if (!req.user._id) throw new ApiError(401, "Unauthorized user ");
   // ✅ Validate IDs
   if (!playlistId || !videoId)
      throw new ApiError(400, "Playlist ID and Video ID are required");

   const [playList, video] = await Promise.all([
      Playlist.findById(playlistId),
      Video.findById(videoId),
   ]);
   if (!playList) throw new ApiError(404, "Playlist not found!");
   if (!video) throw new ApiError(404, "Video not found!");
   if (playList.owner.toString() !== req.user._id.toString())
      throw new ApiError(
         403,
         "You are not authorized to modify this playlist! ",
      );
   if (video.owner.toString() !== req.user?._id.toString()) {
      throw new ApiError(
         403,
         "You cannot add someone else's video to your playlist!",
      );
   }

   if (playList.videos.includes(videoId))
      throw new ApiError(400, "Video is already in Playlist");

   const updatedPlaylist = await Playlist.findByIdAndUpdate(
      playlistId,
      {
         $addToSet: { videos: videoId },
      },
      { new: true },
   ).populate("videos");
   console.log("addVideo--->", updatePlaylist);
   return res
      .status(200)
      .json(
         new ApiResponse(
            200,
            updatedPlaylist,
            "Video added to playlist successfully!",
         ),
      );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
   const { playlistId, videoId } = req.params;
   // TODO: remove video from playlist
   if (!req.user._id) throw new ApiError(401, "Unauthorized user !");
   if (!playlistId) throw new ApiError(400, "PlayList Id is required !");
   if (!videoId) throw new ApiError(400, "video Id is required !");

   if (playList.owner.toString() !== req.user._id)
      throw new ApiError(
         403,
         "You are not authorized to modify this playlist! ",
      );
   const playList = await Playlist.findByIdAndUpdate(
      { _id: playlistId, owner: req.user._id },
      { $pull: { video: videoId } },
      { new: true },
   ).populate("videos");
   if (!playList) throw new ApiError(404, "Playlist not found !");
   console.log("playList", playList);
   return res
      .status(200)
      .json(200, playList, "Video remove from playlist successfully !");
});

const deletePlaylist = asyncHandler(async (req, res) => {
   const { playlistId } = req.params;
   // TODO: delete playlist
   if (!req.user._id) throw new ApiError(401, "Unauthorized user !");
   if (!playlistId) throw new ApiError(400, "PlayListId is required !");
   const playList = await Playlist.findById(playlistId);
   if (!playList) throw new ApiError(404, "Playlist is not found");

   if (playList.owner.toString() !== req.user._id)
      throw new ApiError(
         403,
         "You are not authorized to delete this playlist! ",
      );
   await Playlist.findByIdAndDelete(playlistId);
   return res
      .status(200)
      .json(new ApiResponse(200, {}, "Playlist deleted successfully !"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
   const { playlistId } = req.params;
   const { name, description } = req.body;
   //TODO: update playlist
   if (!req.user._id) throw new ApiError(401, " Unauthorized user");
   if (!playlistId) throw new ApiError(400, "Playlist Id is required");
   if (!name || !description)
      throw new ApiError(400, "Name or description is required to update! ");
   const playlist = await Playlist.findById(playlistId);
   if (!playlist) throw new ApiError(404, "Playlist is not found ! ");
   if (playlist.owner.toString() !== req.user._id.toString())
      throw new ApiError(
         403,
         "You are not authorized to update this Playlist !",
      );
   if (name) playlist.name = name;
   if (description) playlist.description = description;
   await playlist.save();

   return res.status(200).json(200, playlist, "Playlist is Updated !");
});

export {
   createPlaylist,
   getUserPlaylists,
   getPlaylistById,
   addVideoToPlaylist,
   removeVideoFromPlaylist,
   deletePlaylist,
   updatePlaylist,
};
