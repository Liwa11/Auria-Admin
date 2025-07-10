"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { Phone, Users, TrendingUp, Activity, Zap } from "lucide-react"

interface DashboardStats {
  totalCalls: number
  activeCampaigns: number
  agentsOnline: number
  successRate: number
  todaysCalls: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCalls: 0,
    activeCampaigns: 0,
    agentsOnline: 0,
    successRate: 0,
    todaysCalls: 0,
  })
  const [loading, setLoading] = useState(true)
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  useEffect(() => {
    fetchDashboardData()

    const subscription = supabase
      .channel("dashboard-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "gesprekken" }, () => {
        fetchDashboardData()
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "verkopers" }, () => {
        fetchDashboardData()
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "campagnes" }, () => {
        fetchDashboardData()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch total calls
      const { data: calls, error: callsError } = await supabase
        .from("gesprekken")
        .select("*")

      if (callsError) throw callsError

      // Fetch sellers
      const { data: sellers, error: sellersError } = await supabase
        .from("verkopers")
        .select("*")

      if (sellersError) throw sellersError

      // Fetch campaigns
      const { data: campaigns, error: campaignsError } = await supabase
        .from("campagnes")
        .select("*")

      if (campaignsError) throw campaignsError

      // Calculate statistics
      const totalCalls = calls?.length || 0
      const today = new Date().toISOString().split('T')[0]
      const todaysCalls = calls?.filter(call => call.datum === today).length || 0
      
      const successfulCalls = calls?.filter(call => call.resultaatcode === "Afspraak ingepland").length || 0
      const successRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0

      // Count active campaigns (campaigns with startdatum and einddatum)
      const activeCampaigns = campaigns?.filter(campaign => 
        campaign.startdatum && campaign.einddatum
      ).length || 0

      // Count online agents (sellers who have calls today)
      const agentsWithCallsToday = new Set(
        calls?.filter(call => call.datum === today).map(call => call.verkoper_id) || []
      )
      const agentsOnline = agentsWithCallsToday.size

      setStats({
        totalCalls,
        activeCampaigns,
        agentsOnline,
        successRate,
        todaysCalls,
      })

      // Fetch recent activity
      const { data: recentCalls, error: recentError } = await supabase
        .from("gesprekken")
        .select(`
          *,
          klanten(bedrijfsnaam),
          verkopers(naam),
          campagnes(naam)
        `)
        .order("aangemaakt_op", { ascending: false })
        .limit(5)

      if (recentError) throw recentError

      setRecentActivity(recentCalls || [])

    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getResultCodeColor = (resultCode: string) => {
    switch (resultCode) {
      case "Afspraak ingepland":
        return "bg-green-600 text-white"
      case "Geen interesse":
        return "bg-red-600 text-white"
      case "Interesse, maar niet nu":
        return "bg-yellow-600 text-white"
      case "Terugbellen":
        return "bg-blue-600 text-white"
      case "Niet bereikbaar":
        return "bg-gray-600 text-white"
      case "Verkeerd nummer":
        return "bg-orange-600 text-white"
      default:
        return "bg-gray-600 text-white"
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6 bg-gray-900 min-h-screen">
        <div className="text-center py-8 text-gray-400">Laden...</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400">Welkom bij Auria Admin Dashboard</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Totaal Gesprekken</CardTitle>
            <Phone className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalCalls}</div>
            <p className="text-xs text-gray-400">Alle tijd</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Vandaag</CardTitle>
            <Activity className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.todaysCalls}</div>
            <p className="text-xs text-gray-400">Gesprekken vandaag</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Agents Online</CardTitle>
            <Users className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.agentsOnline}</div>
            <p className="text-xs text-gray-400">Actieve verkopers</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Actieve Campagnes</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.activeCampaigns}</div>
            <p className="text-xs text-gray-400">Lopende campagnes</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Realtime Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Succespercentage</span>
                <Badge className="bg-green-600 text-white">{stats.successRate.toFixed(1)}%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Afspraken vandaag</span>
                <Badge className="bg-blue-600 text-white">
                  {recentActivity.filter(call => call.resultaatcode === "Afspraak ingepland" && call.datum === new Date().toISOString().split('T')[0]).length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Systeem Status</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-green-400 text-sm">Online</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Recente Activiteit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((call) => (
                <div key={call.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-700">
                  <div>
                    <h4 className="font-medium text-white">{call.klanten?.bedrijfsnaam || "Onbekende klant"}</h4>
                    <p className="text-sm text-gray-400">
                      {call.verkopers?.naam || "Onbekende verkoper"} • {call.campagnes?.naam || "Onbekende campagne"}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className={getResultCodeColor(call.resultaatcode)}>
                      {call.resultaatcode}
                    </Badge>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(call.aangemaakt_op).toLocaleString("nl-NL")}
                    </div>
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <div className="text-center py-4 text-gray-400">Geen recente activiteit</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
