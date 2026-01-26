import { state } from './state.js';
import * as UI from './ui.js';
import * as Game from './game.js';
import { loadFlashcardsFromStorage, saveFlashcardsToStorage } from './storage.js';
import { initializeCardProgress } from './srs.js';
import { isMobileDevice } from './utils.js';

// Initialization
state.flashcards = loadFlashcardsFromStorage();

if (state.flashcards.length === 0) {
    state.flashcards = [
        { question: "What is HTML?", answer: "HyperText Markup Language" },
        { question: "How to declare a variable in JS?", answer: "let or const" },
        { question: "CSS stands for…", answer: "Cascading Style Sheets" },
        { question: "What does DOM stand for?", answer: "Document Object Model" },
        { question: "What is async/await?", answer: "Syntax for handling asynchronous operations in JavaScript" },
        { question: "What is the box model in CSS?", answer: "Content, padding, border, and margin" },
        { question: "What is flexbox?", answer: "A CSS layout method for arranging items in a container" },
        { question: "What is grid in CSS?", answer: "A two-dimensional layout system for web pages" },
        { question: "What is JSON?", answer: "JavaScript Object Notation - a data interchange format" },
        { question: "What is Git?", answer: "A distributed version control system" },
        { question: "What is a branch in Git?", answer: "A parallel version of a repository" },
        { question: "What is npm?", answer: "Node Package Manager - package manager for JavaScript" },
        { question: "What is React?", answer: "A JavaScript library for building user interfaces" },
        { question: "What is a component in React?", answer: "A reusable piece of UI code" },
        { question: "What is state in React?", answer: "Data that can change over time in a component" }
    ];
    state.flashcards = state.flashcards.map(card => initializeCardProgress(card));
    saveFlashcardsToStorage(state.flashcards);
} else {
    state.flashcards = state.flashcards.map(card => {
        if (!card.progress) return initializeCardProgress(card);
        return card;
    });
    saveFlashcardsToStorage(state.flashcards);
}

// Initial Render
Game.initializeDueCards();
Game.showCurrentCard();
UI.setProgressSpacing(false);
UI.updateOrientationLock();

// Event Listeners
window.addEventListener("resize", UI.updateOrientationLock);
window.addEventListener("orientationchange", UI.updateOrientationLock);
window.addEventListener("deviceorientation", Game.handleTilt);

// Interaction Buttons
if (UI.elements.flipButton) UI.elements.flipButton.addEventListener("click", Game.flipCard);
if (UI.elements.knowButton) UI.elements.knowButton.addEventListener("click", Game.markKnown);
if (UI.elements.dontKnowButton) UI.elements.dontKnowButton.addEventListener("click", Game.markUnknown);

// Permissions & Overlays
if (UI.elements.welcomeContinueBtn) {
    UI.elements.welcomeContinueBtn.addEventListener("click", () => {
        if (isMobileDevice()) {
            UI.showPermissionOverlay();
        } else {
            state.hasPermission = false;
            UI.showInstructionsOverlay(false);
        }
    });
}

if (UI.elements.requestPermissionBtn) {
    UI.elements.requestPermissionBtn.addEventListener("click", async () => {
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const permissionState = await DeviceOrientationEvent.requestPermission();
                if (permissionState === 'granted') {
                    state.hasPermission = true;
                    UI.showInstructionsOverlay(true);
                } else {
                    alert("Permission denied. The app requires orientation sensors to work.");
                }
            } catch (e) {
                console.error(e);
            }
        } else {
            // Non-iOS 13+ devices
            state.hasPermission = true;
            UI.showInstructionsOverlay(true);
        }
    });
}

if (UI.elements.skipPermissionBtn) {
    UI.elements.skipPermissionBtn.addEventListener("click", (e) => {
        e.preventDefault();
        state.hasPermission = false;
        UI.showInstructionsOverlay(false); // No gesture support mode
    });
}

if (UI.elements.gotItBtn) {
    UI.elements.gotItBtn.addEventListener("click", () => {
        UI.closeOverlay();
        UI.activateMainStage();
    });
}

// Start Game Loop
requestAnimationFrame(Game.gameLoop);
UI.showWelcomeOverlay(); // Trigger initial flow
