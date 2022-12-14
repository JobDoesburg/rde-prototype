# RDE prototype
This repository contains simple docker-compose configuration for the proof-of-concept RDE prototype.
It contains submodules for different components of the RDE prototype. 
Most notably, it enables a demo page that shows the RDE prototype in action (not implemented for a specific application).

This repository does not include the RDE Android app that is required to use the RDE prototype. 
The source code for the RDE Android app can be found at [https://gitlab.surf.nl/filesender/rde-client-android](https://gitlab.surf.nl/filesender/rde-client-android).

## Components
The RDE prototype consists of the following components:
- [RDE keyserver](https://gitlab.surf.nl/filesender/rde-keyserver), which is used to store enrolled RDE keys for user identities, using email addresses via SAML, and make them available via a REST API.
- [RDE client proxyserver](https://gitlab.surf.nl/filesender/rde-client-proxyserver), which is used to enable communication between a RDE browser client and the RDE Android client app.
- [RDE Android client app](https://gitlab.surf.nl/filesender/rde-client-android), which is used to actually communicate with RDE documents: enroll them and use them to retrieve keys. As this is an Android app, it is not included as a submodule in this repository.
- [RDE JS client library](https://gitlab.surf.nl/filesender/rde-js-client), which consists of two modules, one for generating RDE keys and one for interacting with the RDE Android client app.
- [RDE demo](https://gitlab.surf.nl/filesender/rde-prototype/-/tree/main/rde-demo), a demo website that uses the RDE JS client library to generate RDE keys and interact with the RDE Android client app to retrieve them again.

## Installation
1. Install docker and docker-compose: `sudo apt install docker docker-compose`
2. Clone this repository: `git clone --recursive git@gitlab.surf.nl:filesender/rde-prototype.git`
3. Verify the configuration in `docker-compose.yml` and `rde-demo/config.js`.
4. Follow the configuration steps in the [RDE KeyServer](https://gitlab.surf.nl/filesender/rde-keyserver) repository and the [RDE Client ProxyServer](https://gitlab.surf.nl/filesender/rde-client-proxyserver) repository. 
5. Start the server: `docker-compose up -d`
6. Generate and place certificates in the correct folders

## Configuration
The configuration of the RDE prototype is done in the `docker-compose.yml` file.

### Demo
The demo website is configured in the `demo` section of the `docker-compose.yml` file.
The following environment variables should be set:

- `KEYSERVER_URL`: The url of the RDE KeyServer to use, e.g. `https://keyserver.example.com`.
- `PROXYSERVER_URL`: The url of the RDE Client ProxyServer to use, e.g. `https://proxyserver.example.com` (used for opening new socket connections).
- `PROXYSERVER_WS_URL`: The websocket base url of the RDE Client ProxyServer to use, e.g. `wss://proxyserver.example.com`.

By default, the demo uses the Dutch CSCA certificates of 2022 (see `rde-demo/CSCA-NL-2022.json`), for verifying enrollment parameters.
To use a different set of CSCA certificates, a JSON file can be mounted at `/usr/share/nginx/html/certificates.json` in the container.
Alternatively, the `CERTIFICATES_JSON_URL` environment variable can be set to the url of a JSON file containing the trusted CSCA certificates.

### KeyServer
The RDE KeyServer is configured in the `keyserver` section of the `docker-compose.yml` file.
The following environment variables should be set:

- `DJANGO_SECRET_KEY`: The secret key used by Django.
- `DJANGO_ALLOWED_HOSTS`: The allowed hosts for Django, comma separated, e.g. `keyserver.example.com` or `keyserver.example.com,keyserver2.example.com`.
- `DJANGO_DEBUG`: Whether to enable debug mode for Django, e.g. `True` or `False`.
- `DJANGO_BASE_URL`: The base url of the RDE KeyServer, e.g. `https://keyserver.example.com`. This is also used as entity id for SAML.
- `DJANGO_SAML_IDP_METADATA_URL`: The url of the SAML IdP metadata, e.g. `https://metadata.test.surfconext.nl/idp-metadata.xml`.

For SAML, a `private.key` and `public.cert` should be mounted at `/code/keyserver/config/saml/` in the container.
The `private.key` should be the private key of the RDE KeyServer, and the `public.cert` should be the public certificate of the RDE KeyServer.
A sample command to generate these files is `openssl req -x509 -newkey rsa:4096 -keyout private.key -out public.cert -days 365`.

The KeyServer uses an SQLite database. This can be mounted at `/code/keyserver/db.sqlite3` in the container for persistent storage.

For more information, see the [RDE KeyServer](https://gitlab.surf.nl/filesender/rde-keyserver) repository.

