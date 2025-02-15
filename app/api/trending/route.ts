import { prisma } from "@/lib/db";
import { getCoinGeckoData } from "@/lib/coins";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '5');

  try {
    const coins = await prisma.searchedCoin.findMany({
      orderBy: {
        count: 'desc'
      },
      take: limit
    });

    // Fetch logos for all coins (in parallel)
    const coinsWithLogos = await Promise.all(
      coins.map(async (coin) => {
        const geckoData = await getCoinGeckoData(coin.name);
        return {
          name: coin.name,
          symbol: coin.symbol,
          logo: geckoData?.thumb || null,
          count: coin.count
        };
      })
    );

    return NextResponse.json({ coins: coinsWithLogos });
  } catch (error) {
    console.error('[TRENDING_API_ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch trending coins' }, { status: 500 });
  }
} 