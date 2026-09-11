import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import './PdfViewer.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

function base64ToUint8Array(base64) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function createSmoothPath(points) {
  if (!Array.isArray(points) || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i += 1) {
    const current = points[i];
    const next = points[i + 1];
    const midX = (current.x + next.x) / 2;
    const midY = (current.y + next.y) / 2;
    path += ` Q ${current.x} ${current.y} ${midX} ${midY}`;
  }

  const last = points[points.length - 1];
  return `${path} L ${last.x} ${last.y}`;
}

function PdfViewer({
  pdfData,
  fileName = 'Teaching PDF',
  page = 1,
  paths = [],
  pathsByPage = {},
}) {
  const stageRef = useRef(null);
  const canvasRef = useRef(null);

  const [pdfDocument, setPdfDocument] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [fitScale, setFitScale] = useState(1);
  const [menuCollapsed, setMenuCollapsed] = useState(false);

  // Mobile is the only source of truth for the active page.
  const selectedPage = Number(page) || 1;

  useEffect(() => {
    const element = stageRef.current;
    if (!element) return undefined;

    const updateSize = () => {
      const rect = element.getBoundingClientRect();
      setStageSize({ width: rect.width, height: rect.height });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    window.addEventListener('resize', updateSize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let loadingTask;

    async function loadPdf() {
      if (!pdfData) {
        setPdfDocument(null);
        setTotalPages(0);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        setZoom(1);

        const bytes = base64ToUint8Array(pdfData);
        loadingTask = pdfjsLib.getDocument({ data: bytes });
        const pdf = await loadingTask.promise;

        if (cancelled) return;

        setPdfDocument(pdf);
        setTotalPages(pdf.numPages);
      } catch (err) {
        console.error('PDF load error:', err);
        if (!cancelled) {
          setPdfDocument(null);
          setTotalPages(0);
          setError('Unable to load PDF.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPdf();

    return () => {
      cancelled = true;
      if (loadingTask) loadingTask.destroy();
    };
  }, [pdfData]);

  useEffect(() => {
    if (!pdfDocument || stageSize.width <= 0 || stageSize.height <= 0) {
      return undefined;
    }

    let cancelled = false;
    let renderTask;

    async function calculateFit() {
      try {
        const safePage = Math.min(
          Math.max(selectedPage, 1),
          pdfDocument.numPages,
        );

        const pdfPage = await pdfDocument.getPage(safePage);
        if (cancelled) return;

        const baseViewport = pdfPage.getViewport({ scale: 1 });
        const availableWidth = Math.max(stageSize.width - 48, 1);
        const availableHeight = Math.max(stageSize.height - 48, 1);

        const calculatedFit = Math.min(
          availableWidth / baseViewport.width,
          availableHeight / baseViewport.height,
        );

        setFitScale(Math.max(calculatedFit, 0.01));
      } catch (err) {
        if (!cancelled) console.error('PDF fit calculation error:', err);
      }
    }

    calculateFit();

    return () => {
      cancelled = true;
    };
  }, [pdfDocument, selectedPage, stageSize.width, stageSize.height]);

  useEffect(() => {
    if (!pdfDocument || !canvasRef.current || fitScale <= 0) {
      return undefined;
    }

    let cancelled = false;
    let renderTask;

    async function renderPage() {
      try {
        const safePage = Math.min(
          Math.max(selectedPage, 1),
          pdfDocument.numPages,
        );

        const pdfPage = await pdfDocument.getPage(safePage);
        if (cancelled) return;

        const cssScale = fitScale * zoom;
        const outputScale = Math.min(window.devicePixelRatio || 1, 2);
        const viewport = pdfPage.getViewport({ scale: cssScale });
        const renderViewport = pdfPage.getViewport({
          scale: cssScale * outputScale,
        });

        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d');
        if (!canvas || !context) return;

        canvas.width = Math.ceil(renderViewport.width);
        canvas.height = Math.ceil(renderViewport.height);
        canvas.style.width = `${Math.ceil(viewport.width)}px`;
        canvas.style.height = `${Math.ceil(viewport.height)}px`;

        context.setTransform(1, 0, 0, 1, 0, 0);
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.setTransform(outputScale, 0, 0, outputScale, 0, 0);

        renderTask = pdfPage.render({
          canvasContext: context,
          viewport,
        });

        await renderTask.promise;
      } catch (err) {
        if (
          !cancelled &&
          err?.name !== 'RenderingCancelledException'
        ) {
          console.error('PDF render error:', err);
          setError('Unable to render PDF page.');
        }
      }
    }

    renderPage();

    return () => {
      cancelled = true;
      if (renderTask) renderTask.cancel();
    };
  }, [pdfDocument, selectedPage, fitScale, zoom]);

  const safeCurrentPage = pdfDocument
    ? Math.min(Math.max(selectedPage, 1), pdfDocument.numPages)
    : selectedPage;

  const selectedPagePaths = Array.isArray(pathsByPage?.[safeCurrentPage])
    ? pathsByPage[safeCurrentPage]
    : safeCurrentPage === Number(page)
      ? paths
      : [];

  const zoomPercent = Math.round(zoom * 100);

  const changeZoom = amount => {
    setZoom(value =>
      Math.min(3, Math.max(1, Number((value + amount).toFixed(2)))),
    );
  };

  const resetZoom = () => setZoom(1);

  const fitPage = () => {
    setZoom(1);
    requestAnimationFrame(() => {
      stageRef.current?.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    });
  };

  return (
    <div className="pdf-viewer-wrapper">
      {/* Floating side menu: does not consume vertical PDF space. */}
      <aside
        className={`pdf-side-menu${menuCollapsed ? ' is-collapsed' : ''}`}
        aria-label="PDF viewer controls"
      >
        <button
          type="button"
          className="pdf-menu-toggle"
          onClick={() => setMenuCollapsed(value => !value)}
          aria-expanded={!menuCollapsed}
          title={menuCollapsed ? 'Open PDF controls' : 'Collapse PDF controls'}
        >
          {menuCollapsed ? '‹' : '›'}
        </button>

        {!menuCollapsed && (
          <div className="pdf-side-menu-content">
            <div className="pdf-side-file" title={fileName}>
              <span className="pdf-side-file-icon">📄</span>
              <span className="pdf-side-file-name">{fileName}</span>
            </div>

            <div className="pdf-sync-status">
              <span className="pdf-sync-dot" />
              Live sync
            </div>

            <div className="pdf-side-section">
              <div className="pdf-side-label">Zoom</div>
              <div className="pdf-zoom-controls" aria-label="PDF zoom controls">
                <button
                  type="button"
                  className="pdf-control-button"
                  onClick={() => changeZoom(-0.25)}
                  disabled={zoom <= 1}
                  title="Zoom out"
                >
                  −
                </button>

                <button
                  type="button"
                  className="pdf-zoom-value"
                  onClick={resetZoom}
                  title="Reset zoom"
                >
                  {zoomPercent}%
                </button>

                <button
                  type="button"
                  className="pdf-control-button"
                  onClick={() => changeZoom(0.25)}
                  disabled={zoom >= 3}
                  title="Zoom in"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                className="pdf-fit-button"
                onClick={fitPage}
                title="Fit complete page"
              >
                Fit Page
              </button>
            </div>

            <div className="pdf-side-divider" />

            <div className="pdf-side-section pdf-page-section">
              <div className="pdf-side-label">Page</div>
              <div className="pdf-page-number">
                <strong>{safeCurrentPage}</strong>
                <span> / {totalPages || '—'}</span>
              </div>
              <div className="pdf-page-live">Following teacher</div>
            </div>

            <div className="pdf-side-divider" />

            <div className="pdf-side-hint">
              {zoom > 1
                ? 'Scroll the PDF to explore the enlarged page.'
                : 'Use + / − to make small PDF text easier to read.'}
            </div>
          </div>
        )}
      </aside>

      {/* Full-height PDF area. The side menu floats above it. */}
      <div ref={stageRef} className="pdf-stage">
        {loading && <div className="pdf-loading">Loading PDF...</div>}
        {error && <div className="pdf-error">{error}</div>}

        {!loading && !error && pdfDocument && (
          <div
            className="pdf-page-wrapper"
            key={`pdf-page-${safeCurrentPage}-${zoom}`}
          >
            <canvas
              ref={canvasRef}
              className="pdf-canvas"
            />

            <svg
              className="pdf-drawing-overlay"
              viewBox="0 0 1 1"
              preserveAspectRatio="none"
            >
              {Array.isArray(selectedPagePaths) &&
                selectedPagePaths.map((drawing, index) => {
                  if (
                    !drawing ||
                    !Array.isArray(drawing.points) ||
                    drawing.points.length === 0
                  ) {
                    return null;
                  }

                  return (
                    <path
                      key={drawing.id || `path-${index}`}
                      d={createSmoothPath(drawing.points)}
                      fill="none"
                      stroke={drawing.color || '#EF4444'}
                      strokeWidth={drawing.width || 0.012}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  );
                })}
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

export default PdfViewer;
