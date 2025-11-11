// SMS Service for Splitsy
// This is a mock implementation that can be replaced with real SMS providers like Twilio

interface SMSMessage {
  to: string;
  message: string;
  from?: string;
}

interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

class SMSService {
  private apiKey: string;
  private fromNumber: string;

  constructor() {
    this.apiKey = process.env.SMS_API_KEY || "mock-api-key";
    this.fromNumber = process.env.SMS_FROM_NUMBER || "+1234567890";
  }

  async sendMessage({
    to,
    message,
    from = this.fromNumber,
  }: SMSMessage): Promise<SMSResponse> {
    try {
      // In development, just log the message
      if (process.env.NODE_ENV === "development") {
        console.log("📱 SMS Message (Mock):");
        console.log(`To: ${to}`);
        console.log(`From: ${from}`);
        console.log(`Message: ${message}`);
        console.log("---");

        return {
          success: true,
          messageId: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };
      }

      // In production, integrate with real SMS provider
      // Example with Twilio:
      /*
      const client = require('twilio')(this.apiKey, process.env.SMS_AUTH_TOKEN);
      
      const result = await client.messages.create({
        body: message,
        from: from,
        to: to
      });

      return {
        success: true,
        messageId: result.sid
      };
      */

      // For now, return mock success
      return {
        success: true,
        messageId: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };
    } catch (error) {
      console.error("SMS sending failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async sendPaymentLink(
    phoneNumber: string,
    participantName: string,
    splitDescription: string,
    paymentLink: string,
    amount: number
  ): Promise<SMSResponse> {
    const message = `Hi ${participantName}! You're invited to split "${splitDescription}". Your share: $${(amount / 100).toFixed(2)}. Pay here: ${paymentLink}`;

    return this.sendMessage({
      to: phoneNumber,
      message,
    });
  }

  async sendPaymentReminder(
    phoneNumber: string,
    participantName: string,
    splitDescription: string,
    paymentLink: string,
    amount: number
  ): Promise<SMSResponse> {
    const message = `Reminder: You still owe $${(amount / 100).toFixed(2)} for "${splitDescription}". Pay here: ${paymentLink}`;

    return this.sendMessage({
      to: phoneNumber,
      message,
    });
  }

  async sendPaymentConfirmation(
    phoneNumber: string,
    participantName: string,
    splitDescription: string,
    amount: number
  ): Promise<SMSResponse> {
    const message = `Payment confirmed! You've paid $${(amount / 100).toFixed(2)} for "${splitDescription}". Thank you!`;

    return this.sendMessage({
      to: phoneNumber,
      message,
    });
  }
}

export const smsService = new SMSService();
export type { SMSMessage, SMSResponse };
