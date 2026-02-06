import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { Readable } from 'stream';

const mockResetTinfoil = jest.fn();
const mockGetBaseURL = jest.fn();
const mockFetch = jest.fn();

jest.unstable_mockModule('../src/tinfoilClient.js', () => ({
    secureClient: {
        getBaseURL: mockGetBaseURL,
        fetch: mockFetch
    },
    resetTinfoil: mockResetTinfoil,
    shouldReset: jest.fn().mockReturnValue(false)
}));

jest.unstable_mockModule('../src/config.js', () => ({
    config: {
        apiKey: undefined,
        port: 3000
    }
}));

describe('proxyHandler with optional API key', () => {
    let app;
    let proxyHandler;

    beforeAll(async () => {
        try {
            const mod = await import('../src/proxyHandler.js');
            proxyHandler = mod.proxyHandler;
        } catch (error) {
            console.error('Import Error:', error);
            throw error;
        }
    });

    beforeEach(() => {
        jest.clearAllMocks();
        app = express();
        app.use(express.json());
        if (proxyHandler) {
            app.use(proxyHandler);
        }
    });

    test('should not add authorization header if not provided in config or request', async () => {
        mockGetBaseURL.mockReturnValue('https://api.tinfoil.ai/v1');
        mockFetch.mockResolvedValue({
            status: 200,
            statusText: 'OK',
            headers: new Map(),
            body: {},
            arrayBuffer: async () => Buffer.from('{}')
        });

        await request(app).get('/test-no-auth');

        const fetchCall = mockFetch.mock.calls[0];
        const fetchOptions = fetchCall[1];
        expect(fetchOptions.headers['authorization']).toBeUndefined();
    });

    test('should pass through authorization header from request if provided', async () => {
        mockGetBaseURL.mockReturnValue('https://api.tinfoil.ai/v1');
        mockFetch.mockResolvedValue({
            status: 200,
            statusText: 'OK',
            headers: new Map(),
            body: {},
            arrayBuffer: async () => Buffer.from('{}')
        });

        await request(app)
            .get('/test-auth')
            .set('Authorization', 'Bearer user-token');

        const fetchCall = mockFetch.mock.calls[0];
        const fetchOptions = fetchCall[1];
        expect(fetchOptions.headers['authorization']).toBe('Bearer user-token');
    });
});
