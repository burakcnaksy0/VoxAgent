/**
 * VAPI.ai API wrapper
 * Handles assistant management, call initiation, and phone number operations
 */

const VAPI_BASE_URL = 'https://api.vapi.ai'

interface VapiRequestOptions {
  apiKey: string
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  path: string
  body?: Record<string, unknown>
}

async function vapiRequest<T>({ apiKey, method = 'GET', path, body }: VapiRequestOptions): Promise<T> {
  const response = await fetch(`${VAPI_BASE_URL}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }))
    throw new Error(`VAPI API Error ${response.status}: ${error.message || JSON.stringify(error)}`)
  }

  if (response.status === 204) return {} as T
  return response.json()
}

// ==================== ASSISTANTS ====================

export interface VapiAssistantConfig {
  name: string
  systemPrompt: string
  firstMessage?: string
  endCallMessage?: string
  voiceId?: string
  language?: string
  serverUrl?: string
  hasKnowledgeBase?: boolean
}

export async function createVapiAssistant(apiKey: string, config: VapiAssistantConfig) {
  return vapiRequest({
    apiKey,
    method: 'POST',
    path: '/assistant',
    body: {
      name: config.name,
      model: {
        provider: 'openai',
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: config.systemPrompt,
          },
        ],
      },
      voice: {
        provider: 'openai',
        voiceId: config.voiceId || 'nova',
      },
      firstMessage: config.firstMessage,
      endCallMessage: config.endCallMessage || 'Thank you, goodbye!',
      transcriber: {
        provider: 'deepgram',
        language: config.language || 'en',
      },
      serverUrl: config.serverUrl,
      tools: config.hasKnowledgeBase
        ? [
            {
              type: 'function',
              name: 'search_knowledge_base',
              description: 'Searches the agency knowledge base for answers to user questions.',
              parameters: {
                type: 'object',
                properties: {
                  query: {
                    type: 'string',
                    description: 'The search query to match against the knowledge base documents.'
                  }
                },
                required: ['query']
              }
            }
          ]
        : [],
    },
  })
}

export async function updateVapiAssistant(
  apiKey: string,
  assistantId: string,
  config: Partial<VapiAssistantConfig>
) {
  const body: Record<string, unknown> = {}

  if (config.name) body.name = config.name
  if (config.systemPrompt) {
    body.model = {
      provider: 'openai',
      model: 'gpt-4o',
      messages: [{ role: 'system', content: config.systemPrompt }],
    }
  }
  if (config.voiceId) {
    body.voice = { provider: 'openai', voiceId: config.voiceId }
  }
  if (config.firstMessage !== undefined) body.firstMessage = config.firstMessage
  if (config.endCallMessage !== undefined) body.endCallMessage = config.endCallMessage
  if (config.serverUrl !== undefined) body.serverUrl = config.serverUrl
  if (config.hasKnowledgeBase !== undefined) {
    body.tools = config.hasKnowledgeBase
      ? [
          {
            type: 'function',
            name: 'search_knowledge_base',
            description: 'Searches the agency knowledge base for answers to user questions.',
            parameters: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'The search query to match against the knowledge base documents.'
                }
              },
              required: ['query']
            }
          }
        ]
      : []
  }

  return vapiRequest({
    apiKey,
    method: 'PATCH',
    path: `/assistant/${assistantId}`,
    body,
  })
}

export async function deleteVapiAssistant(apiKey: string, assistantId: string) {
  return vapiRequest({
    apiKey,
    method: 'DELETE',
    path: `/assistant/${assistantId}`,
  })
}

export async function listVapiAssistants(apiKey: string) {
  return vapiRequest({
    apiKey,
    path: '/assistant',
  })
}

// ==================== CALLS ====================

export interface VapiOutboundCallConfig {
  assistantId: string
  phoneNumberId?: string
  customer: {
    number: string
    name?: string
  }
  assistantOverrides?: {
    firstMessage?: string
    variableValues?: Record<string, string>
  }
}

export async function startVapiOutboundCall(apiKey: string, config: VapiOutboundCallConfig) {
  return vapiRequest({
    apiKey,
    method: 'POST',
    path: '/call/phone',
    body: {
      assistantId: config.assistantId,
      phoneNumberId: config.phoneNumberId,
      customer: config.customer,
      assistantOverrides: config.assistantOverrides,
    },
  })
}

export async function getVapiCall(apiKey: string, callId: string) {
  return vapiRequest({
    apiKey,
    path: `/call/${callId}`,
  })
}

export async function listVapiCalls(apiKey: string, params?: { limit?: number; createdAtGt?: string }) {
  const query = new URLSearchParams()
  if (params?.limit) query.set('limit', String(params.limit))
  if (params?.createdAtGt) query.set('createdAtGt', params.createdAtGt)

  return vapiRequest({
    apiKey,
    path: `/call?${query.toString()}`,
  })
}

// ==================== PHONE NUMBERS ====================

export async function listVapiPhoneNumbers(apiKey: string) {
  return vapiRequest({
    apiKey,
    path: '/phone-number',
  })
}

// ==================== WEBHOOK EVENT TYPES ====================

export type VapiEventType =
  | 'call-started'
  | 'call-ended'
  | 'transcript'
  | 'hang'
  | 'speech-update'
  | 'status-update'
  | 'function-call'
  | 'end-of-call-report'

export interface VapiWebhookEvent {
  message: {
    type: VapiEventType
    call: {
      id: string
      assistantId: string
      status: string
      direction: string
      customer?: { number: string }
      phoneNumber?: { number: string }
    }
    transcript?: string
    role?: string
    endedReason?: string
    summary?: string
    durationSeconds?: number
    cost?: number
  }
}
