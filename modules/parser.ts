import moment from "moment";

var tlds = {
	'.com': {
		'domainName': 'Domain Name: *([^\\s]+)',
		'registrar': 'Registrar: *(.+)',
		'updatedDate': 'Updated Date: *(.+)',
		'creationDate': 'Creation Date: *(.+)',
		'expirationDate': 'Expir\\w+ Date: *(.+)',
		'status': 'Status:\\s*(.+)\\s*\\n',
		'notFound': 'No match for '
	},
	'.org': {
		'domainName': 'Domain Name: *([^\\s]+)',
		'registrar': 'Registrar: *(.+)',
		'updatedDate': 'Updated Date: *(.+)',
		'creationDate': 'Creation Date: *(.+)',
		'expirationDate': 'Expir\\w+ Date: *(.+)',
		'status': 'Status: *(.+)',
		'notFound': '^(NOT FOUND|Domain not found)'
	},
	'.au': {
		'domainName': 'Domain Name: *([^\\s]+)',
		'updatedDate': 'Last Modified: *(.+)',
		'registrar': 'Registrar Name: *(.+)',
		'status': 'Status: *(.+)',
		'rateLimited': 'WHOIS LIMIT EXCEEDED',
		'notFound': '^NOT FOUND'
	},
	'.us': {
		'domainName': 'Domain Name: *([^\\s]+)',
		'registrar': 'Registrar: *(.+)',
		'status': 'Domain Status: *(.+)',
		'creationDate': 'Creation Date: *(.+)',
		'expirationDate': 'Registrar Registration Expiration Date: *(.+)',
		'updatedDate': 'Updated Date: *(.+)',
		'notFound': '^No Data Found',
		'dateFormat': 'YYYY-MM-DDThh:mm:ssZ'
	},
	'.ru': {
		'domainName': 'domain: *([^\\s]+)',
		'registrar': 'registrar: *(.+)',
		'creationDate': 'created: *(.+)',
		'expirationDate': 'paid-till: *(.+)',
		'status': 'state: *(.+)',
		'notFound': 'No entries found'
	},
	'.uk': {
		'domainName': 'Domain name:\\s*([^\\s]+)',
		'registrar': 'Registrar:\\s*(.+)',
		'status': 'Registration status:\\s*(.+)',
		'creationDate': 'Registered on:\\s*(.+)',
		'expirationDate': 'Expiry date:\\s*(.+)',
		'updatedDate': 'Last updated:\\s*(.+)',
		'notFound': 'No match for ',
		'dateFormat': 'DD-MMM-YYYY'
	},
	'.fr': {
		'domainName': 'domain: *([^\\s]+)',
		'registrar': 'registrar: *(.+)',
		'creationDate': 'created: *(.+)',
		'expirationDate': 'Expiry Date:\\s?(.+)',
		'status': 'status: *([A-Z]+)',
		'updatedDate': 'last-update: *(.+)',
		'notFound': '(No entries found in |%% NOT FOUND)',
		'dateFormat': 'YYYY-MM-DDThh:mm:ssZ'
	},
	'.nl': {
		'domainName': 'Domain Name: *([^\\s]+)',
		'registrar': 'Registrar: *\\s*(.+)',
		'status': 'Status: *(.+)',
		'notFound': '\\.nl is free',
		'rateLimited': 'maximum number of requests per second exceeded'
	},
	'.fi': {
		'domainName': 'domain\\.*: *([\\S]+)',
		'registrar': 'registrar\\.*: *(.*)',
		'status': 'status\\.*: *([\\S]+)',
		'creationDate': 'created\\.*: *([\\S]+)',
		'updatedDate': 'modified\\.*: *([\\S]+)',
		'expirationDate': 'expires\\.*: *([\\S]+)',
		'notFound': 'Domain not found',
		'dateFormat': 'DD.MM.YYYY hh:mm:ss'
	},
	'.pt': {
		'domainName': 'Domain: *([^\\s]+)',
		'status': 'Domain Status: *(.+)',
		'creationDate': 'Creation Date\\.*: *([\\S]+)',
		'expirationDate': 'Expiration Date\\.*: *([\\S]+)',
		'notFound': 'No Match',
		'rateLimited': 'maximum number of requests per second exceeded',
		'dateFormat': 'DD/MM/YYYY hh:mm:ss'
	},
	'.jp': {
		'domainName': '\\[Domain Name\\]\\s*([^\\s]+)',
		'creationDate': '\\[Registered Date\\]\\s*(.+)',
		'updatedDate': '\\[Last Update\\]\\s?(.+)',
		'status': '\\[State\\]\\s*(.+)',
		'notFound': 'No match!!',
		'dateFormat': 'YYYY/MM/DD'
	},
	'.pl': {
		'domainName': 'DOMAIN NAME: *([^\\s]+)[\s]+$',
		'registrar': 'REGISTRAR: *\\s*(.+)',
		'status': 'Registration status:\\n\\s*(.+)',
		'creationDate': 'created: *(.+)',
		'expirationDate': 'renewal date: *(.+)',
		'updatedDate': 'last modified: *(.+)',
		'notFound': 'No information available about domain name',
		'dateFormat': 'YYYY.MM.DD hh:mm:ss'
	},
	'.br': {
		'domainName': 'domain: *([^\\s]+)\n',
		'status': 'status: *(.+)',
		'creationDate': 'created: *(.+)',
		'expirationDate': 'expires: *(.+)',
		'updatedDate': 'changed: *(.+)',
		'dateFormat': 'YYYYMMDD',
		'notFound': 'No match for '
	},
	'.eu': {
		'domainName': 'Domain: *([^\\n\\r]+)',
		'registrar': 'Registrar: *\\n *Name: *([^\\n\\r]+)',
		'notFound': 'Status: AVAILABLE'
	},
	'.ee': {
		'domainName': 'Domain: *[\\n\\r]+\s*name: *([^\\n\\r]+)',
		'status': 'Domain: *[\\n\\r]+\\s*name: *[^\\n\\r]+\\sstatus: *([^\\n\\r]+)',
		'creationDate': 'Domain: *[\\n\\r]+\\s*name: *[^\\n\\r]+\\sstatus: *[^\\n\\r]+\\sregistered: *([^\\n\\r]+)',
		'updatedDate': 'Domain: *[\\n\\r]+\\s*name: *[^\\n\\r]+\\sstatus: *[^\\n\\r]+\\sregistered: *[^\\n\\r]+\\schanged: *([^\\n\\r]+)',
		'expirationDate': 'Domain: *[\\n\\r]+\\s*name: *[^\\n\\r]+\\sstatus: *[^\\n\\r]+\\sregistered: *[^\\n\\r]+\\schanged: *[^\\n\\r]+\\sexpire: *([^\\n\\r]+)',
		'registrar': 'Registrar: *[\\n\\r]+\\s*name: *([^\\n\\r]+)',
		'notFound': 'Domain not found',
		'dateFormat': 'YYYY-MM-DD'
	},
	'.kr': {
		'domainName': 'Domain Name\\s*: *([^\\s]+)',
		'creationDate': 'Registered Date\\s*: *(.+)',
		'updatedDate': 'Last Updated Date\\s*: *(.+)',
		'expirationDate': 'Expiration Date\\s*: *(.+)',
		'registrar': 'Authorized Agency\\s*: *(.+)',
		'dateFormat': 'YYYY. MM. DD.',
		'notFound': 'The requested domain was not found '
	},
	'.bg': {
		'domainName': 'DOMAIN NAME: *([^\\s]+)',
		'status': 'registration status:\\s*(.+)',
		'notFound': 'registration status: available',
		'rateLimited': 'Query limit exceeded'
	},
	'.de': {
		'domainName': 'Domain: *([^\\s]+)',
		'status': 'Status: *(.+)',
		'updatedDate': 'Changed: *(.+)',
		'notFound': 'Status: *free'
	},
	'.at': {
		'domainName': 'domain: *([^\\s]+)',
		'updatedDate': 'changed: *(.+)',
		'registrar': 'registrar: *(.+)',
		'notFound': ' nothing found',
		'dateFormat': 'YYYYMMDD hh:mm:ss',
		'rateLimited': 'Quota exceeded'
	},
	'.ca': {
		'domainName': 'Domain Name: *([^\\s]+)',
		'status': 'Domain Status: *(.+)',
		'updatedDate': 'Updated Date: *(.+)',
		'creationDate': 'Creation Date: *(.+)',
		'expirationDate': 'Expiry Date: *(.+)',
		'registrar': 'Registrar: *(.+)',
		'notFound': 'Not found: '
	},
	'.be': {
		'domainName': 'Domain:\\s*([^\\s]+)',
		'registrar': 'Registrar: *[\\n\\r]+\\s*Name:\\s*(.+)',
		'status': 'Status:\\s*(.+)',
		'creationDate': 'Registered: *(.+)',
		'dateFormat': 'ddd MMM DD YYYY',
		'notFound': 'Status:\\s*AVAILABLE'
	},
	'.info': {
		'domainName': 'Domain Name: *([^\\s]+)',
		'registrar': 'Registrar: *(.+)',
		'updatedDate': 'Updated Date: *(.+)',
		'creationDate': 'Creation Date: *(.+)',
		'expirationDate': 'Registrar Registration Expiration Date: *(.+)',
		'status': 'Status: *(.+)',
		'notFound': '^(NOT FOUND|Domain not found)'
		//'dateFormat':       'YYYY-MM-DDTHH:mm:ssZ'
	},
	'.kg': {
		'domainName': '^Domain\\s*([^\\s]+)',
		//'registrar': 'Domain support: \\s*(.+)',
		'creationDate': 'Record created:\\s*(.+)',
		'expirationDate': 'Record expires on:\\s*(.+)',
		'updatedDate': 'Record last updated on:\\s*(.+)',
		'dateFormat': 'ddd MMM DD HH:mm:ss YYYY',
		'notFound': 'domain is available for registration'
	},
	'.id': {
		'domainName': 'Domain Name:([^\\s]+)',
		'creationDate': 'Created On:(.+)',
		'expirationDate': 'Expiration Date(.+)',
		'updatedDate': 'Last Updated On(.+)',
		'registrar': 'Sponsoring Registrar Organization:(.+)',
		'status': 'Status:(.+)',
		'notFound': 'DOMAIN NOT FOUND',
		'dateFormat': 'DD-MMM-YYYY HH:mm:ss UTC'
	},
	'.sk': {
		'domainName': 'Domain:\\s*([^\\s]+)',
		'creationDate': 'Created:\\s*(.+)',
		'expirationDate': 'Valid Until:\\s*(.+)',
		'status': 'EPP Status:\\s*(.+)',
		'updatedDate': 'Updated:\\s*(.+)',
		'registrar': 'Registrar:\\s*(.+)',
		'dateFormat': 'YYYY-MM-DD',
		'notFound': 'Domain not found'
	},
	'.se': {
		'domainName': 'domain\\.*: *([^\\s]+)',
		'creationDate': 'created\\.*: *(.+)',
		'updatedDate': 'modified\\.*: *(.+)',
		'expirationDate': 'expires\\.*: *(.+)',
		'status': 'status\\.*: *(.+)',
		'registrar': 'registrar: *(.+)',
		'dateFormat': 'YYYY-MM-DD',
		'notFound': '\\" not found.'
	},
	'.is': {
		'domainName': 'domain\\.*: *([^\\s]+)',
		'creationDate': 'created\\.*: *(.+)',
		'expirationDate': 'expires\\.*: *(.+)',
		'dateFormat': 'MMM DD YYYY',
		'notFound': 'No entries found for query'
	},
	'.it': {
		'domainName': 'Domain\\.*: *([^\\s]+)',
		'creationDate': 'Created\\.*: *(.+)',
		'expirationDate': 'Expire Date\\.*: *(.+)',
		'updatedDate': 'Last Update: *(.+)',
		'status': 'Status:\\s*(.+)\\s*\\n',
		'dateFormat': 'YYYY-MM-DD',
		'notFound': 'AVAILABLE'
	},
	'.co': {
		'domainName': 'Domain Name: *([^\\s]+)',
		'registrar': 'Registrar: *(.+)',
		'updatedDate': 'Updated Date: *(.+)',
		'creationDate': 'Creation Date: *(.+)',
		'expirationDate': 'Expir\\w+ Date: *(.+)',
		'status': 'Status:\\s*(.+)\\s*\\n',
		'notFound': 'No Data Found'
	},
	'default': {
		'domainName': 'Domain Name: *([^\\s]+)',
		'registrar': 'Registrar: *(.+)',
		'updatedDate': 'Updated Date: *(.+)',
		'creationDate': 'Creat(ed|ion) Date: *(.+)',
		'expirationDate': 'Expir\\w+ Date: *(.+)',
		'status': 'Status:\\s*(.+)\\s*\\n',
		'dateFormat': 'YYYY-MM-DDThh:mm:ssZ',
		'notFound': '(No match for |Domain not found|NOT FOUND\\s)'
	}
}
var supplimental: any = {
	'.com': ['.net', '.name'],
	'.org': ['.me', '.mobi'],
	'.ru': ['.рф', '.su'],
	'.us': ['.biz'],
	'.se': ['.nu']
}

var parseRawData = function (rawData, domain) {
    if (rawData === null) {
        throw new Error('No Whois data received');
    } else if (rawData.length <= 10) {
        throw new Error('Bad WHOIS Data: "' + rawData + '"');
    }

    let result: any = {domainName: domain};

    let unknownTLD: any = false;
	// So first, set a default parser
    let domainRegex: any = tlds['default'];
	// And identify the ending of the domain we're looking for
	let endingRegex: any = new RegExp('(\.[a-z]$)', 'g');
	let ending: any = domain.match(endingRegex)

	// Next, we suppliment our data with additional information
	for (let s of Object.keys(supplimental)) {
		for (let i of supplimental[s]) {
			tlds[i] = tlds[s]
		}
	}

	// Now, we find if we have a match
	if (ending.length > 0) {
		domainRegex = tlds[`.${ending[0]}`];
	}
	else {
		unknownTLD = true;
	}

    Object.keys(domainRegex).forEach(function (key) {
        // Find multiple matches for status field
		let regex: any;

        if (key === 'status') {
            regex = new RegExp(domainRegex[key], 'g');
        } else {
            regex = new RegExp(domainRegex[key]);
        }

        if (rawData.match(regex) && key !== 'dateFormat') { // dateformat not used for line matching
            if (key === 'rateLimited') {
                throw new Error('Rate Limited');
            } else if (key === 'notFound') {
                if (!result.hasOwnProperty('isAvailable')) {
                    result['isAvailable'] = true;
                }
            } else {
                let value = rawData.match(regex)[rawData.match(regex).length - 1];
                if (key === 'status') {
                    let matches: any = [];
                    while (matches = regex.exec(rawData)) {
                        if (result[key]) {
                            result[key].push(matches[1]);
                        } else {
                            result[key] = [matches[1]];
                        }
                    }
                } else if (key === 'expirationDate') {
                    if (domainRegex.hasOwnProperty('dateFormat')) {
                        result[key] = moment(value, domainRegex.dateFormat).toJSON();
                    } else {
                        result[key] = moment(value).toJSON();
                    }
                } else if (key === 'creationDate') {
                    if (domainRegex.hasOwnProperty('dateFormat')) {
                        result[key] = moment(value, domainRegex.dateFormat).toJSON();
                    } else {
                        result[key] = moment(value).toJSON();
                    }
                } else if (key === 'updatedDate') {
                    if (domainRegex.hasOwnProperty('dateFormat')) {
                        result[key] = moment(value, domainRegex.dateFormat).toJSON();
                    } else {
                        result[key] = moment(value).toJSON();
                    }
                } else if (key === 'domainName') {
                    result[key] = value.toLowerCase();
                } else {
                    result[key] = value;
                }
            }
        }
    });
    if (!result.hasOwnProperty('isAvailable')) {
        result.isAvailable = false;
    }

    // Check to make sure certain fields are set for unknown TLDs to ensure the default pattern matching worked
    // If not then throw TLD not supported error.
    if (unknownTLD) {
        if (!result.isAvailable) {
            if (!result.hasOwnProperty('creationDate') || !result.hasOwnProperty('expirationDate') ||
                !result.hasOwnProperty('updatedDate') || !result.hasOwnProperty('registrar')) {
                throw new Error('TLD not supported');
            }
        }
    }
    return result;
};

export default parseRawData;