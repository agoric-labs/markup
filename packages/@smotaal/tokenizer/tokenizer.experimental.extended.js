export * from './tokenizer.experimental.js';

import {Parser} from './tokenizer.experimental.js';
import {modes} from './extensions/extensions.js';

const parser = new Parser();
parser.MODULE_URL = import.meta.url;
for (const id in modes) parser.register(modes[id]);

export {modes};


export default parser;