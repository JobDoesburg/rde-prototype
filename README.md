# RDE prototype
This repository contains simple docker-compose configuration for the proof-of-concept RDE prototype.
It contains submodules for different components of the RDE prototype. 
Most notably, it enables a demo page that shows the RDE prototype in action (not implemented for a specific application).

Note that for the purpose of the demo, this repository contains a pre-built debug APK of the RDE Android app.
The source code for the RDE Android app can be found at [https://gitlab.surf.nl/filesender/rde-client-android](https://gitlab.surf.nl/filesender/rde-client-android).

Also note that a pre-built version of the report is included. If the LaTeX sources change, this should be recompiled.

## Components
The RDE prototype consists of the following components:
- [RDE keyserver](https://gitlab.surf.nl/filesender/rde-keyserver), which is used to store enrolled RDE keys for user identities, using email addresses via SAML, and make them available via a REST API.
- [RDE client proxyserver](https://gitlab.surf.nl/filesender/rde-client-proxyserver), which is used to enable communication between a RDE browser client and the RDE Android client app.
- [RDE Android client app](https://gitlab.surf.nl/filesender/rde-client-android), which is used to actually communicate with RDE documents: enroll them and use them to retrieve keys. This app, in its turn, uses the [RDE Java client library](https://gitlab.surf.nl/filesender/rde-java-client) (written in Kotlin). As this is an Android app, it is not included as a submodule in this repository.
- [RDE JS client library](https://gitlab.surf.nl/filesender/rde-js-client) (written in TypeScript), which consists of two modules, one for generating RDE keys and one for interacting with the RDE Android client app.
- [RDE demo](https://gitlab.surf.nl/filesender/rde-prototype/-/tree/main/rde-demo), a demo website that uses the RDE JS client library to generate RDE keys and interact with the RDE Android client app to retrieve them again.

## Installation
1. Install docker and docker-compose: `sudo apt install docker docker-compose`
2. Clone this repository: `git clone --recursive git@gitlab.surf.nl:filesender/rde-prototype.git`
3. Verify the configuration in `docker-compose.yml`.
4. Generate the required certificates (see below).
5. Start all services: `docker-compose up -d --build` (`--build` is only required the first time, or when the configuration changes to force building new containers).

## Configuration
The configuration of the RDE prototype is done in the `docker-compose.yml` file.

### Demo
The demo website is configured in the `demo` section of the `docker-compose.yml` file.
The following environment variables should be set:

- `KEYSERVER_URL`: The url of the keyserver to use, e.g. `https://keyserver.example.com`.
- `PROXYSERVER_URL`: The url of the proxyserver to use, e.g. `https://proxyserver.example.com` (used for opening new socket connections).
- `PROXYSERVER_WS_URL`: The websocket base url of the proxyserver to use, e.g. `wss://proxyserver.example.com`.

By default, the demo uses the Dutch CSCA certificates of 2022 (see `rde-demo/CSCA-NL-2022.json`), for verifying enrollment parameters.
To use a different set of CSCA certificates, a JSON file can be mounted at `/usr/share/nginx/html/certificates.json` in the container.
Alternatively, the `CERTIFICATES_JSON_URL` environment variable can be set to the url of a JSON file containing the trusted CSCA certificates.

### Keyserver
The RDE keyserver is configured in the `keyserver` section of the `docker-compose.yml` file.
The following environment variables should be set:

- `DJANGO_SECRET_KEY`: The secret key used by Django.
- `DJANGO_ALLOWED_HOSTS`: The allowed hosts for Django, comma separated, e.g. `keyserver.example.com` or `keyserver.example.com,keyserver2.example.com`.
- `DJANGO_DEBUG`: Whether to enable debug mode for Django, e.g. `True` or `False`.
- `DJANGO_BASE_URL`: The base url of the RDE keyserver, e.g. `https://keyserver.example.com`. This is also used as entity id for SAML.
- `DJANGO_SAML_IDP_METADATA_URL`: The url of the SAML IdP metadata, e.g. `https://metadata.test.surfconext.nl/idp-metadata.xml`.

#### SAML certificate
For SAML, a `private.key` and `public.cert` should be mounted at `/code/keyserver/config/saml/` in the container.
The `private.key` should be the private key of the RDE keyserver, and the `public.cert` should be the public certificate of the RDE keyserver.
The configuration in this repository mounts the `/code/keyserver/config/saml/` directory, so the files can be placed at `./certs/saml/` on the host.

A sample command to generate these files is `openssl req -x509 -newkey rsa:4096 -keyout private.key -out public.cert -days 365`.

#### Database
The keyserver uses an SQLite database. This can be mounted at `/code/keyserver/db.sqlite3` in the container for persistent storage. 
The configuration in this repository mounts a file for this purpose, but this can be changed to a volume (or with minimal changes to the keyserver, a separate database container).

For more information, see the [RDE keyserver](https://gitlab.surf.nl/filesender/rde-keyserver) repository.

### Nginx proxy and SSL
The RDE prototype uses nginx as a reverse proxy for the demo, keyserver and proxyserver.
By setting the `VIRTUAL_HOST` environment variable, the nginx proxy will automatically forward traffic for those domains to this container.
For more information, see the [nginx-proxy](https://hub.docker.com/r/nginxproxy/nginx-proxy) docker image documentation on Docker Hub.

Custom nginx configuration can be mounted at `/etc/nginx/conf.d/` in the container.
For example, this is done for the keyserver static files.

Nginx requires SSL certificates to be able to serve HTTPS traffic.
The certificates should be mounted at `/etc/nginx/certs/` in the container, and should be named `full.domain.extension.crt` for the certificate (issuer after) (PEM encoded) and `full.domain.extension.key` for the private key.
For example, if the domain is `keyserver.example.com`, the certificate files should be named `keyserver.example.com.crt` and `keyserver.example.com.key`.
The configuration in this repository mounts the `/etc/nginx/certs/` directory, so the files can be placed at `./certs/nginx/` on the host.

Alternatively, letsencrypt can be used to automatically generate certificates for the domains using the [acme-companion](https://hub.docker.com/r/nginxproxy/acme-companion) docker image.
