import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.TINFOIL_API_KEY;
const port = process.env.PORT || 3000;

if (!apiKey) {
    console.error('Error: TINFOIL_API_KEY environment variable is not set.');
    process.exit(1);
}

export const config = {
    apiKey,
    port
};
