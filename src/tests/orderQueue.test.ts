import { addOrderToQueue, orderQueue } from '../queue/orderQueue';
import { Order } from '../types';

// Mock BullMQ
jest.mock('bullmq', () => {
    return {
        Queue: jest.fn().mockImplementation(() => ({
            add: jest.fn(),
        })),
        Worker: jest.fn(),
    };
});

// Mock Redis connection
jest.mock('../config/redis', () => ({
    connection: {},
}));

describe('Order Queue', () => {
    it('should add order to queue', async () => {
        const order: Order = {
            id: 'test-id',
            type: 'market',
            inputToken: 'SOL',
            outputToken: 'USDC',
            amount: 1,
            status: 'pending',
            logs: [],
            createdAt: new Date(),
        };

        await addOrderToQueue(order);

        expect(orderQueue.add).toHaveBeenCalledWith('execute-order', order, {
            jobId: order.id,
        });
    });
});
