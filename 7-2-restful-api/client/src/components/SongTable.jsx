import React from "react";

export default function SongTable({ songs, onEdit, onDelete }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Artist</th>
            <th>Year</th>
            <th style={{ width: 170, textAlign: "right" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {songs.map((s) => (
            <tr key={s.id}>
              <td>{s.title}</td>
              <td><span className="badge">{s.artist}</span></td>
              <td>{s.year ?? "—"}</td>
              <td style={{ textAlign: "right" }}>
                <button className="btn" onClick={() => onEdit(s.id)}>Edit</button>{" "}
                <button className="btn danger" onClick={() => onDelete(s.id)}>Delete</button>
              </td>
            </tr>
          ))}
          {songs.length === 0 && (
            <tr><td colSpan="4" style={{ color: "#9fb1e8", padding: "18px" }}>
              No songs yet—add one on the left!
            </td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
