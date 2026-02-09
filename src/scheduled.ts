import {
    LEGACY_RDAP_DELETE_LIMIT,
    LEGACY_RDAP_PREFIX,
    METRICS_CACHE_KEY,
    METRICS_CACHE_TTL,
    METRICS_EXPIRY_BUCKETS
} from './constants'
import Rdap from '../modules/rdap'
import Whois from '../modules/whois'

type MetricsSnapshot = {
    count: number
    expiry: Record<(typeof METRICS_EXPIRY_BUCKETS)[number], number>
}

type RdapServices = Record<string, Record<string, string>>
type WhoisServices = { domains: Record<string, string> }

const METRICS_CRON = '*/5 * * * *'
const BOOTSTRAP_CRON = '0 3 * * *'

const buildMetricsSnapshot = async (env: Env): Promise<MetricsSnapshot> => {
    let ts = Math.round((new Date()).getTime() / 1000)
    let count = 0
    let expiry: MetricsSnapshot['expiry'] = {
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
            'cursor': cursor
        })
        count = count + data['keys'].length

        for (let key of data['keys']) {
            if (!key['expiration']) {
                continue
            }

            let delta = key['expiration'] - ts

            for (let exp of METRICS_EXPIRY_BUCKETS) {
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

    return {
        count,
        expiry
    }
}

const renderMetrics = (snapshot: MetricsSnapshot) => `# HELP rdap_keys_cached_total The total number of cached RDAP lookups
# TYPE rdap_keys_cached_total counter
rdap_keys_cached_total ${snapshot.count}
# HELP rdap_keys_expires_total The total number of cached RDAP lookups expiring in a set timeframe
# TYPE rdap_keys_expires_total histogram
rdap_keys_expires_total{handler="/metrics",le="3600"} ${snapshot.expiry['3600']}
rdap_keys_expires_total{handler="/metrics",le="21600"} ${snapshot.expiry['21600']}
rdap_keys_expires_total{handler="/metrics",le="43200"} ${snapshot.expiry['43200']}
rdap_keys_expires_total{handler="/metrics",le="86400"} ${snapshot.expiry['86400']}
`

export const getMetricsFromCache = async (env: Env) => env.KV.get(METRICS_CACHE_KEY)

const updateMetricsCache = async (env: Env) => {
    const snapshot = await buildMetricsSnapshot(env)
    const payload = renderMetrics(snapshot)

    await env.KV.put(METRICS_CACHE_KEY, payload, {
        expirationTtl: METRICS_CACHE_TTL
    })

    return payload
}

const updateBootstrapCache = async (env: Env) => {
    if (!env.KV) return

    const cacheTtl = env.BOOTSTRAP_TTL || 86400
    const rdap = new Rdap(env)
    const whois = new Whois(env)

    const [rdapServices, whoisServices] = await Promise.all([
        rdap.getServices({ forceRefresh: true, writeCache: false }),
        whois.getServices({ forceRefresh: true, writeCache: false })
    ]) as [RdapServices, WhoisServices]

    const rdapKeys = ['asn', 'domains', 'ipv4', 'ipv6']
    const rdapOk = rdapKeys.every((key) =>
        rdapServices[key] && Object.keys(rdapServices[key]).length > 0
    )
    const whoisOk = whoisServices.domains
        && Object.keys(whoisServices.domains).length > 0

    if (!rdapOk || !whoisOk) {
        throw new Error('Bootstrap sanity check failed')
    }

    await Promise.all([
        env.KV.put('bootstrap:rdap', JSON.stringify(rdapServices), {
            expirationTtl: cacheTtl
        }),
        env.KV.put('bootstrap:whois', JSON.stringify(whoisServices), {
            expirationTtl: cacheTtl
        })
    ])
}

const cleanupLegacyRdapKeys = async (env: Env) => {
    let cursor = ''
    let complete = false
    let deleted = 0

    while (complete !== true && deleted < LEGACY_RDAP_DELETE_LIMIT) {
        let data = await env.KV.list({
            'prefix': LEGACY_RDAP_PREFIX,
            'cursor': cursor
        })

        if (data['keys'].length === 0) {
            complete = data['list_complete']
            if (complete !== true) {
                cursor = 'cursor' in data ? data.cursor : ''
            }
            continue
        }

        let remaining = LEGACY_RDAP_DELETE_LIMIT - deleted
        let toDelete = data['keys'].slice(0, remaining).map((key) => key.name)

        await Promise.all(toDelete.map((key) => env.KV.delete(key)))

        deleted = deleted + toDelete.length
        complete = data['list_complete']
        if (complete !== true) {
            cursor = 'cursor' in data ? data.cursor : ''
        }
    }
}

export const runScheduledTasks = async (env: Env, cron?: string) => {
    if (cron === BOOTSTRAP_CRON) {
        await updateBootstrapCache(env)
        return
    }

    if (!cron || cron === METRICS_CRON) {
        await updateMetricsCache(env)
    }
}
