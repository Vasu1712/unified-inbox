// lib/integrations/index.ts
import { Channel } from "@prisma/client";
import { ChannelSender } from "./types";
import { TwilioSMSSender, TwilioWhatsAppSender } from "./twilio-sender";

export function createSender(channel: Channel): ChannelSender {
  switch (channel) {
    case "SMS":
      return new TwilioSMSSender();
    case "WHATSAPP":
      return new TwilioWhatsAppSender();
    default:
      throw new Error(`Unsupported channel: ${channel}`);
  }
}

export * from "./types";
