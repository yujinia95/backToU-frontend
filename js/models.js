/**
 * Item — wraps a raw item object from the API response (ItemResponse schema on the backend)
 * so the rest of the frontend works with a consistent shape instead of raw fetch data.
 */
class Item {
    constructor({ id, user_id, type, status, date, title, description, category, colors, brand, location, created_at, poster = null, images = [] }) {
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
        this.poster = poster;
        this.images = Array.isArray(images) ? images.slice(0, 5) : [];
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
        const thumbnail = this.images.find((image) => image.is_thumbnail);
        return thumbnail?.url || this.images[0]?.url || null;
    }

    // Display name for the user who posted the item
    get posterName() {
        if (!this.poster) return `User #${this.user_id}`;
        return `${this.poster.first_name} ${this.poster.last_name}`.trim();
    }
}
