import twilio from 'twilio'

let _twilioClient: ReturnType<typeof twilio> | null = null

function getTwilioClient() {
  if (!_twilioClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID || 'AC_dummy_account_sid'
    const authToken = process.env.TWILIO_AUTH_TOKEN || 'dummy_token'
    _twilioClient = twilio(accountSid, authToken)
  }
  return _twilioClient
}

interface SendFallbackMessageOptions {
  to: string
  channel: 'sms' | 'whatsapp'
  agencyName: string
  callerName?: string
  bookingUrl?: string
  customMessage?: string
}

/**
 * Send SMS or WhatsApp fallback message when a call goes unanswered
 */
export async function sendFallbackMessage({
  to,
  channel,
  agencyName,
  callerName,
  bookingUrl,
  customMessage,
}: SendFallbackMessageOptions): Promise<string> {
  const defaultMessage = customMessage || 
    `Hi${callerName ? ` ${callerName}` : ''}! We tried to reach you from ${agencyName}. ` +
    `Please book a convenient time here: ${bookingUrl || 'Reply to this message and we\'ll get back to you.'}`

  const from = channel === 'whatsapp'
    ? process.env.TWILIO_WHATSAPP_FROM!
    : process.env.TWILIO_SMS_FROM!

  const toNumber = channel === 'whatsapp' ? `whatsapp:${to}` : to

  const message = await getTwilioClient().messages.create({
    from,
    to: toNumber,
    body: defaultMessage,
  })

  return message.sid
}

/**
 * Send a custom outbound SMS
 */
export async function sendSMS(to: string, body: string): Promise<string> {
  const message = await getTwilioClient().messages.create({
    from: process.env.TWILIO_SMS_FROM!,
    to,
    body,
  })
  return message.sid
}

/**
 * Validate a Twilio webhook signature
 */
export function validateTwilioSignature(
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  return twilio.validateRequest(process.env.TWILIO_AUTH_TOKEN || 'dummy_token', signature, url, params)
}
