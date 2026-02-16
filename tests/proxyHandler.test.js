import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { Readable } from 'stream';

// Mock dependencies
const mockGetBaseURL = jest.fn();
const mockFetch = jest.fn();

jest.unstable_mockModule('../src/tinfoilClient.js', () => ({
    secureClient: {
        getBaseURL: mockGetBaseURL,
        fetch: mockFetch
    }
}));

jest.unstable_mockModule('../src/config.js', () => ({
    config: {
        apiKey: 'test-api-key',
        port: 3000
    }
}));

describe('proxyHandler', () => {
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

    test('should successfully proxy request', async () => {
        // Arrange
        mockGetBaseURL.mockReturnValue('https://api.tinfoil.ai/v1');

        const mockResponse = {
            status: 200,
            statusText: 'OK',
            statusText: 'OK',
            headers: new Map([['content-type', 'application/json']]),
            body: Readable.from([JSON.stringify({ success: true })]),
            arrayBuffer: async () => new TextEncoder().encode(JSON.stringify({ success: true })).buffer
        };
        mockFetch.mockResolvedValue(mockResponse);

        // Act
        const res = await request(app)
            .post('/v1/chat/completions')
            .send({ model: 'gpt-4' });

        // Assert
        expect(mockGetBaseURL).toHaveBeenCalled();
        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('https://api.tinfoil.ai/v1/chat/completions'),
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    'content-type': 'application/json'
                })
            })
        );
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ success: true });
    });

    test('should handle header manipulation', async () => {
        // Arrange
        mockGetBaseURL.mockReturnValue('https://api.tinfoil.ai/v1');
        mockFetch.mockResolvedValue({
            status: 200,
            statusText: 'OK',
            headers: new Map(),
            arrayBuffer: async () => Buffer.from('')
        });

        // Act
        await request(app)
            .get('/models')
            .set('Host', 'malicious.com')
            .set('Content-Length', '100');

        // Assert
        const fetchCall = mockFetch.mock.calls[0];
        const fetchOptions = fetchCall[1];

        // Host and Content-Length should be removed/handled
        expect(fetchOptions.headers['host']).toBeUndefined();
        expect(fetchOptions.headers['content-length']).toBeUndefined();
        // Authorization should be injected if missing
        expect(fetchOptions.headers['authorization']).toBeDefined();
    });

    test('should handle upstream errors', async () => {
        // Arrange
        mockGetBaseURL.mockReturnValue('https://api.tinfoil.ai/v1');
        mockFetch.mockRejectedValue(new Error('Network error'));

        // Act
        const res = await request(app).get('/test');

        // Assert
        expect(res.status).toBe(500);
        expect(res.body).toEqual(expect.objectContaining({
            error: 'Internal Server Error'
        }));
    });

    test('should filter response headers', async () => {
        // Arrange
        mockGetBaseURL.mockReturnValue('https://api.tinfoil.ai/v1');
        const mockResponse = {
            status: 200,
            statusText: 'OK',
            headers: new Map([
                ['content-encoding', 'gzip'],
                ['x-custom-header', 'value']
            ]),
            arrayBuffer: async () => Buffer.from('')
        };
        mockFetch.mockResolvedValue(mockResponse);

        // Act
        const res = await request(app).get('/test');

        // Assert
        expect(res.headers['content-encoding']).toBeUndefined();
        expect(res.headers['x-custom-header']).toBe('value');
    });

    test('should not include body for GET requests', async () => {
        // Arrange
        mockGetBaseURL.mockReturnValue('https://api.tinfoil.ai/v1');
        mockFetch.mockResolvedValue({
            status: 200,
            statusText: 'OK',
            headers: new Map(),
            arrayBuffer: async () => Buffer.from('{}')
        });

        // Act
        await request(app).get('/test-get');

        // Assert
        const fetchCall = mockFetch.mock.calls[0];
        const fetchOptions = fetchCall[1];
        expect(fetchOptions.method).toBe('GET');
        expect(fetchOptions.body).toBeUndefined();
    });

    test('should preserve existing authorization header', async () => {
        // Arrange
        mockGetBaseURL.mockReturnValue('https://api.tinfoil.ai/v1');
        mockFetch.mockResolvedValue({
            status: 200,
            statusText: 'OK',
            headers: new Map(),
            arrayBuffer: async () => Buffer.from('{}')
        });

        const customAuth = 'Bearer custom-token';

        // Act
        await request(app)
            .get('/test-auth')
            .set('Authorization', customAuth);

        // Assert
        const fetchCall = mockFetch.mock.calls[0];
        const fetchOptions = fetchCall[1];
        expect(fetchOptions.headers['authorization']).toBe(customAuth);
    });

    test('should use arrayBuffer fallback for response if stream unavailable', async () => {
        // Arrange
        mockGetBaseURL.mockReturnValue('https://api.tinfoil.ai/v1');
        const responseText = 'Fallback response';

        // Response with no streaming capabilities
        const mockResponse = {
            status: 200,
            statusText: 'OK',
            headers: new Map(),
            body: {}, // Truthy body but no stream methods
            arrayBuffer: async () => Buffer.from(responseText)
        };
        mockFetch.mockResolvedValue(mockResponse);

        // Act
        const res = await request(app).get('/test-fallback');

        // Assert
        expect(res.status).toBe(200);
        expect(res.text).toBe(responseText);
    });
});
