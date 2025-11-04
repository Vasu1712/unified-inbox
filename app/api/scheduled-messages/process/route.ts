// app/api/scheduled-messages/process/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSender } from "@/lib/integrations";

// This endpoint should be called by a cron job (e.g., every minute)
// For production, use Vercel Cron or external cron service
export async function POST(req: NextRequest) {
  try {
    // Simple API key authentication for cron endpoint
    const apiKey = req.headers.get("x-api-key");
    if (apiKey !== process.env.CRON_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // Find messages that should be sent
    const pendingMessages = await prisma.scheduledMessage.findMany({
      where: {
        status: "PENDING",
        sendAt: {
          lte: now,
        },
      },
      include: {
        contact: true,
      },
      take: 10, // Process in batches
    });

    const results = [];

    for (const message of pendingMessages) {
      try {
        // Determine recipient
        let recipient: string;
        if (message.channel === "SMS" || message.channel === "WHATSAPP") {
          recipient = message.contact.phone!;
        } else if (message.channel === "EMAIL") {
          recipient = message.contact.email!;
        } else {
          continue;
        }

        // Send message
        const sender = createSender(message.channel);
        const result = await sender.send({
          to: recipient,
          content: message.content,
        });

        if (result.success) {
          // Update scheduled message
          await prisma.scheduledMessage.update({
            where: { id: message.id },
            data: {
              status: "SENT",
              sentAt: now,
            },
          });

          // Create conversation and message records
          let conversation = await prisma.conversation.findFirst({
            where: { contactId: message.contactId },
          });

          if (!conversation) {
            conversation = await prisma.conversation.create({
              data: {
                contactId: message.contactId,
                status: "UNREAD",
                lastMessageAt: now,
              },
            });
          }

          await prisma.message.create({
            data: {
              conversationId: conversation.id,
              contactId: message.contactId,
              userId: message.userId,
              content: message.content,
              channel: message.channel,
              direction: "OUTBOUND",
              status: "SENT",
              twilioSid: result.messageId,
            },
          });

          results.push({ id: message.id, status: "sent" });
        } else {
          // Mark as failed
          await prisma.scheduledMessage.update({
            where: { id: message.id },
            data: { status: "FAILED" },
          });

          results.push({ id: message.id, status: "failed", error: result.error });
        }
      } catch (error: any) {
        console.error("Error processing scheduled message:", error);
        results.push({ id: message.id, status: "error", error: error.message });
      }
    }

    return NextResponse.json({
      processed: results.length,
      results,
    });
  } catch (error: any) {
    console.error("Error processing scheduled messages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
