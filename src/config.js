import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.TINFOIL_API_KEY;
const port = process.env.PORT || 3000;

const resetInterval = parseInt(process.env.TINFOIL_RESET_INTERVAL || '3600', 10);

export const config = {
    apiKey,
    port,
    resetInterval
};
