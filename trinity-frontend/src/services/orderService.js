import { apiFetch } from "@/lib/api";

function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

export const orderService = {
  getMyOrders(token) {
    return apiFetch("/orders/my-orders", {
      cache: "no-store",
      headers: authHeaders(token),
    });
  },

  getAdminOrders(token) {
    return apiFetch("/orders/admin", {
      cache: "no-store",
      headers: authHeaders(token),
    });
  },

  getDashboard(token) {
    return apiFetch("/orders/dashboard", {
      cache: "no-store",
      headers: authHeaders(token),
    });
  },
};
