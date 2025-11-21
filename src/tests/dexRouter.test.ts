import { DexRouter } from '../services/dexRouter';

describe('DexRouter', () => {
    let dexRouter: DexRouter;

    beforeEach(() => {
        dexRouter = new DexRouter();
    });

    it('should return a quote from Raydium', async () => {
        const quote = await dexRouter.getRaydiumQuote('SOL', 'USDC', 1);
        expect(quote.dex).toBe('raydium');
        expect(quote.price).toBeGreaterThan(0);
        expect(quote.amountOut).toBeGreaterThan(0);
    });

    it('should return a quote from Meteora', async () => {
        const quote = await dexRouter.getMeteoraQuote('SOL', 'USDC', 1);
        expect(quote.dex).toBe('meteora');
        expect(quote.price).toBeGreaterThan(0);
        expect(quote.amountOut).toBeGreaterThan(0);
    });

    it('should select the best quote', async () => {
        const quote = await dexRouter.getBestQuote('SOL', 'USDC', 1);
        expect(['raydium', 'meteora']).toContain(quote.dex);
        expect(quote.amountOut).toBeGreaterThan(0);
    });

    it('should execute swap successfully', async () => {
        const order: any = { id: 'test-id' };
        // Mock Math.random to avoid failure (return > 0.05)
        jest.spyOn(Math, 'random').mockReturnValue(0.1);

        const result = await dexRouter.executeSwap('raydium', order);

        expect(result.status).toBe('success');
        expect(result.txHash).toBeDefined();

        jest.restoreAllMocks();
    });

    it('should throw error on slippage failure', async () => {
        const order: any = { id: 'test-id' };
        // Mock Math.random to trigger failure (return < 0.05)
        jest.spyOn(Math, 'random').mockReturnValue(0.01);

        await expect(dexRouter.executeSwap('raydium', order))
            .rejects
            .toThrow('Slippage tolerance exceeded');

        jest.restoreAllMocks();
    });
    it('should calculate fee correctly for Raydium', async () => {
        const quote = await dexRouter.getRaydiumQuote('SOL', 'USDC', 100);
        expect(quote.fee).toBe(0.003);
        expect(quote.amountOut).toBeLessThan(100 * quote.price);
    });
});
