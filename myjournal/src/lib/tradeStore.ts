"use client"

import { Trade, TradeStats } from "./types"

class TradeStore {
  private trades: Trade[] = []
  private listeners: Set<() => void> = new Set()

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadTrades()
    }
  }

  private loadTrades() {
    const stored = localStorage.getItem('forex-trades')
    if (stored) {
      this.trades = JSON.parse(stored)
    }
  }

  private saveTrades() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('forex-trades', JSON.stringify(this.trades))
    }
  }

  private notify() {
    this.listeners.forEach(listener => listener())
  }

  addTrade(tradeData: Omit<Trade, 'id' | 'createdAt' | 'updatedAt' | 'pnl'>) {
    const now = new Date().toISOString()
    const pnl = this.calculatePnL(tradeData)
    
    const trade: Trade = {
      ...tradeData,
      id: Date.now().toString(),
      pnl,
      createdAt: now,
      updatedAt: now
    }

    this.trades.push(trade)
    this.saveTrades()
    this.notify()
    return trade
  }

  updateTrade(id: string, updates: Partial<Trade>) {
    const index = this.trades.findIndex(trade => trade.id === id)
    if (index !== -1) {
      const updatedTrade = { 
        ...this.trades[index], 
        ...updates, 
        updatedAt: new Date().toISOString()
      }
      
      if (updates.entryPrice || updates.exitPrice || updates.positionSize || updates.direction) {
        updatedTrade.pnl = this.calculatePnL(updatedTrade)
      }
      
      this.trades[index] = updatedTrade
      this.saveTrades()
      this.notify()
      return updatedTrade
    }
    return null
  }

  deleteTrade(id: string) {
    const index = this.trades.findIndex(trade => trade.id === id)
    if (index !== -1) {
      this.trades.splice(index, 1)
      this.saveTrades()
      this.notify()
      return true
    }
    return false
  }

  getTrades(filters?: {
    status?: "open" | "closed"
    currencyPair?: string
    dateFrom?: string
    dateTo?: string
  }) {
    let filteredTrades = [...this.trades]

    if (filters) {
      if (filters.status) {
        filteredTrades = filteredTrades.filter(trade => trade.status === filters.status)
      }
      if (filters.currencyPair) {
        filteredTrades = filteredTrades.filter(trade => trade.currencyPair === filters.currencyPair)
      }
      if (filters.dateFrom) {
        filteredTrades = filteredTrades.filter(trade => trade.entryDate >= filters.dateFrom!)
      }
      if (filters.dateTo) {
        filteredTrades = filteredTrades.filter(trade => trade.entryDate <= filters.dateTo!)
      }
    }

    return filteredTrades.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  getTrade(id: string) {
    return this.trades.find(trade => trade.id === id) || null
  }

  getStats(): TradeStats {
    const closedTrades = this.trades.filter(trade => trade.status === 'closed' && trade.pnl !== undefined)
    const wins = closedTrades.filter(trade => (trade.pnl || 0) > 0)
    const losses = closedTrades.filter(trade => (trade.pnl || 0) < 0)
    
    const totalPnL = closedTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0)
    const totalWins = wins.reduce((sum, trade) => sum + (trade.pnl || 0), 0)
    const totalLosses = Math.abs(losses.reduce((sum, trade) => sum + (trade.pnl || 0), 0))

    return {
      totalTrades: closedTrades.length,
      winningTrades: wins.length,
      losingTrades: losses.length,
      winRate: closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0,
      totalPnL,
      averageWin: wins.length > 0 ? totalWins / wins.length : 0,
      averageLoss: losses.length > 0 ? totalLosses / losses.length : 0,
      profitFactor: totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0,
      largestWin: wins.length > 0 ? Math.max(...wins.map(t => t.pnl || 0)) : 0,
      largestLoss: losses.length > 0 ? Math.min(...losses.map(t => t.pnl || 0)) : 0,
    }
  }

  private calculatePnL(trade: Pick<Trade, 'entryPrice' | 'exitPrice' | 'positionSize' | 'direction'>): number | undefined {
    if (!trade.exitPrice || !trade.entryPrice || !trade.positionSize) return undefined
    
    const direction = trade.direction === "long" ? 1 : -1
    const priceDiff = (trade.exitPrice - trade.entryPrice) * direction
    return priceDiff * trade.positionSize * 100000 // Convert to pips (assuming 5-digit pricing)
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  // Get currency pairs from existing trades
  getCurrencyPairs() {
    const pairs = [...new Set(this.trades.map(trade => trade.currencyPair))]
    return pairs.sort()
  }
}

export const tradeStore = new TradeStore()