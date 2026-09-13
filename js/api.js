class Api {
  static BASE_URL = "http://localhost:8000/api/v1";

  static async signup(data) {
    const response = await fetch(`${this.BASE_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Signup failed");
    }
    return response.json();
  }

  static async login(data) {
    const response = await fetch(`${this.BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Login failed");
    }
    return response.json();
  }

  static async getItems() {
    const response = await fetch(`${this.BASE_URL}/items`);
    return response.json();
  }

  static async getItem(id) {
    const response = await fetch(`${this.BASE_URL}/items/${id}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Item load failed");
    }
    return response.json();
  }

  static async patchItem(id, data) {
    const response = await fetch(`${this.BASE_URL}/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Item update failed");
    }
    return response.json();
  }

  static async deleteItem(id) {
    const response = await fetch(`${this.BASE_URL}/items/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Item delete failed");
    }
    // No content to return
  }
}
