// app/api/analytics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    // Total messages by channel
    const messagesByChannel = await prisma.message.groupBy({
      by: ["channel"],
      _count: { id: true },
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Messages over time (daily) - Use correct column names
    const messagesOverTime = await prisma.$queryRaw<
      Array<{ date: Date; count: bigint }>
    >`
      SELECT DATE("createdAt") as date, COUNT(*) as count
      FROM messages
      WHERE "createdAt" >= ${startDate} AND "createdAt" <= ${endDate}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    // Average response time - Use correct column names
    const responseTimeData = await prisma.$queryRaw<
      Array<{ avg_response_time: number }>
    >`
      SELECT AVG(
        EXTRACT(EPOCH FROM (outbound."createdAt" - inbound."createdAt"))
      ) as avg_response_time
      FROM messages inbound
      JOIN messages outbound 
        ON inbound."conversationId" = outbound."conversationId"
        AND outbound.direction = 'OUTBOUND'
        AND outbound."createdAt" > inbound."createdAt"
      WHERE inbound.direction = 'INBOUND'
        AND inbound."createdAt" >= ${startDate}
      LIMIT 1
    `;

    // Top contacts by message count
    const topContacts = await prisma.contact.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: { messages: true },
        },
      },
      orderBy: {
        messages: {
          _count: "desc",
        },
      },
      take: 5,
      where: {
        messages: {
          some: {},
        },
      },
    });

    // Summary stats
    const [totalMessages, totalContacts, totalConversations, unreadCount] =
      await Promise.all([
        prisma.message.count(),
        prisma.contact.count(),
        prisma.conversation.count(),
        prisma.conversation.count({ where: { status: "UNREAD" } }),
      ]);

    return NextResponse.json({
      summary: {
        totalMessages,
        totalContacts,
        totalConversations,
        unreadCount,
        avgResponseTime: responseTimeData[0]?.avg_response_time || 0,
      },
      messagesByChannel: messagesByChannel.map((item) => ({
        channel: item.channel,
        count: item._count.id,
      })),
      messagesOverTime: messagesOverTime.map((item) => ({
        date: item.date.toISOString().split("T")[0],
        count: Number(item.count),
      })),
      topContacts: topContacts.map((c) => ({
        name: c.name || "Unknown",
        messages: c._count.messages,
      })),
    });
  } catch (error: any) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
