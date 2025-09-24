"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { tradeStore } from "@/lib/tradeStore"
import { Trade } from "@/lib/types"
import { 
  TrendingUpIcon, 
  TrendingDownIcon, 
  FilterIcon, 
  SearchIcon, 
  EditIcon,
  TrashIcon,
  EyeIcon,
  ImageIcon
} from "lucide-react"

interface TradesDashboardProps {
  onEditTrade?: (trade: Trade) => void
}

export default function TradesDashboard({ onEditTrade }: TradesDashboardProps) {
  const [trades, setTrades] = useState<Trade[]>([])
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([])
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed">("all")
  const [pairFilter, setPairFilter] = useState<string>("all")
  const [dateFromFilter, setDateFromFilter] = useState("")
  const [dateToFilter, setDateToFilter] = useState("")

  // Sorting
  const [sortField, setSortField] = useState<keyof Trade>("createdAt")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  useEffect(() => {
    const updateTrades = () => {
      const allTrades = tradeStore.getTrades()
      setTrades(allTrades)
    }

    updateTrades()
    const unsubscribe = tradeStore.subscribe(updateTrades)
    
    return unsubscribe
  }, [])

  useEffect(() => {
    let filtered = [...trades]

    // Apply filters
    if (searchTerm) {
      filtered = filtered.filter(trade => 
        trade.currencyPair.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.notes.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(trade => trade.status === statusFilter)
    }

    if (pairFilter !== "all") {
      filtered = filtered.filter(trade => trade.currencyPair === pairFilter)
    }

    if (dateFromFilter) {
      filtered = filtered.filter(trade => trade.entryDate >= dateFromFilter)
    }

    if (dateToFilter) {
      filtered = filtered.filter(trade => trade.entryDate <= dateToFilter)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]
      
      if (aValue === undefined || aValue === null) return 1
      if (bValue === undefined || bValue === null) return -1
      
      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      return sortDirection === "asc" ? comparison : -comparison
    })

    setFilteredTrades(filtered)
  }, [trades, searchTerm, statusFilter, pairFilter, dateFromFilter, dateToFilter, sortField, sortDirection])

  const handleSort = (field: keyof Trade) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const handleDeleteTrade = (id: string) => {
    if (confirm("Are you sure you want to delete this trade?")) {
      tradeStore.deleteTrade(id)
    }
  }

  const formatPnL = (pnl?: number) => {
    if (pnl === undefined) return "—"
    const formatted = pnl >= 0 ? `+${pnl.toFixed(1)}` : pnl.toFixed(1)
    return `${formatted} pips`
  }

  const getPnLColor = (pnl?: number) => {
    if (pnl === undefined) return "text-muted-foreground"
    return pnl >= 0 ? "text-green-600" : "text-red-600"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const currencyPairs = ["all", ...tradeStore.getCurrencyPairs()]

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FilterIcon className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Currency pair, notes..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={(value: "all" | "open" | "closed") => setStatusFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Trades</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Currency Pair Filter */}
            <div className="space-y-2">
              <Label>Currency Pair</Label>
              <Select value={pairFilter} onValueChange={setPairFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencyPairs.map(pair => (
                    <SelectItem key={pair} value={pair}>
                      {pair === "all" ? "All Pairs" : pair}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div className="space-y-2">
              <Label>Date From</Label>
              <Input
                type="date"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
              />
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <Label>Date To</Label>
              <Input
                type="date"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trades Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Trades ({filteredTrades.length})</CardTitle>
          <CardDescription>
            Click on column headers to sort. Use filters above to narrow down results.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTrades.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <TrendingUpIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No trades found matching your criteria.</p>
              <p className="text-sm mt-2">Try adjusting your filters or add some trades to get started.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50" 
                      onClick={() => handleSort("entryDate")}
                    >
                      Date {sortField === "entryDate" && (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50" 
                      onClick={() => handleSort("currencyPair")}
                    >
                      Pair {sortField === "currencyPair" && (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50" 
                      onClick={() => handleSort("entryPrice")}
                    >
                      Entry {sortField === "entryPrice" && (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead>Exit</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50" 
                      onClick={() => handleSort("positionSize")}
                    >
                      Size {sortField === "positionSize" && (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50" 
                      onClick={() => handleSort("pnl")}
                    >
                      P&L {sortField === "pnl" && (sortDirection === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTrades.map((trade) => (
                    <TableRow key={trade.id}>
                      <TableCell className="font-medium">
                        {formatDate(trade.entryDate)}
                      </TableCell>
                      <TableCell>{trade.currencyPair}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {trade.direction === "long" ? (
                            <TrendingUpIcon className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDownIcon className="h-4 w-4 text-red-600" />
                          )}
                          <span className="capitalize">{trade.direction}</span>
                        </div>
                      </TableCell>
                      <TableCell>{trade.entryPrice.toFixed(5)}</TableCell>
                      <TableCell>
                        {trade.exitPrice ? trade.exitPrice.toFixed(5) : "—"}
                      </TableCell>
                      <TableCell>{trade.positionSize}</TableCell>
                      <TableCell className={getPnLColor(trade.pnl)}>
                        {formatPnL(trade.pnl)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={trade.status === "open" ? "default" : "secondary"}
                          className={trade.status === "open" ? "bg-blue-100 text-blue-800 border-blue-200" : ""}
                        >
                          {trade.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setSelectedTrade(trade)}
                              >
                                <EyeIcon className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Trade Details</DialogTitle>
                                <DialogDescription>
                                  {trade.currencyPair} • {formatDate(trade.entryDate)}
                                </DialogDescription>
                              </DialogHeader>
                              {selectedTrade && <TradeDetails trade={selectedTrade} />}
                            </DialogContent>
                          </Dialog>
                          
                          {onEditTrade && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => onEditTrade(trade)}
                            >
                              <EditIcon className="h-4 w-4" />
                            </Button>
                          )}
                          
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteTrade(trade.id)}
                          >
                            <TrashIcon className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function TradeDetails({ trade }: { trade: Trade }) {
  return (
    <Tabs defaultValue="details" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="notes">Notes</TabsTrigger>
        <TabsTrigger value="images">Images</TabsTrigger>
      </TabsList>
      
      <TabsContent value="details" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Currency Pair</Label>
            <p className="text-lg font-semibold">{trade.currencyPair}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Direction</Label>
            <div className="flex items-center gap-2">
              {trade.direction === "long" ? (
                <TrendingUpIcon className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDownIcon className="h-4 w-4 text-red-600" />
              )}
              <span className="capitalize font-semibold">{trade.direction}</span>
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Entry Price</Label>
            <p className="text-lg font-mono">{trade.entryPrice.toFixed(5)}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Exit Price</Label>
            <p className="text-lg font-mono">
              {trade.exitPrice ? trade.exitPrice.toFixed(5) : "—"}
            </p>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Position Size</Label>
            <p className="text-lg font-semibold">{trade.positionSize}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">P&L</Label>
            <p className={`text-lg font-bold ${trade.pnl !== undefined && trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trade.pnl !== undefined ? `${trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(1)} pips` : "—"}
            </p>
          </div>
          {trade.stopLoss && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Stop Loss</Label>
              <p className="text-lg font-mono">{trade.stopLoss.toFixed(5)}</p>
            </div>
          )}
          {trade.takeProfit && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Take Profit</Label>
              <p className="text-lg font-mono">{trade.takeProfit.toFixed(5)}</p>
            </div>
          )}
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Entry Date</Label>
            <p className="text-lg">{new Date(trade.entryDate).toLocaleDateString()}</p>
          </div>
          {trade.exitDate && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Exit Date</Label>
              <p className="text-lg">{new Date(trade.exitDate).toLocaleDateString()}</p>
            </div>
          )}
        </div>
      </TabsContent>
      
      <TabsContent value="notes" className="space-y-4">
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Trading Notes</Label>
          <div className="mt-2 p-4 bg-muted rounded-lg">
            {trade.notes ? (
              <p className="whitespace-pre-wrap">{trade.notes}</p>
            ) : (
              <p className="text-muted-foreground italic">No notes added for this trade.</p>
            )}
          </div>
        </div>
      </TabsContent>
      
      <TabsContent value="images" className="space-y-4">
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Chart Screenshots & Analysis</Label>
          {trade.images && trade.images.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 mt-4">
              {trade.images.map((imageUrl, index) => (
                <img
                  key={index}
                  src={imageUrl}
                  alt={`Trade analysis ${index + 1}`}
                  className="w-full h-32 object-cover rounded border cursor-pointer hover:opacity-80"
                  onClick={() => window.open(imageUrl, '_blank')}
                />
              ))}
            </div>
          ) : (
            <div className="mt-4 p-8 text-center bg-muted rounded-lg">
              <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No images uploaded for this trade.</p>
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  )
}