"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, ImageIcon, TrendingUpIcon, TrendingDownIcon } from "lucide-react"

interface TradeData {
  currencyPair: string
  direction: "long" | "short"
  entryPrice: number
  exitPrice?: number
  positionSize: number
  stopLoss?: number
  takeProfit?: number
  entryDate: string
  exitDate?: string
  status: "open" | "closed"
  notes: string
  images: File[]
}

interface TradeEntryFormProps {
  onSubmit: (trade: TradeData) => void
  initialData?: Partial<TradeData>
}

const POPULAR_PAIRS = [
  "EUR/USD", "GBP/USD", "USD/JPY", "USD/CHF", "USD/CAD",
  "AUD/USD", "NZD/USD", "EUR/GBP", "EUR/JPY", "GBP/JPY"
]

export default function TradeEntryForm({ onSubmit, initialData }: TradeEntryFormProps) {
  const [formData, setFormData] = useState<Partial<TradeData>>({
    currencyPair: "",
    direction: "long",
    entryPrice: 0,
    positionSize: 0,
    entryDate: new Date().toISOString().split('T')[0],
    status: "open",
    notes: "",
    images: [],
    ...initialData
  })

  const [selectedImages, setSelectedImages] = useState<File[]>([])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setSelectedImages(prev => [...prev, ...files])
    setFormData(prev => ({ ...prev, images: [...(prev.images || []), ...files] }))
  }

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
    setFormData(prev => ({ 
      ...prev, 
      images: prev.images?.filter((_, i) => i !== index) || []
    }))
  }

  const calculatePnL = () => {
    if (!formData.entryPrice || !formData.exitPrice || !formData.positionSize) return 0
    
    const direction = formData.direction === "long" ? 1 : -1
    const priceDiff = (formData.exitPrice - formData.entryPrice) * direction
    return priceDiff * formData.positionSize
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.currencyPair || !formData.entryPrice || !formData.positionSize) {
      alert("Please fill in all required fields")
      return
    }

    const tradeData: TradeData = {
      currencyPair: formData.currencyPair,
      direction: formData.direction || "long",
      entryPrice: formData.entryPrice,
      exitPrice: formData.exitPrice,
      positionSize: formData.positionSize,
      stopLoss: formData.stopLoss,
      takeProfit: formData.takeProfit,
      entryDate: formData.entryDate || new Date().toISOString().split('T')[0],
      exitDate: formData.exitDate,
      status: formData.status || "open",
      notes: formData.notes || "",
      images: selectedImages
    }

    onSubmit(tradeData)
    
    // Reset form
    setFormData({
      currencyPair: "",
      direction: "long",
      entryPrice: 0,
      positionSize: 0,
      entryDate: new Date().toISOString().split('T')[0],
      status: "open",
      notes: "",
      images: []
    })
    setSelectedImages([])
  }

  const pnl = calculatePnL()

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUpIcon className="h-5 w-5" />
          New Trade Entry
        </CardTitle>
        <CardDescription>
          Log your forex trade details and track your performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Currency Pair */}
          <div className="space-y-2">
            <Label htmlFor="currencyPair">Currency Pair *</Label>
            <Select 
              value={formData.currencyPair} 
              onValueChange={(value: string) => setFormData(prev => ({ ...prev, currencyPair: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select currency pair" />
              </SelectTrigger>
              <SelectContent>
                {POPULAR_PAIRS.map(pair => (
                  <SelectItem key={pair} value={pair}>{pair}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Direction & Position Size */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Direction *</Label>
              <Select 
                value={formData.direction} 
                onValueChange={(value: "long" | "short") => setFormData(prev => ({ ...prev, direction: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="long">
                    <div className="flex items-center gap-2">
                      <TrendingUpIcon className="h-4 w-4 text-green-500" />
                      Long (Buy)
                    </div>
                  </SelectItem>
                  <SelectItem value="short">
                    <div className="flex items-center gap-2">
                      <TrendingDownIcon className="h-4 w-4 text-red-500" />
                      Short (Sell)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="positionSize">Position Size *</Label>
              <Input
                id="positionSize"
                type="number"
                step="0.01"
                placeholder="1.00"
                value={formData.positionSize || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, positionSize: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>

          {/* Entry & Exit Prices */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entryPrice">Entry Price *</Label>
              <Input
                id="entryPrice"
                type="number"
                step="0.00001"
                placeholder="1.08500"
                value={formData.entryPrice || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, entryPrice: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exitPrice">Exit Price</Label>
              <Input
                id="exitPrice"
                type="number"
                step="0.00001"
                placeholder="1.09000"
                value={formData.exitPrice || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, exitPrice: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>

          {/* Stop Loss & Take Profit */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stopLoss">Stop Loss</Label>
              <Input
                id="stopLoss"
                type="number"
                step="0.00001"
                placeholder="1.08000"
                value={formData.stopLoss || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, stopLoss: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="takeProfit">Take Profit</Label>
              <Input
                id="takeProfit"
                type="number"
                step="0.00001"
                placeholder="1.10000"
                value={formData.takeProfit || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, takeProfit: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entryDate">Entry Date *</Label>
              <div className="relative">
                <Input
                  id="entryDate"
                  type="date"
                  value={formData.entryDate || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, entryDate: e.target.value }))}
                />
                <CalendarIcon className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="exitDate">Exit Date</Label>
              <div className="relative">
                <Input
                  id="exitDate"
                  type="date"
                  value={formData.exitDate || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, exitDate: e.target.value }))}
                />
                <CalendarIcon className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Trade Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value: "open" | "closed") => setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">
                  <Badge variant="outline" className="text-blue-600 border-blue-600">Open</Badge>
                </SelectItem>
                <SelectItem value="closed">
                  <Badge variant="outline" className="text-gray-600 border-gray-600">Closed</Badge>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* P&L Display */}
          {formData.exitPrice && (
            <div className="p-4 rounded-lg bg-muted">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Calculated P&L:</span>
                <span className={`text-lg font-bold ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)} pips
                </span>
              </div>
            </div>
          )}

          {/* Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="images">Chart Screenshots & Analysis Photos</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
              <div className="text-center">
                <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                <div className="mt-4">
                  <label htmlFor="images" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-primary hover:text-primary/80">
                      Click to upload images
                    </span>
                  </label>
                  <input
                    id="images"
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  PNG, JPG, GIF up to 10MB each
                </p>
              </div>
            </div>
            
            {/* Image Preview */}
            {selectedImages.length > 0 && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                {selectedImages.map((file, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-24 object-cover rounded border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0"
                      onClick={() => removeImage(index)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Trading Notes & Analysis</Label>
            <Textarea
              id="notes"
              placeholder="Enter your trade analysis, market conditions, emotions, lessons learned..."
              className="min-h-[100px]"
              value={formData.notes || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full">
            Save Trade
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}