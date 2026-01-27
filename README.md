# Gyro Cards - Flashcards with Motion Control

A modern, interactive flashcard application that leverages device orientation sensors to create a unique learning experience.

## Key Features

*   **Dual Control Modes**:
    *   **Gesture Controls**: Use device motion to interact (Mobile).
        *   **Tilt Forward**: Hold to reveal.
        *   **Tilt Right/Left**: Rate card as Known/Unknown.
    *   **Button Controls**: Fallback interface for desktop or when sensors are disabled.
*   **Spaced Repetition System (SRS)**: Implements the **SM-2 Algorithm** to schedule reviews based on performance, optimizing long-term retention.
*   **Interactive UI**: 3D card flips, dynamic progress bars, and smooth animations powered by a custom game loop.
*   **Responsive Design**: Fully responsive layout that adapts to mobile and desktop experiences.
*   **Offline Capable**: Persists progress and decks using LocalStorage.

## Technical Sophistication

### 1. Modular Architecture
Refactored into ES6 modules for maintainability:
- **`js/srs.js`**: Pure logic for the SM-2 algorithm.
- **`js/game.js`**: Game loop and sensor handling.
- **`js/ui.js`**: DOM manipulation and overlay management.
- **`js/state.js`**: Centralized application state.

### 2. Device Orientation API
The app accesses the device's gyroscope and accelerometer data (`deviceorientation` event) to detect tilt angles (gamma and beta). This raw sensor data is processed to drive the user interaction model.

### 3. Custom Game Loop
To ensure silky-smooth 60fps animations regardless of the sensor update rate, the app decouples input handling from rendering.
*   **Input**: Sensor events update state variables (`currentTilt`, `currentForwardTilt`).
*   **Rendering**: A `requestAnimationFrame` loop (`gameLoop`) reads these states to update the UI, manage the hold-to-reveal progress bar, and handle gestures fluidly.

## Project Structure

*   `index.html`: Semantic HTML5 structure.
*   `css/`: Modular stylesheets (`main.css`, `cards.css`, `overlays.css`, etc).
*   `js/`: ES6 Javascript modules (`main.js`, `game.js`, `srs.js`, etc).

## How to Use

1.  **Open the App**: Best experienced on a mobile device for motion controls.
2.  **Grant Permissions**: On first load, approve access to device motion sensors.
    *   *If denied/skipped*: The app switches to **Button Mode** (Click to reveal/rate).
3.  **Learn**:
    *   **Study**: Read the question on the card.
    *   **Reveal**: Tilt the device **forward** (or click Reveal).
    *   **Rate**: Tilt **right** (Known) or **left** (Unknown).
4.  **Track Progress**: Open the "Stats" drawer to view your mastery level and review schedule.

## Development

**Important**: Because this project uses ES6 Modules, you cannot open `index.html` directly from the file system. You must use a local server or visit the site at https://henrischroder.github.io.

```bash
npx serve .
# or
python3 -m http.server
```