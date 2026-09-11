import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Pressable,
  PanResponder,
} from 'react-native';

import Svg, {Path} from 'react-native-svg';

import {
  sendMessage,
} from '../services/websocket';

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
  // =========================================
  // BOARD
  // =========================================

  const [backgroundColor, setBackgroundColor] =
    useState('#FFFFFF');

  // =========================================
  // PEN
  // =========================================

  const [penColor, setPenColor] =
    useState('#0F172A');

  const [penSize, setPenSize] =
    useState(4);

  const [isPenActive, setIsPenActive] =
    useState(true);

  // =========================================
  // PROFESSIONAL TOOL MENU
  // =========================================

  const [isToolMenuOpen, setIsToolMenuOpen] =
    useState(false);

  // =========================================
  // ERASER
  // =========================================

  const [isEraserActive, setIsEraserActive] =
    useState(false);

  // =========================================
  // DRAWING
  // =========================================

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

  // =========================================
  // LIVE SYNC REFS
  // =========================================

  const boardSizeRef =
    useRef({
      width: 1,
      height: 1,
    });

  const backgroundColorRef =
    useRef(backgroundColor);

  const penColorRef =
    useRef(penColor);

  const penSizeRef =
    useRef(penSize);

  const isPenActiveRef =
    useRef(isPenActive);

  const isEraserActiveRef =
    useRef(isEraserActive);

  // =========================================
  // KEEP REFS UPDATED
  // =========================================

  useEffect(() => {
    backgroundColorRef.current =
      backgroundColor;
  }, [backgroundColor]);

  useEffect(() => {
    penColorRef.current =
      penColor;
  }, [penColor]);

  useEffect(() => {
    penSizeRef.current =
      penSize;
  }, [penSize]);

  useEffect(() => {
    isPenActiveRef.current =
      isPenActive;
  }, [isPenActive]);

  useEffect(() => {
    isEraserActiveRef.current =
      isEraserActive;
  }, [isEraserActive]);

  // =========================================
  // SEND BOARD STATE
  // =========================================

  const sendBoardState = (
    nextBackgroundColor: string,
    nextStrokes: Stroke[],
  ) => {
    const width =
      Math.max(
        boardSizeRef.current.width,
        1,
      );

    const height =
      Math.max(
        boardSizeRef.current.height,
        1,
      );

    const normalizedStrokes =
      nextStrokes.map(stroke => ({
        id: stroke.id,

        color: stroke.color,

        width: stroke.width,

        points: stroke.points.map(
          point => ({
            x: point.x / width,
            y: point.y / height,
          }),
        ),
      }));

    console.log(
      'SENDING BOARD STATE:',
      normalizedStrokes.length,
      'strokes',
    );

    sendMessage({
      type: 'board-state',

      backgroundColor:
        nextBackgroundColor,

      strokes:
        normalizedStrokes,
    });
  };

  // =========================================
  // COLORS
  // =========================================

  const colors = [
    '#0F172A',
    '#EF4444',
    '#2563EB',
    '#16A34A',
    '#F59E0B',
    '#9333EA',
    '#EC4899',
  ];

  // =========================================
  // BOARD COLORS
  // =========================================

  const boardColors = [
    '#FFFFFF',
    '#F8FAFC',
    '#FEFCE8',
    '#F0FDFA',
    '#EFF6FF',
    '#FFF7ED',
    '#111827',
  ];

  // =========================================
  // PEN SIZES
  // =========================================

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

  // =========================================
  // ERASER HELPERS
  // =========================================

  const distanceToSegment = (
    point: Point,
    start: Point,
    end: Point,
  ) => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;

    if (dx === 0 && dy === 0) {
      return Math.sqrt(
        Math.pow(point.x - start.x, 2) +
          Math.pow(point.y - start.y, 2),
      );
    }

    const t = Math.max(
      0,
      Math.min(
        1,
        ((point.x - start.x) * dx +
          (point.y - start.y) * dy) /
          (dx * dx + dy * dy),
      ),
    );

    const closestX = start.x + t * dx;
    const closestY = start.y + t * dy;

    return Math.sqrt(
      Math.pow(point.x - closestX, 2) +
        Math.pow(point.y - closestY, 2),
    );
  };

  // Eraser radius is intentionally small so the teacher
  // can remove only a local portion of a drawing.
  const getEraserRadius = () =>
    Math.max(10, penSizeRef.current * 1.6);

  const isPointNearEraser = (
    point: Point,
    eraserPoint: Point,
  ) => {
    const dx = point.x - eraserPoint.x;
    const dy = point.y - eraserPoint.y;

    return (
      Math.sqrt(dx * dx + dy * dy) <=
      getEraserRadius()
    );
  };

  const isSegmentNearEraser = (
    eraserPoint: Point,
    start: Point,
    end: Point,
  ) => {
    return (
      distanceToSegment(
        eraserPoint,
        start,
        end,
      ) <= getEraserRadius()
    );
  };

  const eraseAtPoint = (point: Point) => {
    const currentStrokes =
      strokesRef.current;

    let changed = false;
    const nextStrokes: Stroke[] = [];

    currentStrokes.forEach(stroke => {
      const points = stroke.points;

      if (points.length === 0) {
        return;
      }

      // Keep each untouched portion as its own stroke.
      // This prevents the remaining line from reconnecting
      // across the erased area.
      let segment: Point[] = [];

      const flushSegment = () => {
        if (segment.length === 0) {
          return;
        }

        if (segment.length === 1) {
          nextStrokes.push({
            ...stroke,
            id: `${stroke.id}-part-${nextStrokes.length}`,
            points: segment,
          });
        } else {
          nextStrokes.push({
            ...stroke,
            id: `${stroke.id}-part-${nextStrokes.length}`,
            points: segment,
          });
        }

        segment = [];
      };

      if (points.length === 1) {
        if (
          isPointNearEraser(
            points[0],
            point,
          )
        ) {
          changed = true;
        } else {
          nextStrokes.push(stroke);
        }

        return;
      }

      for (
        let i = 0;
        i < points.length;
        i++
      ) {
        const current = points[i];

        const nearPoint =
          isPointNearEraser(
            current,
            point,
          );

        const nearPreviousSegment =
          i > 0 &&
          isSegmentNearEraser(
            point,
            points[i - 1],
            current,
          );

        if (
          nearPoint ||
          nearPreviousSegment
        ) {
          changed = true;
          flushSegment();
          continue;
        }

        segment.push(current);
      }

      flushSegment();

      // If nothing was erased from this stroke,
      // preserve its original ID exactly.
      const originalStillExists =
        nextStrokes.some(
          item => item.id === stroke.id,
        );

      if (
        !changed ||
        (!originalStillExists &&
          nextStrokes.length ===
            currentStrokes.length)
      ) {
        // The general state below already contains
        // the correct points; no extra action needed.
      }
    });

    if (!changed) {
      return;
    }

    strokesRef.current =
      nextStrokes;

    setStrokes(
      nextStrokes,
    );

    sendBoardState(
      backgroundColorRef.current,
      nextStrokes,
    );
  };

  // =========================================
  // PAN RESPONDER
  // =========================================

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () =>
        isPenActiveRef.current ||
        isEraserActiveRef.current,

      onMoveShouldSetPanResponder: () =>
        isPenActiveRef.current ||
        isEraserActiveRef.current,

      onPanResponderGrant: event => {
        const {
          locationX,
          locationY,
        } = event.nativeEvent;

        const point = {
          x: locationX,
          y: locationY,
        };

        if (isEraserActiveRef.current) {
          eraseAtPoint(point);
          return;
        }

        if (!isPenActiveRef.current) {
          return;
        }

        currentPointsRef.current = [
          point,
        ];

        setCurrentPoints([
          point,
        ]);
      },

      onPanResponderMove: event => {
        const {
          locationX,
          locationY,
        } = event.nativeEvent;

        const point = {
          x: locationX,
          y: locationY,
        };

        if (isEraserActiveRef.current) {
          eraseAtPoint(point);
          return;
        }

        if (!isPenActiveRef.current) {
          return;
        }

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

        setCurrentPoints(
          updated,
        );
      },

      onPanResponderRelease: () => {
        if (isEraserActiveRef.current) {
          currentPointsRef.current = [];
          setCurrentPoints([]);
          return;
        }

        if (
          !isPenActiveRef.current ||
          currentPointsRef.current
            .length === 0
        ) {
          return;
        }

        const newStroke: Stroke = {
          id:
            `stroke-${strokeId.current++}`,

          points:
            [
              ...currentPointsRef.current,
            ],

          color:
            penColorRef.current,

          width:
            penSizeRef.current,
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

        // =================================
        // SEND TO WEBSITE
        // =================================

        sendBoardState(
          backgroundColorRef.current,
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

  // =========================================
  // CLEAR BOARD
  // =========================================

  const clearBoard = () => {
    strokesRef.current = [];

    setStrokes([]);

    // Send empty board to website
    sendBoardState(
      backgroundColorRef.current,
      [],
    );
  };

  // =========================================
  // UI
  // =========================================

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
          style={
            styles.titleContainer
          }
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
            style={
              styles.connectedDot
            }
          />

          <Text
            style={
              styles.connectedText
            }
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
          onLayout={event => {
            const {
              width,
              height,
            } = event.nativeEvent.layout;

            boardSizeRef.current = {
              width,
              height,
            };

            console.log(
              'BOARD SIZE:',
              width,
              height,
            );
          }}
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
                    key={
                      stroke.id
                    }
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
                  stroke={
                    penColor
                  }
                  strokeWidth={
                    penSize
                  }
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : null}
            </Svg>
          </View>
        </View>
      </View>

      {/* ================= QUICK ERASER ================= */}

      <Pressable
        accessibilityLabel={
          isEraserActive
            ? 'Disable eraser'
            : 'Enable eraser'
        }
        accessibilityRole="button"
        onPress={() => {
          setIsEraserActive(previous => {
            const next = !previous;

            if (next) {
              setIsPenActive(false);
            } else {
              setIsPenActive(true);
            }

            return next;
          });
        }}
        style={[
          styles.eraserButton,
          isEraserActive &&
            styles.eraserButtonActive,
        ]}
      >
        <Text
          style={[
            styles.eraserIcon,
            isEraserActive &&
              styles.eraserIconActive,
          ]}
        >
          ⌫
        </Text>

        <Text
          style={[
            styles.eraserText,
            isEraserActive &&
              styles.eraserTextActive,
          ]}
        >
          Eraser
        </Text>
      </Pressable>

      {/* ================= PROFESSIONAL TOOL MENU ================= */}

      <View
        style={[
          styles.toolDock,
          isToolMenuOpen && styles.toolDockExpanded,
        ]}
      >
        {isToolMenuOpen && (
          <View style={styles.toolPanel}>
            {/* TOOL PANEL HEADER */}

            <View style={styles.toolPanelHeader}>
              <View>
                <Text style={styles.toolPanelTitle}>
                  Board Tools
                </Text>

                <Text style={styles.toolPanelSubtitle}>
                  Customize your workspace
                </Text>
              </View>

              <View
                style={[
                  styles.liveBadge,
                  {
                    backgroundColor:
                      backgroundColor === '#111827'
                        ? '#1F2937'
                        : '#F0FDF4',
                  },
                ]}
              >
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>Live</Text>
              </View>
            </View>

            <Text style={styles.eraserHint}>
              Eraser removes only the touched part of a stroke.
            </Text>

            {/* BOARD BACKGROUND */}

            <View style={styles.toolSection}>
              <Text style={styles.toolSectionTitle}>
                Board background
              </Text>

              <View style={styles.toolOptionRow}>
                {boardColors.map(color => (
                  <Pressable
                    key={color}
                    accessibilityLabel={`Board color ${color}`}
                    onPress={() => {
                      setBackgroundColor(color);
                      backgroundColorRef.current = color;

                      sendBoardState(
                        color,
                        strokesRef.current,
                      );
                    }}
                    style={[
                      styles.boardColor,
                      {backgroundColor: color},
                      backgroundColor === color &&
                        styles.selectedBoardColor,
                    ]}
                  />
                ))}
              </View>
            </View>

            {/* PEN COLOR */}

            <View style={styles.toolSection}>
              <Text style={styles.toolSectionTitle}>
                Pen color
              </Text>

              <View style={styles.toolOptionRow}>
                {colors.map(color => (
                  <Pressable
                    key={color}
                    accessibilityLabel={`Pen color ${color}`}
                    onPress={() => {
                      setPenColor(color);
                      penColorRef.current = color;
                    }}
                    style={[
                      styles.penColor,
                      {backgroundColor: color},
                      penColor === color &&
                        styles.selectedPenColor,
                    ]}
                  />
                ))}
              </View>
            </View>

            {/* PEN SIZE */}

            <View style={styles.toolSection}>
              <Text style={styles.toolSectionTitle}>
                Pen size
              </Text>

              <View style={styles.toolOptionRow}>
                {penSizes.map(item => (
                  <Pressable
                    key={item.label}
                    accessibilityLabel={`Pen size ${item.label}`}
                    onPress={() => {
                      setPenSize(item.size);
                      penSizeRef.current = item.size;
                    }}
                    style={[
                      styles.sizeButton,
                      penSize === item.size &&
                        styles.selectedSize,
                    ]}
                  >
                    <View
                      style={[
                        styles.sizeDot,
                        {
                          width: item.size * 2 + 4,
                          height: item.size * 2 + 4,
                          borderRadius: item.size + 2,
                          backgroundColor: penColor,
                        },
                      ]}
                    />

                    <Text style={styles.sizeText}>
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* ACTIONS */}

            <View style={styles.toolActions}>
              <Pressable
                style={styles.clearButton}
                onPress={clearBoard}
              >
                <Text style={styles.clearButtonText}>
                  Clear board
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ALWAYS-VISIBLE MENU BUTTON */}

        <Pressable
          accessibilityLabel={
            isToolMenuOpen
              ? 'Close board tools'
              : 'Open board tools'
          }
          accessibilityRole="button"
          onPress={() =>
            setIsToolMenuOpen(previous => !previous)
          }
          style={[
            styles.toolMenuButton,
            isToolMenuOpen &&
              styles.toolMenuButtonActive,
          ]}
        >
          <View style={styles.menuIcon}>
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
          </View>

          <Text
            style={[
              styles.toolMenuButtonText,
              isToolMenuOpen &&
                styles.toolMenuButtonTextActive,
            ]}
          >
            {isToolMenuOpen ? 'Close' : 'Tools'}
          </Text>
        </Pressable>
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
      marginTop:20,
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

  // =========================================
  // QUICK ERASER
  // =========================================

  eraserButton: {
    position: 'absolute',
    right: 18,
    bottom: 76,
    minWidth: 88,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.13,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 20,
  },

  eraserButtonActive: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FDBA74',
  },

  eraserIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#475569',
    marginRight: 6,
  },

  eraserIconActive: {
    color: '#EA580C',
  },

  eraserText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },

  eraserTextActive: {
    color: '#C2410C',
  },

  // =========================================
  // PROFESSIONAL FLOATING TOOL DOCK
  // =========================================

  toolDock: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    alignItems: 'flex-end',
  },

  toolDockExpanded: {
    right: 14,
    bottom: 14,
  },

  toolPanel: {
    width: 292,
    marginBottom: 10,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 10,
  },

  toolPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    marginBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },

  toolPanelTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },

  toolPanelSubtitle: {
    marginTop: 3,
    fontSize: 11,
    color: '#64748B',
  },

  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
  },

  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    marginRight: 5,
  },

  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16A34A',
  },

  eraserHint: {
    marginTop: 13,
    padding: 9,
    borderRadius: 9,
    backgroundColor: '#FFF7ED',
    color: '#9A3412',
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '600',
  },

  toolSection: {
    paddingTop: 13,
  },

  toolSectionTitle: {
    marginBottom: 9,
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  toolOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },

  boardColor: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },

  selectedBoardColor: {
    borderWidth: 3,
    borderColor: '#4F46E5',
  },

  penColor: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  selectedPenColor: {
    borderWidth: 3,
    borderColor: '#4F46E5',
    elevation: 4,
  },

  sizeButton: {
    minWidth: 50,
    height: 38,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
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
    fontWeight: '700',
  },

  toolActions: {
    marginTop: 15,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },

  clearButton: {
    height: 42,
    borderRadius: 11,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  clearButtonText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
  },

  toolMenuButton: {
    minWidth: 74,
    height: 46,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 8,
  },

  toolMenuButtonActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },

  menuIcon: {
    width: 18,
    marginRight: 7,
  },

  menuLine: {
    height: 2,
    borderRadius: 2,
    backgroundColor: '#475569',
    marginVertical: 2,
  },

  toolMenuButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },

  toolMenuButtonTextActive: {
    color: '#4338CA',
  },
});

export default BoardSessionScreen;


