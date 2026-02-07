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
