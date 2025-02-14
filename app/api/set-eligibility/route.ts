import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
    try {
        const { isEligible } = await req.json();

        // Create response
        const response = NextResponse.json({ success: true });

        // Set cookie
        response.cookies.set({
            name: "isEligible",
            value: String(isEligible),
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 7 days
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