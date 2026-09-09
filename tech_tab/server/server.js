const WebSocket = require('ws');

const wss = new WebSocket.Server({
  port: 8080,
});

const rooms = new Map();

console.log('TeachSync WebSocket server running on port 8080');

wss.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());

      console.log('Received:', data);

      if (data.type === 'create-room') {
        rooms.set(data.roomCode, socket);

        socket.roomCode = data.roomCode;

        socket.send(
          JSON.stringify({
            type: 'room-created',
            roomCode: data.roomCode,
          }),
        );

        console.log(`Room created: ${data.roomCode}`);
      }

      if (data.type === 'join-room') {
        const teacherSocket = rooms.get(data.roomCode);

        if (!teacherSocket) {
          socket.send(
            JSON.stringify({
              type: 'room-not-found',
            }),
          );

          return;
        }

        socket.roomCode = data.roomCode;

        teacherSocket.send(
          JSON.stringify({
            type: 'client-joined',
            roomCode: data.roomCode,
          }),
        );

        socket.send(
          JSON.stringify({
            type: 'room-joined',
            roomCode: data.roomCode,
          }),
        );

        console.log(`Client joined room: ${data.roomCode}`);
      }
    } catch (error) {
      console.error('Invalid message:', error);
    }
  });

  socket.on('close', () => {
    console.log('Client disconnected');

    if (socket.roomCode) {
      rooms.delete(socket.roomCode);
    }
  });
});