/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/integrations/twilio-sender.ts
import { twilioClient, TWILIO_PHONE, TWILIO_WHATSAPP } from "../twilio";
import { ChannelSender, MessagePayload, SendResult } from "./types";

export class TwilioSMSSender implements ChannelSender {
  async send(payload: MessagePayload): Promise<SendResult> {
    try {
      const message = await twilioClient.messages.create({
        body: payload.content,
        from: payload.from || TWILIO_PHONE,
        to: payload.to,
        mediaUrl: payload.mediaUrls,
      });

      return {
        success: true,
        messageId: message.sid,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  validateRecipient(recipient: string): boolean {
    // Basic phone number validation
    return /^\+[1-9]\d{1,14}$/.test(recipient);
  }
}

export class TwilioWhatsAppSender implements ChannelSender {
  async send(payload: MessagePayload): Promise<SendResult> {
    try {
      const message = await twilioClient.messages.create({
        body: payload.content,
        from: payload.from || TWILIO_WHATSAPP,
        to: `whatsapp:${payload.to}`,
        mediaUrl: payload.mediaUrls,
      });

      return {
        success: true,
        messageId: message.sid,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  validateRecipient(recipient: string): boolean {
    return /^\+[1-9]\d{1,14}$/.test(recipient);
  }
}
