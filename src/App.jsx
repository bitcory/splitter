import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import JSZip from 'jszip'
import './App.css'

// 분할 모드 정의
const SPLIT_MODES = {
  CROSS_4: { id: 'cross4', name: '십자', icon: '┼', cols: 2, rows: 2 },
  VERTICAL_2: { id: 'vertical2', name: '세로 2분할', icon: '│', cols: 2, rows: 1 },
  VERTICAL_3: { id: 'vertical3', name: '세로 3분할', icon: '┆', cols: 3, rows: 1 },
  VERTICAL_4: { id: 'vertical4', name: '세로 4분할', icon: '┊', cols: 4, rows: 1 },
  HORIZONTAL_2: { id: 'horizontal2', name: '가로 2분할', icon: '─', cols: 1, rows: 2 },
  HORIZONTAL_3: { id: 'horizontal3', name: '가로 3분할', icon: '┄', cols: 1, rows: 3 },
  HORIZONTAL_4: { id: 'horizontal4', name: '가로 4분할', icon: '┈', cols: 1, rows: 4 },
}

function App() {
  // 이미지 상태
  const [image, setImage] = useState(null)
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })

  // 분할 설정
  const [splitMode, setSplitMode] = useState(SPLIT_MODES.CROSS_4)
  const [isEqualMode, setIsEqualMode] = useState(true)
  const [splitLines, setSplitLines] = useState({ vertical: [], horizontal: [] })

  // 트리밍 설정
  const [isTrimming, setIsTrimming] = useState(false)
  const [trimArea, setTrimArea] = useState(null)
  const [appliedTrim, setAppliedTrim] = useState(null)

  // 마진 설정
  const [margin, setMargin] = useState(0)

  // 출력 설정
  const [outputFormat, setOutputFormat] = useState('jpeg')
  const [quality, setQuality] = useState(90)

  // refs
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)
  const imageRef = useRef(null)

  // 드래그 상태
  const [isDragging, setIsDragging] = useState(false)
  const [dragLineIndex, setDragLineIndex] = useState(null)
  const [dragLineType, setDragLineType] = useState(null)
  const [trimDragState, setTrimDragState] = useState(null)

  // 분할선 초기화 (등분 모드)
  const initializeSplitLines = useCallback((mode, width, height) => {
    const vertical = []
    const horizontal = []

    for (let i = 1; i < mode.cols; i++) {
      vertical.push((width / mode.cols) * i)
    }

    for (let i = 1; i < mode.rows; i++) {
      horizontal.push((height / mode.rows) * i)
    }

    setSplitLines({ vertical, horizontal })
  }, [])

  // 이미지 로드
  const loadImage = (file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        setImage(img)
        setImageSize({ width: img.width, height: img.height })
        imageRef.current = img
        initializeSplitLines(splitMode, img.width, img.height)
        setAppliedTrim(null)
        setTrimArea(null)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  }

  // 파일 드롭 핸들러
  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      loadImage(file)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  // 파일 선택 핸들러
  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      loadImage(file)
    }
  }

  // 분할 모드 변경
  const handleSplitModeChange = (mode) => {
    setSplitMode(mode)
    if (imageSize.width > 0) {
      const targetWidth = appliedTrim ? appliedTrim.width : imageSize.width
      const targetHeight = appliedTrim ? appliedTrim.height : imageSize.height
      initializeSplitLines(mode, targetWidth, targetHeight)
    }
  }

  // 캔버스 좌표 계산
  const getCanvasCoords = (e, canvas) => {
    const rect = canvas.getBoundingClientRect()
    const currentWidth = appliedTrim ? appliedTrim.width : imageSize.width
    const currentHeight = appliedTrim ? appliedTrim.height : imageSize.height
    const scaleX = currentWidth / rect.width
    const scaleY = currentHeight / rect.height
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    }
  }

  // 마우스 다운 핸들러
  const handleMouseDown = (e) => {
    if (!image) return
    const canvas = canvasRef.current
    const coords = getCanvasCoords(e, canvas)

    // 트리밍 모드
    if (isTrimming) {
      if (trimArea) {
        const handle = getTrimHandle(coords, trimArea)
        if (handle) {
          setTrimDragState({ type: 'resize', handle, startCoords: coords, startArea: { ...trimArea } })
          return
        }
        if (isInsideTrimArea(coords, trimArea)) {
          setTrimDragState({ type: 'move', startCoords: coords, startArea: { ...trimArea } })
          return
        }
      }
      setTrimArea({ x: coords.x, y: coords.y, width: 0, height: 0 })
      setTrimDragState({ type: 'new', startCoords: coords })
      return
    }

    // 자유 모드에서 분할선 드래그
    if (!isEqualMode) {
      const currentWidth = appliedTrim ? appliedTrim.width : imageSize.width
      const threshold = 10 * (currentWidth / canvas.getBoundingClientRect().width)

      for (let i = 0; i < splitLines.vertical.length; i++) {
        if (Math.abs(coords.x - splitLines.vertical[i]) < threshold) {
          setDragLineIndex(i)
          setDragLineType('vertical')
          return
        }
      }

      for (let i = 0; i < splitLines.horizontal.length; i++) {
        if (Math.abs(coords.y - splitLines.horizontal[i]) < threshold) {
          setDragLineIndex(i)
          setDragLineType('horizontal')
          return
        }
      }
    }
  }

  // 마우스 이동 핸들러
  const handleMouseMove = (e) => {
    if (!image) return
    const canvas = canvasRef.current
    const coords = getCanvasCoords(e, canvas)
    const currentWidth = appliedTrim ? appliedTrim.width : imageSize.width
    const currentHeight = appliedTrim ? appliedTrim.height : imageSize.height

    if (trimDragState) {
      if (trimDragState.type === 'new') {
        const newArea = {
          x: Math.min(trimDragState.startCoords.x, coords.x),
          y: Math.min(trimDragState.startCoords.y, coords.y),
          width: Math.abs(coords.x - trimDragState.startCoords.x),
          height: Math.abs(coords.y - trimDragState.startCoords.y)
        }
        setTrimArea(newArea)
      } else if (trimDragState.type === 'move') {
        const dx = coords.x - trimDragState.startCoords.x
        const dy = coords.y - trimDragState.startCoords.y
        setTrimArea({
          ...trimDragState.startArea,
          x: Math.max(0, Math.min(currentWidth - trimDragState.startArea.width, trimDragState.startArea.x + dx)),
          y: Math.max(0, Math.min(currentHeight - trimDragState.startArea.height, trimDragState.startArea.y + dy))
        })
      } else if (trimDragState.type === 'resize') {
        const newArea = resizeTrimArea(trimDragState.startArea, trimDragState.handle, coords, trimDragState.startCoords)
        setTrimArea(newArea)
      }
      return
    }

    if (dragLineIndex !== null && !isEqualMode) {
      const newLines = { ...splitLines }
      if (dragLineType === 'vertical') {
        newLines.vertical = [...splitLines.vertical]
        newLines.vertical[dragLineIndex] = Math.max(10, Math.min(currentWidth - 10, coords.x))
      } else {
        newLines.horizontal = [...splitLines.horizontal]
        newLines.horizontal[dragLineIndex] = Math.max(10, Math.min(currentHeight - 10, coords.y))
      }
      setSplitLines(newLines)
    }
  }

  const handleMouseUp = () => {
    setDragLineIndex(null)
    setDragLineType(null)
    setTrimDragState(null)
  }

  const getTrimHandle = (coords, area) => {
    const currentWidth = appliedTrim ? appliedTrim.width : imageSize.width
    const handleSize = 15 * (currentWidth / canvasRef.current.getBoundingClientRect().width)
    const handles = [
      { name: 'nw', x: area.x, y: area.y },
      { name: 'ne', x: area.x + area.width, y: area.y },
      { name: 'sw', x: area.x, y: area.y + area.height },
      { name: 'se', x: area.x + area.width, y: area.y + area.height },
    ]
    for (const handle of handles) {
      if (Math.abs(coords.x - handle.x) < handleSize && Math.abs(coords.y - handle.y) < handleSize) {
        return handle.name
      }
    }
    return null
  }

  const isInsideTrimArea = (coords, area) => {
    return coords.x >= area.x && coords.x <= area.x + area.width &&
           coords.y >= area.y && coords.y <= area.y + area.height
  }

  const resizeTrimArea = (startArea, handle, coords, startCoords) => {
    const currentWidth = appliedTrim ? appliedTrim.width : imageSize.width
    const currentHeight = appliedTrim ? appliedTrim.height : imageSize.height
    let newArea = { ...startArea }
    const dx = coords.x - startCoords.x
    const dy = coords.y - startCoords.y

    if (handle.includes('w')) {
      newArea.x = Math.max(0, startArea.x + dx)
      newArea.width = startArea.width - dx
    }
    if (handle.includes('e')) {
      newArea.width = Math.min(currentWidth - startArea.x, startArea.width + dx)
    }
    if (handle.includes('n')) {
      newArea.y = Math.max(0, startArea.y + dy)
      newArea.height = startArea.height - dy
    }
    if (handle.includes('s')) {
      newArea.height = Math.min(currentHeight - startArea.y, startArea.height + dy)
    }

    if (newArea.width < 20) newArea.width = 20
    if (newArea.height < 20) newArea.height = 20

    return newArea
  }

  const applyTrim = () => {
    if (trimArea && trimArea.width > 0 && trimArea.height > 0) {
      setAppliedTrim(trimArea)
      initializeSplitLines(splitMode, trimArea.width, trimArea.height)
      setIsTrimming(false)
      setTrimArea(null)
    }
  }

  const cancelTrim = () => {
    setAppliedTrim(null)
    setTrimArea(null)
    setIsTrimming(false)
    if (imageSize.width > 0) {
      initializeSplitLines(splitMode, imageSize.width, imageSize.height)
    }
  }

  // 캔버스 그리기
  useEffect(() => {
    if (!image || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    const drawWidth = appliedTrim ? appliedTrim.width : imageSize.width
    const drawHeight = appliedTrim ? appliedTrim.height : imageSize.height

    canvas.width = drawWidth
    canvas.height = drawHeight

    if (appliedTrim) {
      ctx.drawImage(image, appliedTrim.x, appliedTrim.y, appliedTrim.width, appliedTrim.height, 0, 0, drawWidth, drawHeight)
    } else {
      ctx.drawImage(image, 0, 0)
    }

    if (isTrimming && !appliedTrim) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillRect(0, 0, imageSize.width, imageSize.height)

      if (trimArea && trimArea.width > 0 && trimArea.height > 0) {
        ctx.drawImage(image, trimArea.x, trimArea.y, trimArea.width, trimArea.height, trimArea.x, trimArea.y, trimArea.width, trimArea.height)
        ctx.strokeStyle = '#00ff00'
        ctx.lineWidth = 2
        ctx.strokeRect(trimArea.x, trimArea.y, trimArea.width, trimArea.height)

        const handleSize = 8
        ctx.fillStyle = '#00ff00'
        const handles = [
          { x: trimArea.x, y: trimArea.y },
          { x: trimArea.x + trimArea.width, y: trimArea.y },
          { x: trimArea.x, y: trimArea.y + trimArea.height },
          { x: trimArea.x + trimArea.width, y: trimArea.y + trimArea.height },
        ]
        handles.forEach(h => {
          ctx.fillRect(h.x - handleSize/2, h.y - handleSize/2, handleSize, handleSize)
        })
      }
    } else {
      ctx.strokeStyle = '#ff0000'
      ctx.lineWidth = 2
      ctx.setLineDash([10, 5])

      splitLines.vertical.forEach(x => {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, drawHeight)
        ctx.stroke()
      })

      splitLines.horizontal.forEach(y => {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(drawWidth, y)
        ctx.stroke()
      })

      if (margin > 0) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)'
        splitLines.vertical.forEach(x => {
          ctx.fillRect(x - margin, 0, margin * 2, drawHeight)
        })
        splitLines.horizontal.forEach(y => {
          ctx.fillRect(0, y - margin, drawWidth, margin * 2)
        })
      }
    }
  }, [image, imageSize, splitLines, isTrimming, trimArea, appliedTrim, margin])

  // 분할된 이미지 조각들 생성
  const splitPieces = useMemo(() => {
    if (!image) return []

    const sourceX = appliedTrim ? appliedTrim.x : 0
    const sourceY = appliedTrim ? appliedTrim.y : 0
    const sourceWidth = appliedTrim ? appliedTrim.width : imageSize.width
    const sourceHeight = appliedTrim ? appliedTrim.height : imageSize.height

    const verticalLines = [0, ...splitLines.vertical.sort((a, b) => a - b), sourceWidth]
    const horizontalLines = [0, ...splitLines.horizontal.sort((a, b) => a - b), sourceHeight]

    const pieces = []

    for (let row = 0; row < horizontalLines.length - 1; row++) {
      for (let col = 0; col < verticalLines.length - 1; col++) {
        let x = verticalLines[col]
        let y = horizontalLines[row]
        let w = verticalLines[col + 1] - x
        let h = horizontalLines[row + 1] - y

        if (col > 0) { x += margin; w -= margin; }
        if (col < verticalLines.length - 2) { w -= margin; }
        if (row > 0) { y += margin; h -= margin; }
        if (row < horizontalLines.length - 2) { h -= margin; }

        if (w > 0 && h > 0) {
          const pieceCanvas = document.createElement('canvas')
          pieceCanvas.width = w
          pieceCanvas.height = h
          const pieceCtx = pieceCanvas.getContext('2d')
          pieceCtx.drawImage(image, sourceX + x, sourceY + y, w, h, 0, 0, w, h)

          pieces.push({
            canvas: pieceCanvas,
            dataUrl: pieceCanvas.toDataURL(`image/${outputFormat}`, quality / 100),
            name: `split_${row + 1}_${col + 1}`,
            row,
            col
          })
        }
      }
    }

    return pieces
  }, [image, imageSize, splitLines, appliedTrim, margin, outputFormat, quality])

  // 개별 다운로드
  const downloadPiece = (piece) => {
    const extension = outputFormat === 'jpeg' ? 'jpg' : outputFormat
    const link = document.createElement('a')
    link.download = `${piece.name}.${extension}`
    link.href = piece.dataUrl
    link.click()
  }

  // 전체 다운로드
  const downloadAll = () => {
    splitPieces.forEach(piece => downloadPiece(piece))
  }

  // ZIP 다운로드
  const downloadZip = async () => {
    const zip = new JSZip()
    const extension = outputFormat === 'jpeg' ? 'jpg' : outputFormat

    for (const piece of splitPieces) {
      const base64Data = piece.dataUrl.split(',')[1]
      zip.file(`${piece.name}.${extension}`, base64Data, { base64: true })
    }

    const blob = await zip.generateAsync({ type: 'blob' })
    const link = document.createElement('a')
    link.download = 'split_images.zip'
    link.href = URL.createObjectURL(blob)
    link.click()
    URL.revokeObjectURL(link.href)
  }

  // 미리보기 그리드 레이아웃 계산
  const previewGridStyle = useMemo(() => {
    return {
      gridTemplateColumns: `repeat(${splitMode.cols}, 1fr)`,
      gridTemplateRows: `repeat(${splitMode.rows}, 1fr)`
    }
  }, [splitMode])

  return (
    <div className="app">
      {/* 헤더 */}
      <header className="header">
        <div className="logo">
          <div className="logo-icon">TB</div>
          <div className="logo-text">
            <span className="logo-title">AI CREW</span>
            <span className="logo-subtitle">TB IMAGE SPLITTER</span>
          </div>
        </div>
      </header>

      {/* 메인 타이틀 */}
      <div className="page-title">
        <h1>IMAGE SPLITTER</h1>
        <p>이미지를 분할하는 도구</p>
      </div>

      {/* 메인 컨텐츠 */}
      <main className="main">
        {/* 프리뷰 섹션 */}
        <section className="preview-panel">
          <div className="panel-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21,15 16,10 5,21"/>
            </svg>
            <span>PREVIEW</span>
          </div>

          <div
            className={`preview-area ${isDragging ? 'dragging' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !image && fileInputRef.current?.click()}
          >
            {!image ? (
              <div className="upload-placeholder">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17,8 12,3 7,8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <p>이미지를 드래그하거나<br/>클릭하여 업로드</p>
              </div>
            ) : (
              <div className="canvas-wrapper">
                <canvas
                  ref={canvasRef}
                  className="canvas"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleMouseDown}
                  onTouchMove={handleMouseMove}
                  onTouchEnd={handleMouseUp}
                />
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>

          {/* 분할 미리보기 */}
          {image && splitPieces.length > 0 && (
            <div className="split-preview">
              <div className="split-preview-header">
                <span>분할 결과 미리보기</span>
                <span className="preview-hint">클릭하여 개별 다운로드</span>
              </div>
              <div className="split-preview-grid" style={previewGridStyle}>
                {splitPieces.map((piece, index) => (
                  <div
                    key={index}
                    className="split-preview-item"
                    onClick={() => downloadPiece(piece)}
                  >
                    <img src={piece.dataUrl} alt={piece.name} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* 설정 섹션 */}
        <section className="settings-panel">
          <div className="panel-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            <span>SETTINGS</span>
          </div>

          {/* 분할 방향 */}
          <div className="setting-group">
            <label className="setting-label">분할 방향</label>
            <div className="split-modes">
              {Object.values(SPLIT_MODES).map(mode => (
                <button
                  key={mode.id}
                  className={`mode-btn ${splitMode.id === mode.id ? 'active' : ''}`}
                  onClick={() => handleSplitModeChange(mode)}
                >
                  <span className="mode-icon">{mode.icon}</span>
                  <span className="mode-name">{mode.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* STEP 1: 트리밍 */}
          <div className="setting-group">
            <label className="setting-label">STEP 1: 트리밍</label>
            <div className="trim-buttons">
              <button
                className={`trim-btn ${isTrimming ? 'active' : ''}`}
                onClick={() => setIsTrimming(true)}
                disabled={!image}
              >
                선택
              </button>
              <button
                className="trim-btn"
                onClick={applyTrim}
                disabled={!trimArea || trimArea.width === 0}
              >
                확정
              </button>
              <button
                className="trim-btn"
                onClick={cancelTrim}
                disabled={!appliedTrim && !isTrimming}
              >
                해제
              </button>
            </div>
            <p className="setting-hint">"선택"을 클릭하여 트리밍 범위를 드래그</p>
          </div>

          {/* STEP 2: 조정 모드 */}
          <div className="setting-group">
            <label className="setting-label">STEP 2: 분할선 조정</label>
            <div className="mode-toggle">
              <button
                className={`toggle-btn ${isEqualMode ? 'active' : ''}`}
                onClick={() => {
                  setIsEqualMode(true)
                  if (image) {
                    const w = appliedTrim ? appliedTrim.width : imageSize.width
                    const h = appliedTrim ? appliedTrim.height : imageSize.height
                    initializeSplitLines(splitMode, w, h)
                  }
                }}
              >
                등분
              </button>
              <button
                className={`toggle-btn ${!isEqualMode ? 'active' : ''}`}
                onClick={() => setIsEqualMode(false)}
              >
                자유
              </button>
            </div>
            {!isEqualMode && (
              <p className="setting-hint">분할선을 드래그하여 위치 조정</p>
            )}
          </div>

          {/* STEP 3: 마진 */}
          <div className="setting-group">
            <label className="setting-label">STEP 3: 마진 (분할선 양옆 제거)</label>
            <div className="margin-control">
              <input
                type="range"
                min="0"
                max="50"
                value={margin}
                onChange={(e) => setMargin(Number(e.target.value))}
              />
              <div className="margin-value">
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={margin}
                  onChange={(e) => setMargin(Number(e.target.value))}
                />
                <span>px</span>
              </div>
            </div>
          </div>

          {/* STEP 4: 출력 설정 */}
          <div className="setting-group">
            <label className="setting-label">STEP 4: 출력 설정</label>
            <div className="format-buttons">
              {['jpeg', 'png', 'webp'].map(format => (
                <button
                  key={format}
                  className={`format-btn ${outputFormat === format ? 'active' : ''}`}
                  onClick={() => setOutputFormat(format)}
                >
                  {format.toUpperCase()}
                </button>
              ))}
            </div>
            {outputFormat !== 'png' && (
              <div className="quality-control">
                <span>품질: {quality}%</span>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                />
              </div>
            )}
          </div>

          {/* 다운로드 버튼 */}
          <div className="setting-group">
            <label className="setting-label">STEP 5: 다운로드</label>
            <div className="download-buttons">
              <button
                className="download-btn"
                onClick={downloadAll}
                disabled={!image}
              >
                개별 다운로드
              </button>
              <button
                className="download-btn primary"
                onClick={downloadZip}
                disabled={!image}
              >
                ZIP 다운로드
              </button>
            </div>
          </div>

          {/* 이미지 변경 버튼 */}
          {image && (
            <div className="setting-group">
              <button
                className="change-image-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                이미지 변경
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
