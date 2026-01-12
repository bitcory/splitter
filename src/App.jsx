import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import JSZip from 'jszip'
import './App.css'
import './fonts.css'

// 폰트 목록
const FONTS = [
  // 시스템 폰트
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Arial Black', value: 'Arial Black, sans-serif' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Times New Roman', value: 'Times New Roman, serif' },
  { name: 'Impact', value: 'Impact, sans-serif' },
  // 한글 폰트
  { name: '검은고딕 (Black Han Sans)', value: 'Black Han Sans' },
  { name: '카페24 써라운드', value: 'Cafe24 Ssurround' },
  { name: '창원단감', value: 'Changwon Dangam' },
  { name: '프리젠테이션', value: 'Freesentation' },
  { name: '고도', value: 'Godo' },
  { name: '고운돋움', value: 'Gowun Dodum' },
  { name: '학교안심 포스터', value: 'Hakgyoansim Poster' },
  { name: 'MBC 1961 굴림', value: 'MBC 1961 Gulim' },
  { name: 'MY 아리랑', value: 'MY Arirang' },
  { name: '페이퍼로지', value: 'Paperlogy' },
  { name: '파셜산스', value: 'Partial Sans' },
  { name: '프리텐다드', value: 'Pretendard' },
  { name: '레시피코리아', value: 'Recipekorea' },
  { name: '리아산스', value: 'Ria Sans' },
  { name: '스웨거', value: 'Swagger' },
  { name: '윤초록우산 어린이', value: 'Yoon Childfund' },
  { name: '아리따 부리', value: 'Arita Buri' },
  // 영문 폰트
  { name: 'Great Vibes', value: 'Great Vibes' },
  { name: 'Luckiest Guy', value: 'Luckiest Guy' },
  { name: 'Oh Chewy', value: 'Oh Chewy' },
  { name: 'Palladium', value: 'Palladium' },
  { name: 'SF Pro Display', value: 'SF Pro Display' },
]

// 분할 모드 정의
const SPLIT_MODES = {
  CROSS_4: { id: 'cross4', name: '2×2', icon: '┼', cols: 2, rows: 2 },
  GRID_2x3: { id: 'grid2x3', name: '2×3', icon: '▤', cols: 2, rows: 3 },
  GRID_3x2: { id: 'grid3x2', name: '3×2', icon: '▥', cols: 3, rows: 2 },
  GRID_3x3: { id: 'grid3x3', name: '3×3', icon: '▦', cols: 3, rows: 3 },
  GRID_3x4: { id: 'grid3x4', name: '3×4', icon: '▧', cols: 3, rows: 4 },
  GRID_4x3: { id: 'grid4x3', name: '4×3', icon: '▨', cols: 4, rows: 3 },
  GRID_4x4: { id: 'grid4x4', name: '4×4', icon: '▩', cols: 4, rows: 4 },
  VERTICAL_2: { id: 'vertical2', name: '세로 2분할', icon: '│', cols: 2, rows: 1 },
  VERTICAL_3: { id: 'vertical3', name: '세로 3분할', icon: '┆', cols: 3, rows: 1 },
  VERTICAL_4: { id: 'vertical4', name: '세로 4분할', icon: '┊', cols: 4, rows: 1 },
  HORIZONTAL_2: { id: 'horizontal2', name: '가로 2분할', icon: '─', cols: 1, rows: 2 },
  HORIZONTAL_3: { id: 'horizontal3', name: '가로 3분할', icon: '┄', cols: 1, rows: 3 },
  HORIZONTAL_4: { id: 'horizontal4', name: '가로 4분할', icon: '┈', cols: 1, rows: 4 },
  CUSTOM: { id: 'custom', name: '사용자 정의', icon: '✎', cols: 1, rows: 1, custom: true },
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

  // 텍스트 오버레이 설정
  const [textOverlays, setTextOverlays] = useState([])
  const [selectedTextIndex, setSelectedTextIndex] = useState(null)
  const [isAddingText, setIsAddingText] = useState(false)
  const [newTextInput, setNewTextInput] = useState('')

  // refs
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)
  const imageRef = useRef(null)

  // 드래그 상태
  const [isDragging, setIsDragging] = useState(false)
  const [dragLineIndex, setDragLineIndex] = useState(null)
  const [dragLineType, setDragLineType] = useState(null)
  const [trimDragState, setTrimDragState] = useState(null)
  const [textDragState, setTextDragState] = useState(null)
  const [textResizeState, setTextResizeState] = useState(null)

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
        setTextOverlays([])
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
      if (mode.custom) {
        // 사용자 정의 모드: 분할선 초기화 (빈 상태로)
        setSplitLines({ vertical: [], horizontal: [] })
      } else {
        initializeSplitLines(mode, targetWidth, targetHeight)
      }
    }
  }

  // 세로 분할선 추가
  const addVerticalLine = () => {
    const currentWidth = appliedTrim ? appliedTrim.width : imageSize.width
    const existingLines = [...splitLines.vertical].sort((a, b) => a - b)
    let newLinePos

    if (existingLines.length === 0) {
      newLinePos = currentWidth / 2
    } else {
      // 가장 넓은 간격 찾아서 중간에 추가
      let maxGap = existingLines[0]
      let maxGapStart = 0
      for (let i = 0; i <= existingLines.length; i++) {
        const start = i === 0 ? 0 : existingLines[i - 1]
        const end = i === existingLines.length ? currentWidth : existingLines[i]
        const gap = end - start
        if (gap > maxGap) {
          maxGap = gap
          maxGapStart = start
        }
      }
      newLinePos = maxGapStart + maxGap / 2
    }

    // 범위 내로 제한
    newLinePos = Math.max(10, Math.min(currentWidth - 10, newLinePos))

    setSplitLines(prev => ({
      ...prev,
      vertical: [...prev.vertical, newLinePos]
    }))
  }

  // 가로 분할선 추가
  const addHorizontalLine = () => {
    const currentHeight = appliedTrim ? appliedTrim.height : imageSize.height
    const existingLines = [...splitLines.horizontal].sort((a, b) => a - b)
    let newLinePos

    if (existingLines.length === 0) {
      newLinePos = currentHeight / 2
    } else {
      // 가장 넓은 간격 찾아서 중간에 추가
      let maxGap = existingLines[0]
      let maxGapStart = 0
      for (let i = 0; i <= existingLines.length; i++) {
        const start = i === 0 ? 0 : existingLines[i - 1]
        const end = i === existingLines.length ? currentHeight : existingLines[i]
        const gap = end - start
        if (gap > maxGap) {
          maxGap = gap
          maxGapStart = start
        }
      }
      newLinePos = maxGapStart + maxGap / 2
    }

    // 범위 내로 제한
    newLinePos = Math.max(10, Math.min(currentHeight - 10, newLinePos))

    setSplitLines(prev => ({
      ...prev,
      horizontal: [...prev.horizontal, newLinePos]
    }))
  }

  // 마지막 세로 분할선 삭제
  const removeVerticalLine = () => {
    if (splitLines.vertical.length > 0) {
      setSplitLines(prev => ({
        ...prev,
        vertical: prev.vertical.slice(0, -1)
      }))
    }
  }

  // 마지막 가로 분할선 삭제
  const removeHorizontalLine = () => {
    if (splitLines.horizontal.length > 0) {
      setSplitLines(prev => ({
        ...prev,
        horizontal: prev.horizontal.slice(0, -1)
      }))
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

  // 텍스트 바운딩 박스 계산
  const getTextBounds = (text, ctx) => {
    const fontSize = text.fontSize || 12
    ctx.font = `${fontSize}px ${text.fontFamily}`
    const metrics = ctx.measureText(text.content)
    return {
      x: text.x,
      y: text.y - fontSize,
      width: metrics.width,
      height: fontSize
    }
  }

  // 텍스트 리사이즈 핸들 체크
  const getTextResizeHandle = (coords, text, ctx) => {
    const bounds = getTextBounds(text, ctx)
    const currentWidth = appliedTrim ? appliedTrim.width : imageSize.width
    const handleSize = 20 * (currentWidth / canvasRef.current.getBoundingClientRect().width)

    // 우하단 코너 핸들
    const handleX = bounds.x + bounds.width
    const handleY = bounds.y + bounds.height

    if (Math.abs(coords.x - handleX) < handleSize && Math.abs(coords.y - handleY) < handleSize) {
      return 'se'
    }
    // 우상단 코너 핸들
    if (Math.abs(coords.x - handleX) < handleSize && Math.abs(coords.y - bounds.y) < handleSize) {
      return 'ne'
    }
    return null
  }

  // 텍스트 클릭 체크
  const getClickedTextIndex = (coords) => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    for (let i = textOverlays.length - 1; i >= 0; i--) {
      const text = textOverlays[i]
      const bounds = getTextBounds(text, ctx)

      if (
        coords.x >= bounds.x - 10 &&
        coords.x <= bounds.x + bounds.width + 10 &&
        coords.y >= bounds.y - 10 &&
        coords.y <= bounds.y + bounds.height + 10
      ) {
        return i
      }
    }
    return null
  }

  // 마우스 다운 핸들러
  const handleMouseDown = (e) => {
    if (!image) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const coords = getCanvasCoords(e, canvas)

    // 선택된 텍스트의 리사이즈 핸들 체크
    if (selectedTextIndex !== null) {
      const text = textOverlays[selectedTextIndex]
      const handle = getTextResizeHandle(coords, text, ctx)
      if (handle) {
        setTextResizeState({
          index: selectedTextIndex,
          handle,
          startCoords: coords,
          startFontSize: text.fontSize
        })
        return
      }
    }

    // 텍스트 클릭 체크
    const clickedTextIdx = getClickedTextIndex(coords)
    if (clickedTextIdx !== null) {
      // 리사이즈 핸들 체크
      const text = textOverlays[clickedTextIdx]
      const handle = getTextResizeHandle(coords, text, ctx)
      if (handle) {
        setSelectedTextIndex(clickedTextIdx)
        setTextResizeState({
          index: clickedTextIdx,
          handle,
          startCoords: coords,
          startFontSize: text.fontSize
        })
        return
      }

      // 이미 선택된 텍스트를 클릭하면 드래그 시작
      if (clickedTextIdx === selectedTextIndex) {
        setTextDragState({
          index: clickedTextIdx,
          startCoords: coords,
          startPos: { x: textOverlays[clickedTextIdx].x, y: textOverlays[clickedTextIdx].y }
        })
      } else {
        // 새 텍스트 선택 (드래그 없이)
        setSelectedTextIndex(clickedTextIdx)
      }
      return
    }

    setSelectedTextIndex(null)

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

    // 자유 모드 또는 사용자 정의 모드에서 분할선 드래그
    if (!isEqualMode || splitMode.custom) {
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

    // 텍스트 리사이즈
    if (textResizeState) {
      const dy = coords.y - textResizeState.startCoords.y
      const dx = coords.x - textResizeState.startCoords.x
      // 대각선 방향의 변화량을 사용
      const delta = textResizeState.handle === 'se' ? Math.max(dx, dy) : Math.max(dx, -dy)
      const newFontSize = Math.max(12, textResizeState.startFontSize + delta)
      const newOverlays = [...textOverlays]
      newOverlays[textResizeState.index] = {
        ...newOverlays[textResizeState.index],
        fontSize: Math.round(newFontSize)
      }
      setTextOverlays(newOverlays)
      return
    }

    // 텍스트 드래그
    if (textDragState) {
      const dx = coords.x - textDragState.startCoords.x
      const dy = coords.y - textDragState.startCoords.y
      const newOverlays = [...textOverlays]
      newOverlays[textDragState.index] = {
        ...newOverlays[textDragState.index],
        x: Math.max(0, Math.min(currentWidth, textDragState.startPos.x + dx)),
        y: Math.max(0, Math.min(currentHeight, textDragState.startPos.y + dy))
      }
      setTextOverlays(newOverlays)
      return
    }

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

    if (dragLineIndex !== null && (!isEqualMode || splitMode.custom)) {
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
    setTextDragState(null)
    setTextResizeState(null)
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

  // 텍스트 추가
  const addTextOverlay = () => {
    if (!newTextInput.trim()) return
    const currentWidth = appliedTrim ? appliedTrim.width : imageSize.width
    const currentHeight = appliedTrim ? appliedTrim.height : imageSize.height

    const newText = {
      content: newTextInput,
      x: currentWidth / 2,
      y: currentHeight / 2,
      fontSize: 250,
      fontFamily: 'Hakgyoansim Poster',
      color: '#ffffff',
      strokeColor: '#000000',
      strokeWidth: 10,
      hasStroke: true
    }
    setTextOverlays([...textOverlays, newText])
    setNewTextInput('')
    setIsAddingText(false)
    setSelectedTextIndex(textOverlays.length)
  }

  // 텍스트 삭제
  const deleteSelectedText = () => {
    if (selectedTextIndex === null) return
    const newOverlays = textOverlays.filter((_, i) => i !== selectedTextIndex)
    setTextOverlays(newOverlays)
    setSelectedTextIndex(null)
  }

  // 폰트 로드 카운터 (폰트 로드 시 리렌더 트리거용)
  const [fontLoadTrigger, setFontLoadTrigger] = useState(0)

  // 선택된 텍스트 업데이트
  const updateSelectedText = (updates) => {
    if (selectedTextIndex === null) return
    const newOverlays = [...textOverlays]
    newOverlays[selectedTextIndex] = { ...newOverlays[selectedTextIndex], ...updates }
    setTextOverlays(newOverlays)

    // 폰트 변경 시 폰트 로드 후 다시 그리기
    if (updates.fontFamily) {
      // 폰트를 명시적으로 로드 트리거
      const testDiv = document.createElement('div')
      testDiv.style.fontFamily = updates.fontFamily
      testDiv.style.position = 'absolute'
      testDiv.style.visibility = 'hidden'
      testDiv.textContent = '폰트 로드 테스트 Font Load Test'
      document.body.appendChild(testDiv)

      // 폰트 로드 완료 대기
      document.fonts.load(`16px "${updates.fontFamily}"`).then(() => {
        document.body.removeChild(testDiv)
        setFontLoadTrigger(prev => prev + 1)
      }).catch(() => {
        document.body.removeChild(testDiv)
        setFontLoadTrigger(prev => prev + 1)
      })
    }
  }

  // 캔버스에 텍스트 그리기
  const drawTextOverlays = (ctx, offsetX = 0, offsetY = 0, drawHandles = true) => {
    textOverlays.forEach((text, index) => {
      const fontSize = text.fontSize || 12
      ctx.font = `${fontSize}px ${text.fontFamily}`
      ctx.textBaseline = 'bottom'

      // 외곽선
      if (text.hasStroke && text.strokeWidth > 0) {
        ctx.strokeStyle = text.strokeColor
        ctx.lineWidth = text.strokeWidth
        ctx.strokeText(text.content, text.x - offsetX, text.y - offsetY)
      }

      // 텍스트
      ctx.fillStyle = text.color
      ctx.fillText(text.content, text.x - offsetX, text.y - offsetY)

      // 선택된 텍스트 표시 (핸들 포함)
      if (index === selectedTextIndex && drawHandles) {
        const metrics = ctx.measureText(text.content)
        const boxX = text.x - offsetX - 5
        const boxY = text.y - offsetY - fontSize - 5
        const boxW = metrics.width + 10
        const boxH = fontSize + 10

        // 선택 박스
        ctx.strokeStyle = '#4fc3f7'
        ctx.lineWidth = 2
        ctx.setLineDash([5, 5])
        ctx.strokeRect(boxX, boxY, boxW, boxH)
        ctx.setLineDash([])

        // 리사이즈 핸들 (우하단, 우상단)
        const handleSize = 10
        ctx.fillStyle = '#4fc3f7'

        // 우하단 핸들
        ctx.fillRect(
          boxX + boxW - handleSize / 2,
          boxY + boxH - handleSize / 2,
          handleSize,
          handleSize
        )
        // 우상단 핸들
        ctx.fillRect(
          boxX + boxW - handleSize / 2,
          boxY - handleSize / 2,
          handleSize,
          handleSize
        )
      }
    })
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

    // 텍스트 오버레이 그리기
    drawTextOverlays(ctx)

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
      // 분할선 그리기
      ctx.setLineDash([])
      ctx.strokeStyle = '#ff0000'
      ctx.lineWidth = 4

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
  }, [image, imageSize, splitLines, isTrimming, trimArea, appliedTrim, margin, textOverlays, selectedTextIndex, fontLoadTrigger])

  // 분할된 이미지 조각들 생성
  const splitPieces = useMemo(() => {
    if (!image) return []

    const sourceX = appliedTrim ? appliedTrim.x : 0
    const sourceY = appliedTrim ? appliedTrim.y : 0
    const sourceWidth = appliedTrim ? appliedTrim.width : imageSize.width
    const sourceHeight = appliedTrim ? appliedTrim.height : imageSize.height

    // 원본 배열을 변경하지 않도록 복사 후 정렬
    const sortedVertical = [...splitLines.vertical].sort((a, b) => a - b)
    const sortedHorizontal = [...splitLines.horizontal].sort((a, b) => a - b)

    // 유효한 범위 내의 선만 사용 (0과 sourceWidth/Height 사이)
    const validVertical = sortedVertical.filter(v => v > 0 && v < sourceWidth)
    const validHorizontal = sortedHorizontal.filter(h => h > 0 && h < sourceHeight)

    const verticalLines = [0, ...validVertical, sourceWidth]
    const horizontalLines = [0, ...validHorizontal, sourceHeight]

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

        // 좌표와 크기가 유효한지 확인
        const finalX = Math.max(0, Math.min(x, sourceWidth))
        const finalY = Math.max(0, Math.min(y, sourceHeight))
        const finalW = Math.max(1, Math.min(w, sourceWidth - finalX))
        const finalH = Math.max(1, Math.min(h, sourceHeight - finalY))

        if (finalW > 0 && finalH > 0) {
          const pieceCanvas = document.createElement('canvas')
          pieceCanvas.width = finalW
          pieceCanvas.height = finalH
          const pieceCtx = pieceCanvas.getContext('2d')
          pieceCtx.drawImage(image, sourceX + finalX, sourceY + finalY, finalW, finalH, 0, 0, finalW, finalH)

          // 텍스트 오버레이 그리기 (클리핑으로 경계에서 잘림)
          textOverlays.forEach((text) => {
            const textX = text.x - finalX
            const textY = text.y - finalY
            const fontSize = text.fontSize || 12

            // 클리핑 영역 설정 (조각 경계 내에서만 텍스트 표시)
            pieceCtx.save()
            pieceCtx.beginPath()
            pieceCtx.rect(0, 0, finalW, finalH)
            pieceCtx.clip()

            pieceCtx.font = `${fontSize}px ${text.fontFamily}`
            pieceCtx.textBaseline = 'bottom'

            if (text.hasStroke && text.strokeWidth > 0) {
              pieceCtx.strokeStyle = text.strokeColor
              pieceCtx.lineWidth = text.strokeWidth
              pieceCtx.strokeText(text.content, textX, textY)
            }

            pieceCtx.fillStyle = text.color
            pieceCtx.fillText(text.content, textX, textY)

            pieceCtx.restore()
          })

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
  }, [image, imageSize, splitLines, appliedTrim, margin, outputFormat, quality, textOverlays, fontLoadTrigger])

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
    const sourceWidth = appliedTrim ? appliedTrim.width : imageSize.width
    const sourceHeight = appliedTrim ? appliedTrim.height : imageSize.height

    // 사용자 정의 모드에서는 유효한 분할선 개수로 계산
    let cols, rows
    if (splitMode.custom) {
      const validVertical = splitLines.vertical.filter(v => v > 0 && v < sourceWidth)
      const validHorizontal = splitLines.horizontal.filter(h => h > 0 && h < sourceHeight)
      cols = validVertical.length + 1
      rows = validHorizontal.length + 1
    } else {
      cols = splitMode.cols
      rows = splitMode.rows
    }

    return {
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gridTemplateRows: `repeat(${rows}, 1fr)`
    }
  }, [splitMode, splitLines, appliedTrim, imageSize])

  const selectedText = selectedTextIndex !== null ? textOverlays[selectedTextIndex] : null

  return (
    <div className="app">
      {/* 헤더 */}
      <header className="header">
        <div className="header-content">
          <div className="header-title">
            <img src="/logo.svg" alt="Logo" className="header-logo" />
            <h1>IMAGE SPLITTER</h1>
          </div>
        </div>
      </header>

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

          {/* STEP 2: 텍스트 추가 */}
          <div className="setting-group">
            <label className="setting-label">STEP 2: 텍스트 추가</label>
            {isAddingText ? (
              <div className="text-input-row">
                <input
                  type="text"
                  value={newTextInput}
                  onChange={(e) => setNewTextInput(e.target.value)}
                  placeholder="텍스트 입력"
                  className="text-input"
                  onKeyDown={(e) => e.key === 'Enter' && addTextOverlay()}
                  autoFocus
                />
                <button className="trim-btn" onClick={addTextOverlay}>추가</button>
                <button className="trim-btn" onClick={() => setIsAddingText(false)}>취소</button>
              </div>
            ) : (
              <button
                className="trim-btn full-width"
                onClick={() => setIsAddingText(true)}
                disabled={!image}
              >
                + 텍스트 추가
              </button>
            )}

            {/* 선택된 텍스트 편집 */}
            {selectedText && (
              <div className="text-editor">
                <div className="text-editor-row">
                  <label>내용</label>
                  <input
                    type="text"
                    value={selectedText.content}
                    onChange={(e) => updateSelectedText({ content: e.target.value })}
                    className="text-input"
                  />
                </div>
                <div className="text-editor-row">
                  <label>폰트</label>
                  <select
                    value={selectedText.fontFamily}
                    onChange={(e) => updateSelectedText({ fontFamily: e.target.value })}
                    className="font-select"
                  >
                    {FONTS.map(font => (
                      <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                        {font.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-editor-row">
                  <label>크기</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={selectedText.fontSize}
                    onChange={(e) => {
                      const val = e.target.value
                      // 숫자만 허용
                      if (val === '' || /^\d+$/.test(val)) {
                        updateSelectedText({ fontSize: val === '' ? '' : Number(val) })
                      }
                    }}
                    onBlur={(e) => {
                      const val = Number(e.target.value)
                      if (!val || val < 12) {
                        updateSelectedText({ fontSize: 12 })
                      }
                    }}
                    className="size-input"
                  />
                  <span>px</span>
                </div>
                <div className="text-editor-row">
                  <label>색상</label>
                  <input
                    type="color"
                    value={selectedText.color}
                    onChange={(e) => updateSelectedText({ color: e.target.value })}
                  />
                  <label>외곽선</label>
                  <input
                    type="color"
                    value={selectedText.strokeColor}
                    onChange={(e) => updateSelectedText({ strokeColor: e.target.value })}
                  />
                </div>
                <div className="text-editor-row">
                  <label>외곽선 두께</label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={selectedText.strokeWidth}
                    onChange={(e) => updateSelectedText({ strokeWidth: Number(e.target.value) })}
                  />
                  <span>{selectedText.strokeWidth}px</span>
                </div>
                <button className="delete-text-btn" onClick={deleteSelectedText}>
                  텍스트 삭제
                </button>
              </div>
            )}

            {textOverlays.length > 0 && (
              <p className="setting-hint">클릭: 선택 → 다시 클릭 후 드래그: 이동</p>
            )}
          </div>

          {/* STEP 3: 조정 모드 */}
          <div className="setting-group">
            <label className="setting-label">STEP 3: 분할선 조정</label>
            {splitMode.custom ? (
              <>
                <div className="custom-lines-control">
                  <div className="line-control-row">
                    <span className="line-label">세로선 ({splitLines.vertical.length})</span>
                    <button className="line-btn" onClick={addVerticalLine} disabled={!image}>+</button>
                    <button className="line-btn" onClick={removeVerticalLine} disabled={!image || splitLines.vertical.length === 0}>−</button>
                  </div>
                  <div className="line-control-row">
                    <span className="line-label">가로선 ({splitLines.horizontal.length})</span>
                    <button className="line-btn" onClick={addHorizontalLine} disabled={!image}>+</button>
                    <button className="line-btn" onClick={removeHorizontalLine} disabled={!image || splitLines.horizontal.length === 0}>−</button>
                  </div>
                </div>
                <p className="setting-hint">분할선을 드래그하여 위치 조정</p>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>

          {/* STEP 4: 마진 */}
          <div className="setting-group">
            <label className="setting-label">STEP 4: 마진 (분할선 양옆 제거)</label>
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

          {/* STEP 5: 출력 설정 */}
          <div className="setting-group">
            <label className="setting-label">STEP 5: 출력 설정</label>
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
            <label className="setting-label">STEP 6: 다운로드</label>
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
