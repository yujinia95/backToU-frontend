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

    document.title = `BackToU: ${item.title}`;
    this.content.innerHTML = `
      <article class="details-card">
        <span class="tag-hole"></span>
        <div class="details-top">
          ${this.#gallery(item)}
          <div>
            <h1 class="details-title">${Utils.escapeHtml(item.title)}</h1>
            <span class="badge ${Utils.escapeHtml(item.badgeClass)}">
              ${Utils.escapeHtml(item.badgeLabel)}
            </span>
          </div>
        </div>

        <dl class="details-facts">
          ${this.#fact('Status', this.#capitalize(item.status))}
          ${this.#fact(dateLabel, this.#formatDate(item.date))}
          ${this.#fact('Category', item.category)}
          ${this.#fact('Location', item.location)}
          ${this.#fact('Colors', colors)}
          ${this.#fact('Brand', brand)}
        </dl>

        <section class="details-description">
          <h2>Description</h2>
          <p>${Utils.escapeHtml(description)}</p>
        </section>

        <div class="details-poster">
          <div>
            <span>Posted by</span>
            <strong>${Utils.escapeHtml(item.posterName)}</strong>
          </div>
          ${isOwner ? '' : `
            <button
              type="button"
              class="btn btn-primary"
              data-message-poster
              disabled
              title="Messaging will be available soon"
            >
              Message poster
            </button>
          `}
        </div>
      </article>
    `;

    if (this.ownerActions) this.ownerActions.hidden = !isOwner;
    this.#connectGallery();
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
