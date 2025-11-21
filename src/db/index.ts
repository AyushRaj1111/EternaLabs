import { Pool } from 'pg';

const pool = new Pool({
    user: process.env.POSTGRES_USER || 'user',
    host: process.env.POSTGRES_HOST || 'localhost',
    database: process.env.POSTGRES_DB || 'order_engine',
    password: process.env.POSTGRES_PASSWORD || 'password',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
});

export const initDb = async () => {
    const client = await pool.connect();
    try {
        await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY,
        type VARCHAR(20) NOT NULL,
        input_token VARCHAR(20) NOT NULL,
        output_token VARCHAR(20) NOT NULL,
        amount DECIMAL NOT NULL,
        status VARCHAR(20) NOT NULL,
        tx_hash VARCHAR(100),
        error TEXT,
        logs TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('Database initialized');
    } finally {
        client.release();
    }
};

export const saveOrder = async (order: any) => {
    const query = `
    INSERT INTO orders (id, type, input_token, output_token, amount, status, tx_hash, error, logs, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT (id) DO UPDATE SET
      status = EXCLUDED.status,
      tx_hash = EXCLUDED.tx_hash,
      error = EXCLUDED.error,
      logs = EXCLUDED.logs;
  `;
    const values = [
        order.id,
        order.type,
        order.inputToken,
        order.outputToken,
        order.amount,
        order.status,
        order.txHash,
        order.error,
        order.logs,
        order.createdAt,
    ];
    await pool.query(query, values);
};

export default pool;
