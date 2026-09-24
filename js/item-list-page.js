/**
 * item-list-page.js
 * Base class for any page that's a searchable grid of items
 * (found-items.html, lost-items.html). Subclasses only need to override
 * fetchItems(), countLabel(), and emptyCopy() — everything else
 * (wiring up both search bars, loading state, rendering) is shared here.
 */
class ItemListPage {
    constructor() {
        this.grid = Utils.qs('#item-grid');
        this.countEl = Utils.qs('#results-count');
        this.searchForm = Utils.qs('#search-form');
        this.searchInput = Utils.qs('#search-input');
        this.mobileForm = Utils.qs('#search-form-mobile');
        this.mobileInput = this.mobileForm?.querySelector('input');
    }

    init() {
        // Public page — no auth required to browse.
        this.searchForm?.addEventListener('submit', (e) => this.#handleSearch(e, this.searchInput));
        this.mobileForm?.addEventListener('submit', (e) => this.#handleSearch(e, this.mobileInput));

        // Support arriving here with ?q= (e.g. from the dashboard search bar).
        const initialQuery = Utils.sanitizeText(Utils.getParam('q') || '');
        if (this.searchInput) this.searchInput.value = initialQuery;
        if (this.mobileInput) this.mobileInput.value = initialQuery;
        this.load(initialQuery);
    }

    load(query = '') {
        this.grid.innerHTML = '';
        this.countEl.textContent = 'Loading\u2026';
        this.fetchItems(query)
            .then((items) => {
                this.countEl.textContent = this.countLabel(items.length);
                if (items.length === 0) {
                    CardRenderer.renderEmptyState(this.grid, this.emptyCopy());
                    return;
                }
                items.forEach((item) => this.grid.appendChild(CardRenderer.renderItemCard(item)));
            })
            .catch((err) => {
                console.error(err);
                this.countEl.textContent = '';
                CardRenderer.renderEmptyState(this.grid, {
                    title: 'Something went wrong',
                    body: 'Failed to load items. Please try again later.',
                });
            });
    }

    // ---- overridden by subclasses ----------------------------------

    fetchItems(_query) {
        throw new Error('fetchItems() must be implemented by a subclass of ItemListPage');
    }

    countLabel(count) {
        return `${count} item${count === 1 ? '' : 's'}`;
    }

    emptyCopy() {
        return { title: 'No items found', body: 'There are no items to show right now.' };
    }

    // ---- private ----------------------------------------------------

    #handleSearch(e, sourceInput) {
        e.preventDefault();
        const query = Utils.sanitizeText(sourceInput.value);
        this.load(query);
        if (this.searchInput) this.searchInput.value = query;
        if (this.mobileInput) this.mobileInput.value = query;
    }
}
