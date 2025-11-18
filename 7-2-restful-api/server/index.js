import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "./db.js";
import { Song } from "./models/song.model.js";

const app = express();
const PORT = process.env.PORT || 5174;

app.use(cors());
app.use(express.json());

// -------------------------------------
// DB connection
// -------------------------------------
try {
  await connectDB(process.env.MONGO_URL);
  console.log("Mongo connected");
} catch (err) {
  console.error("Connection error:", err.message);
  // If we cannot connect, do not start the server
  process.exit(1);
}

// -------------------------------------
// Routes
// -------------------------------------

// GET /api/songs  (Read all songs, newest first)
app.get("/api/songs", async (_req, res) => {
  try {
    const songs = await Song.find().sort({ createdAt: -1 });
    res.json(songs);
  } catch (err) {
    console.error("GET /api/songs error:", err.message);
    res.status(500).json({ message: "Failed to fetch songs" });
  }
});

// GET /api/songs/:id  (Read single song)
app.get("/api/songs/:id", async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ message: "Song not found" });
    }
    res.json(song);
  } catch (err) {
    console.error("GET /api/songs/:id error:", err.message);
    res.status(400).json({ message: "Invalid song id" });
  }
});

// POST /api/songs  (Insert song)
app.post("/api/songs", async (req, res) => {
  try {
    const { title = "", artist = "", year } = req.body || {};

    const created = await Song.create({
      title: title.trim(),
      artist: artist.trim(),
      year,
    });

    res.status(201).json(created);
  } catch (err) {
    console.error("POST /api/songs error:", err.message);
    res
      .status(400)
      .json({ message: err.message || "Create failed" });
  }
});

// PUT /api/songs/:id  (Update song)
app.put("/api/songs/:id", async (req, res) => {
  try {
    const updated = await Song.findByIdAndUpdate(
      req.params.id,
      req.body || {},
      {
        new: true,
        runValidators: true,
        context: "query",
      }
    );

    if (!updated) {
      return res.status(404).json({ message: "Song not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error("PUT /api/songs/:id error:", err.message);
    res
      .status(400)
      .json({ message: err.message || "Update failed" });
  }
});

// DELETE /api/songs/:id  (Delete song)
app.delete("/api/songs/:id", async (req, res) => {
  try {
    const deleted = await Song.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Song not found" });
    }
    res.status(204).end();
  } catch (err) {
    console.error("DELETE /api/songs/:id error:", err.message);
    res
      .status(400)
      .json({ message: err.message || "Delete failed" });
  }
});

// -------------------------------------
// Start server
// -------------------------------------
app.listen(PORT, () =>
  console.log(`API running on http://localhost:${PORT}`)
);
