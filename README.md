# rdap.cloud

The Registration Data Access Protocol (RDAP) is the successor to WHOIS. Like WHOIS, RDAP provides access to information about Internet resources (domain names, autonomous systems, and IP addresses).

rdap.cloud is a simple implementation of an RDAP bootstrap server, a single endpoint for any and all RDAP queries, by aggregating all known RDAP servers, and fetching responses from the relevant ones for delivery to the client, all while caching and validating the data on behalf of the client.

## Deployment
rdap.cloud is powered by [Cloudflare Workers](https://workers.dev), a paid for service provided by [Cloudflare](https://www.cloudflare.com)

## API
## /api/v1/[subject]
Performs a lookup for the subject. Supported subjects are:  
    
* IP addresses (v4 / v6)  
* Domains  
* AS Numbers  

## Licence
Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0