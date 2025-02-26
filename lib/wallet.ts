import { TokenAccountsResponse, TokenTransfersResponse, TokenDetailsResponse, TokenPriceHistoryResponse, TokenTransferDetailedResponse } from "@/types/wallet"

const API_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjcmVhdGVkQXQiOjE3Mzk5MDE3MDM4ODEsImVtYWlsIjoiamludGFyZWhhYW5AZ21haWwuY29tIiwiYWN0aW9uIjoidG9rZW4tYXBpIiwiYXBpVmVyc2lvbiI6InYyIiwiaWF0IjoxNzM5OTAxNzAzfQ.AMG8iStPCMtyKul5Z3Qkv8qnapQq29x_esGYqrAeAkQ"

const requestOptions = {
    method: "get",
    headers: { token: API_TOKEN }
}

export const fetchTokenAccounts = async (address: string, page = 1, pageSize = 10) => {
    const response = await fetch(
        `https://pro-api.solscan.io/v2.0/account/token-accounts?address=${address}&type=token&page=${page}&page_size=${pageSize}`,
        requestOptions
    )
    const data = await response.json() as TokenAccountsResponse
    return data
}

export const fetchTokenTransfers = async (address: string, page = 1, pageSize = 10) => {
    const response = await fetch(
        `https://pro-api.solscan.io/v2.0/token/transfer?address=${address}&page=${page}&page_size=${pageSize}&sort_by=block_time&sort_order=desc`,
        requestOptions
    )
    const data = await response.json() as TokenTransfersResponse
    return data
}

export const fetchTokenDetails = async (address: string) => {
    const response = await fetch(
        `https://pro-api.solscan.io/v2.0/token/meta?address=${address}`,
        requestOptions
    )
    const data = await response.json() as TokenDetailsResponse
    return data
}

export const fetchTokenPriceHistory = async (address: string) => {
    const response = await fetch(
        `https://pro-api.solscan.io/v2.0/token/price?address=${address}`,
        requestOptions
    )
    const data = await response.json() as TokenPriceHistoryResponse
    return data
}

export const fetchDetailedTransfers = async (address: string, page = 1, pageSize = 100) => {
    const response = await fetch(
        `https://pro-api.solscan.io/v2.0/account/transfer?address=${address}&page=${page}&page_size=${pageSize}&sort_by=block_time&sort_order=desc`,
        requestOptions
    )
    const data = await response.json() as TokenTransferDetailedResponse
    return data
} 