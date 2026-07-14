'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Upload, FileText, Play, Bot, Users, Megaphone } from 'lucide-react'
import Papa from 'papaparse'

export default function NewCampaignPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [name, setName] = useState('')
  const [assistantId, setAssistantId] = useState('')
  const [assistants, setAssistants] = useState<any[]>([])
  
  const [file, setFile] = useState<File | null>(null)
  const [leads, setLeads] = useState<any[]>([])
  const [isParsing, setIsParsing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    async function fetchAssistants() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: userData } = await supabase.from('users').select('agency_id').eq('id', user.id).single()
      if (!userData) return

      const { data } = await supabase.from('assistants').select('id, name').eq('agency_id', userData.agency_id)
      if (data) setAssistants(data)
    }
    fetchAssistants()
  }, [])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    
    setFile(selectedFile)
    setIsParsing(true)

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setIsParsing(false)
        const parsed = results.data as any[]
        // Validate required columns
        const hasPhone = parsed.length > 0 && ('phone' in parsed[0] || 'Phone' in parsed[0] || 'phoneNumber' in parsed[0])
        if (!hasPhone) {
          toast.error('CSV must contain a "phone" column')
          setFile(null)
          setLeads([])
          return
        }

        // Normalize data
        const normalized = parsed.map(row => {
          const phone = row.phone || row.Phone || row.phoneNumber || row['Phone Number'] || ''
          const name = row.name || row.Name || row.fullName || row['Full Name'] || ''
          return {
            phone: phone.replace(/[^0-9+]/g, ''),
            name,
            custom_data: row
          }
        }).filter(r => r.phone.length > 5)

        setLeads(normalized)
        toast.success(`Successfully loaded ${normalized.length} contacts`)
      },
      error: (error) => {
        setIsParsing(false)
        toast.error('Error parsing CSV file')
        console.error(error)
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !assistantId || leads.length === 0) {
      toast.error('Please fill all fields and upload a valid CSV')
      return
    }

    setIsSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: userData } = await supabase.from('users').select('agency_id').eq('id', user?.id).single()
      
      // 1. Create Campaign via API
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          assistant_id: assistantId,
          agency_id: userData?.agency_id
        })
      })

      if (!res.ok) throw new Error('Failed to create campaign')
      const campaign = await res.json()

      // 2. Upload Leads
      const leadsRes = await fetch('/api/campaigns/upload-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: campaign.id,
          agency_id: userData?.agency_id,
          leads
        })
      })

      if (!leadsRes.ok) throw new Error('Failed to upload leads')

      toast.success('Campaign created successfully!')
      router.push(`/dashboard/campaigns/${campaign.id}`)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 fade-in max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard/campaigns"
          className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">New Campaign</h1>
          <p className="text-muted-foreground mt-1">Configure your bulk calling campaign</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-primary" />
              Campaign Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name</Label>
              <Input
                id="name"
                placeholder="e.g. Q3 Lead Reactivation"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assistant">Select AI Assistant</Label>
              <select
                id="assistant"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={assistantId}
                onChange={(e) => setAssistantId(e.target.value)}
                required
              >
                <option value="">-- Choose an assistant --</option>
                {assistants.map((ast) => (
                  <option key={ast.id} value={ast.id}>{ast.name}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Upload Contacts (CSV)
            </CardTitle>
            <CardDescription>
              Your CSV file must contain a "phone" column. Other columns will be saved as custom data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center bg-accent/20 hover:bg-accent/40 hover:border-primary/50 transition-all relative">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isParsing || isSubmitting}
              />
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {file ? file.name : 'Click or drag CSV file here'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isParsing ? 'Parsing...' : leads.length > 0 ? `${leads.length} contacts ready` : 'Supports standard CSV format'}
                  </p>
                </div>
              </div>
            </div>

            {leads.length > 0 && (
              <div className="mt-4 p-4 rounded-lg bg-accent/30 border border-border">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Preview (First 3 contacts)
                </h4>
                <div className="space-y-2">
                  {leads.slice(0, 3).map((lead, i) => (
                    <div key={i} className="flex justify-between text-xs text-muted-foreground p-2 bg-background rounded-md border border-border">
                      <span className="font-mono">{lead.phone}</span>
                      <span>{lead.name || 'No Name'}</span>
                    </div>
                  ))}
                  {leads.length > 3 && (
                    <div className="text-xs text-center text-muted-foreground pt-2">
                      + {leads.length - 3} more contacts
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" onClick={() => router.back()} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="gradient"
            loading={isSubmitting}
            disabled={!name || !assistantId || leads.length === 0}
            className="w-40"
          >
            {isSubmitting ? 'Creating...' : 'Create Campaign'}
          </Button>
        </div>
      </form>
    </div>
  )
}
