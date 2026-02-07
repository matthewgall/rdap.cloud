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
        const keyName = url.searchParams.get('key')
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

        const kvKey = `rate-limit:${keyName || this.state.id.toString()}`
        await this.env.KV.put(kvKey, JSON.stringify({
            count: record.count,
            resetAt: record.resetAt
        }), {
            expirationTtl: Math.max(windowSeconds, 1)
        })

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
