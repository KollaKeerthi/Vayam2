import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth-options";
import { eq } from "drizzle-orm";

export async function POST() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const uid = Number(session.user.id);

    // Mark user as having skipped mobile verification
    // We can use a special value like "SKIPPED" for mobile to indicate they chose to skip
    await db
      .update(users)
      .set({
        mobile: "SKIPPED",
        isMobileVerified: true, // Set to true so they don't get prompted again
      })
      .where(eq(users.uid, uid));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Skip mobile verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}