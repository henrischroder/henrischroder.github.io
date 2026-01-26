import { saveFlashcardsToStorage } from './storage.js';
import { state } from './state.js';

// Spaced Repetition System (SM-2 Algorithm)
// Tracks ease factor, intervals, and repetitions to optimize review schedules.
export function initializeCardProgress(card) {
    return {
        ...card,
        progress: {
            easeFactor: 2.5, // Starting ease factor (SM-2 default)
            interval: 0, // Days until next review
            repetitions: 0, // Number of consecutive successful reviews
            nextReviewDate: new Date().toISOString(), // Available for review today
            lastReviewDate: null,
            difficulty: 'normal', // 'easy', 'normal', 'hard'
            totalReviews: 0,
            correctReviews: 0
        }
    };
}

export function getCardsDueForReview(flashcards) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return flashcards.filter(card => {
        if (!card.progress) return true; // New cards are always due
        const nextReview = new Date(card.progress.nextReviewDate);
        nextReview.setHours(0, 0, 0, 0);
        return nextReview <= today;
    });
}

/**
 * Updates a card's SM-2 progress based on recall quality.
 *
 * @param {number} cardIndex - Index in the flashcards array
 * @param {number} quality - 0=Wrong, 1=Hard, 2=Normal, 3=Easy
 */
export function updateCardProgress(cardIndex, quality) {
    const card = state.flashcards[cardIndex];
    if (!card.progress) {
        card.progress = initializeCardProgress(card).progress;
    }

    const progress = card.progress;
    progress.lastReviewDate = new Date().toISOString();
    progress.totalReviews++;

    if (quality === 0) {
        // Wrong answer - reset
        progress.repetitions = 0;
        progress.interval = 0;
        progress.difficulty = 'hard';
        progress.nextReviewDate = new Date().toISOString(); // Review again today
    } else {
        // Correct answer
        progress.correctReviews++;

        if (quality === 1) {
            // Hard
            progress.difficulty = 'hard';
            progress.easeFactor = Math.max(1.3, progress.easeFactor - 0.15);
        } else if (quality === 2) {
            // Normal
            progress.difficulty = 'normal';
            // Ease factor stays the same
        } else if (quality === 3) {
            // Easy
            progress.difficulty = 'easy';
            progress.easeFactor = Math.min(2.5, progress.easeFactor + 0.15);
        }

        // Calculate new interval
        if (progress.repetitions === 0) {
            progress.interval = 1; // 1 day
        } else if (progress.repetitions === 1) {
            progress.interval = 6; // 6 days
        } else {
            progress.interval = Math.round(progress.interval * progress.easeFactor);
        }

        progress.repetitions++;

        // Calculate next review date
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + progress.interval);
        progress.nextReviewDate = nextDate.toISOString();
    }

    saveFlashcardsToStorage(state.flashcards);
}

export function getProgressStats(flashcards) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueCards = getCardsDueForReview(flashcards);
    const stats = {
        total: flashcards.length,
        dueToday: dueCards.length,
        easy: 0,
        normal: 0,
        hard: 0,
        mastered: 0,
        totalReviews: 0,
        correctReviews: 0,
        averageEase: 0
    };

    flashcards.forEach(card => {
        if (card.progress) {
            stats.totalReviews += card.progress.totalReviews || 0;
            stats.correctReviews += card.progress.correctReviews || 0;
            stats.averageEase += card.progress.easeFactor || 2.5;

            const nextReview = new Date(card.progress.nextReviewDate);
            nextReview.setHours(0, 0, 0, 0);

            if (nextReview > today && card.progress.repetitions >= 3) {
                stats.mastered++;
            }
        }
    });

    dueCards.forEach(card => {
        if (card.progress) {
            if (card.progress.difficulty === 'easy') stats.easy++;
            else if (card.progress.difficulty === 'hard') stats.hard++;
            else stats.normal++;
        } else {
            stats.normal++; // New cards are normal
        }
    });

    if (flashcards.length > 0) {
        stats.averageEase = (stats.averageEase / flashcards.length).toFixed(2);
    }

    return stats;
}
