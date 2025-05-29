# Qubots Execution Environment
# Container that runs qubots optimizations with support for complex dependencies

FROM python:3.13-slim

# Build argument for qubots version (defaults to latest)
ARG QUBOTS_VERSION=""

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PATH="/home/playground/.local/bin:$PATH"

# Install system dependencies including build tools for complex packages
RUN apt-get update && apt-get install -y \
    git \
    gcc \
    g++ \
    make \
    build-essential \
    python3-dev \
    libffi-dev \
    libssl-dev \
    curl \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Create workspace directory
WORKDIR /workspace

# Install qubots from PyPI (latest published version)
# Use --upgrade to ensure we get the latest version even if cached
# Support specific version via build arg: docker build --build-arg QUBOTS_VERSION=1.2.3
RUN if [ -n "$QUBOTS_VERSION" ]; then \
        echo "Installing qubots version: $QUBOTS_VERSION"; \
        pip3 install --no-cache-dir qubots==$QUBOTS_VERSION; \
    else \
        echo "Installing latest qubots version"; \
        pip3 install --no-cache-dir --upgrade qubots; \
    fi

# Install minimal runtime dependencies (including psutil which needs build tools)
RUN pip3 install --no-cache-dir \
    requests \
    flask \
    flask-cors \
    psutil

# Copy execution scripts
COPY scripts/execute.py /workspace/execute.py
COPY qubots_api_server.py /workspace/qubots_api_server.py

# Create user for security
RUN useradd -m -s /bin/bash playground && \
    chown -R playground:playground /workspace

# Switch to playground user
USER playground

# Expose API port
EXPOSE 8000

# Default command - start the API server
CMD ["python3", "qubots_api_server.py"]
