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
    el.className = 'tag-card';
    el.href = item.detailsUrl;
    el.innerHTML = `
      <span class="tag-hole"></span>
      <div class="tag-thumb">
        ${CardRenderer.#resolveImage(item)}
      </div>
      <div class="tag-id">${Utils.escapeHtml(item.id)}</div>
      <h3>${Utils.escapeHtml(item.title)}</h3>
      <div class="tag-meta">${Utils.escapeHtml(item.metaLine)}</div>
      <div class="tag-perf"></div>
      <span class="badge ${item.badgeClass}">${item.badgeLabel}</span>
    `;
    return el;
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
   * Creates HTML for an item's image.
   * If the item has no image, a placeholder icon is used instead.
   *
   * @param {Object} item - The item containing the image URL.
   * @param {number} size - The image size.
   * @returns {string} HTML for the image or placeholder.
   */  
  static imageMarkup(item, size = 32) {
    if (!item.imageUrl) return CardRenderer.#placeholderIcon(size);
    return `<img src="${Utils.escapeHtml(item.imageUrl)}" alt="">`;
  }

  /**
   * Gets the image HTML used by an item card.
   * Cards use a small 32px image.
   */
  static #resolveImage(item) {
    return CardRenderer.imageMarkup(item, 32);
  }

  /**
   * Creates a simple placeholder icon when an item has no image.
   *
   * @param {number} size - The icon size.
   * @returns {string} SVG placeholder icon.
   */
  static #placeholderIcon(size = 32) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-4-4 3-3-2-6 5"/>
    </svg>`;
  }
}
