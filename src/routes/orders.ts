import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { addOrderToQueue } from '../queue/orderQueue';
import { Order } from '../types';
import { subscribeToOrderUpdates } from '../services/pubsub';
import { v4 as uuidv4 } from 'uuid';

const OrderSchema = z.object({
    inputToken: z.string(),
    outputToken: z.string(),
    amount: z.number().positive(),
});

export async function orderRoutes(fastify: FastifyInstance) {
    fastify.post('/execute', async (request, reply) => {
        try {
            const body = OrderSchema.parse(request.body);
            const orderId = uuidv4();

            const order: Order = {
                id: orderId,
                type: 'market',
                ...body,
                status: 'pending',
                logs: [],
                createdAt: new Date(),
            };

            await addOrderToQueue(order);

            return { orderId, status: 'pending', message: 'Order queued' };
        } catch (error) {
            reply.status(400).send({ error: 'Invalid request', details: error });
        }
    });

    fastify.get('/execute', { websocket: true }, (connection: any, req) => {
        // Expect orderId in query param ?orderId=...
        const query = req.query as { orderId?: string };
        const orderId = query.orderId;

        if (!orderId) {
            connection.socket.send(JSON.stringify({ error: 'Missing orderId' }));
            connection.socket.close();
            return;
        }

        console.log(`Client connected for order ${orderId}`);

        // Send initial status
        connection.socket.send(JSON.stringify({ status: 'connected', orderId }));

        const unsubscribe = subscribeToOrderUpdates(orderId, (message) => {
            connection.socket.send(JSON.stringify(message));
            if (message.status === 'confirmed' || message.status === 'failed') {
                // Optional: close connection after final state
                // connection.socket.close();
            }
        });

        connection.socket.on('close', () => {
            console.log(`Client disconnected for order ${orderId}`);
            unsubscribe();
        });
    });
}
