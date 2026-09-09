import { useState } from 'react';
import './App.css';

const SERVER_URL = 'ws://localhost:8080';

function App() {
  const [roomCode, setRoomCode] = useState('');
  const [status, setStatus] = useState('Not connected');

  const handleJoinRoom = () => {
    const code = roomCode.trim().toUpperCase();

    if (!code) {
      return;
    }

    setStatus('Connecting...');

    const socket = new WebSocket(SERVER_URL);

    socket.onopen = () => {
      console.log('Website WebSocket connected');

      setStatus('Connected');

      socket.send(
        JSON.stringify({
          type: 'join-room',
          roomCode: code,
        }),
      );
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      console.log('Server message:', data);

      if (data.type === 'room-joined') {
        setStatus('Room joined successfully');
      }

      if (data.type === 'room-not-found') {
        setStatus('Room not found');
      }

      if (data.type === 'client-joined') {
        console.log('Client joined');
      }
    };

    socket.onerror = () => {
      console.log('WebSocket error');
      setStatus('Connection error');
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
    };
  };

  return (
    <div className="app">
      <div className="card">
        <div className="logo">T</div>

        <h1>TeachSync</h1>

        <p className="subtitle">
          Interactive teaching made simple
        </p>

        <div className="input-section">
          <label>ROOM CODE</label>

          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            placeholder="Enter room code"
            maxLength={6}
          />
        </div>

        <button
          onClick={handleJoinRoom}
          disabled={!roomCode.trim()}
        >
          Join Room
        </button>

        <p>{status}</p>

        <p className="footer">
          Real-time interactive teaching
        </p>
      </div>
    </div>
  );
}

export default App;