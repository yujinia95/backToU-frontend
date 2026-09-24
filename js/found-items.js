class FoundItemPage extends ItemListPage {
/**
 * found-items.js
 * Entry point for found-items.html. 
 * Filters the full item list down to type === 'found',
 * optionally narrowed by a search query.
 */
    async fetchItems(query) {
        const rawItems = await Api.getItems()
        const items = rawItems.map(data => new Item(data));
        const normalizedQuery = query.toLowerCase();

        return items.filter(item => {
            const matchesType = item.type === 'found';
            const matchesQuery = !normalizedQuery || [item.title, item.location, item.category]
                .some(value => value.toLowerCase().includes(normalizedQuery));
            return matchesType && matchesQuery;
        });
    }
}

new FoundItemPage().init()
