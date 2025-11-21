import { Worker, Job } from 'bullmq';
import { connection, ORDER_QUEUE_NAME } from './orderQueue';
import { DexRouter } from '../services/dexRouter';
import { Order } from '../types';
import { publishOrderUpdate } from '../services/pubsub';
import { saveOrder } from '../db';

const dexRouter = new DexRouter();

async function updateStatus(orderId: string, status: string, data?: any) {
    console.log(`[Order ${orderId}] Status: ${status}`, data ? JSON.stringify(data) : '');
    await publishOrderUpdate(orderId, status, data);
}

const worker = new Worker<Order>(
    ORDER_QUEUE_NAME,
    async (job: Job<Order>) => {
        const order = job.data;
        order.status = 'routing';
        await updateStatus(order.id, 'routing');
        await saveOrder(order);

        try {
            // 1. Get Best Quote
            const bestQuote = await dexRouter.getBestQuote(order.inputToken, order.outputToken, order.amount);
            order.status = 'building';
            await updateStatus(order.id, 'building', { dex: bestQuote.dex, price: bestQuote.price });
            await saveOrder(order);

            // 2. Execute Swap
            order.status = 'submitted';
            await updateStatus(order.id, 'submitted');
            await saveOrder(order);

            const result = await dexRouter.executeSwap(bestQuote.dex, order);

            // 3. Confirm
            order.status = 'confirmed';
            order.txHash = result.txHash;
            await updateStatus(order.id, 'confirmed', { txHash: result.txHash, price: result.executedPrice });
            await saveOrder(order);

            return result;
        } catch (error: any) {
            order.status = 'failed';
            order.error = error.message;
            await updateStatus(order.id, 'failed', { error: error.message });
            await saveOrder(order);
            throw error;
        }
    },
    {
        connection,
        concurrency: 10,
        limiter: {
            max: 100,
            duration: 60000,
        },
    }
);

worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed!`);
});

worker.on('failed', (job, err) => {
    console.log(`Job ${job?.id} failed with ${err.message}`);
});

export { worker };
