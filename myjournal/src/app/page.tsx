"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import TradeEntryForm from "@/components/TradeEntryForm"
import TradesDashboard from "@/components/TradesDashboard"
import TradeAnalytics from "@/components/TradeAnalytics"
import { tradeStore } from "@/lib/tradeStore"
import { Trade, TradeStats } from "@/lib/types"
import { 
  PlusIcon, 
  TrendingUpIcon, 
  TrendingDownIcon,
  BookOpenIcon,
  BarChart3Icon,
  TableIcon,
  TargetIcon,
  DollarSignIcon,
  TrendingUpIcon as GrowthIcon,
  ActivityIcon
} from "lucide-react"
import Link from "next/link"
import { logoutUser, auth as authClient } from "@/lib/auth"
import { toast } from "sonner"

export default function ForexTradingJournal() {
  const [isAddTradeOpen, setIsAddTradeOpen] = useState(false)
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null)
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
  const [recentTrades, setRecentTrades] = useState<Trade[]>([])
  const [isAuthed, setIsAuthed] = useState(false)

  useEffect(() => {
    const updateData = () => {
      const tradeStats = tradeStore.getStats()
      const trades = tradeStore.getTrades().slice(0, 5)
      setStats(tradeStats)
      setRecentTrades(trades)
    }

    updateData()
    const unsubscribe = tradeStore.subscribe(updateData)
    
    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe()
      }
    }
  }, [])

  useEffect(() => {
    // initialize auth from localStorage
    setIsAuthed(Boolean(authClient.getAccessToken()))
    const onStorage = (e: StorageEvent) => {
      if (e.key === "bearer_token") {
        setIsAuthed(Boolean(e.newValue))
      }
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  const handleAddTrade = (tradeData: any) => {
    const imageUrls = tradeData.images.map((file: File) => {
      // In a real app, you'd upload to a server/cloud storage
      // For now, we'll create local object URLs
      return URL.createObjectURL(file)
    })

    tradeStore.addTrade({
      ...tradeData,
      images: imageUrls
    })
    
    setIsAddTradeOpen(false)
    setEditingTrade(null)
  }

  const handleLogout = async () => {
    await logoutUser()
    setIsAuthed(false)
    toast.success("Signed out")
  }

  const handleEditTrade = (trade: Trade) => {
    setEditingTrade(trade)
    setIsAddTradeOpen(true)
  }

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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-green-500/5 pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />
      
      {/* Header */}
      <div className="border-b border-border/50 backdrop-blur-sm bg-card/30 relative z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <DollarSignIcon className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
                  Forex Trading Journal
                </h1>
                <p className="text-muted-foreground text-sm">Track, analyze, and improve your trading performance</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {!isAuthed ? (
                <>
                  <Link href="/login" className="hidden sm:block">
                    <Button variant="outline" className="finance-hover">Login</Button>
                  </Link>
                  <Link href="/register" className="hidden sm:block">
                    <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 finance-hover">
                      Register
                    </Button>
                  </Link>
                </>
              ) : (
                <Button variant="outline" onClick={handleLogout} className="finance-hover">
                  Logout
                </Button>
              )}

              <Dialog open={isAddTradeOpen} onOpenChange={setIsAddTradeOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 finance-hover shadow-lg">
                    <PlusIcon className="h-4 w-4" />
                    Add Trade
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingTrade ? "Edit Trade" : "Add New Trade"}</DialogTitle>
                    <DialogDescription>
                      {editingTrade ? "Update your trade details" : "Log your trade details and upload analysis screenshots"}
                    </DialogDescription>
                  </DialogHeader>
                  <TradeEntryForm 
                    onSubmit={handleAddTrade} 
                    initialData={
                      editingTrade
                        ? {
                            ...editingTrade,
                            images: [] // or convert URLs to File objects if possible
                          }
                        : undefined
                    }
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 relative z-10">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 glass-card p-1">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3Icon className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="trades" className="flex items-center gap-2">
              <TableIcon className="h-4 w-4" />
              All Trades
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TargetIcon className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="glass-card finance-hover border-0">
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

              <Card className="glass-card finance-hover border-0">
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

              <Card className="glass-card finance-hover border-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Open Trades</CardTitle>
                  <div className="p-2 bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-lg">
                    <ActivityIcon className="h-4 w-4 text-amber-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {tradeStore.getTrades({ status: "open" }).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Active positions
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card finance-hover border-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Profit Factor</CardTitle>
                  <div className="p-2 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-lg">
                    <GrowthIcon className="h-4 w-4 text-purple-400" />
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
            </div>

            {/* Recent Trades */}
            <Card className="glass-card border-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Trades</CardTitle>
                    <CardDescription>Your latest trading activity</CardDescription>
                  </div>
                  <Button 
                    variant="outline"
                    className="finance-hover"
                    size="sm"
                    onClick={() => setIsAddTradeOpen(true)}
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Trade
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {recentTrades.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="p-4 bg-gradient-to-br from-blue-500/10 to-green-500/10 rounded-full w-fit mx-auto mb-4">
                      <BookOpenIcon className="h-12 w-12 text-blue-400 opacity-70" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Welcome to Your Trading Journal</h3>
                    <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                      Start tracking your forex trades to analyze your performance and improve your trading strategy.
                    </p>
                    <Button 
                      onClick={() => setIsAddTradeOpen(true)}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 finance-hover"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add Your First Trade
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentTrades.map((trade) => (
                      <div key={trade.id} className="flex items-center justify-between p-4 glass-card rounded-lg finance-hover border-0">
                        <div className="flex items-center gap-4">
                          <Badge variant="outline" className="font-mono bg-blue-500/10 border-blue-500/30 text-blue-300">
                            {trade.currencyPair}
                          </Badge>
                          <div className="flex items-center gap-2">
                            {trade.direction === "long" ? (
                              <TrendingUpIcon className="h-4 w-4 text-green-400" />
                            ) : (
                              <TrendingDownIcon className="h-4 w-4 text-red-400" />
                            )}
                            <span className="capitalize text-sm font-medium">
                              {trade.direction}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(trade.entryDate).toLocaleDateString()}
                          </div>
                          <Badge 
                            variant={trade.status === "open" ? "default" : "secondary"}
                            className={trade.status === "open" ? "bg-green-500/20 text-green-300 border-green-500/30" : "bg-gray-500/20 text-gray-300 border-gray-500/30"}
                          >
                            {trade.status}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm font-mono">
                              Entry: {trade.entryPrice.toFixed(5)}
                            </div>
                            {trade.exitPrice && (
                              <div className="text-sm font-mono">
                                Exit: {trade.exitPrice.toFixed(5)}
                              </div>
                            )}
                          </div>
                          
                          {trade.pnl !== undefined && (
                            <div className={`font-bold text-right ${getPnLColor(trade.pnl)}`}>
                              {formatPnL(trade.pnl)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {recentTrades.length === 5 && (
                      <div className="text-center pt-4">
                        <Button variant="outline" size="sm" className="finance-hover">
                          View All Trades
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="glass-card border-0 cursor-pointer finance-hover" onClick={() => setIsAddTradeOpen(true)}>
                <CardHeader className="text-center">
                  <div className="mx-auto w-12 h-12 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-full flex items-center justify-center mb-2">
                    <PlusIcon className="h-6 w-6 text-green-400" />
                  </div>
                  <CardTitle className="text-lg">Add New Trade</CardTitle>
                  <CardDescription>Log your latest forex trade with detailed analysis</CardDescription>
                </CardHeader>
              </Card>

              <Card className="glass-card border-0 cursor-pointer finance-hover">
                <CardHeader className="text-center">
                  <div className="mx-auto w-12 h-12 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-full flex items-center justify-center mb-2">
                    <BarChart3Icon className="h-6 w-6 text-blue-400" />
                  </div>
                  <CardTitle className="text-lg">View Analytics</CardTitle>
                  <CardDescription>Analyze your performance with detailed metrics</CardDescription>
                </CardHeader>
              </Card>

              <Card className="glass-card border-0 cursor-pointer finance-hover">
                <CardHeader className="text-center">
                  <div className="mx-auto w-12 h-12 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-full flex items-center justify-center mb-2">
                    <TableIcon className="h-6 w-6 text-purple-400" />
                  </div>
                  <CardTitle className="text-lg">Browse Trades</CardTitle>
                  <CardDescription>Search and filter through all your trades</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trades">
            <TradesDashboard onEditTrade={handleEditTrade} />
          </TabsContent>

          <TabsContent value="analytics">
            <TradeAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}