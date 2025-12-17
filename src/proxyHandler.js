import { config } from './config.js';
import { secureClient } from './tinfoilClient.js';
import { URL } from 'url';

/**
 * Constructs the target URL for the proxy request.
 * @param {import('http').IncomingMessage} req
 * @returns {string}
 */
function getTargetUrl(req) {
    const baseURL = secureClient.getBaseURL();
    return new URL(req.url, baseURL).toString();
}

/**
 * Logs details about the incoming request.
 * @param {import('http').IncomingMessage} req
 */
function logIncomingRequest(req) {
    console.log(`[Proxy] Incoming request: ${req.method} ${req.url}`);
    console.log(`[Proxy] Incoming Request Headers:`, JSON.stringify(req.headers, null, 2));
    console.log(`[Proxy] Request Body: [Streamed]`);
}

/**
 * Prepares of headers for the upstream request.
 * @param {import('http').IncomingMessage} req
 * @returns {Record<string, string>}
 */
function prepareRequestHeaders(req) {
    const headers = { ...req.headers };

    // Remove headers that should not be forwarded or will be re-generated
    delete headers['host'];
    delete headers['content-length'];
    delete headers['connection'];

    // Use the API key from the request if provided, otherwise use the configured API key
    if (!headers['authorization']) {
        headers['authorization'] = 'Bearer ' + config.apiKey;
    }

    // Default content-type if missing
    if (!headers['content-type']) {
        headers['content-type'] = 'application/json';
    }

    return headers;
}

/**
 * Copies valid headers from the upstream response to the client response.
 * @param {Headers} upstreamHeaders
 * @param {import('http').ServerResponse} clientRes
 */
function copyResponseHeaders(upstreamHeaders, clientRes) {
    const problematicHeaders = ['content-encoding', 'content-length', 'transfer-encoding', 'connection'];
    upstreamHeaders.forEach((value, key) => {
        if (!problematicHeaders.includes(key.toLowerCase())) {
            clientRes.setHeader(key, value);
        }
    });
}

/**
 * Handles the upstream response, setting headers and streaming body.
 * @param {Response} response
 * @param {import('http').ServerResponse} clientRes
 */
async function handleUpstreamResponse(response, clientRes) {
    console.log(`[Proxy] Upstream Response Status: ${response.status} ${response.statusText}`);
    console.log(`[Proxy] Upstream Response Headers:`, JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));

    clientRes.status(response.status);
    copyResponseHeaders(response.headers, clientRes);

    if (response.body) {
        const stream = response.body;
        // Handle Node.js streams
        if (stream.pipe && typeof stream.pipe === 'function') {
            stream.pipe(clientRes);
        }
        // Handle Web Streams (e.g. from native fetch)
        else if (stream.getReader && typeof stream.getReader === 'function') {
            const reader = stream.getReader();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                clientRes.write(value);
            }
            clientRes.end();
        }
        // Fallback for buffer/text
        else {
            const arrayBuffer = await response.arrayBuffer();
            clientRes.end(Buffer.from(arrayBuffer));
        }
    } else {
        clientRes.end();
    }
}

export async function proxyHandler(req, res) {
    try {
        const url = getTargetUrl(req);

        logIncomingRequest(req);

        const headers = prepareRequestHeaders(req);

        const fetchOptions = {
            method: req.method,
            headers: headers,
            body: ['GET', 'HEAD'].includes(req.method) ? undefined : req,
            duplex: 'half'
        };

        console.log(`[Proxy] Outgoing Request URL: ${url}`);

        const response = await secureClient.fetch(url, fetchOptions);

        await handleUpstreamResponse(response, res);

    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).send({ error: 'Internal Server Error', details: error.message });
    }
}
