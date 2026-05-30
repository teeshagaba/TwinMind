import { setAuthTokenGetter } from "@workspace/api-client-react";

const TOKEN_KEY = "twinmind_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// Automatically configure the fetch client to use the token
setAuthTokenGetter(getToken);
