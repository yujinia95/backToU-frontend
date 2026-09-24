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
  async init() {
    this.#greetUser();

    try {
      const rawItems = await Api.getItems();
      const items = rawItems
        .map((data) => new Item(data))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      this.#renderSection(
        items.filter((item) => item.type === 'lost').slice(0, 4),
        this.lostGrid,
        {
          title: 'No lost reports yet',
          body: 'When someone reports something lost, it will show up here.',
        },
      );
      this.#renderSection(
        items.filter((item) => item.type === 'found').slice(0, 4),
        this.foundGrid,
        {
          title: 'No found items yet',
          body: 'When someone turns something in, it will show up here.',
        },
      );
    } catch (error) {
      console.error(error);
      const errorCopy = {
        title: 'Something went wrong',
        body: 'Failed to load items. Please try again later.',
      };
      CardRenderer.renderEmptyState(this.lostGrid, errorCopy);
      CardRenderer.renderEmptyState(this.foundGrid, errorCopy);
    }
  }

  /**
   * Updates the greeting based on the current user.
   * Shows a general message if no user is logged in.
   */
  #greetUser() {
    const user = Auth.getCurrentUser();
    if (this.greetingEl) {
      this.greetingEl.textContent = user?.firstName ? `Welcome back, ${user.firstName}` : 'Recent activity';
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
  #renderSection(items, grid, emptyCopy) {
    grid.innerHTML = '';
    if (items.length === 0) {
      CardRenderer.renderEmptyState(grid, emptyCopy);
      return;
    }
    items.forEach((item) => grid.appendChild(CardRenderer.renderItemCard(item)));
  }
}

/**
 * Start the dashboard after the HTML page has finished loading.
 */
document.addEventListener('DOMContentLoaded', () => new DashboardPage().init());
