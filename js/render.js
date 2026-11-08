/**
 * Creates the HTML elements used to display an item on the page.
 * It also provides helper methods for displaying images and empty states.
 * All methods are static because this class does not need to store
 * any data for individual cards.
 */
class CardRenderer {

  /**
   * Creates a clickable card for an item.
   *
   * @param {Object} item - The item data to display.
   * @returns {HTMLElement} The completed card element.
   */
  static renderItemCard(item) {
    const el = document.createElement('a');
    el.className = `tag-card${item.isReturned ? ' tag-card--muted' : ''}`;
    el.href = item.detailsUrl;
    el.innerHTML = `
      <span class="tag-hole"></span>
      <div class="tag-thumb">
        ${CardRenderer.imageMarkup({ lazy: true })}
      </div>
      <div class="tag-info">
        <h3>${Utils.escapeHtml(item.title)}</h3>
        <div class="tag-meta">${Utils.escapeHtml(item.metaLine)}</div>
      </div>
      <div class="tag-perf"></div>
      <div class="tag-badges">
        ${CardRenderer.badgeMarkup(item)}
        <span class="tag-posted">${Utils.escapeHtml(item.postedAgo)}</span>
      </div>
    `;
    Photo.renderPhoto(Utils.qs('.item-photo', el), item.imageUrl);
    return el;
  }

  /**
   * Creates a card for an item suggested on the matches page.
   * It is the normal item card with a "Strong match" label over the photo
   * when the score is high, and the reasons it was suggested underneath.
   * With neither, the card is left unchanged.
   *
   * @param {Match} match - The suggested item, its score, and its reasons.
   * @returns {HTMLElement} The completed card element.
   */
  static renderMatchCard(match) {
    const el = CardRenderer.renderItemCard(match.item);
    if (match.isStrong) {
      el.classList.add('tag-card--strong');
      el.insertAdjacentHTML('afterbegin', '<span class="match-strong">Strong match</span>');
    }

    const labels = match.reasonLabels;
    if (labels.length === 0) return el;

    const reasons = labels
      .map((label) => `<li class="match-reason">${CardRenderer.#checkIcon()}${Utils.escapeHtml(label)}</li>`)
      .join('');
    el.insertAdjacentHTML('beforeend', `
      <div class="tag-perf"></div>
      <ul class="match-reasons" aria-label="Why this was suggested">${reasons}</ul>
    `);
    return el;
  }

  /**
   * Builds an item's status badge. Shared by the cards and the details page so
   * a returned item is marked the same way wherever it appears.
   *
   * @param {Object} item - The item the badge describes.
   * @returns {string} HTML for the badge.
   */
  static badgeMarkup(item) {
    const icon = item.isReturned ? CardRenderer.#checkIcon() : '';
    return `<span class="badge ${Utils.escapeHtml(item.badgeClass)}">${icon}${Utils.escapeHtml(item.badgeLabel)}</span>`;
  }

  /**
   * Check mark used in place of the badge's dot on returned items.
   * It sits beside the badge's own text, so it is hidden from screen readers.
   */
  static #checkIcon() {
    return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2.8" stroke-linecap="round"
      stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`;
  }

  /**
   * Shows a message when there are no items to display.
   *
   * @param {HTMLElement} container - Where the message should be displayed.
   * @param {Object} content - The title and message to show.
   */
  static renderEmptyState(container, { title, body }) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>${Utils.escapeHtml(title)}</h3>
        <p>${Utils.escapeHtml(body)}</p>
      </div>
    `;
  }

  /**
   * Creates the <img> used for an item's photo. The caller is responsible
   * for wiring it up with Photo.renderPhoto once it is in the DOM.
   *
   * @param {Object} options
   * @param {boolean} options.lazy - Whether the image should load lazily.
   * @returns {string} HTML for the image.
   */
  static imageMarkup({ lazy = false } = {}) {
    return `<img class="item-photo" alt=""${lazy ? ' loading="lazy"' : ''}>`;
  }
}
