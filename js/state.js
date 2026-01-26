export const state = {
    flashcards: [],
    currentIndex: 0,
    dueCards: [],

    // UI State
    mainStageActivated: false,
    isShowingAnswer: false,
    isAnimating: false,
    isCardFlipped: false,

    // Sensor State
    currentTilt: 0,
    currentForwardTilt: 0,

    // Feature State
    hasPermission: false,

    // Reveal Logic
    revealProgress: 0
};
