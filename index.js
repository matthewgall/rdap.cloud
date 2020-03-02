/**
 * Copyright 2020 Matthew Gall

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
const Router = require('./router')
const validator = require('validator');
const tldextract = require('parse-domain');
const cidr = require('ip-cidr')

const headers = {
    headers: {
        'Content-Type': 'application/json'
    }
}
const iana = {
    'asn': 'https://data.iana.org/rdap/asn.json',
    'domains': 'https://data.iana.org/rdap/dns.json',
    'ipv4': 'https://data.iana.org/rdap/ipv4.json',
    'ipv6': 'https://data.iana.org/rdap/ipv6.json'
}

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})

async function getRDAP(server, stype, subject) {
    let cached = await KV.get(`rdap.${subject}`, 'json')
    let resp = {}

    if (cached !== null) {
        resp = cached
    } else {
        let d = await fetch(`${server}${stype}/${subject}`, {
            headers: {
                'Accept': 'application/rdap+json'
            }
        })
        resp = await d.json()
    }

    await KV.put(`rdap.${subject}`, JSON.stringify(resp), { expirationTtl: TTL * 2 })

    return resp
}

async function getIANA() {
    let resp = {}
    let cached = await KV.get('services', 'json')

    if (cached !== null) {
        resp = cached
    } else {
        for (let l in iana) {
            resp[l] = {}

            let d = await fetch(iana[l])
            d = await d.json()

            for (let p of d['services']) {
                for (let name of p[0]) {
                    resp[l][name] = p[1][0]
                }
            }
        }

        await KV.put('services', JSON.stringify(resp), { expirationTtl: TTL * 10 })
    }

    return resp
}

async function services(request) {
    let data = await getIANA()
    return new Response(JSON.stringify(data), headers)
}

async function api(request) {
    let target = new URL(request.url).pathname.replace('/api/v1/', '')
    let resp = {
        'success': true,
        'results': {}
    }

    for (let i of target.split(',')) {
        i = i.trim()

        resp['results'][i] = {
            'success': true,
            'type': '',
            'metadata': {}
        }

        if (validator.isIP(i)) {
            resp['results'][i]['type'] = 'ip'

            let servers = await getIANA()
            let classes = ['ipv4', 'ipv6']
            for (let t of classes) {
                for (let r in servers[t]) {
                    let d = new cidr(r)
                    if (d.contains(i)) {
                        resp['results'][i]['metadata']['server'] = servers[t][r]
                    }
                }
            }
            let res = {}
            try {
                res = await getRDAP(resp['results'][i]['metadata']['server'], 'ip', `${i}/32`)
            } catch (err) {}

            resp['results'][i]['data'] = res
        }

        if (validator.isFQDN(i)) {
            let tld = tldextract(`http://${i}`)
            resp['results'][i]['type'] = 'domain'
            resp['results'][i]['metadata'] = tld

            let servers = await getIANA()
            try {
                resp['results'][i]['metadata']['server'] = servers['domains'][tld['tld']]
            } catch (err) {}

            let res = {}
            try {
                res = await getRDAP(resp['results'][i]['metadata']['server'], resp['results'][i]['type'], i)
            } catch (err) {}

            resp['results'][i]['data'] = res
        }
        if (validator.isNumeric(i)) {
            resp['results'][i]['type'] = 'asn'

            let servers = await getIANA()
            try {
                for (let r in servers['asn']) {
                    let ra = r.split('-')
                    if (i >= ra[0] && i <= ra[1]) {
                        resp['results'][i]['metadata']['server'] = servers['asn'][r]
                    }
                }
            } catch (err) {}

            let res = {}
            try {
                res = await getRDAP(resp['results'][i]['metadata']['server'], 'autnum', i)
            } catch (err) {}

            resp['results'][i]['data'] = res
        }

        if (resp['results'][i]['type'] == '') {
            delete resp['results'][i]['type']

            resp['success'] = false
            resp['results'][i]['success'] = false
            resp['results'][i]['message'] = "The data you provided does not appear to be a valid type (IP, domain name or ASN)"
        }

        delete resp['results'][i]['metadata']
    }

    return new Response(JSON.stringify(resp, null, 2), headers)
}

async function handleRequest(request) {
    const r = new Router()

    r.get('/api/v1/services', () => services(request))
    r.get('/api/v1/.*', () => api(request))
    r.get('/', () => new Response('Welcome to rdap.cloud'))

    const resp = await r.route(request)
    return resp
}