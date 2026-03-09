# VPULZ System Architecture

## High-level
Mobile/Web Client -> FastAPI Backend -> AI Orchestrator -> Model Providers + Retrieval

## Layers
- `routes/` transport layer
- `services/` business use-cases
- `repositories/` persistence abstraction
- `models/` domain entities
- `ai/` orchestration, model adapters, retrieval

## AI model strategy
- Fast model (Groq-hosted Llama): short latency interactions
- Reasoning model (Gemini): deeper analysis and planning
- Knowledge retrieval: vector search over strength-training documents

## Security and scalability
- API key/JWT middleware hook points
- stateless route handlers + swappable repos
- provider abstraction for model fallback and A/B rollout
- PostgreSQL + pgvector schema for durable storage and retrieval
