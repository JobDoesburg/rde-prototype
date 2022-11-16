# RDE prototype
This repository contains simple docker-compose configuration for the proof-of-concept RDE prototype.
It contains submodules for different components of the RDE prototype.

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
