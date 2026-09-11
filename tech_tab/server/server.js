const WebSocket = require('ws');

const PORT = 8080;

const wss = new WebSocket.Server({
  port: PORT,
});

/*
  Room lifecycle:

  CREATED -> WAITING -> ACTIVE

  A room exists as soon as the mobile teacher creates it.

  Viewers can join during WAITING and stay connected until
  the teacher starts the session.
*/

const rooms = new Map();

console.log(`TeachSync WebSocket server running on port ${PORT}`);

/* =========================
   SEND MESSAGE
   ========================= */

function send(socket, data) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
  }
}

/* =========================
   BROADCAST TO VIEWERS
   ========================= */

function broadcastViewers(room, data) {
  if (!room) return;

  room.viewers.forEach(viewer => {
    send(viewer, data);
  });
}

/* =========================
   NEW SOCKET CONNECTION
   ========================= */

wss.on('connection', socket => {
  socket.role = null;
  socket.roomCode = null;

  console.log('');
  console.log('========================================');
  console.log('[SOCKET] New client connected');
  console.log('[SOCKET] Ready state:', socket.readyState);
  console.log('========================================');

  /* =========================
     MESSAGE
     ========================= */

  socket.on('message', raw => {
    let data;

    try {
      data = JSON.parse(raw.toString());
    } catch (error) {
      console.error('[ERROR] Invalid JSON:', error);
      return;
    }

    console.log(`[MESSAGE] Received: ${data.type}`);

    /* =====================================================
       CREATE ROOM
       MOBILE HOST
       ===================================================== */

    if (data.type === 'create-room') {
      console.log('');
      console.log('========== CREATE ROOM ==========');
      console.log('[CREATE ROOM] Request received');
      console.log('[CREATE ROOM] Raw room code:', data.roomCode);

      const roomCode = String(data.roomCode || '')
        .trim()
        .toUpperCase();

      console.log('[CREATE ROOM] Normalized room code:', roomCode);

      if (!roomCode) {
        console.log('[CREATE ROOM] ERROR: Empty room code');
        console.log('=================================');
        return;
      }

      const existing = rooms.get(roomCode);

      if (existing) {
        console.log(
          `[CREATE ROOM] ERROR: Room ${roomCode} already exists`
        );

        send(socket, {
          type: 'room-create-error',
          roomCode,
          reason: 'room-exists',
        });

        console.log('=================================');
        return;
      }

      /* ---------------------------------
         REGISTER ROOM IMMEDIATELY
         --------------------------------- */

      rooms.set(roomCode, {
        teacher: socket,
        viewers: new Set(),
        sessionType: null,
        state: null,
      });

      socket.role = 'teacher';
      socket.roomCode = roomCode;

      console.log(
        `[CREATE ROOM] Room registered successfully: ${roomCode}`
      );

      console.log('[CREATE ROOM] Teacher socket registered');
      console.log('[CREATE ROOM] Session type: WAITING');
      console.log('[CREATE ROOM] Total rooms:', rooms.size);

      send(socket, {
        type: 'room-created',
        roomCode,
        status: 'waiting',
      });

      console.log('[CREATE ROOM] Confirmation sent to mobile');
      console.log('=================================');
      console.log('');

      return;
    }

    /* =====================================================
       JOIN ROOM
       WEB VIEWER
       ===================================================== */

    if (data.type === 'join-room') {
      const roomCode = String(data.roomCode || '')
        .trim()
        .toUpperCase();

      console.log('');
      console.log('========== JOIN ROOM ==========');
      console.log('[JOIN ROOM] Requested room:', roomCode);

      const room = rooms.get(roomCode);

      /* ---------------------------------
         ROOM DOES NOT EXIST
         --------------------------------- */

      if (!room) {
        console.log(
          `[JOIN ROOM] ROOM NOT FOUND: ${roomCode}`
        );

        send(socket, {
          type: 'room-not-found',
          roomCode,
        });

        console.log('================================');
        console.log('');

        return;
      }

      /* ---------------------------------
         ROOM EXISTS
         --------------------------------- */

      socket.role = 'viewer';
      socket.roomCode = roomCode;

      room.viewers.add(socket);

      console.log(
        `[JOIN ROOM] Room found: ${roomCode}`
      );

      console.log(
        `[JOIN ROOM] Current viewers: ${room.viewers.size}`
      );

      send(socket, {
        type: 'room-joined',
        roomCode,
        sessionStarted: Boolean(room.sessionType),
        sessionType: room.sessionType || null,
      });

      /* ---------------------------------
         ROOM WAITING FOR HOST
         --------------------------------- */

      if (!room.sessionType) {
        console.log(
          `[JOIN ROOM] Room ${roomCode} is WAITING`
        );

        console.log(
          '[JOIN ROOM] Viewer will remain connected'
        );

        send(socket, {
          type: 'room-waiting',
          roomCode,
          status: 'waiting',
        });

        console.log(
          `[JOIN ROOM] Waiting message sent to ${roomCode}`
        );

        console.log('================================');
        console.log('');

        return;
      }

      /* ---------------------------------
         SESSION ALREADY ACTIVE
         --------------------------------- */

      console.log(
        `[JOIN ROOM] Room ${roomCode} is ACTIVE`
      );

      console.log(
        `[JOIN ROOM] Session type: ${room.sessionType}`
      );

      send(socket, {
        type: 'session-start',
        sessionType: room.sessionType,
      });

      /* Send current state to late viewer */

      if (room.state) {
        console.log(
          `[JOIN ROOM] Sending current ${room.sessionType} state`
        );

        send(socket, room.state);
      }

      console.log(
        `[JOIN ROOM] Viewer joined active room: ${roomCode}`
      );

      console.log('================================');
      console.log('');

      return;
    }

    /* =====================================================
       ROOM STATUS
       WEB FALLBACK
       ===================================================== */

    if (data.type === 'room-status') {
      const roomCode = String(data.roomCode || '')
        .trim()
        .toUpperCase();

      console.log(
        `[ROOM STATUS] Checking room: ${roomCode}`
      );

      const room = rooms.get(roomCode);

      /* ---------------------------------
         ROOM NOT FOUND
         --------------------------------- */

      if (!room) {
        console.log(
          `[ROOM STATUS] Room not found: ${roomCode}`
        );

        send(socket, {
          type: 'room-not-found',
          roomCode,
        });

        return;
      }

      /* ---------------------------------
         ROOM STATUS
         --------------------------------- */

      const status = room.sessionType
        ? 'active'
        : 'waiting';

      console.log(
        `[ROOM STATUS] ${roomCode} -> ${status}`
      );

      send(socket, {
        type: 'room-status',
        roomCode,
        status,
        sessionType: room.sessionType || null,
      });

      /* ---------------------------------
         SESSION ALREADY ACTIVE
         --------------------------------- */

      if (room.sessionType) {
        send(socket, {
          type: 'session-start',
          sessionType: room.sessionType,
        });

        if (room.state) {
          send(socket, room.state);
        }
      }

      return;
    }

    /* =====================================================
       SESSION START
       MOBILE HOST
       ===================================================== */

    if (data.type === 'session-start') {
      const roomCode = socket.roomCode;

      const room = rooms.get(roomCode);

      console.log('');
      console.log('========== SESSION START ==========');
      console.log('[SESSION START] Room:', roomCode);
      console.log('[SESSION START] Requested type:', data.sessionType);

      /* ---------------------------------
         VERIFY TEACHER
         --------------------------------- */

      if (!room) {
        console.log(
          '[SESSION START] ERROR: Room does not exist'
        );

        return;
      }

      if (room.teacher !== socket) {
        console.log(
          '[SESSION START] ERROR: Sender is not the teacher'
        );

        return;
      }

      const sessionType = data.sessionType;

      if (
        sessionType !== 'pdf' &&
        sessionType !== 'board'
      ) {
        console.log(
          '[SESSION START] ERROR: Invalid session type'
        );

        return;
      }

      /* ---------------------------------
         CHANGE WAITING -> ACTIVE
         --------------------------------- */

      room.sessionType = sessionType;
      room.state = null;

      console.log(
        `[SESSION START] Room ${roomCode} is now ACTIVE`
      );

      console.log(
        `[SESSION START] Session type: ${sessionType}`
      );

      console.log(
        `[SESSION START] Notifying ${room.viewers.size} viewer(s)`
      );

      broadcastViewers(room, {
        type: 'session-start',
        sessionType,
      });

      console.log(
        '[SESSION START] Session notification sent'
      );

      console.log('===================================');
      console.log('');

      return;
    }

    /* =====================================================
       PDF DATA
       ===================================================== */

    if (data.type === 'pdf-data') {
      const room = rooms.get(socket.roomCode);

      if (!room || room.teacher !== socket) {
        console.log(
          '[PDF DATA] Rejected: sender is not teacher'
        );

        return;
      }

      room.state = null;

      broadcastViewers(room, data);

      console.log(
        `[PDF DATA] PDF sent to ${room.viewers.size} viewer(s)`
      );

      return;
    }

    /* =====================================================
       PDF STATE
       ===================================================== */

    if (data.type === 'pdf-state') {
      const room = rooms.get(socket.roomCode);

      if (!room || room.teacher !== socket) {
        console.log(
          '[PDF STATE] Rejected: sender is not teacher'
        );

        return;
      }

      room.state = data;

      broadcastViewers(room, data);

      console.log(
        `[PDF STATE] State sent to ${room.viewers.size} viewer(s)`
      );

      return;
    }

    /* =====================================================
       BOARD STATE
       ===================================================== */

    if (data.type === 'board-state') {
      const room = rooms.get(socket.roomCode);

      if (!room || room.teacher !== socket) {
        console.log(
          '[BOARD STATE] Rejected: sender is not teacher'
        );

        return;
      }

      room.state = data;

      broadcastViewers(room, data);

      console.log(
        `[BOARD STATE] State sent to ${room.viewers.size} viewer(s)`
      );

      return;
    }

    /* =====================================================
       UNKNOWN MESSAGE
       ===================================================== */

    console.log(
      `[MESSAGE] Unknown message type: ${data.type}`
    );
  });

  /* =====================================================
     SOCKET DISCONNECTED
     ===================================================== */

  socket.on('close', () => {
    const roomCode = socket.roomCode;

    console.log('');
    console.log('========== SOCKET CLOSED ==========');
    console.log('[SOCKET] Role:', socket.role);
    console.log('[SOCKET] Room:', roomCode);

    if (!roomCode) {
      console.log('[SOCKET] No room associated with socket');
      console.log('===================================');
      return;
    }

    const room = rooms.get(roomCode);

    if (!room) {
      console.log(
        `[SOCKET] Room ${roomCode} already removed`
      );

      console.log('===================================');
      return;
    }

    /* ---------------------------------
       TEACHER DISCONNECTED
       --------------------------------- */

    if (socket.role === 'teacher') {
      /*
        Important:
        Only the current teacher can delete the room.
      */

      if (room.teacher !== socket) {
        console.log(
          '[SOCKET] Old teacher socket ignored'
        );

        console.log('===================================');
        return;
      }

      console.log(
        `[SOCKET] Teacher disconnected from ${roomCode}`
      );

      room.viewers.forEach(viewer => {
        send(viewer, {
          type: 'teacher-disconnected',
          roomCode,
        });
      });

      rooms.delete(roomCode);

      console.log(
        `[ROOM] Deleted room: ${roomCode}`
      );

      console.log(
        '[ROOM] Remaining rooms:',
        rooms.size
      );

      console.log('===================================');
      return;
    }

    /* ---------------------------------
       VIEWER DISCONNECTED
       --------------------------------- */

    if (socket.role === 'viewer') {
      room.viewers.delete(socket);

      console.log(
        `[SOCKET] Viewer left room: ${roomCode}`
      );

      console.log(
        `[ROOM] Remaining viewers: ${room.viewers.size}`
      );
    }

    console.log('===================================');
  });
});