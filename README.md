# Traefik Error Pages

This project consist of a middleware for Traefik that allows you to serve custom error pages for different HTTP error codes.

## Features

- Serve custom error pages for different HTTP error codes
- Serve custom error pages for different Hosts
- Serve static error pages
- Serve redirect error pages
- Serve a reverse proxy error page

## Usage

### Installation

#### Traefik

If you want the middleware to work for ALL the services you have in Traefik, you can follow the next steps:

1. Add the middleware to the Traefik entrypoint
```yaml
entryPoints:
  web:
    address: ":80"
    middlewares:
      - error-pages
```

2. Deploy the middleware (example with Docker Compose)
```yaml
services:
  errors:
    image: docker.ibaraki.app/traefik/errors:latest
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.errors.entrypoints=web"
      - "traefik.http.services.errors.loadbalancer.server.port=3000"
      - "traefik.http.middlewares.error-pages.errors.status=400-599"
      - "traefik.http.middlewares.error-pages.errors.service=errors@docker"
      - "traefik.http.middlewares.error-pages.errors.query=/{status}"
      - "traefik.http.routers.errors.rule=HostRegexp(`.+`)" # V3.0 | If you want to use the middleware also for non existing hosts
      - "traefik.http.routers.errors.rule=HostRegexp(`{host:.+}`)" # V2.11 | If you want to use the middleware also for non existing hosts
      - "traefik.http.routers.errors.priority=-1" # V3.0 and V2.11 | If you want to use the middleware also for non existing hosts
    volumes:
      - "./config.json:/config.json:ro"
      - "./pages:/pages:ro"
    networks:
      - web
```

If you want the middleware to work for a specific service, you can follow the next steps:

1. Add the middleware to your service
```yaml
services:
  my-service:
    image: my-service:latest
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.my-service.rule=Host(`my.host.com`)"
      - "traefik.http.routers.my-service.entrypoints=web"
      - "traefik.http.routers.my-service.middlewares=error-pages"
```

2. Deploy the middleware (example with Docker Compose)
```yaml
services:
  errors:
    image: docker.ibaraki.app/traefik/errors:latest
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.errors.entrypoints=web"
      - "traefik.http.services.errors.loadbalancer.server.port=3000"
      - "traefik.http.middlewares.error-pages.errors.status=400-599"
      - "traefik.http.middlewares.error-pages.errors.service=errors@docker"
      - "traefik.http.middlewares.error-pages.errors.query=/{status}"
    volumes:
      - "./config.json:/config.json:ro"
      - "./pages:/pages:ro"
    networks:
      - web
```


### Environment Variables

- `PAGE_PATH`: Path to the error pages inside the container (default: `/pages`)
- `PAGE_CONFIG`: Path to the configuration file inside the container (default: `/config.json`)
- `PORT`: Port where the middleware will listen (default: `3000`)

### Configuration

```json
{
    "pages": {
        "404": { // HTTP error code or * for all
            "my.host.com": "404.html", // Host or * for all | Path to the error page (relative to the PAGE_PATH environment variable)
        }
    },
    "reverseProxies": {
        "404": { // HTTP error code or * for all
            "my.host.com": { // Host or * for all
                "proxyHost": "my.proxy.com", // Host of the reverse proxy (and the port if needed)
                "proxyPath": "/404", // Path of the reverse proxy
                "sheme": "http" // Sheme of the reverse proxy
            }
        }
    },
    "redirects": {
        "404": { // HTTP error code or * for all
            "my.host.com": { // Host or * for all
                "redirectHost": "my.redirect.com", // Host of the redirect (and the port if needed)
                "redirectPath": "/404", // Path of the redirect
                "scheme": "http" // Sheme of the redirect
            }
        }
    }
}
```

For the `redirects` you can make either the `redirectHost` or the `redirectPath` optional to use the current host or root path.

### Order of precedence

1. Reverse Proxy With Specific Host and Error Code
2. Redirect With Specific Host and Error Code
3. Static Page With Specific Host and Error Code

4. Reverse Proxy With All Host and Specific Error Code
5. Redirect With All Host and Specific Error Code
6. Static Page With All Host and Specific Error Code

7. Reverse Proxy With Specific Host and All Error Code
8. Redirect With Specific Host and All Error Code
9. Static Page With Specific Host and All Error Code

10. Reverse Proxy With All Host and All Error Code
11. Redirect With All Host and All Error Code
12. Static Page With All Host and All Error Code

## Development

### Requirements

- Node.js
- NPM

### Installation

1. Clone the repository
2. Install the dependencies
```bash
npm install
```

### Usage
You can run the middleware with the following command:
```bash
docker compose -f docker-compose.dev.yml up --build
```

It will start a traefik container with 2 nginx containers to test reverse proxy and redirect error pages.
It will also start the middleware with the configuration file and the error pages. (by default it will use the `config.json` and `pages` folder in the root of the project)

I also recommend using `dnsmasq` to test the middleware with custom hosts. (my conf added `address=/localhost/127.0.0.1` to the `dnsmasq.conf` file for `*.localhost` to point to `127.0.0.1`)