import React, {useState} from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';

type CreateRoomScreenProps = {
  onBack: () => void;
  onCreateRoom: (roomCode: string) => void;
  onStartSession: () => void;
};

function generateRoomCode() {
  const characters =
    'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

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
  onCreateRoom,
  onStartSession,
}: CreateRoomScreenProps) {
  const [roomCode] = useState(
    generateRoomCode(),
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F8FAFC"
      />

      <View  style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={onBack}
        >
          <Text style={styles.backText}>
            ‹
          </Text>
        </Pressable>

        <Text style={styles.headerTitle}>
          Create Room
        </Text>

        <View style={styles.headerSpace} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>
            ＋
          </Text>
        </View>

        <Text style={styles.title}>
          Your room is ready
        </Text>

        <Text style={styles.subtitle}>
          Share this room code with the computer
          you want to connect to.
        </Text>

        <View style={styles.codeBox}>
          <Text style={styles.codeLabel}>
            ROOM CODE
          </Text>

          <Text style={styles.roomCode}>
            {roomCode}
          </Text>
        </View>

        <Text style={styles.info}>
          Enter this code on the TeachSync
          computer display to connect.
        </Text>

<Pressable
  style={styles.button}
  onPress={() => {
    console.log('');
    console.log(
      '========================================',
    );
    console.log(
      '[CREATE SCREEN] START SESSION PRESSED',
    );
    console.log(
      '[CREATE SCREEN] Room code:',
      roomCode,
    );
    console.log(
      '[CREATE SCREEN] Calling onCreateRoom()...',
    );

    onCreateRoom(roomCode);

    console.log(
      '[CREATE SCREEN] Calling onStartSession()...',
    );

    onStartSession();

    console.log(
      '[CREATE SCREEN] DONE',
    );
    console.log(
      '========================================',
    );
  }}
>
  <Text style={styles.buttonText}>
    Start Session
  </Text>
</Pressable>
      </View>

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
      paddingTop:40,
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
    marginBottom: 25,
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