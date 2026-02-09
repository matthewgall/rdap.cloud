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

import moment from 'moment'

import { supplementalTlds, tldPatterns } from './whois-rules'
import type { TldPatterns } from './whois-rules'

type CompiledTldRules = {
    dateFormat?: string
    regexes: Record<string, RegExp>
    keys: string[]
}

const multiMatchKeys = new Set(['status', 'nameservers'])

const eventMap: Record<string, string> = {
    creationDate: 'registration',
    updatedDate: 'last changed',
    expirationDate: 'expiration'
}

const compileTldPatterns = (patterns: TldPatterns): CompiledTldRules => {
    const keys = Object.keys(patterns).filter((key) => key !== 'dateFormat')
    const regexes: Record<string, RegExp> = {}

    for (const key of keys) {
        const flags = multiMatchKeys.has(key) ? 'g' : undefined
        regexes[key] = new RegExp(patterns[key], flags)
    }

    return {
        dateFormat: patterns.dateFormat,
        regexes,
        keys
    }
}

const tldRules: Record<string, CompiledTldRules> = (() => {
    const compiled: Record<string, CompiledTldRules> = {}

    for (const [tld, patterns] of Object.entries(tldPatterns)) {
        compiled[tld] = compileTldPatterns(patterns)
    }

    for (const [source, aliases] of Object.entries(supplementalTlds)) {
        for (const alias of aliases) {
            compiled[alias] = compiled[source]
        }
    }

    return compiled
})()

const getTld = (domain: string) => {
    const lastDot = domain.lastIndexOf('.')
    if (lastDot === -1 || lastDot === domain.length - 1) return null
    return domain.slice(lastDot)
}

const parseRawData = (rawData: string | null, domain: string) => {
    if (rawData === null) {
        throw new Error('No Whois data received')
    }

    if (rawData.length <= 10) {
        throw new Error(`Bad WHOIS Data: "${rawData}"`)
    }

    const result: any = {
        objectClassName: 'domain',
        ldhName: domain.toUpperCase(),
        rdapConformance: [
            'rdap_level_0',
            'icann_rdap_technical_implementation_guide_0',
            'icann_rdap_response_profile_0',
            'rdap_cloud_whois_1'
        ],
        notices: [
            {
                title: 'WHOIS-derived response',
                type: 'result set',
                description: [
                    'This response is derived from WHOIS data and mapped into an RDAP-like structure.'
                ]
            }
        ]
    }

    const tld = getTld(domain)
    if (!tld || !tldRules[tld]) {
        throw new Error(
            `${domain} is not supported by RDAP. This may be because the domain belongs to a ccTLD, or the gTLD has not deployed RDAP`
        )
    }

    const domainRules = tldRules[tld]

    for (const key of domainRules.keys) {
        const regex = domainRules.regexes[key]

        if (key === 'rateLimited') {
            if (regex.test(rawData)) {
                throw new Error(
                    'We were unable to complete the lookup as the server appears to be rate limiting queries'
                )
            }
            continue
        }

        if (key === 'notFound') {
            if (regex.test(rawData) && !Object.prototype.hasOwnProperty.call(result, 'isAvailable')) {
                throw new Error(
                    `${domain} does not appear to be a registered domain name, IP address or ASN`
                )
            }
            continue
        }

        if (multiMatchKeys.has(key)) {
            for (const match of rawData.matchAll(regex)) {
                const value = match[1]
                if (!value) continue

                if (key === 'nameservers') {
                    if (!result[key]) result[key] = []
                    result[key].push({
                        objectClassName: 'nameserver',
                        ldhName: value.toUpperCase()
                    })
                    continue
                }

                if (!result[key]) result[key] = []
                result[key].push(value)
            }
            continue
        }

        const match = regex.exec(rawData)
        if (!match) continue

        const value = match[match.length - 1]
        if (['expirationDate', 'creationDate', 'updatedDate'].includes(key)) {
            if (!result.events) result.events = []
            const eventDate = domainRules.dateFormat
                ? moment(value, domainRules.dateFormat).toJSON()
                : moment(value).toJSON()

            result.events.push({
                eventAction: eventMap[key],
                eventDate
            })
            continue
        }

        result[key] = value
    }

    return result
}

export default parseRawData
