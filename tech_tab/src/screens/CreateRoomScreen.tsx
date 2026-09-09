import React, {useEffect, useState} from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';

import {
  connectWebSocket,
  sendMessage,
  disconnectWebSocket,
} from '../services/websocket';

type CreateRoomScreenProps = {
  onBack: () => void;
  onStartSession: () => void;
};

function generateRoomCode() {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  let code = '';

  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(
      Math.random() * characters.length,
    );

    code += characters[randomIndex];
  }

  return code;
}

function CreateRoomScreen({
  onBack,
  onStartSession,
}: CreateRoomScreenProps) {
  const [roomCode] = useState(generateRoomCode());

  const [connectionStatus, setConnectionStatus] =
    useState('Waiting for laptop...');

  useEffect(() => {
    connectWebSocket(
      data => {
        console.log('Server message:', data);

        if (data.type === 'client-joined') {
          setConnectionStatus('Laptop connected');
        }
      },

      () => {
        console.log(
          'Create Room: WebSocket connected',
        );

        sendMessage({
          type: 'create-room',
          roomCode,
        });
      },

      () => {
        console.log(
          'Create Room: WebSocket disconnected',
        );

        setConnectionStatus('Disconnected');
      },
    );

    return () => {
      disconnectWebSocket();
    };
  }, [roomCode]);

  const handleStartSession = () => {
    console.log(
      'START SESSION BUTTON PRESSED',
    );

    console.log(
      'Navigating to SESSION SELECT',
    );

    onStartSession();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F8FAFC"
      />

      {/* HEADER */}

      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={onBack}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>

        <Text style={styles.headerTitle}>
          Create Room
        </Text>

        <View style={styles.headerSpace} />
      </View>

      {/* CONTENT */}

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>＋</Text>
        </View>

        <Text style={styles.title}>
          Your room is ready
        </Text>

        <Text style={styles.subtitle}>
          Share this room code with the computer
          you want to connect to.
        </Text>

        {/* ROOM CODE */}

        <View style={styles.codeBox}>
          <Text style={styles.codeLabel}>
            ROOM CODE
          </Text>

          <Text style={styles.roomCode}>
            {roomCode}
          </Text>
        </View>

        <Text style={styles.info}>
          Enter this code on the TeachSync computer
          display to connect.
        </Text>

        {/* CONNECTION */}

        <Text style={styles.connectionStatus}>
          {connectionStatus}
        </Text>

        {/* START SESSION */}

        <Pressable
          style={styles.button}
          onPress={handleStartSession}
        >
          <Text style={styles.buttonText}>
            Start Session
          </Text>
        </Pressable>
      </View>

      {/* FOOTER */}

      <Text style={styles.footer}>
        TeachSync • Secure room connection
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  backText: {
    fontSize: 32,
    color: '#0F172A',
    marginTop: -4,
  },

  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
  },

  headerSpace: {
    width: 42,
  },

  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 45,
  },

  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  icon: {
    fontSize: 34,
    color: '#4F46E5',
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 15,
    lineHeight: 23,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 30,
  },

  codeBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 25,
    alignItems: 'center',
    marginBottom: 18,
  },

  codeLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2,
    color: '#94A3B8',
    marginBottom: 10,
  },

  roomCode: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: 6,
    color: '#4F46E5',
  },

  info: {
    fontSize: 13,
    lineHeight: 20,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 15,
  },

  connectionStatus: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4F46E5',
    marginBottom: 20,
  },

  button: {
    width: '100%',
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },

  footer: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 13,
    paddingBottom: 20,
  },
});

export default CreateRoomScreen;