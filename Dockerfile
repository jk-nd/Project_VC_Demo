# For a production setup, we strongly recommend to use the *actual* version number!
FROM ghcr.io/noumenadigital/images/engine:latest

LABEL org.opencontainers.image.source = "https://github.com/juerg/Project-VC-Demo"

ENV ENGINE_NPL_MIGRATION_DIRECTORY_PATH="/npl"

# Files in npl/npl-1.0.0 contain NPL source code
COPY src/main/yaml /npl/yaml
COPY src/main/npl-1.0.0 /npl/npl-1.0.0 