/**
 * Shared helpers for item photos: validating a file before upload and
 * rendering a photo URL (or the no-photo placeholder) into an <img>.
 */
class Photo {
  static ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  static MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MiB, matches the backend's limit

  // Simple gray square with the same icon used by the no-photo card placeholder,
  // so there is something to show without a network request for items with no photo.
  static PLACEHOLDER_SRC = `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="#EAE7E0"/>
      <g transform="translate(76,76)" fill="none" stroke="#C2BCAC" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <rect x="0" y="0" width="48" height="36" rx="4"/>
        <circle cx="14" cy="12" r="4"/>
        <path d="M48 28l-12-10-10 7-8-5-18 13"/>
      </g>
    </svg>
  `)}`;

  /**
   * Checks a file against the backend's accepted types and size limit.
   *
   * @param {File} file - The file the user picked.
   * @returns {string|null} A user-facing error message, or null if the file is OK.
   */
  static validatePhotoFile(file) {
    if (!Photo.ACCEPTED_TYPES.includes(file.type)) {
      return 'Please choose a JPEG, PNG, or WebP image.';
    }
    if (file.size > Photo.MAX_SIZE_BYTES) {
      return 'Photo must be 5 MB or smaller.';
    }
    return null;
  }

  /**
   * Renders a photo URL into an <img>, falling back to a placeholder when
   * there is no photo or the photo fails to load.
   *
   * @param {HTMLImageElement} imgEl - The image element to update.
   * @param {string|null} photoUrl - The item's photo URL, or null.
   */
  static renderPhoto(imgEl, photoUrl) {
    imgEl.onerror = null;

    if (!photoUrl) {
      imgEl.src = Photo.PLACEHOLDER_SRC;
      return;
    }

    imgEl.onerror = () => {
      imgEl.onerror = null; // Clear first so a failing placeholder cannot loop.
      imgEl.src = Photo.PLACEHOLDER_SRC;
    };
    imgEl.src = photoUrl;
  }
}
