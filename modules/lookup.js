const validator = require('validator');
const parsedomain = require('parse-domain');
const cidr = require('ip-cidr')
const Rdap = require('./rdap')

class Lookup {
    constructor(target) {
        this.target = target
        this.type = "invalid"
        this.server = ""
    }

    async fetch(url) {
        let req = await fetch(url, {
            headers: {
                'Accept': 'application/rdap+json'
            },
            cf: {
                cacheTtl: 84600,
                cacheEverything: true
            }
        })
        req = await req.json()
        return req
    }

    async getType() {
        if (validator.isIP(this.target)) {
            let classes = ['ipv4', 'ipv6']

            let rd = new Rdap()
            rd = await rd.getServices()

            for (let t of classes) {
                for (let r in rd[t]) {
                    let d = new cidr(r)

                    if (d.contains(this.target)) {
                        this.server = rd[t][r]
                    }
                }
            }
            if (this.server !== "") {
                this.type = "ip"
            } else {
                this.type = "invalid-ip"
            }
        }

        if (validator.isFQDN(this.target)) {
            let parseRes = parsedomain.parseDomain(this.target)
            if (parseRes.type == parsedomain.ParseResultType.Listed) {
                parseRes = parseRes.icann

                this.metadata = {
                    'subdomains': parseRes.subDomains,
                    'domain': parseRes.domain,
                    'tld': parseRes.topLevelDomains[0]
                }

                let rd = new Rdap()
                rd = await rd.getServices()

                if (rd['domains'][parseRes.topLevelDomains[0]]) {
                    this.server = rd['domains'][parseRes.topLevelDomains[0]]
                    this.type = "domain"
                } else {
                    this.type = "unsupported-domain"
                }

            } else {
                this.type = "invalid-domain"
            }
        }

        if (validator.isNumeric(this.target)) {
            let rd = new Rdap()
            rd = await rd.getServices()

            for (let r in rd['asn']) {
                let ra = r.split('-')
                if (this.target >= ra[0] && this.target <= ra[1]) {
                    this.server = rd['asn'][r]
                }
            }

            if (this.server !== "") {
                this.type = "asn"
            } else {
                this.type = "invalid-asn"
            }
        }

        return this.type
    }

    async getData() {
        if (this.server !== "") {
            if (this.type == "asn") {
                this.type = 'autnum'
            }
            let d = await this.fetch(`${this.server}${this.type}/${this.target}`)
            return d
        } else {
            return {}
        }
    }
}

module.exports = Lookup