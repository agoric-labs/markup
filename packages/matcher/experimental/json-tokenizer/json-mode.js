﻿//@ts-check

import {matcher} from './json-matcher.js';
import {createMatcherMode} from '../../lib/token-matcher.js';
import {initializeState, finalizeState, createToken} from '../common/helpers.js';

export const mode = createMatcherMode(matcher, {
  syntax: 'json',
  aliases: ['json'],
  initializeState,
  finalizeState,
  createToken,
});
