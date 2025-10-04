import { NextRequest, NextResponse } from "next/server";
import { otpService } from "@/utils/otp";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();

    // Validate input
    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and OTP are required" },
        { status: 400 }
      );
    }

    // Verify OTP
    const isValidOTP = await otpService.verifyOTP(email, otp);
    
    if (!isValidOTP) {
      return NextResponse.json(
        { error: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    // Update user's email verification status
    const updatedUser = await db
      .update(users)
      .set({ isEmailVerified: true })
      .where(eq(users.email, email))
      .returning();

    if (updatedUser.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        message: "Email verified successfully",
        success: true 
      },
      { status: 200 }
    );

  } catch (error) {
    // Verify OTP error logged in development only
    if (process.env.NODE_ENV === 'development') {
      console.error("Verify OTP error:", error);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}