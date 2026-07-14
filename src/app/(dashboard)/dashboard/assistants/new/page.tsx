'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { ArrowLeft, Bot, Sparkles, Save, Cpu } from 'lucide-react'

export default function NewAssistantPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    system_prompt: '',
    first_message: '',
    voice_id: 'nova',
    language: 'en',
    sector: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const magicTemplates = [
    {
      label: 'Real Estate',
      prompt: 'You are Sarah, an AI receptionist for Vox Real Estate. Your goal is to qualify buyers and book property viewings. Be polite, energetic, and concise. Always ask for their budget and preferred location.',
      first_message: 'Hi, this is Sarah from Vox Real Estate! Are you looking to buy or sell a property today?'
    },
    {
      label: 'Dental Clinic',
      prompt: "You are a virtual assistant for a Dental Clinic. Your goal is to book dental checkups and answer basic questions about opening hours. Be empathetic and professional. Collect the patient's name and preferred date.",
      first_message: "Hello, you've reached the Dental Clinic. I can help you book an appointment or answer questions. How can I assist you today?"
    },
    {
      label: 'Customer Support',
      prompt: 'You are Alex, customer support for our E-commerce store. Your goal is to help customers with order tracking and returns. Be helpful and patient. Ask for their order number to assist them.',
      first_message: "Welcome to support. I'm Alex. To get started, could you please provide your order number?"
    }
  ]

  const applyTemplate = (template: typeof magicTemplates[0]) => {
    setFormData(prev => ({
      ...prev,
      system_prompt: template.prompt,
      first_message: template.first_message
    }))
    toast.success(`${template.label} template applied!`)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/assistants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create assistant')
      }

      toast.success('Assistant created successfully!')
      router.push('/dashboard/assistants')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 fade-in">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/assistants"
          className="inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium transition-all duration-200 h-10 w-10 text-sm hover:bg-accent hover:text-accent-foreground text-muted-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            Create Assistant
            <Sparkles className="w-6 h-6 text-violet-400" />
          </h1>
          <p className="text-muted-foreground mt-1">Configure a new AI voice agent for your clients</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Config */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-primary" />
                  General Profile
                </CardTitle>
                <CardDescription>Basic information about this AI agent.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Agent Name *</Label>
                  <Input 
                    id="name" name="name" required 
                    placeholder="e.g. Sarah - Real Estate Booking"
                    value={formData.name} onChange={handleChange} 
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sector">Industry/Sector</Label>
                    <Input 
                      id="sector" name="sector" 
                      placeholder="e.g. Real Estate, Dental"
                      value={formData.sector} onChange={handleChange} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Primary Language</Label>
                    <Select id="language" name="language" value={formData.language} onChange={handleChange}>
                      <option value="en">English (US)</option>
                      <option value="en-GB">English (UK)</option>
                      <option value="tr">Turkish</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Internal Description</Label>
                  <Input 
                    id="description" name="description" 
                    placeholder="Short description for your team"
                    value={formData.description} onChange={handleChange} 
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-blue-400" />
                    AI Behavior & Prompting
                  </div>
                </CardTitle>
                <CardDescription>Instruct the AI on how to behave during calls.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Magic Prompt Buttons */}
                <div className="bg-accent/30 rounded-lg p-3 border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    <span className="text-xs font-medium text-foreground">Magic Prompts</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {magicTemplates.map((t, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => applyTemplate(t)}
                        className="text-xs px-3 py-1.5 rounded-full bg-background border border-border hover:border-violet-500 hover:text-violet-400 transition-colors"
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="system_prompt">System Prompt *</Label>
                  <Textarea 
                    id="system_prompt" name="system_prompt" required 
                    className="h-48 font-mono text-xs"
                    placeholder="You are Sarah, an AI receptionist for... Your goal is to book appointments..."
                    value={formData.system_prompt} onChange={handleChange} 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="first_message">First Message *</Label>
                  <Textarea 
                    id="first_message" name="first_message" required 
                    className="h-24"
                    placeholder="Hi, this is Sarah from Vox Real Estate. How can I help you today?"
                    value={formData.first_message} onChange={handleChange} 
                  />
                  <p className="text-xs text-muted-foreground">What the AI says immediately when the call connects.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Config */}
          <div className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Voice Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="voice_id">AI Voice</Label>
                  <Select id="voice_id" name="voice_id" value={formData.voice_id} onChange={handleChange}>
                    <option value="nova">Nova (Female, Energetic)</option>
                    <option value="alloy">Alloy (Neutral)</option>
                    <option value="echo">Echo (Male, Warm)</option>
                    <option value="shimmer">Shimmer (Female, Clear)</option>
                    <option value="fable">Fable (British Male)</option>
                    <option value="onyx">Onyx (Deep Male)</option>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Button type="submit" variant="gradient" className="w-full h-12 text-base" loading={loading}>
              <Save className="w-4 h-4 mr-2" />
              Save & Sync with VAPI
            </Button>
            
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex gap-3">
              <div className="text-blue-400 mt-0.5">ℹ️</div>
              <p className="text-xs text-blue-200 leading-relaxed">
                Saving this assistant will automatically create it in your VAPI account. Ensure your API keys are configured in Settings.
              </p>
            </div>
          </div>

        </div>
      </form>
    </div>
  )
}
