import { describe, expect, it, vi } from 'vitest'

vi.mock('cloudflare:sockets', () => ({
    connect: () => {
        throw new Error('cloudflare:sockets is not available in tests')
    }
}))

const Lookup = (await import('../modules/lookup')).default

const servicesFixture = {
    rdap: {
        ipv4: {
            '1.0.0.0/8': 'https://rdap.arin.net/registry/',
            '8.0.0.0/8': 'https://rdap.arin.net/registry/'
        },
        ipv6: {
            '2a0e:1d47:d502:7400::/56': 'https://rdap.ripe.net/'
        },
        domains: {
            'co.uk': 'https://rdap.nominet.uk/',
            'com': 'https://rdap.verisign.com/com/v1/'
        },
        asn: {
            '13335-13335': 'https://rdap.arin.net/registry/',
            '212655-212655': 'https://rdap.ripe.net/'
        }
    },
    whois: {
        domains: {}
    }
}

const makeLookup = (target: string) => {
    const lookup = new Lookup(target)
    lookup.getServices = async () => servicesFixture
    return lookup
}

describe('Lookup classification', () => {
    const cases: Array<[string, string]> = [
        ['1.1.1.1', 'ip'],
        ['2a0e:1d47:d502:7400:1262:e5ff:fe19:c8c8', 'ip'],
        ['bbc.co.uk', 'domain'],
        ['google.com', 'domain'],
        ['13335', 'asn'],
        ['AS13335', 'asn'],
        ['ASN13335', 'asn'],
        ['as13335', 'asn'],
        ['asn13335', 'asn'],
        ['212655', 'asn'],
        ['lololololol', 'invalid'],
        ['notadomain', 'invalid']
    ]

    it.each(cases)('classifies %s as %s', async (input, expected) => {
        const lookup = makeLookup(input)
        const type = await lookup.getType()
        expect(type).toBe(expected)
    })

    const normalizationCases: Array<[string, string]> = [
        ['13335', '13335'],
        ['AS13335', '13335'],
        ['ASN13335', '13335'],
        ['as13335', '13335'],
        ['asn13335', '13335']
    ]

    it.each(normalizationCases)('normalizes %s to ASN %s', async (input, expected) => {
        const lookup = makeLookup(input)
        await lookup.getType()
        expect(lookup.target).toBe(expected)
    })
})
