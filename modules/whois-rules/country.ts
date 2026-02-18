import type { TldPatternMap } from './types'

export const countryTlds: TldPatternMap = {
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
        notFound: '\\\" not found.'
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
    }
}
