'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { ArrowLeft, Bot, Sparkles, Save, Cpu, RefreshCw } from 'lucide-react'

export default function NewAssistantPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [knowledgeBases, setKnowledgeBases] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    system_prompt: '',
    first_message: '',
    voice_id: 'nova',
    language: 'en',
    sector: '',
    knowledge_base_id: '',
  })

  const fetchKnowledgeBases = async () => {
    setRefreshing(true)
    try {
      const res = await fetch('/api/knowledge')
      if (res.ok) {
        const data = await res.json()
        setKnowledgeBases(data || [])
      }
    } catch (err) {
      console.error('Failed to fetch knowledge bases:', err)
    } finally {
      setTimeout(() => setRefreshing(false), 500)
    }
  }

  useEffect(() => {
    fetchKnowledgeBases()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const getMagicTemplates = (lang: string) => {
    const templates = {
      en: [
        { label: 'Real Estate', prompt: 'You are Sarah, an AI receptionist for Vox Real Estate. Your goal is to qualify buyers and book property viewings. Be polite, energetic, and concise. Always ask for their budget and preferred location.', first_message: 'Hi, this is Sarah from Vox Real Estate! Are you looking to buy or sell a property today?' },
        { label: 'Dental Clinic', prompt: "You are a virtual assistant for a Dental Clinic. Your goal is to book dental checkups and answer basic questions about opening hours. Be empathetic and professional. Collect the patient's name and preferred date.", first_message: "Hello, you've reached the Dental Clinic. I can help you book an appointment or answer questions. How can I assist you today?" },
        { label: 'Customer Support', prompt: 'You are Alex, customer support for our E-commerce store. Your goal is to help customers with order tracking and returns. Be helpful and patient. Ask for their order number to assist them.', first_message: "Welcome to support. I'm Alex. To get started, could you please provide your order number?" }
      ],
      tr: [
        { label: 'Emlak Danışmanı', prompt: 'Sen Vox Emlak için çalışan yapay zeka asistanı Sarah\'sın. Amacın alıcıları nitelendirmek ve konut gösterimleri için randevu ayarlamak. Kibar, enerjik ve net ol. Her zaman bütçelerini ve tercih ettikleri konumu sor.', first_message: 'Merhaba, ben Vox Emlak\'tan Sarah! Bugün bir mülk almak mı yoksa satmak mı istiyorsunuz?' },
        { label: 'Diş Kliniği', prompt: 'Sen bir Diş Kliniği için sanal asistansın. Amacın diş kontrol randevuları oluşturmak ve çalışma saatleri hakkında temel soruları yanıtlamak. Empatik ve profesyonel ol. Hastanın adını ve tercih ettiği tarihi al.', first_message: 'Merhaba, Diş Kliniğine ulaştınız. Randevu almanıza veya sorularınızı yanıtlamaya yardımcı olabilirim. Size bugün nasıl yardımcı olabilirim?' },
        { label: 'Müşteri Desteği', prompt: 'Sen e-ticaret mağazamızın müşteri desteği Alex\'sin. Amacın müşterilere sipariş takibi ve iadeler konusunda yardımcı olmak. Yardımsever ve sabırlı ol. Onlara yardımcı olmak için sipariş numaralarını iste.', first_message: 'Destek hattımıza hoş geldiniz. Ben Alex. Başlamak için lütfen sipariş numaranızı verebilir misiniz?' }
      ],
      es: [
        { label: 'Bienes Raíces', prompt: 'Eres Sarah, recepcionista de IA de Vox Bienes Raíces. Tu objetivo es calificar compradores y programar visitas. Sé educada, enérgica y concisa. Siempre pregunta su presupuesto y ubicación preferida.', first_message: '¡Hola, soy Sarah de Vox Bienes Raíces! ¿Estás buscando comprar o vender una propiedad hoy?' },
        { label: 'Clínica Dental', prompt: 'Eres asistente virtual de una Clínica Dental. Tu objetivo es programar chequeos dentales y responder preguntas básicas sobre el horario. Sé empática y profesional. Obtén el nombre del paciente y la fecha preferida.', first_message: 'Hola, te has comunicado con la Clínica Dental. Puedo ayudarte a programar una cita o responder preguntas. ¿En qué puedo ayudarte hoy?' },
        { label: 'Atención al Cliente', prompt: 'Eres Alex, atención al cliente de nuestra tienda de comercio electrónico. Tu objetivo es ayudar a los clientes con el seguimiento de pedidos y devoluciones. Sé útil y paciente. Pide su número de pedido para ayudarles.', first_message: 'Bienvenido a soporte. Soy Alex. Para comenzar, ¿podrías proporcionar tu número de pedido?' }
      ],
      fr: [
        { label: 'Immobilier', prompt: 'Vous êtes Sarah, réceptionniste IA pour Vox Immobilier. Votre objectif est de qualifier les acheteurs et de réserver des visites. Soyez polie, énergique et concise. Demandez toujours leur budget et emplacement préféré.', first_message: 'Bonjour, ici Sarah de Vox Immobilier ! Cherchez-vous à acheter ou vendre une propriété aujourd\'hui ?' },
        { label: 'Clinique Dentaire', prompt: 'Vous êtes une assistante virtuelle pour une clinique dentaire. Votre objectif est de réserver des examens et répondre aux questions de base. Soyez empathique et professionnelle. Demandez le nom du patient et la date souhaitée.', first_message: 'Bonjour, vous avez joint la clinique dentaire. Je peux vous aider à prendre rendez-vous ou répondre à vos questions. Comment puis-je vous aider aujourd\'hui ?' },
        { label: 'Support Client', prompt: 'Vous êtes Alex, support client pour notre boutique e-commerce. Votre objectif est d\'aider avec le suivi des commandes et retours. Soyez utile et patient. Demandez le numéro de commande.', first_message: 'Bienvenue au support. Je suis Alex. Pour commencer, pourriez-vous fournir votre numéro de commande ?' }
      ],
      de: [
        { label: 'Immobilien', prompt: 'Du bist Sarah, KI-Empfangsdame für Vox Immobilien. Dein Ziel ist es, Käufer zu qualifizieren und Besichtigungen zu buchen. Sei höflich, energisch und prägnant. Frage nach dem Budget und dem bevorzugten Ort.', first_message: 'Hallo, hier ist Sarah von Vox Immobilien! Möchten Sie heute eine Immobilie kaufen oder verkaufen?' },
        { label: 'Zahnklinik', prompt: 'Du bist eine virtuelle Assistentin für eine Zahnklinik. Dein Ziel ist es, Termine zu buchen und Fragen zu Öffnungszeiten zu beantworten. Sei einfühlsam und professionell. Frage nach dem Namen und dem Wunschdatum.', first_message: 'Hallo, Sie haben die Zahnklinik erreicht. Ich kann helfen, einen Termin zu vereinbaren. Wie kann ich Ihnen heute helfen?' },
        { label: 'Kundensupport', prompt: 'Du bist Alex, Kundensupport für unseren E-Commerce-Shop. Dein Ziel ist es, Kunden bei Bestellverfolgung und Retouren zu helfen. Bitte um die Bestellnummer, um zu helfen.', first_message: 'Willkommen beim Support. Ich bin Alex. Um zu beginnen, könnten Sie bitte Ihre Bestellnummer angeben?' }
      ]
    };
    const baseLang = lang === 'en-GB' ? 'en' : lang;
    return templates[baseLang as keyof typeof templates] || templates['en'];
  };

  const magicTemplates = getMagicTemplates(formData.language);

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

            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span>Knowledge Base (RAG)</span>
                  <button 
                    type="button"
                    onClick={fetchKnowledgeBases}
                    disabled={refreshing}
                    className="text-xs text-primary hover:text-primary/80 transition-colors font-medium flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh List
                  </button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="knowledge_base_id">Connect Knowledge Base</Label>
                  <Select 
                    id="knowledge_base_id" 
                    name="knowledge_base_id" 
                    value={formData.knowledge_base_id} 
                    onChange={handleChange}
                  >
                    <option value="">None (No RAG)</option>
                    {knowledgeBases.map((kb) => (
                      <option key={kb.id} value={kb.id}>
                        {kb.name}
                      </option>
                    ))}
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Connect a document corpus so the AI agent can query it during phone calls.
                  </p>
                  <div className="pt-1">
                    <Link 
                      href="/dashboard/knowledge" 
                      target="_blank"
                      className="text-xs text-primary hover:underline font-semibold"
                    >
                      + Create New Knowledge Base ↗
                    </Link>
                  </div>
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
