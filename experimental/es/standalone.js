﻿import {mode} from './es-mode.js';

// mode.USE_CONSTRUCTS = true;
import.meta.url.includes('standalone.js') && (mode.USE_CONSTRUCTS = true);

export const {syntax, tokenizer} = mode;
