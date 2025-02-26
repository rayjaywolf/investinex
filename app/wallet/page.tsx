"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchTokenAccounts, fetchTokenDetails, fetchDetailedTransfers } from "@/lib/wallet"
import { TokenAccount, TokenDetails, TokenTransferDetailed } from "@/types/wallet"

interface TokenPnL {
    tokenAddress: string
    totalIn: number
    totalOut: number
    netAmount: number
    currentValue: number
    pnl: number
}

type TokenAccountWithDetails = TokenAccount & { tokenDetails?: TokenDetails }

const WalletPage = () => {
    const [address, setAddress] = useState("")
    const [tokenAccounts, setTokenAccounts] = useState<TokenAccountWithDetails[]>([])
    const [pnlData, setPnlData] = useState<TokenPnL[]>([])
    const [loading, setLoading] = useState(false)

    const calculatePnL = async (transfers: TokenTransferDetailed[], tokenDetails: Map<string, TokenDetails>) => {
        const tokenPnL = new Map<string, TokenPnL>()

        for (const transfer of transfers) {
            const token = tokenDetails.get(transfer.token_address)
            if (!token) continue

            const amount = transfer.amount / Math.pow(10, transfer.token_decimals)
            const currentPrice = token.price || 0

            let pnl = tokenPnL.get(transfer.token_address) || {
                tokenAddress: transfer.token_address,
                totalIn: 0,
                totalOut: 0,
                netAmount: 0,
                currentValue: 0,
                pnl: 0
            }

            if (transfer.flow === "in") {
                pnl.totalIn += amount
            } else {
                pnl.totalOut += amount
            }

            pnl.netAmount = pnl.totalIn - pnl.totalOut
            pnl.currentValue = pnl.netAmount * currentPrice
            tokenPnL.set(transfer.token_address, pnl)
        }

        return Array.from(tokenPnL.values())
    }

    const handleSearch = async () => {
        if (!address) return

        setLoading(true)
        try {
            const [accountsResponse, transfersResponse] = await Promise.all([
                fetchTokenAccounts(address),
                fetchDetailedTransfers(address)
            ])

            if (accountsResponse.success) {
                const accounts = accountsResponse.data
                const accountsWithDetails = await Promise.all(
                    accounts.map(async (account) => {
                        try {
                            const details = await fetchTokenDetails(account.token_address)
                            return { ...account, tokenDetails: details.success ? details.data : undefined }
                        } catch {
                            return account
                        }
                    })
                )
                setTokenAccounts(accountsWithDetails)

                // Calculate PnL
                if (transfersResponse.success) {
                    const tokenDetailsMap = new Map(
                        accountsWithDetails
                            .filter((a): a is TokenAccountWithDetails & { tokenDetails: TokenDetails } =>
                                a.tokenDetails !== undefined
                            )
                            .map(a => [a.token_address, a.tokenDetails])
                    )
                    const pnl = await calculatePnL(transfersResponse.data, tokenDetailsMap)
                    setPnlData(pnl)
                }
            }
        } catch (error) {
            console.error("Error fetching data:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSearch()
        }
    }

    const formatAmount = (amount: number, decimals: number) => {
        return (amount / Math.pow(10, decimals)).toLocaleString()
    }

    const formatPrice = (price?: number) => {
        if (!price) return "N/A"
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD"
        }).format(price)
    }

    const formatMarketCap = (marketCap?: number) => {
        if (!marketCap) return "N/A"
        if (marketCap >= 1e9) {
            return `$${(marketCap / 1e9).toFixed(2)}B`
        }
        if (marketCap >= 1e6) {
            return `$${(marketCap / 1e6).toFixed(2)}M`
        }
        return formatPrice(marketCap)
    }

    const formatPriceChange = (change?: number) => {
        if (typeof change !== "number") return "N/A"
        const color = change >= 0 ? "text-green-500" : "text-red-500"
        return <span className={`font-medium ${color}`}>{change.toFixed(2)}%</span>
    }

    const getTotalPnL = () => {
        const total = pnlData.reduce((sum, token) => sum + token.currentValue, 0)
        const color = total >= 0 ? "text-green-500" : "text-red-500"
        return <span className={`font-medium ${color}`}>{formatPrice(total)}</span>
    }

    return (
        <div className="container mx-auto py-8 space-y-6">
            <div className="flex flex-col items-center space-y-4">
                <h1 className="text-3xl font-bold">Wallet Explorer</h1>
                <div className="flex w-full max-w-xl gap-2">
                    <Input
                        placeholder="Enter wallet address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <Button onClick={handleSearch} disabled={loading}>
                        {loading ? "Loading..." : "Search"}
                    </Button>
                </div>
            </div>

            {tokenAccounts.length > 0 && (
                <>
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-semibold">Token Holdings</h2>
                        <div className="text-lg">
                            Total Value: {getTotalPnL()}
                        </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {tokenAccounts.map((account) => (
                            <Card key={account.token_account} className="overflow-hidden">
                                <CardHeader className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                                            <span className="text-sm font-medium text-muted-foreground">
                                                {account.tokenDetails?.symbol?.[0] || "?"}
                                            </span>
                                        </div>
                                        <CardTitle className="text-lg">
                                            {account.tokenDetails?.name || "Unknown Token"}
                                            {account.tokenDetails?.symbol && ` (${account.tokenDetails.symbol})`}
                                        </CardTitle>
                                    </div>
                                    {account.tokenDetails?.metadata?.description && (
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {account.tokenDetails.metadata.description}
                                        </p>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <div className="text-sm text-muted-foreground">Balance</div>
                                                <div className="font-medium">
                                                    {formatAmount(account.amount, account.token_decimals)}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-sm text-muted-foreground">Price</div>
                                                <div className="font-medium">
                                                    {formatPrice(account.tokenDetails?.price)}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <div className="text-sm text-muted-foreground">Market Cap</div>
                                                <div className="font-medium">
                                                    {formatMarketCap(account.tokenDetails?.market_cap)}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-sm text-muted-foreground">24h Change</div>
                                                <div>
                                                    {formatPriceChange(account.tokenDetails?.price_change_24h)}
                                                </div>
                                            </div>
                                        </div>

                                        {pnlData.find(p => p.tokenAddress === account.token_address) && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <div className="text-sm text-muted-foreground">Current Value</div>
                                                    <div className="font-medium">
                                                        {formatPrice(pnlData.find(p => p.tokenAddress === account.token_address)?.currentValue)}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-sm text-muted-foreground">Net Amount</div>
                                                    <div className="font-medium">
                                                        {pnlData.find(p => p.tokenAddress === account.token_address)?.netAmount.toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <div className="text-sm text-muted-foreground">Token Address</div>
                                            <div className="font-medium truncate">{account.token_address}</div>
                                        </div>

                                        {(account.tokenDetails?.metadata?.website || account.tokenDetails?.metadata?.twitter) && (
                                            <div className="flex gap-2">
                                                {account.tokenDetails.metadata.website && (
                                                    <a
                                                        href={account.tokenDetails.metadata.website}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-blue-500 hover:underline"
                                                    >
                                                        Website
                                                    </a>
                                                )}
                                                {account.tokenDetails.metadata.twitter && (
                                                    <a
                                                        href={`https://twitter.com/${account.tokenDetails.metadata.twitter.replace("https://twitter.com/", "")}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-blue-500 hover:underline"
                                                    >
                                                        Twitter
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </>
            )}

            {tokenAccounts.length === 0 && !loading && address && (
                <div className="text-center text-muted-foreground">
                    No token accounts found for this address
                </div>
            )}
        </div>
    )
}

export default WalletPage