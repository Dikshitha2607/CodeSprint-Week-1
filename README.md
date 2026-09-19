# Air Game Pad

Air Game Pad is a full-stack browser gaming platform where a smartphone acts as a wireless controller for games displayed on a computer. It supports real-time room-based play, a quiz generated from uploaded study material, and accessible single-player games.

Frontend: https://air-gamepad.onrender.com/

Backend: https://air-gamepad-backend.onrender.com/

## Problem Statement

Playing local multiplayer games often needs dedicated controllers, extra setup, or a shared device. Air Game Pad makes the phone already in a player's hand into a browser-based controller, while the game remains on a larger shared screen.

## Key Features

- Real-time Socket.IO rooms with phone-controller input for a host display.
- Ping Pong, Tic Tac Toe, Connect 4, Flappy Bird, and a timed quiz game with controller-friendly controls.
- Document-grounded quiz generation for PDF, DOCX, TXT, Markdown, CSV, and JSON uploads.
- Play Again and Exit actions after each game, selectable with left/right controller input.

## Technologies / Tech Stack Used

The frontend is built with React, Vite, Tailwind CSS, Lucide icons, and Socket.IO Client. The backend uses Node.js, Express, Socket.IO, and Python for document extraction and quiz generation; the application is deployed on Render.

## AI Tools Used

The RAG quiz service uses the Groq API with `openai/gpt-oss-20b` to create five grounded multiple-choice questions from locally retrieved document text. Connect 4 also includes a small client-side weighted move-suggestion model that recommends a useful column without requiring a server call.
