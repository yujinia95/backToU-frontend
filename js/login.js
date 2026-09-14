class Login {
  static init() {
    const form = Utils.qs("#login-form");
    form.addEventListener("submit", Login.handleSubmit);
  }

  static async handleSubmit(event) {
    event.preventDefault();

    const submitButton = event.target.querySelector('button[type="submit"]');
    if (submitButton.disabled) return;
    submitButton.disabled = true;

    const email = Utils.qs("#email").value;
    const password = Utils.qs("#password").value;
    const alertEl = Utils.qs("[data-form-alert]");

    Utils.hideAlert(alertEl);

    if (!Utils.isValidEmail(email)) {
      Utils.showAlert(alertEl, "Enter a valid email address.");
      submitButton.disabled = false;
      return;
    }

    if (!Utils.isValidPassword(password)) {
      Utils.showAlert(alertEl, "Password must be at least 8 characters.");
      submitButton.disabled = false;
      return;
    }

    try {
      const user = await Api.login({ email, password });
      localStorage.setItem("currentUser", JSON.stringify(user));
      window.location.href = "main.html";
    } catch (error) {
      const message =
        error instanceof TypeError
          ? "Unable to connect to the server. Please try again later."
          : error.message;
      Utils.showAlert(alertEl, message);
      submitButton.disabled = false;
    }
  }
}

Login.init();
