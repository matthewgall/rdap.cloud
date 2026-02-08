import moment from 'moment'
import { describe, expect, it } from 'vitest'

import parseRawData from '../modules/parser'

describe('parseRawData', () => {
    it('parses .com WHOIS data into RDAP-like fields', () => {
        const rawData = [
            'Domain Name: EXAMPLE.COM',
            'Registrar: Example Registrar',
            'Updated Date: 2021-05-10T12:00:00Z',
            'Creation Date: 2020-05-10T12:00:00Z',
            'Registrar Registration Expiration Date: 2022-05-10T12:00:00Z',
            'Status: ok',
            ''
        ].join('\n')

        const result = parseRawData(rawData, 'example.com')

        expect(result.registrar).toBe('Example Registrar')
        expect(result.status).toEqual(['ok'])
        expect(result.events).toEqual([
            {
                eventAction: 'last changed',
                eventDate: moment('2021-05-10T12:00:00Z').toJSON()
            },
            {
                eventAction: 'registration',
                eventDate: moment('2020-05-10T12:00:00Z').toJSON()
            },
            {
                eventAction: 'expiration',
                eventDate: moment('2022-05-10T12:00:00Z').toJSON()
            }
        ])
    })

    it('parses nameservers and formatted dates for .us', () => {
        const rawData = [
            'Domain Name: EXAMPLE.US',
            'Registrar: Example Registrar',
            'Creation Date: 2020-01-02T03:04:05Z',
            'Registrar Registration Expiration Date: 2022-01-02T03:04:05Z',
            'Updated Date: 2021-01-02T03:04:05Z',
            'Domain Status: active',
            'Name Server: NS1.EXAMPLE.US',
            'Name Server: NS2.EXAMPLE.US'
        ].join('\n')

        const result = parseRawData(rawData, 'example.us')

        expect(result.status).toEqual(['active'])
        expect(result.nameservers).toEqual([
            {
                objectClassName: 'nameserver',
                ldhName: 'NS1.EXAMPLE.US'
            },
            {
                objectClassName: 'nameserver',
                ldhName: 'NS2.EXAMPLE.US'
            }
        ])
        expect(result.events).toEqual([
            {
                eventAction: 'registration',
                eventDate: moment('2020-01-02T03:04:05Z', 'YYYY-MM-DDThh:mm:ssZ').toJSON()
            },
            {
                eventAction: 'expiration',
                eventDate: moment('2022-01-02T03:04:05Z', 'YYYY-MM-DDThh:mm:ssZ').toJSON()
            },
            {
                eventAction: 'last changed',
                eventDate: moment('2021-01-02T03:04:05Z', 'YYYY-MM-DDThh:mm:ssZ').toJSON()
            }
        ])
    })

    it('supports supplemental TLD mappings like .net', () => {
        const rawData = [
            'Domain Name: EXAMPLE.NET',
            'Registrar: Example Registrar',
            'Updated Date: 2021-05-10T12:00:00Z',
            'Creation Date: 2020-05-10T12:00:00Z',
            'Registrar Registration Expiration Date: 2022-05-10T12:00:00Z',
            'Status: ok',
            ''
        ].join('\n')

        const result = parseRawData(rawData, 'example.net')

        expect(result.registrar).toBe('Example Registrar')
        expect(result.status).toEqual(['ok'])
    })

    it('throws for not-found responses', () => {
        const rawData = 'NOT FOUND - Domain not found'
        expect(() => parseRawData(rawData, 'missing.org')).toThrow(
            'does not appear to be a registered domain name, IP address or ASN'
        )
    })

    it('throws for rate-limited responses', () => {
        expect(() => parseRawData('WHOIS LIMIT EXCEEDED', 'limited.au')).toThrow(
            'rate limiting queries'
        )
    })
})
