/**
 * Item — wraps a raw item object from the API response (ItemResponse schema on the backend)
 * so the rest of the frontend works with a consistent shape instead of raw fetch data.
 */
class Item {
    constructor({ id, user_id, type, status, date, title, description, category, colors, brand, location, created_at, returned_at = null, poster = null, images = [] }) {
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
        this.returned_at = returned_at;
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

    // CSS modifier class for the badge (appended after "badge "). Returned items
    // show a "Returned" badge in place of the usual Found/Lost one.
    get badgeClass() {
        if (this.isReturned) return 'badge-returned';
        return `badge-${this.type}`;
    }

    // Human-readable badge text ("Found" / "Lost" / "Returned")
    get badgeLabel() {
        if (this.isReturned) return 'Returned';
        return this.type === 'found' ? 'Found' : 'Lost';
    }

    // Whether this item has already been returned to its owner
    get isReturned() {
        return this.status === 'returned';
    }

    // When the item went back to its owner, or null when that is unknown.
    // Items returned before the returned_at column existed have no timestamp.
    get returnedAt() {
        if (!this.returned_at) return null;
        const returned = new Date(this.returned_at);
        return Number.isNaN(returned.getTime()) ? null : returned;
    }

    // Opening step of the case history. A found item can be returned too,
    // so this follows the item's type rather than assuming it was lost.
    get reportedLabel() {
        return this.type === 'found' ? 'Reported found' : 'Reported lost';
    }

    // How long the case stayed open, or null when there is no return date
    // to measure against.
    get resolvedLabel() {
        const returned = this.returnedAt;
        if (!returned) return null;

        const parts = String(this.date).split('-').map(Number);
        if (parts.length !== 3 || parts.some(Number.isNaN)) return null;

        const [year, month, day] = parts;
        const reportedDay = new Date(year, month - 1, day);
        const returnedDay = new Date(returned.getFullYear(), returned.getMonth(), returned.getDate());
        const days = Math.round((returnedDay - reportedDay) / 86400000);

        if (days < 0) return null;
        if (days === 0) return 'Resolved same day';
        return `Resolved in ${days} day${days === 1 ? '' : 's'}`;
    }

    // Relative description of how long ago this item was posted (e.g. "3 days ago")
    get postedAgo() {
        return Utils.formatRelativeTime(this.created_at);
    }

    // Image URL for the card thumbnail, if any
    get imageUrl() {
        const thumbnail = this.images.find((image) => image.is_thumbnail);
        return thumbnail?.url || this.images[0]?.url || null;
    }

    // Display name for the user who posted the item
    get posterName() {
        if (!this.poster) return `User #${this.user_id}`;
        const firstName = (this.poster.first_name || '').trim();
        const lastName = (this.poster.last_name || '').trim();
        const lastInitial = lastName ? `${lastName.charAt(0).toUpperCase()}.` : '';
        return [firstName, lastInitial].filter(Boolean).join(' ');
    }

    /**
     * Comparator for displaying a list of items: active items first
     * (most recent first), then returned items (most recent first).
     * Shared by any page that lists items, so returned items always
     * sink below active ones regardless of how recently they were posted.
     */
    static compareForDisplay(a, b) {
        if (a.isReturned !== b.isReturned) return a.isReturned ? 1 : -1;
        return new Date(b.created_at) - new Date(a.created_at);
    }
}
