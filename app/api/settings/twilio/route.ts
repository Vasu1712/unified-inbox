/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/settings/twilio/route.ts
import { NextRequest, NextResponse } from "next/server";
import { twilioClient } from "@/lib/twilio";
import { auth } from "@/lib/auth";

// GET Twilio account info and phone numbers
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch account info
    const account = await twilioClient.api.accounts(
      process.env.TWILIO_ACCOUNT_SID!
    ).fetch();

    // Fetch phone numbers
    const phoneNumbers = await twilioClient.incomingPhoneNumbers.list();

    return NextResponse.json({
      account: {
        sid: account.sid,
        friendlyName: account.friendlyName,
        status: account.status,
        type: account.type,
      },
      phoneNumbers: phoneNumbers.map((num) => ({
        sid: num.sid,
        phoneNumber: num.phoneNumber,
        friendlyName: num.friendlyName,
        capabilities: num.capabilities,
        smsUrl: num.smsUrl,
      })),
    });
  } catch (error: any) {
    console.error("Error fetching Twilio info:", error);
    return NextResponse.json(
      { error: "Failed to fetch Twilio information", details: error.message },
      { status: 500 }
    );
  }
}

// POST update webhook URL for a phone number
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { phoneNumberSid, webhookUrl } = await req.json();

    if (!phoneNumberSid || !webhookUrl) {
      return NextResponse.json(
        { error: "Phone number SID and webhook URL are required" },
        { status: 400 }
      );
    }

    const phoneNumber = await twilioClient
      .incomingPhoneNumbers(phoneNumberSid)
      .update({
        smsUrl: webhookUrl,
        smsMethod: "POST",
      });

    return NextResponse.json({
      success: true,
      phoneNumber: {
        sid: phoneNumber.sid,
        phoneNumber: phoneNumber.phoneNumber,
        smsUrl: phoneNumber.smsUrl,
      },
    });
  } catch (error: any) {
    console.error("Error updating webhook:", error);
    return NextResponse.json(
      { error: "Failed to update webhook", details: error.message },
      { status: 500 }
    );
  }
}
