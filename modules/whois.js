class Whois {
    constructor() {
        this.providers = {
            'domains': 'https://raw.githubusercontent.com/7c/whoisserver-world/master/whoisservers.json'
        }
        this.enabled = [
            'domains'
        ]
        this.services = {}
    }

    async fetch(url) {
        let req = await fetch(url, {
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

            for (let p of Object.keys(d)) {
                p = d[p]
                if (p.whoisServer.length > 0 && p.rdapServers.length == 0) {
                    for (let t of Object.keys(p.sampleDomains)) {
                        this.services[this.enabled[r]][t] = `whois://${p.whoisServer[0]}`
                    }
                }
            }
        }
        return this.services
    }
}

module.exports = Whois