
/**
 * Controls the navigation menu.
 * Handles opening/closing the menu, logout, highlighting
 * the current page, and displaying user information.
 */
class NavController {

  /**
   * Finds the navigation elements that this controller needs to manage.
   */
  constructor() {
    this.burgerBtn = Utils.qs('[data-burger-open]');
    this.closeBtn = Utils.qs('[data-burger-close]');
    this.drawer = Utils.qs('[data-nav-drawer]');
    this.scrim = Utils.qs('[data-nav-scrim]');
    this.logoutBtn = Utils.qs('[data-logout]');
  }

  /**
   * Sets up all navigation event listeners and
   * updates the navigation for the current user.
   */
  init() {
    this.burgerBtn?.addEventListener('click', () => this.open());
    this.closeBtn?.addEventListener('click', () => this.close());
    this.scrim?.addEventListener('click', () => this.close());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
    });
    this.logoutBtn?.addEventListener('click', () => Auth.logout());

    this.#markActiveLink();
    this.#fillUserFooter();
  }

  /**
   * Opens the navigation drawer.
   */
  open() {
    this.drawer?.classList.add('is-open');
    this.scrim?.classList.add('is-open');
    this.burgerBtn?.setAttribute('aria-expanded', 'true');
  }

  /**
   * Closes the navigation drawer.
   */
  close() {
    this.drawer?.classList.remove('is-open');
    this.scrim?.classList.remove('is-open');
    this.burgerBtn?.setAttribute('aria-expanded', 'false');
  }

  /**
   * Finds the current page and highlights its navigation link.
   */
  #markActiveLink() {
    const current = window.location.pathname.split('/').pop();
    Utils.qsa('.nav-links a').forEach((a) => {
      if (a.getAttribute('href') === current) a.classList.add('is-active');
    });
  }

  /**
   * Displays the current user's information in the navigation.
   *
   * If no user is logged in, show login and signup options instead.
   */
  #fillUserFooter() {
    const user = Auth.getCurrentUser();
    const footEl = Utils.qs('.nav-foot');
    
    // Display the logged-in user's information.
    if (user) {
      const nameEl = Utils.qs('[data-user-name]');
      const emailEl = Utils.qs('[data-user-email]');
      const avatarEl = Utils.qs('[data-user-avatar]');
      if (nameEl) nameEl.textContent = user.fullName;
      if (emailEl) emailEl.textContent = user.email || '';
      if (avatarEl) avatarEl.textContent = user.initial;
      return;
    }

    // If the user is not logged in, show sign-in options.
    if (footEl) {
      footEl.innerHTML = `
        <p class="nav-guest-copy">Sign in to post items and see your matches.</p>
        <div class="nav-guest-actions">
          <a href="login.html" class="btn btn-ghost btn-sm btn-block">Log in</a>
          <a href="signup.html" class="btn btn-accent btn-sm btn-block">Sign up</a>
        </div>
      `;
    }
  }
}

/**
 * Start the navigation controller after the page has finished loading.
 */
document.addEventListener('DOMContentLoaded', () => new NavController().init());
