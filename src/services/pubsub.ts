import { publisher, subscriber } from '../config/redis';

export const CHANNEL_PREFIX = 'order-updates:';

export const publishOrderUpdate = async (orderId: string, status: string, data?: any) => {
    const message = JSON.stringify({ status, ...data, timestamp: new Date().toISOString() });
    await publisher.publish(`${CHANNEL_PREFIX}${orderId}`, message);
};

export const subscribeToOrderUpdates = (orderId: string, callback: (message: any) => void) => {
    const channel = `${CHANNEL_PREFIX}${orderId}`;

    // Create a new subscriber instance for this connection or reuse a global one with multiplexing
    // For simplicity in this demo, we'll use the global subscriber but note that ioredis handles multiplexing
    subscriber.subscribe(channel);

    subscriber.on('message', (ch, message) => {
        if (ch === channel) {
            callback(JSON.parse(message));
        }
    });

    return () => {
        subscriber.unsubscribe(channel);
    };
};
