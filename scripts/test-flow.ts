import WebSocket from 'ws';
import axios from 'axios';

async function runTest() {
    try {
        console.log('Submitting order...');
        const response = await axios.post('http://localhost:3000/api/orders/execute', {
            inputToken: 'SOL',
            outputToken: 'USDC',
            amount: 1.0
        });

        const { orderId } = response.data;
        console.log(`Order submitted: ${orderId}`);

        const ws = new WebSocket(`ws://localhost:3000/api/orders/execute?orderId=${orderId}`);

        ws.on('open', () => {
            console.log('WebSocket connected');
        });

        ws.on('message', (data) => {
            const message = JSON.parse(data.toString());
            console.log('Update:', message);

            if (message.status === 'confirmed' || message.status === 'failed') {
                console.log('Final state reached. Closing...');
                ws.close();
                process.exit(0);
            }
        });

        ws.on('error', (err) => {
            console.error('WebSocket error:', err);
        });

    } catch (error) {
        console.error('Error:', error);
    }
}

runTest();
