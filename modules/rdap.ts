export default class Rdap {
    constructor() {
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

    async fetch(url: any) {
        let req: any = await fetch(url, {
            cf: {
                cacheTtl: 84600,
                cacheEverything: true
            }
        })
        req = await req.json()
        return req
    }

    async getServices() {
        let svc = []
        for (let k in this.providers) {
            svc.push(this.fetch(this.providers[k]))
        }
        let res = await Promise.allSettled(svc)

        for (let r in this.enabled) {
            this.services[this.enabled[r]] = {}
            let d = res[r]['value']
            for (let p of d['services']) {
                for (let name of p[0]) {
                    this.services[this.enabled[r]][name] = p[1][0]
                }
            }
        }
        return this.services
    }
}