/**
 * Copyright 2020 - 2026 Matthew Gall

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */

import Package from '../package-lock.json'

type WhoisProviders = Record<string, string>
type WhoisServices = Record<string, Record<string, string>>
type WhoisProviderEntry = {
    whoisServer: string[]
    rdapServers: string[]
    sampleDomains: Record<string, string>
}
type WhoisBootstrapCache = {
    services: WhoisServices
    rdapFallback: Record<string, string>
}

export default class Whois {
    env?: Env
    providers: WhoisProviders
    enabled: string[]
    services: WhoisServices
    rdapFallback: Record<string, string>

    constructor(env?: Env) {
        this.env = env
        this.providers = {
            'domains': 'https://raw.githubusercontent.com/7c/whoisserver-world/master/whoisservers.json'
        }
        this.enabled = [
            'domains'
        ]
        this.services = {}
        this.rdapFallback = {}
    }

    async fetch(url: string) {
        let req: any = await fetch(url, {
            headers: {
                'User-Agent': `${Package.name}/${Package.version}`
            },
            cf: {
                cacheTtl: 84600,
                cacheEverything: true
            }
        })
        req = await req.json()
        return req
    }

    async getServices(options: { forceRefresh?: boolean; writeCache?: boolean } = {}) {
        const { forceRefresh = false, writeCache = true } = options
        const cacheKey = 'bootstrap:whois'
        const cacheTtl = this.env?.BOOTSTRAP_TTL || 86400

        if (!forceRefresh && this.env?.KV) {
            const cached = await this.env.KV.get(cacheKey, 'json')
            if (cached) {
                if (typeof cached === 'object' && cached !== null && 'services' in cached) {
                    const cachedPayload = cached as WhoisBootstrapCache
                    this.services = cachedPayload.services || {}
                    this.rdapFallback = cachedPayload.rdapFallback || {}
                    return this.services
                }
                this.services = cached as WhoisServices
                this.rdapFallback = {}
                return this.services
            }
        }

        let svc: Array<Promise<any>> = []
        for (let k in this.providers) {
            svc.push(this.fetch(this.providers[k]))
        }
        let res = await Promise.allSettled(svc)

        const services: WhoisServices = {}
        const rdapFallback: Record<string, string> = {}
        for (let r in this.enabled) {
            const key = this.enabled[r]
            services[key] = {}
            let d = (res[r] as PromiseFulfilledResult<Record<string, WhoisProviderEntry>>).value

            for (let p of Object.keys(d)) {
                const entry = d[p]
                if (entry.rdapServers.length > 0) {
                    for (let t of Object.keys(entry.sampleDomains)) {
                        rdapFallback[t] = entry.rdapServers[0]
                    }
                }

                if (entry.whoisServer.length > 0 && entry.rdapServers.length == 0) {
                    for (let t of Object.keys(entry.sampleDomains)) {
                        services[key][t] = `whois://${entry.whoisServer[0]}`
                    }
                }
            }
        }

        this.services = services
        this.rdapFallback = rdapFallback

        if (this.env?.KV && writeCache) {
            await this.env.KV.put(cacheKey, JSON.stringify({
                services: this.services,
                rdapFallback: this.rdapFallback
            }), {
                expirationTtl: cacheTtl
            })
        }
        return this.services
    }

    getRdapFallback() {
        return this.rdapFallback
    }
}
