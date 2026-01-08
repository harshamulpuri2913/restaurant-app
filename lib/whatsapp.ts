/**
 * ============================================================================
 * WHATSAPP INTEGRATION
 * ============================================================================
 * WhatsApp messaging functionality for order notifications.
 * 
 * Supports multiple integration methods:
 * 1. Twilio WhatsApp API (recommended for production)
 * 2. WhatsApp Business API (Meta/Facebook)
 * 3. Development fallback (console logging)
 * 
 * Features:
 * - Send order notifications to admins
 * - Format order details in WhatsApp-friendly markdown
 * - Phone number formatting for US numbers
 * - Error handling with graceful fallbacks
 * 
 * Environment Variables:
 * For Twilio:
 *   - TWILIO_ACCOUNT_SID: Twilio account SID
 *   - TWILIO_AUTH_TOKEN: Twilio auth token
 *   - TWILIO_WHATSAPP_NUMBER: Your Twilio WhatsApp number
 * 
 * For WhatsApp Business API:
 *   - WHATSAPP_API_KEY: Meta API access token
 *   - WHATSAPP_PHONE_NUMBER_ID: Your WhatsApp phone number ID
 * 
 * Optional:
 *   - WHATSAPP_ADMIN_NUMBER: Admin phone number for notifications
 * 
 * @see https://www.twilio.com/docs/whatsapp
 * @see https://developers.facebook.com/docs/whatsapp/cloud-api
 */

// =============================================================================
// MESSAGE SENDING
// =============================================================================

/**
 * Send a WhatsApp message to a phone number
 * 
 * Automatically selects the appropriate integration based on
 * configured environment variables. Falls back to console logging
 * in development if no integration is configured.
 * 
 * @param phoneNumber - Recipient phone number (with or without country code)
 * @param message - Message content (supports WhatsApp markdown)
 * @returns Object with success status and optional error/mode info
 * 
 * @example
 * const result = await sendWhatsAppMessage(
 *   '2095978565',
 *   'Your order has been confirmed!'
 * )
 * 
 * if (result.success) {
 *   console.log('Message sent via:', result.mode || 'production')
 * }
 */
export async function sendWhatsAppMessage(
  phoneNumber: string,
  message: string
): Promise<{ success: boolean; error?: string; mode?: string }> {
  // Default admin number for order notifications
  const adminNumber = process.env.WHATSAPP_ADMIN_NUMBER || '2095978565'
  
  /**
   * Format phone number to E.164 format
   * Assumes US numbers if no country code provided
   */
  const formattedNumber = phoneNumber.startsWith('+') 
    ? phoneNumber 
    : `+1${phoneNumber.replace(/\D/g, '')}`

  try {
    // -------------------------------------------------------------------------
    // OPTION 1: TWILIO WHATSAPP API
    // -------------------------------------------------------------------------
    
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      try {
        /**
         * Initialize Twilio client with credentials
         * Dynamically require to avoid loading if not used
         */
        const twilio = require('twilio')(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        )

        await twilio.messages.create({
          from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
          to: `whatsapp:${formattedNumber}`,
          body: message,
        })

        return { success: true }
      } catch (twilioError) {
        // Log error only in development mode
        throw twilioError
      }
    }
    
    // -------------------------------------------------------------------------
    // OPTION 2: WHATSAPP BUSINESS API (META)
    // -------------------------------------------------------------------------
    
    else if (process.env.WHATSAPP_API_KEY) {
      /**
       * Send message using WhatsApp Cloud API
       * Requires phone number ID from Meta Business Suite
       */
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.WHATSAPP_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: formattedNumber,
            type: 'text',
            text: { body: message },
          }),
        }
      )

      if (!response.ok) {
        // Log error only in development mode
        throw new Error('WhatsApp API error')
      }

      return { success: true }
    }
    
    // -------------------------------------------------------------------------
    // OPTION 3: DEVELOPMENT FALLBACK
    // -------------------------------------------------------------------------
    
    else {
      /**
       * No WhatsApp integration configured
       * Development mode fallback (no logging in production)
       */
      return { success: true, mode: 'development' }
    }
  } catch (error) {
    // Log error only in development mode
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// =============================================================================
// MESSAGE FORMATTING
// =============================================================================

/**
 * Format order data into WhatsApp message
 * 
 * Creates a nicely formatted message with order details
 * using WhatsApp's markdown-style formatting:
 * - *bold* for headings
 * - • bullet points for items
 * - Emojis for visual appeal
 * 
 * @param order - Order object with items and totals
 * @param customerInfo - Customer contact information
 * @returns Formatted message string
 * 
 * @example
 * const message = formatOrderMessage(order, {
 *   name: 'John Doe',
 *   phone: '5551234567',
 *   email: 'john@example.com'
 * })
 * 
 * await sendWhatsAppMessage(adminNumber, message)
 */
export function formatOrderMessage(
  order: any,
  customerInfo: any
): string {
  /**
   * Format order items as bullet list
   * Shows: Product name - Qty: X x $Y = $Z
   */
  const items = order.items.map((item: any) => 
    `• ${item.product.name} - Qty: ${item.quantity} x $${item.price} = $${item.subtotal}`
  ).join('\n')

  /**
   * Compose full message with sections:
   * 1. Header with emoji
   * 2. Order ID
   * 3. Customer details
   * 4. Items list
   * 5. Total and date
   * 6. Call to action
   */
  return (
    `🛒 *New Order Received*\n\n` +
    `*Order ID:* ${order.id}\n` +
    `*Customer:* ${customerInfo.name || 'N/A'}\n` +
    `*Phone:* ${customerInfo.phone || 'N/A'}\n` +
    `*Email:* ${customerInfo.email || 'N/A'}\n\n` +
    `*Items:*\n${items}\n\n` +
    `*Total Amount:* $${order.totalAmount.toFixed(2)}\n` +
    `*Order Date:* ${new Date(order.createdAt).toLocaleString()}\n\n` +
    `Please confirm this order.`
  )
}
