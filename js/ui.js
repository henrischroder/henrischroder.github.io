import { wrapTextInChars, resetCharSpans, isMobileDevice } from './utils.js';

export const elements = {
    card: document.getElementById("card"),
    cardText: document.getElementById("card-text"),
    cardAnswer: document.getElementById("card-answer"),
    cardQuestionBack: document.getElementById("card-question-back"),
    flipButton: document.getElementById("flipButton"),
    knowButton: document.getElementById("knowButton"),
    dontKnowButton: document.getElementById("dontKnowButton"),
    buttonContainer: document.querySelector('.mt-3.d-flex'),
    edgeGlow: document.getElementById("edgeGlow"),
    cardLabels: document.querySelectorAll('.card-label'),
    orientationOverlay: document.getElementById("orientationOverlay"),
    progressIndicator: document.getElementById("progressIndicator"),
    tiltInstructions: document.getElementById("tiltInstructions"),
    revealProgressBar: document.getElementById("revealProgressBar"),

    // Overlays
    permissionOverlay: document.getElementById("permissionOverlay"),
    welcomePage: document.getElementById("welcomePage"),
    permissionPage: document.getElementById("permissionPage"),
    instructionsPage: document.getElementById("instructionsPage"),
    welcomeContinueBtn: document.getElementById("welcomeContinueBtn"),
    requestPermissionBtn: document.getElementById("requestPermissionBtn"),
    skipPermissionBtn: document.getElementById("skipPermissionBtn"),
    gotItBtn: document.getElementById("gotItBtn"),
    gestureInstructions: document.getElementById("gestureInstructions"),
    buttonInstructions: document.getElementById("buttonInstructions"),

    // Stats
    dueTodayCount: document.getElementById("dueTodayCount"),
    easyCount: document.getElementById("easyCount"),
    normalCount: document.getElementById("normalCount"),
    hardCount: document.getElementById("hardCount"),

    // Drawer
    drawer: document.getElementById("drawer"),
    statsDrawer: document.getElementById("statsDrawer"),
    drawerBackdrop: document.getElementById("drawerBackdrop")
};

export function adjustTextSize(element) {
    if (!element) return;
    element.style.fontSize = '';

    const text = element.innerText;
    const wordCount = text.split(/\s+/).length;
    const charCount = text.length;

    let fontSize = 1.5;
    if (charCount > 200 || wordCount > 30) fontSize = 0.875;
    else if (charCount > 100 || wordCount > 20) fontSize = 1.0;
    else if (charCount > 50 || wordCount > 10) fontSize = 1.25;

    element.style.fontSize = `${fontSize}rem`;

    setTimeout(() => {
        const scrollHeight = element.scrollHeight;
        const clientHeight = element.clientHeight;
        if (scrollHeight > clientHeight && fontSize > 0.75) {
            fontSize = Math.max(0.75, fontSize - 0.125);
            element.style.fontSize = `${fontSize}rem`;
        }
    }, 10);
}

export function updateButtonGap() {
    const revealVisible = !elements.flipButton.disabled;
    const thumbsVisible = elements.knowButton.classList.contains('show') || elements.dontKnowButton.classList.contains('show');

    let visibleCount = 0;
    if (revealVisible) visibleCount++;
    if (thumbsVisible) visibleCount += 2;

    if (visibleCount > 1) elements.buttonContainer.classList.add('gap-2');
    else elements.buttonContainer.classList.remove('gap-2');
}

export function showActionButtons() {
    elements.knowButton.classList.add('show');
    elements.dontKnowButton.classList.add('show');
    updateButtonGap();
}

export function hideActionButtons() {
    elements.knowButton.classList.remove('show');
    elements.dontKnowButton.classList.remove('show');
    updateButtonGap();
}

export function setProgressSpacing(isCompact) {
    if (!elements.progressIndicator) return;
    elements.progressIndicator.style.marginTop = isCompact ? '0.5rem' : '1.5rem';
    elements.progressIndicator.classList.toggle('compact', isCompact);
}

export function updateProgressIndicator(stats) {
    if (elements.dueTodayCount) elements.dueTodayCount.textContent = stats.dueToday;
    if (elements.easyCount) elements.easyCount.textContent = `${stats.easy} Easy`;
    if (elements.normalCount) elements.normalCount.textContent = `${stats.normal} Normal`;
    if (elements.hardCount) elements.hardCount.textContent = `${stats.hard} Hard`;
}

export function updateOrientationLock() {
    if (!elements.orientationOverlay) return;
    const isLandscape = window.innerWidth > window.innerHeight;
    const shouldLock = isMobileDevice() && isLandscape;
    elements.orientationOverlay.classList.toggle("show", shouldLock);
    elements.orientationOverlay.setAttribute("aria-hidden", shouldLock ? "false" : "true");
    document.body.classList.toggle("orientation-locked", shouldLock);
}

export function showCompletionMessage() {
    const completionHtml = '<i class="bi bi-check-circle-fill text-success" style="font-size: 3rem; display: block; margin-bottom: 1rem;"></i>All Cards done for today!';
    elements.cardText.innerHTML = completionHtml;
    elements.cardAnswer.innerHTML = completionHtml;
    elements.cardQuestionBack.innerText = "";
    elements.cardLabels.forEach(label => label.style.display = 'none');
    elements.flipButton.disabled = true;
    hideActionButtons();
    updateButtonGap();
}

export function renderCard(card) {
    elements.cardText.innerText = card.question;
    elements.cardAnswer.innerText = card.answer;
    elements.cardQuestionBack.innerText = card.question;
    adjustTextSize(elements.cardText);
    adjustTextSize(elements.cardAnswer);
    elements.cardLabels.forEach(label => label.style.display = '');
    elements.card.classList.remove("flipped");
    elements.flipButton.disabled = false;
    hideActionButtons();
    updateButtonGap();
}

export function activateMainStage() {
    requestAnimationFrame(() => {
        document.body.classList.add("app-ready");
    });
}

// Overlay Functions
export function showWelcomeOverlay() {
    elements.welcomePage.style.display = "block";
    elements.welcomePage.classList.remove("hide");
    elements.permissionPage.style.display = "none";
    elements.instructionsPage.style.display = "none";
    elements.instructionsPage.classList.remove("showing");
    elements.permissionOverlay.classList.add("show");
    requestAnimationFrame(() => wrapTextInChars(elements.welcomePage));
}

export function showPermissionOverlay() {
    if (elements.welcomePage.style.display !== "none") {
        elements.welcomePage.style.display = "none";
        elements.welcomePage.classList.remove("hide");
        resetCharSpans(elements.welcomePage);
    }
    elements.instructionsPage.classList.remove("showing");
    elements.permissionPage.style.display = "block";
    elements.permissionPage.classList.remove("hide");
    elements.instructionsPage.style.display = "none";
    elements.permissionOverlay.classList.add("show");
    requestAnimationFrame(() => wrapTextInChars(elements.permissionPage));
}

export function showInstructionsOverlay(hasGestureSupport) {
    if (elements.welcomePage.style.display !== "none") {
        elements.welcomePage.style.display = "none";
        elements.welcomePage.classList.remove("hide");
        resetCharSpans(elements.welcomePage);
    }
    if (elements.permissionPage.style.display !== "none") {
        elements.permissionPage.style.display = "none";
        elements.permissionPage.classList.remove("hide");
        resetCharSpans(elements.permissionPage);
    }
    elements.instructionsPage.style.display = "block";
    elements.instructionsPage.classList.remove("hide");
    elements.instructionsPage.classList.remove("showing");
    resetCharSpans(elements.instructionsPage);

    if (hasGestureSupport) {
        elements.gestureInstructions.style.display = "block";
        elements.buttonInstructions.style.display = "none";
    } else {
        elements.gestureInstructions.style.display = "none";
        elements.buttonInstructions.style.display = "block";
    }

    elements.permissionOverlay.classList.add("show");
    applyInstructionDelays();

    requestAnimationFrame(() => {
        elements.instructionsPage.classList.add("showing");
        wrapTextInChars(elements.instructionsPage);
    });
}

function applyInstructionDelays() {
    if (!elements.instructionsPage) return;
    const animatedElements = elements.instructionsPage.querySelectorAll('.instructions-content > *, #gotItBtn');
    animatedElements.forEach((el, index) => {
        el.style.setProperty('--instruction-delay', `${0.12 + index * 0.08}s`);
    });
}

export function closeOverlay() {
    elements.permissionOverlay.classList.add("fade-out");
    elements.permissionOverlay.classList.remove("show");
    setTimeout(() => {
        elements.permissionOverlay.style.display = "none";
        elements.permissionOverlay.classList.remove("fade-out");
    }, 400);
}
