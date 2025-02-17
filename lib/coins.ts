import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import axios from "axios";

interface CoinSearchData {
  name: string;
  symbol: string;
  logo: string;
  geckoId: string;
}

export async function trackCoinSearch(data: CoinSearchData) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // First try to find by name or geckoId
      const existingCoin = await tx.searchedCoin.findFirst({
        where: {
          OR: [
            { name: data.name },
            { geckoId: data.geckoId }
          ]
        },
      });

      if (existingCoin) {
        // Update existing record
        return await tx.searchedCoin.update({
          where: { id: existingCoin.id },
          data: {
            count: existingCoin.count + 1,
            name: data.name, // Always use the display name
            symbol: data.symbol.toUpperCase(),
            logo: data.logo || existingCoin.logo, // Update logo if provided
            geckoId: data.geckoId // Store the CoinGecko ID for future reference
          },
        });
      }

      // Create new record
      return await tx.searchedCoin.create({
        data: {
          name: data.name,
          symbol: data.symbol.toUpperCase(),
          logo: data.logo,
          geckoId: data.geckoId
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
    if (!coinMatch) return null;

    // Update the coin data in the database with the latest info
    await trackCoinSearch({
      name: coinMatch.name,
      symbol: coinMatch.symbol,
      logo: coinMatch.large || coinMatch.thumb,
      geckoId: coinMatch.id
    });

    return { 
      thumb: coinMatch.large,
      large: coinMatch.large 
    };
  } catch (error) {
    console.error("[COINGECKO_ERROR]", error);
    return null;
  }
} 