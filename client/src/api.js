const API_BASE = "http://localhost:4000";

async function handle(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed with status ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export function fetchTransactions({ months = [], tags = [] } = {}) {
  const params = new URLSearchParams();
  if (months.length) params.set("months", months.join(","));
  if (tags.length) params.set("tags", tags.join(","));
  const qs = params.toString();
  return fetch(`${API_BASE}/transactions${qs ? `?${qs}` : ""}`).then(handle);
}

export function fetchTags() {
  return fetch(`${API_BASE}/transactions/tags`).then(handle);
}

export function createTransaction(data) {
  return fetch(`${API_BASE}/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(handle);
}

export function updateTransaction(id, data) {
  return fetch(`${API_BASE}/transactions/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(handle);
}

export function deleteTransaction(id) {
  return fetch(`${API_BASE}/transactions/${id}`, { method: "DELETE" }).then(handle);
}
