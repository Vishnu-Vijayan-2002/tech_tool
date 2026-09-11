import React, {
  useRef,
  useState,
  useEffect,
} from 'react';

import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Pressable,
  PanResponder,
  ScrollView,
} from 'react-native';

import {
  pick,
  keepLocalCopy,
  types,
} from '@react-native-documents/picker';

import Svg, {
  Path,
} from 'react-native-svg';

import Pdf from 'react-native-pdf';

import {
  sendMessage,
} from '../services/websocket';

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
 * Create smooth SVG path
 */
function createSmoothPath(
  points: Point[],
): string {
  if (points.length === 0) {
    return '';
  }

  if (points.length === 1) {
    return (
      `M ${points[0].x} ` +
      `${points[0].y}`
    );
  }

  if (points.length === 2) {
    return (
      `M ${points[0].x} ` +
      `${points[0].y} ` +
      `L ${points[1].x} ` +
      `${points[1].y}`
    );
  }

  let path =
    `M ${points[0].x} ` +
    `${points[0].y}`;

  for (
    let i = 1;
    i < points.length - 1;
    i++
  ) {
    const current =
      points[i];

    const next =
      points[i + 1];

    const midX =
      (current.x + next.x) / 2;

    const midY =
      (current.y + next.y) / 2;

    path +=
      ` Q ${current.x} ` +
      `${current.y} ` +
      `${midX} ${midY}`;
  }

  const last =
    points[points.length - 1];

  path +=
    ` L ${last.x} ${last.y}`;

  return path;
}

/*
 * Distance between points
 */
function distance(
  a: Point,
  b: Point,
): number {
  const dx =
    a.x - b.x;

  const dy =
    a.y - b.y;

  return Math.sqrt(
    dx * dx +
    dy * dy,
  );
}

/*
 * Check whether eraser
 * touched a drawing
 */
function pathIsTouchedByEraser(
  path: DrawingPath,
  eraserPoint: Point,
  eraserRadius: number,
): boolean {
  for (
    const point of path.points
  ) {
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

/*
 * Convert PDF page coordinates
 * to normalized coordinates.
 *
 * 0,0 = top-left
 * 1,1 = bottom-right
 */
function normalizePoint(
  x: number,
  y: number,
  width: number,
  height: number,
): Point {
  if (
    width <= 0 ||
    height <= 0
  ) {
    return {
      x: 0,
      y: 0,
    };
  }

  return {
    x: Math.max(
      0,
      Math.min(
        1,
        x / width,
      ),
    ),

    y: Math.max(
      0,
      Math.min(
        1,
        y / height,
      ),
    ),
  };
}

/*
 * Convert normalized point
 * back to screen coordinates.
 */
function denormalizePoint(
  point: Point,
  width: number,
  height: number,
): Point {
  return {
    x: point.x * width,
    y: point.y * height,
  };
}

/*
 * Convert local PDF to base64
 */
async function fileUriToBase64(
  uri: string,
): Promise<string> {
  const response =
    await fetch(uri);

  const blob =
    await response.blob();

  return new Promise(
    (resolve, reject) => {
      const reader =
        new FileReader();

      reader.onloadend =
        () => {
          try {
            const result =
              reader.result as string;

            const base64 =
              result.split(',')[1];

            resolve(base64);
          } catch (error) {
            reject(error);
          }
        };

      reader.onerror =
        reject;

      reader.readAsDataURL(
        blob,
      );
    },
  );
}

function TeachingWorkspaceScreen({
  onBack,
}: TeachingWorkspaceScreenProps) {
  /*
   * =========================================
   * PDF
   * =========================================
   */

  const [
    documentName,
    setDocumentName,
  ] = useState('');

  const [
    pdfUri,
    setPdfUri,
  ] = useState('');

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const currentPageRef =
    useRef(1);

  const pdfRef =
    useRef<any>(null);

  const [
    totalPages,
    setTotalPages,
  ] = useState(0);

  /*
   * =========================================
   * PDF PAGE SIZE
   * =========================================
   */

  const pdfPageSizeRef = useRef({
    width: 0,
    height: 0,
  });

  const [
    pdfAspectRatio,
    setPdfAspectRatio,
  ] = useState(210 / 297);

  /*
   * =========================================
   * TOOLS
   * =========================================
   */

  const [
    isPenActive,
    setIsPenActive,
  ] = useState(false);

  const [
    isEraserActive,
    setIsEraserActive,
  ] = useState(false);

  const [
    penColor,
    setPenColor,
  ] = useState('#EF4444');

  /*
   * =========================================
   * DRAWING
   * =========================================
   */

  const [
    paths,
    setPaths,
  ] = useState<DrawingPath[]>([]);

  const [
    currentPath,
    setCurrentPath,
  ] = useState('');

  const currentPointsRef =
    useRef<Point[]>([]);

  const currentPathRef =
    useRef('');

  const pathsRef =
    useRef<DrawingPath[]>([]);

  /*
   * Keep drawing paths separately for each PDF page.
   * This prevents page 2 drawings from appearing on page 1.
   */
  const pdfPathsByPageRef =
    useRef<Record<number, DrawingPath[]>>({
      1: [],
    });

  const isPenActiveRef =
    useRef(false);

  const isEraserActiveRef =
    useRef(false);

  const penColorRef =
    useRef('#EF4444');

  const pathIdCounterRef =
    useRef(0);

  /*
   * =========================================
   * UNDO / REDO
   * =========================================
   */

  const [
    undoStack,
    setUndoStack,
  ] = useState<
    DrawingPath[][]
  >([]);

  const [
    redoStack,
    setRedoStack,
  ] = useState<
    DrawingPath[][]
  >([]);

  /*
   * =========================================
   * KEEP REFS UPDATED
   * =========================================
   */

  useEffect(() => {
    isPenActiveRef.current =
      isPenActive;
  }, [isPenActive]);

  useEffect(() => {
    isEraserActiveRef.current =
      isEraserActive;
  }, [isEraserActive]);

  useEffect(() => {
    penColorRef.current =
      penColor;
  }, [penColor]);

  useEffect(() => {
    pathsRef.current =
      paths;
  }, [paths]);

  /*
   * =========================================
   * COLORS
   * =========================================
   */

  const penColors = [
    '#EF4444',
    '#2563EB',
    '#16A34A',
    '#F59E0B',
    '#9333EA',
    '#0F172A',
  ];

  /*
   * =========================================
   * SEND PDF STATE
   * =========================================
   */

  const sendPdfState = (
    newPaths: DrawingPath[],
    page =
      currentPageRef.current,
  ) => {
    console.log(
      'Sending PDF state:',
      page,
      newPaths.length,
    );

    sendMessage({
      type: 'pdf-state',

      page,

      paths: newPaths,
    });
  };

  /*
   * =========================================
   * SAVE DRAWING STATE
   * =========================================
   */

  const saveDrawingState = (
    newPaths: DrawingPath[],
    send = true,
  ) => {
    pathsRef.current =
      newPaths;

    /*
     * Save the drawing state for the current PDF page.
     */
    pdfPathsByPageRef.current[
      currentPageRef.current
    ] = newPaths;

    setPaths(newPaths);

    if (send) {
      sendPdfState(
        newPaths,
      );
    }
  };

  /*
   * =========================================
   * OPEN PDF
   * =========================================
   */

  const handleOpenDocument =
    async () => {
      try {
        const [
          file,
        ] = await pick({
          type: [
            types.pdf,
          ],
        });

        console.log(
          'Selected PDF:',
          file,
        );

        const [
          copyResult,
        ] =
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
          copyResult.status !==
          'success'
        ) {
          return;
        }

        console.log(
          'Local PDF:',
          copyResult.localUri,
        );

        const localUri =
          copyResult.localUri;

        setDocumentName(
          file.name ??
          'PDF Document',
        );

        setPdfUri(
          localUri,
        );

        /*
         * Reset drawing
         */
        setPaths([]);

        pathsRef.current =
          [];

        pdfPathsByPageRef.current = {
          1: [],
        };

        setCurrentPath('');

        setUndoStack([]);

        setRedoStack([]);

        pathIdCounterRef.current =
          0;

        setCurrentPage(1);

        currentPageRef.current =
          1;

        /*
         * Send PDF to website
         */
        console.log(
          'Converting PDF to base64...',
        );

        const base64 =
          await fileUriToBase64(
            localUri,
          );

        console.log(
          'PDF base64 ready:',
          base64.length,
        );

        sendMessage({
          type: 'pdf-data',

          fileName:
            file.name ??
            'Teaching PDF',

          mimeType:
            'application/pdf',

          data: base64,
        });

        /*
         * Send initial state
         */
        sendPdfState(
          [],
          1,
        );
      } catch (error) {
        console.log(
          'PDF picker error:',
          error,
        );
      }
    };

  /*
   * =========================================
   * PAGE CHANGE / MANUAL NAVIGATION
   * =========================================
   */

  const handlePageChange =
    (
      page: number,
      total: number,
    ) => {
      const nextPage =
        Math.max(
          1,
          Number(page) || 1,
        );

      const totalCount =
        Math.max(
          0,
          Number(total) || 0,
        );

      console.log(
        `Page ${nextPage} of ${totalCount}`,
      );

      const previousPage =
        currentPageRef.current;

      /*
       * Save drawings for the page we are leaving.
       */
      pdfPathsByPageRef.current[
        previousPage
      ] = pathsRef.current;

      const nextPaths =
        pdfPathsByPageRef.current[
          nextPage
        ] ?? [];

      currentPageRef.current =
        nextPage;

      setCurrentPage(nextPage);
      setTotalPages(totalCount);

      pathsRef.current = nextPaths;
      setPaths(nextPaths);
      setCurrentPath('');

      /*
       * Always tell the web which page is active.
       * The web display follows this state.
       */
      sendPdfState(
        nextPaths,
        nextPage,
      );
    };

  const handleSelectPage =
    (requestedPage: number) => {
      const total = totalPages;

      if (total <= 0) {
        return;
      }

      const nextPage = Math.min(
        Math.max(
          Number(requestedPage) || 1,
          1,
        ),
        total,
      );

      if (
        nextPage ===
        currentPageRef.current
      ) {
        return;
      }

      console.log(
        'Selecting PDF page:',
        nextPage,
      );

      /*
       * Save current-page drawings before switching.
       */
      pdfPathsByPageRef.current[
        currentPageRef.current
      ] = pathsRef.current;

      const nextPaths =
        pdfPathsByPageRef.current[
          nextPage
        ] ?? [];

      currentPageRef.current =
        nextPage;

      setCurrentPage(nextPage);
      pathsRef.current = nextPaths;
      setPaths(nextPaths);
      setCurrentPath('');

      /*
       * react-native-pdf exposes setPage(), which
       * gives us true discrete page navigation.
       */
      pdfRef.current?.setPage(
        nextPage,
      );

      sendPdfState(
        nextPaths,
        nextPage,
      );
    };

  /*
   * =========================================
   * DRAWING TOUCH HANDLER
   * =========================================
   */

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

        /*
         * TOUCH START
         */
        onPanResponderGrant:
          event => {
            if (
              pdfPageSizeRef.current.width <=
                0 ||
              pdfPageSizeRef.current.height <=
                0
            ) {
              return;
            }

            const {
              locationX,
              locationY,
            } =
              event.nativeEvent;

            const point =
              normalizePoint(
                locationX,
                locationY,
                pdfPageSizeRef.current.width,
                pdfPageSizeRef.current.height,
              );

            /*
             * ERASER
             */
            if (
              isEraserActiveRef.current
            ) {
              const eraserRadius =
                0.035;

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

              const visiblePath =
                createSmoothPath([point]);

              currentPathRef.current =
                visiblePath;

              setCurrentPath(
                visiblePath,
              );
            }
          },

        /*
         * TOUCH MOVE
         */
        onPanResponderMove:
          event => {
            if (
              pdfPageSizeRef.current.width <=
                0 ||
              pdfPageSizeRef.current.height <=
                0
            ) {
              return;
            }

            const {
              locationX,
              locationY,
            } =
              event.nativeEvent;

            const point =
              normalizePoint(
                locationX,
                locationY,
                pdfPageSizeRef.current.width,
                pdfPageSizeRef.current.height,
              );

            /*
             * ERASER
             */
            if (
              isEraserActiveRef.current
            ) {
              const eraserRadius =
                0.035;

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

              const last =
                points[
                  points.length - 1
                ];

              if (last) {
                const dx =
                  point.x -
                  last.x;

                const dy =
                  point.y -
                  last.y;

                const movement =
                  Math.sqrt(
                    dx * dx +
                    dy * dy,
                  );

                if (
                  movement <
                  0.003
                ) {
                  return;
                }
              }

              points.push(
                point,
              );

              const visiblePath =
                createSmoothPath(points);

              currentPathRef.current =
                visiblePath;

              setCurrentPath(
                visiblePath,
              );
            }
          },

        /*
         * TOUCH RELEASE
         */
        onPanResponderRelease:
          () => {
            /*
             * Finish pen
             */
            if (
              isPenActiveRef.current &&
              currentPointsRef.current
                .length > 0
            ) {
              const points =
                currentPointsRef.current;

              const newDrawing:
                DrawingPath =
                {
                  id:
                    `path-${pathIdCounterRef.current++}`,

                  /*
                   * Keep path normalized so
                   * the phone and website
                   * use the same coordinates.
                   */
                  path:
                    createSmoothPath(points),

                  color:
                    penColorRef.current,

                  /*
                   * IMPORTANT:
                   * these points are
                   * normalized 0 → 1.
                   */
                  points:
                    [...points],
                };

              const newPaths = [
                ...pathsRef.current,
                newDrawing,
              ];

              setUndoStack(
                previous => [
                  ...previous,
                  pathsRef.current,
                ],
              );

              setRedoStack([]);

              saveDrawingState(
                newPaths,
              );
            }

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

  /*
   * =========================================
   * UNDO
   * =========================================
   */

  const handleUndo = () => {
    if (
      undoStack.length ===
      0
    ) {
      return;
    }

    const newUndoStack =
      [...undoStack];

    const previousState =
      newUndoStack.pop() ??
      [];

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

  /*
   * =========================================
   * REDO
   * =========================================
   */

  const handleRedo = () => {
    if (
      redoStack.length ===
      0
    ) {
      return;
    }

    const newRedoStack =
      [...redoStack];

    const nextState =
      newRedoStack.pop() ??
      [];

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

  /*
   * =========================================
   * DELETE LAST
   * =========================================
   */

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

  /*
   * =========================================
   * CLEAR
   * =========================================
   */

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

  /*
   * =========================================
   * UI
   * =========================================
   */

  return (
    <SafeAreaView
      style={
        styles.container
      }
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F8FAFC"
      />

      {/* HEADER */}

      <View
        style={styles.header}
      >
        <Pressable
          style={
            styles.backButton
          }
          onPress={onBack}
        >
          <Text
            style={
              styles.backText
            }
          >
            ‹
          </Text>
        </Pressable>

        <Text
          style={
            styles.headerTitle
          }
        >
          Teaching Workspace
        </Text>

        <View
          style={
            styles.connection
          }
        >
          <View
            style={
              styles.connectionDot
            }
          />

          <Text
            style={
              styles.connectionText
            }
          >
            Connected
          </Text>
        </View>
      </View>

      {/* WORKSPACE */}

      <View
        style={styles.workspace}
      >
        {/* PDF AREA */}

        <View
          style={styles.pdfArea}
        >
          {pdfUri ? (
            <View
              style={
                styles.pdfContainer
              }
            >
              {/* PDF */}

              <View
                style={[
                  styles.pdfPage,
                  {
                    aspectRatio:
                      pdfAspectRatio,
                  },
                ]}
                onLayout={
                  event => {
                    const {
                      width,
                      height,
                    } =
                      event.nativeEvent
                        .layout;

                    pdfPageSizeRef.current = {
                      width,
                      height,
                    };

                  }
                }
              >
                <Pdf
                  ref={pdfRef}
                  style={styles.pdfViewer}
                  source={{
                    uri: pdfUri,
                    cache: false,
                  }}
                  page={currentPage}
                  horizontal={false}
                  enablePaging={true}
                  scrollEnabled={false}
                  fitPolicy={2}
                  minScale={1}
                  maxScale={1}
                  enableDoubleTapZoom={false}
                  showsVerticalScrollIndicator={false}
                  showsHorizontalScrollIndicator={false}
                  onLoadComplete={(
                    numberOfPages,
                    _filePath,
                    pageInfo,
                  ) => {
                    const total =
                      Number(numberOfPages) || 0;

                    setTotalPages(total);

                    if (
                      pageInfo?.width &&
                      pageInfo?.height
                    ) {
                      const ratio =
                        pageInfo.width /
                        pageInfo.height;

                      if (ratio > 0) {
                        setPdfAspectRatio(
                          ratio,
                        );
                      }
                    }

                    console.log(
                      'PDF loaded:',
                      total,
                      'pages',
                    );

                    /*
                     * Make sure the native viewer starts
                     * on the same page the app tracks.
                     */
                    requestAnimationFrame(() => {
                      pdfRef.current?.setPage(
                        currentPageRef.current,
                      );
                    });
                  }}
                  onPageChanged={
                    handlePageChange
                  }
                  onError={error => {
                    console.log(
                      'PDF rendering error:',
                      error,
                    );
                  }}
                />

                {/* DRAWING TOUCH LAYER */}

                {(isPenActive || isEraserActive) && (
                  <View
                    style={styles.drawingTouchArea}
                    {...panResponder.panHandlers}
                  >
                  <Svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 1 1"
                    preserveAspectRatio="none"
                  >
                    {paths.map(
                      item => (
                        <Path
                          key={
                            item.id
                          }
                          d={createSmoothPath(
                            item.points,
                          )}
                          stroke={
                            item.color
                          }
                          strokeWidth={
                            0.012
                          }
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      ),
                    )}

                    {currentPath ? (
                      <Path
                        d={
                          currentPath
                        }
                        stroke={
                          penColor
                        }
                      strokeWidth={
                            0.012
                          }
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    ) : null}
                  </Svg>
                  </View>
                )}
              </View>
            </View>
          ) : (
            <View
              style={
                styles.emptyPdf
              }
            >
              <Text
                style={
                  styles.pdfIcon
                }
              >
                📄
              </Text>

              <Text
                style={
                  styles.pdfTitle
                }
              >
                No document selected
              </Text>

              <Text
                style={
                  styles.pdfSubtitle
                }
              >
                Open a PDF to start
                teaching
              </Text>
            </View>
          )}

          {/* OPEN PDF */}

          <Pressable
            style={
              styles.documentButton
            }
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

          {/* MANUAL PDF PAGE NAVIGATION */}
          {pdfUri && totalPages > 0 && (
            <View style={styles.pdfPageControls}>
              <Pressable
                style={[
                  styles.pdfNavButton,
                  currentPage <= 1 &&
                    styles.pdfNavButtonDisabled,
                ]}
                onPress={() =>
                  handleSelectPage(
                    currentPage - 1,
                  )
                }
                disabled={
                  currentPage <= 1
                }
              >
                <Text
                  style={styles.pdfNavButtonText}
                >
                  ‹
                </Text>
              </Pressable>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={
                  styles.pdfPageNumbers
                }
              >
                {Array.from(
                  { length: totalPages },
                  (_, index) => {
                    const pageNumber =
                      index + 1;

                    const active =
                      pageNumber ===
                      currentPage;

                    return (
                      <Pressable
                        key={pageNumber}
                        style={[
                          styles.pdfPageNumberButton,
                          active &&
                            styles.pdfPageNumberButtonActive,
                        ]}
                        onPress={() =>
                          handleSelectPage(
                            pageNumber,
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.pdfPageNumberText,
                            active &&
                              styles.pdfPageNumberTextActive,
                          ]}
                        >
                          {pageNumber}
                        </Text>
                      </Pressable>
                    );
                  },
                )}
              </ScrollView>

              <Pressable
                style={[
                  styles.pdfNavButton,
                  currentPage >=
                    totalPages &&
                    styles.pdfNavButtonDisabled,
                ]}
                onPress={() =>
                  handleSelectPage(
                    currentPage + 1,
                  )
                }
                disabled={
                  currentPage >=
                  totalPages
                }
              >
                <Text
                  style={styles.pdfNavButtonText}
                >
                  ›
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* COLOR PANEL */}

        {isPenActive && (
          <View
            style={
              styles.colorPanel
            }
          >
            <Text
              style={
                styles.colorTitle
              }
            >
              Pen Color
            </Text>

            <View
              style={
                styles.colors
              }
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

        {/* TOOLBAR */}

        <View
          style={
            styles.toolbar
          }
        >
          {/* UNDO */}

          <Pressable
            style={[
              styles.toolButton,
              undoStack.length ===
                0 &&
                styles.disabledTool,
            ]}
            onPress={
              handleUndo
            }
            disabled={
              undoStack.length ===
              0
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
              style={
                styles.toolText
              }
            >
              Undo
            </Text>
          </Pressable>

          {/* REDO */}

          <Pressable
            style={[
              styles.toolButton,
              redoStack.length ===
                0 &&
                styles.disabledTool,
            ]}
            onPress={
              handleRedo
            }
            disabled={
              redoStack.length ===
              0
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
              style={
                styles.toolText
              }
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

              setIsPenActive(
                next,
              );

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
              style={
                styles.toolText
              }
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
              style={
                styles.toolIcon
              }
            >
              ⌫
            </Text>

            <Text
              style={
                styles.toolText
              }
            >
              Erase
            </Text>
          </Pressable>

          {/* DELETE */}

          <Pressable
            style={[
              styles.toolButton,
              paths.length ===
                0 &&
                styles.disabledTool,
            ]}
            onPress={
              handleDeleteLastStroke
            }
            disabled={
              paths.length ===
              0
            }
          >
            <Text
              style={[
                styles.toolIcon,
                paths.length ===
                  0 &&
                  styles.disabledIcon,
              ]}
            >
              ◀
            </Text>

            <Text
              style={
                styles.toolText
              }
            >
              Delete
            </Text>
          </Pressable>

          {/* CLEAR */}

          <Pressable
            style={[
              styles.toolButton,
              paths.length ===
                0 &&
                styles.disabledTool,
            ]}
            onPress={
              handleClearAll
            }
            disabled={
              paths.length ===
              0
            }
          >
            <Text
              style={[
                styles.toolIcon,
                paths.length ===
                  0 &&
                  styles.disabledIcon,
              ]}
            >
              🗑
            </Text>

            <Text
              style={
                styles.toolText
              }
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
/* STYLES */
/* ================================================= */

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        '#F8FAFC',
    },

    header: {
      height: 64,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      backgroundColor:
        '#FFFFFF',
    },

    backButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor:
        '#F1F5F9',
      alignItems: 'center',
      justifyContent:
        'center',
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
      backgroundColor:
        '#22C55E',
      marginRight: 7,
    },

    connectionText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#16A34A',
    },

    workspace: {
      flex: 1,
    },

    pdfArea: {
      flex: 1,
      margin: 16,
      borderRadius: 16,
      backgroundColor:
        '#FFFFFF',
      overflow: 'hidden',
    },

    pdfContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent:
        'center',
      backgroundColor:
        '#E2E8F0',
    },

    /*
     * PDF page area. The aspect ratio is supplied
     * from the actual PDF page dimensions.
     */
    pdfPage: {
      width: '92%',
      position: 'relative',
      backgroundColor:
        '#FFFFFF',
      overflow: 'hidden',
    },

    pdfViewer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor:
        '#FFFFFF',
    },

    drawingTouchArea: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'transparent',
      zIndex: 999,
      elevation: 999,
    },

    pdfPageControls: {
      position: 'absolute',
      top: 12,
      left: 12,
      right: 12,
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.96)',
      borderRadius: 14,
      paddingHorizontal: 6,
      paddingVertical: 6,
      zIndex: 2000,
      elevation: 20,
    },

    pdfPageNumbers: {
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
      gap: 6,
    },

    pdfNavButton: {
      width: 38,
      height: 38,
      borderRadius: 10,
      backgroundColor: '#EEF2FF',
      alignItems: 'center',
      justifyContent: 'center',
    },

    pdfNavButtonDisabled: {
      opacity: 0.35,
    },

    pdfNavButtonText: {
      fontSize: 28,
      lineHeight: 32,
      color: '#3730A3',
      fontWeight: '600',
    },

    pdfPageNumberButton: {
      minWidth: 36,
      height: 36,
      paddingHorizontal: 10,
      borderRadius: 10,
      backgroundColor: '#F1F5F9',
      alignItems: 'center',
      justifyContent: 'center',
    },

    pdfPageNumberButtonActive: {
      backgroundColor: '#4F46E5',
    },

    pdfPageNumberText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#475569',
    },

    pdfPageNumberTextActive: {
      color: '#FFFFFF',
    },

    emptyPdf: {
      flex: 1,
      alignItems: 'center',
      justifyContent:
        'center',
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

    documentButton: {
      position: 'absolute',
      bottom: 16,
      alignSelf: 'center',
      backgroundColor:
        '#4F46E5',
      paddingHorizontal: 24,
      paddingVertical: 13,
      borderRadius: 12,
    },

    documentButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '600',
    },

    colorPanel: {
      height: 65,
      backgroundColor:
        '#FFFFFF',
      borderTopWidth: 1,
      borderTopColor:
        '#E2E8F0',
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
      borderColor:
        '#FFFFFF',
      elevation: 5,
    },

    toolbar: {
      height: 82,
      backgroundColor:
        '#FFFFFF',
      borderTopWidth: 1,
      borderTopColor:
        '#E2E8F0',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-around',
      paddingHorizontal: 8,
    },

    toolButton: {
      alignItems: 'center',
      justifyContent:
        'center',
      minWidth: 55,
      paddingVertical: 8,
      paddingHorizontal: 5,
    },

    activeTool: {
      backgroundColor:
        '#EEF2FF',
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
