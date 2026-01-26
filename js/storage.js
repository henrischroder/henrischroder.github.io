export function loadFlashcardsFromStorage() {
    try {
        const stored = localStorage.getItem('gyroCards');
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error('Error loading flashcards from storage:', e);
        return [];
    }
}

export function saveFlashcardsToStorage(flashcards) {
    try {
        localStorage.setItem('gyroCards', JSON.stringify(flashcards));
    } catch (e) {
        console.error('Error saving flashcards to storage:', e);
    }
}
