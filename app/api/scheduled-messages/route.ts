// app/api/scheduled-messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const createScheduledMessageSchema = z.object({
  contactId: z.string(),
  content: z.string().min(1),
  channel: z.enum(["SMS", "WHATSAPP", "EMAIL"]),
  sendAt: z.iso.datetime(),
});

// GET all scheduled messages
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const scheduledMessages = await prisma.scheduledMessage.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: { sendAt: "asc" },
    });

    return NextResponse.json({ scheduledMessages });
  } catch (error: any) {
    console.error("Error fetching scheduled messages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST create scheduled message
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = createScheduledMessageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { contactId, content, channel, sendAt } = validation.data;

    // Validate sendAt is in the future
    const sendAtDate = new Date(sendAt);
    if (sendAtDate <= new Date()) {
      return NextResponse.json(
        { error: "Send time must be in the future" },
        { status: 400 }
      );
    }

    const scheduledMessage = await prisma.scheduledMessage.create({
      data: {
        contactId,
        userId: session.user.id,
        content,
        channel,
        sendAt: sendAtDate,
        status: "PENDING",
      },
      include: {
        contact: true,
      },
    });

    return NextResponse.json({ scheduledMessage }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating scheduled message:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}