# TeachSync

### Real-Time Interactive Teaching Platform

TeachSync is a real-time interactive teaching platform that turns an Android phone or tablet into a digital teaching controller.

Teachers can create a teaching room, connect a classroom web browser using a room code, and conduct live sessions using either an **interactive whiteboard** or a **PDF presentation with real-time annotations**.

The mobile application is built with **React Native + TypeScript**, while the classroom display is built with **React + Vite**. Communication between the teacher application and classroom browser is handled through **WebSockets**.

---

## ✨ Features

### 📱 Teacher Mobile Application

* Welcome screen
* Create a teaching room
* Generate a unique 6-character room code
* Join an existing room
* Select teaching session type
* PDF teaching mode
* Interactive whiteboard mode
* Real-time drawing synchronization
* Multiple pen colours
* Multiple pen sizes
* Eraser
* Undo/Redo
* Clear annotations
* PDF page navigation
* Per-page PDF annotations
* Real-time classroom synchronization

### 🖥️ Classroom Web Application

* Join a teaching room using a room code
* Waiting screen before the session starts
* Real-time session activation
* Live whiteboard display
* Live PDF display
* PDF page synchronization
* PDF annotation rendering
* Zoom controls
* Responsive PDF rendering
* Connection/error status handling
* Teacher disconnect notification

---

# 🏗️ Architecture

TeachSync uses a client-server real-time architecture.

```text
                    TeachSync
                       │
          ┌────────────┴────────────┐
          │                         │
          ▼                         ▼
   React Native App          React Web App
   Teacher / Controller      Classroom Display
          │                         ▲
          │                         │
          └────── WebSocket ────────┘
                       │
                       ▼
               WebSocket Server
                  Port 8080
```

### Main Components

| Component       | Technology                    | Responsibility                  |
| --------------- | ----------------------------- | ------------------------------- |
| Teacher App     | React Native                  | Controls the teaching session   |
| Classroom App   | React + Vite                  | Displays the live session       |
| Communication   | WebSocket                     | Real-time state synchronization |
| PDF Renderer    | PDF.js                        | Renders PDFs in the browser     |
| Mobile PDF      | react-native-pdf              | Displays PDFs on Android        |
| Drawing         | React Native SVG              | Renders teacher annotations     |
| Document Picker | React Native Documents Picker | Selects PDF files               |

---

# 🔄 Application Workflow

```text
Teacher opens mobile app
          │
          ▼
     Welcome Screen
          │
          ▼
     Create / Join Room
          │
          ▼
       Room Code
          │
          ▼
    Select Session
       /       \
      /         \
     ▼           ▼
   PDF         Board
  Session     Session
     │           │
     └─────┬─────┘
           │
           ▼
      WebSocket
           │
           ▼
   Classroom Browser
           │
           ▼
       Live Display
```

---

# 🚀 Getting Started

## Prerequisites

Install the following before running the project:

* Node.js
* npm
* Android Studio
* Android SDK
* Java/JDK compatible with the React Native project
* Android emulator or physical Android device
* Git

The mobile project's package configuration requires:

```text
Node >= 22.11.0
```

---

# 📥 Clone the Repository

```bash
git clone https://github.com/Vishnu-Vijayan-2002/tech_tool.git
```

Navigate into the project:

```bash
cd tech_tool
```

---

# 📁 Project Structure

```text
tech_tool/
│
├── tech_tab/
│   │
│   ├── android/
│   │   └── Android native project
│   │
│   ├── ios/
│   │   └── iOS native project
│   │
│   ├── src/
│   │   ├── screens/
│   │   │   ├── WelcomeScreen.tsx
│   │   │   ├── CreateRoomScreen.tsx
│   │   │   ├── JoinRoomScreen.tsx
│   │   │   ├── SessionSelectScreen.tsx
│   │   │   ├── TeachingWorkspaceScreen.tsx
│   │   │   └── BoardSessionScreen.tsx
│   │   │
│   │   └── services/
│   │       └── websocket.ts
│   │
│   ├── App.tsx
│   ├── package.json
│   └── README.md
│
└── tech-web/
    │
    └── website/
        │
        ├── public/
        │
        ├── src/
        │   ├── App.jsx
        │   ├── PdfViewer.jsx
        │   ├── App.css
        │   ├── PdfViewer.css
        │   ├── SessionLifecycle.css
        │   │
        │   └── services/
        │       └── websocket.js
        │
        ├── .env
        ├── package.json
        └── vite.config.js
```

---

# 📱 React Native Mobile Application

The mobile application is located in:

```bash
tech_tab/
```

Install dependencies:

```bash
cd tech_tab
npm install
```

---

## ▶️ Start Metro

Run:

```bash
npm start
```

This starts the React Native Metro development server.

Keep this terminal running.

---

## 📲 Run Android

Open another terminal:

```bash
cd tech_tool/tech_tab
```

Then:

```bash
npm run android
```

The application will be installed/run on the connected Android device or emulator.

---

# 🌐 React Web Application

The classroom display is located in:

```bash
tech-web/website/
```

Navigate to it:

```bash
cd tech-web/website
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Vite will display the local development URL in the terminal.

Open that URL in your browser.

---

# 🔌 WebSocket Server

TeachSync requires a WebSocket server running on:

```text
Port: 8080
```

The mobile and web applications communicate through this server.

```text
React Native
     │
     │ WebSocket
     ▼
WebSocket Server :8080
     │
     │ WebSocket
     ▼
React Web
```

> **Important:** The current repository contains the mobile and web clients, but the WebSocket server implementation is not included in the verified repository tree. Therefore, a compatible WebSocket server must be running separately.

---

# 🌍 LAN Configuration

For physical Android-device testing, the phone and computer need to be able to reach the computer running the WebSocket server.

The current configuration uses:

```text
ws://10.105.184.98:8080
```

### Mobile configuration

The WebSocket URL is configured in:

```text
tech_tab/src/services/websocket.ts
```

Update the server address if your computer's IP address changes.

For example:

```text
ws://192.168.1.15:8080
```

---

## Web Application Configuration

The web application uses:

```text
tech-web/website/src/.env
```

Example:

```env
VITE_WS_URL=ws://192.168.1.15:8080
```

Replace `192.168.1.15` with the IP address of the computer running your WebSocket server.

After changing `.env`, restart Vite:

```bash
npm run dev
```

---

# ⚠️ `localhost` and Android

When testing on a physical Android device, avoid assuming that:

```text
ws://localhost:8080
```

means your development computer.

From the Android device, `localhost` normally refers to the Android device itself.

Use the computer's LAN IP instead:

```text
ws://YOUR-PC-IP:8080
```

Example:

```text
ws://192.168.1.15:8080
```

---

# 🏠 Room System

TeachSync uses room codes to connect teachers and classroom displays.

## Create Room

The teacher selects:

```text
Create Room
```

A six-character room code is generated.

Example:

```text
BUJCEU
```

The mobile client sends a room creation message to the WebSocket server.

Conceptually:

```json
{
  "type": "create-room",
  "roomCode": "BUJCEU"
}
```

---

## Join Room

The classroom browser enters:

```text
BUJCEU
```

The web client sends:

```json
{
  "type": "join-room",
  "roomCode": "BUJCEU"
}
```

The browser then waits for the instructor to start the session.

---

# 🔄 WebSocket Flow

The communication flow is:

```text
                Teacher App
                    │
                    │ create-room
                    ▼
              WebSocket Server
                    │
                    │ room-created
                    ▼
                Teacher App


                Classroom
                    │
                    │ join-room
                    ▼
              WebSocket Server
                    │
                    │ room-waiting
                    ▼
                Classroom
```

Once the teacher starts the session:

```text
Teacher App
    │
    │ session-start
    ▼
WebSocket Server
    │
    │ session-start
    ▼
Classroom Browser
```

---

# 📨 Important WebSocket Messages

The client applications use message types including:

```text
create-room
join-room
room-status
room-joined
room-waiting
room-not-found
session-start
board-state
pdf-data
pdf-state
teacher-disconnected
client-joined
```

---

# 📄 PDF Session

The PDF workflow is:

```text
Teacher selects PDF
        │
        ▼
Mobile reads PDF
        │
        ▼
Convert PDF to Base64
        │
        ▼
WebSocket
        │
        ▼
Classroom Browser
        │
        ▼
Convert Base64 to bytes
        │
        ▼
PDF.js
        │
        ▼
Render PDF
```

The browser uses PDF.js to load and render the received document.

---

# 🖊️ PDF Annotation

The teacher can draw on top of the PDF.

The drawing consists of points:

```text
Point 1
Point 2
Point 3
Point 4
...
```

These points are converted into normalized coordinates.

Instead of sending:

```text
x = 350
y = 420
```

the application can send values such as:

```text
x = 0.35
y = 0.42
```

This allows the annotation to be rendered correctly on different screen sizes.

---

# 📐 Coordinate Normalization

The mobile application calculates:

```text
normalizedX = x / boardWidth
normalizedY = y / boardHeight
```

The browser can then calculate its own display coordinates.

```text
Mobile
400 × 600
   │
   ▼
Normalized
0 → 1
   │
   ▼
Browser
1920 × 1080
```

This is particularly important because the teacher's mobile device and classroom display can have completely different resolutions.

---

# 📑 Per-Page PDF Annotations

PDF annotations are maintained separately for each page.

Conceptually:

```javascript
{
  1: [stroke1, stroke2],
  2: [stroke3],
  3: [stroke4, stroke5]
}
```

Therefore:

```text
Page 1
 └── Page 1 annotations

Page 2
 └── Page 2 annotations

Page 3
 └── Page 3 annotations
```

Switching pages does not mix annotations from different pages.

---

# ✏️ Whiteboard Session

The Board Session provides a blank digital whiteboard.

The teacher can:

* Draw
* Change pen colour
* Change pen size
* Change board background
* Erase content
* Clear drawings

The whiteboard is rendered using SVG.

---

# 🧽 Eraser

The eraser does not simply remove an entire drawing.

The application calculates the distance between the eraser and:

```text
• Individual points
• Line segments
```

If the eraser intersects part of a stroke, the remaining portions can be preserved as separate segments.

Conceptually:

```text
Before:

───────────────████████───────────────
               ↑
             Eraser


After:

───────────────          ───────────────
```

---

# ↩️ Undo / Redo

The teaching workspace maintains previous drawing states.

```text
Current State
     │
     ▼
Undo Stack
     │
     ▼
Previous State
```

Redo states are also maintained so the teacher can restore an undone operation.

---

# 🖥️ Classroom Web Display

The web application has three primary states.

## 1. Join Screen

```text
TeachSync

Join a session

Enter room code

[ BUJCEU ]

[ Join Room ]
```

---

## 2. Waiting Screen

```text
Waiting for the host

You're connected to room BUJCEU.

The session will start automatically
when your instructor begins.
```

---

## 3. Live Session

Depending on the selected session:

```text
PDF Session
```

or:

```text
Whiteboard
```

The browser displays the teacher's current state.

---

# 📄 Browser PDF Viewer

The web application uses PDF.js.

The viewer supports:

* PDF loading
* Page rendering
* Page synchronization
* Zoom
* Fit-to-page behaviour
* Drawing overlay
* Responsive resizing
* Loading/error states

The viewer uses `ResizeObserver` to respond to changes in the available display area.

---

# 🛠️ Troubleshooting

## ❌ Room Not Found

If the browser displays:

```text
Room not found
```

check:

1. The room code is correct.
2. The teacher actually created the room.
3. The WebSocket server is running.
4. Mobile and web clients are using the same WebSocket server.
5. The server has not restarted and lost its in-memory rooms.
6. The phone and PC can communicate over the network.

---

## ❌ WebSocket Connection Error

Check the WebSocket URL.

Mobile:

```text
tech_tab/src/services/websocket.ts
```

Web:

```text
tech-web/website/src/.env
```

Both should point to the same server.

Example:

```text
ws://192.168.1.15:8080
```

---

## ❌ Android Cannot Connect

If the Android application works locally but not on a physical device:

### Check the IP

On Windows:

```bash
ipconfig
```

Find the computer's IPv4 address.

Example:

```text
IPv4 Address: 192.168.1.15
```

Then configure:

```text
ws://192.168.1.15:8080
```

---

## ❌ Phone and PC Are on Different Networks

Make sure both devices can communicate over the same LAN/Wi-Fi network during local testing.

```text
PC
192.168.1.15
   │
   │ Wi-Fi/LAN
   │
Android
192.168.1.xx
```

---

## ❌ Windows Firewall Blocks Port 8080

If the server is running but the Android device cannot connect, check Windows Firewall rules and allow the application/server to accept connections on port:

```text
8080
```

---

## ❌ PDF Does Not Appear

Check:

1. PDF was selected successfully.
2. WebSocket connection is active.
3. `pdf-data` is being sent.
4. Browser receives the PDF data.
5. Browser console has no PDF.js errors.
6. The PDF is a valid PDF file.

---

## ❌ Drawing Is Not Synchronized

Check:

1. WebSocket connection.
2. `board-state` or `pdf-state` messages.
3. Browser console.
4. Mobile console.
5. Coordinate normalization.
6. Room connection.

---

## ❌ Drawing Appears in the Wrong Position

This usually indicates a coordinate or scaling issue.

Verify that:

```text
x / width
y / height
```

are being normalized before transmission and correctly converted back for the target display.

---

# 🔍 Debugging

The project contains console logging for important WebSocket and session operations.

Useful messages include:

```text
MOBILE SOCKET CONNECTED
```

and:

```text
Website WebSocket connected
```

The mobile application also logs room/session actions, which can help trace problems such as:

```text
Create room
Start session
Send board state
Send PDF state
```

When debugging, keep these terminals open:

```text
Terminal 1
WebSocket Server

Terminal 2
React Web / Vite

Terminal 3
React Native / Metro

Terminal 4
Android logs
```

---

# 🧪 Development Commands

## Mobile

```bash
cd tech_tab

npm install
npm start
npm run android
```

Other available commands:

```bash
npm test
npm run lint
npm run ios
```

---

## Web

```bash
cd tech-web/website

npm install
npm run dev
```

Production build:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

Lint:

```bash
npm run lint
```

---

# 🔐 Security Considerations

The current configuration is designed primarily for development/LAN testing.

A production deployment should add:

* HTTPS
* Secure WebSockets (`wss://`)
* User authentication
* Room authentication/authorization
* Server-side room expiration
* Secure PDF storage
* File size restrictions
* Input validation
* Rate limiting
* Connection limits
* Server-side logging
* Session cleanup

---

# ⚡ Current Technical Limitations

## WebSocket Server

The WebSocket server is required by the clients but is not included in the verified repository structure.

It should therefore be treated as a separate service.

---

## Hard-Coded Development IP

The current mobile configuration uses a LAN IP address.

This is convenient for local development but should be replaced with environment-based configuration for production.

For example:

```text
Development:
ws://192.168.1.15:8080

Production:
wss://api.example.com
```

---

## PDF Transfer

The current implementation sends PDF data through WebSocket as Base64.

This is suitable for a prototype or small files, but large PDFs can create significant network and memory overhead.

A production architecture should consider:

```text
Mobile
  │
  ▼
Upload PDF
  │
  ▼
Cloud/Object Storage
  │
  ▼
Document URL / ID
  │
  ▼
WebSocket
  │
  ▼
Classroom Browser
```

The WebSocket connection can then be reserved primarily for real-time state.

---

# 🚀 Future Improvements

## 1. Cloud WebSocket Server

Deploy the WebSocket server to a cloud platform instead of relying on a local computer.

---

## 2. Secure WebSockets

Replace:

```text
ws://
```

with:

```text
wss://
```

behind HTTPS/TLS.

---

## 3. Authentication

Add teacher and classroom authentication.

For example:

```text
Teacher Login
     │
     ▼
Create Session
     │
     ▼
Authenticated Room
```

---

## 4. Persistent Rooms

Currently, a room-based real-time system can lose its state if the server restarts.

A production implementation could use:

```text
PostgreSQL
Redis
MongoDB
```

or another suitable backend.

---

## 5. Better PDF Delivery

Move large PDF files away from the WebSocket channel and use object storage/CDN delivery.

---

## 6. Multiple Classroom Participants

Support multiple browsers joining the same room.

```text
                Teacher
                   │
                   ▼
              WebSocket
               Server
             /    |    \
            /     |     \
           ▼      ▼      ▼
       Display  Student  Student
       Browser  Browser  Browser
```

---

## 7. Session Recording

Save:

* PDF
* Pages
* Annotations
* Drawing history
* Session duration

so teachers can replay or share lessons.

---

## 8. Collaboration

Allow students to interact with the teaching session.

Possible features:

* Student questions
* Reactions
* Polls
* Shared drawing
* Chat
* Hand raising

---

## 9. Better Room Management

Add:

* Room expiration
* Reconnect support
* Room password
* Participant list
* Host controls
* Session locking

---

## 10. Production Monitoring

Add:

* Server logs
* Connection monitoring
* Error tracking
* Performance metrics
* WebSocket health checks

---

# 🧠 What This Project Demonstrates

TeachSync demonstrates practical experience with:

* React
* React Native
* TypeScript
* JavaScript
* React state management
* Hooks
* `useState`
* `useEffect`
* `useRef`
* WebSockets
* Real-time applications
* Android development
* SVG drawing
* Touch/gesture handling
* PDF rendering
* File handling
* Base64 conversion
* Coordinate normalization
* Undo/Redo state management
* Responsive UI
* Client-server communication

---

# 🎯 Interview Explanation

A simple way to explain TeachSync in an interview:

> TeachSync is a real-time interactive teaching platform that I built using React Native, React and WebSockets. The teacher uses the Android application to create a room and select either a PDF teaching session or an interactive whiteboard. A classroom browser joins the room using a room code. The mobile application acts as the controller and sends real-time session state through WebSockets. For PDF sessions, the selected PDF is transferred to the web client and rendered using PDF.js. Teacher annotations and page changes are synchronized in real time. I used normalized coordinates for drawings so that annotations remain correctly positioned across different screen sizes.

---

# 📌 Key Engineering Concept

The central concept of TeachSync is:

```text
REAL-TIME STATE SYNCHRONIZATION
```

The teacher's device maintains the teaching state and sends changes to connected classroom clients.

```text
Teacher Action
      │
      ▼
Update Local State
      │
      ▼
Serialize State
      │
      ▼
WebSocket
      │
      ▼
Server
      │
      ▼
Classroom Client
      │
      ▼
Update UI
```

This architecture allows the teacher's actions to appear on the classroom display without manually refreshing the browser.

---

# 📊 Example Session

Suppose the teacher creates:

```text
Room: BUJCEU
```

The classroom enters:

```text
BUJCEU
```

The teacher selects:

```text
PDF Session
```

Then selects:

```text
Mathematics.pdf
```

The browser receives the PDF.

The teacher moves to:

```text
Page 3
```

The classroom automatically moves to:

```text
Page 3
```

The teacher draws:

```text
x = 0.35
y = 0.52
```

The browser receives the annotation and renders it at the corresponding position.

The complete experience becomes:

```text
Create Room
     ↓
Join Room
     ↓
Start Session
     ↓
Select PDF
     ↓
PDF appears
     ↓
Change page
     ↓
Browser changes page
     ↓
Draw
     ↓
Drawing appears live
     ↓
Erase / Undo / Redo
     ↓
Classroom updates
```

---

# 🏁 Conclusion

TeachSync demonstrates how a React Native mobile application can work together with a React web application to create a real-time teaching environment.

The project combines:

```text
React Native
     +
React
     +
WebSockets
     +
PDF.js
     +
SVG
     +
Android
```

to provide a digital teaching workflow where the mobile device acts as the teacher's interactive controller and the browser acts as the classroom display.

---

## Author

**Vishnu Vijayan**

GitHub:

https://github.com/Vishnu-Vijayan-2002

Repository:

https://github.com/Vishnu-Vijayan-2002/tech_tool

---

## License

Add an appropriate license before distributing the project publicly.

For example:

```text
MIT License
```

if you intend to release the project under the MIT license.
