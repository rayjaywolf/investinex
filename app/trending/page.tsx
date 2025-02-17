import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowUp, ArrowDown, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Header } from "@/components/header";
import Link from "next/link";

async function getTopSearchedCoins() {
  const coins = await prisma.searchedCoin.findMany({
    orderBy: {
      count: 'desc'
    },
    take: 20,
    select: {
      id: true,
      name: true,
      symbol: true,
      count: true,
      logo: true,
      updatedAt: true
    }
  });

  return coins;
}

export default async function TrendingPage() {
  const coins = await getTopSearchedCoins();

  return (
    <>
      <Header />
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-background/80 via-background/70 to-background/60">
        {/* Grid Pattern Background */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] opacity-50" />
        </div>

        {/* Gradient Blobs */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -left-[10%] top-0">
            <div className="h-[600px] w-[600px] rounded-full bg-blue-500/10 blur-[128px]" />
          </div>
          <div className="absolute -right-[10%] top-[20%]">
            <div className="h-[600px] w-[600px] rounded-full bg-purple-500/10 blur-[128px]" />
          </div>
          <div className="absolute left-[20%] top-[40%]">
            <div className="h-[600px] w-[600px] rounded-full bg-blue-500/10 blur-[128px]" />
          </div>
        </div>

        {/* Radial Gradient */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="relative">
              <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full blur-[120px]"
                style={{
                  background: "radial-gradient(circle at center, rgba(139, 92, 246, 0.15), rgba(59, 130, 246, 0.15), transparent)"
                }}
              />
            </div>
          </div>
        </div>

        <div className="container mx-auto p-8 pt-28">
          <div className="flex flex-col items-center mb-12">
            <h1 className="text-5xl font-bold tracking-tighter mb-4">
              Trending Cryptocurrencies
            </h1>
            <p className="text-muted-foreground text-center">
              Most searched cryptocurrencies by our community
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {coins.map((coin, index) => (
              <Link 
                href={`/chat?message=give me analysis on $${coin.name}`}
                key={coin.id}
              >
                <Card 
                  className="p-6 backdrop-blur-sm bg-blue-500/5 border-blue-500/20 hover:border-blue-500/30 hover:bg-blue-500/10 transition-all duration-300 group cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 rounded-xl bg-blue-500/10">
                        {coin.logo ? (
                          <AvatarImage 
                            src={coin.logo} 
                            className="rounded-xl"
                            alt={coin.name}
                          />
                        ) : (
                          <AvatarFallback className="rounded-xl bg-blue-500/10 text-blue-400">
                            {coin.symbol.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-lg group-hover:text-blue-400 transition-colors">
                          {coin.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {coin.symbol.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-blue-500/10 px-2 py-1 rounded-lg">
                      <Search className="w-3 h-3 text-blue-400" />
                      <span className="text-sm font-medium text-blue-400">
                        {(coin.count).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Rank</span>
                      <span className="font-medium">#{index + 1}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-muted-foreground">
                        Last searched
                      </span>
                      <span className="font-medium">
                        {formatDistanceToNow(new Date(coin.updatedAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
