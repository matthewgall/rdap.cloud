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

export const registerMetricsRoutes = (app: Hono<{ Bindings: Env }>) => {
    app.get('/metrics', async (c) => {
        const env = c.env
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
                    if (delta < Number(exp)) {
                        expiry[exp] = expiry[exp] + 1
                    }
                }
            }

            complete = data['list_complete']
            if (complete !== true) {
                cursor = 'cursor' in data ? data.cursor : ''
            }
        }

        return c.text(`# HELP rdap_keys_cached_total The total number of cached RDAP lookups
# TYPE rdap_keys_cached_total counter
rdap_keys_cached_total ${count}
# HELP rdap_keys_expires_total The total number of cached RDAP lookups expiring in a set timeframe
# TYPE rdap_keys_expires_total histogram
rdap_keys_expires_total{handler="/metrics",le="3600"} ${expiry['3600']}
rdap_keys_expires_total{handler="/metrics",le="21600"} ${expiry['21600']}
rdap_keys_expires_total{handler="/metrics",le="43200"} ${expiry['43200']}
rdap_keys_expires_total{handler="/metrics",le="86400"} ${expiry['86400']}
`, 200, {
            'Content-Type': 'text/plain'
        })
    })
}
