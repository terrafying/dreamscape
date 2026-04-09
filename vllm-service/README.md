# Gemma 4 (26B MoE) with Quantum Entropy Sampler

This directory contains a complete `docker-compose` setup to run **vLLM** serving the `google/gemma-4-26b-moe` model, with token sampling driven by the `qr-sampler` (Quantum Randomness Sampler) custom entropy source framework.

## Prerequisites
- Docker & Docker Compose
- NVIDIA GPU(s) with sufficient VRAM for a 26B MoE model (or tensor parallelism configured)
- NVIDIA Container Toolkit installed
- A Hugging Face token (if the model is gated)

## Setup

1. Configure your environment variables:
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` to add your `HF_TOKEN` if required by the Gemma model.*

2. Launch the stack:
   ```bash
   docker compose up --build -d
   ```

## Architecture

This stack deploys three services:
1. **`entropy-server`**: A gRPC server providing true randomness (defaults to `simple_urandom_server.py`, but can be connected to hardware QRNGs).
2. **`inference`**: The custom vLLM engine built with `qr-sampler` baked in. It registers as a custom logits processor in vLLM to override the standard PRNG with the quantum/entropy bytes from the `entropy-server`.
3. **`open-webui`**: A ChatGPT-style interface accessible at `http://localhost:3000` connected to your local vLLM instance.

## Usage

You can interact with the model via Open WebUI at `http://localhost:3000`, or directly via the OpenAI-compatible API at `http://localhost:8000/v1/completions`:

```bash
curl http://localhost:8000/v1/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "google/gemma-4-26b-moe",
    "prompt": "The nature of quantum mechanics implies that",
    "max_tokens": 100,
    "extra_args": {
      "qr_temperature_strategy": "edt",
      "qr_diagnostic_mode": true
    }
  }'
```

*Note: The `qr-sampler` repository source code is included in the `./qr-sampler` subdirectory. Modifying the entropy server implementation can be done inside `./qr-sampler/examples/servers/`.*