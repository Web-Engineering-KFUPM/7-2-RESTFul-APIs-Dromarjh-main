/*
===================================================================
Back-end Lab — RESTFul API
===================================================================

===================================================================
LAB SETUP INSTRUCTIONS
===================================================================

1. Navigate to the project directory:
   Open your terminal and run:
      cd 7-2-restful-api

2. Install project dependencies:
   Run either of these commands:
      npm i
      OR
      npm install

3. Start the front server server from this path: 7-2-RESTFul-APIs-Dromarjh-main\7-2-restful-api\client:
   Run:
      npm run dev

4. Start the back-end server from a separate terminal, path: 7-2-RESTFul-APIs-Dromarjh-main\7-2-restful-api\server:
    Run command to install express, cors, mongoose dotenv:
      npm install express cors mongoose dotenv

    Run command to start backend server:
      node server.js

  ⚠️ Note: Start the back-end server after establishing the connection with mongoDB.

  If your system blocks running npm commands (especially on Windows PowerShell),
   run this command first to allow script execution:
      Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
*/

/** =================================================================
 *  TODO 1 — Connect to MongoDB (file: server/.env)
 *  =================================================================
 *  Steps:
 *    - Open the server/.env file
 *    - Write your db_username & db_password in the connection string.
 *    - If connection successful → console.log("Mongo connected").
 *    - If error → console.error("Connection error:", err.message)
 *
 *  Hint:
 *    await mongoose.connect(process.env.MONGO_URL);
 */

/** =================================================================
 *  TASK 2 — Create Schema & Model (file: server/models/song.mode.js)
 *  =================================================================
 *  Goal:
 *    - Define a Song schema with fields:
 *        title (String, required)
 *        artist (String, required)
 *        year (Number)
 *    - Export a Mongoose model named "Song".
 *
 *  Hint:
      const songSchema = new mongoose.Schema({
        title:  { type: String, required: true, trim: true },
        artist: { type: String, required: true, trim: true },
        year:   { type: Number, min: 1900, max: 2100 }
      }, { timestamps: true });

      const Song = mongoose.model("Song", songSchema);
 */

/** =================================================================
 *  TODO 3 — POST /api/songs (Insert) file: server/index.js
 *  =================================================================
 *  Goal:
 *    - Insert a new song into DB.
 *    - Expect JSON body: { title, artist, year }.
 *    - Respond 201 + created song on success.
 *    - Respond 400 + {message} on validation error.
 *
 *  Hint:
        app.post("/api/songs", async (req, res) => {
          try {
            const { title = "", artist = "", year } = req.body || {};
            const created = await Song.create({
              title: title.trim(),
              artist: artist.trim(),
              year
            });
            res.status(201).json(created);
          } catch (err) {
            res.status(400).json({ message: err.message || "Create failed" });
          }
        });
 */

/*  =================================================================
 *  TODO 4— GET /api/songs (Read all) file: server/index.js
 *  =================================================================
 *  Goal:
 *    - Use Song.find() to get all songs from DB.
 *    - Sort by newest first (createdAt descending).
 *    - Return JSON array of songs.
 *
 *  Hint:
      app.get("/api/songs", async (_req, res) => {
            const rows = await Song.find().sort({ createdAt: -1 });
            res.json(rows);
      });

      app.get("/api/songs/:id", async (req, res) => {
          const s = await Song.findById(req.params.id);
          if (!s) return res.status(404).json({ message: "Song not found" });
          res.json(s);
        });
 */

/** =================================================================
 *  TODO 5 — PUT /api/songs/:id (Update) file: server/index.js
 *  =================================================================
 *  Goal:
 *    - Update an existing song by its ID.
 *    - Use Song.findByIdAndUpdate() with {new:true, runValidators:true}.
 *    - If not found → 404 {message:"Song not found"}.
 *
 *  Hint:
      app.put("/api/songs/:id", async (req, res) => {
        try {
          const updated = await Song.findByIdAndUpdate(
            req.params.id,
            req.body || {},
            { new: true, runValidators: true, context: "query" }
          );
          if (!updated) return res.status(404).json({ message: "Song not found" });
          res.json(updated);
        } catch (err) {
          res.status(400).json({ message: err.message || "Update failed" });
        }
      });
 */

/** =================================================================
 *  TODO 6 — DELETE /api/songs/:id file: server/index.js
 *  =================================================================
 *  Goal:
 *    - Delete a song from DB by its ID.
 *    - If not found → 404 {message:"Song not found"}.
 *    - On success → 204 No Content.
 *
 *  Hint:
      app.delete("/api/songs/:id", async (req, res) => {
        const deleted = await Song.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Song not found" });
        res.status(204).end();
      });
 */

import { useEffect, useMemo, useState } from "react";
import SongForm from "./components/SongForm.jsx";
import SongTable from "./components/SongTable.jsx";
import EditDialog from "./components/EditDialog.jsx";
import {
  apiGetSongs, apiGetSong,
  apiCreateSong, apiUpdateSong, apiDeleteSong
} from "./lib/api.js";
import React from "react";

export default function App() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingSong, setEditingSong] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ msg: "", type: "" });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 2600);
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiGetSongs();
      setSongs(data);
    } catch (e) {
      showToast(`Load error: ${e.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onCreate = async (payload) => {
    setCreating(true);
    try {
      const created = await apiCreateSong(payload);
      setSongs((s) => [created, ...s]);
      showToast("Song added.");
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setCreating(false);
    }
  };

  const onEdit = async (id) => {
    setEditingId(id);
    try {
      const s = await apiGetSong(id);
      setEditingSong(s);
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const onSave = async (id, payload) => {
    setSaving(true);
    try {
      const upd = await apiUpdateSong(id, payload);
      setSongs((arr) => arr.map(s => s.id === id ? upd : s));
      setEditingId(null);
      setEditingSong(null);
      showToast("Saved.");
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id) => {
    if (!confirm("Delete this song?")) return;
    try {
      await apiDeleteSong(id);
      setSongs((arr) => arr.filter(s => s.id !== id));
      showToast("Deleted.");
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const editingOpen = useMemo(() => Boolean(editingId && editingSong), [editingId, editingSong]);

  return (
    <div className="container">
      <div className="header">
        <div className="brand">
          <div className="logo" />
          <div>
            <div className="title">Songs Admin</div>
            <div style={{ color: "var(--muted)", fontSize: 13 }}>
              RESTful Web APIs with Fetch — React + Vite
            </div>
          </div>
        </div>
        <div className="badge">API: {import.meta.env.VITE_API_URL || "http://localhost:5174"}</div>
      </div>

      <div className="grid">
        <div className="card">
          <SongForm onCreate={onCreate} loading={creating} />
        </div>

        <div className="card">
          {loading ? (
            <div className="table-wrap" style={{ padding: 24, color: "#9fb1e8" }}>
              Loading songs…
            </div>
          ) : (
            <SongTable songs={songs} onEdit={onEdit} onDelete={onDelete} />
          )}
        </div>
      </div>

      <EditDialog
        open={editingOpen}
        song={editingSong}
        onClose={() => { setEditingId(null); setEditingSong(null); }}
        onSave={onSave}
        saving={saving}
      />

      <div className={`toast ${toast.msg ? "show" : ""} ${toast.type}`}>
        {toast.msg}
      </div>
    </div>
  );
}
