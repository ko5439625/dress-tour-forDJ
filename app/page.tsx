"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ChevronDown, ChevronUp, Plus, Edit2, Trash2, Settings, X, FileText } from "lucide-react"
import DressSketch from "@/components/dress-sketch"

interface DressDetails {
  skirt?: string
  neckline?: string
  sleeve?: string
  material?: string
  mood?: string
  color?: string
  extraCost?: string
  extraCostAmount?: string
}

interface DressScores {
  [category: string]: number
}

interface Dress {
  id: string
  name: string
  priceRange: string
  memo: string
  details: DressDetails
  scores: DressScores
  sketchData?: string
}

interface Shop {
  id: string
  name: string
  description: string
  color: string
  emoji: string
  dresses: Dress[]
}

// 로컬 저장소 관리
const saveToLocalStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error("로컬 저장 실패:", error)
  }
}

const loadFromLocalStorage = (key: string) => {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error("로컬 로드 실패:", error)
    return null
  }
}

const ScoreButton = ({
  score,
  selected,
  onClick,
  color,
}: {
  score: number
  selected: boolean
  onClick: () => void
  color: string
}) => (
  <Button
    variant={selected ? "default" : "outline"}
    size="sm"
    className={`w-8 h-8 p-0 text-xs font-semibold flex-shrink-0 ${selected ? `${color} text-white` : ""}`}
    onClick={onClick}
  >
    {score}
  </Button>
)

const DetailOption = ({
  option,
  selected,
  onClick,
}: {
  option: string
  selected: boolean
  onClick: () => void
}) => (
  <Badge
    variant={selected ? "default" : "outline"}
    className={`cursor-pointer text-xs py-1 px-2 flex-shrink-0 whitespace-nowrap ${selected ? "bg-blue-500 hover:bg-blue-600" : "hover:bg-gray-100"}`}
    onClick={onClick}
  >
    {option}
  </Badge>
)

// 비밀번호 입력 컴포넌트
const PasswordModal = ({ onSuccess }: { onSuccess: () => void }) => {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === "0520") {
      onSuccess()
    } else {
      setError("잘못된 비밀번호입니다.")
      setPassword("")
    }
  }

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">🔐 드레스샵 투어 시스템</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-center text-sm text-gray-600">시스템 사용을 위해 비밀번호를 입력해주세요</div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="비밀번호 입력"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError("")
              }}
              className="text-center text-lg tracking-widest"
              autoFocus
            />
            {error && <div className="text-red-500 text-sm text-center">{error}</div>}
            <Button type="submit" className="w-full">
              확인
            </Button>
          </form>
          <div className="text-xs text-gray-400 text-center">💍 Wedding Dress Tour Comparison System v1.0</div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

const DressCard = ({
  dress,
  shop,
  onUpdate,
  onDelete,
}: {
  dress: Dress
  shop: Shop
  onUpdate: (dress: Dress) => void
  onDelete: (dressId: string) => void
}) => {
  const [showSketch, setShowSketch] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const updateDress = (updates: Partial<Dress>) => {
    onUpdate({ ...dress, ...updates })
  }

  const updateDetails = (key: keyof DressDetails, value: string) => {
    updateDress({
      details: { ...dress.details, [key]: value },
    })
  }

  const updateScore = (category: string, score: number) => {
    updateDress({
      scores: { ...dress.scores, [category]: score },
    })
  }

  const handleSketchSave = (imageData: string) => {
    updateDress({ sketchData: imageData })
    setShowSketch(false)
  }

  // 스케치에서 넥라인 변경 시 호출
  const handleNecklineChangeFromSketch = (neckline: string) => {
    updateDetails("neckline", neckline)
  }

  // 스케치에서 치마 변경 시 호출
  const handleSkirtChangeFromSketch = (skirt: string) => {
    updateDetails("skirt", skirt)
  }

  const handleDelete = () => {
    onDelete(dress.id)
    setShowDeleteConfirm(false)
  }

  const totalScore = Object.values(dress.scores).reduce((sum, score) => sum + score, 0)
  const maxScore = 30 // 6개 항목 × 5점

  const detailOptions = {
    skirt: ["A라인", "벨라인", "머메이드"], // 새로운 치마 옵션으로 업데이트
    neckline: ["라운드", "스퀘어", "브이넥", "오픈숄더", "일자넥", "하트넥", "홀터넥"],
    sleeve: ["민소매", "탑", "반팔", "긴팔"],
    material: ["비즈", "레이스", "실크", "쉬폰"],
    mood: ["청순", "세련", "고급", "화려", "러블리"],
    color: ["화이트", "아이보리"],
    extraCost: ["없음", "있음"],
  }

  const scoreCategories = [
    { key: "overall", label: "신부와의 조화" },
    { key: "bodyfit", label: "체형 어울림" },
    { key: "comfort", label: "편안함" },
    { key: "bride_satisfaction", label: "신부 만족도" },
    { key: "groom_satisfaction", label: "신랑 만족도" },
    { key: "venue_harmony", label: "예식홀과 어울림" },
  ]

  if (showSketch) {
    return (
      <div className="w-full max-w-sm mx-auto">
        <DressSketch
          onSave={handleSketchSave}
          selectedSkirt={dress.details.skirt}
          selectedNecklineFromParent={dress.details.neckline}
          onNecklineChange={handleNecklineChangeFromSketch}
          onSkirtChange={handleSkirtChangeFromSketch}
        />
        <div className="mt-3 text-center">
          <Button
            onClick={() => setShowSketch(false)}
            variant="outline"
            size="sm"
            className="text-xs whitespace-nowrap"
          >
            ← 돌아가기
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <Card className={`border-2 mb-3`} style={{ borderColor: shop.color }}>
        {/* 드레스 헤더 (항상 보임) */}
        <CardHeader className={`text-white py-3 relative`} style={{ backgroundColor: shop.color }}>
          <div className="flex items-center justify-between">
            <div
              className="flex-1 cursor-pointer flex items-center justify-center gap-2"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <CardTitle className="text-center text-base font-semibold">{dress.name}</CardTitle>
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>

            {/* 삭제 버튼 */}
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              size="sm"
              variant="ghost"
              className="absolute top-2 right-2 w-6 h-6 p-0 text-white hover:bg-white/20"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>

          {/* 총점 미리보기 */}
          {totalScore > 0 && (
            <div className="text-center text-sm opacity-90">
              {totalScore}/{maxScore}점
            </div>
          )}
        </CardHeader>

        {/* 삭제 확인 모달 */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 rounded-lg">
            <div className="bg-white p-4 rounded-lg shadow-lg max-w-xs mx-4">
              <h3 className="font-bold text-sm mb-2 text-center">드레스 삭제</h3>
              <p className="text-xs text-gray-600 mb-4 text-center">
                "{dress.name}"을(를) 삭제하시겠습니까?
                <br />
                <span className="text-red-500">모든 데이터가 영구 삭제됩니다.</span>
              </p>
              <div className="flex gap-2">
                <Button onClick={handleDelete} size="sm" className="flex-1 bg-red-500 hover:bg-red-600 text-xs">
                  삭제
                </Button>
                <Button
                  onClick={() => setShowDeleteConfirm(false)}
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                >
                  취소
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 드레스 상세 내용 (접을 수 있음) */}
        {isExpanded && (
          <CardContent className="p-3 space-y-3">
            {/* 기본 정보 */}
            <div className="space-y-2">
              <Input
                placeholder="드레스 번호/이름"
                value={dress.name}
                onChange={(e) => updateDress({ name: e.target.value })}
                className="text-sm h-10 w-full"
              />
              <Select value={dress.priceRange} onValueChange={(value) => updateDress({ priceRange: value })}>
                <SelectTrigger className="text-sm h-10 w-full">
                  <SelectValue placeholder="가격대 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="중간라인">중간라인</SelectItem>
                  <SelectItem value="고급라인">고급라인</SelectItem>
                  <SelectItem value="최고급라인">최고급라인</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="메모"
                value={dress.memo}
                onChange={(e) => updateDress({ memo: e.target.value })}
                className="text-sm h-10 w-full"
              />
            </div>

            {/* 스케치 버튼 */}
            <div className="flex gap-2">
              <Button
                onClick={() => setShowSketch(true)}
                size="sm"
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-xs whitespace-nowrap"
              >
                ✏️ 스케치하기
              </Button>
              {dress.sketchData && (
                <Button
                  onClick={() => {
                    const link = document.createElement("a")
                    link.download = `${dress.name}-sketch.png`
                    link.href = dress.sketchData
                    link.click()
                  }}
                  size="sm"
                  variant="outline"
                  className="text-xs whitespace-nowrap"
                >
                  💾 스케치 저장
                </Button>
              )}
            </div>

            {/* 저장된 스케치 미리보기 */}
            {dress.sketchData && (
              <div className="text-center">
                <img
                  src={dress.sketchData || "/placeholder.svg"}
                  alt="드레스 스케치"
                  className="max-w-full h-20 object-contain mx-auto border rounded"
                />
                <p className="text-xs text-gray-500 mt-1 whitespace-nowrap">저장된 스케치</p>
              </div>
            )}

            {/* 선택된 옵션 표시 */}
            <div className="bg-gray-50 p-3 rounded-lg text-center min-h-16">
              <div className="text-sm font-medium text-gray-700 mb-2">선택된 옵션</div>
              <div className="flex flex-wrap justify-center gap-1">
                {dress.details.skirt && (
                  <span className="inline-block px-2 py-1 text-xs bg-blue-500 text-white rounded-full whitespace-nowrap">
                    {dress.details.skirt}
                  </span>
                )}
                {dress.details.neckline && (
                  <span className="inline-block px-2 py-1 text-xs bg-purple-500 text-white rounded-full whitespace-nowrap">
                    {dress.details.neckline}
                  </span>
                )}
                {dress.details.sleeve && (
                  <span className="inline-block px-2 py-1 text-xs bg-green-500 text-white rounded-full whitespace-nowrap">
                    {dress.details.sleeve}
                  </span>
                )}
                {dress.details.material && (
                  <span className="inline-block px-2 py-1 text-xs bg-orange-500 text-white rounded-full whitespace-nowrap">
                    {dress.details.material}
                  </span>
                )}
                {dress.details.mood && (
                  <span className="inline-block px-2 py-1 text-xs bg-pink-500 text-white rounded-full whitespace-nowrap">
                    {dress.details.mood}
                  </span>
                )}
                {dress.details.color && (
                  <span className="inline-block px-2 py-1 text-xs bg-gray-500 text-white rounded-full whitespace-nowrap">
                    {dress.details.color}
                  </span>
                )}
                {dress.details.extraCost === "있음" && dress.details.extraCostAmount && (
                  <span className="inline-block px-2 py-1 text-xs bg-red-500 text-white rounded-full whitespace-nowrap">
                    추가금: {dress.details.extraCostAmount}
                  </span>
                )}
                {dress.details.extraCost === "없음" && (
                  <span className="inline-block px-2 py-1 text-xs bg-green-500 text-white rounded-full whitespace-nowrap">
                    추가금 없음
                  </span>
                )}
              </div>
              {Object.keys(dress.details).length === 0 && <p className="text-xs text-gray-500">옵션을 선택해주세요</p>}
            </div>

            {/* 디테일 선택 */}
            <div className="space-y-3">
              {Object.entries(detailOptions).map(([key, options]) => {
                if (key === "extraCost") return null // 추가금은 별도 처리
                return (
                  <div key={key} className="w-full">
                    <h4 className="text-sm font-semibold mb-2 whitespace-nowrap">
                      {key === "skirt"
                        ? "치마 형태"
                        : key === "neckline"
                          ? "넥라인"
                          : key === "sleeve"
                            ? "팔"
                            : key === "material"
                              ? "소재"
                              : key === "mood"
                                ? "분위기"
                                : key === "color"
                                  ? "컬러"
                                  : key}
                    </h4>
                    <div className="flex flex-wrap gap-1 w-full">
                      {options.map((option) => (
                        <DetailOption
                          key={option}
                          option={option}
                          selected={dress.details[key as keyof DressDetails] === option}
                          onClick={() => updateDetails(key as keyof DressDetails, option)}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}

              {/* 추가금 여부 및 금액 입력 */}
              <div className="w-full">
                <h4 className="text-sm font-semibold mb-2 whitespace-nowrap">추가금 여부</h4>
                <div className="flex flex-wrap gap-1 w-full mb-2">
                  {detailOptions.extraCost.map((option) => (
                    <DetailOption
                      key={option}
                      option={option}
                      selected={dress.details.extraCost === option}
                      onClick={() => updateDetails("extraCost", option)}
                    />
                  ))}
                </div>
                {dress.details.extraCost === "있음" && (
                  <Input
                    placeholder="추가금 금액 (예: 50만원)"
                    value={dress.details.extraCostAmount || ""}
                    onChange={(e) => updateDetails("extraCostAmount", e.target.value)}
                    className="text-sm h-8 w-full mt-1"
                  />
                )}
              </div>
            </div>

            {/* 점수 섹션 */}
            <div className="space-y-3 w-full">
              <h4 className="font-semibold text-sm whitespace-nowrap">평가 점수</h4>
              {scoreCategories.map((category) => (
                <div key={category.key} className="w-full">
                  <div className="text-xs font-medium text-gray-700 mb-1 whitespace-nowrap min-w-20">
                    {category.label}
                  </div>
                  <div className="flex justify-center gap-1 w-full">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <ScoreButton
                        key={score}
                        score={score}
                        selected={dress.scores[category.key] === score}
                        onClick={() => updateScore(category.key, score)}
                        color={
                          shop.color.includes("blue")
                            ? "bg-blue-500 hover:bg-blue-600"
                            : shop.color.includes("red")
                              ? "bg-red-500 hover:bg-red-600"
                              : "bg-gray-500 hover:bg-gray-600"
                        }
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* 총점 */}
            <div className="bg-gray-50 p-3 rounded-lg text-center w-full">
              <div className="font-bold text-base whitespace-nowrap">
                총점: {totalScore}/{maxScore}
              </div>
              <div className="text-xs text-gray-600 mt-1 space-y-1">
                <div className="whitespace-nowrap">
                  {dress.details.neckline && `넥: ${dress.details.neckline}`}
                  {dress.details.sleeve && ` | 팔: ${dress.details.sleeve}`}
                  {dress.details.skirt && ` | 치마: ${dress.details.skirt}`}
                </div>
                <div className="whitespace-nowrap">
                  {dress.details.material && `소재: ${dress.details.material}`}
                  {dress.details.mood && ` | 분위기: ${dress.details.mood}`}
                  {dress.details.color && ` | 컬러: ${dress.details.color}`}
                </div>
                {dress.details.extraCost === "있음" && dress.details.extraCostAmount && (
                  <div className="whitespace-nowrap text-red-600">추가금: {dress.details.extraCostAmount}</div>
                )}
                {dress.details.extraCost === "없음" && (
                  <div className="whitespace-nowrap text-green-600">추가금 없음</div>
                )}
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}

const ShopManager = ({
  shops,
  onAddShop,
  onUpdateShop,
  onDeleteShop,
}: {
  shops: Shop[]
  onAddShop: (shop: Omit<Shop, "id" | "dresses">) => void
  onUpdateShop: (shopId: string, updates: Partial<Shop>) => void
  onDeleteShop: (shopId: string) => void
}) => {
  const [isAdding, setIsAdding] = useState(false)
  const [editingShop, setEditingShop] = useState<string | null>(null)
  const [newShop, setNewShop] = useState({
    name: "",
    description: "",
    color: "#3b82f6",
    emoji: "🏢",
  })

  const colors = [
    { name: "파랑", value: "#3b82f6" },
    { name: "빨강", value: "#ef4444" },
    { name: "초록", value: "#10b981" },
    { name: "보라", value: "#8b5cf6" },
    { name: "주황", value: "#f97316" },
    { name: "분홍", value: "#ec4899" },
  ]

  const emojis = ["🏢", "💍", "👗", "✨", "🎨", "💎", "🌟", "🏪", "🛍️", "💐"]

  const handleAddShop = () => {
    if (newShop.name.trim()) {
      onAddShop(newShop)
      setNewShop({ name: "", description: "", color: "#3b82f6", emoji: "🏢" })
      setIsAdding(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm whitespace-nowrap">업체 관리</h3>
        <Button
          onClick={() => setIsAdding(true)}
          size="sm"
          className="bg-green-500 hover:bg-green-600 text-xs whitespace-nowrap"
        >
          <Plus className="w-3 h-3 mr-1" />
          업체 추가
        </Button>
      </div>

      {/* 새 업체 추가 폼 */}
      {isAdding && (
        <Card className="border-green-200">
          <CardContent className="p-3 space-y-3">
            <Input
              placeholder="업체명"
              value={newShop.name}
              onChange={(e) => setNewShop({ ...newShop, name: e.target.value })}
              className="text-sm"
            />
            <Textarea
              placeholder="업체 설명"
              value={newShop.description}
              onChange={(e) => setNewShop({ ...newShop, description: e.target.value })}
              className="text-sm resize-none"
              rows={2}
            />
            <div>
              <h4 className="text-xs font-semibold mb-2">색상</h4>
              <div className="flex gap-2">
                {colors.map((color) => (
                  <button
                    key={color.value}
                    className={`w-6 h-6 rounded-full border-2 ${
                      newShop.color === color.value ? "border-gray-800" : "border-gray-300"
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setNewShop({ ...newShop, color: color.value })}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold mb-2">아이콘</h4>
              <div className="flex gap-2 flex-wrap">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    className={`w-8 h-8 text-sm border rounded ${
                      newShop.emoji === emoji ? "border-gray-800 bg-gray-100" : "border-gray-300"
                    }`}
                    onClick={() => setNewShop({ ...newShop, emoji })}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddShop} size="sm" className="flex-1 text-xs">
                추가
              </Button>
              <Button onClick={() => setIsAdding(false)} variant="outline" size="sm" className="flex-1 text-xs">
                취소
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 기존 업체 목록 */}
      <div className="space-y-2">
        {shops.map((shop) => (
          <Card key={shop.id} className="border-2" style={{ borderColor: shop.color }}>
            <CardContent className="p-3">
              {editingShop === shop.id ? (
                <div className="space-y-2">
                  <Input
                    value={shop.name}
                    onChange={(e) => onUpdateShop(shop.id, { name: e.target.value })}
                    className="text-sm"
                  />
                  <Textarea
                    value={shop.description}
                    onChange={(e) => onUpdateShop(shop.id, { description: e.target.value })}
                    className="text-sm resize-none"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button onClick={() => setEditingShop(null)} size="sm" className="flex-1 text-xs">
                      완료
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{shop.emoji}</span>
                      <span className="font-semibold text-sm">{shop.name}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        onClick={() => setEditingShop(shop.id)}
                        size="sm"
                        variant="outline"
                        className="w-6 h-6 p-0"
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        onClick={() => onDeleteShop(shop.id)}
                        size="sm"
                        variant="outline"
                        className="w-6 h-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">{shop.description}</p>
                  <div className="text-xs text-gray-500 mt-1">드레스 {shop.dresses.length}개</div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default function DressShopTour() {
  const [shops, setShops] = useState<Shop[]>([])
  const [activeTab, setActiveTab] = useState<string>("manage")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  // 컴포넌트 마운트 시 로컬 저장소에서 데이터 로드
  useEffect(() => {
    const savedShops = loadFromLocalStorage("shops")

    if (savedShops && savedShops.length > 0) {
      setShops(savedShops)
      setActiveTab(savedShops[0].id)
    } else {
      // 초기 업체 2개 생성
      const initialShops: Shop[] = [
        {
          id: "meraki",
          name: "메라키",
          description: "독특한 디자인 드레스, 디자이너 있음, 신상샵이라 저렴한 편",
          color: "#3b82f6",
          emoji: "🎨",
          dresses: Array.from({ length: 4 }, (_, i) => ({
            id: `meraki_dress${i + 1}`,
            name: `드레스 ${i + 1}`,
            priceRange: "",
            memo: "",
            details: {},
            scores: {},
          })),
        },
        {
          id: "edeline",
          name: "에델린",
          description: "신상샵, 비즈 드레스 유명한 곳",
          color: "#ef4444",
          emoji: "✨",
          dresses: Array.from({ length: 4 }, (_, i) => ({
            id: `edeline_dress${i + 1}`,
            name: `드레스 ${i + 1}`,
            priceRange: "",
            memo: "",
            details: {},
            scores: {},
          })),
        },
      ]
      setShops(initialShops)
      setActiveTab("manage")
    }
  }, [])

  // 데이터 변경 시 로컬 저장소에 저장
  useEffect(() => {
    if (shops.length > 0) {
      saveToLocalStorage("shops", shops)
    }
  }, [shops])

  const addShop = (shopData: Omit<Shop, "id" | "dresses">) => {
    const newShop: Shop = {
      ...shopData,
      id: `shop_${Date.now()}`,
      dresses: Array.from({ length: 4 }, (_, i) => ({
        id: `shop_${Date.now()}_dress${i + 1}`,
        name: `드레스 ${i + 1}`,
        priceRange: "",
        memo: "",
        details: {},
        scores: {},
      })),
    }
    setShops([...shops, newShop])
  }

  const updateShop = (shopId: string, updates: Partial<Shop>) => {
    setShops((prev) => prev.map((shop) => (shop.id === shopId ? { ...shop, ...updates } : shop)))
  }

  const deleteShop = (shopId: string) => {
    setShops((prev) => prev.filter((shop) => shop.id !== shopId))
    if (activeTab === shopId) {
      setActiveTab(shops.length > 1 ? shops.find((s) => s.id !== shopId)?.id || "manage" : "manage")
    }
  }

  const addDress = (shopId: string) => {
    setShops((prev) =>
      prev.map((shop) => {
        if (shop.id === shopId) {
          const newDress: Dress = {
            id: `${shopId}_dress${shop.dresses.length + 1}`,
            name: `드레스 ${shop.dresses.length + 1}`,
            priceRange: "",
            memo: "",
            details: {},
            scores: {},
          }
          return { ...shop, dresses: [...shop.dresses, newDress] }
        }
        return shop
      }),
    )
  }

  const updateDress = (shopId: string, updatedDress: Dress) => {
    setShops((prev) =>
      prev.map((shop) => {
        if (shop.id === shopId) {
          return {
            ...shop,
            dresses: shop.dresses.map((dress) => (dress.id === updatedDress.id ? updatedDress : dress)),
          }
        }
        return shop
      }),
    )
  }

  const deleteDress = (shopId: string, dressId: string) => {
    setShops((prev) =>
      prev.map((shop) => {
        if (shop.id === shopId) {
          return {
            ...shop,
            dresses: shop.dresses.filter((dress) => dress.id !== dressId),
          }
        }
        return shop
      }),
    )
  }

  const getBestDress = (dresses: Dress[]) => {
    if (dresses.length === 0) return null
    return dresses.reduce((best, current) => {
      const currentScore = Object.values(current.scores).reduce((sum, score) => sum + score, 0)
      const bestScore = Object.values(best.scores).reduce((sum, score) => sum + score, 0)
      return currentScore > bestScore ? current : best
    }, dresses[0])
  }

  // PDF 생성 함수
  const generatePDF = async () => {
    setIsGeneratingPDF(true)
    try {
      // html2canvas 동적 import
      const html2canvas = (await import("html2canvas")).default
      const jsPDF = (await import("jspdf")).default

      const pdf = new jsPDF("p", "mm", "a4")
      const pageWidth = 210
      const pageHeight = 297

      // 제목 페이지 HTML 생성
      const createTitlePage = () => {
        const titleDiv = document.createElement("div")
        titleDiv.style.cssText = `
        width: 800px; height: 1131px; padding: 40px; background: white;
        font-family: 'Malgun Gothic', sans-serif; text-align: center;
      `
        titleDiv.innerHTML = `
        <h1 style="font-size: 32px; margin-bottom: 20px; color: #333;">💍 드레스샵 투어 비교 리포트</h1>
        <p style="font-size: 20px; margin-bottom: 10px; color: #666;">생성일: ${new Date().toLocaleDateString("ko-KR")}</p>
        <p style="font-size: 16px; color: #888;">총 ${shops.length}개 업체 | ${shops.reduce((sum, shop) => sum + shop.dresses.length, 0)}개 드레스</p>
      `
        return titleDiv
      }

      // 업체별 페이지 HTML 생성
      const createShopPage = (shop: Shop) => {
        const shopDiv = document.createElement("div")
        shopDiv.style.cssText = `
    width: 800px; height: 1131px; padding: 30px; background: white;
    font-family: 'Malgun Gothic', sans-serif;
  `

        const dressesHTML = shop.dresses
          .slice(0, 4)
          .map((dress, index) => {
            const totalScore = Object.values(dress.scores).reduce((sum, score) => sum + score, 0)
            const col = index % 2
            const row = Math.floor(index / 2)

            // 평가 점수 상세 정보
            const scoreCategories = [
              { key: "overall", label: "신부조화" },
              { key: "bodyfit", label: "체형어울림" },
              { key: "comfort", label: "편안함" },
              { key: "bride_satisfaction", label: "신부만족" },
              { key: "groom_satisfaction", label: "신랑만족" },
              { key: "venue_harmony", label: "예식홀조화" },
            ]

            const scoresHTML = scoreCategories
              .map((category) => {
                const score = dress.scores[category.key] || 0
                return `<span style="font-size: 10px; color: #666; margin-right: 8px;">${category.label}: ${score}</span>`
              })
              .join("")

            // 스케치 이미지 HTML (있는 경우에만)
            const sketchHTML = dress.sketchData
              ? `<div style="margin-top: 8px;">
             <img src="${dress.sketchData}" style="width: 60px; height: 60px; object-fit: contain; border: 1px solid #ddd; border-radius: 4px;" />
             <p style="font-size: 9px; color: #8b5cf6; margin: 2px 0 0 0;">✏️ 스케치</p>
           </div>`
              : ""

            return `
        <div style="
          position: absolute; 
          left: ${col * 360 + 30}px; 
          top: ${row * 450 + 120}px; 
          width: 340px; 
          height: 420px; 
          border: 2px solid ${shop.color}; 
          border-radius: 8px; 
          padding: 15px; 
          background: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        ">
          <h3 style="font-size: 18px; margin-bottom: 10px; color: ${shop.color}; font-weight: bold;">${dress.name}</h3>
          <p style="font-size: 14px; margin-bottom: 8px; font-weight: bold;"><strong>점수:</strong> ${totalScore}/30</p>
          ${dress.priceRange ? `<p style="font-size: 12px; margin-bottom: 6px;"><strong>가격:</strong> ${dress.priceRange}</p>` : ""}
          
          <!-- 드레스 상세 정보 -->
          ${dress.details.skirt ? `<p style="font-size: 12px; margin-bottom: 4px;"><strong>치마:</strong> ${dress.details.skirt}</p>` : ""}
          ${dress.details.neckline ? `<p style="font-size: 12px; margin-bottom: 4px;"><strong>넥라인:</strong> ${dress.details.neckline}</p>` : ""}
          ${dress.details.sleeve ? `<p style="font-size: 12px; margin-bottom: 4px;"><strong>소매:</strong> ${dress.details.sleeve}</p>` : ""}
          ${dress.details.material ? `<p style="font-size: 12px; margin-bottom: 4px;"><strong>소재:</strong> ${dress.details.material}</p>` : ""}
          ${dress.details.mood ? `<p style="font-size: 12px; margin-bottom: 4px;"><strong>분위기:</strong> ${dress.details.mood}</p>` : ""}
          ${
            dress.details.extraCost === "있음" && dress.details.extraCostAmount
              ? `<p style="font-size: 12px; margin-bottom: 4px; color: red;"><strong>추가금:</strong> ${dress.details.extraCostAmount}</p>`
              : dress.details.extraCost === "없음"
                ? `<p style="font-size: 12px; margin-bottom: 4px; color: green;"><strong>추가금:</strong> 없음</p>`
                : ""
          }
          
          <!-- 평가 점수 상세 -->
          ${
            totalScore > 0
              ? `<div style="margin-top: 10px; padding: 8px; background: #f8f9fa; border-radius: 4px; border-left: 3px solid ${shop.color};">
                   <p style="font-size: 11px; font-weight: bold; margin-bottom: 4px; color: ${shop.color};">📊 평가 점수</p>
                   <div style="line-height: 1.3;">
                     ${scoresHTML}
                   </div>
                 </div>`
              : ""
          }
          
          ${dress.memo ? `<p style="font-size: 11px; color: #666; margin-top: 8px;"><strong>메모:</strong> ${dress.memo}</p>` : ""}
          
          <!-- 스케치 이미지 -->
          ${sketchHTML}
        </div>
      `
          })
          .join("")

        shopDiv.innerHTML = `
    <div style="background: ${shop.color}; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h2 style="font-size: 24px; margin: 0;">${shop.emoji} ${shop.name}</h2>
      <p style="font-size: 14px; margin: 10px 0 0 0; opacity: 0.9;">${shop.description}</p>
    </div>
    <div style="position: relative; height: 900px;">
      ${dressesHTML}
    </div>
  `
        return shopDiv
      }

      // 최종 분석 페이지 HTML 생성
      const createSummaryPage = () => {
        const allDresses = shops
          .flatMap((shop) =>
            shop.dresses
              .filter((dress) => Object.keys(dress.scores).length > 0)
              .map((dress) => ({
                ...dress,
                totalScore: Object.values(dress.scores).reduce((sum, score) => sum + score, 0),
                shopName: shop.name,
                shopEmoji: shop.emoji,
                shopColor: shop.color,
              })),
          )
          .sort((a, b) => b.totalScore - a.totalScore)
          .slice(0, 3)

        const shopStats = shops
          .map((shop) => {
            const scores = shop.dresses
              .filter((dress) => Object.keys(dress.scores).length > 0)
              .map((dress) => Object.values(dress.scores).reduce((sum, score) => sum + score, 0))
            const avg =
              scores.length > 0 ? (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1) : "0.0"
            return { ...shop, avg: Number.parseFloat(avg), count: scores.length }
          })
          .sort((a, b) => b.avg - a.avg)

        const summaryDiv = document.createElement("div")
        summaryDiv.style.cssText = `
        width: 800px; height: 1131px; padding: 30px; background: white;
        font-family: 'Malgun Gothic', sans-serif;
      `

        const top3HTML = allDresses
          .map(
            (dress, index) => `
        <div style="
          padding: 15px; margin-bottom: 10px; border-radius: 8px;
          border-left: 4px solid ${index === 0 ? "#fbbf24" : index === 1 ? "#9ca3af" : "#fb923c"};
          background: ${index === 0 ? "#fef3c7" : index === 1 ? "#f3f4f6" : "#fed7aa"};
        ">
          <h4 style="margin: 0 0 5px 0; font-size: 16px;">${index + 1}위. ${dress.name} (${dress.shopEmoji} ${dress.shopName})</h4>
          <p style="margin: 0; font-size: 14px; color: #666;">${dress.totalScore}점 | ${dress.details.skirt || ""} ${dress.details.neckline || ""}</p>
        </div>
      `,
          )
          .join("")

        const shopStatsHTML = shopStats
          .map(
            (shop, index) => `
        <div style="
          display: flex; justify-content: space-between; align-items: center;
          padding: 12px; margin-bottom: 8px; border-radius: 6px;
          background: ${shop.color}20; border-left: 3px solid ${shop.color};
        ">
          <span style="font-size: 14px; font-weight: bold;">${shop.emoji} ${shop.name} ${index === 0 && shop.avg > 0 ? "🏆" : ""}</span>
          <span style="font-size: 14px; font-weight: bold;">${shop.avg}점 (${shop.count}개)</span>
        </div>
      `,
          )
          .join("")

        summaryDiv.innerHTML = `
        <div style="background: linear-gradient(135deg, #8b5cf6, #ec4899); color: white; padding: 20px; border-radius: 12px; margin-bottom: 30px;">
          <h2 style="font-size: 24px; margin: 0; text-align: center;">🏆 최종 분석 리포트</h2>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h3 style="font-size: 20px; color: #8b5cf6; margin-bottom: 15px;">🥇 TOP 3 드레스</h3>
          ${top3HTML}
        </div>
        
        <div>
          <h3 style="font-size: 20px; color: #10b981; margin-bottom: 15px;">📊 업체별 평균 점수</h3>
          ${shopStatsHTML}
          ${
            shopStats.length > 0 && shopStats[0].avg > 0
              ? `
            <div style="
              text-align: center; padding: 20px; margin-top: 20px;
              background: linear-gradient(135deg, #ddd6fe, #fce7f3); border-radius: 8px;
            ">
              <h4 style="margin: 0 0 5px 0; font-size: 16px;">🏆 최종 추천: ${shopStats[0].emoji} ${shopStats[0].name}</h4>
              <p style="margin: 0; font-size: 14px; color: #666;">평균 ${shopStats[0].avg}점으로 1위!</p>
            </div>
          `
              : ""
          }
        </div>
      `
        return summaryDiv
      }

      // 임시 컨테이너 생성
      const tempContainer = document.createElement("div")
      tempContainer.style.cssText = "position: absolute; left: -9999px; top: -9999px;"
      document.body.appendChild(tempContainer)

      try {
        // 제목 페이지 추가
        const titlePage = createTitlePage()
        tempContainer.appendChild(titlePage)
        const titleCanvas = await html2canvas(titlePage, { scale: 2, useCORS: true })
        const titleImgData = titleCanvas.toDataURL("image/png")
        pdf.addImage(titleImgData, "PNG", 0, 0, pageWidth, pageHeight)

        // 업체별 페이지 추가
        for (const shop of shops) {
          pdf.addPage()
          const shopPage = createShopPage(shop)
          tempContainer.appendChild(shopPage)
          const shopCanvas = await html2canvas(shopPage, { scale: 2, useCORS: true })
          const shopImgData = shopCanvas.toDataURL("image/png")
          pdf.addImage(shopImgData, "PNG", 0, 0, pageWidth, pageHeight)
          tempContainer.removeChild(shopPage)
        }

        // 최종 분석 페이지 추가
        pdf.addPage()
        const summaryPage = createSummaryPage()
        tempContainer.appendChild(summaryPage)
        const summaryCanvas = await html2canvas(summaryPage, { scale: 2, useCORS: true })
        const summaryImgData = summaryCanvas.toDataURL("image/png")
        pdf.addImage(summaryImgData, "PNG", 0, 0, pageWidth, pageHeight)

        // 페이지 번호 추가
        const pageCount = pdf.getNumberOfPages()
        for (let i = 1; i <= pageCount; i++) {
          pdf.setPage(i)
          pdf.setFontSize(10)
          pdf.setTextColor(128, 128, 128)
          pdf.text(`${i} / ${pageCount}`, pageWidth - 15, pageHeight - 5, { align: "right" })
        }

        // PDF 저장
        pdf.save(`드레스샵투어리포트_${new Date().toISOString().split("T")[0]}.pdf`)
      } finally {
        // 임시 컨테이너 제거
        document.body.removeChild(tempContainer)
      }
    } catch (error) {
      console.error("PDF 생성 오류:", error)
      alert("PDF 생성 중 오류가 발생했습니다.")
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  // 비밀번호 인증이 안 되어 있으면 비밀번호 모달 표시
  if (!isAuthenticated) {
    return <PasswordModal onSuccess={() => setIsAuthenticated(true)} />
  }

  return (
    <div className="min-h-screen bg-gray-50 px-3 py-4">
      <div className="w-full max-w-sm mx-auto">
        {/* 개발자 정보 */}
        <div className="text-center mb-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white p-3 rounded-xl shadow-lg border border-purple-200">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
            <div className="text-xs font-medium whitespace-nowrap flex items-center justify-center gap-2">
              <span>💪</span>
              <span>개발자: 근육고구마</span>
              <span>|</span>
              <span>📞 010.4890.6925</span>
            </div>
            <div className="text-xs font-medium whitespace-nowrap mt-1 flex items-center justify-center gap-2">
              <span>📧</span>
              <span>ko5439625@naver.com</span>
            </div>
          </div>
        </div>

        {/* 헤더 */}
        <div className="text-center mb-4 bg-white p-4 rounded-lg shadow-sm">
          <h1 className="text-lg font-bold text-gray-800 mb-1 whitespace-nowrap">💍 드레스샵 투어 비교 체크리스트</h1>
          <p className="text-sm text-gray-600 whitespace-nowrap">업체별 드레스 비교</p>

          {/* PDF 생성 버튼 */}
          <div className="mt-3">
            <Button
              onClick={generatePDF}
              disabled={isGeneratingPDF || shops.length === 0}
              className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white text-xs px-4 py-2 shadow-lg"
            >
              {isGeneratingPDF ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                  PDF 생성 중...
                </>
              ) : (
                <>
                  <FileText className="w-3 h-3 mr-1" />📄 PDF 리포트 생성
                </>
              )}
            </Button>
          </div>
        </div>

        {/* 탭 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 w-full">
          <TabsList
            className="grid w-full"
            style={{ gridTemplateColumns: `repeat(${Math.min(shops.length + 2, 6)}, 1fr)` }}
          >
            <TabsTrigger
              value="manage"
              className="data-[state=active]:bg-gray-500 data-[state=active]:text-white text-sm font-medium whitespace-nowrap px-3 py-2"
            >
              <Settings className="w-4 h-4 mr-1" />
              관리
            </TabsTrigger>
            {shops.map((shop) => (
              <TabsTrigger
                key={shop.id}
                value={shop.id}
                className="data-[state=active]:text-white text-sm font-medium whitespace-nowrap px-3 py-2"
                style={{
                  backgroundColor: activeTab === shop.id ? shop.color : "transparent",
                }}
              >
                {shop.emoji} {shop.name}
              </TabsTrigger>
            ))}
            <TabsTrigger
              value="summary"
              className="data-[state=active]:bg-purple-500 data-[state=active]:text-white text-sm font-medium whitespace-nowrap px-3 py-2"
            >
              🏆 최종정리
            </TabsTrigger>
          </TabsList>

          {/* 업체 관리 탭 */}
          <TabsContent value="manage" className="w-full">
            <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
              <ShopManager shops={shops} onAddShop={addShop} onUpdateShop={updateShop} onDeleteShop={deleteShop} />
            </div>
          </TabsContent>

          {/* 각 업체 탭 */}
          {shops.map((shop) => (
            <TabsContent key={shop.id} value={shop.id} className="w-full">
              <div
                className="bg-white p-4 rounded-lg shadow-sm border-l-4 mb-4"
                style={{ borderLeftColor: shop.color }}
              >
                <h2
                  className="text-base font-bold text-center text-white p-3 rounded-lg mb-3 whitespace-nowrap"
                  style={{ backgroundColor: shop.color }}
                >
                  {shop.emoji} {shop.name}
                </h2>
                <Textarea
                  className="mb-3 text-sm resize-none w-full"
                  value={shop.description}
                  onChange={(e) => updateShop(shop.id, { description: e.target.value })}
                  rows={2}
                />
                <Button
                  onClick={() => addDress(shop.id)}
                  className="w-full mb-4 bg-green-500 hover:bg-green-600 text-sm py-2 whitespace-nowrap"
                >
                  + 드레스 추가
                </Button>
              </div>
              <div className="space-y-3 w-full">
                {shop.dresses.map((dress) => (
                  <DressCard
                    key={dress.id}
                    dress={dress}
                    shop={shop}
                    onUpdate={(updatedDress) => updateDress(shop.id, updatedDress)}
                    onDelete={(dressId) => deleteDress(shop.id, dressId)}
                  />
                ))}
              </div>
            </TabsContent>
          ))}

          {/* 최종 정리 탭 */}
          <TabsContent value="summary" className="w-full">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-lg shadow-lg mb-4">
              <h2 className="text-base font-bold text-center mb-3 whitespace-nowrap">🏆 최종 비교 정리</h2>
            </div>

            {/* 업체별 최고 드레스 */}
            <div className="space-y-3 mb-4">
              {shops.map((shop) => {
                const bestDress = getBestDress(shop.dresses)
                return (
                  <div
                    key={shop.id}
                    className="bg-white p-4 rounded-lg shadow-sm border-l-4"
                    style={{ borderLeftColor: shop.color }}
                  >
                    <h3 className="font-bold mb-2 text-sm whitespace-nowrap" style={{ color: shop.color }}>
                      🥇 {shop.name} 최고 드레스
                    </h3>
                    {bestDress ? (
                      <div className="space-y-1">
                        <div className="font-semibold text-sm whitespace-nowrap">
                          {bestDress.name} - {Object.values(bestDress.scores).reduce((sum, score) => sum + score, 0)}점
                        </div>
                        <div className="text-xs text-gray-600 whitespace-nowrap">
                          {bestDress.details.skirt && `${bestDress.details.skirt} / `}
                          {bestDress.details.neckline && `${bestDress.details.neckline} / `}
                          {bestDress.details.sleeve && `${bestDress.details.sleeve}`}
                        </div>
                        <div className="text-xs text-gray-500 whitespace-nowrap">
                          {bestDress.priceRange && `${bestDress.priceRange}`}
                          {bestDress.memo && ` | ${bestDress.memo}`}
                        </div>
                        {bestDress.details.extraCost === "있음" && bestDress.details.extraCostAmount && (
                          <div className="text-xs text-red-600 whitespace-nowrap">
                            추가금: {bestDress.details.extraCostAmount}
                          </div>
                        )}
                        {bestDress.details.extraCost === "없음" && (
                          <div className="text-xs text-green-600 whitespace-nowrap">추가금 없음</div>
                        )}
                        {bestDress.sketchData && (
                          <div className="mt-2">
                            <img
                              src={bestDress.sketchData || "/placeholder.svg"}
                              alt="스케치"
                              className="w-16 h-16 object-contain border rounded"
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 whitespace-nowrap">평가 완료된 드레스 없음</div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* 전체 TOP 3 드레스 */}
            <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
              <h3 className="font-bold mb-3 text-sm text-purple-600 whitespace-nowrap">🏆 전체 TOP 3 드레스</h3>
              <div className="space-y-2">
                {(() => {
                  const allDresses = shops
                    .flatMap((shop) =>
                      shop.dresses
                        .filter((dress) => Object.keys(dress.scores).length > 0)
                        .map((dress) => ({
                          ...dress,
                          totalScore: Object.values(dress.scores).reduce((sum, score) => sum + score, 0),
                          shopName: shop.name,
                          shopEmoji: shop.emoji,
                        })),
                    )
                    .sort((a, b) => b.totalScore - a.totalScore)
                    .slice(0, 3)

                  return allDresses.length > 0 ? (
                    allDresses.map((dress, index) => (
                      <div
                        key={dress.id}
                        className={`p-2 rounded border-l-2 ${
                          index === 0
                            ? "border-yellow-400 bg-yellow-50"
                            : index === 1
                              ? "border-gray-400 bg-gray-50"
                              : "border-orange-400 bg-orange-50"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <div className="font-semibold text-sm whitespace-nowrap">
                              {index + 1}위. {dress.name} ({dress.shopEmoji} {dress.shopName})
                            </div>
                            <div className="text-xs text-gray-600 whitespace-nowrap">
                              {dress.details.skirt && `${dress.details.skirt} / `}
                              {dress.details.neckline && `${dress.details.neckline} / `}
                              {dress.details.sleeve && `${dress.details.sleeve}`}
                            </div>
                            {dress.details.extraCost === "있음" && dress.details.extraCostAmount && (
                              <div className="text-xs text-red-600 whitespace-nowrap">
                                추가금: {dress.details.extraCostAmount}
                              </div>
                            )}
                            {dress.details.extraCost === "없음" && (
                              <div className="text-xs text-green-600 whitespace-nowrap">추가금 없음</div>
                            )}
                          </div>
                          <div className="font-bold text-sm whitespace-nowrap">{dress.totalScore}점</div>
                        </div>
                        {dress.sketchData && (
                          <div className="mt-1">
                            <img
                              src={dress.sketchData || "/placeholder.svg"}
                              alt="스케치"
                              className="w-12 h-12 object-contain border rounded"
                            />
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500 text-center whitespace-nowrap">
                      평가 완료된 드레스가 없습니다
                    </div>
                  )
                })()}
              </div>
            </div>

            {/* 업체별 평균 점수 비교 */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-bold mb-3 text-sm text-green-600 whitespace-nowrap">📊 업체별 평균 점수</h3>
              {(() => {
                const shopStats = shops
                  .map((shop) => {
                    const scores = shop.dresses
                      .filter((dress) => Object.keys(dress.scores).length > 0)
                      .map((dress) => Object.values(dress.scores).reduce((sum, score) => sum + score, 0))

                    const avg =
                      scores.length > 0
                        ? (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1)
                        : "0.0"

                    return {
                      ...shop,
                      avg: Number.parseFloat(avg),
                      count: scores.length,
                    }
                  })
                  .sort((a, b) => b.avg - a.avg)

                const winner = shopStats.length > 0 && shopStats[0].avg > 0 ? shopStats[0] : null

                return (
                  <div className="space-y-3">
                    {shopStats.map((shop, index) => (
                      <div
                        key={shop.id}
                        className="flex justify-between items-center p-2 rounded"
                        style={{ backgroundColor: `${shop.color}20` }}
                      >
                        <span className="font-medium text-sm whitespace-nowrap">
                          {shop.emoji} {shop.name} {index === 0 && shop.avg > 0 ? "🏆" : ""}
                        </span>
                        <span className="font-bold text-sm whitespace-nowrap">
                          {shop.avg}점 ({shop.count}개)
                        </span>
                      </div>
                    ))}
                    {winner && (
                      <div className="text-center p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
                        <div className="font-bold text-sm whitespace-nowrap">
                          🏆 평균 점수 우승: {winner.emoji} {winner.name}
                        </div>
                        <div className="text-xs text-gray-600 mt-1 whitespace-nowrap">평균 {winner.avg}점으로 1위!</div>
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
