export type TokenAccount = {
    token_account: string
    token_address: string
    amount: number
    token_decimals: number
    owner: string
}

export type TokenTransfer = {
    block_id: number
    trans_id: string
    block_time: number
    time: string
    activity_type: string
    from_address: string
    to_address: string
    token_address: string
    token_decimals: number
    amount: number
}

export type TokenAccountsResponse = {
    success: boolean
    data: TokenAccount[]
}

export type TokenTransfersResponse = {
    success: boolean
    data: TokenTransfer[]
}

export type TokenMetadata = {
    name: string
    image: string
    symbol: string
    description: string
    twitter: string
    website: string
}

export type TokenDetails = {
    address: string
    name: string
    symbol: string
    icon: string
    decimals: number
    holder: number
    creator: string
    create_tx: string
    created_time: number
    metadata: TokenMetadata
    mint_authority: string | null
    freeze_authority: string | null
    supply: string
    price: number
    volume_24h: number
    market_cap: number
    market_cap_rank: number
    price_change_24h: number
}

export type TokenDetailsResponse = {
    success: boolean
    data: TokenDetails
}

export type TokenPriceHistory = {
    date: number
    price: number
}

export type TokenPriceHistoryResponse = {
    success: boolean
    data: TokenPriceHistory[]
}

export type TokenTransferDetailed = {
    block_id: number
    trans_id: string
    block_time: number
    time: string
    activity_type: string
    from_address: string
    to_address: string
    token_address: string
    token_decimals: number
    amount: number
    flow: "in" | "out"
}

export type TokenTransferDetailedResponse = {
    success: boolean
    data: TokenTransferDetailed[]
} 