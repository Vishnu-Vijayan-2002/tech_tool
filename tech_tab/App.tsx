import React, {useState} from 'react';

import WelcomeScreen from './src/screens/WelcomeScreen';
import RoomScreen from './src/screens/RoomScreen';
import CreateRoomScreen from './src/screens/CreateRoomScreen';
import JoinRoomScreen from './src/screens/JoinRoomScreen';
import SessionSelectScreen from './src/screens/SessionSelectScreen';
import TeachingWorkspaceScreen from './src/screens/TeachingWorkspaceScreen';
import BoardSessionScreen from './src/screens/BoardSessionScreen';

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

  console.log('CURRENT SCREEN:', screen);

  // =========================================
  // 1. WELCOME
  // =========================================

  if (screen === 'welcome') {
    return (
      <WelcomeScreen
        onGetStarted={() => {
          console.log('WELCOME → ROOM');
          setScreen('room');
        }}
      />
    );
  }

  // =========================================
  // 2. ROOM
  // =========================================

  if (screen === 'room') {
    return (
      <RoomScreen
        onBack={() => {
          setScreen('welcome');
        }}
        onCreateRoom={() => {
          console.log('ROOM → CREATE ROOM');
          setScreen('createRoom');
        }}
        onJoinRoom={() => {
          console.log('ROOM → JOIN ROOM');
          setScreen('joinRoom');
        }}
      />
    );
  }

  // =========================================
  // 3. CREATE ROOM
  // =========================================

  if (screen === 'createRoom') {
    return (
      <CreateRoomScreen
        onBack={() => {
          setScreen('room');
        }}
        onStartSession={() => {
          console.log('CREATE ROOM → SESSION SELECT');
          setScreen('sessionSelect');
        }}
      />
    );
  }

  // =========================================
  // 4. SESSION SELECT
  // =========================================

  if (screen === 'sessionSelect') {
    return (
      <SessionSelectScreen
        onBack={() => {
          console.log('SESSION SELECT → CREATE ROOM');
          setScreen('createRoom');
        }}
        onPdfSession={() => {
          console.log('SESSION SELECT → PDF');
          setScreen('workspace');
        }}
        onBoardSession={() => {
          console.log('SESSION SELECT → BOARD');
          setScreen('board');
        }}
      />
    );
  }

  // =========================================
  // 5. JOIN ROOM
  // =========================================

  if (screen === 'joinRoom') {
    return (
      <JoinRoomScreen
        onBack={() => {
          setScreen('room');
        }}
        onJoinRoom={roomCode => {
          console.log('Joining room:', roomCode);
        }}
      />
    );
  }

  // =========================================
  // 6. PDF SESSION
  // =========================================

  if (screen === 'workspace') {
    return (
      <TeachingWorkspaceScreen
        onBack={() => {
          console.log('PDF → SESSION SELECT');
          setScreen('sessionSelect');
        }}
      />
    );
  }

  // =========================================
  // 7. BOARD SESSION
  // =========================================

  if (screen === 'board') {
    return (
      <BoardSessionScreen
        onBack={() => {
          console.log('BOARD → SESSION SELECT');
          setScreen('sessionSelect');
        }}
      />
    );
  }

  return null;
}

export default App;