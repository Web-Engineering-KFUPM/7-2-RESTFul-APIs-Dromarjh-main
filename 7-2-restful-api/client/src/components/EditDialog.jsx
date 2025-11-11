import { useEffect, useState } from "react";
import React from "react";

export default function EditDialog({ open, song, onClose, onSave, saving }) {
  const [form, setForm] = useState({ id: "", title: "", artist: "", year: "" });

  useEffect(() => {
    if (song) setForm({
      id: song.id,
      title: song.title || "",
      artist: song.artist || "",
      year: song.year ?? ""
    });
  }, [song]);

  if (!open) return null;

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.artist.trim()) return;
    await onSave(form.id, {
      title: form.title.trim(),
      artist: form.artist.trim(),
      year: form.year ? Number(form.year) : undefined
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Song</h3>
          <button className="btn ghost" onClick={onClose}>Close</button>
        </div>

        <form className="form" onSubmit={submit}>
          <div className="row">
            <div>
              <label>Title</label>
              <input name="title" value={form.title} onChange={onChange} required />
            </div>
            <div>
              <label>Artist</label>
              <input name="artist" value={form.artist} onChange={onChange} required />
            </div>
          </div>
          <div className="row">
            <div>
              <label>Year</label>
              <input name="year" type="number" value={form.year} onChange={onChange} min="1900" max="2100" />
            </div>
          </div>
          <div className="actions">
            <button className="btn ghost" type="button" onClick={onClose}>Cancel</button>
            <button className="btn primary" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
