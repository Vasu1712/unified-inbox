// app/api/scheduled-messages/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// DELETE scheduled message
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params; // Await params

    const scheduledMessage = await prisma.scheduledMessage.findUnique({
      where: { id },
    });

    if (!scheduledMessage) {
      return NextResponse.json(
        { error: "Scheduled message not found" },
        { status: 404 }
      );
    }

    // Only allow deleting pending messages
    if (scheduledMessage.status !== "PENDING") {
      return NextResponse.json(
        { error: "Can only delete pending messages" },
        { status: 400 }
      );
    }

    await prisma.scheduledMessage.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting scheduled message:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
