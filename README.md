# Tinfoil Docker Proxy

A secure, Node.js-based Docker proxy that forwards OpenAI-compatible requests to Tinfoil AI. This project leverages the **Tinfoil SecureClient** to ensure all interactions are encrypted and attested, guaranteeing execution privacy.

## Features

- **OpenAI Compatibility**: Drop-in replacement for OpenAI API clients (proxies `/v1/models`, `/v1/chat/completions`, etc.).
- **Privacy & Security**: Uses the Tinfoil OS `SecureClient` to perform remote attestation and end-to-end encryption.
- **Automatic Recovery**: Built-in automatic retry and reset logic handles key mismatches and enclave restarts.
- **Streaming Support**: Fully supports streaming responses for chat completions (Node.js & Web Streams).
- **Dockerized**: specific `Dockerfile` included for easy deployment.
- **Header Management**: Automatically handles Tinfoil API authentication and cleans up hop-by-hop headers.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed.
- **Tinfoil API Key**. You can obtain one from the [Tinfoil Dashboard](https://tinfoil.sh). (Optional if provided in requests)
- (Optional) Node.js v18+ for local development.

## Installation

### Clone the Repository

```bash
git clone https://github.com/d1vanloon/tinfoil-docker-proxy.git
cd tinfoil-docker-proxy
```

### Configuration

Create a `.env` file in the root directory (or use environment variables in Docker):

```ini
# Optional: Your Tinfoil API Key
# If not provided here, it must be provided in the Authorization header of each request.
TINFOIL_API_KEY=your_tinfoil_api_key_here

# Optional: Server Port (default: 3000)
PORT=3000
```

## Usage

### Running from GitHub Container Registry (Recommended)

Pre-built Docker images are automatically published to GitHub Container Registry. You can pull and run them directly without building locally.

1. **Pull the latest image:**

   ```bash
   docker pull ghcr.io/d1vanloon/tinfoil-docker-proxy:latest
   ```

2. **Run the container:**

   ```bash
   docker run -d \
     -e TINFOIL_API_KEY=your_api_key \
     -p 3000:3000 \
     --name tinfoil-proxy \
     ghcr.io/d1vanloon/tinfoil-docker-proxy:latest
   ```

   **Using a specific version:**

   ```bash
   docker pull ghcr.io/d1vanloon/tinfoil-docker-proxy:v1.0.0
   docker run -d \
     -e TINFOIL_API_KEY=your_api_key \
     -p 3000:3000 \
     --name tinfoil-proxy \
     ghcr.io/d1vanloon/tinfoil-docker-proxy:v1.0.0
   ```

### Building and Running with Docker Locally

If you prefer to build the image yourself:

1. **Build the image:**

   ```bash
   docker build -t tinfoil-proxy .
   ```

2. **Run the container:**

   ```bash
   docker run -d \
     -e TINFOIL_API_KEY=your_api_key \
     -p 3000:3000 \
     --name tinfoil-proxy \
     tinfoil-proxy
   ```

### Running Locally (Development)

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Start the server:**

   ```bash
   npm start
   ```

   The server will verify the Tinfoil environment and start listening on port 3000.

### Testing

Run the test suite to verify functionality:

```bash
npm test
```

## API Usage

Once the proxy is running, point your OpenAI client or standard HTTP requests to `http://localhost:3000`.

**Example: PowerShell Request (using configured API key)**

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/v1/chat/completions" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{
    "model": "gpt-oss-120b",
    "messages": [
      { "role": "user", "content": "Hello, Tinfoil!" }
    ]
  }' | ConvertTo-Json -Depth 10
```

**Example: PowerShell Request with custom API key**

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/v1/chat/completions" `
  -Method Post `
  -ContentType "application/json" `
  -Headers @{ Authorization = "Bearer your_custom_api_key" } `
  -Body '{
    "model": "gpt-oss-120b",
    "messages": [
      { "role": "user", "content": "Hello, Tinfoil!" }
    ]
  }' | ConvertTo-Json -Depth 10
```

## How It Works

1. **Initialization**: On startup, the `SecureClient` authenticates with the Tinfoil platform and verifies the execution environment (TEE) using remote attestation. If verification fails, the server will not start.
2. **Request Handling**: Incoming requests (e.g., from an LLM client) are intercepted.
3. **API Key Management**: The proxy uses the API key provided in the request's `Authorization` header if present. If no API key is provided by the client, it falls back to the configured `TINFOIL_API_KEY` environment variable. This allows clients to use their own API keys while maintaining backward compatibility.
4. **Security**: Requests are forwarded over an encrypted channel established by the `SecureClient`.
5. **Streaming**: Responses from Tinfoil are streamed back to the client in real-time, preserving standard OpenAI chunk formats.

## About Tinfoil AI

Tinfoil AI provides an API for running LLMs inside secure enclaves (TEEs). This ensures that:
- **Data Privacy**: Your prompts and data are encrypted in transit and in use. Tinfoil AI cannot see your data.
- **Model Integrity**: You are guaranteed that the code running is exactly what was attested.

For more information, visit [tinfoil.sh](https://tinfoil.sh).

## Disclaimers

- **Unofficial**: This project is community-maintained and is not officially associated with Tinfoil AI.
- **Security**: This proxy is intended for local use or within a secure private network. **Do not expose this service directly to the public internet** without additional authentication and security layers.
