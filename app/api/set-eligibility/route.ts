import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
    try {
        const { isEligible } = await req.json();

        // Validate and coerce to boolean
        const eligibilityStatus = Boolean(isEligible);

        // Create response
        const response = NextResponse.json({ success: true });

        // Set cookie with string value
        response.cookies.set({
            name: "isEligible",
            value: eligibilityStatus.toString(), // Explicit string conversion
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: eligibilityStatus ? 60 * 60 * 24 * 7 : 0,
        });

        return response;
    } catch (error) {
        console.error("[SET_ELIGIBILITY_ERROR]", error);
        return NextResponse.json(
            { error: "Failed to set eligibility" },
            { status: 500 }
        );
    }
} 