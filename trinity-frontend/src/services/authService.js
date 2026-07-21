import { apiFetch } from "@/lib/api";

export const authService = {
  login(credentials) {
    return apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },

  register(userData) {
    return apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  getProfile(token) {
    return apiFetch("/auth/profile", {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};
