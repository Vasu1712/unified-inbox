// app/api/messages/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSender } from "@/lib/integrations";
import { auth } from "@/lib/auth";
import { Channel } from "@prisma/client";

const sendMessageSchema = z.object({
  contactId: z.string(),
  content: z.string().min(1),
  channel: z.enum(["SMS", "WHATSAPP", "EMAIL", "TWITTER", "FACEBOOK"]),
  mediaUrls: z.array(z.string().url()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Get session
    const session = await auth.api.getSession({ headers: req.headers });
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = sendMessageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { contactId, content, channel, mediaUrls } = validation.data;

    // Get contact
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Determine recipient based on channel
    let recipient: string;
    if (channel === "SMS" || channel === "WHATSAPP") {
      if (!contact.phone) {
        return NextResponse.json(
          { error: "Contact has no phone number" },
          { status: 400 }
        );
      }
      recipient = contact.phone;
    } else if (channel === "EMAIL") {
      if (!contact.email) {
        return NextResponse.json(
          { error: "Contact has no email" },
          { status: 400 }
        );
      }
      recipient = contact.email;
    } else {
      return NextResponse.json(
        { error: "Channel not yet supported" },
        { status: 400 }
      );
    }

    // Get or create conversation
    let conversation = await prisma.conversation.findFirst({
      where: { contactId },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          contactId,
          status: "UNREAD",
          lastMessageAt: new Date(),
        },
      });
    }

    // Send message via integration
    const sender = createSender(channel);
    const result = await sender.send({
      to: recipient,
      content,
      mediaUrls,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to send message", details: result.error },
        { status: 500 }
      );
    }

    // Save message to database
    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        contactId,
        userId: session.user.id,
        content,
        channel,
        direction: "OUTBOUND",
        status: "SENT",
        twilioSid: result.messageId,
        attachments: mediaUrls ? { urls: mediaUrls } : null,
      },
    });

    // Update conversation
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });

    // Log analytics
    await prisma.analytics.create({
      data: {
        contactId,
        conversationId: conversation.id,
        channel,
        eventType: "message_sent",
        timestamp: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        content: message.content,
        channel: message.channel,
        createdAt: message.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
