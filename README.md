# Gyro Cards - Flashcards with Motion Control

A modern, interactive flashcard application that leverages device orientation sensors to create a unique learning experience.

## 🚀 Key Features

*   **Motion Controls**:
    *   **Tilt Forward**: Hold to reveal the answer (prevents accidental reveals).
    *   **Tilt Right**: Mark card as "Known".
    *   **Tilt Left**: Mark card as "Unknown".
*   **Spaced Repetition System (SRS)**: Implements the **SM-2 Algorithm** to schedule reviews based on performance, optimizing long-term retention.
*   **Interactive UI**: 3D card flips, dynamic progress bars, and smooth animations powered by a custom game loop.
*   **Responsive Design**: Fully responsive layout that adapts to mobile and desktop experiences.
*   **Offline Capable**: Persists progress and decks using LocalStorage.

## 🛠 Technical Sophistication

### 1. Device Orientation API
The app accesses the device's gyroscope and accelerometer data (`deviceorientation` event) to detect tilt angles (gamma and beta). This raw sensor data is processed to drive the user interaction model.

### 2. Custom Game Loop
To ensure silky-smooth 60fps animations regardless of the sensor update rate, the app decouples input handling from rendering.
*   **Input**: Sensor events update state variables (`currentTilt`, `currentForwardTilt`).
*   **Rendering**: A `requestAnimationFrame` loop (`gameLoop`) reads these states to update the UI, manage the hold-to-reveal progress bar, and handle gestures fluidly.

### 3. Spaced Repetition Algorithm
The app implements a variation of the SuperMemo-2 (SM-2) algorithm:
*   Tracks `easeFactor`, `interval`, and `repetitions` for each card.
*   Calculates the `nextReviewDate` based on user feedback (Easy/Normal/Hard).
*   Dynamically adjusts the difficulty of cards over time.

## 📦 Project Structure

*   `index.html`: Semantic HTML5 structure with Bootstrap integration.
*   `style.css`: Custom CSS variables, 3D transforms, animation keyframes, and glassmorphism effects.
*   `script.js`: Core logic containing the Game Loop, SRS algorithm, event handling, and UI state management.

## 📱 How to Use

1.  **Open the App**: Best experienced on a mobile device for motion controls.
2.  **Grant Permissions**: On first load, approve access to device motion sensors.
3.  **Learn**:
    *   **Study**: Read the question on the card.
    *   **Reveal**: Tilt the device **forward** and hold until the blue bar fills up.
    *   **Rate**: Tilt **right** if you knew it, or **left** if you didn't.
4.  **Track Progress**: Open the "Stats" drawer to view your mastery level and review schedule.

## 💻 Development

No build step required! This is a vanilla web project using modern standards.
Simply serve the files using any static file server:
```bash
npx serve .
```