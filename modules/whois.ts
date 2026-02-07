import Package from '../package-lock.json'

type WhoisProviders = Record<string, string>
type WhoisServices = Record<string, Record<string, string>>
type WhoisProviderEntry = {
    whoisServer: string[]
    rdapServers: string[]
    sampleDomains: Record<string, string>
}

export default class Whois {
    env?: Env
    providers: WhoisProviders
    enabled: string[]
    services: WhoisServices

    constructor(env?: Env) {
        this.env = env
        this.providers = {
            'domains': 'https://raw.githubusercontent.com/7c/whoisserver-world/master/whoisservers.json'
        }
        this.enabled = [
            'domains'
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

    async getServices() {
        const cacheKey = 'bootstrap:whois'
        const cacheTtl = this.env?.BOOTSTRAP_TTL || 86400

        if (this.env?.KV) {
            const cached = await this.env.KV.get(cacheKey, 'json')
            if (cached) return cached
        }

        let svc: Array<Promise<any>> = []
        for (let k in this.providers) {
            svc.push(this.fetch(this.providers[k]))
        }
        let res = await Promise.allSettled(svc)

        for (let r in this.enabled) {
            this.services[this.enabled[r]] = {}
            let d = (res[r] as PromiseFulfilledResult<Record<string, WhoisProviderEntry>>).value

            for (let p of Object.keys(d)) {
                const entry = d[p]
                if (entry.whoisServer.length > 0 && entry.rdapServers.length == 0) {
                    for (let t of Object.keys(entry.sampleDomains)) {
                        this.services[this.enabled[r]][t] = `whois://${entry.whoisServer[0]}`
                    }
                }
            }
        }

        if (this.env?.KV) {
            await this.env.KV.put(cacheKey, JSON.stringify(this.services), {
                expirationTtl: cacheTtl
            })
        }
        return this.services
    }
}
