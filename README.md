# Chatbox – Real-Time Messaging Platform

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/postgresql-4169e1?style=for-the-badge&logo=postgresql&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101)

Chatbox is a sleek, web-based real-time communication platform built with React, Node.js, and Socket.io. It allows users to seamlessly connect, join servers, create channels, and send direct messages in a modern, highly interactive environment. Basically, it brings communities and friends together through fast, distraction-free messaging and media sharing.

## Features
- **Real-Time Messaging** – Experience instant message delivery using WebSockets.
- **Servers & Channels** – Create dedicated spaces for communities with organized text channels.
- **Direct Messages** – Engage in private, one-on-one conversations seamlessly.
- **File Uploads** – Share images and attachments powered by Cloudinary integration.
- **Authentication** – Secure user registration and login with JWT and bcrypt hashing.
- **Aesthetic UI** – Built with a beautifully structured interface, responsive layout, and modern styling.
- **Data Persistence** – Reliable cloud data storage utilizing a PostgreSQL database.

## Directory Structure
```text
Chatbox/
├── client/
│   ├── public/
│   │   └── favicon.png
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── stores/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── server/
│   ├── database/
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── index.js
│   └── package.json
└── README.md
```

## 🛠️ Technologies Used



- **JavaScript/Node.js** – Core programming language for logic and backend processing.
- **Express.js** – Lightweight web framework used for backend routing and RESTful API handling.
- **React.js & Vite** – For building the lightning-fast, modular user interface.
- **Socket.io** – Powers the robust, low-latency real-time bidirectional communication events.
- **PostgreSQL** – The robust relational database hosted on the cloud (Neon.tech) for data integrity.
- **Cloudinary** – Cloud-based media management for uploading and delivering image attachments.

## Installation

Create a clone or download the repository to your local machine.

**1. Start the Backend:**
Open a terminal in the `server` folder and install dependencies:
```bash
npm install
```
Start the server:
```bash
npm run dev
```
*The backend server will start on port `3000`.*

**2. Start the Frontend:**
Open a new terminal in the `client` folder and install dependencies:
```bash
npm install
```
Run the application:
```bash
npm run dev
```

Open your browser and visit:
`http://localhost:5173`

## Usage
1. Launch the application and register a new account on the authentication screen.
2. Log in with your new credentials to access the main dashboard.
3. Click the "+" icon to create a new Server, or join an existing one if invited.
4. Inside a Server, create specific text Channels for organized topics.
5. Alternatively, use the direct messaging sidebar to start a private conversation.
6. Type your messages in the chat input and click send to instantly deliver them.
7. Use the upload functionality to share images or files seamlessly in any chat.

## Real-Time Architecture
Chatbox uses an event-driven architecture utilizing Socket.io for instantaneous data flow. It ensures:
- **Instant Delivery** – Emits message events immediately to all connected clients in a specific room.
- **Typing Indicators & Status** – Real-time presence updates so you know who is online or typing.
- **Room Isolation** – Strict Socket.io room segregation ensures messages are only broadcast to users inside the specific channel or DM.
- **REST Fallback** – Core entities (channels, servers, users) are retrieved via fast REST APIs on initial load, before upgrading to WebSockets for live updates.

## License
This project is licensed under the MIT License.
