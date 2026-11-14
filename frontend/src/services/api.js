export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(message, status = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// o detail do FastAPI é uma string (404, por exemplo) ou uma lista de erros (422)
function detailMessage(detail) {
  if (typeof detail === "string") {
    return detail;
  }
  if (Array.isArray(detail)) {
    return detail.map((error) => error.msg).join(". ");
  }
  return null;
}

export async function request(path, { method = "GET", body } = {}) {
  const options = { method };
  if (body !== undefined) {
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, options);
  } catch {
    // o fetch só rejeita quando não chega na API (fora do ar, CORS, rede)
    throw new ApiError("Não foi possível conectar à API. Verifique se o servidor está no ar.");
  }

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = detailMessage(data?.detail) ?? `Erro ${response.status} ao acessar a API`;
    throw new ApiError(message, response.status);
  }

  // DELETE responde 204 sem corpo
  if (response.status === 204) {
    return null;
  }
  return response.json();
}
