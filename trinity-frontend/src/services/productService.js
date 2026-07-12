import { apiFetch } from "@/lib/api";

export const productService = {
  getAll() {
    return apiFetch("/products");
  },

  getById(id) {
    return apiFetch(`/products/${id}`);
  },
};