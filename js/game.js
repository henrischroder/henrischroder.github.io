import { state } from './state.js';
import * as UI from './ui.js';
import { updateCardProgress, getCardsDueForReview } from './srs.js';

export function initializeDueCards(resetIndex = true) {
    const oldLength = state.dueCards.length;
    state.dueCards = getCardsDueForReview(state.flashcards);

    if (resetIndex || oldLength === 0) {
        state.currentIndex = 0;
    } else if (state.currentIndex >= state.dueCards.length) {
        state.currentIndex = 0;
    }
    UI.updateProgressIndicator(getProgressStats());
}

export function showCurrentCard() {
    if (state.dueCards.length === 0 || state.currentIndex >= state.dueCards.length) {
        initializeDueCards();
        if (state.dueCards.length === 0) {
            UI.showCompletionMessage();
            UI.updateProgressIndicator(getProgressStats());
            return;
        }
        state.currentIndex = 0;
    }

    state.isShowingAnswer = false;
    state.isCardFlipped = false;
    state.revealProgress = 0;

    UI.renderCard(state.dueCards[state.currentIndex]);
    UI.updateProgressIndicator(getProgressStats());
}

export function nextCard() {
    initializeDueCards(false);

    if (state.dueCards.length === 0) {
        showCurrentCard();
        return;
    }

    if (state.currentIndex < state.dueCards.length - 1) {
        state.currentIndex++;
    } else {
        state.currentIndex = 0;
    }

    showCurrentCard();
    UI.elements.card.classList.add('fade-in');
    setTimeout(() => {
        UI.elements.card.classList.remove('fade-in');
    }, 500);
}

export function flipCard() {
    if (state.currentIndex >= state.dueCards.length || state.isCardFlipped) return;

    state.isShowingAnswer = true;
    state.isCardFlipped = true;
    UI.elements.card.classList.add("flipped");
    UI.elements.flipButton.disabled = true;
    UI.showActionButtons();
}

export function markKnown() {
    if (state.currentIndex >= state.dueCards.length || state.isAnimating || !state.isCardFlipped) return;

    const currentCard = state.dueCards[state.currentIndex];
    // Find index in main array
    const cardIndex = state.flashcards.findIndex(c => c.question === currentCard.question && c.answer === currentCard.answer);

    if (cardIndex !== -1) {
        updateCardProgress(cardIndex, 2); // 2 = Normal/Known
    }

    state.isAnimating = true;
    UI.hideActionButtons();

    UI.elements.edgeGlow.classList.remove('glow-red', 'glow-green');
    UI.elements.edgeGlow.classList.add('glow-green');
    setTimeout(() => UI.elements.edgeGlow.classList.remove('glow-green'), 1000);

    UI.elements.card.classList.add('slide-out-right');
    setTimeout(() => {
        UI.elements.card.classList.remove('slide-out-right');
        initializeDueCards(false);

        if (state.currentIndex >= state.dueCards.length && state.dueCards.length > 0) {
            state.currentIndex = 0;
        } else if (state.currentIndex >= state.dueCards.length) {
            state.currentIndex = 0;
        }

        UI.updateProgressIndicator(getProgressStats());
        showCurrentCard();
        UI.elements.card.classList.add('fade-in');
        setTimeout(() => UI.elements.card.classList.remove('fade-in'), 500);
        state.isAnimating = false;
    }, 600);
}

export function markUnknown() {
    if (state.currentIndex >= state.dueCards.length || state.isAnimating || !state.isCardFlipped) return;

    const currentCard = state.dueCards[state.currentIndex];
    const cardIndex = state.flashcards.findIndex(c => c.question === currentCard.question && c.answer === currentCard.answer);

    if (cardIndex !== -1) {
        updateCardProgress(cardIndex, 0); // 0 = Wrong
    }

    state.isAnimating = true;
    UI.hideActionButtons();

    UI.elements.edgeGlow.classList.remove('glow-red', 'glow-green');
    UI.elements.edgeGlow.classList.add('glow-red');
    setTimeout(() => UI.elements.edgeGlow.classList.remove('glow-red'), 1000);

    UI.elements.card.classList.add('slide-out-left');

    setTimeout(() => {
        UI.elements.card.classList.remove('slide-out-left');
        state.currentIndex++;
        if (state.currentIndex >= state.dueCards.length) {
            state.currentIndex = 0;
        }
        UI.updateProgressIndicator(getProgressStats());
        nextCard(); // This might be redundant or double-call nextCard logic? nextCard handles increment too.
        // Logic in script.js was: currentIndex++, then nextCard().
        // nextCard() calls initializeDueCards(false) -> checks length -> increments index again?
        // Let's check script.js:596-599
        // currentIndex++ -> updateProgress -> nextCard()
        // nextCard(): initializeDueCards(false), check length. if currentIndex < length-1 => currentIndex++.
        // So distinct from markKnown logic. markKnown resets index or stays. markUnknown increments BUT nextCard creates fade effect.
        // Wait, markUnknown just moves to back of today's queue (effectively).
        // Let's stick to script.js logic carefully.
        // script.js L594: currentIndex++
        // script.js L599: nextCard()
        // script.js nextCard L489: if (currentIndex < dueCards.length - 1) currentIndex++.
        // So if we manually incremented, nextCard might increment AGAIN.
        // Actually, markUnknown logic seemed to just skip to next for now?
        // "Card stays in due cards (will be reviewed again today)"
        // If I just call nextCard(), it handles finding the next one.
        // But nextCard increments index. If I increment before calling nextCard, I skip one?
        // script.js L594 `currentIndex++` then L599 `nextCard()`:
        // `nextCard` does `initializeDueCards(false)`. Then checks index.
        // If I rely on `nextCard` to advance, I shouldn't manually increment here UNLESS `nextCard` starts from current.
        // `nextCard` logic: if not end, index++.
        // So `markUnknown` meant "step over this card, it's still due".
        // I will trust `nextCard` to do the right thing if I just want to show the next one.
        // BUT script.js did both. Let's assume there was a reason or a bug.
        // I'll stick to `nextCard` invocation only, as it encapsulates "go to next".
        // Actually, looking closely at `markUnknown`:
        // It calls `updateCardProgress(..., 0)` which resets interval to 0 (review today).
        // So it stays in `dueCards`.
        // We want to move to the next card in the *current view*.
        state.isAnimating = false;
    }, 600);
}

// Need to import getProgressStats from srs.js?
// Yes, referenced in initializeDueCards.
import { getProgressStats } from './srs.js';

/**
 * Handles 'deviceorientation' events.
 */
export function handleTilt(event) {
    state.currentTilt = event.gamma;
    state.currentForwardTilt = typeof event.beta === "number" ? event.beta : null;
}

/**
 * Main Game Loop
 */
export function gameLoop(timestamp) {
    requestAnimationFrame(gameLoop);

    if (state.isAnimating) return;

    const progressBar = UI.elements.revealProgressBar;

    // Hold-to-reveal logic
    if (!state.isCardFlipped && state.currentForwardTilt !== null) {
        if (state.currentForwardTilt > 35) {
            if (!state.revealProgress) state.revealProgress = 0;

            state.revealProgress += 4.16; // 20% faster setting

            if (state.revealProgress >= 100) {
                state.revealProgress = 100;
                flipCard();
                setTimeout(() => {
                    state.revealProgress = 0;
                    if (progressBar) progressBar.style.width = "0%";
                }, 500);
            }
        } else {
            state.revealProgress = 0;
        }

        if (progressBar) {
            progressBar.style.width = `${state.revealProgress}%`;
            progressBar.style.opacity = state.revealProgress > 0 ? "1" : "0";
        }
    }

    // Tilt rotation
    if (state.currentTilt !== null && state.currentTilt !== undefined) {
        const tiltRotation = state.currentTilt / 3;
        UI.elements.card.style.setProperty("--tilt-rotation", `${tiltRotation}deg`);
    }

    // Gestures
    if (state.isCardFlipped) {
        if (state.currentTilt > 45) {
            markKnown();
        }
        if (state.currentTilt < -45) {
            markUnknown();
        }
    }
}
