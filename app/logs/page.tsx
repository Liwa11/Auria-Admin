"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, AlertCircle, CheckCircle, Info, XCircle, Phone, User, Building2, RefreshCw } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface SystemLog {
  id: string
  timestamp: string
  type: string
  message: string
  details: any
  level: "info" | "success" | "warning" | "error"
}

export default function LogsPage() {
  const [logs, setLogs] = useState<SystemLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>("all")

  useEffect(() => {
    console.log("LogsPage - Component mounted")
    fetchLogs()

    const subscription = supabase
      .channel("logs-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "gesprekken" }, () => {
        console.log("LogsPage - Real-time update received")
        fetchLogs()
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "klanten" }, () => {
        console.log("LogsPage - Real-time update received")
        fetchLogs()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchLogs = async () => {
    try {
      console.log("LogsPage - Fetching logs...")
      setLoading(true)
      setError(null)

      // Fetch call logs
      const { data: callLogs, error: callsError } = await supabase
        .from("gesprekken")
        .select(`
          *,
          klanten(bedrijfsnaam),
          verkopers(naam),
          campagnes(naam)
        `)
        .order("aangemaakt_op", { ascending: false })
        .limit(20)

      if (callsError) {
        console.error("LogsPage - Error fetching calls:", callsError)
        throw callsError
      }

      console.log("LogsPage - Call logs fetched:", callLogs?.length || 0)

      // Transform call logs to log format
      const transformedCallLogs: SystemLog[] = (callLogs || []).map(call => ({
        id: call.id,
        timestamp: call.aangemaakt_op,
        type: "call",
        message: `Gesprek met ${call.klanten?.bedrijfsnaam || "onbekende klant"} - ${call.resultaatcode}`,
        details: {
          client: call.klanten?.bedrijfsnaam,
          seller: call.verkopers?.naam,
          campaign: call.campagnes?.naam,
          result: call.resultaatcode,
          date: call.datum,
          time: call.tijdslot,
        },
        level: call.resultaatcode === "Afspraak ingepland" ? "success" : "info"
      }))

      // Fetch client updates
      const { data: clients, error: clientsError } = await supabase
        .from("klanten")
        .select("*")
        .order("aangemaakt_op", { ascending: false })
        .limit(10)

      if (clientsError) {
        console.error("LogsPage - Error fetching clients:", clientsError)
        throw clientsError
      }

      console.log("LogsPage - Client logs fetched:", clients?.length || 0)

      const transformedClientLogs: SystemLog[] = (clients || []).map(client => ({
        id: `client-${client.id}`,
        timestamp: client.aangemaakt_op,
        type: "client",
        message: `Nieuwe klant toegevoegd: ${client.bedrijfsnaam}`,
        details: {
          company: client.bedrijfsnaam,
          email: client.email,
          phone: client.telefoon,
        },
        level: "info"
      }))

      // Combine and sort all logs
      const allLogs = [...transformedCallLogs, ...transformedClientLogs]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      console.log("LogsPage - Total logs:", allLogs.length)
      setLogs(allLogs)
    } catch (error) {
      console.error("LogsPage - Error fetching logs:", error)
      setError("Fout bij ophalen van logs")
    } finally {
      setLoading(false)
    }
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case "info":
        return <Info className="h-4 w-4 text-blue-400" />
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-400" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-400" />
      default:
        return <Activity className="h-4 w-4 text-gray-400" />
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case "success":
        return "bg-green-600 text-white"
      case "info":
        return "bg-blue-600 text-white"
      case "warning":
        return "bg-yellow-600 text-white"
      case "error":
        return "bg-red-600 text-white"
      default:
        return "bg-gray-600 text-white"
    }
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "Call System":
        return <Phone className="h-3 w-3" />
      case "Client Management":
        return <Building2 className="h-3 w-3" />
      case "Campaign Management":
        return <Activity className="h-3 w-3" />
      default:
        return <Info className="h-3 w-3" />
    }
  }

  const filteredLogs = filter === "all" 
    ? logs 
    : logs.filter(log => log.level === filter)

  console.log("LogsPage - Rendering with", filteredLogs.length, "logs")

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Logs</h1>
          <p className="text-gray-400">Systeem activiteiten en gebeurtenissen</p>
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

      {/* Error Display */}
      {error && (
        <div className="bg-red-600/20 border border-red-600/50 rounded-lg p-4">
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {/* Filter Buttons */}
      <div className="flex space-x-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1 rounded-lg text-sm ${
            filter === "all" 
              ? "bg-blue-600 text-white" 
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          Alle
        </button>
        <button
          onClick={() => setFilter("success")}
          className={`px-3 py-1 rounded-lg text-sm ${
            filter === "success" 
              ? "bg-green-600 text-white" 
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          Succes
        </button>
        <button
          onClick={() => setFilter("info")}
          className={`px-3 py-1 rounded-lg text-sm ${
            filter === "info" 
              ? "bg-blue-600 text-white" 
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          Info
        </button>
        <button
          onClick={() => setFilter("warning")}
          className={`px-3 py-1 rounded-lg text-sm ${
            filter === "warning" 
              ? "bg-yellow-600 text-white" 
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          Waarschuwing
        </button>
        <button
          onClick={() => setFilter("error")}
          className={`px-3 py-1 rounded-lg text-sm ${
            filter === "error" 
              ? "bg-red-600 text-white" 
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          Fout
        </button>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <Activity className="h-5 w-5 mr-2 text-blue-400" />
            Recente Activiteiten ({filteredLogs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-400">Laden...</div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start space-x-4 p-4 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                >
                  <div className="flex-shrink-0 mt-1">{getLevelIcon(log.level)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-white truncate">{log.message}</h3>
                      <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                        <Badge className={getLevelColor(log.level)}>{log.level}</Badge>
                        <span className="text-xs text-gray-400">
                          {new Date(log.timestamp).toLocaleString("nl-NL")}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <span>{log.type}</span>
                      {log.details && (
                        <>
                          {log.details.client && (
                            <span>• Klant: {log.details.client}</span>
                          )}
                          {log.details.campaign && (
                            <span>• Campagne: {log.details.campaign}</span>
                          )}
                          {log.details.seller && (
                            <span>• Verkoper: {log.details.seller}</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {filteredLogs.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  Geen activiteiten gevonden voor het geselecteerde filter.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
