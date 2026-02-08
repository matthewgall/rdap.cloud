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
import { getMetricsFromCache } from '../scheduled'

export const registerMetricsRoutes = (app: Hono<{ Bindings: Env }>) => {
    app.get('/metrics', async (c) => {
        const env = c.env
        const cached = await getMetricsFromCache(env)

        if (!cached) {
            return c.text('Metrics cache unavailable', 503, {
                'Content-Type': 'text/plain'
            })
        }

        return c.text(cached, 200, {
            'Content-Type': 'text/plain'
        })
    })
}
