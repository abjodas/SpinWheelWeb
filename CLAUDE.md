# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React-based spin wheel application called "Fortune Spin Wheel" built with Create React App. The application simulates a gambling/lottery wheel with location-based slot distributions and weighted probability outcomes.

### Core Architecture

- **Single Component App**: The main functionality is contained in `SpinWheel` component in `src/App.js`
- **State Management**: Uses React hooks (`useState`, `useRef`) for local state management
- **Location-Based System**: Different locations have different slot distributions affecting win probabilities
- **Audio/Visual Effects**: Includes Web Audio API sound generation, CSS animations, and confetti effects

### Key Features

- 8-segment spinning wheel with weighted probability based on location
- 6 predefined locations with different slot distributions
- Real-time slot depletion (slots decrease when numbers are won)
- Audio feedback (spinning and winning sounds)
- Confetti animation on wins
- Responsive design with gradient backgrounds and particle effects

## Development Commands

Based on the Create React App setup:

```bash
# Start development server (runs on localhost:3000)
npm start

# Run tests in watch mode
npm test

# Build for production
npm run build

# Eject from Create React App (irreversible)
npm run eject
```

## Technical Details

### Dependencies
- React 19.1.1
- Testing Library suite for unit/integration testing
- No external UI libraries or state management (vanilla React)

### Code Structure
- `src/App.js`: Main SpinWheel component with all functionality
- `src/index.js`: Standard React app entry point
- `public/index.html`: Basic HTML template with React root div

### Styling Approach
- Inline styles with JavaScript objects
- Embedded CSS-in-JS for animations and dynamic styles
- CSS animations defined in `<style>` tag within component
- No external CSS frameworks

### State Management Pattern
- Location data stored in component state (allows runtime updates)
- Wheel rotation tracked with rotation degrees
- Spinning state prevents multiple concurrent spins
- Result state manages win display

The app uses a weighted random number generator that pulls from location-specific slot arrays to determine outcomes, with visual/audio feedback through Web APIs.