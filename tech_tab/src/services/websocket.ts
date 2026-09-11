const SERVER_URL = 'ws://10.105.184.98:8080';

let socket: WebSocket | null = null;

type MessageHandler = (data: any) => void;

let messageHandler: MessageHandler | null = null;

let openHandlers: (() => void)[] = [];

let pendingMessages: object[] = [];

/* =========================================================
   CONNECT
   ========================================================= */

export function connectWebSocket(
  onMessage: MessageHandler,
  onOpen?: () => void,
  onClose?: () => void,
) {
  console.log('');
  console.log('========================================');
  console.log('[WS] connectWebSocket() called');
  console.log('[WS] Server:', SERVER_URL);
  console.log('========================================');

  messageHandler = onMessage;

  if (onOpen) {
    openHandlers.push(onOpen);
  }

  /* Already connected */

  if (
    socket &&
    socket.readyState === WebSocket.OPEN
  ) {
    console.log('[WS] Already connected');

    const handlers = [...openHandlers];
    openHandlers = [];

    handlers.forEach(handler => {
      handler();
    });

    return;
  }

  /* Connection already being created */

  if (
    socket &&
    socket.readyState === WebSocket.CONNECTING
  ) {
    console.log(
      '[WS] Connection already in progress',
    );

    return;
  }

  console.log('[WS] Creating new WebSocket...');

  socket = new WebSocket(SERVER_URL);

  /* =========================================================
     OPEN
     ========================================================= */

  socket.onopen = () => {
    console.log('');
    console.log('========================================');
    console.log('[WS] MOBILE SOCKET CONNECTED');
    console.log('[WS] Server:', SERVER_URL);
    console.log('========================================');

    /* Notify App */

    const handlers = [...openHandlers];

    openHandlers = [];

    handlers.forEach(handler => {
      handler();
    });

    /* Send queued messages */

    if (pendingMessages.length > 0) {
      console.log(
        '[WS] Sending queued messages:',
        pendingMessages,
      );

      const messages = [...pendingMessages];

      pendingMessages = [];

      messages.forEach(data => {
        console.log(
          '[WS] Sending queued message:',
          data,
        );

        socket?.send(
          JSON.stringify(data),
        );
      });
    }
  };

  /* =========================================================
     MESSAGE
     ========================================================= */

  socket.onmessage = event => {
    try {
      const data = JSON.parse(
        event.data,
      );

      console.log(
        '[WS] Message received:',
        data,
      );

      messageHandler?.(data);
    } catch (error) {
      console.error(
        '[WS] Invalid message:',
        error,
      );
    }
  };

  /* =========================================================
     ERROR
     ========================================================= */

  socket.onerror = error => {
    console.error(
      '[WS] MOBILE SOCKET ERROR:',
      error,
    );
  };

  /* =========================================================
     CLOSE
     ========================================================= */

  socket.onclose = event => {
    console.log('');
    console.log('========================================');
    console.log('[WS] MOBILE SOCKET CLOSED');
    console.log('[WS] Code:', event.code);
    console.log('[WS] Reason:', event.reason);
    console.log('========================================');

    socket = null;
    messageHandler = null;
    openHandlers = [];
    pendingMessages = [];

    onClose?.();
  };
}

/* =========================================================
   SEND MESSAGE
   ========================================================= */

export function sendMessage(
  data: object,
) {
  console.log('');
  console.log('[WS SEND] Requested:', data);

  /* Connected */

  if (
    socket &&
    socket.readyState === WebSocket.OPEN
  ) {
    console.log(
      '[WS SEND] Socket OPEN → sending immediately',
    );

    socket.send(
      JSON.stringify(data),
    );

    console.log(
      '[WS SEND] SENT:',
      data,
    );

    return true;
  }

  /* Connecting */

  if (
    socket &&
    socket.readyState === WebSocket.CONNECTING
  ) {
    console.log(
      '[WS SEND] Socket CONNECTING → queueing message',
    );

    pendingMessages.push(data);

    console.log(
      '[WS SEND] Queue:',
      pendingMessages,
    );

    return true;
  }

  /* Not connected */

  console.error(
    '[WS SEND] FAILED: WebSocket is not connected',
  );

  console.error(
    '[WS SEND] Message was:',
    data,
  );

  return false;
}

/* =========================================================
   DISCONNECT
   ========================================================= */

export function disconnectWebSocket() {
  console.log(
    '[WS] disconnectWebSocket()',
  );

  pendingMessages = [];
  openHandlers = [];
  messageHandler = null;

  if (socket) {
    socket.close();
  }

  socket = null;
}

/* =========================================================
   CONNECTION STATUS
   ========================================================= */

export function isWebSocketConnected() {
  return (
    socket?.readyState === WebSocket.OPEN
  );
}