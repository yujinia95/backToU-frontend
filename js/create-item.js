/**
 * Controls the create-item form.
 *
 * Reads and validates the form values, sends a valid item to the API,
 * and shows the user whether the request succeeded or failed.
 */
class CreateItemPage {
  constructor() {
    this.form = Utils.qs("#create-form"); // Form for posting a lost or found item
    this.errorAlert = Utils.qs("[data-form-alert]");
    this.successAlert = Utils.qs("[data-form-success]");

    this.submitButton = Utils.qs('[type="submit"]', this.form);
    this.buttonLabel = Utils.qs("[data-btn-label]", this.form);

    this.photoInput = Utils.qs("#photo", this.form);
    this.photoFilename = Utils.qs("#photo-filename", this.form);

    this.currentUser = null; // Stores the logged-in user after init()
    this.isSubmitting = false; // Prevents the form from being submitted twice
  }

  /**
   * Checks that a user is logged in and connects the form events.
   */
  init() {
    if (!this.form) return;

    // Redirect to login because creating an item requires a logged-in user's ID.
    this.currentUser = Auth.getCurrentUser();
    if (!this.currentUser) {
      window.location.href = "login.html";
      return;
    }

    this.form.addEventListener("submit", (event) => this.handleSubmit(event));

    Utils.qsa("input, select, textarea", this.form).forEach((field) => {
      field.addEventListener("input", () => {
        this.#showFieldError(field.name, false);
        Utils.hideAlert(this.errorAlert);
      });
    });

    this.photoInput?.addEventListener("change", () => this.#showPhotoFilename());
  }

  /**
   * Validates the form and sends the item to the backend.
   */
  async handleSubmit(event) {
    event.preventDefault();
    if (this.isSubmitting) return;

    Utils.hideAlert(this.errorAlert);
    Utils.hideAlert(this.successAlert);

    const values = this.#getValues();
    if (!this.#validate(values)) {
      Utils.showAlert(this.errorAlert, "Please check the highlighted fields.");
      return;
    }

    this.#setSubmitting(true);

    try {
      const createdItem = await Api.createItem(values);

      Utils.showAlert(
        this.successAlert,
        "Your item was posted successfully. Redirecting…",
        "success",
      );

      const destination = createdItem?.id
        ? `item-details.html?id=${encodeURIComponent(createdItem.id)}`
        : "main.html";

      window.setTimeout(() => {
        window.location.href = destination;
      }, 1000);
    } catch (error) {
      const message =
        error instanceof TypeError
          ? "Unable to connect to the server. Please try again later."
          : error.message;

      Utils.showAlert(this.errorAlert, message);
      this.#setSubmitting(false);
    }
  }

  /**
   * Reads the form values and converts them to the backend request format.
   */
  #getValues() {
    const formData = new FormData(this.form);
    const getText = (name) => String(formData.get(name) ?? "").trim();
    const colors = getText("colors")
      .split(",")
      .map((color) => color.trim())
      .filter(Boolean);

    return {
      user_id: this.currentUser.id,
      type: getText("type"),
      date: getText("date"),
      title: getText("title"),
      description: getText("description") || null,
      category: getText("category"),
      colors,
      brand: getText("brand") || null,
      location: getText("location"),
    };
  }

  /**
   * Checks the required fields and the limits expected by the backend.
   */
  #validate(values) {
    const results = {
      title: Utils.isNonEmpty(values.title) && values.title.length <= 100,
      category:
        Utils.isNonEmpty(values.category) && values.category.length <= 50,
      date: Utils.isNonEmpty(values.date),
      brand: values.brand === null || values.brand.length <= 100,
      colors:
        values.colors.length > 0 &&
        values.colors.every((color) => color.length <= 20),
      location: Utils.isNonEmpty(values.location),
      description:
        values.description !== null && values.description.length <= 2000,
    };

    Object.entries(results).forEach(([name, isValid]) => {
      this.#showFieldError(name, !isValid);
    });

    const firstInvalidField = Object.keys(results).find((name) => !results[name]);
    if (firstInvalidField) {
      this.form.elements.namedItem(firstInvalidField)?.focus();
    }

    const hasValidUserId =
      Number.isInteger(values.user_id) && values.user_id > 0;
    const hasValidType = ["lost", "found"].includes(values.type);

    return firstInvalidField === undefined && hasValidUserId && hasValidType;
  }

  /**
   * Shows or hides the error state for one form field.
   */
  #showFieldError(name, shouldShow) {
    const field = Utils.qs(`[data-field="${name}"]`, this.form);
    const input = this.form.elements.namedItem(name);

    field?.classList.toggle("has-error", shouldShow);
    input?.setAttribute("aria-invalid", String(shouldShow));
  }

  /**
   * Shows the selected photo name. The photo is not sent because the current
   * backend endpoint only accepts JSON data.
   */
  #showPhotoFilename() {
    const file = this.photoInput?.files?.[0];
    if (this.photoFilename) {
      this.photoFilename.textContent = file
        ? `${file.name} (photo upload is not available yet)`
        : "";
    }
  }

  /**
   * Disables the button while the request is running to prevent duplicates.
   */
  #setSubmitting(isSubmitting) {
    this.isSubmitting = isSubmitting;
    this.submitButton.disabled = isSubmitting;
    this.buttonLabel.textContent = isSubmitting ? "Posting…" : "Post item";
  }
}

document.addEventListener("DOMContentLoaded", () => new CreateItemPage().init());
