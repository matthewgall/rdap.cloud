const Router = require('./router')
const validator = require('validator');
const tldextract = require('parse-domain');

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

async function services(request) {
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

        await KV.put('services', JSON.stringify(resp), { expirationTtl: 604800 })
    }

    return new Response(JSON.stringify(resp), headers)
}

async function api(request) {
    let target = new URL(request.url).pathname.replace('/api/v1/', '')
    let resp = {
        'success': true,
        'results': {}
    }

    for (let i of target.split(',')) {
        i = i.trim()
        let t = false

        resp['results'][i] = {
            'success': true,
            'type': ''
        }

        if (validator.isIP(i)) {
            resp['results'][i]['type'] = 'ip'
        }
        if (validator.isFQDN(i)) {
            let tld = tldextract(`http://${i}`)
            resp['results'][i]['type'] = 'domain'
            resp['results'][i]['tld'] = tld['tld']
        }
        if (validator.isNumeric(i)) {
            resp['results'][i]['type'] = 'asn'
        }

        if (resp['results'][i]['type'] == '') {
            delete resp['results'][i]['type']

            resp['success'] = false
            resp['results'][i]['success'] = false
            resp['results'][i]['message'] = "The data you provided does not appear to be a valid type (IP, domain name or ASN)"
        }
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