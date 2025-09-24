export interface Trade {
  id: string
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
  images: string[] // URLs to stored images
  pnl?: number
  createdAt: string
  updatedAt: string
}

export interface TradeStats {
  totalTrades: number
  winningTrades: number
  losingTrades: number
  winRate: number
  totalPnL: number
  averageWin: number
  averageLoss: number
  profitFactor: number
  largestWin: number
  largestLoss: number
}