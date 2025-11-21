import { buildApp } from '../app';
import { FastifyInstance } from 'fastify';

// Mock dependencies
jest.mock('../queue/orderQueue', () => ({
    addOrderToQueue: jest.fn(),
    connection: {
        on: jest.fn(),
    }
}));

jest.mock('../queue/orderWorker', () => ({
    worker: {
        name: 'mock-worker',
        on: jest.fn(),
    }
}));

jest.mock('../db', () => ({
    initDb: jest.fn(),
    saveOrder: jest.fn(),
}));

jest.mock('../services/pubsub', () => ({
    subscribeToOrderUpdates: jest.fn(),
}));

describe('API Routes', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        app = buildApp();
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    it('POST /api/orders/execute should return 200 and orderId', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/api/orders/execute',
            payload: {
                inputToken: 'SOL',
                outputToken: 'USDC',
                amount: 1.5,
            },
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.payload);
        expect(body).toHaveProperty('orderId');
        expect(body.status).toBe('pending');
    });

    it('POST /api/orders/execute should fail with invalid payload', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/api/orders/execute',
            payload: {
                inputToken: 'SOL',
                // Missing outputToken
                amount: 1.5,
            },
        });

        expect(response.statusCode).toBe(400);
    });

    it('POST /api/orders/execute should fail with negative amount', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/api/orders/execute',
            payload: {
                inputToken: 'SOL',
                outputToken: 'USDC',
                amount: -5,
            },
        });

        expect(response.statusCode).toBe(400);
    });
});
