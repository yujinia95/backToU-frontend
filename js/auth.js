class Auth {
  /**
   * Gets the currently logged-in user from local storage.
   * Returns null when no user is logged in.
   */
  static getCurrentUser() {
    const storedUser = localStorage.getItem("currentUser");

    if (!storedUser) {
      return null;
    }

    return JSON.parse(storedUser);
  }

  /**
   * Gets the access token used for authenticated API requests.
   */
  static getToken() {
    return localStorage.getItem("access_token");
  }

  /**
   * Logs out the current user and returns to the login page.
   */
  static logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("currentUser");
    window.location.href = "login.html";
  }
}
