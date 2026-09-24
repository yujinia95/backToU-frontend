/**
 * Item — wraps a raw item object from the API response (ItemResponse schema on the backend)
 * so the rest of the frontend works with a consistent shape instead of raw fetch data.
 */
class Item {
    constructor({ id, user_id, type, status, date, title, description, category, colors, brand, location, created_at }) {
        this.id = id;
        this.user_id = user_id;
        this.type = type;
        this.status = status;
        this.date = date;
        this.title = title;
        this.description = description;
        this.category = category;
        this.colors = colors;
        this.brand = brand;
        this.location = location;
        this.created_at = created_at;
    }

    // URL to this item's details page
    get detailsUrl() {
        return `item-details.html?id=${this.id}`;
    }

    // Secondary line shown on the card (category + location)
    get metaLine() {
        return `${this.category} · ${this.location}`;
    }

    // CSS modifier class for the badge (appended after "badge ")
    get badgeClass() {
        return `badge-${this.type}`;
    }

    // Human-readable badge text ("Found" / "Lost")
    get badgeLabel() {
        return this.type === 'found' ? 'Found' : 'Lost';
    }

    // Image URL for the card thumbnail, if any
    get imageUrl() {
        return null; // placeholder
    }
}
