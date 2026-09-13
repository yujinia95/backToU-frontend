class Api {
  static BASE_URL = "http://localhost:8000/api/v1";

  static async request(path, options = {}) {
    const response = await fetch(`${this.BASE_URL}${path}`, options);

    if (!response.ok) {
      const errorData = await response.json();
      const message = Array.isArray(errorData.detail)
        ? errorData.detail.map((e) => e.msg).join(", ")
        : errorData.detail || "Request failed";
      throw new Error(message);
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  static async signup(data) {
    return this.request("/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  static async login(data) {
    return this.request("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  static async getItems() {
    return this.request("/items");
  }

  static async getItem(id) {
    return this.request(`/items/${id}`);
  }

  static async patchItem(id, data) {
    return this.request(`/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  static async deleteItem(id) {
    return this.request(`/items/${id}`, {
      method: "DELETE",
    });
  }
}
