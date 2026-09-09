import React, { useRef, useState } from 'react';

import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Pressable,
  PanResponder,
} from 'react-native';

import Svg, { Path } from 'react-native-svg';

type BoardSessionScreenProps = {
  onBack: () => void;
};

type Point = {
  x: number;
  y: number;
};

type Stroke = {
  id: string;
  points: Point[];
  color: string;
  width: number;
};

function createSmoothPath(
  points: Point[],
): string {
  if (points.length === 0) {
    return '';
  }

  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  if (points.length === 2) {
    return (
      `M ${points[0].x} ${points[0].y} ` +
      `L ${points[1].x} ${points[1].y}`
    );
  }

  let path =
    `M ${points[0].x} ${points[0].y}`;

  for (
    let i = 1;
    i < points.length - 1;
    i++
  ) {
    const current = points[i];
    const next = points[i + 1];

    const midX =
      (current.x + next.x) / 2;

    const midY =
      (current.y + next.y) / 2;

    path +=
      ` Q ${current.x} ${current.y} ` +
      `${midX} ${midY}`;
  }

  const last =
    points[points.length - 1];

  path +=
    ` L ${last.x} ${last.y}`;

  return path;
}

function BoardSessionScreen({
  onBack,
}: BoardSessionScreenProps) {

  // =========================
  // BOARD
  // =========================

  const [backgroundColor, setBackgroundColor] =
    useState('#FFFFFF');

  // =========================
  // PEN
  // =========================

  const [penColor, setPenColor] =
    useState('#0F172A');

  const [penSize, setPenSize] =
    useState(4);

  const [isPenActive, setIsPenActive] =
    useState(true);

  // =========================
  // DRAWING
  // =========================

  const [strokes, setStrokes] =
    useState<Stroke[]>([]);

  const [currentPoints, setCurrentPoints] =
    useState<Point[]>([]);

  const currentPointsRef =
    useRef<Point[]>([]);

  const strokesRef =
    useRef<Stroke[]>([]);

  const strokeId =
    useRef(0);

  // =========================
  // COLORS
  // =========================

  const colors = [
    '#0F172A',
    '#EF4444',
    '#2563EB',
    '#16A34A',
    '#F59E0B',
    '#9333EA',
    '#EC4899',
  ];

  // =========================
  // BOARD COLORS
  // =========================

  const boardColors = [
    '#FFFFFF',
    '#F8FAFC',
    '#FEFCE8',
    '#F0FDFA',
    '#EFF6FF',
    '#FFF7ED',
    '#111827',
  ];

  // =========================
  // PEN SIZES
  // =========================

  const penSizes = [
    {
      label: 'S',
      size: 2,
    },
    {
      label: 'M',
      size: 4,
    },
    {
      label: 'L',
      size: 7,
    },
    {
      label: 'XL',
      size: 11,
    },
  ];

  // =========================
  // PAN RESPONDER
  // =========================

  const panResponder = useRef(
    PanResponder.create({

      onStartShouldSetPanResponder: () =>
        isPenActive,

      onMoveShouldSetPanResponder: () =>
        isPenActive,

      onPanResponderGrant: event => {

        if (!isPenActive) {
          return;
        }

        const {
          locationX,
          locationY,
        } = event.nativeEvent;

        const point = {
          x: locationX,
          y: locationY,
        };

        currentPointsRef.current = [
          point,
        ];

        setCurrentPoints([
          point,
        ]);
      },

      onPanResponderMove: event => {

        if (!isPenActive) {
          return;
        }

        const {
          locationX,
          locationY,
        } = event.nativeEvent;

        const point = {
          x: locationX,
          y: locationY,
        };

        const previous =
          currentPointsRef.current;

        const last =
          previous[
            previous.length - 1
          ];

        if (last) {

          const dx =
            point.x - last.x;

          const dy =
            point.y - last.y;

          const distance =
            Math.sqrt(
              dx * dx + dy * dy,
            );

          if (distance < 1) {
            return;
          }
        }

        const updated = [
          ...previous,
          point,
        ];

        currentPointsRef.current =
          updated;

        setCurrentPoints(updated);
      },

      onPanResponderRelease: () => {

        if (
          !isPenActive ||
          currentPointsRef.current
            .length === 0
        ) {
          return;
        }

        const newStroke: Stroke = {
          id:
            `stroke-${strokeId.current++}`,

          points:
            [...currentPointsRef.current],

          color:
            penColor,

          width:
            penSize,
        };

        const updatedStrokes = [
          ...strokesRef.current,
          newStroke,
        ];

        strokesRef.current =
          updatedStrokes;

        setStrokes(
          updatedStrokes,
        );

        currentPointsRef.current =
          [];

        setCurrentPoints([]);
      },

      onPanResponderTerminate: () => {

        currentPointsRef.current =
          [];

        setCurrentPoints([]);
      },
    }),
  ).current;

  // =========================
  // CLEAR BOARD
  // =========================

  const clearBoard = () => {

    strokesRef.current = [];

    setStrokes([]);
  };

  // =========================
  // UI
  // =========================

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor:
            backgroundColor,
        },
      ]}
    >

      <StatusBar
        barStyle={
          backgroundColor ===
          '#111827'
            ? 'light-content'
            : 'dark-content'
        }
        backgroundColor={
          backgroundColor
        }
      />

      {/* ================= HEADER ================= */}

      <View
        style={[
          styles.header,
          {
            backgroundColor:
              backgroundColor,
          },
        ]}
      >

        <Pressable
          style={styles.backButton}
          onPress={onBack}
        >

          <Text
            style={[
              styles.backText,
              {
                color:
                  backgroundColor ===
                  '#111827'
                    ? '#FFFFFF'
                    : '#0F172A',
              },
            ]}
          >
            ‹
          </Text>

        </Pressable>

        <View
          style={styles.titleContainer}
        >

          <Text
            style={[
              styles.title,
              {
                color:
                  backgroundColor ===
                  '#111827'
                    ? '#FFFFFF'
                    : '#0F172A',
              },
            ]}
          >
            Board Session
          </Text>

          <Text
            style={[
              styles.subtitle,
              {
                color:
                  backgroundColor ===
                  '#111827'
                    ? '#CBD5E1'
                    : '#64748B',
              },
            ]}
          >
            Interactive Whiteboard
          </Text>

        </View>

        <View
          style={styles.connected}
        >

          <View
            style={styles.connectedDot}
          />

          <Text
            style={styles.connectedText}
          >
            Live
          </Text>

        </View>

      </View>

      {/* ================= BOARD ================= */}

      <View
        style={styles.boardContainer}
      >

        <View
          style={[
            styles.board,
            {
              backgroundColor:
                backgroundColor,
            },
          ]}
        >

          <View
            style={styles.touchLayer}
            {...panResponder.panHandlers}
          >

            <Svg
              width="100%"
              height="100%"
            >

              {/* SAVED STROKES */}

              {strokes.map(
                stroke => (

                  <Path
                    key={stroke.id}
                    d={createSmoothPath(
                      stroke.points,
                    )}
                    stroke={
                      stroke.color
                    }
                    strokeWidth={
                      stroke.width
                    }
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                ),
              )}

              {/* CURRENT STROKE */}

              {currentPoints.length >
              0 ? (

                <Path
                  d={createSmoothPath(
                    currentPoints,
                  )}
                  stroke={penColor}
                  strokeWidth={penSize}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

              ) : null}

            </Svg>

          </View>

        </View>

      </View>

      {/* ================= CONTROLS ================= */}

      <View
        style={styles.controls}
      >

        {/* BOARD COLOR */}

        <View
          style={styles.controlSection}
        >

          <Text
            style={styles.controlTitle}
          >
            Board
          </Text>

          <View
            style={styles.optionRow}
          >

            {boardColors.map(
              color => (

                <Pressable
                  key={color}
                  onPress={() =>
                    setBackgroundColor(
                      color,
                    )
                  }
                  style={[
                    styles.boardColor,
                    {
                      backgroundColor:
                        color,
                    },
                    backgroundColor ===
                      color &&
                      styles.selectedBoardColor,
                  ]}
                />

              ),
            )}

          </View>

        </View>

        {/* PEN COLOR */}

        <View
          style={styles.controlSection}
        >

          <Text
            style={styles.controlTitle}
          >
            Pen Color
          </Text>

          <View
            style={styles.optionRow}
          >

            {colors.map(
              color => (

                <Pressable
                  key={color}
                  onPress={() =>
                    setPenColor(
                      color,
                    )
                  }
                  style={[
                    styles.penColor,
                    {
                      backgroundColor:
                        color,
                    },
                    penColor ===
                      color &&
                      styles.selectedPenColor,
                  ]}
                />

              ),
            )}

          </View>

        </View>

        {/* PEN SIZE */}

        <View
          style={styles.controlSection}
        >

          <Text
            style={styles.controlTitle}
          >
            Size
          </Text>

          <View
            style={styles.optionRow}
          >

            {penSizes.map(
              item => (

                <Pressable
                  key={item.label}
                  onPress={() =>
                    setPenSize(
                      item.size,
                    )
                  }
                  style={[
                    styles.sizeButton,
                    penSize ===
                      item.size &&
                      styles.selectedSize,
                  ]}
                >

                  <View
                    style={[
                      styles.sizeDot,
                      {
                        width:
                          item.size *
                            2 +
                          4,

                        height:
                          item.size *
                            2 +
                          4,

                        borderRadius:
                          item.size +
                          2,

                        backgroundColor:
                          penColor,
                      },
                    ]}
                  />

                  <Text
                    style={
                      styles.sizeText
                    }
                  >
                    {item.label}
                  </Text>

                </Pressable>

              ),
            )}

          </View>

        </View>

        {/* ACTIONS */}

        <View
          style={styles.actions}
        >

          <Pressable
            style={
              styles.clearButton
            }
            onPress={
              clearBoard
            }
          >

            <Text
              style={
                styles.clearButtonText
              }
            >
              🗑 Clear
            </Text>

          </Pressable>

        </View>

      </View>

    </SafeAreaView>
  );
}

/* ================================================= */
/* ===================== STYLES ==================== */
/* ================================================= */

const styles = StyleSheet.create({

  container: {
    flex: 1,
  },

  header: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  backText: {
    fontSize: 32,
    marginTop: -4,
  },

  titleContainer: {
    flex: 1,
    marginLeft: 14,
  },

  title: {
    fontSize: 19,
    fontWeight: '700',
  },

  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },

  connected: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  connectedDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#22C55E',
    marginRight: 6,
  },

  connectedText: {
    color: '#16A34A',
    fontSize: 13,
    fontWeight: '600',
  },

  boardContainer: {
    flex: 1,
    padding: 16,
  },

  board: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  touchLayer: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  controls: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },

  controlSection: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 42,
    marginBottom: 5,
  },

  controlTitle: {
    width: 82,
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },

  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  boardColor: {
    width: 27,
    height: 27,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },

  selectedBoardColor: {
    borderWidth: 3,
    borderColor: '#4F46E5',
  },

  penColor: {
    width: 27,
    height: 27,
    borderRadius: 14,
  },

  selectedPenColor: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 4,
  },

  sizeButton: {
    width: 42,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  selectedSize: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },

  sizeDot: {
    minWidth: 6,
    minHeight: 6,
  },

  sizeText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },

  actions: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },

  clearButton: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },

  clearButtonText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
  },

});

export default BoardSessionScreen;