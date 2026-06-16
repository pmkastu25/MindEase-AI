const BASE = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const headers = () => {
  const token = localStorage.getItem("mindease_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handle = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Something went wrong");
  return data;
};

export const api = {
  get:    (path)        => fetch(`${BASE}${path}`, { headers: headers() }).then(handle),
  post:   (path, body)  => fetch(`${BASE}${path}`, { method:"POST", headers: headers(), body: JSON.stringify(body) }).then(handle),
  put:    (path, body)  => fetch(`${BASE}${path}`, { method:"PUT",  headers: headers(), body: JSON.stringify(body) }).then(handle),
  delete: (path)        => fetch(`${BASE}${path}`, { method:"DELETE", headers: headers() }).then(handle),
};


