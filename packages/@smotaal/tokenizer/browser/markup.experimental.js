// export * from './markup.js';
import parser from '../tokenizer.experimental.extended.js';
import {TokenizerAPI} from '../tokenizer.api.js';

import dom from '../extensions/dom.js';

export let parsers, render, tokenize, warmup;

export default ({parsers, render, tokenize, warmup} = new TokenizerAPI({
  parsers: [parser],
  render: (source, options, flags) => {
    const fragment = options && options.fragment;

    const debugging = flags && /\bdebug\b/i.test(typeof flags === 'string' ? flags : [...flags].join(' '));

    debugging && console.info('render: %o', {render, source, options, flags, fragment, debugging});

    fragment && (fragment.logs = debugging ? [] : undefined);

    return dom.render(tokenize(source, options, flags), fragment);
  },
}));
