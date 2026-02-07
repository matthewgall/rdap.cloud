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
import Package from '../../package-lock.json'

export const registerVersionRoutes = (app: Hono<{ Bindings: Env }>) => {
    app.get('/version', (c) =>
        c.text(Package.version, 200, { 'Content-Type': 'text/plain' })
    )
}
