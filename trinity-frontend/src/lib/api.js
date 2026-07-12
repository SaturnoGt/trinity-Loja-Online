const API = process.env.NEXT_PUBLIC_API_URL;

export async function apiFetch(endpoint, options = {}) {
  const response = await fetch(`${API}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const text = await response.text();

    console.error("API:", `${API}${endpoint}`);
    console.error("Status:", response.status);
    console.error("Resposta:", text);

    throw new Error(`Erro ${response.status}`);
  }

  return response.json();
}