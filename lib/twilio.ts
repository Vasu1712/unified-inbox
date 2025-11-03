// lib/twilio.ts
import twilio from 'twilio';

if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
  throw new Error('Missing Twilio credentials in environment variables');
}

export const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER!;
export const TWILIO_WHATSAPP = process.env.TWILIO_WHATSAPP_NUMBER!;
