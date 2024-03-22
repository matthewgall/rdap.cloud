import moment from "moment";

var tlds = {
	'.com': {
		'registrar': 'Registrar: *(.+)',
		'updatedDate': 'Updated Date: *(.+)',
		'creationDate': 'Creation Date: *(.+)',
		'expirationDate': 'Expir\\w+ Date: *(.+)',
		'status': 'Status:\\s*(.+)\\s*\\n',
		'notFound': 'No match for '
	},
	'.org': {
		'registrar': 'Registrar: *(.+)',
		'updatedDate': 'Updated Date: *(.+)',
		'creationDate': 'Creation Date: *(.+)',
		'expirationDate': 'Expir\\w+ Date: *(.+)',
		'status': 'Status: *(.+)',
		'notFound': '^(NOT FOUND|Domain not found)'
	},
	'.au': {
		'updatedDate': 'Last Modified: *(.+)',
		'registrar': 'Registrar Name: *(.+)',
		'status': 'Status: *(.+)',
		'rateLimited': 'WHOIS LIMIT EXCEEDED',
		'notFound': '^NOT FOUND'
	},
	'.us': {
		'registrar': 'Registrar: *(.+)',
		'status': 'Domain Status: *(.+)',
		'creationDate': 'Creation Date: *(.+)',
		'expirationDate': 'Registrar Registration Expiration Date: *(.+)',
		'updatedDate': 'Updated Date: *(.+)',
		'notFound': '^No Data Found',
		'dateFormat': 'YYYY-MM-DDThh:mm:ssZ'
	},
	'.ru': {
		'registrar': 'registrar: *(.+)',
		'creationDate': 'created: *(.+)',
		'expirationDate': 'paid-till: *(.+)',
		'status': 'state: *(.+)',
		'notFound': 'No entries found'
	},
	'.uk': {
		'registrar': 'Registrar:\\s*(.+)',
		'status': 'Registration status:\\s*(.+)',
		'creationDate': 'Registered on:\\s*(.+)',
		'expirationDate': 'Expiry date:\\s*(.+)',
		'updatedDate': 'Last updated:\\s*(.+)',
		'notFound': 'No match for ',
		'dateFormat': 'DD-MMM-YYYY'
	},
	'.fr': {
		'registrar': 'registrar: *(.+)',
		'creationDate': 'created: *(.+)',
		'expirationDate': 'Expiry Date:\\s?(.+)',
		'status': 'status: *([A-Z]+)',
		'updatedDate': 'last-update: *(.+)',
		'notFound': '(No entries found in |%% NOT FOUND)',
		'dateFormat': 'YYYY-MM-DDThh:mm:ssZ'
	},
	'.nl': {
		'registrar': 'Registrar: *\\s*(.+)',
		'status': 'Status: *(.+)',
		'notFound': '\\.nl is free',
		'rateLimited': 'maximum number of requests per second exceeded'
	},
	'.fi': {
		'registrar': 'registrar\\.*: *(.*)',
		'status': 'status\\.*: *([\\S]+)',
		'creationDate': 'created\\.*: *([\\S]+)',
		'updatedDate': 'modified\\.*: *([\\S]+)',
		'expirationDate': 'expires\\.*: *([\\S]+)',
		'notFound': 'Domain not found',
		'dateFormat': 'DD.MM.YYYY hh:mm:ss'
	},
	'.pt': {
		'status': 'Domain Status: *(.+)',
		'creationDate': 'Creation Date\\.*: *([\\S]+)',
		'expirationDate': 'Expiration Date\\.*: *([\\S]+)',
		'nameservers': 'Name Server: ([\\S]+)',
		'notFound': 'No Match',
		'rateLimited': 'maximum number of requests per second exceeded',
		'dateFormat': 'DD/MM/YYYY hh:mm:ss'
	},
	'.jp': {
		'creationDate': '\\[Registered Date\\]\\s*(.+)',
		'updatedDate': '\\[Last Update\\]\\s?(.+)',
		'status': '\\[State\\]\\s*(.+)',
		'notFound': 'No match!!',
		'dateFormat': 'YYYY/MM/DD'
	},
	'.pl': {
		'registrar': 'REGISTRAR: *\\s*(.+)',
		'status': 'Registration status:\\n\\s*(.+)',
		'creationDate': 'created: *(.+)',
		'expirationDate': 'renewal date: *(.+)',
		'updatedDate': 'last modified: *(.+)',
		'notFound': 'No information available about domain name',
		'dateFormat': 'YYYY.MM.DD hh:mm:ss'
	},
	'.br': {
		'status': 'status: *(.+)',
		'creationDate': 'created: *(.+)',
		'expirationDate': 'expires: *(.+)',
		'updatedDate': 'changed: *(.+)',
		'dateFormat': 'YYYYMMDD',
		'notFound': 'No match for '
	},
	'.eu': {
		'registrar': 'Registrar: *\\n *Name: *([^\\n\\r]+)',
		'notFound': 'Status: AVAILABLE'
	},
	'.ee': {
		'status': 'Domain: *[\\n\\r]+\\s*name: *[^\\n\\r]+\\sstatus: *([^\\n\\r]+)',
		'creationDate': 'Domain: *[\\n\\r]+\\s*name: *[^\\n\\r]+\\sstatus: *[^\\n\\r]+\\sregistered: *([^\\n\\r]+)',
		'updatedDate': 'Domain: *[\\n\\r]+\\s*name: *[^\\n\\r]+\\sstatus: *[^\\n\\r]+\\sregistered: *[^\\n\\r]+\\schanged: *([^\\n\\r]+)',
		'expirationDate': 'Domain: *[\\n\\r]+\\s*name: *[^\\n\\r]+\\sstatus: *[^\\n\\r]+\\sregistered: *[^\\n\\r]+\\schanged: *[^\\n\\r]+\\sexpire: *([^\\n\\r]+)',
		'registrar': 'Registrar: *[\\n\\r]+\\s*name: *([^\\n\\r]+)',
		'notFound': 'Domain not found',
		'dateFormat': 'YYYY-MM-DD'
	},
	'.kr': {
		'creationDate': 'Registered Date\\s*: *(.+)',
		'updatedDate': 'Last Updated Date\\s*: *(.+)',
		'expirationDate': 'Expiration Date\\s*: *(.+)',
		'registrar': 'Authorized Agency\\s*: *(.+)',
		'dateFormat': 'YYYY. MM. DD.',
		'notFound': 'The requested domain was not found '
	},
	'.bg': {
		'status': 'registration status:\\s*(.+)',
		'notFound': 'registration status: available',
		'rateLimited': 'Query limit exceeded'
	},
	'.de': {
		'status': 'Status: *(.+)',
		'updatedDate': 'Changed: *(.+)',
		'nameservers': 'Nserver: ([\\S]+)',
		'notFound': 'Status: *free'
	},
	'.at': {
		'updatedDate': 'changed: *(.+)',
		'registrar': 'registrar: *(.+)',
		'notFound': ' nothing found',
		'dateFormat': 'YYYYMMDD hh:mm:ss',
		'rateLimited': 'Quota exceeded'
	},
	'.ca': {
		'status': 'Domain Status: *(.+)',
		'updatedDate': 'Updated Date: *(.+)',
		'creationDate': 'Creation Date: *(.+)',
		'expirationDate': 'Expiry Date: *(.+)',
		'registrar': 'Registrar: *(.+)',
		'notFound': 'Not found: '
	},
	'.be': {
		'registrar': 'Registrar: *[\\n\\r]+\\s*Name:\\s*(.+)',
		'status': 'Status:\\s*(.+)',
		'creationDate': 'Registered: *(.+)',
		'dateFormat': 'ddd MMM DD YYYY',
		'notFound': 'Status:\\s*AVAILABLE'
	},
	'.info': {
		'registrar': 'Registrar: *(.+)',
		'updatedDate': 'Updated Date: *(.+)',
		'creationDate': 'Creation Date: *(.+)',
		'expirationDate': 'Registrar Registration Expiration Date: *(.+)',
		'status': 'Status: *(.+)',
		'notFound': '^(NOT FOUND|Domain not found)'
		//'dateFormat':       'YYYY-MM-DDTHH:mm:ssZ'
	},
	'.kg': {
		//'registrar': 'Domain support: \\s*(.+)',
		'creationDate': 'Record created:\\s*(.+)',
		'expirationDate': 'Record expires on:\\s*(.+)',
		'updatedDate': 'Record last updated on:\\s*(.+)',
		'dateFormat': 'ddd MMM DD HH:mm:ss YYYY',
		'notFound': 'domain is available for registration'
	},
	'.id': {
		'creationDate': 'Created On:(.+)',
		'expirationDate': 'Expiration Date(.+)',
		'updatedDate': 'Last Updated On(.+)',
		'registrar': 'Sponsoring Registrar Organization:(.+)',
		'status': 'Status:(.+)',
		'notFound': 'DOMAIN NOT FOUND',
		'dateFormat': 'DD-MMM-YYYY HH:mm:ss UTC'
	},
	'.sk': {
		'creationDate': 'Created:\\s*(.+)',
		'expirationDate': 'Valid Until:\\s*(.+)',
		'status': 'EPP Status:\\s*(.+)',
		'updatedDate': 'Updated:\\s*(.+)',
		'registrar': 'Registrar:\\s*(.+)',
		'dateFormat': 'YYYY-MM-DD',
		'notFound': 'Domain not found'
	},
	'.se': {
		'creationDate': 'created\\.*: *(.+)',
		'updatedDate': 'modified\\.*: *(.+)',
		'expirationDate': 'expires\\.*: *(.+)',
		'status': 'status\\.*: *(.+)',
		'registrar': 'registrar: *(.+)',
		'dateFormat': 'YYYY-MM-DD',
		'notFound': '\\" not found.'
	},
	'.is': {
		'creationDate': 'created\\.*: *(.+)',
		'expirationDate': 'expires\\.*: *(.+)',
		'dateFormat': 'MMM DD YYYY',
		'notFound': 'No entries found for query'
	},
	'.it': {
		'creationDate': 'Created\\.*: *(.+)',
		'expirationDate': 'Expire Date\\.*: *(.+)',
		'updatedDate': 'Last Update: *(.+)',
		'status': 'Status:\\s*(.+)\\s*\\n',
		'dateFormat': 'YYYY-MM-DD',
		'notFound': 'AVAILABLE'
	},
	'.co': {
		'registrar': 'Registrar: *(.+)',
		'updatedDate': 'Updated Date: *(.+)',
		'creationDate': 'Creation Date: *(.+)',
		'expirationDate': 'Expir\\w+ Date: *(.+)',
		'status': 'Status:\\s*(.+)\\s*\\n',
		'notFound': 'No Data Found'
	},
	'default': {
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

    let result: any = {
		objectClassName: 'domain',
		ldhName: domain.toUpperCase(),
		rdapConformance: [
			"rdap_level_0",
			"icann_rdap_technical_implementation_guide_0",
			"icann_rdap_response_profile_0"
		]
	};

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
		throw new Error(`${domain} is not supported by RDAP. This may be because the domain belongs to a ccTLD, or the gTLD has not deployed RDAP`)
	}

    Object.keys(domainRegex).forEach(function (key) {
        // Find multiple matches for status field
		let regex: any;

        if (['status', 'nameservers'].includes(key)) {
            regex = new RegExp(domainRegex[key], 'g');
        } else {
            regex = new RegExp(domainRegex[key]);
        }

        if (rawData.match(regex) && key !== 'dateFormat') { // dateformat not used for line matching
            if (key === 'rateLimited') {
                throw new Error('We were unable to complete the lookup as the server appears to be rate limiting queries');
            } else if (key === 'notFound') {
                if (!result.hasOwnProperty('isAvailable')) {
                    throw new Error(`${domain} does not appear to be a registered domain name, IP address or ASN`)
                }
            } else {
                let value = rawData.match(regex)[rawData.match(regex).length - 1];
                if (['status', 'nameservers'].includes(key)) {
                    let matches: any = [];
                    while (matches = regex.exec(rawData)) {
						if (key == 'nameservers') {
							if (result[key]) {
								result[key].push({
									objectClassName: "nameserver",
									ldhName: matches[1].toUpperCase()
								})
							} else {
								result[key] = [{
									objectClassName: "nameserver",
									ldhName: matches[1].toUpperCase()
								}];
							}
						}
						else {
							if (result[key]) {
								result[key].push(matches[1]);
							} else {
								result[key] = [matches[1]];
							}
						}

                    }
                } else if (['expirationDate', 'creationDate', 'updatedDate'].includes(key)) {
					if (!result.events) result.events = []

					let eventMap = {
						'creationDate': 'registration',
						'updatedDate': 'last changed',
						'expirationDate': 'expiration'
					}

                    if (domainRegex.hasOwnProperty('dateFormat')) {
                        result.events.push({
							eventAction: eventMap[key],
							eventDate: moment(value, domainRegex.dateFormat).toJSON()
						})
                    } else {
						result.events.push({
							eventAction: eventMap[key],
							eventDate: moment(value).toJSON()
						})
                    }
                } else {
                    result[key] = value;
                }
            }
        }
    });

    return result;
};

export default parseRawData;