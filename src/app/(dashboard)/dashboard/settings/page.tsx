'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Settings2, Building, Key, Palette, Save } from 'lucide-react'

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    logo_url: '',
    brand_color: '#6366f1',
    custom_domain: '',
    vapi_api_key: '',
  })

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/settings')
        if (res.ok) {
          const data = await res.json()
          setFormData({
            name: data.name || '',
            logo_url: data.logo_url || '',
            brand_color: data.brand_color || '#6366f1',
            custom_domain: data.custom_domain || '',
            vapi_api_key: data.has_vapi_key ? '••••••••••••••••' : '', // Obfuscate
          })
        }
      } catch (error) {
        console.error('Failed to fetch settings', error)
      } finally {
        setFetching(false)
      }
    }
    fetchSettings()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Don't send obfuscated key
      const payload = { ...formData }
      if (payload.vapi_api_key === '••••••••••••••••') {
        delete (payload as any).vapi_api_key
      }

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update settings')

      toast.success('Settings updated successfully!')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading settings...</div>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          Agency Settings
          <Settings2 className="w-6 h-6 text-muted-foreground" />
        </h1>
        <p className="text-muted-foreground mt-1">Manage your white-label branding and integrations</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Branding */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              White-label Branding
            </CardTitle>
            <CardDescription>Customize the dashboard for your sub-clients.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Agency Name *</Label>
                <Input 
                  id="name" name="name" required 
                  value={formData.name} onChange={handleChange} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom_domain">Custom Domain</Label>
                <Input 
                  id="custom_domain" name="custom_domain" 
                  placeholder="e.g. app.youragency.com"
                  value={formData.custom_domain} onChange={handleChange} 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="logo_url">Logo URL</Label>
                <Input 
                  id="logo_url" name="logo_url" 
                  placeholder="https://..."
                  value={formData.logo_url} onChange={handleChange} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand_color">Brand Color (Hex)</Label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    id="brand_color_picker" 
                    name="brand_color" 
                    className="w-12 h-10 rounded-lg border border-border bg-transparent p-0 cursor-pointer overflow-hidden [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none focus:outline-none focus:ring-2 focus:ring-ring"
                    value={formData.brand_color} onChange={handleChange} 
                  />
                  <Input 
                    id="brand_color" name="brand_color" 
                    value={formData.brand_color} onChange={handleChange} 
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Integrations */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-500" />
              API Integrations
            </CardTitle>
            <CardDescription>Connect external services to power your AI voice agents.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vapi_api_key">VAPI Private Key (Required for Calls)</Label>
              <Input 
                id="vapi_api_key" name="vapi_api_key" type="password"
                placeholder="sk-..."
                value={formData.vapi_api_key} onChange={handleChange} 
              />
              <p className="text-xs text-muted-foreground mt-1">
                Your keys are securely encrypted using AES-256-GCM before being stored in the database.
              </p>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" variant="gradient" className="w-full h-12 text-base" loading={loading}>
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </form>
    </div>
  )
}
