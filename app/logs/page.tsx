"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RefreshCw, Search, Eye, ExternalLink, ChevronDown, ChevronUp } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { format, parseISO } from "date-fns"
import { DateRange } from "react-day-picker"
import { saveAs } from "file-saver"
import Prism from "prismjs"
import "prismjs/themes/prism-tomorrow.css"
import { useEffect as useReactEffect, useRef as useReactRef } from "react"

// --- Types ---
interface LogItem {
  id: string
  type: string
  status: string
  message: string
  data: any
  created_at: string
  user_id?: string
  ip?: string
  device?: string
  region?: string
  twilio_sid?: string
}

const LOG_TYPES = [
  { value: "all", label: "Alle types" },
  { value: "call", label: "Call" },
  { value: "login", label: "Login" },
  { value: "db_mutation", label: "DB Mutatie" },
  { value: "twilio", label: "Twilio" },
  { value: "error", label: "Error" },
  { value: "ai_agent", label: "AI Agent" },
]
const LOG_STATUSES = [
  { value: "all", label: "Alle statussen" },
  { value: "info", label: "Info" },
  { value: "success", label: "Success" },
  { value: "warning", label: "Warning" },
  { value: "error", label: "Error" },
]

export default function LogsPage() {
  // --- State ---
  const [logs, setLogs] = useState<LogItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [type, setType] = useState("all")
  const [status, setStatus] = useState("all")
  const [search, setSearch] = useState("")
  const [showJson, setShowJson] = useState<LogItem | null>(null)
  // Realtime state
  const [newLogs, setNewLogs] = useState<LogItem[]>([])
  const [showNewLogs, setShowNewLogs] = useState(false)
  const lastFetchRef = useRef<string | null>(null)
  const jsonRef = useReactRef<HTMLPreElement>(null)
  const [openDetails, setOpenDetails] = useState<string | null>(null)

  // --- Fetch logs ---
  useEffect(() => {
    fetchLogs()
    // eslint-disable-next-line
  }, [dateRange, type, status, search])

  // Polling voor realtime updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNewLogs()
    }, 5000)
    return () => clearInterval(interval)
  }, [logs, dateRange, type, status, search])

  useReactEffect(() => {
    if (showJson && jsonRef.current) {
      Prism.highlightAllUnder(jsonRef.current)
    }
  }, [showJson])

  async function fetchLogs() {
    setLoading(true)
    setError(null)
    let query = supabase.from("logs").select("*").order("created_at", { ascending: false }).limit(200)
    if (dateRange?.from && dateRange?.to) {
      query = query.gte("created_at", dateRange.from.toISOString()).lte("created_at", dateRange.to.toISOString())
    }
    if (type && type !== "all") query = query.eq("type", type)
    if (status && status !== "all") query = query.eq("status", status)
    if (search) query = query.or(`message.ilike.%${search}%,data::text.ilike.%${search}%`)
    const { data, error } = await query
    if (error) setError("Fout bij ophalen logs: " + error.message)
    setLogs(data || [])
    setLoading(false)
    if (data && data.length > 0) {
      lastFetchRef.current = data[0].created_at
    }
    setNewLogs([])
    setShowNewLogs(false)
  }

  // Poll voor nieuwe logs (bovenop huidige logs)
  async function fetchNewLogs() {
    if (!lastFetchRef.current) return
    let query = supabase.from("logs").select("*").order("created_at", { ascending: false })
    if (dateRange?.from && dateRange?.to) {
      query = query.gte("created_at", dateRange.from.toISOString()).lte("created_at", dateRange.to.toISOString())
    }
    if (type && type !== "all") query = query.eq("type", type)
    if (status && status !== "all") query = query.eq("status", status)
    if (search) query = query.or(`message.ilike.%${search}%,data::text.ilike.%${search}%`)
    query = query.gt("created_at", lastFetchRef.current)
    const { data, error } = await query
    if (!error && data && data.length > 0) {
      setNewLogs(data)
      setShowNewLogs(true)
    }
  }

  function exportToJson(logs: LogItem[]) {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: "application/json" })
    saveAs(blob, `auria-logs-${new Date().toISOString()}.json`)
  }
  function exportToCsv(logs: LogItem[]) {
    if (!logs.length) return
    const replacer = (key: string, value: any) => (value === null || value === undefined ? "" : value)
    const header = Object.keys(logs[0])
    const csv = [
      header.join(","),
      ...logs.map(row =>
        header.map(fieldName => {
          const val = row[fieldName]
          if (typeof val === "object") return '"' + JSON.stringify(val).replace(/"/g, '""') + '"'
          return '"' + String(val).replace(/"/g, '""') + '"'
        }).join(",")
      )
    ].join("\r\n")
    const blob = new Blob([csv], { type: "text/csv" })
    saveAs(blob, `auria-logs-${new Date().toISOString()}.csv`)
  }

  // --- UI ---
  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Logs</h1>
          <p className="text-gray-400">Technisch overzicht van systeemactiviteit, calls, klantinteracties en backend-processen</p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Vernieuwen</span>
        </button>
      </div>

      {/* Nieuwe logs teller */}
      {showNewLogs && newLogs.length > 0 && (
        <div className="mb-2 flex items-center gap-4">
          <span className="bg-green-700 text-green-200 px-3 py-1 rounded-full text-xs font-semibold animate-pulse">
            {newLogs.length} nieuwe log(s)
          </span>
          <button
            className="text-xs px-3 py-1 rounded bg-blue-700 hover:bg-blue-600 text-white"
            onClick={() => {
              setLogs(prev => [...newLogs, ...prev])
              setNewLogs([])
              setShowNewLogs(false)
              if (newLogs.length > 0) {
                lastFetchRef.current = newLogs[0].created_at
              }
            }}
          >
            Toevoegen aan overzicht
          </button>
        </div>
      )}

      {/* Filterbalk */}
      <Card className="bg-gray-800 border-gray-700 mb-4">
        <CardContent className="py-4 flex flex-col md:flex-row md:items-end gap-4">
          {/* Datumrange picker (placeholder, later vervangen door echte range) */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Datumrange</label>
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={setDateRange}
              className="bg-gray-900 border border-gray-700 rounded-md"
            />
          </div>
          {/* Type dropdown */}
          <div className="w-40">
            <label className="block text-xs text-gray-400 mb-1">Type</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {LOG_TYPES.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Status dropdown */}
          <div className="w-40">
            <label className="block text-xs text-gray-400 mb-1">Status</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {LOG_STATUSES.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Zoekbalk */}
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs text-gray-400 mb-1">Zoeken</label>
            <div className="relative">
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Zoek op klant, campagne, verkoper, IP, Twilio SID..."
                className="pl-10 bg-gray-900 border-gray-700 text-white"
              />
              <Search className="absolute left-2 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Foutmelding */}
      {error && <div className="bg-red-600/20 border border-red-600/50 rounded-lg p-4 text-red-300">{error}</div>}

      {/* Log-overzicht */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <span className="mr-2">Logregels</span>
            <span className="text-xs text-gray-400">({logs.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-400">Laden...</div>
          ) : (
            <div className="divide-y divide-gray-700">
              {logs.map(log => (
                <div key={log.id} className="py-4 flex flex-col md:flex-row md:items-center gap-2 md:gap-4 hover:bg-gray-700/40 transition-colors">
                  {/* Titel + samenvatting */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-white mb-1">{log.message}</div>
                      <button
                        className="ml-2 text-xs text-gray-400 hover:text-blue-400 flex items-center"
                        onClick={() => setOpenDetails(openDetails === log.id ? null : log.id)}
                        aria-label="Toon technische details"
                      >
                        {openDetails === log.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-400 items-center">
                      <span>{format(parseISO(log.created_at), "dd-MM-yyyy HH:mm:ss")}</span>
                      <Badge variant="outline" className="bg-gray-900 border-blue-600 text-blue-400">{log.type}</Badge>
                      <Badge variant="outline" className={
                        log.status === "success" ? "bg-green-700 border-green-600 text-green-300" :
                        log.status === "info" ? "bg-blue-700 border-blue-600 text-blue-300" :
                        log.status === "warning" ? "bg-yellow-700 border-yellow-600 text-yellow-300" :
                        log.status === "error" ? "bg-red-700 border-red-600 text-red-300" :
                        "bg-gray-700 border-gray-600 text-gray-300"
                      }>{log.status}</Badge>
                      {log.user_id && <span>👤 {log.user_id}</span>}
                      {log.ip && <span>🌐 {log.ip}</span>}
                      {log.region && <span>📍 {log.region}</span>}
                      {log.twilio_sid && <span>Twilio: {log.twilio_sid}</span>}
                    </div>
                    {/* Accordion details */}
                    {openDetails === log.id && (
                      <div className="mt-2 p-3 rounded bg-gray-800 border border-gray-700 text-xs text-gray-300 space-y-1">
                        <div><b>Timestamp (UTC):</b> {new Date(log.created_at).toISOString()}</div>
                        <div><b>Timestamp (Local):</b> {format(parseISO(log.created_at), "dd-MM-yyyy HH:mm:ss")}</div>
                        {log.ip && <div><b>IP-adres:</b> {log.ip}</div>}
                        {log.device && <div><b>Device:</b> {log.device}</div>}
                        {log.user_id && <div><b>User ID:</b> {log.user_id}</div>}
                        {log.twilio_sid && <div><b>Twilio Call SID:</b> {log.twilio_sid}</div>}
                        {log.data?.ai_agent_status && <div><b>AI-agent status:</b> {log.data.ai_agent_status}</div>}
                        {log.data?.ai_agent_response && <div><b>AI-agent response:</b> <span className="break-all">{log.data.ai_agent_response}</span></div>}
                      </div>
                    )}
                  </div>
                  {/* Acties */}
                  <div className="flex gap-2 mt-2 md:mt-0">
                    <button
                      className="flex items-center gap-1 px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-xs text-blue-300 border border-blue-700"
                      onClick={() => setShowJson(log)}
                    >
                      <Eye className="h-4 w-4" /> Bekijk JSON
                    </button>
                    {log.type === "call" && log.twilio_sid && (
                      <a
                        href={`https://www.twilio.com/console/voice/logs/${log.twilio_sid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-xs text-purple-300 border border-purple-700"
                      >
                        <ExternalLink className="h-4 w-4" /> Bekijk in Twilio
                      </a>
                    )}
                  </div>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-center py-8 text-gray-400">Geen logs gevonden voor deze filters.</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2 mb-2">
        <button
          className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-xs text-white border border-gray-600"
          onClick={() => exportToCsv(logs)}
        >
          Exporteer als CSV
        </button>
        <button
          className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-xs text-white border border-gray-600"
          onClick={() => exportToJson(logs)}
        >
          Exporteer als JSON
        </button>
      </div>

      {/* JSON-inspectie modaal (placeholder) */}
      <Dialog open={!!showJson} onOpenChange={() => setShowJson(null)}>
        <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-lg flex items-center justify-between">
              Log JSON
              {showJson && (
                <button
                  className="ml-4 px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-xs text-white border border-gray-700"
                  onClick={() => navigator.clipboard.writeText(JSON.stringify(showJson, null, 2))}
                >
                  Copy
                </button>
              )}
            </DialogTitle>
          </DialogHeader>
          <pre ref={jsonRef} className="bg-gray-800 text-gray-200 p-4 rounded overflow-x-auto text-xs max-h-[60vh]">
            <code className="language-json">
              {showJson ? JSON.stringify(showJson, null, 2) : ""}
            </code>
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  )
}
