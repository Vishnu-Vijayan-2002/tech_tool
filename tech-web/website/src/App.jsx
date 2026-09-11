import {
  useEffect,
  useRef,
  useState,
} from 'react';

import './App.css';
import PdfViewer from './PdfViewer';

const SERVER_URL =
  import.meta.env.VITE_WS_URL ||
  'ws://localhost:8080';

function createSmoothPath(
  points,
  width = 1000,
  height = 700,
) {
  if (
    !points ||
    points.length === 0
  ) {
    return '';
  }

  const scaled =
    points.map(point => ({
      x: point.x * width,
      y: point.y * height,
    }));

  if (scaled.length === 1) {
    return (
      `M ${scaled[0].x} ` +
      `${scaled[0].y}`
    );
  }

  if (scaled.length === 2) {
    return (
      `M ${scaled[0].x} ` +
      `${scaled[0].y} ` +
      `L ${scaled[1].x} ` +
      `${scaled[1].y}`
    );
  }

  let path =
    `M ${scaled[0].x} ` +
    `${scaled[0].y}`;

  for (
    let i = 1;
    i < scaled.length - 1;
    i++
  ) {
    const current = scaled[i];
    const next = scaled[i + 1];
    const controlX = current.x;
    const controlY = current.y;
    const endX =
      (current.x + next.x) / 2;
    const endY =
      (current.y + next.y) / 2;

    path +=
      ` Q ${controlX} ` +
      `${controlY} ` +
      `${endX} ${endY}`;
  }

  const last =
    scaled[scaled.length - 1];

  path +=
    ` L ${last.x} ` +
    `${last.y}`;

  return path;
}

function App() {
  const [roomCode, setRoomCode] =
    useState('');
  const [joined, setJoined] =
    useState(false);
  const [roomStatus, setRoomStatus] =
    useState('idle');

  const [sessionType, setSessionType] =
    useState(null);

  const [boardState, setBoardState] =
    useState({
      backgroundColor: '#FFFFFF',
      strokes: [],
    });

  const [pdfDocument, setPdfDocument] =
    useState(null);
  const [pdfState, setPdfState] =
    useState({
      page: 1,
      paths: [],
    });
  const [pdfPathsByPage, setPdfPathsByPage] =
    useState({
      1: [],
    });

  const socketRef = useRef(null);

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, []);

  const connectToRoom = () => {
    const code = roomCode
      .trim()
      .toUpperCase();

    if (!code) return;

    if (
      socketRef.current &&
      socketRef.current.readyState ===
        WebSocket.OPEN
    ) {
      return;
    }

    if (
      socketRef.current &&
      socketRef.current.readyState ===
        WebSocket.CONNECTING
    ) {
      return;
    }

    setJoined(false);
    setRoomStatus('connecting');
    setSessionType(null);
    setBoardState({
      backgroundColor: '#FFFFFF',
      strokes: [],
    });
    setPdfDocument(null);
    setPdfState({
      page: 1,
      paths: [],
    });
    setPdfPathsByPage({
      1: [],
    });

    const socket = new WebSocket(
      SERVER_URL,
    );

    socketRef.current = socket;

    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          type: 'join-room',
          roomCode: code,
        }),
      );
    };

    socket.onmessage = event => {
      try {
        const data = JSON.parse(
          event.data,
        );

        if (
          data.type === 'room-joined'
        ) {
          setJoined(true);
          setRoomCode(data.roomCode);
          setRoomStatus(
            data.sessionStarted ||
              data.sessionType
              ? 'active'
              : 'waiting',
          );
          return;
        }

        if (
          data.type === 'room-waiting'
        ) {
          setJoined(true);
          setRoomStatus('waiting');
          setRoomCode(
            data.roomCode || code,
          );
          return;
        }

        if (
          data.type === 'room-not-found'
        ) {
          setJoined(false);
          setRoomStatus('not-found');
          setSessionType(null);

          if (socketRef.current === socket) {
            socket.close();
          }
          return;
        }

        if (data.type === 'room-status') {
          if (
            data.status === 'active' &&
            data.sessionType
          ) {
            setSessionType(
              data.sessionType,
            );
            setJoined(true);
            setRoomStatus('active');
          } else if (
            data.status === 'waiting'
          ) {
            setJoined(true);
            setRoomStatus('waiting');
          }
          return;
        }

        if (
          data.type === 'session-start'
        ) {
          setSessionType(
            data.sessionType,
          );
          setJoined(true);
          setRoomStatus('active');

          if (
            data.sessionType === 'board'
          ) {
            setBoardState({
              backgroundColor:
                '#FFFFFF',
              strokes: [],
            });
          }

          if (
            data.sessionType === 'pdf'
          ) {
            setPdfState({
              page: 1,
              paths: [],
            });
            setPdfPathsByPage({
              1: [],
            });
            setPdfDocument(null);
          }
          return;
        }

        if (
          data.type === 'board-state'
        ) {
          setBoardState({
            backgroundColor:
              data.backgroundColor ||
              '#FFFFFF',
            strokes: Array.isArray(
              data.strokes,
            )
              ? data.strokes
              : [],
          });
          return;
        }

        if (data.type === 'pdf-data') {
          setSessionType('pdf');
          setPdfDocument({
            fileName:
              data.fileName ||
              'Teaching PDF',
            mimeType:
              data.mimeType ||
              'application/pdf',
            data: data.data,
          });
          setPdfState({
            page: 1,
            paths: [],
          });
          setPdfPathsByPage({
            1: [],
          });
          return;
        }

        if (data.type === 'pdf-state') {
          const receivedPage = Math.max(
            1,
            Number(data.page) || 1,
          );
          const receivedPaths = Array.isArray(
            data.paths,
          )
            ? data.paths
            : [];

          setPdfPathsByPage(
            previous => ({
              ...previous,
              [receivedPage]:
                receivedPaths,
            }),
          );
          setPdfState({
            page: receivedPage,
            paths: receivedPaths,
          });
          return;
        }

        if (
          data.type ===
          'teacher-disconnected'
        ) {
          alert(
            'The teacher has disconnected.',
          );
          setJoined(false);
          setSessionType(null);
          setPdfDocument(null);
          return;
        }

        if (
          data.type === 'client-joined'
        ) {
          return;
        }
      } catch (error) {
        console.error(
          'Invalid server message:',
          error,
        );
      }
    };

    socket.onerror = error => {
      console.error(
        'WebSocket error:',
        error,
      );
      setRoomStatus('error');
    };

    socket.onclose = () => {
      if (socketRef.current === socket) {
        socketRef.current = null;
      }

      setRoomStatus(previous => {
        if (
          previous === 'not-found'
        )
          return previous;
        if (
          previous === 'waiting' ||
          previous === 'active'
        )
          return 'error';
        return previous;
      });
    };
  };

  useEffect(() => {
    if (
      roomStatus !== 'waiting' ||
      !roomCode
    ) {
      return undefined;
    }

    const interval =
      window.setInterval(() => {
        const socket =
          socketRef.current;

        if (
          socket?.readyState ===
          WebSocket.OPEN
        ) {
          socket.send(
            JSON.stringify({
              type: 'room-status',
              roomCode: roomCode
                .trim()
                .toUpperCase(),
            }),
          );
        }
      }, 2000);

    return () =>
      window.clearInterval(interval);
  }, [roomStatus, roomCode]);

  if (!joined) {
    return (
      <div className="entry-page">
        <main className="entry-main">
          <div className="entry-header">
            <h1 className="entry-title">
              TeachSync
            </h1>
            <p className="entry-subtitle">
              Live interactive teaching
            </p>
          </div>

          <div className="entry-card">
            <div className="entry-content">
              <h2 className="entry-heading">
                Join a session
              </h2>

              <p className="entry-description">
                Enter the room code your
                instructor provided. You'll
                automatically enter when
                the session begins.
              </p>

              <form
                className="entry-form"
                onSubmit={e => {
                  e.preventDefault();
                  connectToRoom();
                }}
              >
                <div
                  className="room-input-group"
                >
                  <label
                    htmlFor="roomCode"
                    className="room-label"
                  >
                    Room code
                  </label>

                  <div
                    className={`room-input-wrap ${
                      roomStatus ===
                      'not-found'
                        ? 'has-error'
                        : ''
                    }`}
                  >
                    <input
                      id="roomCode"
                      type="text"
                      value={roomCode}
                      onChange={event => {
                        setRoomCode(
                          event.target.value
                            .toUpperCase()
                            .replace(
                              /\s/g,
                              '',
                            ),
                        );
                        if (
                          roomStatus !==
                          'idle'
                        ) {
                          setRoomStatus(
                            'idle',
                          );
                        }
                      }}
                      onKeyDown={event => {
                        if (
                          event.key ===
                          'Enter'
                        )
                          connectToRoom();
                      }}
                      placeholder="e.g. BUJCEU"
                      maxLength={10}
                      autoComplete="off"
                      spellCheck="false"
                      aria-invalid={
                        roomStatus ===
                        'not-found'
                      }
                    />
                    <span className="room-count">
                      {roomCode.length}
                      /10
                    </span>
                  </div>

                  {roomStatus ===
                    'not-found' && (
                    <div
                      className="entry-error"
                      role="alert"
                    >
                      <span className="error-icon">
                        ⚠
                      </span>
                      <div>
                        <strong>
                          Room not found
                        </strong>
                        <p>
                          Check the code and
                          try again.
                        </p>
                      </div>
                    </div>
                  )}

                  {roomStatus ===
                    'error' && (
                    <div
                      className="entry-error"
                      role="alert"
                    >
                      <span className="error-icon">
                        ⚠
                      </span>
                      <div>
                        <strong>
                          Connection error
                        </strong>
                        <p>
                          Unable to reach the
                          server. Try again.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="entry-button"
                  disabled={
                    !roomCode.trim() ||
                    roomStatus ===
                      'connecting'
                  }
                >
                  {roomStatus ===
                  'connecting' ? (
                    <>
                      <span className="button-spinner" />
                      <span>
                        Connecting…
                      </span>
                    </>
                  ) : (
                    <span>
                      Join room
                    </span>
                  )}
                </button>
              </form>
            </div>
          </div>

          <p className="entry-footer">
            TeachSync • Live Classroom
          </p>
        </main>
      </div>
    );
  }

  if (roomStatus === 'waiting') {
    return (
      <div className="waiting-page">
        <header className="waiting-header">
          <div className="waiting-brand">
            <h1>TeachSync</h1>
            <span>Live Classroom</span>
          </div>
          <div className="waiting-status">
            <span className="status-indicator" />
            Connected
          </div>
        </header>

        <main className="waiting-main">
          <div className="waiting-card">
            <div className="waiting-icon">
              ⏱
            </div>

            <h2 className="waiting-heading">
              Waiting for the host
            </h2>

            <p className="waiting-message">
              You're connected to room{' '}
              <strong>{roomCode}</strong>
              . The session will start
              automatically when your
              instructor begins.
            </p>

            <div className="waiting-indicator">
              <div className="pulse-ring" />
              <span>
                Listening for session
                start
              </span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">
            TeachSync
          </h1>
          <span className="app-subtitle">
            Live
          </span>
        </div>

        <div className="header-center">
          {sessionType === 'board' && (
            <span className="session-badge">
              Whiteboard
            </span>
          )}
          {sessionType === 'pdf' && (
            <span className="session-badge">
              PDF Session
            </span>
          )}
        </div>

        <div className="header-right">
          <div className="room-badge">
            <span className="badge-label">
              Room
            </span>
            <span className="badge-value">
              {roomCode}
            </span>
          </div>
          <div className="connection-indicator">
            <span className="indicator-dot" />
            Live
          </div>
        </div>
      </header>

      <main className="app-content">
        {sessionType === 'board' && (
          <div
            className="board-display"
            style={{
              backgroundColor:
                boardState.backgroundColor,
            }}
          >
            <svg
              className="board-svg"
              viewBox="0 0 1000 700"
              preserveAspectRatio="none"
            >
              {boardState.strokes.map(
                (stroke, index) => {
                  if (
                    !stroke ||
                    !Array.isArray(
                      stroke.points,
                    ) ||
                    stroke.points.length ===
                      0
                  ) {
                    return null;
                  }

                  const path =
                    createSmoothPath(
                      stroke.points,
                      1000,
                      700,
                    );

                  return (
                    <path
                      key={
                        stroke.id || index
                      }
                      d={path}
                      fill="none"
                      stroke={
                        stroke.color ||
                        '#000000'
                      }
                      strokeWidth={
                        stroke.width || 4
                      }
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  );
                },
              )}
            </svg>

            {boardState.strokes.length ===
              0 && (
              <div className="board-empty">
                <div className="board-empty-icon">
                  ✏️
                </div>
                <h3>
                  Live Whiteboard
                </h3>
                <p>
                  Waiting for content…
                </p>
              </div>
            )}
          </div>
        )}

        {sessionType === 'pdf' && (
          <div className="pdf-display">
            {!pdfDocument && (
              <div className="pdf-waiting">
                <div className="pdf-waiting-icon">
                  📄
                </div>
                <h3>PDF Session</h3>
                <p>
                  Waiting for the
                  instructor's PDF…
                </p>
              </div>
            )}

            {pdfDocument && (
              <PdfViewer
                pdfData={
                  pdfDocument.data
                }
                fileName={
                  pdfDocument.fileName
                }
                page={pdfState.page}
                paths={pdfState.paths}
                pathsByPage={
                  pdfPathsByPage
                }
              />
            )}
          </div>
        )}

        {!sessionType && (
          <div className="session-waiting">
            <div className="waiting-content">
              <div className="waiting-icon">
                🎓
              </div>
              <h2>Session starting…</h2>
              <p>
                The instructor will begin
                shortly. Keep this window
                open.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;