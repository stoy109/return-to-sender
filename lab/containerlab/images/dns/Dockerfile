# Tiny dnsmasq image for the RTS lab DNS filter.
# Build (rootful Podman): sudo podman build -t localhost/rts-dns:latest images/dns
FROM docker.io/library/alpine:3.22
RUN apk add --no-cache dnsmasq bind-tools iproute2
# Keep the container alive; dns-init.sh starts dnsmasq after eth1 is addressed.
CMD ["sleep", "infinity"]
