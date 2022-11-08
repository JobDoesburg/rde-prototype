# RDE POC server config
This repository contains simple docker-compose configuration for the proof-of-concept RDE prototype.

## Installation
1. Install docker and docker-compose: `sudo apt install docker docker-compose`
2. Clone this repository: `git clone --recursive git@gitlab.surf.nl:filesender/rde-poc-server-config.git`
3. Verify the configuration in `docker-compose.yml`
4. Follow the configuration steps in the [RDE KeyServer](https://gitlab.surf.nl/filesender/rde-keyserver) repository and the [RDE Client ProxyServer](https://gitlab.surf.nl/filesender/rde-client-proxyserver) repository. 
5. Start the server: `docker-compose up -d`
