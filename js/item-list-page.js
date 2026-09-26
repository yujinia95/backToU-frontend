/**
 * item-list-page.js
 * Base class for any page that's a searchable grid of items
 * (found-items.html, lost-items.html). Reads which type this page is for
 * from <body data-item-type="found|lost">,
 */
class ItemListPage {
    constructor() {
        this.itemType = document.body.dataset.itemType;
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
                const returnedCount = items.filter((item) => item.isReturned).length;
                this.countEl.textContent = this.countLabel(items.length, returnedCount);
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


    /** Fetch all items and return only ones matching this page's type and the search query. */
    async fetchItems(query) {
        const rawItems = await Api.getItems();
        const items = rawItems.map((data) => new Item(data));
        const filtered = items.filter((item) => {
            const matchesType = item.type === this.itemType;
            const matchesQuery = !query || item.title.toLowerCase().includes(query.toLowerCase());
            return matchesType && matchesQuery;
        });
        // Active items first (most recent first), then returned items (most recent first).
        return filtered.sort(Item.compareForDisplay);
    }

    countLabel(count, returnedCount = 0) {
        const base = `${count} item${count === 1 ? '' : 's'}`;
        return returnedCount > 0 ? `${base} (${returnedCount} returned)` : base;
    }

    emptyCopy() {
        return { title: 'No items found', body: 'There are no items to show right now.' };
    }

    #handleSearch(e, sourceInput) {
        e.preventDefault();
        const query = Utils.sanitizeText(sourceInput.value);
        this.load(query);
        if (this.searchInput) this.searchInput.value = query;
        if (this.mobileInput) this.mobileInput.value = query;
    }
    
}

document.addEventListener('DOMContentLoaded', () => new ItemListPage().init());
