/**
 * Loads and displays a single item from the id in the page URL.
 */
class ItemDetailsPage {
  constructor() {
    this.content = Utils.qs('#details-content');
    this.ownerActions = Utils.qs('[data-owner-actions]');
  }

  /**
   * Validates the item id, fetches the item, and renders its details.
   */
  async init() {
    if (!this.content) return;

    const itemId = Utils.getParam('id');
    if (!this.#isValidId(itemId)) {
      this.#renderError('Invalid item', 'The item link is missing a valid id.');
      return;
    }

    try {
      const data = await Api.getItem(itemId);
      const item = new Item(data);
      this.#renderItem(item);
    } catch (error) {
      const message = error?.message || 'Unable to load this item. Please try again later.';
      this.#renderError('Unable to load item', message);
    }
  }

  /**
   * Checks that the URL id is a positive whole number.
   */
  #isValidId(value) {
    return /^\d+$/.test(value || '') && Number(value) > 0;
  }

  /**
   * Renders the item information inside the details container.
   */
  #renderItem(item) {
    const dateLabel = item.type === 'found' ? 'Date found' : 'Date lost';
    const colors = item.colors.join(', ');
    const brand = item.brand || 'Not specified';
    const description = item.description || 'No description provided.';
    const isOwner = Number(Auth.getCurrentUser()?.id) === Number(item.user_id);
    const isReturned = item.isReturned;

    document.title = `BackToU: ${item.title}`;
    this.content.innerHTML = `
      <article class="details-card${isReturned ? ' details-card--returned' : ''}">
        ${isReturned ? this.#closedBanner(item) : '<span class="tag-hole"></span>'}
        <div class="details-top">
          ${this.#gallery(item)}
          <div>
            <h1 class="details-title">${Utils.escapeHtml(item.title)}</h1>
            ${CardRenderer.badgeMarkup(item)}
            ${isReturned ? this.#timeline(item) : ''}
          </div>
        </div>

        <dl class="details-facts">
          ${isReturned
            ? `${this.#fact(dateLabel, this.#formatDate(item.date))}
               ${this.#fact('Returned on', Utils.formatDate(item.returned_at))}`
            : `${this.#fact('Status', this.#capitalize(item.status))}
               ${this.#fact(dateLabel, this.#formatDate(item.date))}`}
          ${this.#fact('Category', item.category)}
          ${this.#fact('Location', item.location)}
          ${this.#fact('Colors', colors)}
          ${this.#fact('Brand', brand)}
        </dl>

        <section class="details-description">
          <h2>Description</h2>
          <p>${Utils.escapeHtml(description)}</p>
        </section>

        ${this.#posterFooter(item, isOwner, isReturned)}
      </article>
    `;

    if (this.ownerActions) this.ownerActions.hidden = !isOwner;
    this.#connectGallery();
  }

  /**
   * Full-width banner announcing the outcome. It sits above the photo so the
   * closed state is the first thing read, not something found further down.
   */
  #closedBanner(item) {
    const headline = `Returned to its owner on ${Utils.formatDate(item.returned_at)}`;

    return `
      <div class="details-closed-banner" role="status">
        <span class="details-closed-mark" aria-hidden="true">${this.#checkIcon(22)}</span>
        <div class="details-closed-copy">
          <strong>${Utils.escapeHtml(headline)}</strong>
          <span>This case is closed. Messaging is turned off for this post.</span>
        </div>
        <span class="details-case-label">Case closed</span>
      </div>
    `;
  }

  /**
   * Two-step case history: when the item was reported, and when it came back.
   * The return date and the duration are dropped when there is no timestamp.
   */
  #timeline(item) {
    const returnedOn = Utils.formatDate(item.returned_at);
    const resolved = item.resolvedLabel;

    return `
      <div class="details-timeline">
        <div class="details-timeline-row">
          <span class="details-timeline-dot" aria-hidden="true"></span>
          <span class="details-timeline-label">${Utils.escapeHtml(item.reportedLabel)}</span>
          <span class="details-timeline-date">${Utils.escapeHtml(this.#formatDate(item.date))}</span>
        </div>
        <span class="details-timeline-rail" aria-hidden="true"></span>
        <div class="details-timeline-row details-timeline-row--done">
          <span class="details-timeline-dot" aria-hidden="true"></span>
          <span class="details-timeline-label">Returned to owner</span>
          <span class="details-timeline-date">${Utils.escapeHtml(returnedOn)}</span>
        </div>
        ${resolved ? `<p class="details-timeline-foot">${Utils.escapeHtml(resolved)}</p>` : ''}
      </div>
    `;
  }

  /**
   * Poster line plus whichever action still applies. A returned post cannot be
   * messaged, so it points to the items that are still open instead.
   */
  #posterFooter(item, isOwner, isReturned) {
    const activeListUrl = item.type === 'found' ? 'found-items.html' : 'lost-items.html';

    let action = '';
    if (isReturned) {
      action = `
        <div class="details-poster-actions">
          <div class="details-messaging-closed">
            ${this.#lockIcon()}
            Messaging closed
          </div>
          <a class="btn btn-ghost details-returned-cta" href="${activeListUrl}">
            Browse active items
            ${this.#arrowIcon()}
          </a>
        </div>
      `;
    } else if (!isOwner) {
      action = `
        <button
          type="button"
          class="btn btn-primary"
          data-message-poster
          disabled
          title="Messaging will be available soon"
        >
          Message poster
        </button>
      `;
    }

    return `
      <div class="details-poster">
        <div>
          <span>Posted by</span>
          <strong>${Utils.escapeHtml(item.posterName)}</strong>
        </div>
        ${action}
      </div>
    `;
  }

  /**
   * Decorative icons. Each sits beside its own text label, so they are
   * hidden from assistive technology rather than given their own name.
   */
  #checkIcon(size = 16) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2.6" stroke-linecap="round"
      stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`;
  }

  #lockIcon() {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round"
      stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>`;
  }

  #arrowIcon() {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round"
      stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>`;
  }

  /**
   * Creates a large image area and up to five selectable thumbnails.
   * The placeholder remains visible until the API provides image data.
   */
  #gallery(item) {
    if (item.images.length === 0) {
      return `
        <div class="details-gallery">
          <div class="details-thumb">
            ${CardRenderer.imageMarkup(item, 80)}
          </div>
        </div>
      `;
    }

    const selectedImage = item.images.find((image) => image.is_thumbnail) || item.images[0];
    const thumbnails = item.images.map((image) => `
      <button
        type="button"
        class="details-thumbnail${image === selectedImage ? ' is-selected' : ''}"
        data-gallery-thumbnail
        data-image-url="${Utils.escapeHtml(image.url)}"
        aria-label="View another photo of ${Utils.escapeHtml(item.title)}"
        aria-pressed="${image === selectedImage}"
      >
        <img src="${Utils.escapeHtml(image.url)}" alt="">
      </button>
    `).join('');

    return `
      <div class="details-gallery">
        <div class="details-thumb">
          <img
            src="${Utils.escapeHtml(selectedImage.url)}"
            alt="${Utils.escapeHtml(item.title)}"
            data-gallery-main
          >
        </div>
        <div class="details-thumbnails" aria-label="Item photos">
          ${thumbnails}
        </div>
      </div>
    `;
  }

  /**
   * Changes the large image when a thumbnail is selected.
   */
  #connectGallery() {
    const mainImage = Utils.qs('[data-gallery-main]', this.content);
    if (!mainImage) return;

    Utils.qsa('[data-gallery-thumbnail]', this.content).forEach((button) => {
      button.addEventListener('click', () => {
        mainImage.src = button.dataset.imageUrl;

        Utils.qsa('[data-gallery-thumbnail]', this.content).forEach((thumbnail) => {
          const isSelected = thumbnail === button;
          thumbnail.classList.toggle('is-selected', isSelected);
          thumbnail.setAttribute('aria-pressed', String(isSelected));
        });
      });
    });
  }

  /**
   * Creates one escaped label/value pair for the facts list.
   */
  #fact(label, value) {
    return `
      <div class="details-fact">
        <dt>${Utils.escapeHtml(label)}</dt>
        <dd>${Utils.escapeHtml(value)}</dd>
      </div>
    `;
  }

  /**
   * Formats the API's YYYY-MM-DD date without shifting time zones.
   */
  #formatDate(value) {
    const parts = String(value).split('-').map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return value;

    const [year, month, day] = parts;
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  /**
   * Converts an API enum value into a display label.
   */
  #capitalize(value) {
    if (!value) return '';
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  /**
   * Replaces the loading state with a helpful error message.
   */
  #renderError(title, message) {
    this.content.innerHTML = `
      <div class="details-error" role="alert">
        <h1>${Utils.escapeHtml(title)}</h1>
        <p>${Utils.escapeHtml(message)}</p>
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', () => new ItemDetailsPage().init());
