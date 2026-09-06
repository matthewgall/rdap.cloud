import { describe, expect, it } from 'vitest'
import { Hono } from 'hono'
import { createRateLimitMiddleware, withRateLimitHeaders } from '../src/middleware/rate-limit'
import { mergeCorsHeaders } from '../src/middleware/cors'

const createBrokenLimiter = () => ({
    idFromName: () => ({ toString: () => 'broken' }),
    get: () => ({
        fetch: async () => {
            throw new Error('Durable Object storage unavailable')
        }
    })
} as unknown as DurableObjectNamespace)

const createFailingLimiter = () => ({
    idFromName: () => ({ toString: () => 'failing' }),
    get: () => ({
        fetch: async () =>
            new Response(JSON.stringify({ notValid: true }), { status: 200 })
    })
} as unknown as DurableObjectNamespace)

const createPassingLimiter = () => ({
    idFromName: () => ({ toString: () => 'passing' }),
    get: () => ({
        fetch: async () =>
            new Response(
                JSON.stringify({
                    allowed: true,
                    limit: 60,
                    remaining: 59,
                    resetAt: Date.now() + 60_000,
                    retryAfter: 0
                }),
                { status: 200 }
            )
    })
} as unknown as DurableObjectNamespace)

const buildApp = (rateLimiter: DurableObjectNamespace) => {
    const app = new Hono<{ Bindings: Env }>()
    app.use(
        '*',
        createRateLimitMiddleware((env) => ({
            limit: Number(env.RATE_LIMIT || 60),
            windowSeconds: Number(env.RATE_LIMIT_WINDOW || 60)
        }))
    )
    app.get('/api/test', (c) =>
        c.json(
            { success: true },
            200,
            mergeCorsHeaders(withRateLimitHeaders(c.get('rateLimit')))
        )
    )
    return app
}

describe('Rate limit middleware', () => {
    it('fails open when the Durable Object throws', async () => {
        const app = buildApp(createBrokenLimiter())
        const res = await app.fetch(
            new Request('http://localhost/api/test', {
                headers: { 'cf-connecting-ip': '1.2.3.4' }
            }),
            {
                KV: {} as KVNamespace,
                RATE_LIMITER: createBrokenLimiter(),
                RATE_LIMIT: 60,
                RATE_LIMIT_WINDOW: 60,
                BOOTSTRAP_TTL: 86400,
                TTL: 180
            }
        )

        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body).toEqual({ success: true })
        expect(res.headers.get('X-RateLimit-Limit')).toBe('60')
        expect(res.headers.get('X-RateLimit-Remaining')).toBe('60')
    })

    it('still blocks when the DO reports the limit exceeded', async () => {
        const blockingLimiter = {
            idFromName: () => ({ toString: () => 'blocking' }),
            get: () => ({
                fetch: async () =>
                    new Response(
                        JSON.stringify({
                            allowed: false,
                            limit: 60,
                            remaining: 0,
                            resetAt: Date.now() + 60_000,
                            retryAfter: 30
                        }),
                        { status: 200 }
                    )
            })
        } as unknown as DurableObjectNamespace

        const app = buildApp(blockingLimiter)
        const res = await app.fetch(
            new Request('http://localhost/api/test', {
                headers: { 'cf-connecting-ip': '1.2.3.4' }
            }),
            {
                KV: {} as KVNamespace,
                RATE_LIMITER: blockingLimiter,
                RATE_LIMIT: 60,
                RATE_LIMIT_WINDOW: 60,
                BOOTSTRAP_TTL: 86400,
                TTL: 180
            }
        )

        expect(res.status).toBe(429)
        expect(res.headers.get('Retry-After')).toBe('30')
    })
})
