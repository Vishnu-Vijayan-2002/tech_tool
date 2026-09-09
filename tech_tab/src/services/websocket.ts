const SERVER_URL = 'ws://10.105.184.98:8080';

let socket: WebSocket | null = null;

export function connectWebSocket(
  onMessage: (data: any) => void,
  onOpen?: () => void,
  onClose?: () => void,
) {
  socket = new WebSocket(SERVER_URL);

  socket.onopen = () => {
    console.log('WebSocket connected');
    onOpen?.();
  };

  socket.onmessage = event => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (error) {
      console.error('Invalid WebSocket message:', error);
    }
  };

  socket.onerror = error => {
    console.error('WebSocket error:', error);
  };

  socket.onclose = () => {
    console.log('WebSocket disconnected');
    onClose?.();
  };
}

export function sendMessage(data: object) {
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