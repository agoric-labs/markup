// Experimental Markup Implementation
import markup, {versions} from './lib/markup.js';

// @SMotaal/tokenizer Implementation
// import * as smotaalTokenizerParser from './packages/tokenizer/lib/parser.mjs';
import smotaalTokenizerParser from './packages/tokenizer/examples/extended.mjs';

versions.push(smotaalTokenizerParser);

export default markup;
