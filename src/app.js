import express from 'express';
import { proxyHandler } from './proxyHandler.js';

export const app = express();

// Catch-all route to proxy requests
app.use(proxyHandler);
