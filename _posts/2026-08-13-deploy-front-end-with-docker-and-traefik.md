---
layout: post
title: "Deploy a Front-End App with Docker and Traefik"
date: 2026-08-13
description: Deploy a production front-end application with a multi-stage Docker build, Nginx, Traefik routing, and automatic HTTPS from Let's Encrypt.
image: /assets/images/posts/deploy-front-end-docker-traefik.jpg
---

A front-end deployment needs more than a development server. The application
must be built into static assets, served efficiently, routed from a real domain,
and protected with HTTPS. Docker packages those pieces consistently, while
Traefik discovers the container, routes requests, and manages TLS certificates.

This guide deploys a typical Vite, React, Vue, or similar single-page app using
a multi-stage Docker build, Nginx, Docker Compose, Traefik, and Let's Encrypt.

## How the stack fits together

The request path is deliberately simple:

1. The browser connects to ports 80 or 443 on the server.
2. Traefik redirects HTTP to HTTPS and selects a container from its routing
   labels.
3. Traefik terminates TLS and forwards the request through a private Docker
   network.
4. Nginx serves the compiled HTML, CSS, JavaScript, and other static assets.

The front-end container does not publish a host port. Only Traefik is exposed to
the internet, which avoids port conflicts when more applications join the same
server.

## Prerequisites

You need a Linux server with Docker Engine and Docker Compose, plus:

- A domain or subdomain such as `app.example.com`
- An A or AAAA DNS record pointing that name to the server
- Inbound TCP ports 80 and 443 allowed by the firewall
- A front-end project whose `npm run build` command produces static files

Let's Encrypt's HTTP challenge requires the domain to reach Traefik on port 80.
Wait for DNS to resolve correctly before starting the production stack.

## Build a small production image

Use one image stage to install dependencies and build the application, then copy
only the result into Nginx:

```dockerfile
# syntax=docker/dockerfile:1
FROM node:24-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.29-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
```

This is a multi-stage build: Node and the source code stay in the build stage,
while the final image contains only Nginx and the compiled assets. If your tool
outputs `build` rather than `dist`, change the source path in the last `COPY`.

Add a `.dockerignore` so local dependencies and build output are not sent to the
Docker builder:

```text
.git
node_modules
dist
build
.env*
npm-debug.log*
```

Front-end environment variables are usually embedded during the build. Never
put a secret in a client-side variable: anything shipped to the browser can be
read by a user.

## Configure Nginx for client-side routing

A single-page app needs unknown paths such as `/settings/profile` to return
`index.html`; the client router handles the route after that. Create
`nginx.conf` beside the Dockerfile:

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(?:css|js|mjs|jpg|jpeg|png|gif|svg|webp|ico|woff2?)$ {
        try_files $uri =404;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

The long cache lifetime is appropriate when the build tool fingerprints asset
filenames. `index.html` is intentionally outside that rule so a new deployment
can point users to the newest asset names.

## Add Traefik and the app to Compose

Create `compose.yaml` in the project root:

```yaml
services:
  traefik:
    image: traefik:v3.6
    restart: unless-stopped
    security_opt:
      - no-new-privileges:true
    command:
      - --providers.docker=true
      - --providers.docker.exposedbydefault=false
      - --providers.docker.network=proxy
      - --entrypoints.web.address=:80
      - --entrypoints.web.http.redirections.entrypoint.to=websecure
      - --entrypoints.web.http.redirections.entrypoint.scheme=https
      - --entrypoints.websecure.address=:443
      - --certificatesresolvers.letsencrypt.acme.email=${ACME_EMAIL}
      - --certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json
      - --certificatesresolvers.letsencrypt.acme.httpchallenge=true
      - --certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - letsencrypt:/letsencrypt
    networks:
      - proxy

  frontend:
    build:
      context: .
    restart: unless-stopped
    networks:
      - proxy
    labels:
      - traefik.enable=true
      - "traefik.http.routers.frontend.rule=Host(`${APP_HOST}`)"
      - traefik.http.routers.frontend.entrypoints=websecure
      - traefik.http.routers.frontend.tls=true
      - traefik.http.routers.frontend.tls.certresolver=letsencrypt
      - traefik.http.services.frontend.loadbalancer.server.port=80

networks:
  proxy:
    name: proxy

volumes:
  letsencrypt:
```

There are several details worth keeping:

- `exposedbydefault=false` means Traefik ignores containers unless they opt in
  with `traefik.enable=true`.
- The host rule connects one domain to the `frontend` router.
- The service-port label explicitly tells Traefik that Nginx listens on port 80.
- The named volume preserves Let's Encrypt account and certificate data when
  containers are recreated.
- The Docker socket is mounted read-only because Traefik needs Docker events and
  metadata for discovery.

Docker API access is still security-sensitive even with a read-only mount. For
a hardened or multi-tenant host, follow Traefik's guidance and place an
authorization layer or restricted socket proxy between Traefik and Docker.

## Configure and deploy

Place non-secret deployment values in a `.env` file beside `compose.yaml`:

```dotenv
APP_HOST=app.example.com
ACME_EMAIL=ops@example.com
```

First render the final Compose configuration. This catches missing variables
and YAML mistakes before containers change:

```bash
docker compose config
```

Then build and start the stack:

```bash
docker compose up -d --build
docker compose ps
docker compose logs --tail=100 traefik frontend
```

Verify both the redirect and the secure response:

```bash
curl -I http://app.example.com
curl -I https://app.example.com
```

The first request should redirect to HTTPS. The second should return the app
through a trusted certificate after Let's Encrypt validation completes.

For later releases, pull the newest code and run `docker compose up -d --build`
again. Compose replaces the changed front-end container while leaving the
certificate volume intact. In a larger delivery pipeline, build and scan the
image in CI, push it to a registry, and deploy an immutable tag or digest rather
than building on the server.

## Common problems

- **Certificate issuance fails:** confirm public DNS, ports 80 and 443, and the
  Traefik logs. A private hostname cannot pass the public HTTP challenge.
- **Traefik returns 404:** check the host rule, `APP_HOST`, and the
  `traefik.enable=true` label.
- **Traefik returns 502:** confirm both services share the `proxy` network and
  the load-balancer port is 80.
- **Refreshing a nested URL returns 404:** confirm Nginx uses the `try_files`
  fallback to `/index.html`.
- **A deployment still looks old:** inspect cache headers. Only fingerprinted
  assets should receive a long immutable cache lifetime.

## Takeaways

- Build the front end in one stage and serve only its static output in the final
  image.
- Keep Nginx internal; let Traefik own public ports, domains, redirects, and TLS.
- Disable automatic container exposure and opt in with explicit labels.
- Persist ACME data and protect access to the Docker API.
- Validate the rendered Compose file and test HTTP and HTTPS after every change.

This pattern starts small but scales cleanly: additional applications can join
the same proxy network and define their own host rules without duplicating the
TLS and ingress setup.

## Sources

- [Docker: Multi-stage builds](https://docs.docker.com/build/building/multi-stage/)
- [Docker: Building best practices](https://docs.docker.com/build/building/best-practices/)
- [Traefik: Set up Traefik on Docker](https://doc.traefik.io/traefik/v3.6/setup/docker/)
- [Traefik: Docker provider configuration and security](https://doc.traefik.io/traefik/v3.6/reference/install-configuration/providers/docker/)
- [Traefik: Let's Encrypt with Docker](https://doc.traefik.io/traefik/v3.6/expose/docker/advanced/#generate-certificates-with-lets-encrypt)
- [Nginx official Docker image](https://hub.docker.com/_/nginx/)
