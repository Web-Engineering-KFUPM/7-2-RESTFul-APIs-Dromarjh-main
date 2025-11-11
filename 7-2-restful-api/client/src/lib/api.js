const BASE = import.meta.env.VITE_API_URL || "http://localhost:5174";


export async function apiGetSongs() {
  
  const res = await fetch(`${BASE}/api/songs`);
  if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
  return res.json();
}


export async function apiGetSong(id) {
  
  const res = await fetch(`${BASE}/api/songs/${id}`);
  if (!res.ok) throw new Error(`Failed to load song: ${res.status}`);
  return res.json();
}

export async function apiCreateSong(payload) {
 
  const res = await fetch(`${BASE}/api/songs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (res.status === 201) return res.json();
  const err = await res.json().catch(() => ({}));
  throw new Error(err.message || `Create failed: ${res.status}`);
}

export async function apiUpdateSong(id, payload) {
  
  const res = await fetch(`${BASE}/api/songs/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Update failed: ${res.status}`);
  }
  return res.json();
}

export async function apiDeleteSong(id) {
  const res = await fetch(`${BASE}/api/songs/${id}`, { method: "DELETE" });
  if (!(res.ok || res.status === 204)) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Delete failed: ${res.status}`);
  }
}

