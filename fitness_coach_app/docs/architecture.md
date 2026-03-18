# Architecture

- Presentation: controllers/routes
- Application: services
- Domain: dataclasses in models
- Infrastructure: database and external integrations
- Cross-cutting: middleware + security utils

Security notes:
- Bearer auth gate in middleware
- Sensitive hash helper in utils
- Environment-driven configuration
