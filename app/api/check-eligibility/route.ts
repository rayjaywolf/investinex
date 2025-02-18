import { NextResponse } from "next/server";

const GMGN_API_URL = "https://gmgn.ai/defi/router/v1/sol/tx/get_swap_route";
const TOKEN_ADDRESS = "HLKY3NXpwdhzEiAzrc1xuewDE2MhQpo36RtZeFXtpump";
const WSOL_ADDRESS = "So11111111111111111111111111111111111111112";

export async function POST(req: Request) {
    try {
        const { walletAddress } = await req.json();

        if (!walletAddress) {
            return NextResponse.json(
                { error: "Wallet address is required" },
                { status: 400 }
            );
        }

        // Check eligibility with the API
        const response = await fetch(
            `${GMGN_API_URL}?` + new URLSearchParams({
                token_in_address: TOKEN_ADDRESS,
                token_out_address: WSOL_ADDRESS,
                in_amount: "1",
                from_address: walletAddress,
                slippage: "0.5"
            })
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            console.error("[GMGN_API_ERROR]", {
                status: response.status,
                statusText: response.statusText,
                errorData
            });

            if (response.status === 400 || response.status === 404) {
                return NextResponse.json({
                    isEligible: false,
                    message: "Sorry, you are not eligible. You need to hold the required token."
                });
            }

            throw new Error(`GMGN API error: ${response.statusText}`);
        }

        const data = await response.json();
        const isHolder = data.code === 0 && data.data?.quote;

        return NextResponse.json({
            isEligible: isHolder,
            message: isHolder
                ? "Congratulations! You are eligible."
                : "Sorry, you are not eligible. You need to hold the required token.",
        });
    } catch (error) {
        console.error("[ELIGIBILITY_CHECK_ERROR]", error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Failed to check eligibility"
            },
            { status: 500 }
        );
    }
} 