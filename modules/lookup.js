const validator = require('validator');
const tldextract = require('tld-extract');
import { connect } from 'cloudflare:sockets';
import { containsCidr } from 'cidr-tools';
import Rdap from './rdap'
import Whois from './whois';
import parseRawData from './parser';
import Package from '../package-lock.json';

class Lookup {
    constructor(target) {
        this.target = target
        this.type = 'invalid'
        this.server = ''
    }

    async fetch(url) {
        let req = await fetch(url, {
            headers: {
                Accept: 'application/rdap+json',
                'User-Agent': `${Package.name}/${Package.version}`,
            },
            cf: {
                cacheTtl: 84600,
                cacheEverything: true,
            },
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
            let classes = ['ipv4', 'ipv6']

            let rd = await this.getServices()

            for (let source of Object.keys(rd)) {
                for (let t of classes) {
                    for (let r in rd[source][t]) {
                        if (containsCidr(r, this.target)) {
                            this.server = rd[source][t][r]
                        }
                    }
                }
                if (this.server !== '') {
                    this.type = 'ip'
                } else {
                    this.type = 'invalid-ip'
                }
            }
        }

        if (validator.isFQDN(this.target)) {
            try {
                let parseRes = tldextract(`http://${this.target}`)
                this.metadata = {
                    subdomains: parseRes.sub,
                    domain: parseRes.domain,
                    tld: parseRes.tld,
                }

                let services = await this.getServices()

                for (let source of Object.keys(services)) {
                    if (services[source]['domains'][this.metadata.tld]) {
                        if (this.server == '') {
                            this.server = services[source]['domains'][this.metadata.tld]
                            this.target = this.metadata.domain
                            this.type = 'domain'
                        }
                    }
                }
            } catch (e) {
                this.type = 'invalid-domain'
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

            if (this.server !== '') {
                this.type = 'asn'
            } else {
                this.type = 'invalid-asn'
            }
        }

        return this.type
    }

    async getServices() {
        let rdap = new Rdap()
        let whois = new Whois()

        let data = {
            rdap: await rdap.getServices(),
            whois: await whois.getServices(),
        }
        return data
    }

    async getData() {
        if (this.server !== '') {
            if (this.type == 'asn') {
                this.type = 'autnum'
            }

            let d = {}

            if (this.server.startsWith('http://') || this.server.startsWith('https://')) {
                d = await this.fetch(`${this.server}${this.type}/${this.target}`)
                return d
            }

            if (this.server.startsWith('whois://')) {
                let srv = {
                    hostname: this.server.replaceAll('whois://', ''),
                    port: 43,
                }

                try {
                    let socket = connect(srv)
                    let target = this.target
                    if (this.metadata.tld.endsWith('.jp')) target = `${target}/e`

                    let writer = socket.writable.getWriter()
                    let encoder = new TextEncoder()
                    let encoded = encoder.encode(target + '\r\n')
                    await writer.write(encoded)

                    // Now to decode it
                    let data = new Response(socket.readable);
                    data = await data.text();

                    // And close the socket
                    socket.close();

                    // And time for a bit of processing
                    return parseRawData(data, this.target)
                } catch (e) {
                    return {}
                }
            }
        } else {
            return {}
        }
    }
}

module.exports = Lookup