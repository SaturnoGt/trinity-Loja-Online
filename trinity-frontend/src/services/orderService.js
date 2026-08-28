import { apiFetch } from "@/lib/api";

export const orderService = {
  getMyOrders() {
    return apiFetch(
      "/orders/my-orders",
      {
        cache: "no-store",
      }
    );
  },

  getAdminOrders() {
    return apiFetch(
      "/orders/admin",
      {
        cache: "no-store",
      }
    );
  },

  getDashboard() {
    return apiFetch(
      "/orders/dashboard",
      {
        cache: "no-store",
      }
    );
  },
};