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
const Lookup = require('./modules/lookup')
const Rdap = require('./modules/rdap')

const headers = {
    headers: {
        'Content-Type': 'application/json'
    }
}

async function services(request) {
    let rdap = new Rdap()
    let data = await rdap.getServices()
    return new Response(JSON.stringify(data, null, 2), headers)
}

async function api(request) {
    let target = new URL(request.url).pathname.replace('/api/v1/', '')
    let resp = {
        'results': {}
    }

    for (let i of target.split(',')) {
        i = i.trim()

        let cached = await KV.get(`rdap-${i}`, 'json')
        if (cached !== null) {
            resp['results'][i] = cached
        } else {
            l = new Lookup(i)
            lType = await l.getType()

            resp['results'][i] = {
                'success': true,
                'type': lType,
                'server': l.server
            }

            if (l.server !== "") {
                let d = await l.getData()
                resp['results'][i]['data'] = d
            }

            if (resp['results'][i]['type'] == "invalid") {
                delete resp['results'][i]['type']
                delete resp['results'][i]['server']
                resp['results'][i]['success'] = false
                resp['results'][i]['message'] = `${i} does not appear to be a valid domain name, IP address or ASN`
                continue
            }
            if (resp['results'][i]['type'] == "invalid-domain") {
                delete resp['results'][i]['type']
                delete resp['results'][i]['server']
                resp['results'][i]['success'] = false
                resp['results'][i]['message'] = `${i} does not appear to be a valid domain name`
                continue
            }
            if (resp['results'][i]['type'] == "unsupported-domain") {
                delete resp['results'][i]['type']
                delete resp['results'][i]['server']
                resp['results'][i]['success'] = false
                resp['results'][i]['message'] = `${i} is not supported by RDAP.This may be because the domain belongs to a ccTLD, or the gTLD has not deployed RDAP`
                continue
            }

            await KV.put(`rdap-${i}`, JSON.stringify(resp['results'][i]), {
                expirationTtl: TTL
            })
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

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})