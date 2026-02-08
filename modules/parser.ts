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

type TldPatterns = Record<string, string>

type CompiledTldRules = {
    dateFormat?: string
    regexes: Record<string, RegExp>
    keys: string[]
}

const multiMatchKeys = new Set(['status', 'nameservers'])

const baseTldPatterns: Record<string, TldPatterns> = {
    '.com': {
        registrar: 'Registrar: *(.+)',
        updatedDate: 'Updated Date: *(.+)',
        creationDate: 'Creation Date: *(.+)',
        expirationDate: 'Expir\\w+ Date: *(.+)',
        status: 'Status:\\s*(.+)\\s*\\n',
        notFound: 'No match for '
    },
    '.org': {
        registrar: 'Registrar: *(.+)',
        updatedDate: 'Updated Date: *(.+)',
        creationDate: 'Creation Date: *(.+)',
        expirationDate: 'Expir\\w+ Date: *(.+)',
        status: 'Status: *(.+)',
        notFound: '^(NOT FOUND|Domain not found)'
    },
    '.au': {
        updatedDate: 'Last Modified: *(.+)',
        registrar: 'Registrar Name: *(.+)',
        status: 'Status: *(.+)',
        rateLimited: 'WHOIS LIMIT EXCEEDED',
        notFound: '^NOT FOUND'
    },
    '.us': {
        registrar: 'Registrar: *(.+)',
        status: 'Domain Status: *(.+)',
        creationDate: 'Creation Date: *(.+)',
        expirationDate: 'Registrar Registration Expiration Date: *(.+)',
        updatedDate: 'Updated Date: *(.+)',
        notFound: '^No Data Found',
        nameservers: 'Name Server: *([\\S]+)',
        dateFormat: 'YYYY-MM-DDThh:mm:ssZ'
    },
    '.ru': {
        registrar: 'registrar: *(.+)',
        creationDate: 'created: *(.+)',
        expirationDate: 'paid-till: *(.+)',
        status: 'state: *(.+)',
        notFound: 'No entries found'
    },
    '.uk': {
        registrar: 'Registrar:\\s*(.+)',
        status: 'Registration status:\\s*(.+)',
        creationDate: 'Registered on:\\s*(.+)',
        expirationDate: 'Expiry date:\\s*(.+)',
        updatedDate: 'Last updated:\\s*(.+)',
        notFound: 'No match for ',
        dateFormat: 'DD-MMM-YYYY'
    },
    '.fr': {
        registrar: 'registrar: *(.+)',
        creationDate: 'created: *(.+)',
        expirationDate: 'Expiry Date:\\s?(.+)',
        status: 'status: *([A-Z]+)',
        updatedDate: 'last-update: *(.+)',
        notFound: '(No entries found in |%% NOT FOUND)',
        dateFormat: 'YYYY-MM-DDThh:mm:ssZ'
    },
    '.nl': {
        registrar: 'Registrar: *\\s*(.+)',
        status: 'Status: *(.+)',
        notFound: '\\.nl is free',
        rateLimited: 'maximum number of requests per second exceeded'
    },
    '.fi': {
        registrar: 'registrar\\.*: *(.*)',
        status: 'status\\.*: *([\\S]+)',
        creationDate: 'created\\.*: *([\\S]+)',
        updatedDate: 'modified\\.*: *([\\S]+)',
        expirationDate: 'expires\\.*: *([\\S]+)',
        notFound: 'Domain not found',
        dateFormat: 'DD.MM.YYYY hh:mm:ss'
    },
    '.pt': {
        status: 'Domain Status: *(.+)',
        creationDate: 'Creation Date\\.*: *([\\S]+)',
        expirationDate: 'Expiration Date\\.*: *([\\S]+)',
        nameservers: 'Name Server: ([\\S]+)',
        notFound: 'No Match',
        rateLimited: 'maximum number of requests per second exceeded',
        dateFormat: 'DD/MM/YYYY hh:mm:ss'
    },
    '.jp': {
        creationDate: '\\[Registered Date\\]\\s*(.+)',
        updatedDate: '\\[Last Update\\]\\s?(.+)',
        status: '\\[State\\]\\s*(.+)',
        notFound: 'No match!!',
        dateFormat: 'YYYY/MM/DD'
    },
    '.pl': {
        registrar: 'REGISTRAR: *\\s*(.+)',
        status: 'Registration status:\\n\\s*(.+)',
        creationDate: 'created: *(.+)',
        expirationDate: 'renewal date: *(.+)',
        updatedDate: 'last modified: *(.+)',
        notFound: 'No information available about domain name',
        dateFormat: 'YYYY.MM.DD hh:mm:ss'
    },
    '.br': {
        status: 'status: *(.+)',
        creationDate: 'created: *(.+)',
        expirationDate: 'expires: *(.+)',
        updatedDate: 'changed: *(.+)',
        dateFormat: 'YYYYMMDD',
        notFound: 'No match for '
    },
    '.eu': {
        registrar: 'Registrar: *\\n *Name: *([^\\n\\r]+)',
        notFound: 'Status: AVAILABLE'
    },
    '.ee': {
        status: 'Domain: *[\\n\\r]+\\s*name: *[^\\n\\r]+\\sstatus: *([^\\n\\r]+)',
        creationDate: 'Domain: *[\\n\\r]+\\s*name: *[^\\n\\r]+\\sstatus: *[^\\n\\r]+\\sregistered: *([^\\n\\r]+)',
        updatedDate: 'Domain: *[\\n\\r]+\\s*name: *[^\\n\\r]+\\sstatus: *[^\\n\\r]+\\sregistered: *[^\\n\\r]+\\schanged: *([^\\n\\r]+)',
        expirationDate: 'Domain: *[\\n\\r]+\\s*name: *[^\\n\\r]+\\sstatus: *[^\\n\\r]+\\sregistered: *[^\\n\\r]+\\schanged: *[^\\n\\r]+\\sexpire: *([^\\n\\r]+)',
        registrar: 'Registrar: *[\\n\\r]+\\s*name: *([^\\n\\r]+)',
        notFound: 'Domain not found',
        dateFormat: 'YYYY-MM-DD'
    },
    '.kr': {
        creationDate: 'Registered Date\\s*: *(.+)',
        updatedDate: 'Last Updated Date\\s*: *(.+)',
        expirationDate: 'Expiration Date\\s*: *(.+)',
        registrar: 'Authorized Agency\\s*: *(.+)',
        dateFormat: 'YYYY. MM. DD.',
        notFound: 'The requested domain was not found '
    },
    '.bg': {
        status: 'registration status:\\s*(.+)',
        notFound: 'registration status: available',
        rateLimited: 'Query limit exceeded'
    },
    '.de': {
        status: 'Status: *(.+)',
        updatedDate: 'Changed: *(.+)',
        nameservers: 'Nserver: ([\\S]+)',
        notFound: 'Status: *free'
    },
    '.at': {
        updatedDate: 'changed: *(.+)',
        registrar: 'registrar: *(.+)',
        notFound: ' nothing found',
        dateFormat: 'YYYYMMDD hh:mm:ss',
        rateLimited: 'Quota exceeded'
    },
    '.ca': {
        status: 'Domain Status: *(.+)',
        updatedDate: 'Updated Date: *(.+)',
        creationDate: 'Creation Date: *(.+)',
        expirationDate: 'Expiry Date: *(.+)',
        registrar: 'Registrar: *(.+)',
        notFound: 'Not found: '
    },
    '.be': {
        registrar: 'Registrar: *[\\n\\r]+\\s*Name:\\s*(.+)',
        status: 'Status:\\s*(.+)',
        creationDate: 'Registered: *(.+)',
        dateFormat: 'ddd MMM DD YYYY',
        notFound: 'Status:\\s*AVAILABLE'
    },
    '.info': {
        registrar: 'Registrar: *(.+)',
        updatedDate: 'Updated Date: *(.+)',
        creationDate: 'Creation Date: *(.+)',
        expirationDate: 'Registrar Registration Expiration Date: *(.+)',
        status: 'Status: *(.+)',
        notFound: '^(NOT FOUND|Domain not found)'
    },
    '.kg': {
        creationDate: 'Record created:\\s*(.+)',
        expirationDate: 'Record expires on:\\s*(.+)',
        updatedDate: 'Record last updated on:\\s*(.+)',
        dateFormat: 'ddd MMM DD HH:mm:ss YYYY',
        notFound: 'domain is available for registration'
    },
    '.id': {
        creationDate: 'Created On:(.+)',
        expirationDate: 'Expiration Date(.+)',
        updatedDate: 'Last Updated On(.+)',
        registrar: 'Sponsoring Registrar Organization:(.+)',
        status: 'Status:(.+)',
        notFound: 'DOMAIN NOT FOUND',
        dateFormat: 'DD-MMM-YYYY HH:mm:ss UTC'
    },
    '.sk': {
        creationDate: 'Created:\\s*(.+)',
        expirationDate: 'Valid Until:\\s*(.+)',
        status: 'EPP Status:\\s*(.+)',
        updatedDate: 'Updated:\\s*(.+)',
        registrar: 'Registrar:\\s*(.+)',
        dateFormat: 'YYYY-MM-DD',
        notFound: 'Domain not found'
    },
    '.se': {
        creationDate: 'created\\.*: *(.+)',
        updatedDate: 'modified\\.*: *(.+)',
        expirationDate: 'expires\\.*: *(.+)',
        status: 'status\\.*: *(.+)',
        registrar: 'registrar: *(.+)',
        nameservers: 'nserver: *([\\S]+)',
        dateFormat: 'YYYY-MM-DD',
        notFound: '\" not found.'
    },
    '.is': {
        creationDate: 'created\\.*: *(.+)',
        expirationDate: 'expires\\.*: *(.+)',
        dateFormat: 'MMM DD YYYY',
        notFound: 'No entries found for query'
    },
    '.it': {
        creationDate: 'Created\\.*: *(.+)',
        expirationDate: 'Expire Date\\.*: *(.+)',
        updatedDate: 'Last Update: *(.+)',
        status: 'Status:\\s*(.+)\\s*\\n',
        dateFormat: 'YYYY-MM-DD',
        notFound: 'AVAILABLE'
    },
    '.co': {
        registrar: 'Registrar: *(.+)',
        updatedDate: 'Updated Date: *(.+)',
        creationDate: 'Creation Date: *(.+)',
        expirationDate: 'Expir\\w+ Date: *(.+)',
        status: 'Status:\\s*(.+)\\s*\\n',
        notFound: 'No Data Found'
    },
    default: {
        registrar: 'Registrar: *(.+)',
        updatedDate: 'Updated Date: *(.+)',
        creationDate: 'Creat(ed|ion) Date: *(.+)',
        expirationDate: 'Expir\\w+ Date: *(.+)',
        status: 'Status:\\s*(.+)\\s*\\n',
        dateFormat: 'YYYY-MM-DDThh:mm:ssZ',
        notFound: '(No match for |Domain not found|NOT FOUND\\s)'
    }
}

const supplementalTlds: Record<string, string[]> = {
    '.com': ['.net', '.name'],
    '.org': ['.me', '.mobi'],
    '.ru': ['.рф', '.su'],
    '.us': ['.biz'],
    '.se': ['.nu']
}

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

    for (const [tld, patterns] of Object.entries(baseTldPatterns)) {
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
