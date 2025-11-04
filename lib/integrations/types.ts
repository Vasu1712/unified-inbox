import { Channel } from "@prisma/client";

export interface MessagePayload {
  to: string;
  content: string;
  from?: string;
  mediaUrls?: string[];
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface ChannelSender {
  send(payload: MessagePayload): Promise<SendResult>;
  validateRecipient(recipient: string): boolean;
}

export type ChannelType = Channel;
