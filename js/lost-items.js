class LostItemPage extends ItemListPage {

    async fetchItems(query) {
        const rawItems = await Api.getItems();
        const items = rawItems.map(data => new Item(data))

        return items.filter(item => {
            const matchesType = item.type === 'lost'; 
            const matchesQuery = !query || item.title.toLowerCase().includes(query.toLowerCase());
            return matchesType && matchesQuery;
        });
    }
}

new LostItemPage().init()
