'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Sparkles, Save } from 'lucide-react'

interface EditAssistantModalProps {
  isOpen: boolean
  onClose: () => void
  assistant: any
}

export function EditAssistantModal({ isOpen, onClose, assistant }: EditAssistantModalProps) {
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

  useEffect(() => {
    if (assistant && isOpen) {
      setFormData({
        name: assistant.name || '',
        description: assistant.description || '',
        system_prompt: assistant.system_prompt || '',
        first_message: assistant.first_message || '',
        voice_id: assistant.voice_id || 'nova',
        language: assistant.language || 'en',
        sector: assistant.sector || '',
      })
    }
  }, [assistant, isOpen])

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

  const applyTemplate = (template: any) => {
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
      const res = await fetch(`/api/assistants/${assistant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update assistant')
      }

      toast.success('Assistant updated successfully!')
      onClose()
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Assistant" description="Update settings and sync with VAPI">
      <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Agent Name *</Label>
            <Input 
              id="edit-name" name="name" required 
              value={formData.name} onChange={handleChange} 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-language">Primary Language</Label>
              <Select id="edit-language" name="language" value={formData.language} onChange={handleChange}>
                <option value="en">English (US)</option>
                <option value="en-GB">English (UK)</option>
                <option value="tr">Turkish</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-voice_id">AI Voice</Label>
              <Select id="edit-voice_id" name="voice_id" value={formData.voice_id} onChange={handleChange}>
                <option value="nova">Nova (Female, Energetic)</option>
                <option value="alloy">Alloy (Neutral)</option>
                <option value="echo">Echo (Male, Warm)</option>
                <option value="shimmer">Shimmer (Female, Clear)</option>
                <option value="fable">Fable (British Male)</option>
                <option value="onyx">Onyx (Deep Male)</option>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Input 
              id="edit-description" name="description" 
              value={formData.description} onChange={handleChange} 
            />
          </div>

          <div className="bg-accent/30 rounded-lg p-3 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="text-xs font-medium text-foreground">Magic Prompts</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {getMagicTemplates(formData.language).map((t: any, idx: number) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyTemplate(t)}
                  className="text-[10px] px-2 py-1 rounded-full bg-background border border-border hover:border-violet-500 hover:text-violet-400 transition-colors"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-system_prompt">System Prompt *</Label>
            <Textarea 
              id="edit-system_prompt" name="system_prompt" required 
              className="h-32 font-mono text-xs"
              value={formData.system_prompt} onChange={handleChange} 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-first_message">First Message *</Label>
            <Textarea 
              id="edit-first_message" name="first_message" required 
              className="h-16 text-sm"
              value={formData.first_message} onChange={handleChange} 
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="gradient" disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
