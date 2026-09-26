/**
 * Contains small helper functions that are used throughout the application.
 * These functions handle things like validation, DOM selection,
 * formatting, alerts, and authentication checks.
 */
class Utils {

  /**
   * Removes potentially dangerous characters from text.
   * Used to make user input safer before processing or sending it.
   */
  static sanitizeText(value) {
    if (typeof value !== 'string') return '';
    return value
      .replace(/[<>]/g, '')             // Remove HTML tag characters
      .replace(/['";`\\]/g, '')         // Remove quote and backslash characters
      .replace(/--/g, '')               // Remove SQL comment marker
      .replace(/\/\*|\*\//g, '')        // Remove SQL block-comment markers
      .trim();                          // Remove extra spaces
  }

  /**
   * Converts text into safe HTML.
   * Special HTML characters are escaped so they are displayed as text
   * instead of being treated as HTML.
   */
  static escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value ?? '';
    return div.innerHTML;
  }

  /**
   * Checks whether a value looks like a valid email address.
   */
  static isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  /**
   * Checks whether a password is at least 8 characters long.
   */
  static isValidPassword(value) {
    return typeof value === 'string' && value.length >= 8;
  }

  /**
   * Checks whether a string contains some text.
   * Spaces alone are not considered valid input.
   */
  static isNonEmpty(value) {
    return typeof value === 'string' && value.trim().length > 0;
  }

  /**
   * Finds the first HTML element that matches a CSS selector.
   */
  static qs(selector, scope = document) {
    return scope.querySelector(selector);
  }

  /**
   * Finds all HTML elements that match a CSS selector.
   * Returns them as a regular array.
   */
  static qsa(selector, scope = document) {
    return Array.from(scope.querySelectorAll(selector));
  }

  /**
   * Converts an ISO date string into a readable date.
   *
   * Example:
   * "2026-09-08T10:30:00Z" → "Sep 8, 2026"
   */
  static formatDate(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  /**
   * Converts an ISO date string into a relative description,
   * based on calendar-day difference from today.
   *
   * Examples: "Today", "Yesterday", "3 days ago"
   */
  static formatRelativeTime(isoString) {
    if (!isoString) return '';
    const then = new Date(isoString);
    if (Number.isNaN(then.getTime())) return '';
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfThen = new Date(then.getFullYear(), then.getMonth(), then.getDate());
    const diffDays = Math.round((startOfToday - startOfThen) / 86400000);
    if (diffDays <= 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  }

  /**
   * Gets a value from the URL query parameters.
   *
   * Example:
   * page.html?id=123 → getParam('id') returns "123"
   */
  static getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  /**
   * Displays an alert message on the page.
   *
   * @param {HTMLElement} el - The alert element.
   * @param {string} message - The message to display.
   * @param {string} kind - The type of alert, such as "error" or "success".
   */
  static showAlert(el, message, kind = 'error') {
    if (!el) return;
    el.textContent = message;
    el.className = `alert alert-${kind} is-visible`;
  }

  /**
   * Hides an alert message.
   */
  static hideAlert(el) {
    if (!el) return;
    el.classList.remove('is-visible');
  }

  /**
   * Makes sure the user is logged in.
   * If they are not logged in, send them to the login page.
   */
  static requireAuth() {
    if (!Auth.getCurrentUser()) {
      window.location.href = 'login.html';
    }
  }
}
