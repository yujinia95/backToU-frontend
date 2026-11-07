class Api {
  // TODO: Replace with production URL when deploying.
  static BASE_URL = "http://localhost:8000/api/v1";

  /**
   * Send an HTTP request to the API and return the parsed JSON.
   * Returns null for 204 responses.
   * Adds the token for requests marked authRequired and logs out on their 401 responses.
   * Throws an Error with the server's message when the response fails.
   */
  static async request(path, options = {}) {
    const { authRequired = false, ...fetchOptions } = options;
    const headers = new Headers(fetchOptions.headers);

    if (authRequired) {
      const token = Auth.getAccessToken();

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    }

    const response = await fetch(`${this.BASE_URL}${path}`, {
      ...fetchOptions,
      headers,
    });

    if (authRequired && response.status === 401) {
      Auth.logout();
      throw new Error("Please log in to continue.");
    }

    if (!response.ok) {
      const errorData = await response.json();
      const message = Array.isArray(errorData.detail)
        ? errorData.detail.map((e) => e.msg).join(", ")
        : errorData.detail || "Request failed";
      throw new Error(message);
    }

    // 204: No content
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

  static async createItem(data) {
    return this.request("/items", {
      authRequired: true,
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
      authRequired: true,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  static async deleteItem(id) {
    return this.request(`/items/${id}`, {
      authRequired: true,
      method: "DELETE",
    });
  }
  
  static async getMatches() {
    return this.request("/users/matches", {
      authRequired: true,
    });
  }
}
