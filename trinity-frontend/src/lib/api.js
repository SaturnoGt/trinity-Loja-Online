const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
const DEFAULT_TIMEOUT = 15000;

export class ApiError extends Error {
  constructor(message, { status = 0, data = null, url = "" } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.url = url;
  }
}

async function parseResponse(response) {
  if (response.status === 204) {
    return null;
  }

  const text = await response.text();

  if (!text) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(text);
    } catch {
      throw new ApiError("A API retornou um JSON inválido.", {
        status: response.status,
        url: response.url,
      });
    }
  }

  return text;
}

export async function apiFetch(endpoint, options = {}) {
  if (!API_URL) {
    throw new ApiError(
      "NEXT_PUBLIC_API_URL não está configurada no frontend."
    );
  }

  const {
    timeout = DEFAULT_TIMEOUT,
    headers,
    body,
    signal,
    ...fetchOptions
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener("abort", () => controller.abort(), {
        once: true,
      });
    }
  }

  const requestHeaders = new Headers(headers);
  requestHeaders.set("Accept", "application/json");

  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  if (body != null && !isFormData && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  const url = `${API_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      body,
      headers: requestHeaders,
      signal: controller.signal,
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      const message =
        data?.error ||
        data?.message ||
        `Não foi possível concluir a requisição. Status ${response.status}.`;

      throw new ApiError(message, {
        status: response.status,
        data,
        url,
      });
    }

    return data;
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new ApiError(
        "A requisição demorou demais. Verifique sua conexão e tente novamente.",
        { url }
      );
    }

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      "Não foi possível conectar ao servidor. Tente novamente em instantes.",
      { url }
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
