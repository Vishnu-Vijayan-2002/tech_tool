import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';

type WelcomeScreenProps = {
  onGetStarted: () => void;
};

function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F8FAFC"
      />

      <View style={styles.content}>

        {/* Logo */}
        <View style={styles.logo}>
          <Text style={styles.logoText}>T</Text>
        </View>

        {/* App Name */}
        <Text style={styles.title}>TeachSync</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Interactive teaching made simple
        </Text>

        {/* Description */}
        <View style={styles.descriptionBox}>
          <Text style={styles.description}>
            Turn your phone into a digital teaching tablet.
            Draw, write and present your lessons in real time.
          </Text>
        </View>

        {/* Get Started Button */}
        <Pressable
          style={styles.button}
          onPress={onGetStarted}
        >
          <Text style={styles.buttonText}>
            Get Started
          </Text>
        </Pressable>

      </View>

      {/* Footer */}
      <Text style={styles.footer}>
        Real-time interactive teaching
      </Text>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },

  logo: {
    width: 82,
    height: 82,
    borderRadius: 22,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },

  logoText: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '700',
  },

  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 17,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 28,
  },

  descriptionBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 22,
    marginBottom: 32,
    width: '100%',
  },

  description: {
    fontSize: 15,
    lineHeight: 24,
    color: '#475569',
    textAlign: 'center',
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

export default WelcomeScreen;