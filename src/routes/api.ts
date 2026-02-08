/**
 * Copyright 2020 - 2026 Matthew Gall

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

import { Hono } from 'hono'
import validator from 'validator'
import tldextract from 'tld-extract'
import Lookup from '../../modules/lookup';
import { MAX_UNIQUE_LOOKUPS } from '../constants'
import { mergeCorsHeaders } from '../middleware/cors'
import { withRateLimitHeaders } from '../middleware/rate-limit'

type RateLimitMiddleware = ReturnType<typeof import('../middleware/rate-limit').createRateLimitMiddleware>

const getCacheKeyForInput = (target: string) => {
    const lowered = target.toLowerCase()
    if (lowered.startsWith('asn')) {
        const normalized = target.slice(3)
        if (validator.isNumeric(normalized)) {
            return `rdap:asn:${normalized}`
        }
    }
    if (lowered.startsWith('as')) {
        const normalized = target.slice(2)
        if (validator.isNumeric(normalized)) {
            return `rdap:asn:${normalized}`
        }
    }
    if (validator.isNumeric(target)) {
        return `rdap:asn:${target}`
    }
    if (validator.isIP(target)) {
        return `rdap:ip:${target}`
    }
    if (validator.isFQDN(target)) {
        try {
            const parsed = tldextract(`http://${target}`)
            if (parsed?.domain) {
                return `rdap:domain:${parsed.domain}`
            }
        } catch (e) {
            return null
        }
    }
    return null
}

const getCacheKeyForResolved = (type: string, target: string) => {
    if (type === 'domain') return `rdap:domain:${target}`
    if (type === 'ip') return `rdap:ip:${target}`
    if (type === 'asn') return `rdap:asn:${target}`
    return null
}

export const registerApiRoutes = (app: Hono<{ Bindings: Env }>, rateLimit: RateLimitMiddleware) => {
    app.get('/api/v1/services', rateLimit, async (c) => {
        const env = c.env
        const lookup = new Lookup(undefined, env)
        const data = await lookup.getServices()

        return c.json(data, 200, mergeCorsHeaders(withRateLimitHeaders(c.get('rateLimit'))))
    })

    app.get('/api/v1/*', rateLimit, async (c) => {
        const env = c.env
        const request = c.req.raw
        let target = decodeURIComponent(new URL(request.url).pathname.replace('/api/v1/', ''))
        let resp = {
            'results': {}
        }

        const targets = target
            .split(',')
            .map((item) => item.trim())
            .filter((item) => item.length > 0)
        const uniqueTargets = Array.from(new Set(targets))

        if (uniqueTargets.length > MAX_UNIQUE_LOOKUPS) {
            return c.json({
                success: false,
                message: `Too many lookups requested. Max ${MAX_UNIQUE_LOOKUPS} unique targets per request.`
            }, 400, mergeCorsHeaders(withRateLimitHeaders(c.get('rateLimit'))))
        }

        for (let i of uniqueTargets) {
            i = i.trim()

            const initialCacheKey = getCacheKeyForInput(i)
            let cached = initialCacheKey ? await env.KV.get(initialCacheKey, 'json') : null
            if (cached !== null) {
                resp['results'][i] = cached
            } else {
                let l: any = new Lookup(i, env)
                let lType: any = await l.getType()
                const cacheKey = getCacheKeyForResolved(lType, l.target)

                resp['results'][i] = {
                    'success': true,
                    'type': lType,
                    'server': l.server
                }

                if (l.server !== "") {
                    let d = await l.getData()

                    // Do some data cleanup
                    delete resp['results'][i]['type']
                    delete resp['results'][i]['server']

                    if (d === null || d === "" || d.success === false) {
                        resp['results'][i]['success'] = false
                        resp['results'][i]['message'] = `${i} does not appear to be a registered domain name, IP address or ASN`
                        continue
                    }
                    else {
                        resp['results'][i]['data'] = d
                    }
                }

                if (['invalid', 'invalid-domain', 'invalid-ip'].includes(resp['results'][i]['type'])) {
                    delete resp['results'][i]['type']
                    delete resp['results'][i]['server']
                    resp['results'][i]['success'] = false
                    resp['results'][i]['message'] = `${i} does not appear to be a valid domain name, IP address or ASN`
                    continue
                }
                if (resp['results'][i]['type'] == "unsupported-domain") {
                    delete resp['results'][i]['type']
                    delete resp['results'][i]['server']
                    resp['results'][i]['success'] = false
                    resp['results'][i]['message'] = `${i} is not supported by RDAP. This may be because the domain belongs to a ccTLD, or the gTLD has not deployed RDAP`
                    continue
                }

                if (cacheKey) {
                    await env.KV.put(cacheKey, JSON.stringify(resp['results'][i]), {
                        expirationTtl: env.TTL
                    })
                }
            }
        }

        return c.json(resp, 200, mergeCorsHeaders(withRateLimitHeaders(c.get('rateLimit'))))
    })
}
