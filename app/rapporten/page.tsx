"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, BarChart3, Download, Phone, Users, Target, Clock } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface ReportStats {
  totalCalls: number
  completedCalls: number
  conversionRate: number
  avgCallDuration: number
  activeAgents: number
  totalClients: number
  activeCampaigns: number
  todayCalls: number
}

interface CampaignPerformance {
  id: string
  name: string
  totalCalls: number
  completedCalls: number
  conversionRate: number
  avgDuration: number
}

export default function RapportenPage() {
  const [stats, setStats] = useState<ReportStats>({
    totalCalls: 0,
    completedCalls: 0,
    conversionRate: 0,
    avgCallDuration: 0,
    activeAgents: 0,
    totalClients: 0,
    activeCampaigns: 0,
    todayCalls: 0,
  })
  const [campaignPerformance, setCampaignPerformance] = useState<CampaignPerformance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReportData()
  }, [])

  const fetchReportData = async () => {
    try {
      // Fetch calls data
      const { data: calls, error: callsError } = await supabase
        .from("gesprekken")
        .select(`
          *,
          klanten(bedrijfsnaam),
          verkopers(naam),
          campagnes(naam)
        `)

      if (callsError) throw callsError

      // Fetch campaigns data
      const { data: campaigns, error: campaignsError } = await supabase
        .from("campagnes")
        .select("*")

      if (campaignsError) throw campaignsError

      // Fetch sellers data
      const { data: sellers, error: sellersError } = await supabase
        .from("verkopers")
        .select("*")

      if (sellersError) throw sellersError

      // Calculate statistics
      const totalCalls = calls?.length || 0
      const successfulCalls = calls?.filter(call => call.resultaatcode === "Afspraak ingepland").length || 0
      const successRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0

      // Calculate calls by result
      const callsByResult = calls?.reduce((acc: any, call) => {
        acc[call.resultaatcode] = (acc[call.resultaatcode] || 0) + 1
        return acc
      }, {}) || {}

      // Calculate calls by campaign
      const callsByCampaign = calls?.reduce((acc: any, call) => {
        const campaignName = call.campagnes?.naam || "Onbekende campagne"
        if (!acc[campaignName]) {
          acc[campaignName] = {
            total: 0,
            successful: 0,
            successRate: 0
          }
        }
        acc[campaignName].total++
        if (call.resultaatcode === "Afspraak ingepland") {
          acc[campaignName].successful++
        }
        acc[campaignName].successRate = (acc[campaignName].successful / acc[campaignName].total) * 100
        return acc
      }, {}) || {}

      // Calculate calls by seller
      const callsBySeller = calls?.reduce((acc: any, call) => {
        const sellerName = call.verkopers?.naam || "Onbekende verkoper"
        if (!acc[sellerName]) {
          acc[sellerName] = {
            total: 0,
            successful: 0,
            successRate: 0
          }
        }
        acc[sellerName].total++
        if (call.resultaatcode === "Afspraak ingepland") {
          acc[sellerName].successful++
        }
        acc[sellerName].successRate = (acc[sellerName].successful / acc[sellerName].total) * 100
        return acc
      }, {}) || {}

      setStats({
        totalCalls,
        completedCalls: successfulCalls, // Assuming 'completedCalls' is synonymous with 'successfulCalls' for now
        conversionRate: successRate,
        avgCallDuration: 0, // No duration data in this new fetch
        activeAgents: sellers?.filter(seller => seller.status === "online").length || 0,
        totalClients: 0, // No client data in this new fetch
        activeCampaigns: campaigns?.filter(campaign => campaign.status === "active").length || 0,
        todayCalls: 0, // No today's calls data in this new fetch
      })

      // Calculate campaign performance
      const campaignStats: CampaignPerformance[] = []
      
      campaigns?.forEach(campaign => {
        const campaignCalls = calls?.filter(call => call.campagnes?.id === campaign.id) || []
        const campaignCompletedCalls = campaignCalls.filter(call => call.resultaatcode === "Afspraak ingepland")
        const campaignConversionRate = campaignCalls.length > 0 
          ? (campaignCompletedCalls.length / campaignCalls.length) * 100 
          : 0
        const campaignTotalDuration = campaignCalls.reduce((sum, call) => sum + (call.duur || 0), 0)
        const campaignAvgDuration = campaignCalls.length > 0 ? campaignTotalDuration / campaignCalls.length : 0

        campaignStats.push({
          id: campaign.id,
          name: campaign.naam,
          totalCalls: campaignCalls.length,
          completedCalls: campaignCompletedCalls.length,
          conversionRate: campaignConversionRate,
          avgDuration: campaignAvgDuration,
        })
      })

      setCampaignPerformance(campaignStats)

    } catch (error) {
      console.error("Error fetching report data:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const exportReport = () => {
    const reportData = {
      stats,
      campaignPerformance,
      generatedAt: new Date().toISOString(),
    }
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `rapport-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
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
          <h1 className="text-3xl font-bold text-white">Rapporten</h1>
          <p className="text-gray-400">Prestatie-analyses en statistieken</p>
        </div>
        <Button 
          className="bg-green-600 hover:bg-green-700"
          onClick={exportReport}
        >
          <Download className="h-4 w-4 mr-2" />
          Export Rapport
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Conversie Ratio</CardTitle>
            <Target className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.conversionRate.toFixed(1)}%</div>
            <div className="text-xs text-gray-400">
              {stats.completedCalls} van {stats.totalCalls} gesprekken
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Gem. Gespreksduur</CardTitle>
            <Clock className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatDuration(stats.avgCallDuration)}</div>
            <div className="text-xs text-gray-400">
              Gemiddelde duur per gesprek
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Actieve Agents</CardTitle>
            <Users className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.activeAgents}</div>
            <div className="text-xs text-gray-400">
              Online verkopers
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Vandaag</CardTitle>
            <Phone className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.todayCalls}</div>
            <div className="text-xs text-gray-400">
              Gesprekken vandaag
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Overzicht</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-700">
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-blue-400" />
                  <div>
                    <h3 className="font-medium text-white">Totaal Gesprekken</h3>
                    <p className="text-sm text-gray-400">Alle tijd</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-semibold">{stats.totalCalls}</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-700">
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-green-400" />
                  <div>
                    <h3 className="font-medium text-white">Totaal Klanten</h3>
                    <p className="text-sm text-gray-400">Database</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-semibold">{stats.totalClients}</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-700">
                <div className="flex items-center space-x-3">
                  <BarChart3 className="h-5 w-5 text-purple-400" />
                  <div>
                    <h3 className="font-medium text-white">Actieve Campagnes</h3>
                    <p className="text-sm text-gray-400">Momenteel actief</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-semibold">{stats.activeCampaigns}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Prestaties per Campagne</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {campaignPerformance.length > 0 ? (
                campaignPerformance.map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-700">
                    <div>
                      <h3 className="font-medium text-white">{campaign.name}</h3>
                      <p className="text-sm text-gray-400">
                        {campaign.totalCalls} gesprekken • {campaign.conversionRate.toFixed(1)}% conversie
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-semibold">{formatDuration(campaign.avgDuration)}</div>
                      <div className="text-xs text-gray-400">gem. duur</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  Geen campagne data beschikbaar
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
