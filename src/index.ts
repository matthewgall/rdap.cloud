/**
 * Copyright 2020 - 2023 Matthew Gall

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
import { Router } from 'itty-router';
import Lookup from '../modules/lookup';
import Rdap from '../modules/rdap';
import Package from '../package.json';

const router = Router();
const headers = {
    headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Origin, Accept, Content-Type, X-Requested-With, X-CSRF-Token, cf-access-client-id, cf-access-client-secret'
    }
}

router.get('/version', (request, env, context) => {
    return new Response(Package.version, {headers: {'Content-Type': 'text/plain'}});
})

router.get('/metrics', async (request, env, context) => {
    let ts = Math.round((new Date()).getTime() / 1000)
    let count = 0
    let expiry = {
        '3600': 0,
        '21600': 0,
        '43200': 0,
        '86400': 0,
        '172800': 0
    }
    let cursor = ''
    let complete = false

    while (complete !== true) {
        let data = await env.KV.list({
            "cursor": cursor
        })
        count = count + data['keys'].length

        let delta = 0

        for (let key of data['keys']) {
            delta = key['expiration'] - ts

            for (let exp in expiry) {
                if (delta < exp) {
                    expiry[exp] = expiry[exp] + 1
                }
            }
        }

        complete = data['list_complete']
        if (complete !== true) {
            cursor = data.cursor
        }
    }

    return new Response(`# HELP rdap_keys_cached_total The total number of cached RDAP lookups
# TYPE rdap_keys_cached_total counter
rdap_keys_cached_total ${count}
# HELP rdap_keys_expires_total The total number of cached RDAP lookups expiring in a set timeframe
# TYPE rdap_keys_expires_total histogram
rdap_keys_expires_total{handler="/metrics",le="3600"} ${expiry['3600']}
rdap_keys_expires_total{handler="/metrics",le="21600"} ${expiry['21600']}
rdap_keys_expires_total{handler="/metrics",le="43200"} ${expiry['43200']}
rdap_keys_expires_total{handler="/metrics",le="86400"} ${expiry['86400']}
`, {
        headers: {
            'Content-Type': 'text/plain'
        }
    })
});

router.get('/api/v1/services', async (request, env, context) => {
    let rdap = new Rdap()
    let data = await rdap.getServices()
    return new Response(JSON.stringify(data, null, 2), headers)
});

router.get('/api/v1/*', async (request, env, context) => {
    let target = decodeURIComponent(new URL(request.url).pathname.replace('/api/v1/', ''))
    let resp = {
        'results': {}
    }

    for (let i of target.split(',')) {
        i = i.trim()

        let cached = await env.KV.get(`rdap-${i}`, 'json')
        if (cached !== null) {
            resp['results'][i] = cached
        } else {
            let l: any = new Lookup(i)
            let lType: any = await l.getType()

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
                resp['results'][i]['message'] = `${i} is not supported by RDAP. This may be because the domain belongs to a ccTLD, or the gTLD has not deployed RDAP`
                continue
            }

            await env.KV.put(`rdap-${i}`, JSON.stringify(resp['results'][i]), {
                expirationTtl: env.TTL
            })
        }
    }

    return new Response(JSON.stringify(resp, null, 2), headers)
});

router.get('/', (request, env, context) => {
    return new Response('Welcome to rdap.cloud');
})

router.all('*', () => new Response('Not Found.', { status: 404 }))

export default {
    fetch: router.handle
  }