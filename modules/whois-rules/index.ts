import type { TldPatternMap } from './types'

import { countryTlds } from './country'
import { genericTlds } from './generic'
import { supplementalTlds } from './supplemental'

export type { TldPatternMap, TldPatterns } from './types'

export { supplementalTlds }

export const tldPatterns: TldPatternMap = {
    ...genericTlds,
    ...countryTlds
}
