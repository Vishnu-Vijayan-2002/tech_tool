import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';

type RoomScreenProps = {
  onBack: () => void;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
};

function RoomScreen({
  onBack,
  onCreateRoom,
  onJoinRoom,
}: RoomScreenProps) {
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

        <Text style={styles.headerTitle}>Start Teaching</Text>

        <View style={styles.headerSpace} />
      </View>

      {/* Main Content */}
      <View style={styles.content}>

        <Text style={styles.title}>
          Connect your teaching tablet
        </Text>

        <Text style={styles.subtitle}>
          Connect your phone to a computer and start
          teaching interactively in real time.
        </Text>

        {/* Create Room */}
        <Pressable
          style={({ pressed }) => [
            styles.optionCard,
            pressed && styles.cardPressed,
          ]}
          onPress={onCreateRoom}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>＋</Text>
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>
              Create Room
            </Text>

            <Text style={styles.cardDescription}>
              Start a new teaching session and get a room code.
            </Text>
          </View>

          <Text style={styles.arrow}>›</Text>
        </Pressable>

        {/* Join Room */}
        <Pressable
          style={({ pressed }) => [
            styles.optionCard,
            pressed && styles.cardPressed,
          ]}
          onPress={onJoinRoom}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>→</Text>
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>
              Join Room
            </Text>

            <Text style={styles.cardDescription}>
              Enter a room code to connect to an existing session.
            </Text>
          </View>

          <Text style={styles.arrow}>›</Text>
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
    paddingHorizontal: 24,
    paddingTop: 40,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 15,
    lineHeight: 23,
    color: '#64748B',
    marginBottom: 32,
  },

  optionCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  cardPressed: {
    opacity: 0.7,
  },

  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },

  icon: {
    fontSize: 28,
    color: '#4F46E5',
    fontWeight: '500',
  },

  cardContent: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 5,
  },

  cardDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: '#64748B',
  },

  arrow: {
    fontSize: 28,
    color: '#94A3B8',
    marginLeft: 10,
  },

  footer: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 13,
    paddingBottom: 20,
  },
});

export default RoomScreen;