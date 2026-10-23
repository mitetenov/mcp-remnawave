# syntax=docker/dockerfile:1.28.0
FROM --platform=$BUILDPLATFORM golang:1.27.3-alpine3.24 AS build
ENV GOTOOLCHAIN=local
WORKDIR /src

# Runtime files are independent of application sources and dependency changes.
RUN mkdir -p /out/rootfs/app /out/rootfs/etc/ssl/certs /out/rootfs/tmp /out/rootfs/home/appuser \
    && cp /etc/ssl/certs/ca-certificates.crt /out/rootfs/etc/ssl/certs/ca-certificates.crt \
    && printf 'root:x:0:0:root:/root:/sbin/nologin\nappuser:x:100:101:Linux User,,,:/home/appuser:/sbin/nologin\n' > /out/rootfs/etc/passwd \
    && printf 'root:x:0:\nappgroup:x:101:appuser\n' > /out/rootfs/etc/group \
    && chmod 1777 /out/rootfs/tmp \
    && chown 100:101 /out/rootfs/home/appuser

COPY go.mod go.sum ./
# Keep cumulative local downloads, then materialize dependencies in a regular
# layer: exported CI caches do not contain cache-mount contents.
RUN --mount=type=cache,id=remnawave-gomod,target=/go/pkg/mod,sharing=locked \
    go mod download \
    && mkdir -p /opt/gomodcache \
    && cp -a /go/pkg/mod/. /opt/gomodcache/
ENV GOMODCACHE=/opt/gomodcache

# Tests, fixtures, docs and local secrets never enter the production context.
COPY cmd/remnawave-mcp/main.go ./cmd/remnawave-mcp/main.go
COPY internal/remnawave/*.go internal/remnawave/*.json ./internal/remnawave/
ARG TARGETOS
ARG TARGETARCH
RUN --network=none --mount=type=cache,id=remnawave-gobuild,target=/root/.cache/go-build \
    CGO_ENABLED=0 GOOS=${TARGETOS} GOARCH=${TARGETARCH} \
    go build -mod=readonly -buildvcs=false -trimpath -ldflags='-s -w' \
    -o /out/rootfs/app/remnawave-mcp ./cmd/remnawave-mcp

FROM scratch AS production
COPY --from=build /out/rootfs/ /
WORKDIR /app
ENV PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
USER appuser
EXPOSE 3100
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 CMD ["/app/remnawave-mcp", "healthcheck"]
ENTRYPOINT ["/app/remnawave-mcp"]
CMD ["http"]
