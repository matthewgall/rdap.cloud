import { createMiddleware } from 'hono/factory'
import { corsHeaders } from './cors'

type RateLimitResponse = {
    allowed: boolean
    limit: number
    remaining: number
    resetAt: number
    retryAfter: number
}

type RateLimitContext = {
    rateLimit?: RateLimitResponse
}

declare module 'hono' {
    interface ContextVariableMap extends RateLimitContext {}
}

const buildRateLimitHeaders = (rateLimit?: RateLimitResponse) => {
    if (!rateLimit) return {}

    return {
        'X-RateLimit-Limit': String(rateLimit.limit),
        'X-RateLimit-Remaining': String(rateLimit.remaining),
        'X-RateLimit-Reset': String(Math.floor(rateLimit.resetAt / 1000))
    }
}

const getClientIp = (request: Request) => {
    const cfIp = request.headers.get('cf-connecting-ip')
    if (cfIp) return cfIp

    const forwarded = request.headers.get('x-forwarded-for')
    if (forwarded) return forwarded.split(',')[0].trim()

    return 'unknown'
}

type RateLimitConfig = {
    limit: number
    windowSeconds: number
}

export const createRateLimitMiddleware = (getConfig: (env: Env) => RateLimitConfig) =>
    createMiddleware(async (c, next) => {
        try {
            const env = c.env as Env
            const request = c.req.raw
            const config = getConfig(env)
            const limit = config.limit
            const windowSeconds = config.windowSeconds
            const clientIp = getClientIp(request)
            const workerHeader = request.headers.get('cf-worker') || 'unknown'
            const useWorkerHeaderOnly = clientIp === '2a06:98c0:3600::103'
            const key = useWorkerHeaderOnly
                ? `api:worker:${workerHeader}`
                : `api:ip:${clientIp}`
            const limiterId = env.RATE_LIMITER.idFromName(key)
            const limiter = env.RATE_LIMITER.get(limiterId)
            const url = new URL(request.url)

            url.pathname = '/limit'
            url.searchParams.set('limit', String(limit))
            url.searchParams.set('window', String(windowSeconds))
            url.searchParams.set('key', key)

            const res = await limiter.fetch(url.toString(), { method: 'POST' })
            const data = await res.json() as RateLimitResponse

            if (!data.allowed) {
                const rateLimitHeaders = buildRateLimitHeaders(data)
                const retryAfter = data.retryAfter || windowSeconds
                return c.json({
                    success: false,
                    message: 'Rate limit exceeded. Try again later.'
                }, 429, {
                    ...corsHeaders,
                    ...rateLimitHeaders,
                    'Retry-After': String(retryAfter)
                })
            }

            c.set('rateLimit', data)
            await next()
        } catch (e) {
            await next()
        }
    })

export const withRateLimitHeaders = (rateLimit?: RateLimitResponse) =>
    buildRateLimitHeaders(rateLimit)
