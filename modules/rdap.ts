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
import { RDAP_HTTP_TLD_ALLOWLIST } from './constants'

type RdapProviders = Record<string, string>
type RdapServices = Record<string, Record<string, string>>

const getHttpsEndpoint = (endpoints: string[]) =>
    endpoints.find((endpoint) => endpoint.startsWith('https://')) || null

const getDomainEndpoint = (tld: string, endpoints: string[]) =>
    getHttpsEndpoint(endpoints) || (RDAP_HTTP_TLD_ALLOWLIST.has(tld) ? endpoints[0] : null)

export default class Rdap {
    env?: Env
    providers: RdapProviders
    enabled: string[]
    services: RdapServices

    constructor(env?: Env) {
        this.env = env
        this.providers = {
            'asn': 'https://data.iana.org/rdap/asn.json',
            'domains': 'https://data.iana.org/rdap/dns.json',
            'ipv4': 'https://data.iana.org/rdap/ipv4.json',
            'ipv6': 'https://data.iana.org/rdap/ipv6.json'
        }
        this.enabled = [
            'asn',
            'domains',
            'ipv4',
            'ipv6'
        ]
        this.services = {}
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
        const cacheKey = 'bootstrap:rdap'
        const cacheTtl = this.env?.BOOTSTRAP_TTL || 86400

        if (!forceRefresh && this.env?.KV) {
            const cached = await this.env.KV.get(cacheKey, 'json')
            if (cached) return cached
        }

        let svc: Array<Promise<any>> = []
        for (let k in this.providers) {
            svc.push(this.fetch(this.providers[k]))
        }
        let res = await Promise.allSettled(svc)

        const services: RdapServices = {}
        for (let r in this.enabled) {
            const key = this.enabled[r]
            services[key] = {}
            let d = (res[r] as PromiseFulfilledResult<any>).value
            for (let p of d['services']) {
                for (let name of p[0]) {
                    const endpoint = this.enabled[r] === 'domains'
                        ? getDomainEndpoint(name, p[1])
                        : getHttpsEndpoint(p[1])

                    if (!endpoint) continue

                    services[key][name] = endpoint
                }
            }
        }

        this.services = services

        if (this.env?.KV && writeCache) {
            await this.env.KV.put(cacheKey, JSON.stringify(this.services), {
                expirationTtl: cacheTtl
            })
        }
        return this.services
    }
}
