import { config } from './config.js';
import { initializeTinfoil } from './tinfoilClient.js';
import { app } from './app.js';

async function startServer() {
    try {
        await initializeTinfoil();

        app.listen(config.port, () => {
            console.log(`Tinfoil proxy listening on port ${config.port}`);
        });

    } catch (error) {
        console.error('Failed to start proxy server:', error);
        process.exit(1);
    }
}

startServer();
