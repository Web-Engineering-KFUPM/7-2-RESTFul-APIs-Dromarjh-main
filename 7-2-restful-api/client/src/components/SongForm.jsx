import { useState } from "react";
import React from "react";

export default function SongForm({ onCreate, loading }) {
  const [form, setForm] = useState({ title: "", artist: "", year: "" });

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.artist.trim()) return;
    await onCreate({
      title: form.title.trim(),
      artist: form.artist.trim(),
      year: form.year ? Number(form.year) : undefined
    });
    setForm({ title: "", artist: "", year: "" });
  };

  return (
    <form className="form" onSubmit={submit}>
      <h3>Add New Song</h3>

      <div className="row">
        <div>
          <label>Title</label>
          <input
            name="title"
            placeholder="e.g. Skyline"
            value={form.title}
            onChange={onChange}
            required
          />
        </div>
        <div>
          <label>Artist</label>
          <input
            name="artist"
            placeholder="e.g. Ayla"
            value={form.artist}
            onChange={onChange}
            required
          />
        </div>
      </div>

      <div className="row">
        <div>
          <label>Year</label>
          <input
            name="year"
            type="number"
            placeholder="2024"
            value={form.year}
            onChange={onChange}
            min="1900"
            max="2100"
          />
        </div>
      </div>

      <div className="actions">
        <button className="btn ghost" type="reset"
          onClick={() => setForm({ title: "", artist: "", year: "" })}
          disabled={loading}>
          Clear
        </button>
        <button className="btn primary" type="submit" disabled={loading}>
          {loading ? "Adding…" : "Add Song"}
        </button>
      </div>
    </form>
  );
}
