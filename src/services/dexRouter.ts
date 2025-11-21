import { Quote, SwapResult, Order } from '../types';

export class DexRouter {
    private basePrices: Record<string, number> = {
        'SOL-USDC': 150.0, // Mock price
        'BTC-USDC': 60000.0,
    };

    private async sleep(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async getRaydiumQuote(tokenIn: string, tokenOut: string, amount: number): Promise<Quote> {
        await this.sleep(200); // Simulate network delay
        const pair = `${tokenIn}-${tokenOut}`;
        const basePrice = this.basePrices[pair] || 100;

        // Raydium price variance
        const price = basePrice * (0.98 + Math.random() * 0.04);

        return {
            dex: 'raydium',
            price,
            fee: 0.003,
            amountOut: (amount * price) * (1 - 0.003)
        };
    }

    async getMeteoraQuote(tokenIn: string, tokenOut: string, amount: number): Promise<Quote> {
        await this.sleep(200); // Simulate network delay
        const pair = `${tokenIn}-${tokenOut}`;
        const basePrice = this.basePrices[pair] || 100;

        // Meteora price variance
        const price = basePrice * (0.97 + Math.random() * 0.05);

        return {
            dex: 'meteora',
            price,
            fee: 0.002,
            amountOut: (amount * price) * (1 - 0.002)
        };
    }

    async getBestQuote(tokenIn: string, tokenOut: string, amount: number): Promise<Quote> {
        const [raydiumQuote, meteoraQuote] = await Promise.all([
            this.getRaydiumQuote(tokenIn, tokenOut, amount),
            this.getMeteoraQuote(tokenIn, tokenOut, amount)
        ]);

        // Simple logic: choose the one with higher amountOut
        const bestQuote = raydiumQuote.amountOut > meteoraQuote.amountOut ? raydiumQuote : meteoraQuote;

        console.log(`[DexRouter] Routing decision: Raydium(${raydiumQuote.amountOut.toFixed(4)}) vs Meteora(${meteoraQuote.amountOut.toFixed(4)}) -> Selected: ${bestQuote.dex}`);

        return bestQuote;
    }

    async executeSwap(dex: string, order: Order): Promise<SwapResult> {
        // Simulate execution time
        await this.sleep(2000 + Math.random() * 1000);

        // Simulate random failure (5% chance)
        if (Math.random() < 0.05) {
            throw new Error('Slippage tolerance exceeded');
        }

        return {
            txHash: '5x' + Math.random().toString(36).substring(7) + Math.random().toString(36).substring(7),
            executedPrice: 150.0, // In a real app this would be dynamic
            status: 'success'
        };
    }
}
