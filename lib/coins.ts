import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import axios from "axios";

export async function trackCoinSearch(name: string, symbol: string) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const existingCoin = await tx.searchedCoin.findUnique({
        where: { name },
      });

      if (existingCoin) {
        return await tx.searchedCoin.update({
          where: { id: existingCoin.id },
          data: { count: existingCoin.count + 1 },
        });
      }

      return await tx.searchedCoin.create({
        data: {
          name,
          symbol: symbol.toUpperCase(),
        },
      });
    });

    return result;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error(`[PRISMA_ERROR] ${error.code}:`, error.message);
    } else {
      console.error("[COIN_TRACKING_ERROR]:", error);
    }
    return null;
  }
}

export async function getCoinGeckoData(coinName: string) {
  try {
    const searchResponse = await axios.get(
      `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(coinName)}`
    );
    
    const coinMatch = searchResponse.data.coins?.[0];
    return coinMatch ? { 
      thumb: coinMatch.large,
      large: coinMatch.large 
    } : null;
  } catch (error) {
    console.error("[COINGECKO_ERROR]", error);
    return null;
  }
} 