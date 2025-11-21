import { Queue } from 'bullmq';
import { connection } from '../config/redis';
export { connection };
import { Order } from '../types';

export const ORDER_QUEUE_NAME = 'order-execution';

export const orderQueue = new Queue(ORDER_QUEUE_NAME, {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: 100,
        removeOnFail: 500,
    },
});

export const addOrderToQueue = async (order: Order) => {
    await orderQueue.add('execute-order', order, {
        jobId: order.id,
    });
};
