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

type RateLimitRecord = {
    count: number
    resetAt: number
}

export class RateLimiter {
    state: DurableObjectState
    env: Env

    constructor(state: DurableObjectState, env: Env) {
        this.state = state
        this.env = env
    }

    async fetch(request: Request) {
        const url = new URL(request.url)
        const limit = Number.parseInt(url.searchParams.get('limit') || '60', 10)
        const windowSeconds = Number.parseInt(url.searchParams.get('window') || '60', 10)
        const now = Date.now()
        const windowMs = Math.max(windowSeconds, 1) * 1000

        let record = await this.state.storage.get<RateLimitRecord>('record')
        if (!record || now >= record.resetAt) {
            record = {
                count: 0,
                resetAt: now + windowMs
            }
        }

        let allowed = true
        if (record.count >= limit) {
            allowed = false
        } else {
            record.count = record.count + 1
            await this.state.storage.put('record', record)
        }

        const remaining = Math.max(limit - record.count, 0)
        const response = {
            allowed,
            limit,
            remaining,
            resetAt: record.resetAt,
            retryAfter: Math.max(Math.ceil((record.resetAt - now) / 1000), 0)
        }

        return new Response(JSON.stringify(response, null, 2), {
            headers: {
                'Content-Type': 'application/json'
            }
        })
    }
}
