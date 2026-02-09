import type { TldPatternMap } from './types'

export const genericTlds: TldPatternMap = {
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
    '.info': {
        registrar: 'Registrar: *(.+)',
        updatedDate: 'Updated Date: *(.+)',
        creationDate: 'Creation Date: *(.+)',
        expirationDate: 'Registrar Registration Expiration Date: *(.+)',
        status: 'Status: *(.+)',
        notFound: '^(NOT FOUND|Domain not found)'
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
