# Deployment Guide (Render.com)

This guide explains how to deploy the Order Execution Engine to Render.com using their free tier.

## Prerequisites
- A GitHub account (where this repo is pushed).
- A [Render.com](https://render.com) account.

## Steps

### 1. Database (PostgreSQL)
1.  Go to your Render Dashboard and click **New +** -> **PostgreSQL**.
2.  **Name**: `order-engine-db`
3.  **Region**: Choose one close to you (e.g., Singapore, Frankfurt).
4.  **PostgreSQL Version**: 15 or 16.
5.  **Instance Type**: **Free**.
6.  Click **Create Database**.
7.  **Wait** for it to be created.
8.  **Copy** the `Internal Database URL` (we'll need this later).

### 2. Redis
1.  Click **New +** -> **Redis**.
2.  **Name**: `order-engine-redis`
3.  **Region**: Same as your database.
4.  **Instance Type**: **Free**.
5.  Click **Create Redis**.
6.  **Copy** the `Internal Redis URL` (e.g., `redis://...:6379`).

### 3. Web Service (The App)
1.  Click **New +** -> **Web Service**.
2.  Select **Build and deploy from a Git repository**.
3.  Connect your GitHub account and select the `EternaLabs` repository.
4.  **Name**: `order-execution-engine`
5.  **Region**: Same as DB/Redis.
6.  **Branch**: `main`
7.  **Runtime**: **Node**.
8.  **Build Command**: `npm install && npm run build` (Note: You might need to add a build script if you haven't compiled TS yet. For now, use `npm install && npx tsc`)
    - *Correction*: Add `"build": "tsc"` to your `package.json` scripts first if it's missing.
    - Command: `npm install && npm run build`
9.  **Start Command**: `npm start` or `node dist/app.js`
    - *Correction*: Ensure you have a start script. `node dist/app.js` is likely correct after build.
10. **Instance Type**: **Free**.
11. **Environment Variables** (Click "Advanced"):
    - `POSTGRES_HOST`: The hostname from your Internal DB URL (e.g., `dpg-xyz-a`).
    - `POSTGRES_USER`: The user from DB details.
    - `POSTGRES_PASSWORD`: The password from DB details.
    - `POSTGRES_DB`: `order_engine` (or whatever the default DB name is on Render, usually same as user).
    - `POSTGRES_PORT`: `5432`
    - `REDIS_HOST`: The hostname from Redis URL.
    - `REDIS_PORT`: `6379`
    - `NODE_ENV`: `production`
12. Click **Create Web Service**.

## Verification
Once deployed, Render will give you a URL (e.g., `https://order-execution-engine.onrender.com`).
You can test it using the Postman collection, replacing `localhost:3000` with your new URL.
