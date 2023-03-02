const validator = require('validator');
const tldextract = require('tld-extract');
const Cidr = require('ip-cidr-webpack')
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
                    let d = new Cidr.CIDR(r)
                    d = d.toArray()

                    if (d.includes(this.target)) {
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
            try {
                let parseRes = tldextract(`http://${this.target}`)
                this.metadata = {
                    'subdomains': parseRes.sub,
                    'domain': parseRes.domain,
                    'tld': parseRes.tld
                }

                let rd = new Rdap()
                rd = await rd.getServices()

                if (rd['domains'][this.metadata['tld']]) {
                    this.server = rd['domains'][this.metadata['tld']]
                    this.target = this.metadata['domain']
                    this.type = "domain"
                } else {
                    this.type = "unsupported-domain"
                }
            }
            catch(e) {
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
