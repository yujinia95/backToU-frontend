/**
 * Handles the matches page.
 * It lists each report the user has posted and, under it, the items
 * other people posted that might be the same thing.
 */
class MatchesPage {
  // How many suggestions a report shows before "Show all" is needed.
  static PREVIEW_COUNT = 4;

  /**
   * Finds the HTML elements that this page needs to update.
   */
  constructor() {
    this.groupsEl = Utils.qs('#match-groups');
    this.summaryEl = Utils.qs('#matches-summary');
    this.filtersEl = Utils.qs('[data-match-filters]');
    this.chips = Utils.qsa('[data-filter]');
    this.groups = [];
    this.filter = 'all';
  }

  /**
   * Starts the matches page.
   *
   * Sends signed-out visitors to the login page, then loads
   * the user's reports and their suggested matches.
   */
  async init() {
    const user = Auth.getCurrentUser();
    if (!user) {
      Utils.requireAuth();
      return;
    }

    this.chips.forEach((chip) => {
      chip.addEventListener('click', () => this.#setFilter(chip.dataset.filter));
    });

    this.#renderLoading();

    try {
      const rawGroups = await Api.getMatches(user.id);
      // A returned report is a closed case, so it no longer needs suggestions.
      this.groups = rawGroups
        .map((data) => new MatchGroup(data))
        .filter((group) => !group.item.isReturned)
        .sort(MatchGroup.compareForDisplay);
      this.#render();
    } catch (error) {
      console.error(error);
      this.summaryEl.textContent = '';
      CardRenderer.renderEmptyState(this.groupsEl, {
        title: 'Something went wrong',
        body: 'Failed to load your matches. Please try again later.',
      });
    }
  }

  /**
   * Switches which reports are shown (all, lost, or found).
   */
  #setFilter(filter) {
    this.filter = filter;
    this.chips.forEach((chip) => {
      const isActive = chip.dataset.filter === filter;
      chip.classList.toggle('is-active', isActive);
      chip.setAttribute('aria-pressed', String(isActive));
    });
    this.#render();
  }

  /**
   * Gets the reports for a filter value.
   */
  #groupsFor(filter) {
    if (filter === 'all') return this.groups;
    return this.groups.filter((group) => group.item.type === filter);
  }

  /**
   * Draws the filter counts, the summary line, and the visible reports.
   */
  #render() {
    this.groupsEl.innerHTML = '';

    // With no reports at all there is nothing to filter.
    if (this.groups.length === 0) {
      this.filtersEl.hidden = true;
      this.summaryEl.textContent = '';
      this.#renderNoReports();
      return;
    }

    this.filtersEl.hidden = false;
    this.chips.forEach((chip) => {
      const countEl = Utils.qs('[data-filter-count]', chip);
      if (countEl) countEl.textContent = this.#groupsFor(chip.dataset.filter).length;
    });

    const visible = this.#groupsFor(this.filter);
    this.summaryEl.textContent = this.#summaryLabel(visible);

    if (visible.length === 0) {
      CardRenderer.renderEmptyState(this.groupsEl, this.#emptyFilterCopy());
      return;
    }
    visible.forEach((group) => this.groupsEl.appendChild(this.#renderGroup(group)));
  }

  /**
   * Builds the line under the filters, e.g. "3 reports · 6 possible matches".
   */
  #summaryLabel(groups) {
    const reports = groups.length;
    const matches = groups.reduce((total, group) => total + group.matches.length, 0);
    const reportsLabel = `${reports} report${reports === 1 ? '' : 's'}`;
    const matchesLabel = `${matches} possible match${matches === 1 ? '' : 'es'}`;
    return `${reportsLabel} · ${matchesLabel}`;
  }

  /**
   * Creates one report with its suggestions underneath.
   */
  #renderGroup(group) {
    const section = document.createElement('section');
    section.className = 'match-group';
    section.innerHTML = this.#sourceMarkup(group);

    if (group.matches.length === 0) {
      section.insertAdjacentHTML('beforeend', `
        <p class="match-none">No possible matches yet. New posts are checked against this report, so look again later.</p>
      `);
      return section;
    }

    section.insertAdjacentHTML('beforeend', `
      <p class="match-count">${Utils.escapeHtml(group.countLabel)}</p>
      <div class="card-grid"></div>
    `);
    const grid = Utils.qs('.card-grid', section);
    const cards = group.matches.map((match) => CardRenderer.renderMatchCard(match));
    cards.forEach((card) => grid.appendChild(card));

    const extraCards = cards.slice(MatchesPage.PREVIEW_COUNT);
    if (extraCards.length > 0) this.#addShowAllToggle(section, extraCards, cards.length);

    return section;
  }

  /**
   * Builds the strip describing the user's own report.
   */
  #sourceMarkup(group) {
    const { item } = group;
    const meta = `${item.metaLine} · Posted ${item.postedAgo.toLowerCase()}`;

    return `
      <div class="match-source match-source--${Utils.escapeHtml(item.type)}">
        <div class="match-source-thumb">${CardRenderer.imageMarkup(item, 24)}</div>
        <div class="match-source-body">
          <div class="match-source-label">${Utils.escapeHtml(group.sourceLabel)}</div>
          <h2 class="match-source-title">${Utils.escapeHtml(item.title)}</h2>
          <div class="match-source-meta">${Utils.escapeHtml(meta)}</div>
        </div>
        <a class="match-source-link" href="${Utils.escapeHtml(item.detailsUrl)}">View report →</a>
      </div>
    `;
  }

  /**
   * Hides the suggestions past the preview count behind a button,
   * so a report with many suggestions does not push the others far down.
   */
  #addShowAllToggle(section, extraCards, total) {
    const wrap = document.createElement('div');
    wrap.className = 'match-more';
    wrap.innerHTML = '<button type="button" class="btn btn-ghost btn-sm" aria-expanded="false"></button>';
    const button = Utils.qs('button', wrap);

    const setExpanded = (expanded) => {
      extraCards.forEach((card) => { card.hidden = !expanded; });
      button.textContent = expanded ? 'Show fewer' : `Show all ${total}`;
      button.setAttribute('aria-expanded', String(expanded));
    };

    button.addEventListener('click', () => {
      setExpanded(button.getAttribute('aria-expanded') !== 'true');
    });
    setExpanded(false);
    section.appendChild(wrap);
  }

  /**
   * Shown when the user has not posted anything yet.
   */
  #renderNoReports() {
    CardRenderer.renderEmptyState(this.groupsEl, {
      title: 'No reports yet',
      body: 'Post something you lost or found and its possible matches will show up here.',
    });
    Utils.qs('.empty-state', this.groupsEl)?.insertAdjacentHTML('beforeend', `
      <a href="create-item.html" class="btn btn-accent match-empty-action">Post an item</a>
    `);
  }

  /**
   * Copy for a filter the user has no reports in.
   */
  #emptyFilterCopy() {
    return this.filter === 'found'
      ? {
        title: 'No found reports',
        body: 'When you post something you found, people looking for it will show up here.',
      }
      : {
        title: 'No lost reports',
        body: 'When you post something you lost, found items that might be yours will show up here.',
      };
  }

  /**
   * Shows placeholder blocks while the matches are loading.
   */
  #renderLoading() {
    this.summaryEl.textContent = 'Loading…';
    const group = `
      <div class="match-group" aria-hidden="true">
        <div class="match-skeleton-source"></div>
        <div class="card-grid">
          <div class="match-skeleton-card"></div>
          <div class="match-skeleton-card"></div>
          <div class="match-skeleton-card"></div>
        </div>
      </div>
    `;
    this.groupsEl.innerHTML = group + group;
  }
}

/**
 * Start the matches page after the HTML page has finished loading.
 */
document.addEventListener('DOMContentLoaded', () => new MatchesPage().init());
