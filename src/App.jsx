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

// 합치기 그리드 옵션 (1~4 범위)
const MERGE_GRID_OPTIONS = [
  { id: '1x1', cols: 1, rows: 1, name: '1×1' },
  { id: '1x2', cols: 1, rows: 2, name: '1×2' },
  { id: '1x3', cols: 1, rows: 3, name: '1×3' },
  { id: '1x4', cols: 1, rows: 4, name: '1×4' },
  { id: '2x1', cols: 2, rows: 1, name: '2×1' },
  { id: '2x2', cols: 2, rows: 2, name: '2×2' },
  { id: '2x3', cols: 2, rows: 3, name: '2×3' },
  { id: '2x4', cols: 2, rows: 4, name: '2×4' },
  { id: '3x1', cols: 3, rows: 1, name: '3×1' },
  { id: '3x2', cols: 3, rows: 2, name: '3×2' },
  { id: '3x3', cols: 3, rows: 3, name: '3×3' },
  { id: '3x4', cols: 3, rows: 4, name: '3×4' },
  { id: '4x1', cols: 4, rows: 1, name: '4×1' },
  { id: '4x2', cols: 4, rows: 2, name: '4×2' },
  { id: '4x3', cols: 4, rows: 3, name: '4×3' },
  { id: '4x4', cols: 4, rows: 4, name: '4×4' },
]

// 출력 크기 프리셋
const SIZE_PRESETS = [
  { id: '1:1', width: 1080, height: 1080, name: '1:1' },
  { id: '9:16', width: 1080, height: 1920, name: '9:16' },
  { id: '3:4', width: 1080, height: 1440, name: '3:4' },
  { id: '4:3', width: 1440, height: 1080, name: '4:3' },
  { id: '16:9', width: 1920, height: 1080, name: '16:9' },
]

// 다국어 텍스트
const TRANSLATIONS = {
  ko: {
    // 앱 모드
    mode_split: '분할하기',
    mode_merge: '합치기',
    // 분할 모드
    mode_cross4: '2×2',
    mode_grid2x3: '2×3',
    mode_grid3x2: '3×2',
    mode_grid3x3: '3×3',
    mode_grid3x4: '3×4',
    mode_grid4x3: '4×3',
    mode_grid4x4: '4×4',
    mode_vertical2: '세로 2분할',
    mode_vertical3: '세로 3분할',
    mode_vertical4: '세로 4분할',
    mode_horizontal2: '가로 2분할',
    mode_horizontal3: '가로 3분할',
    mode_horizontal4: '가로 4분할',
    mode_custom: '사용자 정의',
    // UI 텍스트
    preview: 'PREVIEW',
    settings: 'SETTINGS',
    uploadHint: '이미지를 드래그하거나\n클릭하여 업로드',
    splitPreview: '분할 결과 미리보기',
    clickToDownload: '클릭하여 개별 다운로드',
    splitDirection: '분할 방향',
    step1_splitLines: 'STEP 1: 분할선 조정',
    step1: 'STEP 1: 임의수정',
    step2_crop: 'STEP 2: 임의수정',
    step1Hint: '"선택"을 클릭하여 임의수정 범위를 드래그',
    select: '선택',
    confirm: '확정',
    release: '해제',
    step2: 'STEP 2: 텍스트 추가',
    step3_text: 'STEP 3: 텍스트 추가',
    textPlaceholder: '텍스트 입력',
    add: '추가',
    cancel: '취소',
    addText: '+ 텍스트 추가',
    content: '내용',
    font: '폰트',
    size: '크기',
    color: '색상',
    stroke: '외곽선',
    strokeWidth: '외곽선 두께',
    deleteText: '텍스트 삭제',
    textHint: '클릭: 선택 → 다시 클릭 후 드래그: 이동',
    step3: 'STEP 3: 분할선 조정',
    verticalLine: '세로선',
    horizontalLine: '가로선',
    dragHint: '분할선을 드래그하여 위치 조정',
    equal: '등분',
    free: '자유',
    step4: 'STEP 4: 출력 설정',
    upscale: '업스케일링',
    upscale1x: '원본',
    upscale2x: '2배',
    upscale4x: '4배',
    step5: 'STEP 5: 다운로드',
    downloadEach: '개별 다운로드',
    downloadZip: '전체 다운로드',
    changeImage: '새로 시작',
    // 합치기 모드
    mergeGridSelect: '그리드 선택',
    mergeGridCustom: '사용자 정의',
    mergeGridCols: '가로',
    mergeGridRows: '세로',
    mergeGridApply: '적용',
    mergeOutputSize: '출력 크기',
    mergeCustomSize: '사용자 정의',
    mergeCellAdjust: '이미지 조정',
    mergeScale: '크기',
    mergeCenterAlign: '중앙',
    mergeFillCell: '채우기',
    mergeFitCell: '맞추기',
    mergeRemoveImage: '삭제',
    mergeDownload: '합쳐진 이미지 다운로드',
    mergeDropHint: '클릭하여 이미지 추가',
    mergeResetAll: '모두 초기화',
  },
  en: {
    // 앱 모드
    mode_split: 'Split',
    mode_merge: 'Merge',
    // 분할 모드
    mode_cross4: '2×2',
    mode_grid2x3: '2×3',
    mode_grid3x2: '3×2',
    mode_grid3x3: '3×3',
    mode_grid3x4: '3×4',
    mode_grid4x3: '4×3',
    mode_grid4x4: '4×4',
    mode_vertical2: 'Vertical 2',
    mode_vertical3: 'Vertical 3',
    mode_vertical4: 'Vertical 4',
    mode_horizontal2: 'Horizontal 2',
    mode_horizontal3: 'Horizontal 3',
    mode_horizontal4: 'Horizontal 4',
    mode_custom: 'Custom',
    // UI 텍스트
    preview: 'PREVIEW',
    settings: 'SETTINGS',
    uploadHint: 'Drag image here or\nclick to upload',
    splitPreview: 'Split Preview',
    clickToDownload: 'Click to download individually',
    splitDirection: 'Split Mode',
    step1_splitLines: 'STEP 1: Split Lines',
    step1: 'STEP 1: Crop',
    step2_crop: 'STEP 2: Crop',
    step1Hint: 'Click "Select" to drag crop area',
    select: 'Select',
    confirm: 'Apply',
    release: 'Reset',
    step2: 'STEP 2: Add Text',
    step3_text: 'STEP 3: Add Text',
    textPlaceholder: 'Enter text',
    add: 'Add',
    cancel: 'Cancel',
    addText: '+ Add Text',
    content: 'Content',
    font: 'Font',
    size: 'Size',
    color: 'Color',
    stroke: 'Stroke',
    strokeWidth: 'Stroke Width',
    deleteText: 'Delete Text',
    textHint: 'Click: Select → Click again + drag: Move',
    step3: 'STEP 3: Split Lines',
    verticalLine: 'Vertical',
    horizontalLine: 'Horizontal',
    dragHint: 'Drag split lines to adjust position',
    equal: 'Equal',
    free: 'Free',
    step4: 'STEP 4: Output Settings',
    upscale: 'Upscaling',
    upscale1x: '1x',
    upscale2x: '2x',
    upscale4x: '4x',
    step5: 'STEP 5: Download',
    downloadEach: 'Download Each',
    downloadZip: 'Download All',
    changeImage: 'Start Over',
    // 합치기 모드
    mergeGridSelect: 'Grid Selection',
    mergeGridCustom: 'Custom',
    mergeGridCols: 'Cols',
    mergeGridRows: 'Rows',
    mergeGridApply: 'Apply',
    mergeOutputSize: 'Output Size',
    mergeCustomSize: 'Custom',
    mergeCellAdjust: 'Image Adjustment',
    mergeScale: 'Scale',
    mergeCenterAlign: 'Center',
    mergeFillCell: 'Fill',
    mergeFitCell: 'Fit',
    mergeRemoveImage: 'Remove',
    mergeDownload: 'Download Merged Image',
    mergeDropHint: 'Click to add image',
    mergeResetAll: 'Reset All',
  }
}

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
  // 언어 설정
  const [locale, setLocale] = useState('ko')
  const t = TRANSLATIONS[locale]

  // 앱 모드 (split: 분할, merge: 합치기)
  const [appMode, setAppMode] = useState('split')

  // 합치기 모드 상태
  const [mergeGrid, setMergeGrid] = useState({ cols: 2, rows: 2 })
  const [mergeCanvasSize, setMergeCanvasSize] = useState({ width: 1080, height: 1080 })
  const [cellImages, setCellImages] = useState({})
  const [selectedCell, setSelectedCell] = useState(null)
  const [cellDragState, setCellDragState] = useState(null)
  const [snapGuides, setSnapGuides] = useState({ vertical: [], horizontal: [] })
  const [customGridInput, setCustomGridInput] = useState({ cols: '', rows: '' })
  const [isMergeDragging, setIsMergeDragging] = useState(false)
  const [hoverCell, setHoverCell] = useState(null)
  // 합치기 모드 텍스트 오버레이
  const [mergeTextOverlays, setMergeTextOverlays] = useState([])
  const [selectedMergeTextIndex, setSelectedMergeTextIndex] = useState(null)
  const [mergeTextDragState, setMergeTextDragState] = useState(null)
  const [newMergeTextInput, setNewMergeTextInput] = useState('')
  const mergeCanvasRef = useRef(null)
  const cellFileInputRef = useRef(null)

  // 이미지 상태
  const [image, setImage] = useState(null)
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  const [originalFileName, setOriginalFileName] = useState('image')

  // 분할 설정
  const [splitMode, setSplitMode] = useState(SPLIT_MODES.CROSS_4)
  const [isEqualMode, setIsEqualMode] = useState(true)
  const [splitLines, setSplitLines] = useState({ vertical: [], horizontal: [] })

  // 임의수정 설정
  const [isTrimming, setIsTrimming] = useState(false)
  const [trimArea, setTrimArea] = useState(null)
  const [appliedTrim, setAppliedTrim] = useState(null)


  // 출력 설정
  const [outputFormat, setOutputFormat] = useState('jpeg')
  const [upscale, setUpscale] = useState(1)
  const [isDownloading, setIsDownloading] = useState(false)

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

  // ==================== 합치기 모드 함수들 ====================

  // 셀 크기 계산
  const cellSize = useMemo(() => ({
    width: mergeCanvasSize.width / mergeGrid.cols,
    height: mergeCanvasSize.height / mergeGrid.rows
  }), [mergeCanvasSize, mergeGrid])

  // 셀 인덱스 계산
  const getCellIndex = (row, col) => row * mergeGrid.cols + col

  // 셀 위치 계산
  const getCellPosition = (index) => ({
    row: Math.floor(index / mergeGrid.cols),
    col: index % mergeGrid.cols
  })

  // 총 셀 개수
  const totalCells = mergeGrid.cols * mergeGrid.rows

  // 셀에 이미지 로드
  const loadImageToCell = useCallback((file, cellIndex) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        // 기본 스케일: 셀을 채우도록 (cover 방식)
        const scaleX = cellSize.width / img.width
        const scaleY = cellSize.height / img.height
        const initialScale = Math.max(scaleX, scaleY)

        // 중앙 정렬 초기 위치
        const scaledWidth = img.width * initialScale
        const scaledHeight = img.height * initialScale
        const initialX = (cellSize.width - scaledWidth) / 2
        const initialY = (cellSize.height - scaledHeight) / 2

        setCellImages(prev => ({
          ...prev,
          [cellIndex]: {
            image: img,
            originalSize: { width: img.width, height: img.height },
            transform: {
              x: initialX,
              y: initialY,
              scale: initialScale
            }
          }
        }))
        setSelectedCell(cellIndex)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  }, [cellSize])

  // 셀 이미지 삭제
  const removeCellImage = useCallback((cellIndex) => {
    setCellImages(prev => {
      const newState = { ...prev }
      delete newState[cellIndex]
      return newState
    })
    if (selectedCell === cellIndex) {
      setSelectedCell(null)
    }
  }, [selectedCell])

  // 모든 셀 이미지 초기화
  const resetAllCellImages = useCallback(() => {
    setCellImages({})
    setSelectedCell(null)
  }, [])

  // 스냅 임계값
  const SNAP_THRESHOLD = 15

  // 스냅 포인트 계산
  const calculateSnapPoints = useCallback((cellIndex) => {
    const points = {
      vertical: [],
      horizontal: []
    }

    // 셀 경계 스냅
    points.vertical.push(0) // 셀 왼쪽
    points.vertical.push(cellSize.width / 2) // 셀 중앙
    points.vertical.push(cellSize.width) // 셀 오른쪽

    points.horizontal.push(0) // 셀 상단
    points.horizontal.push(cellSize.height / 2) // 셀 중앙
    points.horizontal.push(cellSize.height) // 셀 하단

    return points
  }, [cellSize])

  // 스냅 적용
  const applySnap = useCallback((position, imageSize, snapPoints) => {
    let snappedX = position.x
    let snappedY = position.y
    const guides = { vertical: [], horizontal: [] }

    // 이미지의 주요 포인트들
    const imagePoints = {
      left: position.x,
      centerX: position.x + imageSize.width / 2,
      right: position.x + imageSize.width,
      top: position.y,
      centerY: position.y + imageSize.height / 2,
      bottom: position.y + imageSize.height
    }

    // X축 스냅
    for (const snapX of snapPoints.vertical) {
      if (Math.abs(imagePoints.left - snapX) < SNAP_THRESHOLD) {
        snappedX = snapX
        guides.vertical.push(snapX)
        break
      }
      if (Math.abs(imagePoints.centerX - snapX) < SNAP_THRESHOLD) {
        snappedX = snapX - imageSize.width / 2
        guides.vertical.push(snapX)
        break
      }
      if (Math.abs(imagePoints.right - snapX) < SNAP_THRESHOLD) {
        snappedX = snapX - imageSize.width
        guides.vertical.push(snapX)
        break
      }
    }

    // Y축 스냅
    for (const snapY of snapPoints.horizontal) {
      if (Math.abs(imagePoints.top - snapY) < SNAP_THRESHOLD) {
        snappedY = snapY
        guides.horizontal.push(snapY)
        break
      }
      if (Math.abs(imagePoints.centerY - snapY) < SNAP_THRESHOLD) {
        snappedY = snapY - imageSize.height / 2
        guides.horizontal.push(snapY)
        break
      }
      if (Math.abs(imagePoints.bottom - snapY) < SNAP_THRESHOLD) {
        snappedY = snapY - imageSize.height
        guides.horizontal.push(snapY)
        break
      }
    }

    return { x: snappedX, y: snappedY, guides }
  }, [SNAP_THRESHOLD])

  // 셀 이미지 중앙 정렬
  const centerCellImage = useCallback((cellIndex) => {
    const cellImage = cellImages[cellIndex]
    if (!cellImage) return

    const scaledWidth = cellImage.originalSize.width * cellImage.transform.scale
    const scaledHeight = cellImage.originalSize.height * cellImage.transform.scale

    setCellImages(prev => ({
      ...prev,
      [cellIndex]: {
        ...prev[cellIndex],
        transform: {
          ...prev[cellIndex].transform,
          x: (cellSize.width - scaledWidth) / 2,
          y: (cellSize.height - scaledHeight) / 2
        }
      }
    }))
  }, [cellImages, cellSize])

  // 셀 채우기 (cover)
  const fillCellImage = useCallback((cellIndex) => {
    const cellImage = cellImages[cellIndex]
    if (!cellImage) return

    const scaleX = cellSize.width / cellImage.originalSize.width
    const scaleY = cellSize.height / cellImage.originalSize.height
    const newScale = Math.max(scaleX, scaleY)

    const scaledWidth = cellImage.originalSize.width * newScale
    const scaledHeight = cellImage.originalSize.height * newScale

    setCellImages(prev => ({
      ...prev,
      [cellIndex]: {
        ...prev[cellIndex],
        transform: {
          x: (cellSize.width - scaledWidth) / 2,
          y: (cellSize.height - scaledHeight) / 2,
          scale: newScale
        }
      }
    }))
  }, [cellImages, cellSize])

  // 셀에 맞추기 (contain)
  const fitCellImage = useCallback((cellIndex) => {
    const cellImage = cellImages[cellIndex]
    if (!cellImage) return

    const scaleX = cellSize.width / cellImage.originalSize.width
    const scaleY = cellSize.height / cellImage.originalSize.height
    const newScale = Math.min(scaleX, scaleY)

    const scaledWidth = cellImage.originalSize.width * newScale
    const scaledHeight = cellImage.originalSize.height * newScale

    setCellImages(prev => ({
      ...prev,
      [cellIndex]: {
        ...prev[cellIndex],
        transform: {
          x: (cellSize.width - scaledWidth) / 2,
          y: (cellSize.height - scaledHeight) / 2,
          scale: newScale
        }
      }
    }))
  }, [cellImages, cellSize])

  // 셀 이미지 스케일 변경
  const updateCellScale = useCallback((cellIndex, newScale) => {
    const cellImage = cellImages[cellIndex]
    if (!cellImage) return

    const oldScale = cellImage.transform.scale
    const oldScaledWidth = cellImage.originalSize.width * oldScale
    const oldScaledHeight = cellImage.originalSize.height * oldScale
    const newScaledWidth = cellImage.originalSize.width * newScale
    const newScaledHeight = cellImage.originalSize.height * newScale

    // 중앙 기준 스케일 변경
    const oldCenterX = cellImage.transform.x + oldScaledWidth / 2
    const oldCenterY = cellImage.transform.y + oldScaledHeight / 2

    setCellImages(prev => ({
      ...prev,
      [cellIndex]: {
        ...prev[cellIndex],
        transform: {
          x: oldCenterX - newScaledWidth / 2,
          y: oldCenterY - newScaledHeight / 2,
          scale: newScale
        }
      }
    }))
  }, [cellImages])

  // 합쳐진 이미지 생성
  const createMergedImage = useCallback(() => {
    const canvas = document.createElement('canvas')
    canvas.width = mergeCanvasSize.width * upscale
    canvas.height = mergeCanvasSize.height * upscale
    const ctx = canvas.getContext('2d')

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    // 배경 (흰색)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const scaledCellSize = {
      width: cellSize.width * upscale,
      height: cellSize.height * upscale
    }

    // 각 셀 이미지 그리기
    for (let row = 0; row < mergeGrid.rows; row++) {
      for (let col = 0; col < mergeGrid.cols; col++) {
        const index = getCellIndex(row, col)
        const cellImage = cellImages[index]

        if (cellImage) {
          const cellX = col * scaledCellSize.width
          const cellY = row * scaledCellSize.height

          // 클리핑
          ctx.save()
          ctx.beginPath()
          ctx.rect(cellX, cellY, scaledCellSize.width, scaledCellSize.height)
          ctx.clip()

          const t = cellImage.transform
          const scaledW = cellImage.originalSize.width * t.scale * upscale
          const scaledH = cellImage.originalSize.height * t.scale * upscale

          ctx.drawImage(
            cellImage.image,
            cellX + t.x * upscale,
            cellY + t.y * upscale,
            scaledW,
            scaledH
          )

          ctx.restore()
        }
      }
    }

    // 텍스트 오버레이 그리기
    mergeTextOverlays.forEach((text) => {
      const fontSize = (text.fontSize || 12) * upscale
      ctx.font = `${fontSize}px ${text.fontFamily}`
      ctx.textBaseline = 'bottom'

      if (text.hasStroke && text.strokeWidth > 0) {
        ctx.strokeStyle = text.strokeColor
        ctx.lineWidth = text.strokeWidth * upscale
        ctx.strokeText(text.content, text.x * upscale, text.y * upscale)
      }

      ctx.fillStyle = text.color
      ctx.fillText(text.content, text.x * upscale, text.y * upscale)
    })

    return canvas.toDataURL(`image/${outputFormat}`, 0.92)
  }, [mergeCanvasSize, mergeGrid, cellImages, cellSize, upscale, outputFormat, mergeTextOverlays])

  // 합쳐진 이미지 다운로드
  const downloadMergedImage = useCallback(() => {
    const dataUrl = createMergedImage()
    const extension = outputFormat === 'jpeg' ? 'jpg' : outputFormat
    const link = document.createElement('a')
    link.download = `merged_${mergeGrid.cols}x${mergeGrid.rows}.${extension}`
    link.href = dataUrl
    link.click()
  }, [createMergedImage, outputFormat, mergeGrid])

  // 그리드 변경 시 이미지 재배치
  const handleMergeGridChange = useCallback((newGrid) => {
    setMergeGrid(newGrid)
    // 그리드 변경 시 기존 이미지는 유지하되 선택 해제
    setSelectedCell(null)
  }, [])

  // ==================== 합치기 모드 함수 끝 ====================

  // 이미지 로드
  const loadImage = (file) => {
    // 파일명에서 확장자 제거하고 공백을 언더스코어로 변환
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '').replace(/\s+/g, '_')
    setOriginalFileName(nameWithoutExt)

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

  // 세로 분할선 추가 (등분 배치)
  const addVerticalLine = () => {
    const currentWidth = appliedTrim ? appliedTrim.width : imageSize.width
    const newCount = splitLines.vertical.length + 1
    const newLines = []

    // 새로운 선 개수에 맞게 등분 재배치
    for (let i = 1; i <= newCount; i++) {
      newLines.push((currentWidth / (newCount + 1)) * i)
    }

    setSplitLines(prev => ({
      ...prev,
      vertical: newLines
    }))
  }

  // 가로 분할선 추가 (등분 배치)
  const addHorizontalLine = () => {
    const currentHeight = appliedTrim ? appliedTrim.height : imageSize.height
    const newCount = splitLines.horizontal.length + 1
    const newLines = []

    // 새로운 선 개수에 맞게 등분 재배치
    for (let i = 1; i <= newCount; i++) {
      newLines.push((currentHeight / (newCount + 1)) * i)
    }

    setSplitLines(prev => ({
      ...prev,
      horizontal: newLines
    }))
  }

  // 세로 분할선 삭제 (등분 재배치)
  const removeVerticalLine = () => {
    if (splitLines.vertical.length > 0) {
      const currentWidth = appliedTrim ? appliedTrim.width : imageSize.width
      const newCount = splitLines.vertical.length - 1
      const newLines = []

      for (let i = 1; i <= newCount; i++) {
        newLines.push((currentWidth / (newCount + 1)) * i)
      }

      setSplitLines(prev => ({
        ...prev,
        vertical: newLines
      }))
    }
  }

  // 가로 분할선 삭제 (등분 재배치)
  const removeHorizontalLine = () => {
    if (splitLines.horizontal.length > 0) {
      const currentHeight = appliedTrim ? appliedTrim.height : imageSize.height
      const newCount = splitLines.horizontal.length - 1
      const newLines = []

      for (let i = 1; i <= newCount; i++) {
        newLines.push((currentHeight / (newCount + 1)) * i)
      }

      setSplitLines(prev => ({
        ...prev,
        horizontal: newLines
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

    // 임의수정 모드
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
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      const text = textOverlays[textDragState.index]
      const fontSize = text.fontSize || 12
      ctx.font = `${fontSize}px ${text.fontFamily}`
      const metrics = ctx.measureText(text.content)
      const textBoxWidth = metrics.width
      const textBoxHeight = fontSize

      const dx = coords.x - textDragState.startCoords.x
      const dy = coords.y - textDragState.startCoords.y
      let newX = Math.max(0, Math.min(currentWidth, textDragState.startPos.x + dx))
      let newY = Math.max(0, Math.min(currentHeight, textDragState.startPos.y + dy))

      // 텍스트 박스 중앙 계산 (text.x는 텍스트 시작점, text.y는 baseline)
      const textBoxCenterX = newX + textBoxWidth / 2
      const textBoxCenterY = newY - textBoxHeight / 2

      // 이미지 중앙
      const imageCenterX = currentWidth / 2
      const imageCenterY = currentHeight / 2
      const snapThreshold = 30

      // 텍스트 박스 중앙이 이미지 중앙에 가까우면 스냅
      if (Math.abs(textBoxCenterX - imageCenterX) < snapThreshold) {
        newX = imageCenterX - textBoxWidth / 2
      }
      if (Math.abs(textBoxCenterY - imageCenterY) < snapThreshold) {
        newY = imageCenterY + textBoxHeight / 2
      }

      const newOverlays = [...textOverlays]
      newOverlays[textDragState.index] = {
        ...newOverlays[textDragState.index],
        x: newX,
        y: newY
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
  const addTextOverlay = async () => {
    if (!newTextInput.trim()) return
    const currentWidth = appliedTrim ? appliedTrim.width : imageSize.width
    const currentHeight = appliedTrim ? appliedTrim.height : imageSize.height

    const fontSize = 200
    const fontFamily = 'Hakgyoansim Poster'

    // 폰트 로드 대기
    try {
      await document.fonts.load(`${fontSize}px "${fontFamily}"`)
    } catch (e) {
      // 폰트 로드 실패해도 계속 진행
    }

    // 텍스트 크기 측정
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.font = `${fontSize}px ${fontFamily}`
    const metrics = ctx.measureText(newTextInput)
    const textBoxWidth = metrics.width
    const textBoxHeight = fontSize

    // 텍스트 박스 중앙이 이미지 중앙에 오도록 위치 계산
    const centerX = currentWidth / 2
    const centerY = currentHeight / 2

    const newText = {
      content: newTextInput,
      x: centerX - textBoxWidth / 2,
      y: centerY + textBoxHeight / 2,
      fontSize: fontSize,
      fontFamily: fontFamily,
      color: '#ffffff',
      strokeColor: '#000000',
      strokeWidth: 10,
      hasStroke: true
    }
    setTextOverlays(prev => [...prev, newText])
    setNewTextInput('')
    setIsAddingText(false)
    setSelectedTextIndex(textOverlays.length)
    setFontLoadTrigger(prev => prev + 1)
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

  // 합치기 모드 텍스트 추가
  const addMergeTextOverlay = async () => {
    if (!newMergeTextInput.trim()) return

    const fontSize = 100
    const fontFamily = 'Hakgyoansim Poster'

    try {
      await document.fonts.load(`${fontSize}px "${fontFamily}"`)
    } catch (e) {}

    const canvas = mergeCanvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.font = `${fontSize}px ${fontFamily}`
    const metrics = ctx.measureText(newMergeTextInput)
    const textBoxWidth = metrics.width
    const textBoxHeight = fontSize

    const centerX = mergeCanvasSize.width / 2
    const centerY = mergeCanvasSize.height / 2

    const newText = {
      content: newMergeTextInput,
      x: centerX - textBoxWidth / 2,
      y: centerY + textBoxHeight / 2,
      fontSize: fontSize,
      fontFamily: fontFamily,
      color: '#ffffff',
      strokeColor: '#000000',
      strokeWidth: 5,
      hasStroke: true
    }
    setMergeTextOverlays(prev => [...prev, newText])
    setNewMergeTextInput('')
    setSelectedMergeTextIndex(mergeTextOverlays.length)
    setFontLoadTrigger(prev => prev + 1)
  }

  // 합치기 모드 텍스트 삭제
  const deleteMergeText = () => {
    if (selectedMergeTextIndex === null) return
    const newOverlays = mergeTextOverlays.filter((_, i) => i !== selectedMergeTextIndex)
    setMergeTextOverlays(newOverlays)
    setSelectedMergeTextIndex(null)
  }

  // 합치기 모드 텍스트 업데이트
  const updateMergeText = (updates) => {
    if (selectedMergeTextIndex === null) return
    const newOverlays = [...mergeTextOverlays]
    newOverlays[selectedMergeTextIndex] = { ...newOverlays[selectedMergeTextIndex], ...updates }
    setMergeTextOverlays(newOverlays)

    if (updates.fontFamily) {
      const testDiv = document.createElement('div')
      testDiv.style.fontFamily = updates.fontFamily
      testDiv.style.position = 'absolute'
      testDiv.style.visibility = 'hidden'
      testDiv.textContent = '폰트 로드 테스트 Font Load Test'
      document.body.appendChild(testDiv)

      document.fonts.load(`16px "${updates.fontFamily}"`).then(() => {
        document.body.removeChild(testDiv)
        setFontLoadTrigger(prev => prev + 1)
      }).catch(() => {
        document.body.removeChild(testDiv)
        setFontLoadTrigger(prev => prev + 1)
      })
    }
  }

  // 합치기 모드 캔버스에 텍스트 그리기
  const drawMergeTextOverlays = (ctx, drawHandles = true) => {
    mergeTextOverlays.forEach((text, index) => {
      const fontSize = text.fontSize || 12
      ctx.font = `${fontSize}px ${text.fontFamily}`
      ctx.textBaseline = 'bottom'

      if (text.hasStroke && text.strokeWidth > 0) {
        ctx.strokeStyle = text.strokeColor
        ctx.lineWidth = text.strokeWidth
        ctx.strokeText(text.content, text.x, text.y)
      }

      ctx.fillStyle = text.color
      ctx.fillText(text.content, text.x, text.y)

      if (index === selectedMergeTextIndex && drawHandles) {
        const metrics = ctx.measureText(text.content)
        const width = metrics.width
        const height = fontSize

        ctx.strokeStyle = '#4fc3f7'
        ctx.lineWidth = 2
        ctx.setLineDash([5, 5])
        ctx.strokeRect(text.x - 5, text.y - height - 5, width + 10, height + 10)
        ctx.setLineDash([])
      }
    })
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
      ctx.lineWidth = 10

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

      // 텍스트가 정중앙에 맞았을 때 가이드 선 표시 (분할선 위에)
      if (selectedTextIndex !== null && textOverlays[selectedTextIndex]) {
        const text = textOverlays[selectedTextIndex]
        const fontSize = text.fontSize || 12
        ctx.font = `${fontSize}px ${text.fontFamily}`
        const metrics = ctx.measureText(text.content)
        const textBoxWidth = metrics.width
        const textBoxHeight = fontSize

        const textBoxCenterX = text.x + textBoxWidth / 2
        const textBoxCenterY = text.y - textBoxHeight / 2

        const imageCenterX = drawWidth / 2
        const imageCenterY = drawHeight / 2
        const tolerance = 1

        const isHorizontallyCentered = Math.abs(textBoxCenterX - imageCenterX) < tolerance
        const isVerticallyCentered = Math.abs(textBoxCenterY - imageCenterY) < tolerance

        ctx.setLineDash([])
        ctx.strokeStyle = '#00ff00'
        ctx.lineWidth = 6

        if (isHorizontallyCentered) {
          ctx.beginPath()
          ctx.moveTo(drawWidth / 2, 0)
          ctx.lineTo(drawWidth / 2, drawHeight)
          ctx.stroke()
        }

        if (isVerticallyCentered) {
          ctx.beginPath()
          ctx.moveTo(0, drawHeight / 2)
          ctx.lineTo(drawWidth, drawHeight / 2)
          ctx.stroke()
        }
      }
    }
  }, [image, imageSize, splitLines, isTrimming, trimArea, appliedTrim, textOverlays, selectedTextIndex, fontLoadTrigger])

  // 합치기 모드 캔버스 렌더링
  useEffect(() => {
    if (appMode !== 'merge' || !mergeCanvasRef.current) return

    const canvas = mergeCanvasRef.current
    const ctx = canvas.getContext('2d')

    // 캔버스 크기 설정 (표시용 스케일 적용)
    const displayScale = Math.min(1, 600 / Math.max(mergeCanvasSize.width, mergeCanvasSize.height))
    canvas.width = mergeCanvasSize.width * displayScale
    canvas.height = mergeCanvasSize.height * displayScale

    ctx.scale(displayScale, displayScale)

    // 배경
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, mergeCanvasSize.width, mergeCanvasSize.height)

    // 각 셀 렌더링
    for (let row = 0; row < mergeGrid.rows; row++) {
      for (let col = 0; col < mergeGrid.cols; col++) {
        const cellIndex = getCellIndex(row, col)
        const cellX = col * cellSize.width
        const cellY = row * cellSize.height

        // 셀 클리핑 영역 설정
        ctx.save()
        ctx.beginPath()
        ctx.rect(cellX, cellY, cellSize.width, cellSize.height)
        ctx.clip()

        const cellImage = cellImages[cellIndex]
        if (cellImage) {
          // 이미지 그리기
          const t = cellImage.transform
          const scaledW = cellImage.originalSize.width * t.scale
          const scaledH = cellImage.originalSize.height * t.scale

          ctx.drawImage(
            cellImage.image,
            cellX + t.x,
            cellY + t.y,
            scaledW,
            scaledH
          )
        } else {
          // 빈 셀 표시 (드롭 영역)
          ctx.fillStyle = '#f5f5f5'
          ctx.fillRect(cellX, cellY, cellSize.width, cellSize.height)

          // + 아이콘
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)'
          ctx.lineWidth = 3
          const centerX = cellX + cellSize.width / 2
          const centerY = cellY + cellSize.height / 2
          const iconSize = Math.min(cellSize.width, cellSize.height) * 0.15

          ctx.beginPath()
          ctx.moveTo(centerX - iconSize, centerY)
          ctx.lineTo(centerX + iconSize, centerY)
          ctx.moveTo(centerX, centerY - iconSize)
          ctx.lineTo(centerX, centerY + iconSize)
          ctx.stroke()
        }

        ctx.restore()
      }
    }

    // 그리드 선 그리기
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)'
    ctx.lineWidth = 2

    // 세로선
    for (let col = 1; col < mergeGrid.cols; col++) {
      const x = col * cellSize.width
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, mergeCanvasSize.height)
      ctx.stroke()
    }

    // 가로선
    for (let row = 1; row < mergeGrid.rows; row++) {
      const y = row * cellSize.height
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(mergeCanvasSize.width, y)
      ctx.stroke()
    }

    // 호버 셀 하이라이트 (드래그앤드롭 시)
    if (hoverCell !== null && hoverCell !== selectedCell) {
      const { row, col } = getCellPosition(hoverCell)
      const cellX = col * cellSize.width
      const cellY = row * cellSize.height

      ctx.fillStyle = 'rgba(79, 195, 247, 0.3)'
      ctx.fillRect(cellX, cellY, cellSize.width, cellSize.height)

      ctx.strokeStyle = '#4fc3f7'
      ctx.lineWidth = 3
      ctx.strokeRect(cellX + 1, cellY + 1, cellSize.width - 2, cellSize.height - 2)
    }

    // 선택된 셀 하이라이트
    if (selectedCell !== null) {
      const { row, col } = getCellPosition(selectedCell)
      const cellX = col * cellSize.width
      const cellY = row * cellSize.height

      ctx.strokeStyle = '#4fc3f7'
      ctx.lineWidth = 4
      ctx.setLineDash([10, 5])
      ctx.strokeRect(cellX + 2, cellY + 2, cellSize.width - 4, cellSize.height - 4)
      ctx.setLineDash([])
    }

    // 스냅 가이드 라인
    if (selectedCell !== null && (snapGuides.vertical.length > 0 || snapGuides.horizontal.length > 0)) {
      const { row, col } = getCellPosition(selectedCell)
      const cellX = col * cellSize.width
      const cellY = row * cellSize.height

      ctx.strokeStyle = '#00ff00'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])

      snapGuides.vertical.forEach(x => {
        ctx.beginPath()
        ctx.moveTo(cellX + x, cellY)
        ctx.lineTo(cellX + x, cellY + cellSize.height)
        ctx.stroke()
      })

      snapGuides.horizontal.forEach(y => {
        ctx.beginPath()
        ctx.moveTo(cellX, cellY + y)
        ctx.lineTo(cellX + cellSize.width, cellY + y)
        ctx.stroke()
      })

      ctx.setLineDash([])
    }

    // 외곽선
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)'
    ctx.lineWidth = 2
    ctx.strokeRect(0, 0, mergeCanvasSize.width, mergeCanvasSize.height)

    // 텍스트 오버레이 그리기
    drawMergeTextOverlays(ctx, true)

  }, [appMode, mergeCanvasSize, mergeGrid, cellImages, cellSize, selectedCell, snapGuides, hoverCell, mergeTextOverlays, selectedMergeTextIndex, fontLoadTrigger])

  // 합치기 모드 텍스트 클릭 체크
  const getMergeClickedTextIndex = (coords) => {
    const canvas = mergeCanvasRef.current
    const ctx = canvas.getContext('2d')

    for (let i = mergeTextOverlays.length - 1; i >= 0; i--) {
      const text = mergeTextOverlays[i]
      const fontSize = text.fontSize || 12
      ctx.font = `${fontSize}px ${text.fontFamily}`
      const metrics = ctx.measureText(text.content)

      const bounds = {
        x: text.x,
        y: text.y - fontSize,
        width: metrics.width,
        height: fontSize
      }

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

  // 합치기 모드 마우스 핸들러
  const handleMergeMouseDown = (e) => {
    const canvas = mergeCanvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const displayScale = Math.min(1, 600 / Math.max(mergeCanvasSize.width, mergeCanvasSize.height))
    const scaleX = mergeCanvasSize.width / rect.width
    const scaleY = mergeCanvasSize.height / rect.height

    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY

    const canvasX = (clientX - rect.left) * scaleX
    const canvasY = (clientY - rect.top) * scaleY

    // 텍스트 클릭 체크 먼저
    const clickedTextIdx = getMergeClickedTextIndex({ x: canvasX, y: canvasY })
    if (clickedTextIdx !== null) {
      if (clickedTextIdx === selectedMergeTextIndex) {
        // 이미 선택된 텍스트 클릭 -> 드래그 시작
        setMergeTextDragState({
          index: clickedTextIdx,
          startCoords: { x: canvasX, y: canvasY },
          startPos: { x: mergeTextOverlays[clickedTextIdx].x, y: mergeTextOverlays[clickedTextIdx].y }
        })
      } else {
        // 새 텍스트 선택
        setSelectedMergeTextIndex(clickedTextIdx)
      }
      return
    }

    // 텍스트 선택 해제
    setSelectedMergeTextIndex(null)

    // 클릭한 셀 찾기
    const col = Math.floor(canvasX / cellSize.width)
    const row = Math.floor(canvasY / cellSize.height)
    const cellIndex = getCellIndex(row, col)

    // 유효한 셀인지 확인
    if (col >= 0 && col < mergeGrid.cols && row >= 0 && row < mergeGrid.rows) {
      const cellImage = cellImages[cellIndex]

      if (cellImage) {
        // 이미지가 있는 셀 클릭: 선택 + 드래그 시작
        setSelectedCell(cellIndex)

        const localX = canvasX - col * cellSize.width
        const localY = canvasY - row * cellSize.height

        setCellDragState({
          cellIndex,
          startCoords: { x: localX, y: localY },
          startTransform: { ...cellImage.transform }
        })
      } else {
        // 빈 셀 클릭: 파일 선택 다이얼로그
        setSelectedCell(cellIndex)
        if (cellFileInputRef.current) {
          cellFileInputRef.current.value = ''
          cellFileInputRef.current.click()
        }
      }
    }
  }

  const handleMergeMouseMove = (e) => {
    const canvas = mergeCanvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = mergeCanvasSize.width / rect.width
    const scaleY = mergeCanvasSize.height / rect.height

    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY

    const canvasX = (clientX - rect.left) * scaleX
    const canvasY = (clientY - rect.top) * scaleY

    // 텍스트 드래그
    if (mergeTextDragState) {
      const dx = canvasX - mergeTextDragState.startCoords.x
      const dy = canvasY - mergeTextDragState.startCoords.y

      const newX = Math.max(0, Math.min(mergeCanvasSize.width, mergeTextDragState.startPos.x + dx))
      const newY = Math.max(0, Math.min(mergeCanvasSize.height, mergeTextDragState.startPos.y + dy))

      setMergeTextOverlays(prev => {
        const newOverlays = [...prev]
        newOverlays[mergeTextDragState.index] = {
          ...newOverlays[mergeTextDragState.index],
          x: newX,
          y: newY
        }
        return newOverlays
      })
      return
    }

    // 셀 이미지 드래그
    if (!cellDragState) return

    const { cellIndex, startCoords, startTransform } = cellDragState
    const { col, row } = getCellPosition(cellIndex)

    const localX = canvasX - col * cellSize.width
    const localY = canvasY - row * cellSize.height

    const dx = localX - startCoords.x
    const dy = localY - startCoords.y

    let newX = startTransform.x + dx
    let newY = startTransform.y + dy

    // 스냅 적용
    const cellImage = cellImages[cellIndex]
    if (cellImage) {
      const scaledW = cellImage.originalSize.width * cellImage.transform.scale
      const scaledH = cellImage.originalSize.height * cellImage.transform.scale

      const snapPoints = calculateSnapPoints(cellIndex)
      const snapResult = applySnap(
        { x: newX, y: newY },
        { width: scaledW, height: scaledH },
        snapPoints
      )

      newX = snapResult.x
      newY = snapResult.y
      setSnapGuides(snapResult.guides)

      // 상태 업데이트
      setCellImages(prev => ({
        ...prev,
        [cellIndex]: {
          ...prev[cellIndex],
          transform: {
            ...prev[cellIndex].transform,
            x: newX,
            y: newY
          }
        }
      }))
    }
  }

  const handleMergeMouseUp = () => {
    setCellDragState(null)
    setMergeTextDragState(null)
    setSnapGuides({ vertical: [], horizontal: [] })
  }

  // 합치기 모드 드래그앤드롭 핸들러 - 셀 인덱스 계산 헬퍼
  const getCellIndexFromEvent = (e) => {
    const canvas = mergeCanvasRef.current
    if (!canvas) return null

    const rect = canvas.getBoundingClientRect()
    // displayScale을 고려한 실제 좌표 계산
    const scaleX = mergeCanvasSize.width / rect.width
    const scaleY = mergeCanvasSize.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    const col = Math.floor(x / cellSize.width)
    const row = Math.floor(y / cellSize.height)

    if (col >= 0 && col < mergeGrid.cols && row >= 0 && row < mergeGrid.rows) {
      return row * mergeGrid.cols + col
    }
    return null
  }

  const handleMergeDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsMergeDragging(true)

    const cellIndex = getCellIndexFromEvent(e)
    setHoverCell(cellIndex)
  }

  const handleMergeDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsMergeDragging(false)
    setHoverCell(null)
  }

  const handleMergeDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsMergeDragging(false)
    setHoverCell(null)

    const file = e.dataTransfer.files[0]
    if (!file || !file.type.startsWith('image/')) return

    const cellIndex = getCellIndexFromEvent(e)
    if (cellIndex !== null) {
      loadImageToCell(file, cellIndex)
      setSelectedCell(cellIndex)
    }
  }

  // 셀 파일 선택 핸들러
  const handleCellFileSelect = (e) => {
    const file = e.target.files[0]
    if (file && selectedCell !== null) {
      loadImageToCell(file, selectedCell)
    }
  }

  // 분할 영역 정보만 계산 (가벼운 연산)
  const splitRegions = useMemo(() => {
    if (!image) return []

    const sourceX = appliedTrim ? appliedTrim.x : 0
    const sourceY = appliedTrim ? appliedTrim.y : 0
    const sourceWidth = appliedTrim ? appliedTrim.width : imageSize.width
    const sourceHeight = appliedTrim ? appliedTrim.height : imageSize.height

    const sortedVertical = [...splitLines.vertical].sort((a, b) => a - b)
    const sortedHorizontal = [...splitLines.horizontal].sort((a, b) => a - b)

    const validVertical = sortedVertical.filter(v => v > 0 && v < sourceWidth)
    const validHorizontal = sortedHorizontal.filter(h => h > 0 && h < sourceHeight)

    const verticalLines = [0, ...validVertical, sourceWidth]
    const horizontalLines = [0, ...validHorizontal, sourceHeight]

    const regions = []

    for (let row = 0; row < horizontalLines.length - 1; row++) {
      for (let col = 0; col < verticalLines.length - 1; col++) {
        const x = verticalLines[col]
        const y = horizontalLines[row]
        const w = verticalLines[col + 1] - x
        const h = horizontalLines[row + 1] - y

        const finalX = Math.max(0, Math.min(x, sourceWidth))
        const finalY = Math.max(0, Math.min(y, sourceHeight))
        const finalW = Math.max(1, Math.min(w, sourceWidth - finalX))
        const finalH = Math.max(1, Math.min(h, sourceHeight - finalY))

        if (finalW > 0 && finalH > 0) {
          regions.push({
            name: `split_${row + 1}_${col + 1}`,
            row,
            col,
            sourceInfo: { sourceX, sourceY, finalX, finalY, finalW, finalH }
          })
        }
      }
    }

    return regions
  }, [image, imageSize, splitLines, appliedTrim])

  // 미리보기용 썸네일 생성 (최대 400px로 제한)
  const splitPieces = useMemo(() => {
    if (!image || splitRegions.length === 0) return []

    const MAX_PREVIEW_SIZE = 800

    return splitRegions.map(region => {
      const { sourceX, sourceY, finalX, finalY, finalW, finalH } = region.sourceInfo

      // 미리보기 크기 계산 (비율 유지, 최대 200px)
      const scale = Math.min(1, MAX_PREVIEW_SIZE / Math.max(finalW, finalH))
      const previewW = Math.round(finalW * scale)
      const previewH = Math.round(finalH * scale)

      const canvas = document.createElement('canvas')
      canvas.width = previewW
      canvas.height = previewH
      const ctx = canvas.getContext('2d')

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'

      ctx.drawImage(image, sourceX + finalX, sourceY + finalY, finalW, finalH, 0, 0, previewW, previewH)

      // 텍스트 오버레이 (축소된 크기로)
      textOverlays.forEach((text) => {
        const textX = (text.x - finalX) * scale
        const textY = (text.y - finalY) * scale
        const fontSize = (text.fontSize || 12) * scale

        ctx.save()
        ctx.beginPath()
        ctx.rect(0, 0, previewW, previewH)
        ctx.clip()

        ctx.font = `${fontSize}px ${text.fontFamily}`
        ctx.textBaseline = 'bottom'

        if (text.hasStroke && text.strokeWidth > 0) {
          ctx.strokeStyle = text.strokeColor
          ctx.lineWidth = text.strokeWidth * scale
          ctx.strokeText(text.content, textX, textY)
        }

        ctx.fillStyle = text.color
        ctx.fillText(text.content, textX, textY)

        ctx.restore()
      })

      return {
        ...region,
        dataUrl: canvas.toDataURL('image/jpeg', 1.0)
      }
    })
  }, [image, splitRegions, textOverlays, fontLoadTrigger])

  // 업스케일된 이미지 생성 (다운로드용)
  const createUpscaledImage = (piece) => {
    const { sourceX, sourceY, finalX, finalY, finalW, finalH } = piece.sourceInfo

    const canvas = document.createElement('canvas')
    canvas.width = finalW * upscale
    canvas.height = finalH * upscale
    const ctx = canvas.getContext('2d')

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    ctx.drawImage(image, sourceX + finalX, sourceY + finalY, finalW, finalH, 0, 0, finalW * upscale, finalH * upscale)

    // 텍스트 오버레이 그리기
    textOverlays.forEach((text) => {
      const textX = (text.x - finalX) * upscale
      const textY = (text.y - finalY) * upscale
      const fontSize = (text.fontSize || 12) * upscale

      ctx.save()
      ctx.beginPath()
      ctx.rect(0, 0, finalW * upscale, finalH * upscale)
      ctx.clip()

      ctx.font = `${fontSize}px ${text.fontFamily}`
      ctx.textBaseline = 'bottom'

      if (text.hasStroke && text.strokeWidth > 0) {
        ctx.strokeStyle = text.strokeColor
        ctx.lineWidth = text.strokeWidth * upscale
        ctx.strokeText(text.content, textX, textY)
      }

      ctx.fillStyle = text.color
      ctx.fillText(text.content, textX, textY)

      ctx.restore()
    })

    return canvas.toDataURL(`image/${outputFormat}`, 0.92)
  }

  // 개별 다운로드
  const downloadPiece = (piece, index) => {
    const extension = outputFormat === 'jpeg' ? 'jpg' : outputFormat
    const fileName = `${originalFileName}_${index + 1}.${extension}`
    const link = document.createElement('a')
    link.download = fileName
    // 원본 해상도로 다운로드 (업스케일링 적용)
    link.href = createUpscaledImage(piece)
    link.click()
  }

  // 전체 다운로드
  const downloadAll = () => {
    splitPieces.forEach((piece, index) => downloadPiece(piece, index))
  }

  // ZIP 다운로드
  const downloadZip = async () => {
    setIsDownloading(true)

    try {
      const zip = new JSZip()
      const extension = outputFormat === 'jpeg' ? 'jpg' : outputFormat

      // 비동기로 처리하여 UI 블로킹 방지
      await new Promise(resolve => setTimeout(resolve, 10))

      for (let i = 0; i < splitPieces.length; i++) {
        const piece = splitPieces[i]
        const dataUrl = createUpscaledImage(piece)
        const base64Data = dataUrl.split(',')[1]
        const fileName = `${originalFileName}_${i + 1}.${extension}`
        zip.file(fileName, base64Data, { base64: true })

        // 각 이미지 처리 후 UI 업데이트 기회 제공
        if (i % 2 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0))
        }
      }

      const blob = await zip.generateAsync({ type: 'blob' })
      const link = document.createElement('a')
      link.download = `${originalFileName}.zip`
      link.href = URL.createObjectURL(blob)
      link.click()
      URL.revokeObjectURL(link.href)
    } finally {
      setIsDownloading(false)
    }
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
            <img
              src="/logo.svg"
              alt="Logo"
              className="header-logo clickable"
              onClick={() => window.location.reload()}
            />
            <h1
              className="clickable"
              onClick={() => window.location.reload()}
            >IMAGE SPLITTER</h1>
            <span className="header-credit">made by ATB</span>
          </div>
          <button
            className="lang-toggle-btn"
            onClick={() => setLocale(locale === 'ko' ? 'en' : 'ko')}
            title={locale === 'ko' ? 'Switch to English' : '한국어로 전환'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M2 12h20"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            <span>{locale === 'ko' ? 'KO' : 'EN'}</span>
          </button>
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
            <span>{t.preview}</span>
          </div>

          {appMode === 'split' ? (
            <>
              {/* 분할 모드 프리뷰 */}
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
                    <p>{t.uploadHint.split('\n').map((line, i) => <span key={i}>{line}<br/></span>)}</p>
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
                    <span>{t.splitPreview}</span>
                    <span className="preview-hint">{t.clickToDownload}</span>
                  </div>
                  <div className="split-preview-grid" style={previewGridStyle}>
                    {splitPieces.map((piece, index) => (
                      <div
                        key={index}
                        className="split-preview-item"
                        onClick={() => downloadPiece(piece, index)}
                      >
                        <img src={piece.dataUrl} alt={piece.name} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* 합치기 모드 프리뷰 */
            <div
              className={`preview-area ${isMergeDragging ? 'dragging' : ''}`}
              style={{ cursor: 'default', border: isMergeDragging ? '2px dashed #4fc3f7' : 'none' }}
              onDragOver={handleMergeDragOver}
              onDragLeave={handleMergeDragLeave}
              onDrop={handleMergeDrop}
            >
              <div className="merge-canvas-wrapper">
                <canvas
                  ref={mergeCanvasRef}
                  className="merge-canvas"
                  onMouseDown={handleMergeMouseDown}
                  onMouseMove={handleMergeMouseMove}
                  onMouseUp={handleMergeMouseUp}
                  onMouseLeave={handleMergeMouseUp}
                  onTouchStart={handleMergeMouseDown}
                  onTouchMove={handleMergeMouseMove}
                  onTouchEnd={handleMergeMouseUp}
                />
              </div>
              <input
                type="file"
                ref={cellFileInputRef}
                accept="image/*"
                onChange={handleCellFileSelect}
                style={{ display: 'none' }}
              />
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
            <span>{t.settings}</span>
          </div>

          {/* 모드 토글 버튼 */}
          <div className="mode-toggle-header">
            <button
              className={`mode-toggle-btn ${appMode === 'split' ? 'active' : ''}`}
              onClick={() => setAppMode('split')}
            >
              {t.mode_split}
            </button>
            <button
              className={`mode-toggle-btn ${appMode === 'merge' ? 'active' : ''}`}
              onClick={() => setAppMode('merge')}
            >
              {t.mode_merge}
            </button>
          </div>

          {appMode === 'split' ? (
            <>
              {/* 분할 방향 */}
              <div className="setting-group">
                <label className="setting-label">{t.splitDirection}</label>
            <div className="split-modes">
              {Object.values(SPLIT_MODES).map(mode => (
                <button
                  key={mode.id}
                  className={`mode-btn ${splitMode.id === mode.id ? 'active' : ''}`}
                  onClick={() => handleSplitModeChange(mode)}
                >
                  <span className="mode-icon">{mode.icon}</span>
                  <span className="mode-name">{t[`mode_${mode.id}`] || mode.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* STEP 1: 분할선 조정 */}
          <div className="setting-group">
            <label className="setting-label">{t.step1_splitLines}</label>
            {splitMode.custom ? (
              <div className="custom-lines-control">
                <div className="line-control-row">
                  <span className="line-label">{t.verticalLine} ({splitLines.vertical.length})</span>
                  <button className="line-btn" onClick={addVerticalLine} disabled={!image}>+</button>
                  <button className="line-btn" onClick={removeVerticalLine} disabled={!image || splitLines.vertical.length === 0}>−</button>
                </div>
                <div className="line-control-row">
                  <span className="line-label">{t.horizontalLine} ({splitLines.horizontal.length})</span>
                  <button className="line-btn" onClick={addHorizontalLine} disabled={!image}>+</button>
                  <button className="line-btn" onClick={removeHorizontalLine} disabled={!image || splitLines.horizontal.length === 0}>−</button>
                </div>
              </div>
            ) : (
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
                  {t.equal}
                </button>
                <button
                  className={`toggle-btn ${!isEqualMode ? 'active' : ''}`}
                  onClick={() => setIsEqualMode(false)}
                >
                  {t.free}
                </button>
              </div>
            )}
            <p className="setting-hint">{t.dragHint}</p>
          </div>

          {/* STEP 2: 임의수정 */}
          <div className="setting-group">
            <label className="setting-label">{t.step2_crop}</label>
            <div className="trim-buttons">
              <button
                className={`trim-btn ${isTrimming ? 'active' : ''}`}
                onClick={() => setIsTrimming(true)}
                disabled={!image}
              >
                {t.select}
              </button>
              <button
                className="trim-btn"
                onClick={applyTrim}
                disabled={!trimArea || trimArea.width === 0}
              >
                {t.confirm}
              </button>
              <button
                className="trim-btn"
                onClick={cancelTrim}
                disabled={!appliedTrim && !isTrimming}
              >
                {t.release}
              </button>
            </div>
            <p className="setting-hint">{t.step1Hint}</p>
          </div>

          {/* STEP 3: 텍스트 추가 */}
          <div className="setting-group">
            <label className="setting-label">{t.step3_text}</label>
            {isAddingText ? (
              <div className="text-input-row">
                <input
                  type="text"
                  value={newTextInput}
                  onChange={(e) => setNewTextInput(e.target.value)}
                  placeholder={t.textPlaceholder}
                  className="text-input"
                  onKeyDown={(e) => e.key === 'Enter' && addTextOverlay()}
                  autoFocus
                />
                <button className="trim-btn" onClick={addTextOverlay}>{t.add}</button>
                <button className="trim-btn" onClick={() => setIsAddingText(false)}>{t.cancel}</button>
              </div>
            ) : (
              <button
                className="trim-btn full-width"
                onClick={() => setIsAddingText(true)}
                disabled={!image}
              >
                {t.addText}
              </button>
            )}

            {/* 선택된 텍스트 편집 */}
            {selectedText && (
              <div className="text-editor">
                <div className="text-editor-row">
                  <label>{t.content}</label>
                  <input
                    type="text"
                    value={selectedText.content}
                    onChange={(e) => updateSelectedText({ content: e.target.value })}
                    className="text-input"
                  />
                </div>
                <div className="text-editor-row">
                  <label>{t.font}</label>
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
                  <label>{t.size}</label>
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
                  <label>{t.color}</label>
                  <input
                    type="color"
                    value={selectedText.color}
                    onChange={(e) => updateSelectedText({ color: e.target.value })}
                  />
                  <label>{t.stroke}</label>
                  <input
                    type="color"
                    value={selectedText.strokeColor}
                    onChange={(e) => updateSelectedText({ strokeColor: e.target.value })}
                  />
                </div>
                <div className="text-editor-row">
                  <label>{t.strokeWidth}</label>
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
                  {t.deleteText}
                </button>
              </div>
            )}

            {textOverlays.length > 0 && (
              <p className="setting-hint">{t.textHint}</p>
            )}
          </div>

          {/* STEP 4: 출력 설정 */}
          <div className="setting-group">
            <label className="setting-label">{t.step4}</label>
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
            <div className="upscale-control">
              <span>{t.upscale}</span>
              <div className="upscale-buttons">
                {[1, 2, 4].map(scale => (
                  <button
                    key={scale}
                    className={`upscale-btn ${upscale === scale ? 'active' : ''}`}
                    onClick={() => setUpscale(scale)}
                  >
                    {t[`upscale${scale}x`]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 다운로드 버튼 */}
          <div className="setting-group">
            <label className="setting-label">{t.step5}</label>
            <div className="download-buttons">
              <button
                className="download-btn"
                onClick={downloadAll}
                disabled={!image}
              >
                {t.downloadEach}
              </button>
              <button
                className="download-btn primary"
                onClick={downloadZip}
                disabled={!image || isDownloading}
              >
                {isDownloading ? (
                  <>
                    <span className="loading-spinner"></span>
                    처리중...
                  </>
                ) : t.downloadZip}
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
                    {t.changeImage}
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              {/* 합치기 모드 설정 */}

              {/* 그리드 선택 */}
              <div className="setting-group">
                <label className="setting-label">{t.mergeGridSelect}</label>
                <div className="merge-grid-options">
                  {MERGE_GRID_OPTIONS.map(option => (
                    <button
                      key={option.id}
                      className={`merge-grid-btn ${mergeGrid.cols === option.cols && mergeGrid.rows === option.rows ? 'active' : ''}`}
                      onClick={() => handleMergeGridChange(option)}
                    >
                      {option.name}
                    </button>
                  ))}
                </div>
                {/* 사용자 정의 그리드 입력 */}
                <div className="custom-grid-row">
                  <span>{t.mergeGridCustom}:</span>
                  <input
                    type="number"
                    value={customGridInput.cols}
                    onChange={(e) => setCustomGridInput(prev => ({ ...prev, cols: e.target.value }))}
                    placeholder="1-10"
                    min="1"
                    max="10"
                  />
                  <span>×</span>
                  <input
                    type="number"
                    value={customGridInput.rows}
                    onChange={(e) => setCustomGridInput(prev => ({ ...prev, rows: e.target.value }))}
                    placeholder="1-10"
                    min="1"
                    max="10"
                  />
                  <button
                    className="custom-grid-apply-btn"
                    onClick={() => {
                      const cols = Math.max(1, Math.min(10, Number(customGridInput.cols) || 1))
                      const rows = Math.max(1, Math.min(10, Number(customGridInput.rows) || 1))
                      if (customGridInput.cols && customGridInput.rows) {
                        setMergeGrid({ cols, rows })
                        setSelectedCell(null)
                      }
                    }}
                    disabled={!customGridInput.cols || !customGridInput.rows}
                  >
                    {t.mergeGridApply}
                  </button>
                </div>
              </div>

              {/* 출력 크기 */}
              <div className="setting-group">
                <label className="setting-label">{t.mergeOutputSize}</label>
                <div className="size-presets">
                  {SIZE_PRESETS.map(preset => (
                    <button
                      key={preset.id}
                      className={`size-preset-btn ${mergeCanvasSize.width === preset.width && mergeCanvasSize.height === preset.height ? 'active' : ''}`}
                      onClick={() => setMergeCanvasSize({ width: preset.width, height: preset.height })}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
                <div className="custom-size-row">
                  <input
                    type="number"
                    value={mergeCanvasSize.width}
                    onChange={(e) => setMergeCanvasSize(prev => ({ ...prev, width: Math.max(100, Number(e.target.value)) }))}
                    min="100"
                    max="4096"
                  />
                  <span>×</span>
                  <input
                    type="number"
                    value={mergeCanvasSize.height}
                    onChange={(e) => setMergeCanvasSize(prev => ({ ...prev, height: Math.max(100, Number(e.target.value)) }))}
                    min="100"
                    max="4096"
                  />
                  <span>px</span>
                </div>
              </div>

              {/* 선택된 셀 이미지 조정 */}
              {selectedCell !== null && cellImages[selectedCell] && (
                <div className="setting-group">
                  <label className="setting-label">{t.mergeCellAdjust}</label>
                  <div className="cell-adjust-section">
                    <div className="cell-adjust-row">
                      <label>{t.mergeScale}</label>
                      <input
                        type="range"
                        min="0.1"
                        max="3"
                        step="0.01"
                        value={cellImages[selectedCell].transform.scale}
                        onChange={(e) => updateCellScale(selectedCell, Number(e.target.value))}
                      />
                      <span>{Math.round(cellImages[selectedCell].transform.scale * 100)}%</span>
                    </div>
                    <div className="quick-actions">
                      <button className="quick-action-btn" onClick={() => centerCellImage(selectedCell)}>
                        {t.mergeCenterAlign}
                      </button>
                      <button className="quick-action-btn" onClick={() => fillCellImage(selectedCell)}>
                        {t.mergeFillCell}
                      </button>
                      <button className="quick-action-btn" onClick={() => fitCellImage(selectedCell)}>
                        {t.mergeFitCell}
                      </button>
                      <button className="quick-action-btn danger" onClick={() => removeCellImage(selectedCell)}>
                        {t.mergeRemoveImage}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 텍스트 추가 */}
              <div className="setting-group">
                <label className="setting-label">{t.step2}</label>
                <div className="text-input-row">
                  <input
                    type="text"
                    className="text-input"
                    placeholder={t.textPlaceholder}
                    value={newMergeTextInput}
                    onChange={(e) => setNewMergeTextInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addMergeTextOverlay()}
                  />
                  <button className="trim-btn" onClick={addMergeTextOverlay}>{t.add}</button>
                </div>

                {/* 텍스트 목록 */}
                {mergeTextOverlays.length > 0 && (
                  <div className="text-list">
                    {mergeTextOverlays.map((text, index) => (
                      <div
                        key={index}
                        className={`text-item ${selectedMergeTextIndex === index ? 'selected' : ''}`}
                        onClick={() => setSelectedMergeTextIndex(index)}
                      >
                        <span className="text-item-content">{text.content}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 선택된 텍스트 편집 */}
                {selectedMergeTextIndex !== null && mergeTextOverlays[selectedMergeTextIndex] && (
                  <div className="text-editor">
                    <div className="text-editor-row">
                      <label>{t.content}</label>
                      <input
                        type="text"
                        value={mergeTextOverlays[selectedMergeTextIndex].content}
                        onChange={(e) => updateMergeText({ content: e.target.value })}
                      />
                    </div>
                    <div className="text-editor-row">
                      <label>{t.font}</label>
                      <select
                        className="font-select"
                        value={mergeTextOverlays[selectedMergeTextIndex].fontFamily}
                        onChange={(e) => updateMergeText({ fontFamily: e.target.value })}
                      >
                        <option value="Hakgyoansim Poster">학교안심 포스터</option>
                        <option value="SokchoBadaDotum">속초바다돋움</option>
                        <option value="Sandoll Greta Sans KR">그레타 산스</option>
                        <option value="Sandoll Greta Sans Display">그레타 산스 Display</option>
                        <option value="TheJamsil">잠실체</option>
                        <option value="YUniverse">유니버스</option>
                        <option value="GangwonEduPower">강원교육체</option>
                        <option value="HSSanTokki">산토끼</option>
                        <option value="Freesentation">프리젠테이션</option>
                        <option value="SOYO Maple">소요 메이플</option>
                        <option value="Pretendard Variable">Pretendard</option>
                        <option value="sans-serif">Sans-serif</option>
                        <option value="Arial">Arial</option>
                      </select>
                    </div>
                    <div className="text-editor-row">
                      <label>{t.size}</label>
                      <input
                        type="number"
                        className="size-input"
                        value={mergeTextOverlays[selectedMergeTextIndex].fontSize}
                        onChange={(e) => updateMergeText({ fontSize: Number(e.target.value) })}
                        min="10"
                        max="500"
                      />
                    </div>
                    <div className="text-editor-row">
                      <label>{t.color}</label>
                      <input
                        type="color"
                        value={mergeTextOverlays[selectedMergeTextIndex].color}
                        onChange={(e) => updateMergeText({ color: e.target.value })}
                      />
                      <label>{t.stroke}</label>
                      <input
                        type="color"
                        value={mergeTextOverlays[selectedMergeTextIndex].strokeColor}
                        onChange={(e) => updateMergeText({ strokeColor: e.target.value })}
                      />
                    </div>
                    <div className="text-editor-row">
                      <label>{t.strokeWidth}</label>
                      <input
                        type="range"
                        min="0"
                        max="20"
                        value={mergeTextOverlays[selectedMergeTextIndex].strokeWidth}
                        onChange={(e) => updateMergeText({ strokeWidth: Number(e.target.value) })}
                      />
                      <span>{mergeTextOverlays[selectedMergeTextIndex].strokeWidth}px</span>
                    </div>
                    <button className="delete-text-btn" onClick={deleteMergeText}>
                      {t.deleteText}
                    </button>
                  </div>
                )}
              </div>

              {/* 출력 설정 */}
              <div className="setting-group">
                <label className="setting-label">{t.step4}</label>
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
                <div className="upscale-control">
                  <span>{t.upscale}</span>
                  <div className="upscale-buttons">
                    {[1, 2, 4].map(scale => (
                      <button
                        key={scale}
                        className={`upscale-btn ${upscale === scale ? 'active' : ''}`}
                        onClick={() => setUpscale(scale)}
                      >
                        {t[`upscale${scale}x`]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 다운로드 버튼 */}
              <div className="setting-group">
                <button
                  className="merge-download-btn"
                  onClick={downloadMergedImage}
                  disabled={Object.keys(cellImages).length === 0}
                >
                  {t.mergeDownload}
                </button>
                {Object.keys(cellImages).length > 0 && (
                  <button
                    className="merge-reset-btn"
                    onClick={resetAllCellImages}
                  >
                    {t.mergeResetAll}
                  </button>
                )}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
