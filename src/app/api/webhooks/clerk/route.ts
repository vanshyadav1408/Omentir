import { clerkClient } from "@clerk/nextjs/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isLocalMode } from "@/lib/runtime-mode";
import { scheduleSignupWelcomeEmail } from "@/lib/server/email";
import { readTextBody, RequestBodyTooLargeError } from "@/lib/server/request-body";
import {
  currentMailingListPlan,
  unsubscribeUrlFor,
  upsertMailingListEntry,
} from "@/lib/server/mailing-list";

export const dynamic = "force-dynamic";

function primaryEmail(data: {
  primary_email_address_id: string | null;
  email_addresses: Array<{ id: string; email_address: string }>;
}) {
  return (
    data.email_addresses.find((email) => email.id === data.primary_email_address_id)
      ?.email_address ||
    data.email_addresses[0]?.email_address ||
    ""
  );
}

function fullName(data: { first_name: string | null; last_name: string | null }) {
  return [data.first_name, data.last_name].filter(Boolean).join(" ").trim() || undefined;
}

export async function POST(request: NextRequest) {
  if (isLocalMode()) return new NextResponse(null, { status: 404 });
  try {
    await readTextBody(request.clone(), 256 * 1024);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json({ error: error.message }, { status: 413 });
    }
    throw error;
  }
  let event;

  try {
    event = await verifyWebhook(request);
  } catch {
    return NextResponse.json({ error: "Invalid Clerk webhook signature." }, { status: 400 });
  }

  // Logins keep the mailing list fresh: existing users get enrolled the next
  // time they sign in, and their plan field is refreshed each visit.
  if (event.type === "session.created") {
    const userId = event.data.user_id;
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    const email = primaryEmail({
      primary_email_address_id: user.primaryEmailAddressId,
      email_addresses: user.emailAddresses.map((address) => ({
        id: address.id,
        email_address: address.emailAddress,
      })),
    });
    if (!email) {
      return NextResponse.json({ ok: true, skipped: "missing_email" });
    }

    const plan = await currentMailingListPlan(userId);
    await upsertMailingListEntry({
      userId,
      email,
      name: fullName({ first_name: user.firstName, last_name: user.lastName }),
      plan,
    });
    return NextResponse.json({ ok: true, enrolled: userId });
  }

  if (event.type !== "user.created") {
    return NextResponse.json({ ok: true, ignored: event.type });
  }

  const email = primaryEmail(event.data);
  if (!email) {
    return NextResponse.json({ ok: true, skipped: "missing_email" });
  }

  const entry = await upsertMailingListEntry({
    userId: event.data.id,
    email,
    name: fullName(event.data),
  });

  const result = await scheduleSignupWelcomeEmail({
    to: email,
    firstName: event.data.first_name,
    userId: event.data.id,
    eventId: request.headers.get("svix-id"),
    unsubscribeUrl: unsubscribeUrlFor(entry),
  });

  if ("error" in result && result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 502 });
  }

  return NextResponse.json({ ok: true, result });
}
