/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/scheduled-messages/process/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSender } from "@/lib/integrations";

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get("x-api-key");
    if (apiKey !== process.env.CRON_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

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
      take: 10,
    });

    const results = [];

    for (const message of pendingMessages) {
      try {
        let recipient: string;
        if (message.channel === "SMS" || message.channel === "WHATSAPP") {
          recipient = message.contact.phone!;
        } else if (message.channel === "EMAIL") {
          recipient = message.contact.email!;
        } else {
          continue;
        }

        const sender = createSender(message.channel);
        const result = await sender.send({
          to: recipient,
          content: message.content,
        });

        if (result.success) {
          await prisma.scheduledMessage.update({
            where: { id: message.id },
            data: {
              status: "SENT",
              sentAt: now,
            },
          });

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
