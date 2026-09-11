import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Pressable,
  Image,
} from 'react-native';

type WelcomeScreenProps = {
  onGetStarted: () => void;
};

function WelcomeScreen({
  onGetStarted,
}: WelcomeScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F8FAFC"
      />

      <View style={styles.content}>

        {/* =========================
            TEACHSYNC LOGO
           ========================= */}

        <Image
          source={require('../../assets/teachsync-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* =========================
            APP NAME
           ========================= */}
        {/* =========================
            SUBTITLE
           ========================= */}

        <Text style={styles.subtitle}>
          Interactive teaching made simple
        </Text>

        {/* =========================
            DESCRIPTION
           ========================= */}

        <View style={styles.descriptionBox}>
          <Text style={styles.description}>
            Turn your phone into a digital teaching tablet.
            Draw, write and present your lessons in real time.
          </Text>
        </View>

        {/* =========================
            GET STARTED BUTTON
           ========================= */}

        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
          onPress={onGetStarted}
        >
          <Text style={styles.buttonText}>
            Get Started
          </Text>

          <Text style={styles.buttonArrow}>
            →
          </Text>
        </Pressable>

      </View>

      {/* =========================
          FOOTER
         ========================= */}

      <Text style={styles.footer}>
        Real-time interactive teaching
      </Text>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  /* =========================
     CONTAINER
     ========================= */

  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  /* =========================
     MAIN CONTENT
     ========================= */

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },

  /* =========================
     LOGO
     ========================= */

  logo: {
    width: 160,
    height: 160,
    marginBottom: 14,
  },

  /* =========================
     APP NAME
     ========================= */

  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
  },

  /* =========================
     SUBTITLE
     ========================= */

  subtitle: {
    fontSize: 17,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 28,
  },

  /* =========================
     DESCRIPTION
     ========================= */

  descriptionBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 22,
    paddingVertical: 20,
    marginBottom: 32,
  },

  description: {
    fontSize: 15,
    lineHeight: 24,
    color: '#475569',
    textAlign: 'center',
  },

  /* =========================
     BUTTON
     ========================= */

  button: {
    width: '100%',
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  buttonPressed: {
    opacity: 0.75,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },

  buttonArrow: {
    color: '#FFFFFF',
    fontSize: 20,
    marginLeft: 10,
    fontWeight: '500',
  },

  /* =========================
     FOOTER
     ========================= */

  footer: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 13,
    paddingBottom: 20,
  },
});

export default WelcomeScreen;