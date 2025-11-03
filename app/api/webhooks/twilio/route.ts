// app/api/webhooks/twilio/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import twilio from "twilio";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    // Extract Twilio parameters
    const messageSid = formData.get("MessageSid") as string;
    const from = formData.get("From") as string;
    const to = formData.get("To") as string;
    const body = formData.get("Body") as string;
    const numMedia = parseInt(formData.get("NumMedia") as string) || 0;

    // Validate webhook (optional but recommended)
    const twilioSignature = req.headers.get("x-twilio-signature");
    if (twilioSignature) {
      const url = req.url;
      const params: Record<string, string> = {};
      formData.forEach((value, key) => {
        params[key] = value as string;
      });

      const isValid = twilio.validateRequest(
        process.env.TWILIO_AUTH_TOKEN!,
        twilioSignature,
        url,
        params
      );

      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 403 }
        );
      }
    }

    // Determine channel
    const channel = from.startsWith("whatsapp:") ? "WHATSAPP" : "SMS";
    const cleanFrom = from.replace("whatsapp:", "");

    // Handle media attachments
    const mediaUrls: string[] = [];
    for (let i = 0; i < numMedia; i++) {
      const mediaUrl = formData.get(`MediaUrl${i}`) as string;
      if (mediaUrl) mediaUrls.push(mediaUrl);
    }

    // Find or create contact
    let contact = await prisma.contact.findFirst({
      where: { phone: cleanFrom },
    });

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          phone: cleanFrom,
          name: cleanFrom, // Will be updated later
          createdById: "system", // You may want to handle this differently
        },
      });
    }

    // Get or create conversation
    let conversation = await prisma.conversation.findFirst({
      where: { contactId: contact.id },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          contactId: contact.id,
          status: "UNREAD",
          lastMessageAt: new Date(),
        },
      });
    }

    // Save message
    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        contactId: contact.id,
        content: body,
        channel,
        direction: "INBOUND",
        status: "DELIVERED",
        twilioSid: messageSid,
        attachments: mediaUrls.length > 0 ? { urls: mediaUrls } : null,
      },
    });

    // Update conversation
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        status: "UNREAD",
      },
    });

    // Log analytics
    await prisma.analytics.create({
      data: {
        contactId: contact.id,
        conversationId: conversation.id,
        channel,
        eventType: "message_received",
        timestamp: new Date(),
      },
    });

    // Return TwiML response
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
      {
        status: 200,
        headers: { "Content-Type": "text/xml" },
      }
    );
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
      {
        status: 200,
        headers: { "Content-Type": "text/xml" },
      }
    );
  }
}