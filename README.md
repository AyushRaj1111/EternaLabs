# Order Execution Engine

A high-performance backend order execution engine for Solana, supporting Market Orders with Mock DEX routing (Raydium/Meteora).

## Features

- **Market Order Execution**: Immediate execution at the best available price.
- **Smart DEX Routing**: Automatically routes to the DEX with the best price (Raydium vs Meteora).
- **Real-time Updates**: WebSocket streaming of order status (pending -> routing -> building -> submitted -> confirmed).
- **High Concurrency**: BullMQ + Redis queue system handling concurrent orders.
- **Resilience**: Exponential backoff retries and error handling.
- **Persistence**: PostgreSQL for order history.

## Architecture Overview

The Order Execution Engine is built as a high-performance, asynchronous system designed to handle concurrent order processing with real-time feedback.

### System Components

1.  **API Layer (Fastify)**
    - **Role**: Entry point for order submission and status streaming.
    - **Responsibility**: Validates requests, enqueues jobs, and upgrades HTTP connections to WebSockets for real-time updates.
    - **Why Fastify?**: Chosen for its low overhead and built-in `fastify-websocket` support, allowing efficient handling of high-concurrency connections.

2.  **Message Queue (BullMQ + Redis)**
    - **Role**: Buffer and manager for order processing tasks.
    - **Responsibility**: Ensures orders are processed in the background, handles retries (exponential backoff), and manages concurrency limits (10 concurrent jobs).
    - **Why BullMQ?**: Provides robust reliability features out-of-the-box (retries, delayed jobs, priority) which are essential for a trading system where execution guarantees are critical.

3.  **Worker Service**
    - **Role**: The consumer of the queue.
    - **Responsibility**: Picks up orders, executes the business logic (routing -> execution), and updates the order status.
    - **Scalability**: This component is stateless and can be horizontally scaled by simply adding more worker instances.

4.  **DEX Router (Service)**
    - **Role**: The "brain" of the execution.
    - **Responsibility**: Queries multiple sources (Raydium, Meteora), compares prices, and selects the best route.
    - **Implementation**: Currently uses a Mock strategy to simulate network latency (200ms) and price variance (2-5%) deterministically, allowing for reliable testing of the routing logic without mainnet costs.

5.  **Data Persistence (PostgreSQL)**
    - **Role**: System of record.
    - **Responsibility**: Stores the final state of all orders for audit trails and history.

## Key Design Decisions

### 1. Asynchronous Processing with WebSockets
Instead of keeping the HTTP request open during the entire execution (which can take seconds), we immediately return an `orderId` and upgrade the connection to a WebSocket.
- **Benefit**: Prevents connection timeouts on long-running trades.
- **Benefit**: Provides granular progress updates (`routing` -> `building` -> `submitted`) which improves user trust.

### 2. Concurrency Management
We use BullMQ's concurrency settings to strictly limit active executions to 10.
- **Reasoning**: On a real blockchain, submitting too many transactions simultaneously from a single wallet can lead to nonce issues or rate limiting. The queue acts as a traffic shaper.

### 3. Mock vs. Real Implementation
We opted for a **Mock Implementation** for the core routing logic.
- **Reasoning**: Real DEX interaction on Devnet can be flaky and requires funded wallets. The Mock implementation allows us to:
    - Simulate slippage failures (5% chance) to test error handling.
    - Simulate network delays to test WebSocket liveliness.
    - Verify "Best Price" logic mathematically without market noise.

### 4. Market Orders Only
We focused on **Market Orders** for this iteration.
- **Reasoning**: Market orders are the simplest primitive. Limit and Sniper orders can be built *on top* of this engine by adding a "Watcher" service that only enqueues the Market Order when specific conditions (Price or Time) are met.

## Trade-offs

- **Latency**: The queue introduces a small overhead (ms) compared to direct execution. This is acceptable for the reliability guarantees it provides.
- **Complexity**: Adding Redis and a Worker process increases infrastructure complexity compared to a monolithic script. However, this architecture is necessary for production-grade reliability.

## Extensibility

The engine is designed to be easily extended for other order types:

- **Limit Orders**:
    - Add a `targetPrice` field to the `Order` schema.
    - Create a new `LimitOrderWorker` that polls prices or subscribes to a price feed.
    - When `currentPrice <= targetPrice` (for buy), trigger the existing execution logic.
    - Store limit orders in a separate "active" table or Redis set until triggered.

- **Sniper Orders**:
    - Add `launchTime` or `tokenAddress` trigger to the `Order` schema.
    - Use a high-frequency poller or mempool listener (if real) to detect the liquidity add event.
    - Configure the `DexRouter` to use aggressive slippage settings and high priority fees for these orders.

## Setup Instructions

### Prerequisites
- Node.js (v16+)
- Docker & Docker Compose

### Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start Redis and PostgreSQL:
   ```bash
   docker-compose up -d
   ```
4. Start the server:
   ```bash
   npm run dev
   ```

### Usage

**Submit an Order:**

```bash
curl -X POST http://localhost:3000/api/orders/execute \
  -H "Content-Type: application/json" \
  -d '{"inputToken": "SOL", "outputToken": "USDC", "amount": 1.5}'
```

**WebSocket Updates:**

Connect to `ws://localhost:3000/api/orders/execute?orderId=<ORDER_ID>` to receive real-time updates.

## Testing

Run unit tests:
```bash
npm test
```
