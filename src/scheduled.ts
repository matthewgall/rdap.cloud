import { LEGACY_RDAP_DELETE_LIMIT, LEGACY_RDAP_PREFIX } from './constants'
import Rdap from '../modules/rdap'
import Whois from '../modules/whois'

type RdapServices = Record<string, Record<string, string>>
type WhoisServices = { domains: Record<string, string> }

const BOOTSTRAP_CRON = '0 3 * * *'

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
    }
}
