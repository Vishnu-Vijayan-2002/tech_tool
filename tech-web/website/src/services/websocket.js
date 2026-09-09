const SERVER_URL = 'ws://localhost:8080';

let socket = null;

export function connectWebSocket(onMessage, onOpen, onClose) {
  socket = new WebSocket(SERVER_URL);

  socket.onopen = () => {
    console.log('Website WebSocket connected');
    onOpen?.();
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage?.(data);
    } catch (error) {
      console.error('Invalid WebSocket message:', error);
    }
  };

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  socket.onclose = () => {
    console.log('Website WebSocket disconnected');
    onClose?.();
  };
}

export function sendMessage(data) {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
  } else {
    console.log('WebSocket is not connected');
  }
}

export function disconnectWebSocket() {
  socket?.close();
  socket = null;
}