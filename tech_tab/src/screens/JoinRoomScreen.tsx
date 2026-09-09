import React, { useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
} from 'react-native';

type JoinRoomScreenProps = {
  onBack: () => void;
  onJoinRoom: (roomCode: string) => void;
};

function JoinRoomScreen({
  onBack,
  onJoinRoom,
}: JoinRoomScreenProps) {
  const [roomCode, setRoomCode] = useState('');

  const handleJoin = () => {
    const code = roomCode.trim().toUpperCase();

    if (code.length === 0) {
      return;
    }

    onJoinRoom(code);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F8FAFC"
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={onBack}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>

        <Text style={styles.headerTitle}>
          Join Room
        </Text>

        <View style={styles.headerSpace} />
      </View>

      {/* Content */}
      <View style={styles.content}>

        <View style={styles.iconContainer}>
          <Text style={styles.icon}>→</Text>
        </View>

        <Text style={styles.title}>
          Join a teaching session
        </Text>

        <Text style={styles.subtitle}>
          Enter the room code shown on the
          teacher's device.
        </Text>

        {/* Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>
            ROOM CODE
          </Text>

          <TextInput
            style={styles.input}
            value={roomCode}
            onChangeText={setRoomCode}
            placeholder="Enter room code"
            placeholderTextColor="#94A3B8"
            autoCapitalize="characters"
            maxLength={6}
          />
        </View>

        {/* Join Button */}
        <Pressable
          style={[
            styles.button,
            roomCode.trim().length === 0 &&
              styles.buttonDisabled,
          ]}
          onPress={handleJoin}
          disabled={roomCode.trim().length === 0}
        >
          <Text style={styles.buttonText}>
            Join Room
          </Text>
        </Pressable>

      </View>

      {/* Footer */}
      <Text style={styles.footer}>
        TeachSync • Real-time teaching
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
    fontSize: 27,
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

  inputContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
  },

  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2,
    color: '#94A3B8',
    marginBottom: 8,
  },

  input: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: 3,
    color: '#0F172A',
    paddingVertical: 8,
  },

  button: {
    width: '100%',
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },

  buttonDisabled: {
    opacity: 0.4,
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

export default JoinRoomScreen;