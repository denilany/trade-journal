"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { tradeStore } from "@/lib/tradeStore"
import { Trade, TradeStats } from "@/lib/types"
import { 
  TrendingUpIcon, 
  TrendingDownIcon, 
  TargetIcon,
  BarChart3Icon,
  PieChartIcon,
  CalendarIcon
} from "lucide-react"

export default function TradeAnalytics() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [stats, setStats] = useState<TradeStats>({
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    winRate: 0,
    totalPnL: 0,
    averageWin: 0,
    averageLoss: 0,
    profitFactor: 0,
    largestWin: 0,
    largestLoss: 0,
  })

  useEffect(() => {
    const updateData = () => {
      const allTrades = tradeStore.getTrades()
      const tradeStats = tradeStore.getStats()
      setTrades(allTrades)
      setStats(tradeStats)
    }

    updateData()
    const unsubscribe = tradeStore.subscribe(updateData)
    
    return unsubscribe
  }, [])

  // Prepare chart data
  const monthlyPnL = useMemo(() => {
    const closedTrades = trades.filter(t => t.status === 'closed' && t.pnl !== undefined)
    const monthlyData = new Map<string, number>()
    
    closedTrades.forEach(trade => {
      const date = new Date(trade.exitDate || trade.entryDate)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const currentPnL = monthlyData.get(monthKey) || 0
      monthlyData.set(monthKey, currentPnL + (trade.pnl || 0))
    })

    return Array.from(monthlyData.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, pnl]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        pnl
      }))
  }, [trades])

  const pairPerformance = useMemo(() => {
    const closedTrades = trades.filter(t => t.status === 'closed' && t.pnl !== undefined)
    const pairData = new Map<string, { totalPnL: number; trades: number; wins: number }>()
    
    closedTrades.forEach(trade => {
      const pair = trade.currencyPair
      const current = pairData.get(pair) || { totalPnL: 0, trades: 0, wins: 0 }
      
      current.totalPnL += trade.pnl || 0
      current.trades += 1
      if ((trade.pnl || 0) > 0) current.wins += 1
      
      pairData.set(pair, current)
    })

    return Array.from(pairData.entries())
      .map(([pair, data]) => ({
        pair,
        totalPnL: data.totalPnL,
        trades: data.trades,
        winRate: data.trades > 0 ? (data.wins / data.trades) * 100 : 0
      }))
      .sort((a, b) => b.totalPnL - a.totalPnL)
  }, [trades])

  const recentTrades = useMemo(() => {
    return trades
      .filter(t => t.status === 'closed')
      .slice(0, 10)
  }, [trades])

  const formatPnL = (pnl: number) => {
    const formatted = pnl >= 0 ? `+${pnl.toFixed(1)}` : pnl.toFixed(1)
    return `${formatted} pips`
  }

  const getPnLColor = (pnl: number) => {
    return pnl >= 0 ? "profit-text" : "loss-text"
  }

  const getWinRateColor = (winRate: number) => {
    if (winRate >= 60) return "profit-text"
    if (winRate >= 40) return "warning-text"
    return "loss-text"
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
            <div className="p-2 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-lg">
              <BarChart3Icon className="h-4 w-4 text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPnLColor(stats.totalPnL)}`}>
              {formatPnL(stats.totalPnL)}
            </div>
            <p className="text-xs text-muted-foreground">
              From {stats.totalTrades} closed trades
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <div className="p-2 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-lg">
              <TargetIcon className="h-4 w-4 text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getWinRateColor(stats.winRate)}`}>
              {stats.winRate.toFixed(1)}%
            </div>
            <div className="flex text-xs text-muted-foreground">
              <span className="text-green-600">{stats.winningTrades}W</span>
              <span className="mx-1">•</span>
              <span className="text-red-600">{stats.losingTrades}L</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Factor</CardTitle>
            <div className="p-2 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-lg">
              <TrendingUpIcon className="h-4 w-4 text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.profitFactor === Infinity ? "∞" : stats.profitFactor.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Gross Profit ÷ Gross Loss
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Trade</CardTitle>
            <div className="p-2 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-lg">
              <TrendingUpIcon className="h-4 w-4 text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold profit-text">
              {formatPnL(stats.largestWin)}
            </div>
            <p className="text-xs text-muted-foreground">
              Largest winning trade
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="pairs">Currency Pairs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Win/Loss Breakdown */}
            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Trade Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUpIcon className="h-4 w-4 text-green-400" />
                      <span className="font-medium">Winning Trades</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold profit-text">{stats.winningTrades}</div>
                      <div className="text-sm text-muted-foreground">
                        Avg: {formatPnL(stats.averageWin)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingDownIcon className="h-4 w-4 text-red-400" />
                      <span className="font-medium">Losing Trades</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold loss-text">{stats.losingTrades}</div>
                      <div className="text-sm text-muted-foreground">
                        Avg: {formatPnL(-stats.averageLoss)}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Win Rate Progress</span>
                    <span>{stats.winRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={stats.winRate} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Risk Metrics */}
            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle>Risk Metrics</CardTitle>
                <CardDescription>Key risk and reward statistics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Largest Win</Label>
                    <p className="text-lg font-bold profit-text">
                      {formatPnL(stats.largestWin)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Largest Loss</Label>
                    <p className="text-lg font-bold loss-text">
                      {formatPnL(stats.largestLoss)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Avg Win</Label>
                    <p className="text-lg font-bold">
                      {formatPnL(stats.averageWin)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Avg Loss</Label>
                    <p className="text-lg font-bold">
                      {formatPnL(-stats.averageLoss)}
                    </p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Risk-Reward Ratio</Label>
                  <p className="text-lg font-bold">
                    {stats.averageLoss > 0 ? `1:${(stats.averageWin / stats.averageLoss).toFixed(2)}` : "N/A"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Trades */}
          <Card className="glass-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Recent Closed Trades
              </CardTitle>
              <CardDescription>Your last 10 completed trades</CardDescription>
            </CardHeader>
            <CardContent>
              {recentTrades.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="p-3 bg-gradient-to-br from-blue-500/10 to-green-500/10 rounded-full w-fit mx-auto mb-2">
                    <BarChart3Icon className="h-8 w-8 text-blue-400 opacity-70" />
                  </div>
                  <p>No closed trades yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentTrades.map((trade) => (
                    <div key={trade.id} className="flex items-center justify-between p-3 glass-card rounded-lg border-0">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-blue-500/10 border-blue-500/30 text-blue-300">
                          {trade.currencyPair}
                        </Badge>
                        <div className="flex items-center gap-1">
                          {trade.direction === "long" ? (
                            <TrendingUpIcon className="h-3 w-3 text-green-400" />
                          ) : (
                            <TrendingDownIcon className="h-3 w-3 text-red-400" />
                          )}
                          <span className="text-sm capitalize">{trade.direction}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(trade.entryDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className={`font-bold ${getPnLColor(trade.pnl || 0)}`}>
                        {formatPnL(trade.pnl || 0)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Monthly P&L Chart */}
          <Card className="glass-card border-0">
            <CardHeader>
              <CardTitle>Monthly Performance</CardTitle>
              <CardDescription>Profit & Loss by month</CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyPnL.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="p-3 bg-gradient-to-br from-blue-500/10 to-green-500/10 rounded-full w-fit mx-auto mb-2">
                    <BarChart3Icon className="h-8 w-8 text-blue-400 opacity-70" />
                  </div>
                  <p>No completed trades to display</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {monthlyPnL.map(({ month, pnl }) => (
                    <div key={month} className="flex items-center justify-between">
                      <span className="font-medium">{month}</span>
                      <div className="flex items-center gap-4">
                        <div className="w-32 bg-muted rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${pnl >= 0 ? 'bg-green-400' : 'bg-red-400'}`}
                            style={{ 
                              width: `${Math.min(Math.abs(pnl) / Math.max(...monthlyPnL.map(d => Math.abs(d.pnl))) * 100, 100)}%` 
                            }}
                          />
                        </div>
                        <span className={`font-bold text-right w-20 ${getPnLColor(pnl)}`}>
                          {formatPnL(pnl)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pairs" className="space-y-6">
          {/* Currency Pair Performance */}
          <Card className="glass-card border-0">
            <CardHeader>
              <CardTitle>Currency Pair Performance</CardTitle>
              <CardDescription>Performance breakdown by trading pair</CardDescription>
            </CardHeader>
            <CardContent>
              {pairPerformance.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="p-3 bg-gradient-to-br from-blue-500/10 to-green-500/10 rounded-full w-fit mx-auto mb-2">
                    <PieChartIcon className="h-8 w-8 text-blue-400 opacity-70" />
                  </div>
                  <p>No completed trades to analyze</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pairPerformance.map((pair) => (
                    <div key={pair.pair} className="p-4 glass-card rounded-lg border-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-bold bg-blue-500/10 border-blue-500/30 text-blue-300">
                            {pair.pair}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {pair.trades} trades
                          </span>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold ${getPnLColor(pair.totalPnL)}`}>
                            {formatPnL(pair.totalPnL)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Win Rate:</span>
                          <span className={`font-semibold ${getWinRateColor(pair.winRate)}`}>
                            {pair.winRate.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={pair.winRate} className="w-24 h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Label({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <label className={`text-sm font-medium ${className}`}>{children}</label>
}