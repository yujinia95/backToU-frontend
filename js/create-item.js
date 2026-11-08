/**
 * Controls the item form, which posts a new item or edits an existing one.
 *
 * An "id" in the page URL puts the form in editing mode: it loads that item,
 * fills the fields in, and saves with PATCH instead of POST. Everything else
 * — validation, error display, the field markup — is shared by both modes.
 */
class CreateItemPage {
  constructor() {
    this.form = Utils.qs("#create-form"); // Form for posting a lost or found item
    this.errorAlert = Utils.qs("[data-form-alert]");
    this.successAlert = Utils.qs("[data-form-success]");

    this.submitButton = Utils.qs('[type="submit"]', this.form);
    this.buttonLabel = Utils.qs("[data-btn-label]", this.form);

    this.itemId = Utils.getParam("id"); // Present only when editing an item
    this.currentUser = null; // Stores the logged-in user after init()
    this.isSubmitting = false; // Prevents the form from being submitted twice

    this.photoField = Utils.qs('[data-field="photo"]', this.form);
    this.photoInput = Utils.qs("[data-photo-input]", this.form);
    this.photoPreview = Utils.qs("[data-photo-preview]", this.form);
    this.photoError = Utils.qs("[data-photo-error]", this.form);
    this.selectedPhoto = null; // File chosen for upload, or null when posting without one
    this.previewUrl = null; // Object URL behind the preview image, revoked once replaced or cleared
  }

  /**
   * Whether the form is editing an existing item rather than posting a new one.
   */
  get isEditing() {
    return Boolean(this.itemId);
  }

  /**
   * Checks that a user is logged in and connects the form events.
   */
  async init() {
    if (!this.form) return;

    // Redirect to login because creating an item requires a logged-in user's ID.
    this.currentUser = Auth.getCurrentUser();
    if (!this.currentUser) {
      window.location.href = "login.html";
      return;
    }

    if (this.isEditing && !(await this.#loadForEditing())) return;

    // Photo replacement for an existing item lives on the detail page instead.
    if (this.photoField) this.photoField.hidden = this.isEditing;
    this.photoInput?.addEventListener("change", () => this.#handlePhotoSelect());

    this.form.addEventListener("submit", (event) => this.handleSubmit(event));

    // Add an event listener to every backend-submitted field.
    // After a failed submission, when the user edits a field,
    // remove that field's error style and hide the form-level error message.
    // The photo input is excluded: it has no `name` (it isn't part of the
    // values sent to Api.createItem/patchItem) and manages its own error
    // state in #handlePhotoSelect, so #showFieldError does not apply to it.
    Utils.qsa("input, select, textarea", this.form).forEach((field) => {
      if (field === this.photoInput) return;
      field.addEventListener("input", () => {
        this.#showFieldError(field.name, false);
        Utils.hideAlert(this.errorAlert);
      });
    });
  }

  /**
   * Validates the form and sends the item to the backend.
   */
  async handleSubmit(event) {
    event.preventDefault(); // Prevent the browser from reloading the page when the form is submitted.
    if (this.isSubmitting) return; // Prevent duplicate API requests

    Utils.hideAlert(this.errorAlert);
    Utils.hideAlert(this.successAlert);

    const values = this.#getValues();
    if (!this.#validate(values)) {
      Utils.showAlert(this.errorAlert, "Please check the highlighted fields.");
      return;
    }

    this.#setSubmitting(true);

    // Send the item data to the API and handle a successful response.
    try {
      const savedItem = this.isEditing
        ? await Api.patchItem(this.itemId, values)
        : await Api.createItem(values);

      if (!this.isEditing && this.selectedPhoto && savedItem?.id) {
        try {
          await Api.uploadItemPhoto(savedItem.id, this.selectedPhoto);
        } catch {
          // The item already exists; resubmitting this form would duplicate it,
          // so send the user to the item instead of letting them retry here.
          window.location.replace(
            `item-details.html?id=${encodeURIComponent(savedItem.id)}&photo_error=1`,
          );
          return;
        }
      }

      Utils.showAlert(
        this.successAlert,
        this.isEditing
          ? "Your changes were saved. Redirecting…"
          : "Your item was posted successfully. Redirecting…",
        "success",
      );

      const destination = savedItem?.id
        ? `item-details.html?id=${encodeURIComponent(savedItem.id)}`
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
   * Validates the picked photo and shows its preview, or shows the
   * validation error and clears any previous selection.
   */
  #handlePhotoSelect() {
    const file = this.photoInput.files[0];
    if (!file) return;

    const error = Photo.validatePhotoFile(file);
    if (error) {
      this.photoInput.value = "";
      this.selectedPhoto = null;
      this.photoField.classList.add("has-error");
      this.photoError.textContent = error;
      this.#clearPreview();
      return;
    }

    this.photoField.classList.remove("has-error");
    this.selectedPhoto = file;
    this.#revokePreview();
    this.previewUrl = URL.createObjectURL(file);
    this.photoPreview.src = this.previewUrl;
    this.photoPreview.hidden = false;
  }

  /**
   * Hides the preview image and revokes its object URL.
   */
  #clearPreview() {
    this.#revokePreview();
    this.photoPreview.hidden = true;
    this.photoPreview.src = "";
  }

  /**
   * Revokes the current preview's object URL, if any, so it does not leak
   * once the preview is replaced or the page is left.
   */
  #revokePreview() {
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
      this.previewUrl = null;
    }
  }

  /**
   * Loads the item being edited and fills the form with it. Returns false when
   * the form must not be used: someone else's post, or one that is already
   * closed, both of which send the visitor back to the details page.
   */
  async #loadForEditing() {
    let item;
    try {
      item = new Item(await Api.getItem(this.itemId));
    } catch (error) {
      Utils.showAlert(this.errorAlert, error?.message || "Unable to load this item.");
      this.submitButton.disabled = true;
      return false;
    }

    // A returned post is a closed record, so its details stay as they were.
    if (Number(item.user_id) !== Number(this.currentUser.id) || item.isReturned) {
      window.location.replace(item.detailsUrl);
      return false;
    }

    this.#fillForm(item);

    document.title = `BackToU: Edit ${item.title}`;
    Utils.qs("[data-form-heading]").textContent = "Edit your post";
    Utils.qs("[data-form-sub]").textContent =
      "Update what you reported. The more specific the description and location, the easier it is to match.";
    Utils.qs("[data-form-cancel]").href = item.detailsUrl;
    this.#setSubmitting(false); // Puts "Save changes" on the button
    return true;
  }

  /**
   * Writes an item's values into the form fields.
   */
  #fillForm(item) {
    const fields = this.form.elements;

    fields.type.value = item.type;
    fields.title.value = item.title;
    fields.category.value = item.category;
    fields.date.value = item.date;
    fields.brand.value = item.brand ?? "";
    fields.colors.value = item.colors.join(", ");
    fields.location.value = item.location;
    fields.description.value = item.description ?? "";
  }

  /**
   * Reads the form values and converts them to the backend request format.
   */
  #getValues() {
    const formData = new FormData(this.form);
    const getText = (name) => String(formData.get(name) ?? "").trim();

    // Convert comma-separated color text into the array expected by the backend.
    const colors = getText("colors")
      .split(",")
      .map((color) => color.trim())
      .filter(Boolean);

    return {
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
        values.description === null || values.description.length <= 2000,
    };

    Object.entries(results).forEach(([name, isValid]) => {
      this.#showFieldError(name, !isValid);
    });

    const firstInvalidField = Object.keys(results).find(
      (name) => !results[name],
    );
    if (firstInvalidField) {
      this.form.elements.namedItem(firstInvalidField)?.focus();
    }

    const hasValidType = ["lost", "found"].includes(values.type);

    return firstInvalidField === undefined && hasValidType;
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
   * Disables the button while the request is running to prevent duplicates.
   */
  #setSubmitting(isSubmitting) {
    this.isSubmitting = isSubmitting;
    this.submitButton.disabled = isSubmitting;
    if (this.isEditing) {
      this.buttonLabel.textContent = isSubmitting ? "Saving…" : "Save changes";
    } else {
      this.buttonLabel.textContent = isSubmitting ? "Posting…" : "Post item";
    }
  }
}

document.addEventListener("DOMContentLoaded", () =>
  new CreateItemPage().init(),
);
