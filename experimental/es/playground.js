﻿import {mode} from './es-mode.js';

import.meta.url.includes('/es/playground.js') && (mode.USE_CONSTRUCTS = true);

/**
 * @param {import('/markup/packages/tokenizer/lib/api').API} markup
 */
export default ((
  sourceURL = './es-matcher.js',
  sourceType = 'es',
  resolveSourceType = (defaultType, {sourceType, resourceType, options}) => {
    if (!sourceType && (resourceType === 'javascript' || resourceType === 'octet')) return 'es';
    return defaultType;
  },
) => async markup => {
  markup.parsers[0].register(mode);
  return {sourceURL, sourceType, resolveSourceType};
})();
