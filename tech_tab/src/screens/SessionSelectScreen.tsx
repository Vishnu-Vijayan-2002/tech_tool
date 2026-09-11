import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';

type SessionSelectScreenProps = {
  onBack: () => void;
  onPdfSession: () => void;
  onBoardSession: () => void;
};

function SessionSelectScreen({
  onBack,
  onPdfSession,
  onBoardSession,
}: SessionSelectScreenProps) {
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
          Select Session
        </Text>

        <View style={styles.headerSpace} />
      </View>

      {/* CONTENT */}

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>T</Text>
        </View>

        <Text style={styles.title}>
          Choose your session
        </Text>

        <Text style={styles.subtitle}>
          Select how you want to teach your class.
        </Text>

        {/* PDF SESSION */}

        <Pressable
          style={styles.sessionCard}
          onPress={() => {
            console.log(
              'PDF SESSION BUTTON PRESSED',
            );

            onPdfSession();
          }}
        >
          <View style={styles.cardIcon}>
            <Text style={styles.cardIconText}>
              📄
            </Text>
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>
              PDF Session
            </Text>

            <Text style={styles.cardDescription}>
              Open a PDF and teach using the
              interactive drawing tools.
            </Text>

            <View style={styles.chipRow}>
              <View style={styles.chip}>
                <Text style={styles.chipText}>
                  PDF
                </Text>
              </View>

              <View style={styles.chip}>
                <Text style={styles.chipText}>
                  Drawing
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.arrow}>›</Text>
        </Pressable>

        {/* BOARD SESSION */}

        <Pressable
          style={styles.sessionCard}
          onPress={() => {
            console.log(
              'BOARD SESSION BUTTON PRESSED',
            );

            onBoardSession();
          }}
        >
          <View style={styles.cardIcon}>
            <Text style={styles.cardIconText}>
              ✎
            </Text>
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>
              Board Session
            </Text>

            <Text style={styles.cardDescription}>
              Start with a blank interactive
              whiteboard for teaching.
            </Text>

            <View style={styles.chipRow}>
              <View style={styles.chip}>
                <Text style={styles.chipText}>
                  Whiteboard
                </Text>
              </View>

              <View style={styles.chip}>
                <Text style={styles.chipText}>
                  Live
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.arrow}>›</Text>
        </Pressable>
      </View>

      {/* FOOTER */}

      <Text style={styles.footer}>
        TeachSync • Choose your teaching mode
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
    paddingHorizontal: 20,
    paddingTop: 35,
  },

  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },

  icon: {
    fontSize: 30,
    color: '#4F46E5',
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 30,
  },

  sessionCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  cardIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  cardIconText: {
    fontSize: 25,
  },

  cardContent: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 5,
  },

  cardDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: '#64748B',
    marginBottom: 10,
  },

  chipRow: {
    flexDirection: 'row',
    gap: 7,
  },

  chip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },

  chipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },

  arrow: {
    fontSize: 30,
    color: '#94A3B8',
    marginLeft: 8,
  },

  footer: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 13,
    paddingBottom: 20,
  },
});

export default SessionSelectScreen;