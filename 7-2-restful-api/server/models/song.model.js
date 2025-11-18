import mongoose from "mongoose";

// -----------------------------------------
// Song Schema
// -----------------------------------------
const songSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    artist: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: Number,
      min: 1900,
      max: 2100,
    },
  },
  {
    timestamps: true,
  }
);

// -----------------------------------------
// Mongoose Model
// -----------------------------------------
export const Song = mongoose.model("Song", songSchema);
