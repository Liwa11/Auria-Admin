"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { FileText, Play, Save, TestTube } from "lucide-react"

export default function BelschermenPage() {
  const [selectedCampagne, setSelectedCampagne] = useState<string>("")
  const [script, setScript] = useState<string>("")
  const [testOutput, setTestOutput] = useState<string>("")
  const [testing, setTesting] = useState(false)

  const handleTestAI = async () => {
    setTesting(true)
    // Simulate AI testing
    setTimeout(() => {
      setTestOutput(`AI Test Output voor campagne "${selectedCampagne}":

Hallo, spreek ik met [KLANT_NAAM]?

Mijn naam is [AGENT_NAAM] en ik bel namens [BEDRIJF_NAAM]. We hebben een speciale aanbieding voor bedrijven in uw regio.

[WACHT OP REACTIE]

Ik begrijp dat u druk bent, maar dit duurt slechts 2 minuten. We kunnen u helpen met [PRODUCT/DIENST] tegen een zeer aantrekkelijke prijs.

Zou u geïnteresseerd zijn in meer informatie?`)
      setTesting(false)
    }, 2000)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Belschermen</h1>
          <p className="text-gray-300">Beheer belscripts en test AI-output</p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700">
          <Save className="h-4 w-4 mr-2" />
          Script Opslaan
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Script Editor */}
        <Card className="glass-card border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <FileText className="h-5 w-5 mr-2 text-blue-400" />
              Script Editor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-gray-300 text-sm mb-2 block">Selecteer Campagne</label>
              <Select value={selectedCampagne} onValueChange={setSelectedCampagne}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Kies een campagne..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="campagne-1">Zonnepanelen Noord-Holland</SelectItem>
                  <SelectItem value="campagne-2">Isolatie Zuid-Holland</SelectItem>
                  <SelectItem value="campagne-3">Warmtepompen Utrecht</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-gray-300 text-sm mb-2 block">Belscript</label>
              <Textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                placeholder="Voer hier uw belscript in...

Gebruik variabelen zoals:
- [KLANT_NAAM] voor de naam van de klant
- [AGENT_NAAM] voor de naam van de agent
- [BEDRIJF_NAAM] voor de bedrijfsnaam
- [PRODUCT_DIENST] voor het product/dienst"
                rows={12}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={handleTestAI}
                disabled={!selectedCampagne || testing}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <TestTube className="h-4 w-4 mr-2" />
                {testing ? "Testen..." : "Test AI Output"}
              </Button>
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 bg-transparent">
                <Play className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI Test Output */}
        <Card className="glass-card border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <TestTube className="h-5 w-5 mr-2 text-purple-400" />
              AI Test Output
            </CardTitle>
          </CardHeader>
          <CardContent>
            {testOutput ? (
              <div className="space-y-4">
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Test Succesvol</Badge>
                <div className="bg-black/20 rounded-lg p-4 border border-white/10">
                  <pre className="text-gray-300 text-sm whitespace-pre-wrap font-mono">{testOutput}</pre>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    Script Goedkeuren
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                  >
                    Opnieuw Testen
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <TestTube className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Selecteer een campagne en klik op "Test AI Output" om de AI-gegenereerde conversatie te zien</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Saved Scripts */}
      <Card className="glass-card border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Opgeslagen Scripts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
              <div>
                <h3 className="font-semibold text-white">Zonnepanelen Script v2.1</h3>
                <p className="text-sm text-gray-400">Laatst bijgewerkt: 2 dagen geleden</p>
              </div>
              <div className="flex space-x-2">
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Actief</Badge>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  Bewerken
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
              <div>
                <h3 className="font-semibold text-white">Isolatie Script v1.5</h3>
                <p className="text-sm text-gray-400">Laatst bijgewerkt: 1 week geleden</p>
              </div>
              <div className="flex space-x-2">
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Concept</Badge>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  Bewerken
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
