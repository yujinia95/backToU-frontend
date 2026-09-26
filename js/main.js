/**
 * Handles the dashboard page.
 * It shows a greeting for the user and loads the
 * most recent lost and found items.
 */
class DashboardPage {

  /**
   * Finds the HTML elements that this page needs to update.
   */
  constructor() {
    this.greetingEl = Utils.qs('[data-greeting]');
    this.subEl = Utils.qs('[data-greeting-sub]');
    this.lostGrid = Utils.qs('#recent-lost-grid');
    this.foundGrid = Utils.qs('#recent-found-grid');
  }

  /**
   * Starts the dashboard page.
   *
   * Shows the user's greeting and loads the
   * recent lost and found items.
   */
  init() {
    this.#greetUser();
    this.#loadSection(Api.getRecentLostItems(4), this.lostGrid, {
      title: 'No lost reports yet',
      body: 'When someone reports something lost, it will show up here.',
    });
    this.#loadSection(Api.getRecentFoundItems(4), this.foundGrid, {
      title: 'No found items yet',
      body: 'When someone turns something in, it will show up here.',
    });
  }

  /**
   * Updates the greeting based on the current user.
   * Shows a general message if no user is logged in.
   */
  #greetUser() {
    const user = Auth.getCurrentUser();
    if (this.greetingEl) {
      this.greetingEl.textContent = user?.first_name ? `Welcome back, ${user.first_name}` : 'Recent activity';
    }
    if (this.subEl) {
      this.subEl.textContent = user
        ? "Here's what's new since you last checked."
        : 'The latest lost and found reports from the community.';
    }
  }

  /**
   * Loads items into a section of the dashboard.
   * If there are no items, an empty-state message is shown.
   * Otherwise, each item is displayed as a card.
   */
  #loadSection(promise, grid, emptyCopy) {
    promise.then((items) => {
      grid.innerHTML = '';
      if (items.length === 0) {
        CardRenderer.renderEmptyState(grid, emptyCopy);
        return;
      }
      items.forEach((item) => grid.appendChild(CardRenderer.renderItemCard(item)));
    });
  }
}

/**
 * Start the dashboard after the HTML page has finished loading.
 */
document.addEventListener('DOMContentLoaded', () => new DashboardPage().init());
