export interface Order {
    id: string;
    type: 'market' | 'limit' | 'sniper';
    inputToken: string;
    outputToken: string;
    amount: number;
    status: 'pending' | 'routing' | 'building' | 'submitted' | 'confirmed' | 'failed';
    txHash?: string;
    error?: string;
    logs: string[];
    createdAt: Date;
}

export interface Quote {
    dex: 'raydium' | 'meteora';
    price: number;
    fee: number;
    amountOut: number;
}

export interface SwapResult {
    txHash: string;
    executedPrice: number;
    status: 'success' | 'failed';
    error?: string;
}
