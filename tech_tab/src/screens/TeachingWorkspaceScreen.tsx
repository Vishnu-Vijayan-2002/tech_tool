import React, {
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

import {
  pick,
  keepLocalCopy,
  types,
} from '@react-native-documents/picker';

import Svg, {
  Path,
} from 'react-native-svg';

import PdfRendererView from 'react-native-pdf-renderer';

type TeachingWorkspaceScreenProps = {
  onBack: () => void;
};

type Point = {
  x: number;
  y: number;
};

type DrawingPath = {
  id: string;
  path: string;
  color: string;
  points: Point[];
};

/*
 * Create a smooth SVG path using quadratic Bézier curves.
 *
 * Instead of:
 *
 * M 10 10 L 20 20 L 30 25 L 40 40
 *
 * we create:
 *
 * M 10 10 Q ... ... Q ... ...
 *
 * This produces much smoother freehand curves.
 */
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
    return [
      `M ${points[0].x} ${points[0].y}`,
      `L ${points[1].x} ${points[1].y}`,
    ].join(' ');
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
      ` Q ${current.x} ${current.y} ${midX} ${midY}`;
  }

  const last =
    points[points.length - 1];

  path +=
    ` L ${last.x} ${last.y}`;

  return path;
}

/*
 * Distance between two points.
 */
function distance(
  pointA: Point,
  pointB: Point,
): number {
  const dx =
    pointA.x - pointB.x;

  const dy =
    pointA.y - pointB.y;

  return Math.sqrt(
    dx * dx + dy * dy,
  );
}

/*
 * Check whether an eraser point
 * is close enough to a drawing point.
 */
function pathIsTouchedByEraser(
  path: DrawingPath,
  eraserPoint: Point,
  eraserRadius: number,
): boolean {
  for (const point of path.points) {
    if (
      distance(
        point,
        eraserPoint,
      ) <= eraserRadius
    ) {
      return true;
    }
  }

  return false;
}

function TeachingWorkspaceScreen({
  onBack,
}: TeachingWorkspaceScreenProps) {

  // =========================
  // PDF
  // =========================

  const [documentName, setDocumentName] =
    useState('');

  const [pdfUri, setPdfUri] =
    useState('');

  // =========================
  // TOOLS
  // =========================

  const [isPenActive, setIsPenActive] =
    useState(false);

  const [isEraserActive, setIsEraserActive] =
    useState(false);

  const [penColor, setPenColor] =
    useState('#EF4444');

  // =========================
  // DRAWING
  // =========================

  const [paths, setPaths] =
    useState<DrawingPath[]>([]);

  const [currentPath, setCurrentPath] =
    useState('');

  const currentPointsRef =
    useRef<Point[]>([]);

  const currentPathRef =
    useRef('');

  const pathsRef =
    useRef<DrawingPath[]>([]);

  const isPenActiveRef =
    useRef(false);

  const isEraserActiveRef =
    useRef(false);

  const penColorRef =
    useRef('#EF4444');

  const pathIdCounterRef =
    useRef(0);

  // =========================
  // UNDO / REDO
  // =========================

  const [undoStack, setUndoStack] =
    useState<DrawingPath[][]>([]);

  const [redoStack, setRedoStack] =
    useState<DrawingPath[][]>([]);

  // =========================
  // KEEP REFS IN SYNC
  // =========================

  isPenActiveRef.current =
    isPenActive;

  isEraserActiveRef.current =
    isEraserActive;

  penColorRef.current =
    penColor;

  pathsRef.current =
    paths;

  // =========================
  // COLORS
  // =========================

  const penColors = [
    '#EF4444',
    '#2563EB',
    '#16A34A',
    '#F59E0B',
    '#9333EA',
    '#0F172A',
  ];

  // =========================
  // OPEN PDF
  // =========================

  const handleOpenDocument =
    async () => {
      try {
        const [file] =
          await pick({
            type: [types.pdf],
          });

        console.log(
          'Selected PDF:',
          file,
        );

        const [copyResult] =
          await keepLocalCopy({
            files: [
              {
                uri: file.uri,
                fileName:
                  file.name ??
                  'document.pdf',
              },
            ],
            destination:
              'documentDirectory',
          });

        if (
          copyResult.status ===
          'success'
        ) {
          console.log(
            'Local PDF:',
            copyResult.localUri,
          );

          setDocumentName(
            file.name ??
            'PDF Document',
          );

          setPdfUri(
            copyResult.localUri,
          );

          /*
           * New document = new drawing
           */
          setPaths([]);
          pathsRef.current = [];

          setCurrentPath('');

          setUndoStack([]);
          setRedoStack([]);

          pathIdCounterRef.current = 0;
        }

      } catch (error) {
        console.log(
          'PDF picker error:',
          error,
        );
      }
    };

  // =========================
  // SAVE DRAWING STATE
  // =========================

  const saveDrawingState =
    (newPaths: DrawingPath[]) => {

      pathsRef.current =
        newPaths;

      setPaths(newPaths);
    };

  // =========================
  // DRAWING TOUCH HANDLER
  // =========================

  const panResponder =
    useRef(
      PanResponder.create({

        onStartShouldSetPanResponder:
          () => {
            return (
              isPenActiveRef.current ||
              isEraserActiveRef.current
            );
          },

        onMoveShouldSetPanResponder:
          () => {
            return (
              isPenActiveRef.current ||
              isEraserActiveRef.current
            );
          },

        // =====================
        // TOUCH START
        // =====================

        onPanResponderGrant:
          event => {

            const {
              locationX,
              locationY,
            } = event.nativeEvent;

            const point = {
              x: locationX,
              y: locationY,
            };

            /*
             * ERASER
             */

            if (
              isEraserActiveRef.current
            ) {

              const eraserRadius =
                24;

              const touchedPaths =
                pathsRef.current.filter(
                  path =>
                    !pathIsTouchedByEraser(
                      path,
                      point,
                      eraserRadius,
                    ),
                );

              if (
                touchedPaths.length !==
                pathsRef.current.length
              ) {
                setUndoStack(
                  previous => [
                    ...previous,
                    pathsRef.current,
                  ],
                );

                setRedoStack([]);

                saveDrawingState(
                  touchedPaths,
                );
              }

              return;
            }

            /*
             * PEN
             */

            if (
              isPenActiveRef.current
            ) {

              currentPointsRef.current =
                [point];

              const newPath =
                createSmoothPath(
                  currentPointsRef.current,
                );

              currentPathRef.current =
                newPath;

              setCurrentPath(
                newPath,
              );
            }
          },

        // =====================
        // TOUCH MOVE
        // =====================

        onPanResponderMove:
          event => {

            const {
              locationX,
              locationY,
            } = event.nativeEvent;

            const point = {
              x: locationX,
              y: locationY,
            };

            /*
             * ERASER
             */

            if (
              isEraserActiveRef.current
            ) {

              const eraserRadius =
                24;

              const touchedPaths =
                pathsRef.current.filter(
                  path =>
                    !pathIsTouchedByEraser(
                      path,
                      point,
                      eraserRadius,
                    ),
                );

              if (
                touchedPaths.length !==
                pathsRef.current.length
              ) {

                saveDrawingState(
                  touchedPaths,
                );
              }

              return;
            }

            /*
             * PEN
             */

            if (
              isPenActiveRef.current
            ) {

              const points =
                currentPointsRef.current;

              /*
               * Ignore extremely tiny
               * movements.
               *
               * This removes unnecessary
               * points and makes rendering
               * smoother.
               */

              const lastPoint =
                points[
                  points.length - 1
                ];

              if (
                lastPoint &&
                distance(
                  lastPoint,
                  point,
                ) < 1.5
              ) {
                return;
              }

              points.push(point);

              /*
               * Keep enough points for
               * smooth interpolation.
               */

              const smoothPath =
                createSmoothPath(
                  points,
                );

              currentPathRef.current =
                smoothPath;

              setCurrentPath(
                smoothPath,
              );
            }
          },

        // =====================
        // TOUCH RELEASE
        // =====================

        onPanResponderRelease:
          () => {

            /*
             * Finish pen stroke.
             */

            if (
              isPenActiveRef.current &&
              currentPointsRef.current
                .length > 0
            ) {

              const points =
                currentPointsRef.current;

              const smoothPath =
                createSmoothPath(
                  points,
                );

              if (smoothPath) {

                /*
                 * Save current state
                 * for Undo.
                 */

                setUndoStack(
                  previous => [
                    ...previous,
                    pathsRef.current,
                  ],
                );

                /*
                 * New drawing means
                 * Redo history is cleared.
                 */

                setRedoStack([]);

                const newDrawing: DrawingPath =
                  {
                    id:
                      `path-${pathIdCounterRef.current++}`,

                    path:
                      smoothPath,

                    color:
                      penColorRef.current,

                    points:
                      [...points],
                  };

                const newPaths = [
                  ...pathsRef.current,
                  newDrawing,
                ];

                saveDrawingState(
                  newPaths,
                );
              }
            }

            /*
             * Clear temporary stroke.
             */

            currentPointsRef.current =
              [];

            currentPathRef.current =
              '';

            setCurrentPath('');
          },

        onPanResponderTerminate:
          () => {

            currentPointsRef.current =
              [];

            currentPathRef.current =
              '';

            setCurrentPath('');
          },

      }),
    ).current;

  // =========================
  // UNDO
  // =========================

  const handleUndo = () => {

    if (
      undoStack.length === 0
    ) {
      return;
    }

    const newUndoStack =
      [...undoStack];

    const previousState =
      newUndoStack.pop() ?? [];

    setRedoStack(
      previous => [
        ...previous,
        pathsRef.current,
      ],
    );

    saveDrawingState(
      previousState,
    );

    setUndoStack(
      newUndoStack,
    );
  };

  // =========================
  // REDO
  // =========================

  const handleRedo = () => {

    if (
      redoStack.length === 0
    ) {
      return;
    }

    const newRedoStack =
      [...redoStack];

    const nextState =
      newRedoStack.pop() ?? [];

    setUndoStack(
      previous => [
        ...previous,
        pathsRef.current,
      ],
    );

    saveDrawingState(
      nextState,
    );

    setRedoStack(
      newRedoStack,
    );
  };

  // =========================
  // DELETE LAST
  // =========================

  const handleDeleteLastStroke =
    () => {

      if (
        pathsRef.current.length ===
        0
      ) {
        return;
      }

      setUndoStack(
        previous => [
          ...previous,
          pathsRef.current,
        ],
      );

      setRedoStack([]);

      const newPaths =
        pathsRef.current.slice(
          0,
          -1,
        );

      saveDrawingState(
        newPaths,
      );
    };

  // =========================
  // CLEAR ALL
  // =========================

  const handleClearAll =
    () => {

      if (
        pathsRef.current.length ===
        0
      ) {
        return;
      }

      setUndoStack(
        previous => [
          ...previous,
          pathsRef.current,
        ],
      );

      setRedoStack([]);

      saveDrawingState([]);
    };

  // =========================
  // UI
  // =========================

  return (
    <SafeAreaView
      style={styles.container}
    >

      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F8FAFC"
      />

      {/* ================= HEADER ================= */}

      <View
        style={styles.header}
      >

        <Pressable
          style={styles.backButton}
          onPress={onBack}
        >
          <Text
            style={styles.backText}
          >
            ‹
          </Text>
        </Pressable>

        <Text
          style={styles.headerTitle}
        >
          Teaching Workspace
        </Text>

        <View
          style={styles.connection}
        >

          <View
            style={styles.connectionDot}
          />

          <Text
            style={styles.connectionText}
          >
            Connected
          </Text>

        </View>

      </View>

      {/* ================= WORKSPACE ================= */}

      <View
        style={styles.workspace}
      >

        {/* ================= PDF ================= */}

        <View
          style={styles.pdfArea}
        >

          {pdfUri ? (

            <View
              style={styles.pdfContainer}
            >

              <PdfRendererView
                style={styles.pdfViewer}
                source={pdfUri}
                distanceBetweenPages={12}
                maxZoom={5}
                maxPageResolution={2048}
                onPageChange={(
                  current,
                  total,
                ) => {

                  console.log(
                    `Page ${current} of ${total}`,
                  );

                }}
                onError={() => {

                  console.log(
                    'PDF rendering error',
                  );

                }}
              />

              {/* ================= DRAWING LAYER ================= */}

              <View
                style={[
                  styles.drawingTouchArea,
                  {
                    pointerEvents:
                      isPenActive ||
                      isEraserActive
                        ? 'auto'
                        : 'none',
                  },
                ]}
                {...panResponder.panHandlers}
              >

                <Svg
                  width="100%"
                  height="100%"
                >

                  {/* ================= SAVED PATHS ================= */}

                  {paths.map(
                    item => (

                      <Path
                        key={item.id}
                        d={item.path}
                        stroke={item.color}
                        strokeWidth={4}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                    ),
                  )}

                  {/* ================= CURRENT STROKE ================= */}

                  {currentPath ? (

                    <Path
                      d={currentPath}
                      stroke={penColor}
                      strokeWidth={4}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                  ) : null}

                </Svg>

              </View>

            </View>

          ) : (

            <View
              style={styles.emptyPdf}
            >

              <Text
                style={styles.pdfIcon}
              >
                📄
              </Text>

              <Text
                style={styles.pdfTitle}
              >
                No document selected
              </Text>

              <Text
                style={styles.pdfSubtitle}
              >
                Open a PDF to start teaching
              </Text>

            </View>

          )}

          {/* ================= OPEN PDF ================= */}

          <Pressable
            style={styles.documentButton}
            onPress={
              handleOpenDocument
            }
          >

            <Text
              style={
                styles.documentButtonText
              }
            >
              {documentName
                ? 'Open Another PDF'
                : 'Open Document'}
            </Text>

          </Pressable>

        </View>

        {/* ================= COLOR PANEL ================= */}

        {isPenActive && (

          <View
            style={styles.colorPanel}
          >

            <Text
              style={styles.colorTitle}
            >
              Pen Color
            </Text>

            <View
              style={styles.colors}
            >

              {penColors.map(
                color => (

                  <Pressable
                    key={color}
                    onPress={() =>
                      setPenColor(
                        color,
                      )
                    }
                    style={[
                      styles.colorButton,
                      {
                        backgroundColor:
                          color,
                      },
                      penColor ===
                        color &&
                        styles.selectedColor,
                    ]}
                  />

                ),
              )}

            </View>

          </View>

        )}

        {/* ================= TOOLBAR ================= */}

        <View
          style={styles.toolbar}
        >

          {/* UNDO */}

          <Pressable
            style={[
              styles.toolButton,
              undoStack.length === 0 &&
                styles.disabledTool,
            ]}
            onPress={
              handleUndo
            }
            disabled={
              undoStack.length === 0
            }
          >

            <Text
              style={[
                styles.toolIcon,
                undoStack.length ===
                  0 &&
                  styles.disabledIcon,
              ]}
            >
              ↶
            </Text>

            <Text
              style={styles.toolText}
            >
              Undo
            </Text>

          </Pressable>

          {/* REDO */}

          <Pressable
            style={[
              styles.toolButton,
              redoStack.length === 0 &&
                styles.disabledTool,
            ]}
            onPress={
              handleRedo
            }
            disabled={
              redoStack.length === 0
            }
          >

            <Text
              style={[
                styles.toolIcon,
                redoStack.length ===
                  0 &&
                  styles.disabledIcon,
              ]}
            >
              ↷
            </Text>

            <Text
              style={styles.toolText}
            >
              Redo
            </Text>

          </Pressable>

          {/* PEN */}

          <Pressable
            style={[
              styles.toolButton,
              isPenActive &&
                styles.activeTool,
            ]}
            onPress={() => {

              const next =
                !isPenActive;

              setIsPenActive(next);

              if (next) {
                setIsEraserActive(
                  false,
                );
              }

            }}
          >

            <Text
              style={[
                styles.toolIcon,
                {
                  color:
                    penColor,
                },
              ]}
            >
              ✎
            </Text>

            <Text
              style={styles.toolText}
            >
              Pen
            </Text>

          </Pressable>

          {/* ERASER */}

          <Pressable
            style={[
              styles.toolButton,
              isEraserActive &&
                styles.activeTool,
            ]}
            onPress={() => {

              const next =
                !isEraserActive;

              setIsEraserActive(
                next,
              );

              if (next) {
                setIsPenActive(
                  false,
                );
              }

            }}
          >

            <Text
              style={styles.toolIcon}
            >
              ⌫
            </Text>

            <Text
              style={styles.toolText}
            >
              Erase
            </Text>

          </Pressable>

          {/* DELETE */}

          <Pressable
            style={[
              styles.toolButton,
              paths.length === 0 &&
                styles.disabledTool,
            ]}
            onPress={
              handleDeleteLastStroke
            }
            disabled={
              paths.length === 0
            }
          >

            <Text
              style={[
                styles.toolIcon,
                paths.length === 0 &&
                  styles.disabledIcon,
              ]}
            >
              ◀
            </Text>

            <Text
              style={styles.toolText}
            >
              Delete
            </Text>

          </Pressable>

          {/* CLEAR */}

          <Pressable
            style={[
              styles.toolButton,
              paths.length === 0 &&
                styles.disabledTool,
            ]}
            onPress={
              handleClearAll
            }
            disabled={
              paths.length === 0
            }
          >

            <Text
              style={[
                styles.toolIcon,
                paths.length === 0 &&
                  styles.disabledIcon,
              ]}
            >
              🗑
            </Text>

            <Text
              style={styles.toolText}
            >
              Clear
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
    backgroundColor: '#F8FAFC',
  },

  /* ================= HEADER ================= */

  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F1F5F9',
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
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginLeft: 16,
  },

  connection: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  connectionDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#22C55E',
    marginRight: 7,
  },

  connectionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16A34A',
  },

  /* ================= WORKSPACE ================= */

  workspace: {
    flex: 1,
  },

  /* ================= PDF ================= */

  pdfArea: {
    flex: 1,
    margin: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },

  pdfContainer: {
    flex: 1,
    position: 'relative',
  },

  pdfViewer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  /* ================= DRAWING ================= */

  drawingTouchArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor:
      'transparent',
  },

  /* ================= EMPTY PDF ================= */

  emptyPdf: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  pdfIcon: {
    fontSize: 48,
    marginBottom: 16,
  },

  pdfTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },

  pdfSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },

  /* ================= DOCUMENT ================= */

  documentButton: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 12,
  },

  documentButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },

  /* ================= COLORS ================= */

  colorPanel: {
    height: 65,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  colorTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginRight: 18,
  },

  colors: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  colorButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },

  selectedColor: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 5,
  },

  /* ================= TOOLBAR ================= */

  toolbar: {
    height: 82,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },

  toolButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 55,
    paddingVertical: 8,
    paddingHorizontal: 5,
  },

  activeTool: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
  },

  disabledTool: {
    opacity: 0.4,
  },

  toolIcon: {
    fontSize: 22,
    color: '#4F46E5',
    marginBottom: 5,
  },

  disabledIcon: {
    color: '#CBD5E1',
  },

  toolText: {
    fontSize: 11,
    color: '#64748B',
  },

});
export default TeachingWorkspaceScreen;