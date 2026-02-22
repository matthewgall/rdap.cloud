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

import validator from 'validator'
import tldextract from 'tld-extract'
import { connect } from 'cloudflare:sockets'
import { containsCidr } from 'cidr-tools'
import Rdap from './rdap'
import Whois from './whois'
import parseRawData from './parser'
import Package from '../package-lock.json'
import { RDAP_HTTP_TLD_ALLOWLIST } from './constants'

type DomainMetadata = {
    subdomains: string
    domain: string
    tld: string
}

type LookupServices = {
    rdap: Record<string, Record<string, string>>
    whois: Record<string, Record<string, string>>
    rdapFallback: Record<string, string>
}

export default class Lookup {
    target: string
    type: string
    server: string
    metadata?: DomainMetadata
    env?: Env

    constructor(target?: string, env?: Env) {
        this.target = target || ''
        this.env = env
        this.type = 'invalid'
        this.server = ''
    }

    async fetch(url: string) {
        let req = await fetch(url, {
            headers: {
                Accept: 'application/rdap+json',
                'User-Agent': `${Package.name}/${Package.version}`
            },
            cf: {
                cacheTtl: 84600,
                cacheEverything: true
            }
        })

        if (req.ok) {
            req = await req.json()
        } else {
            req = null
        }
        return req
    }

    async getType() {
        if (validator.isIP(this.target)) {
            const classes = ['ipv4', 'ipv6']
            const services = await this.getServices()
            const rdapServices = services.rdap || {}

            for (let t of classes) {
                const ranges = rdapServices[t] || {}
                for (let r in ranges) {
                    if (containsCidr(r, this.target)) {
                        this.server = ranges[r]
                    }
                }
            }

            if (this.server !== '') {
                this.type = 'ip'
            } else {
                this.type = 'invalid-ip'
            }

            return this.type
        }

        const normalizedTarget = this.target.toLowerCase().startsWith('asn')
            ? this.target.slice(3)
            : this.target.toLowerCase().startsWith('as')
                ? this.target.slice(2)
                : this.target

        if (validator.isNumeric(normalizedTarget)) {
            const asn = Number.parseInt(normalizedTarget, 10)
            if (Number.isNaN(asn)) {
                this.type = 'invalid-asn'
                return this.type
            }

            this.target = String(asn)
            const rd = new Rdap(this.env)
            const services = await rd.getServices()
            const ranges = services['asn'] || {}

            for (let r in ranges) {
                const [start, end] = r.split('-').map((value) => Number.parseInt(value, 10))
                if (Number.isNaN(start) || Number.isNaN(end)) continue
                if (asn >= start && asn <= end) {
                    this.server = ranges[r]
                }
            }

            if (this.server !== '') {
                this.type = 'asn'
            } else {
                this.type = 'invalid-asn'
            }

            return this.type
        }

        if (validator.isFQDN(this.target)) {
            try {
                let parseRes = tldextract(`http://${this.target}`)
                this.metadata = {
                    subdomains: parseRes.sub,
                    domain: parseRes.domain,
                    tld: parseRes.tld
                }

                let services = await this.getServices()
                const rdapDomains = services.rdap?.domains || {}
                const whoisDomains = services.whois?.domains || {}
                const rdapFallback = services.rdapFallback || {}

                if (rdapDomains[this.metadata.tld]) {
                    this.server = rdapDomains[this.metadata.tld]
                    this.target = this.metadata.domain
                    this.type = 'domain'
                } else if (whoisDomains[this.metadata.tld]) {
                    this.server = whoisDomains[this.metadata.tld]
                    this.target = this.metadata.domain
                    this.type = 'domain'
                } else if (rdapFallback[this.metadata.tld]) {
                    this.server = rdapFallback[this.metadata.tld]
                    this.target = this.metadata.domain
                    this.type = 'domain'
                } else {
                    this.type = 'unsupported-domain'
                }
            } catch (e) {
                this.type = 'invalid-domain'
            }
        }

        return this.type
    }

    async getServices(): Promise<LookupServices> {
        let rdap = new Rdap(this.env)
        let whois = new Whois(this.env)

        let data: LookupServices = {
            rdap: await rdap.getServices() as Record<string, Record<string, string>>,
            whois: await whois.getServices() as Record<string, Record<string, string>>,
            rdapFallback: whois.getRdapFallback() || {}
        }
        return data
    }

    async getData() {
        if (this.server !== '') {
            if (this.type == 'asn') {
                this.type = 'autnum'
            }

            let d = {}

            const allowHttpDomain = this.type === 'domain'
                && this.metadata?.tld
                && RDAP_HTTP_TLD_ALLOWLIST.has(this.metadata.tld)

            if (this.server.startsWith('https://') || (allowHttpDomain && this.server.startsWith('http://'))) {
                d = await this.fetch(`${this.server}${this.type}/${this.target}`)
                return d
            }

            if (this.server.startsWith('whois://')) {
                let srv = {
                    hostname: this.server.replaceAll('whois://', ''),
                    port: 43
                }

                try {
                    let socket = connect(srv)
                    let target = this.target

                    // Have to make some changes to how we query for certain servers
                    if (this.metadata?.tld == 'jp') target = `${target}/e`
                    if (this.metadata?.tld == 'de') target = `${target} -T dn`

                    let writer = socket.writable.getWriter()
                    let encoder = new TextEncoder()
                    let encoded = encoder.encode(target + '\r\n')
                    await writer.write(encoded)

                    // Now to decode it
                    const response = new Response(socket.readable)
                    const rawData = await response.text()

                    // And close the socket
                    socket.close()

                    // And time for a bit of processing
                    return parseRawData(rawData, this.target)
                } catch (e: any) {
                    return {
                        success: false,
                        message: e.message
                    }
                }
            }
        } else {
            return {}
        }
    }
}
