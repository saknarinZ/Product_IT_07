# ─────────────────────────────────────────────────────────────────────────────
# Stage 1: Builder
# Use the full Go SDK image to compile the binary.
# ─────────────────────────────────────────────────────────────────────────────
FROM golang:1.25.8-alpine AS builder

# Install git (needed by some Go modules that pull from VCS).
RUN apk add --no-cache git ca-certificates

WORKDIR /app

# Copy go.mod and go.sum first to leverage Docker layer caching.
# Dependencies are only re-downloaded when these files change.
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the source code.
COPY . .

# Build the binary.
# CGO_ENABLED=0  → produce a statically-linked binary (no libc dependency)
# -o /app/server → output path
# -ldflags "-s -w" → strip debug symbols to reduce binary size
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-s -w" -o /app/server ./cmd/api

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: Runtime
# Use a minimal Alpine image; only the compiled binary and certs are included.
# ─────────────────────────────────────────────────────────────────────────────
FROM alpine:3.20

# Security: run as non-root user.
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy only the compiled binary and TLS certificates from the builder stage.
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /app/server .

# Ensure the binary is executable.
RUN chmod +x /app/server

USER appuser

# Expose the application port (matches APP_PORT env var default).
EXPOSE 8080

# Start the server.
CMD ["/app/server"]
