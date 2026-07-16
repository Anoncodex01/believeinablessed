/**
 * Snippe.sh Payment Service
 * Mobile money + card payments via https://api.snippe.sh (API version 2026-01-25)
 */
import crypto from 'crypto';

export class SnippeService {
  constructor(config) {
    this.config = config;
  }

  /**
   * Snippe Tanzania phones must be 255XXXXXXXXX (12 digits).
   * Accepts: 0747159984, +255747159984, 255747159984
   */
  static formatPhoneNumber(phone) {
    let cleaned = String(phone || '').replace(/\D/g, '');

    // Drop leading country trunk zero after 255 if present (2550...)
    if (cleaned.startsWith('2550') && cleaned.length === 13) {
      cleaned = '255' + cleaned.substring(4);
    }

    if (cleaned.startsWith('0') && cleaned.length === 10) {
      cleaned = '255' + cleaned.substring(1);
    } else if (cleaned.startsWith('255')) {
      // already international
    } else if (cleaned.length === 9) {
      // 747159984 without leading 0
      cleaned = '255' + cleaned;
    } else if (cleaned) {
      cleaned = '255' + cleaned.replace(/^0+/, '');
    }

    return cleaned;
  }

  /** Always send 255XXXXXXXXX — Snippe rejects local 0XXXXXXXXX for TZ */
  static formatPhoneForPaymentType(phone, _paymentType) {
    return SnippeService.formatPhoneNumber(phone);
  }

  /** Only HTTPS webhook URLs are accepted by Snippe */
  static resolveWebhookUrl(url, { required = false } = {}) {
    if (url && typeof url === 'string') {
      const trimmed = url.trim();
      if (trimmed.toLowerCase().startsWith('https://')) {
        return trimmed;
      }
      if (trimmed) {
        console.warn('⚠️ Ignoring non-HTTPS webhook_url:', trimmed);
      }
    }

    // Mobile money requires webhook_url. Locally use a public HTTPS sink so
    // Snippe accepts the payment; status polling still marks the order paid.
    if (required) {
      const fallback = 'https://postman-echo.com/post';
      console.warn(
        '⚠️ SNIPPE_WEBHOOK_URL missing/non-HTTPS — using temporary HTTPS fallback for mobile money. Set your VPS HTTPS webhook for production.'
      );
      return fallback;
    }

    return undefined;
  }

  static splitName(fullName) {
    const parts = String(fullName || '')
      .trim()
      .split(/\s+/)
      .filter((part) => part.length > 0);

    if (parts.length === 0) {
      return { firstname: 'Customer', lastname: 'Customer' };
    }
    if (parts.length === 1) {
      return { firstname: parts[0], lastname: parts[0] };
    }
    return {
      firstname: parts[0],
      lastname: parts.slice(1).join(' '),
    };
  }

  async createPayment(request) {
    try {
      const url = `${this.config.baseUrl}/v1/payments`;
      const phoneNumber = request.phone_number
        ? SnippeService.formatPhoneForPaymentType(request.phone_number, request.payment_type)
        : undefined;

      const webhookUrl = SnippeService.resolveWebhookUrl(
        request.webhook_url || this.config.webhookUrl,
        { required: request.payment_type === 'mobile' }
      );

      const payload = {
        payment_type: request.payment_type,
        details: {
          amount: Math.round(request.details.amount),
          currency: request.details.currency || 'TZS',
          ...(request.payment_type === 'card'
            ? {
                redirect_url: request.details.redirect_url,
                cancel_url: request.details.cancel_url,
              }
            : {}),
        },
        ...(phoneNumber ? { phone_number: phoneNumber } : {}),
        customer: {
          firstname: request.customer.firstname,
          lastname: request.customer.lastname,
          email: request.customer.email,
          ...(request.payment_type === 'card'
            ? {
                address: request.customer.address || 'Customer Address',
                city: request.customer.city || 'Dar es Salaam',
                state: request.customer.state || 'DSM',
                postcode: request.customer.postcode || '14101',
                country: request.customer.country || 'TZ',
              }
            : {}),
        },
        ...(webhookUrl ? { webhook_url: webhookUrl } : {}),
        metadata: request.metadata || {},
      };

      console.log('📤 Snippe - Creating payment:', {
        payment_type: payload.payment_type,
        amount: payload.details.amount,
        currency: payload.details.currency,
        phone: phoneNumber ? `${phoneNumber.substring(0, 6)}***` : undefined,
        webhook_url: payload.webhook_url,
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': crypto.randomUUID(),
        },
        body: JSON.stringify(payload),
      });

      let data = await response.json();
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch {
          /* keep as-is */
        }
      }

      console.log('📥 Snippe - Payment response:', {
        httpStatus: response.status,
        status: data?.status,
        reference: data?.data?.reference || data?.reference,
      });

      if (!response.ok || data.status === 'error' || data.error) {
        return {
          status: 'error',
          code: response.status,
          message: data.message || data.error || 'Failed to create payment',
        };
      }

      return {
        status: 'success',
        code: response.status,
        data: data.data || data,
      };
    } catch (error) {
      console.error('❌ Snippe - Payment creation failed:', error);
      return {
        status: 'error',
        code: 500,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getPaymentStatus(reference) {
    try {
      const url = `${this.config.baseUrl}/v1/payments/${reference}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      let data = await response.json();
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch {
          /* keep as-is */
        }
      }

      if (!response.ok || data.status === 'error') {
        return {
          status: 'error',
          code: response.status,
          message: data.message || 'Failed to get payment status',
        };
      }

      return {
        status: 'success',
        code: response.status,
        data: data.data || data,
      };
    } catch (error) {
      console.error('❌ Snippe - Status check failed:', error);
      return {
        status: 'error',
        code: 500,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static verifyWebhookSignature(payload, signature, secret, timestamp) {
    try {
      const message = timestamp ? `${timestamp}.${payload}` : payload;
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(message)
        .digest('hex');

      if (!signature || signature.length !== expectedSignature.length) {
        return false;
      }

      return crypto.timingSafeEqual(
        Buffer.from(signature, 'utf8'),
        Buffer.from(expectedSignature, 'utf8')
      );
    } catch (error) {
      console.error('❌ Snippe - Webhook signature verification failed:', error);
      return false;
    }
  }
}

const snippeConfig = {
  apiKey: process.env.SNIPPE_API_KEY || '',
  baseUrl: process.env.SNIPPE_BASE_URL || 'https://api.snippe.sh',
  webhookUrl:
    process.env.SNIPPE_WEBHOOK_URL ||
    `${process.env.BACKEND_URL || 'https://backend-calm-meadowland-7817.fly.dev'}/api/snippe/webhook`,
};

if (!snippeConfig.apiKey) {
  console.warn('⚠️ SNIPPE_API_KEY is not set');
}

export const snippe = new SnippeService(snippeConfig);
export default snippe;
