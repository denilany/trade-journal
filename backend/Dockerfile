# syntax=docker/dockerfile:1
FROM golang:1.22-alpine AS builder
RUN apk add --no-cache git ca-certificates && update-ca-certificates
WORKDIR /app
COPY backend/go.mod ./
# go.sum may not exist yet; handle gracefully
RUN go mod download || true
COPY backend/ ./
RUN go build -ldflags="-s -w" -o /out/server ./cmd/server

FROM alpine:3.20
RUN apk add --no-cache ca-certificates && adduser -D -H app
USER app
WORKDIR /home/app
COPY --from=builder /out/server ./server
EXPOSE 8080
ENV PORT=8080
CMD ["./server"]