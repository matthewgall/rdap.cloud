import { Hono } from 'hono'
import Package from '../../package-lock.json'

export const registerVersionRoutes = (app: Hono<{ Bindings: Env }>) => {
    app.get('/version', (c) =>
        c.text(Package.version, 200, { 'Content-Type': 'text/plain' })
    )
}
