# VoxTask AI

A voice-powered expense and task tracker that converts natural speech into useful actions using AI.

## Features

- Voice commands using Web Speech API
- AI-powered command understanding using Gemini
- Expense tracking with amount and category
- Task creation with due dates
- Mark tasks as completed
- Delete expenses and tasks
- Voice confirmations using SpeechSynthesis
- MongoDB data storage
- Command history and replay

## Tech Stack

- Frontend: React, Vite, CSS
- Backend: Node.js, Express.js
- Database: MongoDB Atlas
- AI: Google Gemini API
- Voice Input: Web Speech API
- Voice Output: SpeechSynthesis API

## Project Structure

```text
voxtask-ai/
├── client/
├── server/
│   ├── models/
│   ├── routes/
│   ├── .env
│   └── server.js
├── .gitignore
└── README.md
```

## Setup

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd voxtask-ai
```

### 2. Start the backend

```bash
cd server
npm install
```

Create a `.env` file:

```env
PORT=5001
MONGO_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
```

Start the backend:

```bash
npm run dev
```

### 3. Start the frontend

Open another terminal:

```bash
cd client
npm install
npm run dev
```

Open the local URL shown by Vite.

## How It Works

1. The user speaks a command.
2. Speech recognition converts it into text.
3. Gemini identifies the user's intent and extracts relevant information.
4. The backend performs the requested action and stores the record in MongoDB.
5. The dashboard displays the updated record.
6. The application provides a spoken confirmation.

## Security

API keys and database credentials must be stored in environment variables and must not be committed to GitHub.