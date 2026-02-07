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

import { Hono } from 'hono'
import { createRateLimitMiddleware } from './middleware/rate-limit'
import { registerApiRoutes } from './routes/api'
import { registerMetricsRoutes } from './routes/metrics'
import { registerVersionRoutes } from './routes/version'

const app = new Hono<{ Bindings: Env }>()
const rateLimitConfig = {
    limit: 60,
    windowSeconds: 120
}
const rateLimit = createRateLimitMiddleware((env) => ({
    limit: Number.parseInt(String(env.RATE_LIMIT || rateLimitConfig.limit), 10),
    windowSeconds: Number.parseInt(String(env.RATE_LIMIT_WINDOW || rateLimitConfig.windowSeconds), 10)
}))

registerVersionRoutes(app)
registerMetricsRoutes(app)
registerApiRoutes(app, rateLimit)

app.get('/', (c) => c.text('Welcome to rdap.cloud'))

app.notFound(() => new Response('Not Found.', { status: 404 }))

export default {
    fetch: app.fetch
}

export { RateLimiter } from './rate-limiter'
