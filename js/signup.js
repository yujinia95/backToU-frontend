/**
 * Controls the signup form.
 */
class SignupPage {
  constructor() {
    this.form = Utils.qs('#signup-form');
    this.alert = Utils.qs('[data-form-alert]');
    this.submitButton = Utils.qs('[type="submit"]', this.form);
    this.buttonLabel = Utils.qs('[data-btn-label]', this.form);
    this.isSubmitting = false;
  }

  /**
   * Connects the form and input events to this page object.
   */
  init() {
    if (!this.form) return;

    this.form.addEventListener('submit', (event) => this.handleSubmit(event));

    Utils.qsa('input', this.form).forEach((input) => {
      input.addEventListener('input', () => this.#showFieldError(input.name, false));
    });
  }

  /**
   * Validates the form and sends valid signup data to the API.
   */
  async handleSubmit(event) {
    event.preventDefault();
    if (this.isSubmitting) return;

    Utils.hideAlert(this.alert);
    const values = this.#getValues();

    if (!this.#validate(values)) return;

    this.#setSubmitting(true);

    try {
      await Api.signup({
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        password: values.password,
      });
      window.location.href = 'login.html?signup=success';
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'Unable to create your account. Please try again.';
      Utils.showAlert(this.alert, message);
    } finally {
      this.#setSubmitting(false);
    }
  }

  /**
   * Reads the current form values. Password whitespace is preserved.
   */
  #getValues() {
    const data = new FormData(this.form);

    return {
      first_name: data.get('first_name').trim(),
      last_name: data.get('last_name').trim(),
      email: data.get('email').trim(),
      password: data.get('password'),
      confirm: data.get('confirm'),
    };
  }

  /**
   * Uses the existing Utils validators and marks invalid fields.
   */
  #validate(values) {
    const results = {
      first_name: Utils.isNonEmpty(values.first_name) && values.first_name.length <= 50,
      last_name: Utils.isNonEmpty(values.last_name) && values.last_name.length <= 50,
      email: Utils.isValidEmail(values.email) && values.email.length <= 50,
      password: Utils.isValidPassword(values.password) && values.password.length <= 128,
      confirm: Utils.isNonEmpty(values.confirm) && values.confirm === values.password,
    };

    Object.entries(results).forEach(([name, isValid]) => {
      this.#showFieldError(name, !isValid);
    });

    const firstInvalidField = Object.keys(results).find((name) => !results[name]);
    if (firstInvalidField) {
      this.form.elements.namedItem(firstInvalidField)?.focus();
    }

    return firstInvalidField === undefined;
  }

  /**
   * Shows or hides the error message belonging to one input.
   */
  #showFieldError(name, shouldShow) {
    const field = Utils.qs(`[data-field="${name}"]`, this.form);
    const input = this.form.elements.namedItem(name);

    field?.classList.toggle('has-error', shouldShow);
    input?.setAttribute('aria-invalid', String(shouldShow));
  }

  /**
   * Prevents duplicate submissions while the API request is running.
   */
  #setSubmitting(isSubmitting) {
    this.isSubmitting = isSubmitting;
    this.submitButton.disabled = isSubmitting;
    this.buttonLabel.textContent = isSubmitting ? 'Creating account…' : 'Create account';
  }
}

document.addEventListener('DOMContentLoaded', () => new SignupPage().init());
