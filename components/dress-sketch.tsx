"use client"

import type React from "react"

import { useRef, useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface DressSketchProps {
  onSave?: (imageData: string) => void
  selectedSkirt?: string // 치마 스타일 prop 추가
  selectedNecklineFromParent?: string // 부모에서 전달받은 넥라인
  onNecklineChange?: (neckline: string) => void // 넥라인 변경 콜백
  onSkirtChange?: (skirt: string) => void // 치마 변경 콜백
}

const necklineOptions = [
  { key: "none", label: "없음", image: null },
  {
    key: "open-shoulder",
    label: "오픈숄더",
    image: "/images/necklines/open-shoulder.png",
    defaultPosition: { x: 85, y: 65, width: 130, height: 70 },
  },
  {
    key: "round",
    label: "라운드넥",
    image: "/images/necklines/round.png",
    defaultPosition: { x: 85, y: 65, width: 130, height: 70 },
  },
  {
    key: "v-neck",
    label: "브이넥",
    image: "/images/necklines/v-neck.png",
    defaultPosition: { x: 90, y: 70, width: 120, height: 80 },
  },
  {
    key: "halter",
    label: "홀터넥",
    image: "/images/necklines/halter.png",
    defaultPosition: { x: 88, y: 60, width: 124, height: 75 },
  },
  {
    key: "heart",
    label: "하트넥",
    image: "/images/necklines/heart.png",
    defaultPosition: { x: 87, y: 68, width: 126, height: 72 },
  },
  {
    key: "straight",
    label: "일자넥",
    image: "/images/necklines/straight.png",
    defaultPosition: { x: 82, y: 62, width: 136, height: 68 },
  },
  {
    key: "square",
    label: "스퀘어넥",
    image: "/images/necklines/square.png",
    defaultPosition: { x: 88, y: 66, width: 124, height: 74 },
  },
]

// 치마 스타일별 드레스 이미지 – 실제 존재하는 파일 경로로 수정
const dressImages = {
  A라인: "/images/dress-aline.png",
  벨라인: "/images/dress-bellline.png",
  머메이드: "/images/dress-mermaid.png",
  default: "/images/dress-aline.png",
}

// 치마 스타일 선택 옵션
const skirtOptions = [
  { key: "A라인", label: "A라인" },
  { key: "벨라인", label: "벨라인" },
  { key: "머메이드", label: "머메이드" },
]

export default function DressSketch({
  onSave,
  selectedSkirt,
  selectedNecklineFromParent,
  onNecklineChange,
  onSkirtChange,
}: DressSketchProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null) // 배경 전용 캔버스
  const containerRef = useRef<HTMLDivElement>(null)
  const necklineRef = useRef<HTMLDivElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [brushSize, setBrushSize] = useState(2)
  const [brushColor, setBrushColor] = useState("#ff0000")
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isErasing, setIsErasing] = useState(false)
  const [selectedNeckline, setSelectedNeckline] = useState("none")
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null)
  const [currentSkirt, setCurrentSkirt] = useState("A라인")
  const [toolMode, setToolMode] = useState<"select" | "brush" | "eraser">("select")
  const [brushPanelExpanded, setBrushPanelExpanded] = useState(false)
  const [brushType, setBrushType] = useState<"solid" | "lace" | "lace-flower" | "silver-weak" | "silver-strong">(
    "solid",
  )
  const [specialBrushSize, setSpecialBrushSize] = useState(8) // 특수 브러시용 크기

  // 넥라인 위치와 크기 상태
  const [necklinePosition, setNecklinePosition] = useState({ x: 85, y: 65, width: 130, height: 70 })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeType, setResizeType] = useState<"diagonal" | "horizontal" | "vertical">("diagonal")
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })

  // 외부에서 전달된 치마 스타일이 있으면 사용
  useEffect(() => {
    if (selectedSkirt) {
      setCurrentSkirt(selectedSkirt)
    }
  }, [selectedSkirt])

  // 외부에서 전달된 넥라인이 있으면 사용
  useEffect(() => {
    if (selectedNecklineFromParent) {
      const necklineMapping: { [key: string]: string } = {
        라운드: "round",
        스퀘어: "square",
        브이넥: "v-neck",
        오픈숄더: "open-shoulder",
        일자넥: "straight",
        하트넥: "heart",
        홀터넥: "halter",
      }
      const mappedNeckline = necklineMapping[selectedNecklineFromParent] || "none"
      setSelectedNeckline(mappedNeckline)
    }
  }, [selectedNecklineFromParent])

  // 배경 그리기 (드레스만) - 사용자 그림을 지우지 않음
  const drawBackground = useCallback(() => {
    const backgroundCanvas = backgroundCanvasRef.current
    if (!backgroundCanvas || !backgroundImage) return

    backgroundCanvas.width = 300
    backgroundCanvas.height = 400
    const ctx = backgroundCanvas.getContext("2d")!

    // 배경을 흰색으로 설정
    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, backgroundCanvas.width, backgroundCanvas.height)

    // 드레스 이미지 그리기
    ctx.drawImage(backgroundImage, 0, 0, backgroundCanvas.width, backgroundCanvas.height)
  }, [backgroundImage])

  // 사용자 그림 캔버스 초기화
  const initializeUserCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = 300
    canvas.height = 400
    // 사용자 그림 캔버스는 투명하게 유지
  }, [])

  // 치마 스타일에 따른 배경 이미지 로드
  useEffect(() => {
    const imagePath = dressImages[currentSkirt as keyof typeof dressImages] || dressImages.default
    console.log(`Loading dress image: ${currentSkirt} -> ${imagePath}`)

    setImageLoaded(false) // 로딩 시작 시 false로 설정

    const img = new Image()
    img.onload = () => {
      console.log(`Successfully loaded: ${imagePath}`)
      setBackgroundImage(img)
      setImageLoaded(true)
    }
    img.onerror = () => {
      console.error("드레스 이미지 로드 실패:", imagePath)
      setImageLoaded(false)
    }
    img.src = imagePath
  }, [currentSkirt])

  // 이미지 로드 완료 후 캔버스 초기화
  useEffect(() => {
    if (imageLoaded && backgroundImage) {
      initializeUserCanvas()
      drawBackground()
    }
  }, [imageLoaded, backgroundImage, drawBackground, initializeUserCanvas])

  // 넥라인 변경 시 기본 위치로 리셋
  useEffect(() => {
    const option = necklineOptions.find((opt) => opt.key === selectedNeckline)
    if (option?.defaultPosition) {
      setNecklinePosition(option.defaultPosition)
    }
  }, [selectedNeckline])

  // 배경 그리기 (드레스만) - 사용자 그림을 지우지 않음

  // 사용자 그림 캔버스 초기화

  useEffect(() => {
    if (imageLoaded) {
      drawBackground()
      initializeUserCanvas()
    }
  }, [imageLoaded, drawBackground, initializeUserCanvas])

  // 넥라인 변경 핸들러
  const handleNecklineChange = (necklineKey: string) => {
    setSelectedNeckline(necklineKey)

    if (onNecklineChange) {
      const reverseNecklineMapping: { [key: string]: string } = {
        round: "라운드",
        square: "스퀘어",
        "v-neck": "브이넥",
        "open-shoulder": "오픈숄더",
        straight: "일자넥",
        heart: "하트넥",
        halter: "홀터넥",
        none: "",
      }
      const mappedNeckline = reverseNecklineMapping[necklineKey] || ""
      onNecklineChange(mappedNeckline)
    }
  }

  // 치마 변경 핸들러
  const handleSkirtChange = (skirtKey: string) => {
    setCurrentSkirt(skirtKey)

    if (onSkirtChange) {
      onSkirtChange(skirtKey)
    }
  }

  // 드래그 시작
  const handleMouseDown = (e: React.MouseEvent) => {
    if (selectedNeckline === "none") return

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setIsDragging(true)
    setDragStart({ x: x - necklinePosition.x, y: y - necklinePosition.y })
    e.preventDefault()
  }

  // 리사이즈 핸들 드래그 시작
  const handleResizeStart = (e: React.MouseEvent, type: "diagonal" | "horizontal" | "vertical") => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setIsResizing(true)
    setResizeType(type)
    setResizeStart({
      x,
      y,
      width: necklinePosition.width,
      height: necklinePosition.height,
    })
    e.stopPropagation()
    e.preventDefault()
  }

  // 마우스 이동
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging && !isResizing) return

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (isDragging) {
      const newX = Math.max(0, Math.min(300 - necklinePosition.width, x - dragStart.x))
      const newY = Math.max(0, Math.min(400 - necklinePosition.height, y - dragStart.y))

      setNecklinePosition((prev) => ({
        ...prev,
        x: newX,
        y: newY,
      }))
    } else if (isResizing) {
      const deltaX = x - resizeStart.x
      const deltaY = y - resizeStart.y

      let newWidth = resizeStart.width
      let newHeight = resizeStart.height

      if (resizeType === "diagonal") {
        newWidth = Math.max(50, Math.min(200, resizeStart.width + deltaX))
        newHeight = Math.max(40, Math.min(160, resizeStart.height + deltaY))
      } else if (resizeType === "horizontal") {
        newWidth = Math.max(50, Math.min(200, resizeStart.width + deltaX))
      } else if (resizeType === "vertical") {
        newHeight = Math.max(40, Math.min(160, resizeStart.height + deltaY))
      }

      setNecklinePosition((prev) => ({
        ...prev,
        width: newWidth,
        height: newHeight,
      }))
    }
  }

  // 드래그 종료
  const handleMouseUp = () => {
    setIsDragging(false)
    setIsResizing(false)
  }

  // 캔버스 그리기 이벤트들 - 사용자 그림 캔버스에만 그리기
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!imageLoaded || toolMode === "select") return

    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    let clientX, clientY
    if ("touches" in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    const x = (clientX - rect.left) * scaleX
    const y = (clientY - rect.top) * scaleY

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !imageLoaded || toolMode === "select") return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    let clientX, clientY
    if ("touches" in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    const x = (clientX - rect.left) * scaleX
    const y = (clientY - rect.top) * scaleY

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    if (isErasing) {
      ctx.globalCompositeOperation = "destination-out"
      ctx.lineWidth = brushSize * 8 // 2에서 8로 변경 (4배 크게!)
    } else {
      ctx.globalCompositeOperation = "source-over"
      ctx.lineWidth = brushSize

      // 브러시 타입에 따른 스타일 설정
      if (brushType === "solid") {
        ctx.strokeStyle = brushColor
      } else if (brushType === "lace") {
        // 레이스 효과 - 직접 패턴 그리기
        const currentSize = specialBrushSize
        ctx.globalAlpha = 0.3 // 0.9에서 0.3으로 변경 (훨씬 투명하게)

        // 베이지 배경
        ctx.fillStyle = "#faf9f7" // 기존 "#f5f5dc"에서 변경
        ctx.fillRect(x - currentSize / 2, y - currentSize / 2, currentSize, currentSize)

        // 강한 검은 그림자
        ctx.shadowColor = "#000000"
        ctx.shadowBlur = 4
        ctx.shadowOffsetX = 3
        ctx.shadowOffsetY = 3

        // 레이스 패턴 직접 그리기
        ctx.strokeStyle = "#f0ede8" // 기존 "#ddd8c7"에서 변경
        ctx.lineWidth = 2

        // 중앙 원
        ctx.beginPath()
        ctx.arc(x, y, currentSize / 4, 0, Math.PI * 2)
        ctx.stroke()

        // 십자 패턴
        ctx.beginPath()
        ctx.moveTo(x - currentSize / 2, y)
        ctx.lineTo(x + currentSize / 2, y)
        ctx.moveTo(x, y - currentSize / 2)
        ctx.lineTo(x, y + currentSize / 2)
        ctx.stroke()

        // 모서리 점들
        const dotSize = currentSize / 8
        ctx.fillStyle = "#f0ede8" // 기존 "#ddd8c7"에서 변경
        ctx.beginPath()
        ctx.arc(x - currentSize / 3, y - currentSize / 3, dotSize, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(x + currentSize / 3, y - currentSize / 3, dotSize, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(x - currentSize / 3, y + currentSize / 3, dotSize, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(x + currentSize / 3, y + currentSize / 3, dotSize, 0, Math.PI * 2)
        ctx.fill()

        ctx.shadowColor = "transparent"
      } else if (brushType === "lace-flower") {
        // 꽃무늬 레이스 효과 - 직접 꽃 그리기
        const currentSize = specialBrushSize
        ctx.globalAlpha = 0.2 // 0.8에서 0.2로 변경 (훨씬 투명하게)

        // 약한 그림자
        ctx.shadowColor = "#777777"
        ctx.shadowBlur = 2
        ctx.shadowOffsetX = 1
        ctx.shadowOffsetY = 1

        // 꽃 중심
        ctx.fillStyle = "#fefcff" // 기존 "#ffffff"에서 변경
        ctx.beginPath()
        ctx.arc(x, y, currentSize / 6, 0, Math.PI * 2)
        ctx.fill()

        // 꽃잎 5개
        ctx.strokeStyle = "#fefcff" // 기존 "#ffffff"에서 변경
        ctx.lineWidth = 2
        for (let i = 0; i < 5; i++) {
          const angle = (i * Math.PI * 2) / 5
          const petalX = x + Math.cos(angle) * (currentSize / 3)
          const petalY = y + Math.sin(angle) * (currentSize / 3)

          // 꽃잎 (타원)
          ctx.save()
          ctx.translate(petalX, petalY)
          ctx.rotate(angle)
          ctx.beginPath()
          ctx.ellipse(0, 0, currentSize / 6, currentSize / 12, 0, 0, Math.PI * 2)
          ctx.fill()
          ctx.stroke()
          ctx.restore()

          // 중심과 연결선
          ctx.beginPath()
          ctx.moveTo(x, y)
          ctx.lineTo(petalX, petalY)
          ctx.stroke()
        }

        ctx.shadowColor = "transparent"
      } else if (brushType === "silver-weak" || brushType === "silver-strong") {
        // 흩날리는 다이아몬드 큐빅 효과
        const currentSize = specialBrushSize
        const intensity = brushType === "silver-strong" ? 5 : 4
        const particleSize = brushType === "silver-weak" ? 0.3 : 0.5

        for (let i = 0; i < intensity; i++) {
          const offsetX = (Math.random() - 0.5) * currentSize * 1.5
          const offsetY = (Math.random() - 0.5) * currentSize * 1.5
          const sparkleSize = currentSize * particleSize + Math.random() * (currentSize * particleSize)

          // 다이아몬드 모양 그리기
          ctx.save()
          ctx.translate(x + offsetX, y + offsetY)
          ctx.rotate(Math.random() * Math.PI)

          // 큐빅 그라데이션
          const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, sparkleSize)
          gradient.addColorStop(0, "#ffffff")
          gradient.addColorStop(0.3, "#f0f0f0")
          gradient.addColorStop(0.6, "#d0d0d0")
          gradient.addColorStop(0.8, "#b0b0b0")
          gradient.addColorStop(1, "transparent")

          ctx.fillStyle = gradient
          ctx.globalAlpha = 0.3 + Math.random() * 0.2

          // 다이아몬드 모양
          ctx.beginPath()
          ctx.moveTo(0, -sparkleSize)
          ctx.lineTo(sparkleSize * 0.7, 0)
          ctx.lineTo(0, sparkleSize)
          ctx.lineTo(-sparkleSize * 0.7, 0)
          ctx.closePath()
          ctx.fill()

          // 십자 반짝임 추가
          ctx.strokeStyle = "#ffffff"
          ctx.lineWidth = 0.5
          ctx.globalAlpha = 0.4
          ctx.beginPath()
          ctx.moveTo(-sparkleSize, 0)
          ctx.lineTo(sparkleSize, 0)
          ctx.moveTo(0, -sparkleSize)
          ctx.lineTo(0, sparkleSize)
          ctx.stroke()

          ctx.restore()
        }
      }

      // 일반 브러시의 경우에만 기본 그리기 실행
      if (brushType === "solid") {
        ctx.lineCap = "round"
        ctx.lineTo(x, y)
        ctx.stroke()
      }
    }

    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  // 사용자 그림만 지우기
  const clearUserDrawing = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const saveSketch = () => {
    const backgroundCanvas = backgroundCanvasRef.current
    const userCanvas = canvasRef.current
    if (!backgroundCanvas || !userCanvas) return

    // 임시 캔버스에서 모든 레이어 합성
    const tempCanvas = document.createElement("canvas")
    const tempCtx = tempCanvas.getContext("2d")!
    tempCanvas.width = backgroundCanvas.width
    tempCanvas.height = backgroundCanvas.height

    // 1. 배경 (드레스)
    tempCtx.drawImage(backgroundCanvas, 0, 0)

    // 2. 넥라인 이미지
    if (selectedNeckline !== "none") {
      const option = necklineOptions.find((opt) => opt.key === selectedNeckline)
      if (option?.image) {
        const neckImg = new Image()
        neckImg.onload = () => {
          tempCtx.drawImage(
            neckImg,
            necklinePosition.x,
            necklinePosition.y,
            necklinePosition.width,
            necklinePosition.height,
          )

          // 3. 사용자 그림
          tempCtx.drawImage(userCanvas, 0, 0)

          const imageData = tempCanvas.toDataURL("image/png")
          if (onSave) {
            onSave(imageData)
          }

          const link = document.createElement("a")
          link.download = "dress-sketch.png"
          link.href = imageData
          link.click()
        }
        neckImg.src = option.image
        return
      }
    }

    // 넥라인이 없는 경우
    tempCtx.drawImage(userCanvas, 0, 0)
    const imageData = tempCanvas.toDataURL("image/png")
    if (onSave) {
      onSave(imageData)
    }

    const link = document.createElement("a")
    link.download = "dress-sketch.png"
    link.href = imageData
    link.click()
  }

  const currentNecklineOption = necklineOptions.find((opt) => opt.key === selectedNeckline)

  const createLacePattern = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const patternCanvas = document.createElement("canvas")
    patternCanvas.width = 16
    patternCanvas.height = 16
    const patternCtx = patternCanvas.getContext("2d")!

    // 배경을 투명하게
    patternCtx.clearRect(0, 0, 16, 16)

    // 더 자연스러운 레이스 색상
    patternCtx.fillStyle = "#f8f6f0"
    patternCtx.strokeStyle = "#e8e6e0"
    patternCtx.lineWidth = 1
    patternCtx.globalAlpha = 0.8

    // 부드러운 그림자
    patternCtx.shadowColor = "#d4d4d4"
    patternCtx.shadowBlur = 1
    patternCtx.shadowOffsetX = 1
    patternCtx.shadowOffsetY = 1

    // 중앙 원
    patternCtx.beginPath()
    patternCtx.arc(8, 8, 3, 0, Math.PI * 2)
    patternCtx.fill()
    patternCtx.stroke()

    // 4개 모서리 점
    const corners = [
      [4, 4],
      [12, 4],
      [4, 12],
      [12, 12],
    ]
    corners.forEach(([cx, cy]) => {
      patternCtx.beginPath()
      patternCtx.arc(cx, cy, 1, 0, Math.PI * 2)
      patternCtx.fill()
    })

    return ctx.createPattern(patternCanvas, "repeat")
  }

  const createFlowerLacePattern = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const patternCanvas = document.createElement("canvas")
    patternCanvas.width = 32
    patternCanvas.height = 32
    const patternCtx = patternCanvas.getContext("2d")!

    // 배경을 투명하게
    patternCtx.clearRect(0, 0, 32, 32)

    // 연한 핑크/크림 색상으로 변경
    patternCtx.fillStyle = "#fefcff" // 기존 "#fdf2f8"에서 변경
    patternCtx.strokeStyle = "#f3e8ff"
    patternCtx.lineWidth = 1

    // 매우 연한 그림자
    patternCtx.shadowColor = "#e0e0e0"
    patternCtx.shadowBlur = 1
    patternCtx.shadowOffsetX = 0.5
    patternCtx.shadowOffsetY = 0.5

    // 중앙 꽃
    const centerX = 16
    const centerY = 16

    // 꽃 중심
    patternCtx.beginPath()
    patternCtx.arc(centerX, centerY, 2, 0, Math.PI * 2)
    patternCtx.fill()

    // 꽃잎 5개 - 더 작고 연하게
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5
      const petalX = centerX + Math.cos(angle) * 6
      const petalY = centerY + Math.sin(angle) * 6

      patternCtx.save()
      patternCtx.translate(petalX, petalY)
      patternCtx.rotate(angle)
      patternCtx.beginPath()
      patternCtx.ellipse(0, 0, 3, 1.5, 0, 0, Math.PI * 2)
      patternCtx.fill()
      patternCtx.restore()
    }

    return ctx.createPattern(patternCanvas, "repeat")
  }

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader className="bg-purple-500 text-white py-3">
        <CardTitle className="text-center text-base font-semibold whitespace-nowrap">✏️ 드레스 스케치</CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-3">
        {/* 치마 스타일 선택 */}
        <div>
          <h4 className="text-sm font-semibold mb-2 whitespace-nowrap">👗 치마 스타일</h4>
          <div className="flex flex-wrap gap-1 w-full">
            {skirtOptions.map((option) => (
              <Badge
                key={option.key}
                variant={currentSkirt === option.key ? "default" : "outline"}
                className={`cursor-pointer text-xs py-1 px-2 flex-shrink-0 whitespace-nowrap ${
                  currentSkirt === option.key ? "bg-blue-500 hover:bg-blue-600" : "hover:bg-gray-100"
                }`}
                onClick={() => handleSkirtChange(option.key)}
              >
                {option.label}
              </Badge>
            ))}
          </div>
          <div className="text-xs text-blue-600 mt-1">
            ✨ {currentSkirt} 드레스 표시 중{currentSkirt === "A라인" && " - 클래식한 A자 실루엣"}
            {currentSkirt === "벨라인" && " - 볼륨감 있는 풍성한 스커트"}
            {currentSkirt === "머메이드" && " - 몸에 피트되는 인어 실루엣"}
            {onSkirtChange && " | 메인 앱과 연동됨"}
          </div>
        </div>

        {/* 메인 캔버스 컨테이너 */}
        <div className="flex justify-center">
          <div
            ref={containerRef}
            className="relative border border-gray-300 rounded-lg overflow-hidden"
            style={{ width: 300, height: 400 }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* 배경 캔버스 (드레스만) */}
            <canvas
              ref={backgroundCanvasRef}
              className="absolute inset-0"
              style={{ width: "100%", height: "100%", zIndex: 1 }}
            />

            {/* 사용자 그림 캔버스 */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 cursor-crosshair touch-none"
              style={{ width: "100%", height: "100%", zIndex: 2 }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />

            {/* 넥라인 오버레이 */}
            {selectedNeckline !== "none" && currentNecklineOption?.image && (
              <div
                ref={necklineRef}
                className="absolute cursor-move select-none"
                style={{
                  left: necklinePosition.x,
                  top: necklinePosition.y,
                  width: necklinePosition.width,
                  height: necklinePosition.height,
                  border: isDragging || isResizing ? "2px dashed #8b5cf6" : "1px dashed rgba(139, 92, 246, 0.5)",
                  borderRadius: "4px",
                  backgroundImage: `url(${currentNecklineOption.image})`,
                  backgroundSize: "100% 100%",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                  pointerEvents: toolMode === "select" ? "auto" : "none",
                  zIndex: 3,
                }}
                onMouseDown={toolMode === "select" ? handleMouseDown : undefined}
              >
                {/* 리사이즈 핸들들 - select 모드일 때만 표시 */}
                {toolMode === "select" && (
                  <>
                    <div
                      className="absolute top-1/2 right-0 w-3 h-6 bg-purple-500 cursor-e-resize rounded-l-md opacity-70 hover:opacity-100"
                      style={{ transform: "translate(50%, -50%)" }}
                      onMouseDown={(e) => handleResizeStart(e, "horizontal")}
                      title="가로 크기 조절"
                    >
                      <div className="absolute inset-1 border-r border-white"></div>
                    </div>

                    <div
                      className="absolute bottom-0 left-1/2 w-6 h-3 bg-purple-500 cursor-s-resize rounded-t-md opacity-70 hover:opacity-100"
                      style={{ transform: "translate(-50%, 50%)" }}
                      onMouseDown={(e) => handleResizeStart(e, "vertical")}
                      title="세로 크기 조절"
                    >
                      <div className="absolute inset-1 border-b border-white"></div>
                    </div>

                    <div
                      className="absolute bottom-0 right-0 w-4 h-4 bg-purple-600 cursor-se-resize rounded-tl-md opacity-70 hover:opacity-100"
                      style={{ transform: "translate(50%, 50%)" }}
                      onMouseDown={(e) => handleResizeStart(e, "diagonal")}
                      title="전체 크기 조절"
                    >
                      <div className="absolute inset-1 border-r border-b border-white"></div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 넥라인 선택 */}
        <div>
          <h4 className="text-sm font-semibold mb-2 whitespace-nowrap">👗 넥라인 스타일</h4>
          <div className="flex flex-wrap gap-1 w-full">
            {necklineOptions.map((option) => (
              <Badge
                key={option.key}
                variant={selectedNeckline === option.key ? "default" : "outline"}
                className={`cursor-pointer text-xs py-1 px-2 flex-shrink-0 whitespace-nowrap ${
                  selectedNeckline === option.key ? "bg-purple-500 hover:bg-purple-600" : "hover:bg-gray-100"
                }`}
                onClick={() => handleNecklineChange(option.key)}
              >
                {option.label}
              </Badge>
            ))}
          </div>
          {selectedNeckline !== "none" && (
            <div className="text-xs text-purple-600 mt-1">
              ✨ {currentNecklineOption?.label} 적용됨{onNecklineChange && " | 메인 앱과 연동됨"}
              <br />📍 선택 모드에서 드래그: 이동 | 핸들: 크기조절
            </div>
          )}
        </div>

        {/* 도구 선택 */}
        <div>
          <h4 className="text-sm font-semibold mb-2 whitespace-nowrap">🛠️ 도구</h4>
          <div className="flex gap-2">
            <Button
              variant={toolMode === "select" ? "default" : "outline"}
              size="sm"
              className="flex-1 text-xs whitespace-nowrap"
              onClick={() => setToolMode("select")}
            >
              👆 선택
            </Button>
            <Button
              variant={toolMode === "brush" ? "default" : "outline"}
              size="sm"
              className="flex-1 text-xs whitespace-nowrap"
              onClick={() => {
                setToolMode("brush")
                setIsErasing(false)
                setBrushPanelExpanded(true)
              }}
            >
              ✏️ 브러시
            </Button>
            <Button
              variant={toolMode === "eraser" ? "default" : "outline"}
              size="sm"
              className="flex-1 text-xs whitespace-nowrap"
              onClick={() => {
                setToolMode("eraser")
                setIsErasing(true)
                setBrushPanelExpanded(true)
              }}
            >
              🧽 지우개
            </Button>
          </div>
          {toolMode === "select" && <div className="text-xs text-blue-600 mt-1">✨ 넥라인 선택 및 크기 조절 모드</div>}

          {toolMode === "brush" && (
            <div className="text-xs text-green-600 mt-1">
              ✨ 브러시 모드 -{brushType === "solid" && "일반 색상 브러시"}
              {brushType === "lace" && "흩날리는 레이스 질감 🕸️✨"}
              {brushType === "lace-flower" && "꽃무늬 레이스 질감 🌸✨"}
              {brushType === "silver-weak" && "얇은 큐빅 반짝이 (약함) 💎"}
              {brushType === "silver-strong" && "다이아몬드 반짝이 (강함) 💎✨"}
            </div>
          )}
          {toolMode === "eraser" && (
            <div className="text-xs text-orange-600 mt-1">✨ 지우개 모드 - 모든 영역 지우기 가능</div>
          )}
        </div>

        {/* 브러시 설정 패널 */}
        {(toolMode === "brush" || toolMode === "eraser") && (
          <div className="border rounded-lg p-3 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold whitespace-nowrap">
                🎨 {toolMode === "eraser" ? "지우개" : "브러시"} 설정
              </h4>
              <Button
                variant="ghost"
                size="sm"
                className="w-6 h-6 p-0"
                onClick={() => setBrushPanelExpanded(!brushPanelExpanded)}
              >
                {brushPanelExpanded ? "▲" : "▼"}
              </Button>
            </div>

            {brushPanelExpanded && (
              <div className="space-y-3">
                {/* 브러시 타입 선택 */}
                <div>
                  <h5 className="text-xs font-semibold mb-2 whitespace-nowrap">브러시 타입</h5>
                  <div className="grid grid-cols-2 gap-2">
                    {/* 일반 색상 */}
                    <div className="space-y-2">
                      <h6 className="text-xs text-gray-600">일반 색상</h6>
                      <div className="flex gap-1 flex-wrap">
                        {[
                          { color: "#ff0000", name: "빨강", type: "solid" },
                          { color: "#0000ff", name: "파랑", type: "solid" },
                          { color: "#00ff00", name: "초록", type: "solid" },
                          { color: "#ffff00", name: "노랑", type: "solid" },
                          { color: "#ff00ff", name: "분홍", type: "solid" },
                          { color: "#000000", name: "검정", type: "solid" },
                        ].map((colorOption) => (
                          <button
                            key={colorOption.color}
                            className={`w-6 h-6 rounded-full border-2 flex-shrink-0 ${
                              brushColor === colorOption.color && brushType === "solid"
                                ? "border-gray-800"
                                : "border-gray-300"
                            }`}
                            style={{ backgroundColor: colorOption.color }}
                            onClick={() => {
                              setBrushColor(colorOption.color)
                              setBrushType("solid")
                            }}
                            title={colorOption.name}
                          />
                        ))}
                      </div>
                    </div>

                    {/* 특수 효과 */}
                    <div className="space-y-2">
                      <h6 className="text-xs text-gray-600">특수 효과</h6>
                      <div className="space-y-1">
                        <button
                          className={`w-full text-xs py-1 px-2 rounded border ${
                            brushType === "lace"
                              ? "bg-pink-100 border-pink-400 text-pink-700"
                              : "bg-gray-50 border-gray-300"
                          }`}
                          onClick={() => setBrushType("lace")}
                        >
                          🕸️ 레이스 질감
                        </button>
                        <button
                          className={`w-full text-xs py-1 px-2 rounded border ${
                            brushType === "lace-flower"
                              ? "bg-rose-100 border-rose-400 text-rose-700"
                              : "bg-gray-50 border-gray-300"
                          }`}
                          onClick={() => setBrushType("lace-flower")}
                        >
                          🌸 꽃무늬 레이스
                        </button>
                        <button
                          className={`w-full text-xs py-1 px-2 rounded border ${
                            brushType === "silver-weak"
                              ? "bg-gray-100 border-gray-400 text-gray-700"
                              : "bg-gray-50 border-gray-300"
                          }`}
                          onClick={() => setBrushType("silver-weak")}
                        >
                          ✨ 실버 반짝이 (약함)
                        </button>
                        <button
                          className={`w-full text-xs py-1 px-2 rounded border ${
                            brushType === "silver-strong"
                              ? "bg-gray-200 border-gray-500 text-gray-800"
                              : "bg-gray-50 border-gray-300"
                          }`}
                          onClick={() => setBrushType("silver-strong")}
                        >
                          💎 실버 반짝이 (강함)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {(brushType === "lace" ||
                  brushType === "lace-flower" ||
                  brushType === "silver-weak" ||
                  brushType === "silver-strong") && (
                  <div>
                    <h6 className="text-xs font-semibold mb-2 text-purple-600">특수 브러시 크기</h6>
                    <div className="flex gap-2">
                      {[6, 8, 12, 16, 20].map((size) => (
                        <Button
                          key={size}
                          variant={specialBrushSize === size ? "default" : "outline"}
                          size="sm"
                          className="w-8 h-8 p-0 text-xs flex-shrink-0"
                          onClick={() => setSpecialBrushSize(size)}
                        >
                          {size}
                        </Button>
                      ))}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">✨ 흩날리는 파티클 효과</div>
                  </div>
                )}

                <div>
                  <h5 className="text-xs font-semibold mb-2 whitespace-nowrap">
                    크기 {toolMode === "eraser" && "(지우개는 8배 크게!)"}
                  </h5>
                  <div className="flex gap-2">
                    {[2, 4, 8, 12, 16].map(
                      (
                        size, // 1,2,4,6,8에서 2,4,8,12,16으로 변경
                      ) => (
                        <Button
                          key={size}
                          variant={brushSize === size ? "default" : "outline"}
                          size="sm"
                          className="w-8 h-8 p-0 text-xs flex-shrink-0"
                          onClick={() => setBrushSize(size)}
                        >
                          {size}
                        </Button>
                      ),
                    )}
                  </div>
                  {toolMode === "eraser" && (
                    <div className="text-xs text-orange-500 mt-1">🔥 지우개는 선택한 크기의 8배로 작동!</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 버튼들 */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button
              onClick={clearUserDrawing}
              variant="outline"
              size="sm"
              className="flex-1 text-xs whitespace-nowrap bg-transparent"
            >
              🗑️ 그림 지우기
            </Button>
            <Button
              onClick={saveSketch}
              size="sm"
              className="flex-1 bg-purple-500 hover:bg-purple-600 text-xs whitespace-nowrap"
              disabled={!imageLoaded}
            >
              💾 저장
            </Button>
          </div>
        </div>

        {!imageLoaded && <div className="text-center text-sm text-gray-500 whitespace-nowrap">이미지 로딩 중...</div>}
      </CardContent>
    </Card>
  )
}
