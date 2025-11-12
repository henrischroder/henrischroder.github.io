// Load flashcards from local storage or use default
let flashcards = loadFlashcardsFromStorage();

// Default cards if storage is empty
if (flashcards.length === 0) {
  flashcards = [
    { question: "What is HTML?", answer: "HyperText Markup Language" },
    { question: "How to declare a variable in JS?", answer: "let or const" },
    { question: "CSS stands for…", answer: "Cascading Style Sheets" },
    { question: "What does DOM stand for?", answer: "Document Object Model" },
    { question: "What is a closure in JavaScript?", answer: "A function that has access to variables in its outer scope" },
    { question: "What is the difference between == and === in JavaScript?", answer: "== compares values with type coercion, === compares values and types" },
    { question: "What is a promise in JavaScript?", answer: "An object representing the eventual completion or failure of an async operation" },
    { question: "What is async/await?", answer: "Syntax for handling asynchronous operations in JavaScript" },
    { question: "What is the box model in CSS?", answer: "Content, padding, border, and margin" },
    { question: "What is flexbox?", answer: "A CSS layout method for arranging items in a container" },
    { question: "What is grid in CSS?", answer: "A two-dimensional layout system for web pages" },
    { question: "What is a REST API?", answer: "Representational State Transfer - an architectural style for web services" },
    { question: "What is JSON?", answer: "JavaScript Object Notation - a data interchange format" },
    { question: "What is Git?", answer: "A distributed version control system" },
    { question: "What is a branch in Git?", answer: "A parallel version of a repository" },
    { question: "What is npm?", answer: "Node Package Manager - package manager for JavaScript" },
    { question: "What is React?", answer: "A JavaScript library for building user interfaces" },
    { question: "What is a component in React?", answer: "A reusable piece of UI code" },
    { question: "What is state in React?", answer: "Data that can change over time in a component" },
    { question: "What is useEffect in React?", answer: "A hook for performing side effects in functional components" }
  ];
  // Initialize progress data for default cards
  flashcards = flashcards.map(card => initializeCardProgress(card));
  saveFlashcardsToStorage();
} else {
  // Ensure all cards have progress data
  flashcards = flashcards.map(card => {
    if (!card.progress) {
      return initializeCardProgress(card);
    }
    return card;
  });
  saveFlashcardsToStorage();
}

// Local Storage Functions
function loadFlashcardsFromStorage() {
  try {
    const stored = localStorage.getItem('gyroCards');
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Error loading flashcards from storage:', e);
    return [];
  }
}

function saveFlashcardsToStorage() {
  try {
    localStorage.setItem('gyroCards', JSON.stringify(flashcards));
  } catch (e) {
    console.error('Error saving flashcards to storage:', e);
  }
}

// Spaced Repetition System (SM-2 Algorithm)
function initializeCardProgress(card) {
  return {
    ...card,
    progress: {
      easeFactor: 2.5, // Starting ease factor
      interval: 0, // Days until next review
      repetitions: 0, // Number of successful reviews
      nextReviewDate: new Date().toISOString(), // Available for review today
      lastReviewDate: null,
      difficulty: 'normal', // 'easy', 'normal', 'hard'
      totalReviews: 0,
      correctReviews: 0
    }
  };
}

// Get cards due for review today
function getCardsDueForReview() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return flashcards.filter(card => {
    if (!card.progress) return true; // New cards are always due
    const nextReview = new Date(card.progress.nextReviewDate);
    nextReview.setHours(0, 0, 0, 0);
    return nextReview <= today;
  });
}

// Update card progress based on answer quality
function updateCardProgress(cardIndex, quality) {
  // quality: 0 = wrong, 1 = hard, 2 = normal, 3 = easy
  const card = flashcards[cardIndex];
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
  
  saveFlashcardsToStorage();
}

// Get progress statistics
function getProgressStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dueCards = getCardsDueForReview();
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

let currentIndex = 0;
let dueCards = [];
  const card = document.getElementById("card");
  const cardText = document.getElementById("card-text");
  const cardAnswer = document.getElementById("card-answer");
  const cardQuestionBack = document.getElementById("card-question-back");
  const flipButton = document.getElementById("flipButton");
  const knowButton = document.getElementById("knowButton");
  const dontKnowButton = document.getElementById("dontKnowButton");
  const buttonContainer = document.querySelector('.mt-3.d-flex');
  const edgeGlow = document.getElementById("edgeGlow");
  const cardLabels = document.querySelectorAll('.card-label');
  const orientationOverlay = document.getElementById("orientationOverlay");
  const tiltInstructions = document.getElementById("tiltInstructions");
  let mainStageActivated = false;
  let isShowingAnswer = false;
  let isAnimating = false;
  let isCardFlipped = false;
  
  // Initialize due cards
  function initializeDueCards(resetIndex = true) {
    const oldLength = dueCards.length;
    dueCards = getCardsDueForReview();
    if (resetIndex || oldLength === 0) {
      currentIndex = 0;
    } else if (currentIndex >= dueCards.length) {
      // If index is out of bounds, reset to 0
      currentIndex = 0;
    }
    updateProgressIndicator();
  }
  
  // Karte anzeigen
  function showCard() {
    // Check if there are no cards due or if we've gone past the last card
    if (dueCards.length === 0 || currentIndex >= dueCards.length) {
      // Refresh due cards one more time to make sure we're not missing any
      initializeDueCards();
      if (dueCards.length === 0) {
        cardText.innerText = "🎉 All Cards done for today!";
        cardAnswer.innerText = "🎉 All Cards done for today!";
        cardQuestionBack.innerText = "";
        // Hide labels for completion message
        cardLabels.forEach(label => {
          label.style.display = 'none';
        });
        // Hide reveal button and action buttons
        flipButton.disabled = true;
        hideActionButtons();
        updateButtonGap();
        updateProgressIndicator();
        return;
      }
      // If there are cards after refresh, reset index and show the first one
      currentIndex = 0;
    }
    isShowingAnswer = false;
    isCardFlipped = false;
    const currentCard = dueCards[currentIndex];
    cardText.innerText = currentCard.question;
    cardAnswer.innerText = currentCard.answer;
    cardQuestionBack.innerText = currentCard.question;
    // Adjust font size to fit text
    adjustTextSize(cardText);
    adjustTextSize(cardAnswer);
    // Show labels for regular cards
    cardLabels.forEach(label => {
      label.style.display = '';
    });
    card.classList.remove("flipped");
    flipButton.disabled = false;
    hideActionButtons();
    updateButtonGap();
    updateProgressIndicator();
  }
  
  // Adjust text size to fit within card
  function adjustTextSize(element) {
    if (!element) return;
    
    // Reset to default size
    element.style.fontSize = '';
    
    // Get card dimensions
    const card = document.getElementById('card');
    const cardWidth = card.offsetWidth;
    const cardHeight = card.offsetHeight;
    const maxWidth = cardWidth - 40; // Account for padding
    const maxHeight = cardHeight * 0.5; // Use about half the card height for text
    
    // Measure text
    const text = element.innerText;
    const wordCount = text.split(/\s+/).length;
    const charCount = text.length;
    
    // Calculate appropriate font size based on text length
    let fontSize = 1.5; // Default in rem
    
    if (charCount > 200 || wordCount > 30) {
      fontSize = 0.875; // Very long text
    } else if (charCount > 100 || wordCount > 20) {
      fontSize = 1.0; // Long text
    } else if (charCount > 50 || wordCount > 10) {
      fontSize = 1.25; // Medium text
    }
    
    // Apply font size
    element.style.fontSize = `${fontSize}rem`;
    
    // Fine-tune if text still overflows
    setTimeout(() => {
      const scrollHeight = element.scrollHeight;
      const clientHeight = element.clientHeight;
      
      if (scrollHeight > clientHeight && fontSize > 0.75) {
        // Reduce font size if text overflows
        fontSize = Math.max(0.75, fontSize - 0.125);
        element.style.fontSize = `${fontSize}rem`;
      }
    }, 10);
  }
  
  // Update progress indicator
  function updateProgressIndicator() {
    const stats = getProgressStats();
    const dueTodayCount = document.getElementById("dueTodayCount");
    const easyCount = document.getElementById("easyCount");
    const normalCount = document.getElementById("normalCount");
    const hardCount = document.getElementById("hardCount");
    
    if (dueTodayCount) dueTodayCount.textContent = stats.dueToday;
    if (easyCount) easyCount.textContent = `${stats.easy} Easy`;
    if (normalCount) normalCount.textContent = `${stats.normal} Normal`;
    if (hardCount) hardCount.textContent = `${stats.hard} Hard`;
  }
  
  // Initialize on load
  initializeDueCards();
  showCard();
  updateOrientationLock();
  window.addEventListener("resize", updateOrientationLock);
  window.addEventListener("orientationchange", updateOrientationLock);
  
  // Update button container gap based on visible buttons
  function updateButtonGap() {
    const revealVisible = !flipButton.disabled;
    const thumbsVisible = knowButton.classList.contains('show') || dontKnowButton.classList.contains('show');
    
    // Count visible buttons
    let visibleCount = 0;
    if (revealVisible) visibleCount++;
    if (thumbsVisible) visibleCount += 2;
    
    // Only add gap if there are multiple visible buttons
    if (visibleCount > 1) {
      buttonContainer.classList.add('gap-2');
    } else {
      buttonContainer.classList.remove('gap-2');
    }
  }
  
  // Show action buttons (thumbs up/down)
  function showActionButtons() {
    knowButton.classList.add('show');
    dontKnowButton.classList.add('show');
    updateButtonGap();
  }
  
  // Hide action buttons
  function hideActionButtons() {
    knowButton.classList.remove('show');
    dontKnowButton.classList.remove('show');
    updateButtonGap();
  }
  
  // Funktion, die auf Rotation reagiert
  function handleTilt(event) {
    if (isAnimating) return;
    
    const tilt = event.gamma; // -90 bis +90 (links/rechts)
    const forwardTilt = typeof event.beta === "number" ? event.beta : null; // -180 bis 180 (vor/zurück)

    if (!isCardFlipped && forwardTilt !== null && forwardTilt > 25) {
      flipCard();
      return;
    }
  
    // Karte leicht mit kippen lassen (works on both front and back)
    // Always apply tilt rotation regardless of flip state
    if (tilt !== null && tilt !== undefined) {
      const tiltRotation = tilt / 3;
      // Update CSS variable - this will be used by the CSS transform
      card.style.setProperty("--tilt-rotation", `${tiltRotation}deg`);
    }
  
    // Gesture actions only work when card is flipped
    if (isCardFlipped) {
      if (tilt > 30) {
        // Gut gekonnt → nächste Karte
        markKnown();
      }
  
      if (tilt < -30) {
        // Nicht gekonnt → Karte ans Ende setzen
        markUnknown();
      }
    }

  }

  function activateMainStage() {
    if (mainStageActivated) return;
    mainStageActivated = true;
    requestAnimationFrame(() => {
      document.body.classList.add("app-ready");
    });
  }
  
  function isMobileDevice() {
    return window.matchMedia("(max-width: 768px)").matches || /Mobi|Android/i.test(navigator.userAgent);
  }

  function updateOrientationLock() {
    if (!orientationOverlay) return;

    const isLandscape = window.innerWidth > window.innerHeight;
    const shouldLock = isMobileDevice() && isLandscape;

    orientationOverlay.classList.toggle("show", shouldLock);
    orientationOverlay.setAttribute("aria-hidden", shouldLock ? "false" : "true");
    document.body.classList.toggle("orientation-locked", shouldLock);
  }

  function nextCard() {
    // Refresh due cards first to get the latest count, but don't reset index
    initializeDueCards(false);
    
    if (dueCards.length === 0) {
      showCard();
      return;
    }
    
    // Only increment if we haven't reached the end
    if (currentIndex < dueCards.length - 1) {
      currentIndex++;
    } else {
      // We're at the last card, wrap around to the beginning
      currentIndex = 0;
    }
    
    showCard();
    // Add fade-in animation for new card
    card.classList.add('fade-in');
    setTimeout(() => {
      card.classList.remove('fade-in');
    }, 500);
  }
  
  // Karte umdrehen (Frage/Antwort toggeln)
  function flipCard() {
    if (currentIndex >= dueCards.length || isCardFlipped) return;
    
    isShowingAnswer = true;
    isCardFlipped = true;
    card.classList.add("flipped");
    
    // Disable flip button and show action buttons
    flipButton.disabled = true;
    showActionButtons();
  }
  
  // Markierungen für Desktop-Tests
  function markKnown() {
    // entspricht: tilt > 30
    if (currentIndex >= dueCards.length || isAnimating || !isCardFlipped) return;
    
    const currentCard = dueCards[currentIndex];
    const cardIndex = flashcards.findIndex(c => c.question === currentCard.question && c.answer === currentCard.answer);
    
    if (cardIndex !== -1) {
      // Update progress - quality 2 = normal (correct answer)
      updateCardProgress(cardIndex, 2);
    }
    
    isAnimating = true;
    hideActionButtons();
    
    // Add green edge glow animation
    edgeGlow.classList.remove('glow-red', 'glow-green');
    edgeGlow.classList.add('glow-green');
    setTimeout(() => {
      edgeGlow.classList.remove('glow-green');
    }, 1000);
    
    // Slide card out to the right
    card.classList.add('slide-out-right');
    setTimeout(() => {
      card.classList.remove('slide-out-right');
      // Refresh due cards list first (this will remove the card if it's no longer due)
      initializeDueCards(false);
      // If we're past the end after refresh, reset to 0
      if (currentIndex >= dueCards.length && dueCards.length > 0) {
        currentIndex = 0;
      } else if (currentIndex >= dueCards.length) {
        // No cards left, index will be handled by showCard()
        currentIndex = 0;
      }
      updateProgressIndicator();
      // Show the card at current index (or completion message if no cards)
      showCard();
      // Add fade-in animation for new card
      card.classList.add('fade-in');
      setTimeout(() => {
        card.classList.remove('fade-in');
      }, 500);
      isAnimating = false;
    }, 600);
  }
  
  function markUnknown() {
    // entspricht: tilt < -30
    if (currentIndex >= dueCards.length || isAnimating || !isCardFlipped) return;
    
    const currentCard = dueCards[currentIndex];
    const cardIndex = flashcards.findIndex(c => c.question === currentCard.question && c.answer === currentCard.answer);
    
    if (cardIndex !== -1) {
      // Update progress - quality 0 = wrong answer
      updateCardProgress(cardIndex, 0);
    }
    
    isAnimating = true;
    hideActionButtons();
    
    // Add red edge glow animation
    edgeGlow.classList.remove('glow-red', 'glow-green');
    edgeGlow.classList.add('glow-red');
    setTimeout(() => {
      edgeGlow.classList.remove('glow-red');
    }, 1000);
    
    // Slide card out to the left
    card.classList.add('slide-out-left');
    
    // After animation completes, show next card
    setTimeout(() => {
      card.classList.remove('slide-out-left');
      // Card stays in due cards (will be reviewed again today)
      currentIndex++;
      if (currentIndex >= dueCards.length) {
        currentIndex = 0;
      }
      updateProgressIndicator();
      nextCard();
      isAnimating = false;
    }, 600);
  }
  
  // Dev-Buttons (temporär)
  if (flipButton) flipButton.addEventListener("click", flipCard);
  if (knowButton) knowButton.addEventListener("click", markKnown);
  if (dontKnowButton) dontKnowButton.addEventListener("click", markUnknown);
  
  // Permission Overlay Elements
  const permissionOverlay = document.getElementById("permissionOverlay");
  const welcomePage = document.getElementById("welcomePage");
  const permissionPage = document.getElementById("permissionPage");
  const instructionsPage = document.getElementById("instructionsPage");
  const welcomeContinueBtn = document.getElementById("welcomeContinueBtn");
  const requestPermissionBtn = document.getElementById("requestPermissionBtn");
  const skipPermissionBtn = document.getElementById("skipPermissionBtn");
  const gotItBtn = document.getElementById("gotItBtn");
  const gestureInstructions = document.getElementById("gestureInstructions");
  const buttonInstructions = document.getElementById("buttonInstructions");
  
  let hasPermission = false;
  
  // Check if permission is needed and show overlay on page load
  function checkPermissionAndShowOverlay() {
    // Always show welcome page first (on both mobile and desktop)
    showWelcomeOverlay();
  }
  
  // Show welcome overlay
  function showWelcomeOverlay() {
    welcomePage.style.display = "block";
    welcomePage.classList.remove("hide");
    permissionPage.style.display = "none";
    instructionsPage.style.display = "none";
    permissionOverlay.classList.add("show");
    
    // Wrap text in character spans after a brief delay to ensure page is visible
    requestAnimationFrame(() => {
      wrapTextInChars(welcomePage);
    });
  }
  
  // Reset character spans (unwrap text) and button styles
  function resetCharSpans(element) {
    if (!element) return;
    const charSpans = element.querySelectorAll('.char');
    charSpans.forEach(span => {
      const parent = span.parentNode;
      if (parent) {
        const text = document.createTextNode(span.textContent);
        parent.replaceChild(text, span);
        parent.normalize(); // Merge adjacent text nodes
      }
    });
    
    // Reset button styles to initial state
    const buttons = element.querySelectorAll('button, a');
    buttons.forEach(button => {
      button.style.opacity = '0';
      button.style.transform = 'translateY(15px)';
      button.style.animation = '';
      button.style.animationDelay = '';
    });
  }
  
  // Wrap text in character spans for staggered animation (handles emojis properly)
  function wrapTextInChars(element) {
    if (!element) return;
    
    // Reset any existing character spans first
    resetCharSpans(element);
    
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          // Skip text nodes inside buttons, links, and strong tags
          const parent = node.parentNode;
          if (parent && (parent.tagName === 'BUTTON' || parent.tagName === 'A' || parent.tagName === 'STRONG')) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      },
      false
    );
    
    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      if (node.textContent.trim()) {
        textNodes.push(node);
      }
    }
    
    let globalCharIndex = 0;
    textNodes.forEach(textNode => {
      const text = textNode.textContent;
      const parent = textNode.parentNode;
      const fragment = document.createDocumentFragment();
      
      // Use spread operator to properly handle emojis and multi-byte characters
      const chars = [...text];
      
      chars.forEach(char => {
        const span = document.createElement('span');
        span.className = 'char';
        span.textContent = char === ' ' ? '\u00A0' : char; // Non-breaking space for spaces
        span.style.animationDelay = `${globalCharIndex * 0.015}s`;
        fragment.appendChild(span);
        globalCharIndex++;
      });
      
      parent.replaceChild(fragment, textNode);
    });
    
    // Animate buttons with staggered delay based on total character count
    const buttons = element.querySelectorAll('button, a');
    buttons.forEach((button, buttonIndex) => {
      // Calculate delay: after all text characters + staggered per button
      const buttonDelay = globalCharIndex * 0.015 + (buttonIndex * 0.1) + 0.2;
      button.style.opacity = '0';
      button.style.transform = 'translateY(15px)';
      button.style.animation = 'buttonFadeIn 0.5s ease-out forwards';
      button.style.animationDelay = `${buttonDelay}s`;
    });
  }
  
  // Show permission overlay
  function showPermissionOverlay() {
    // Hide welcome page
    if (welcomePage.style.display !== "none") {
      welcomePage.style.display = "none";
      welcomePage.classList.remove("hide");
      resetCharSpans(welcomePage);
    }
    
    // Show permission page
    permissionPage.style.display = "block";
    permissionPage.classList.remove("hide");
    instructionsPage.style.display = "none";
    permissionOverlay.classList.add("show");
    
    // Wrap text in character spans after a brief delay to ensure page is visible
    requestAnimationFrame(() => {
      wrapTextInChars(permissionPage);
    });
  }
  
  // Welcome continue button handler
  if (welcomeContinueBtn) {
    welcomeContinueBtn.addEventListener("click", () => {
      // On mobile, show permission request page
      // On desktop, skip permission and go directly to instructions
      if (isMobileDevice()) {
        showPermissionOverlay();
      } else {
        // On desktop, skip permission and show instructions with button controls
        hasPermission = false;
        showInstructionsOverlay(false);
      }
    });
  }
  
  // Show instructions overlay
  function showInstructionsOverlay(hasGestureSupport) {
    // Hide welcome page
    if (welcomePage.style.display !== "none") {
      welcomePage.style.display = "none";
      welcomePage.classList.remove("hide");
      resetCharSpans(welcomePage);
    }
    
    // Hide permission page immediately
    if (permissionPage.style.display !== "none") {
      permissionPage.style.display = "none";
      permissionPage.classList.remove("hide");
      resetCharSpans(permissionPage);
    }
    
    // Show instructions page immediately
    instructionsPage.style.display = "block";
    instructionsPage.classList.remove("hide");
    
    if (hasGestureSupport) {
      gestureInstructions.style.display = "block";
      buttonInstructions.style.display = "none";
    } else {
      gestureInstructions.style.display = "none";
      buttonInstructions.style.display = "block";
    }
    
    permissionOverlay.classList.add("show");
    
    // Wrap text in character spans after a brief delay to ensure page is visible
    requestAnimationFrame(() => {
      wrapTextInChars(instructionsPage);
    });
  }
  
  // Close overlay with fade-out animation
  function closeOverlay() {
    // Add fade-out class to trigger animation
    permissionOverlay.classList.add("fade-out");
    permissionOverlay.classList.remove("show");
    
    // Wait for animation to complete before resetting
    setTimeout(() => {
      welcomePage.classList.remove("hide");
      permissionPage.classList.remove("hide");
      instructionsPage.classList.remove("hide");
      permissionOverlay.classList.remove("fade-out");
      
      // Reset character spans for next time
      resetCharSpans(welcomePage);
      resetCharSpans(permissionPage);
      resetCharSpans(instructionsPage);
      activateMainStage();
    }, 400); // Match the transition duration
  }
  
  // Request permission button handler
  if (requestPermissionBtn) {
    requestPermissionBtn.addEventListener("click", () => {
      // Check if permission is actually needed (iOS)
      if (typeof DeviceOrientationEvent.requestPermission === "function") {
        // iOS - request permission
        DeviceOrientationEvent.requestPermission().then((response) => {
          if (response === "granted") {
            hasPermission = true;
            window.addEventListener("deviceorientation", handleTilt);
            // Show gesture instructions
            showInstructionsOverlay(true);
            // Hide buttons when gesture controls are available
            updateButtonVisibility();
          } else {
            // Permission denied - show button instructions
            hasPermission = false;
            showInstructionsOverlay(false);
            // Show buttons when gesture controls are not available
            updateButtonVisibility();
          }
        });
      } else {
        // PC/Android - no permission needed, check if orientation is available
        if (window.DeviceOrientationEvent) {
          // Can use gestures - show gesture instructions
          hasPermission = true;
          window.addEventListener("deviceorientation", handleTilt);
          showInstructionsOverlay(true);
          // Hide buttons when gesture controls are available
          updateButtonVisibility();
        } else {
          // Can't use gestures - show button instructions
          hasPermission = false;
          showInstructionsOverlay(false);
          // Show buttons when gesture controls are not available
          updateButtonVisibility();
        }
      }
    });
  }
  
  // Skip permission button handler
  if (skipPermissionBtn) {
    skipPermissionBtn.addEventListener("click", (e) => {
      e.preventDefault();
      // Skip permission - show button instructions since gestures won't work
      hasPermission = false;
      showInstructionsOverlay(false);
      // Show buttons when gesture controls are not available
      updateButtonVisibility();
    });
  }
  
  // Got it button handler
  if (gotItBtn) {
    gotItBtn.addEventListener("click", () => {
      closeOverlay();
      // Update button visibility based on permission state
      updateButtonVisibility();
    });
  }
  
  // Function to update button visibility based on permission state
  function updateButtonVisibility() {
    if (hasPermission) {
      // Hide buttons when gesture controls are available
      buttonContainer.style.display = 'none';
      flipButton.style.display = 'none';
      knowButton.style.display = 'none';
      dontKnowButton.style.display = 'none';
      // Show tilt instructions when gesture controls are available
      if (tiltInstructions) {
        tiltInstructions.style.display = 'block';
      }
    } else {
      // Show buttons when gesture controls are not available
      buttonContainer.style.display = 'flex';
      flipButton.style.display = 'block';
      knowButton.style.display = 'block';
      dontKnowButton.style.display = 'block';
      // Hide tilt instructions when button controls are used
      if (tiltInstructions) {
        tiltInstructions.style.display = 'none';
      }
    }
  }
  
  // Check permission on page load
  checkPermissionAndShowOverlay();
  
  // Drawer functionality
  const drawer = document.getElementById("drawer");
  const drawerToggle = document.getElementById("drawerToggle");
  const drawerClose = document.getElementById("drawerClose");
  const drawerBackdrop = document.getElementById("drawerBackdrop");
  const addCardBtn = document.getElementById("addCardBtn");
  const newQuestionInput = document.getElementById("newQuestion");
  const newAnswerInput = document.getElementById("newAnswer");
  const cardsList = document.getElementById("cardsList");
  const cardCount = document.getElementById("cardCount");

  // Open/Close drawer
  function openDrawer() {
    closeStatsDrawer(); // Close stats drawer if open
    drawer.classList.add("open");
    if (drawerBackdrop) {
      drawerBackdrop.style.opacity = "1";
      drawerBackdrop.style.visibility = "visible";
    }
  }

  function closeDrawer() {
    drawer.classList.remove("open");
    if (drawerBackdrop && !statsDrawer.classList.contains("open")) {
      drawerBackdrop.style.opacity = "0";
      drawerBackdrop.style.visibility = "hidden";
    }
  }

  if (drawerToggle) {
    drawerToggle.addEventListener("click", openDrawer);
  }

  if (drawerClose) {
    drawerClose.addEventListener("click", closeDrawer);
  }

  if (drawerBackdrop) {
    drawerBackdrop.addEventListener("click", () => {
      closeDrawer();
      closeStatsDrawer();
    });
  }

  // Render cards list
  function renderCardsList() {
    if (!cardsList) return;
    
    cardsList.innerHTML = "";
    cardCount.textContent = flashcards.length;

    if (flashcards.length === 0) {
      cardsList.innerHTML = '<p class="text-muted text-center">No cards yet. Add your first card above!</p>';
      return;
    }

    flashcards.forEach((card, index) => {
      const cardItem = document.createElement("div");
      cardItem.className = "card-item";
      cardItem.innerHTML = `
        <div class="card-item-content">
          <div class="card-item-question">${escapeHtml(card.question)}</div>
          <div class="card-item-answer">${escapeHtml(card.answer)}</div>
        </div>
        <button class="btn btn-sm btn-outline-danger card-item-remove" data-index="${index}">🗑️</button>
      `;
      cardsList.appendChild(cardItem);
    });

    // Add remove event listeners
    const removeButtons = cardsList.querySelectorAll(".card-item-remove");
    removeButtons.forEach(button => {
      button.addEventListener("click", (e) => {
        const index = parseInt(e.target.closest(".card-item-remove").dataset.index);
        removeCard(index);
      });
    });
  }

  // Escape HTML to prevent XSS
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Add new card
  function addCard() {
    const question = newQuestionInput.value.trim();
    const answer = newAnswerInput.value.trim();

    if (!question || !answer) {
      alert("Please fill in both question and answer!");
      return;
    }

    const newCard = initializeCardProgress({ question, answer });
    flashcards.push(newCard);
    saveFlashcardsToStorage();
    renderCardsList();
    
    // Refresh due cards to include new card
    initializeDueCards();
    updateProgressIndicator();

    // Clear form
    newQuestionInput.value = "";
    newAnswerInput.value = "";

    // Reset to first card if we were at the end
    if (currentIndex >= dueCards.length - 1) {
      currentIndex = 0;
      showCard();
    }
  }

  // Remove card
  function removeCard(index) {
    if (confirm("Are you sure you want to remove this card?")) {
      flashcards.splice(index, 1);
      saveFlashcardsToStorage();
      renderCardsList();
      
      // Refresh due cards
      initializeDueCards();
      updateProgressIndicator();

      // Adjust current index if needed
      if (currentIndex >= dueCards.length) {
        currentIndex = Math.max(0, dueCards.length - 1);
      }
      showCard();
    }
  }

  // Add card button handler
  if (addCardBtn) {
    addCardBtn.addEventListener("click", addCard);
  }

  // Reset stack function
  function resetStack() {
    if (confirm("Are you sure you want to reset all learning progress? This will make all cards due for review again.")) {
      flashcards.forEach(card => {
        card.progress = {
          easeFactor: 2.5,
          interval: 0,
          repetitions: 0,
          nextReviewDate: new Date().toISOString(),
          lastReviewDate: null,
          difficulty: 'normal',
          totalReviews: 0,
          correctReviews: 0
        };
      });
      
      saveFlashcardsToStorage();
      initializeDueCards();
      updateProgressIndicator();
      showCard();
    }
  }

  // Reset stack button handler
  const resetStackBtn = document.getElementById("resetStackBtn");
  if (resetStackBtn) {
    resetStackBtn.addEventListener("click", resetStack);
  }

  // Allow Enter key to add card
  if (newQuestionInput && newAnswerInput) {
    newQuestionInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        newAnswerInput.focus();
      }
    });
    newAnswerInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        addCard();
      }
    });
  }

  // Initial render
  renderCardsList();
  
  // Statistics Drawer
  const statsDrawer = document.getElementById("statsDrawer");
  const statsToggle = document.getElementById("statsToggle");
  const statsClose = document.getElementById("statsClose");
  const statsContent = document.getElementById("statsContent");

  // Open/Close stats drawer
  function openStatsDrawer() {
    closeDrawer(); // Close cards drawer if open
    statsDrawer.classList.add("open");
    if (drawerBackdrop) {
      drawerBackdrop.style.opacity = "1";
      drawerBackdrop.style.visibility = "visible";
    }
    renderStats();
  }

  function closeStatsDrawer() {
    statsDrawer.classList.remove("open");
    if (drawerBackdrop && !drawer.classList.contains("open")) {
      drawerBackdrop.style.opacity = "0";
      drawerBackdrop.style.visibility = "hidden";
    }
  }

  if (statsToggle) {
    statsToggle.addEventListener("click", openStatsDrawer);
  }

  if (statsClose) {
    statsClose.addEventListener("click", closeStatsDrawer);
  }

  // Render statistics
  function renderStats() {
    if (!statsContent) return;
    
    const stats = getProgressStats();
    const accuracy = stats.totalReviews > 0 
      ? ((stats.correctReviews / stats.totalReviews) * 100).toFixed(1) 
      : 0;
    
    statsContent.innerHTML = `
      <div class="stat-item">
        <div class="stat-label">Total Cards</div>
        <div class="stat-value">${stats.total}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Due Today</div>
        <div class="stat-value">${stats.dueToday}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Mastered</div>
        <div class="stat-value">${stats.mastered}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Total Reviews</div>
        <div class="stat-value">${stats.totalReviews}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Correct Reviews</div>
        <div class="stat-value">${stats.correctReviews}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Accuracy</div>
        <div class="stat-value">${accuracy}%</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Average Ease Factor</div>
        <div class="stat-value">${stats.averageEase}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Difficulty Distribution</div>
        <div style="margin-top: 0.5rem;">
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <span class="badge badge-easy">${stats.easy} Easy</span>
            <span class="badge badge-normal">${stats.normal} Normal</span>
            <span class="badge badge-hard">${stats.hard} Hard</span>
          </div>
        </div>
      </div>
    `;
  }
  
  