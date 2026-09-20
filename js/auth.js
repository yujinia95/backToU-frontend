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
}
