import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import WelcomeScreen from './src/screens/WelcomeScreen';
import RoomScreen from './src/screens/RoomScreen';
import CreateRoomScreen from './src/screens/CreateRoomScreen';
import JoinRoomScreen from './src/screens/JoinRoomScreen';
import SessionSelectScreen from './src/screens/SessionSelectScreen';
import TeachingWorkspaceScreen from './src/screens/TeachingWorkspaceScreen';
import BoardSessionScreen from './src/screens/BoardSessionScreen';

import {
  connectWebSocket,
  sendMessage,
  disconnectWebSocket,
} from './src/services/websocket';

function App() {
  const [screen, setScreen] = useState<
    | 'welcome'
    | 'room'
    | 'createRoom'
    | 'sessionSelect'
    | 'joinRoom'
    | 'workspace'
    | 'board'
  >('welcome');

  const [roomCode, setRoomCode] =
    useState<string | null>(null);

  const [webSocketReady, setWebSocketReady] =
    useState(false);

  const roomCreatedRef = useRef(false);

  /* =========================================================
     GLOBAL WEBSOCKET
     ========================================================= */

  useEffect(() => {
    console.log(
      '[APP] Starting global WebSocket...',
    );

    connectWebSocket(
      data => {
        console.log(
          '[APP] GLOBAL WEBSOCKET MESSAGE:',
          data,
        );
      },

      () => {
        console.log(
          '[APP] GLOBAL WEBSOCKET CONNECTED',
        );

        setWebSocketReady(true);
      },

      () => {
        console.log(
          '[APP] GLOBAL WEBSOCKET DISCONNECTED',
        );

        setWebSocketReady(false);
      },
    );

    return () => {
      console.log(
        '[APP] Cleaning up WebSocket',
      );

      disconnectWebSocket();
    };
  }, []);

  /* =========================================================
     WELCOME
     ========================================================= */

  if (screen === 'welcome') {
    return (
      <WelcomeScreen
        onGetStarted={() => {
          console.log(
            '[NAV] WELCOME → ROOM',
          );

          setScreen('room');
        }}
      />
    );
  }

  /* =========================================================
     ROOM
     ========================================================= */

  if (screen === 'room') {
    return (
      <RoomScreen
        onBack={() => {
          setScreen('welcome');
        }}
        onCreateRoom={() => {
          console.log(
            '[NAV] ROOM → CREATE ROOM',
          );

          roomCreatedRef.current = false;

          setRoomCode(null);

          setScreen('createRoom');
        }}
        onJoinRoom={() => {
          console.log(
            '[NAV] ROOM → JOIN ROOM',
          );

          setScreen('joinRoom');
        }}
      />
    );
  }

  /* =========================================================
     CREATE ROOM
     ========================================================= */

  if (screen === 'createRoom') {
    return (
      <CreateRoomScreen
        onBack={() => {
          setScreen('room');
        }}

        onCreateRoom={code => {
          const normalizedCode =
            code.trim().toUpperCase();

          console.log('');
          console.log(
            '========================================',
          );
          console.log(
            '[ROOM CREATE] MOBILE CREATE ROOM',
          );
          console.log(
            '[ROOM CREATE] Code:',
            normalizedCode,
          );
          console.log(
            '[ROOM CREATE] WebSocket ready:',
            webSocketReady,
          );
          console.log(
            '========================================',
          );

          setRoomCode(normalizedCode);

          /* Prevent duplicate registration */

          if (roomCreatedRef.current) {
            console.log(
              '[ROOM CREATE] Room already registered:',
              normalizedCode,
            );

            return;
          }

          /*
            IMPORTANT:

            Mark as created before sending so the button
            cannot register the same room twice.
          */

          roomCreatedRef.current = true;

          const message = {
            type: 'create-room',
            roomCode: normalizedCode,
          };

          console.log(
            '[ROOM CREATE] Sending:',
            message,
          );

          const sent = sendMessage(message);

          console.log(
            '[ROOM CREATE] sendMessage result:',
            sent,
          );

          if (!sent) {
            console.error(
              '[ROOM CREATE] FAILED - mobile WebSocket is not connected',
            );

            roomCreatedRef.current = false;
          }
        }}

        onStartSession={() => {
          console.log(
            '[NAV] CREATE ROOM → SESSION SELECT',
          );

          setScreen('sessionSelect');
        }}
      />
    );
  }

  /* =========================================================
     SESSION SELECT
     ========================================================= */

  if (screen === 'sessionSelect') {
    return (
      <SessionSelectScreen
        onBack={() => {
          console.log(
            '[NAV] SESSION SELECT → CREATE ROOM',
          );

          setScreen('createRoom');
        }}

        onPdfSession={() => {
          console.log(
            '[SESSION] Starting PDF session',
          );

          const sent = sendMessage({
            type: 'session-start',
            sessionType: 'pdf',
          });

          console.log(
            '[SESSION] PDF start sent:',
            sent,
          );

          setScreen('workspace');
        }}

        onBoardSession={() => {
          console.log(
            '[SESSION] Starting BOARD session',
          );

          const sent = sendMessage({
            type: 'session-start',
            sessionType: 'board',
          });

          console.log(
            '[SESSION] BOARD start sent:',
            sent,
          );

          setScreen('board');
        }}
      />
    );
  }

  /* =========================================================
     JOIN ROOM
     ========================================================= */

  if (screen === 'joinRoom') {
    return (
      <JoinRoomScreen
        onBack={() => {
          setScreen('room');
        }}
        onJoinRoom={code => {
          console.log(
            '[JOIN] Joining room:',
            code,
          );

          setRoomCode(
            code.trim().toUpperCase(),
          );
        }}
      />
    );
  }

  /* =========================================================
     PDF
     ========================================================= */

  if (screen === 'workspace') {
    return (
      <TeachingWorkspaceScreen
        onBack={() => {
          console.log(
            '[NAV] PDF → SESSION SELECT',
          );

          setScreen('sessionSelect');
        }}
      />
    );
  }

  /* =========================================================
     BOARD
     ========================================================= */

  if (screen === 'board') {
    return (
      <BoardSessionScreen
        onBack={() => {
          console.log(
            '[NAV] BOARD → SESSION SELECT',
          );

          setScreen('sessionSelect');
        }}
      />
    );
  }

  return null;
}

export default App;