import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { orderRoutes } from './routes/orders';
import { worker } from './queue/orderWorker';
import { initDb } from './db';

export const buildApp = () => {
    const server = Fastify({
        logger: true,
    });

    server.register(websocket);

    server.register(fastifyStatic, {
        root: path.join(__dirname, '../public'),
        prefix: '/',
    });

    server.register(orderRoutes, { prefix: '/api/orders' });

    return server;
};

const start = async () => {
    const server = buildApp();
    try {
        await initDb();
        await server.listen({ port: 3000, host: '0.0.0.0' });
        console.log('Server running at http://localhost:3000');

        // Ensure worker is running
        console.log('Worker started:', worker.name);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

if (require.main === module) {
    start();
}
