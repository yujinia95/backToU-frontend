class LostItemPage extends ItemListPage {
/**
 * lost-items.js
 * Entry point for lost-items.html. 
 * Filters the full item list down to type === 'lost', 
 * optionally narrowed by a search query.
 */
    async fetchItems(query) {
        const rawItems = await Api.getItems();
        const items = rawItems.map(data => new Item(data))
        const normalizedQuery = query.toLowerCase();

        return items.filter(item => {
            const matchesType = item.type === 'lost'; 
            const matchesQuery = !normalizedQuery || [item.title, item.location, item.category]
                .some(value => value.toLowerCase().includes(normalizedQuery));
            return matchesType && matchesQuery;
        });
    }
}

new LostItemPage().init()
