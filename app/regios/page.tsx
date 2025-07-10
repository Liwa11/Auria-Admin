"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Search, MapPin, RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { logEvent } from "@/lib/logEvent"

interface Region {
  id: number
  naam: string
  beschrijving: string | null
  created_at: string
  updated_at: string
}

export default function RegiosPage() {
  const [regions, setRegions] = useState<Region[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingRegion, setEditingRegion] = useState<Region | null>(null)
  const [formData, setFormData] = useState({
    naam: "",
    beschrijving: "",
  })

  const { toast } = useToast()

  useEffect(() => {
    fetchRegions()
    subscribeToChanges()
  }, [])

  const fetchRegions = async () => {
    try {
      const { data, error } = await supabase
        .from("regio")
        .select("*")
        .order("naam", { ascending: true })

      if (error) throw error
      
      setRegions(data || [])
    } catch (error) {
      console.error("Error fetching regions:", error)
      toast({
        title: "Fout",
        description: "Kon regio's niet ophalen",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const subscribeToChanges = () => {
    const subscription = supabase
      .channel("regio_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "regio",
        },
        (payload) => {
          fetchRegions()
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
        }
      })

    return () => {
      subscription.unsubscribe()
    }
  }

  const handleAdd = async () => {
    if (!formData.naam.trim()) {
      toast({
        title: "Fout",
        description: "Regionaam is verplicht",
        variant: "destructive",
      })
      return
    }

    try {
      const { data, error } = await supabase
        .from("regio")
        .insert([
          {
            naam: formData.naam,
            Beschrijving: formData.beschrijving || null,
          },
        ])
        .select()

      if (error) {
        console.error("Supabase insert error:", error)
        throw error
      }

      toast({
        title: "Succes",
        description: "Regio succesvol toegevoegd",
      })
      setIsAddDialogOpen(false)
      resetForm()
      if (!error && data && data[0]) {
        await logEvent({
          type: "region_add",
          status: "success",
          message: `Regio toegevoegd: ${formData.naam.trim()}`,
          data: { regio_id: data[0].id, naam: formData.naam.trim(), beschrijving: formData.beschrijving.trim() },
        })
      }
    } catch (error) {
      console.error("Error adding region:", error)
      toast({
        title: "Fout",
        description: "Kon regio niet toevoegen",
        variant: "destructive",
      })
      await logEvent({
        type: "region_add",
        status: "error",
        message: `Fout bij toevoegen regio: ${formData.naam.trim()}`,
        data: { naam: formData.naam.trim(), error },
      })
    }
  }

  const handleEdit = async () => {
    if (!editingRegion || !formData.naam.trim()) {
      toast({
        title: "Fout",
        description: "Regionaam is verplicht",
        variant: "destructive",
      })
      return
    }

    try {
      const { error } = await supabase
        .from("regio")
        .update({
          naam: formData.naam,
          Beschrijving: formData.beschrijving || null,
        })
        .eq("id", editingRegion.id)

      if (error) {
        console.error("Supabase update error:", error)
        throw error
      }

      toast({
        title: "Succes",
        description: "Regio succesvol bijgewerkt",
      })
      setIsEditDialogOpen(false)
      setEditingRegion(null)
      resetForm()
      if (!error && data && data[0]) {
        await logEvent({
          type: "region_edit",
          status: "success",
          message: `Regio gewijzigd: ${formData.naam.trim()}`,
          data: { regio_id: editingRegion.id, naam: formData.naam.trim(), beschrijving: formData.beschrijving.trim() },
        })
      }
    } catch (error) {
      console.error("Error updating region:", error)
      toast({
        title: "Fout",
        description: "Kon regio niet bijwerken",
        variant: "destructive",
      })
      await logEvent({
        type: "region_edit",
        status: "error",
        message: `Fout bij wijzigen regio: ${formData.naam.trim()}`,
        data: { regio_id: editingRegion?.id, naam: formData.naam.trim(), error },
      })
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Weet je zeker dat je deze regio wilt verwijderen?")) return

    try {
      const { error } = await supabase
        .from("regio")
        .delete()
        .eq("id", id)

      if (error) throw error

      toast({
        title: "Succes",
        description: "Regio succesvol verwijderd",
      })
      if (!error) {
        await logEvent({
          type: "region_delete",
          status: "success",
          message: `Regio verwijderd: ${id}`,
          data: { regio_id: id },
        })
      }
    } catch (error) {
      console.error("Error deleting region:", error)
      toast({
        title: "Fout",
        description: "Kon regio niet verwijderen",
        variant: "destructive",
      })
      await logEvent({
        type: "region_delete",
        status: "error",
        message: `Fout bij verwijderen regio: ${id}`,
        data: { regio_id: id, error },
      })
    }
  }

  const openEditDialog = (region: Region) => {
    setEditingRegion(region)
    setFormData({
      naam: region.naam,
      beschrijving: region.beschrijving || "",
    })
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      naam: "",
      beschrijving: "",
    })
  }

  const handleRefresh = async () => {
    setLoading(true)
    await fetchRegions()
    toast({
      title: "Verversd",
      description: "Regio data is bijgewerkt",
    })
  }

  const debugRegions = () => {
    console.log("Current regions state:", regions)
    console.log("Regions with descriptions:", regions.filter(r => r.beschrijving))
    console.log("Regions without descriptions:", regions.filter(r => !r.beschrijving))
  }

  const filteredRegions = regions.filter((region) =>
    region.naam.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="p-6 space-y-6 bg-gray-900 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-white">Laden...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Regio's</h1>
          <p className="text-gray-400">Beheer regio's voor verkopers</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={handleRefresh}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Ververs
          </Button>
          <Button 
            variant="outline"
            onClick={debugRegions}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            Debug
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => resetForm()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nieuwe Regio
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Regio Overzicht
          </CardTitle>
          <CardDescription className="text-gray-400">
            {filteredRegions.length} van {regions.length} regio's
          </CardDescription>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Zoek regio's..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700 hover:bg-gray-700">
                <TableHead className="text-white">Regionaam</TableHead>
                <TableHead className="text-white">Beschrijving</TableHead>
                <TableHead className="text-white">Aangemaakt</TableHead>
                <TableHead className="text-white">Bijgewerkt</TableHead>
                <TableHead className="text-right text-white">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRegions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-400">
                    {searchTerm ? "Geen regio's gevonden" : "Geen regio's beschikbaar"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredRegions.map((region) => (
                  <TableRow key={region.id} className="border-gray-700 hover:bg-gray-700">
                    <TableCell className="font-medium text-white">{region.naam}</TableCell>
                    <TableCell>
                      {region.beschrijving ? (
                        <span className="text-sm text-gray-300">{region.beschrijving}</span>
                      ) : (
                        <Badge variant="secondary" className="bg-gray-600 text-gray-300">Geen beschrijving</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {new Date(region.created_at).toLocaleDateString("nl-NL")}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {new Date(region.updated_at).toLocaleDateString("nl-NL")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(region)}
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(region.id)}
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Regio Bewerken</DialogTitle>
            <DialogDescription className="text-gray-400">
              Bewerk de gegevens van deze regio
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-naam" className="text-white">Regionaam *</Label>
              <Input
                id="edit-naam"
                value={formData.naam}
                onChange={(e) => setFormData({ ...formData, naam: e.target.value })}
                placeholder="Bijv. Noord-Holland"
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                required
                type="text"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-beschrijving" className="text-white">Beschrijving</Label>
              <Input
                id="edit-beschrijving"
                value={formData.beschrijving}
                onChange={(e) => setFormData({ ...formData, beschrijving: e.target.value })}
                placeholder="Optionele beschrijving"
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-gray-600 text-gray-300 hover:bg-gray-700">
              Annuleren
            </Button>
            <Button onClick={handleEdit} className="bg-green-600 hover:bg-green-700">Bijwerken</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 