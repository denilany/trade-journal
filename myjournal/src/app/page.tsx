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
  TargetIcon
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
    
    return unsubscribe
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
    return pnl >= 0 ? "text-green-600" : "text-red-600"
  }

  const getWinRateColor = (winRate: number) => {
    if (winRate >= 60) return "text-green-600"
    if (winRate >= 40) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <BookOpenIcon className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Forex Trading Journal</h1>
                <p className="text-muted-foreground">Track, analyze, and improve your trading performance</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {!isAuthed ? (
                <>
                  <Link href="/login" className="hidden sm:block">
                    <Button variant="outline">Login</Button>
                  </Link>
                  <Link href="/register" className="hidden sm:block">
                    <Button>Register</Button>
                  </Link>
                </>
              ) : (
                <Button variant="outline" onClick={handleLogout}>Logout</Button>
              )}

              <Dialog open={isAddTradeOpen} onOpenChange={setIsAddTradeOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
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
                    initialData={editingTrade || undefined}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
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
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
                  <BarChart3Icon className="h-4 w-4 text-muted-foreground" />
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

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                  <TargetIcon className="h-4 w-4 text-muted-foreground" />
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

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Open Trades</CardTitle>
                  <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
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

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Profit Factor</CardTitle>
                  <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
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
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Trades</CardTitle>
                    <CardDescription>Your latest trading activity</CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
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
                    <BookOpenIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">Welcome to Your Trading Journal</h3>
                    <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                      Start tracking your forex trades to analyze your performance and improve your trading strategy.
                    </p>
                    <Button onClick={() => setIsAddTradeOpen(true)}>
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add Your First Trade
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentTrades.map((trade) => (
                      <div key={trade.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <Badge variant="outline" className="font-mono">
                            {trade.currencyPair}
                          </Badge>
                          <div className="flex items-center gap-2">
                            {trade.direction === "long" ? (
                              <TrendingUpIcon className="h-4 w-4 text-green-600" />
                            ) : (
                              <TrendingDownIcon className="h-4 w-4 text-red-600" />
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
                            className={trade.status === "open" ? "bg-blue-100 text-blue-800 border-blue-200" : ""}
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
                        <Button variant="outline" size="sm">
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
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setIsAddTradeOpen(true)}>
                <CardHeader className="text-center">
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                    <PlusIcon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Add New Trade</CardTitle>
                  <CardDescription>Log your latest forex trade with detailed analysis</CardDescription>
                </CardHeader>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="text-center">
                  <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                    <BarChart3Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">View Analytics</CardTitle>
                  <CardDescription>Analyze your performance with detailed metrics</CardDescription>
                </CardHeader>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="text-center">
                  <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                    <TableIcon className="h-6 w-6 text-green-600" />
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