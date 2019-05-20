const {assign, defineProperty} = Object;

const document$1 = void null;

class Node {
  get children() {
    return defineProperty(this, 'children', {value: new Set()}).children;
  }
  get childElementCount() {
    return (this.hasOwnProperty('children') && this.children.size) || 0;
  }
  get textContent() {
    return (this.hasOwnProperty('children') && this.children.size && [...this.children].join('')) || '';
  }
  set textContent(text) {
    this.hasOwnProperty('children') && this.children.size && this.children.clear();
    text && this.children.add(new String(text));
  }
  appendChild(element) {
    return element && this.children.add(element), element;
  }
  append(...elements) {
    if (elements.length) for (const element of elements) element && this.children.add(element);
  }
  removeChild(element) {
    element && this.hasOwnProperty('children') && this.children.size && this.children.delete(element);
    return element;
  }
  remove(...elements) {
    if (elements.length && this.hasOwnProperty('children') && this.children.size)
      for (const element of elements) element && this.children.delete(element);
  }
}

class Element extends Node {
  get innerHTML() {
    return this.textContent;
  }
  set innerHTML(text) {
    this.textContent = text;
  }
  get outerHTML() {
    let classList;
    let {className, tag, innerHTML, dataset} = this;

    className &&
      (className = className.trim()) &&
      ({
        [className]: classList = (className &&
          (Element.classLists[className] = [...new Set(className.split(/\s+/g))].join(' '))) ||
          '',
      } = Element.classLists || (Element.classLists = Object.create(null)));

    const openTag = [tag];

    classList && openTag.push(`class="${classList}"`);

    if (dataset)
      for (const [key, value] of Object.entries(dataset))
        value == null || !key.trim || openTag.push(`data-${key}=${JSON.stringify(`${value}`)}`);

    return `<${openTag.join(' ')}>${innerHTML || ''}</${tag}>`;
  }

  toString() {
    return this.outerHTML;
  }
  toJSON() {
    return this.toString();
  }
}

class DocumentFragment extends Node {
  toString() {
    return this.textContent;
  }
  toJSON() {
    return (this.childElementCount && [...this.children]) || [];
  }
  [Symbol.iterator]() {
    return ((this.childElementCount && this.children) || '')[Symbol.iterator]();
  }
}

class Text extends String {
  toString() {
    return encodeEntities(super.toString());
  }
}

const createElement = (tag, properties, ...children) => {
  const element = assign(new Element(), {
    tag,
    className: (properties && properties.className) || '',
    properties,
  });
  children.length && defineProperty(element, 'children', {value: new Set(children)});
  return element;
};

const createText = (content = '') => new Text(content);
const encodeEntity = entity => `&#${entity.charCodeAt(0)};`;
const encodeEntities = string => string.replace(/[\u00A0-\u9999<>\&]/g, encodeEntity);
const createFragment = () => new DocumentFragment();

const pseudo = /*#__PURE__*/Object.freeze({
  document: document$1,
  Node: Node,
  Element: Element,
  DocumentFragment: DocumentFragment,
  Text: Text,
  createElement: createElement,
  createText: createText,
  encodeEntity: encodeEntity,
  encodeEntities: encodeEntities,
  createFragment: createFragment
});

const {document: document$2, Element: Element$1, Node: Node$1, Text: Text$1, DocumentFragment: DocumentFragment$1} =
  'object' === typeof self && (self || 0).window === self && self;

const {createElement: createElement$1, createText: createText$1, createFragment: createFragment$1} = {
  createElement: (tag, properties, ...children) => {
    const element = document$2.createElement(tag);
    properties && Object.assign(element, properties);
    if (!children.length) return element;
    if (element.append) {
      while (children.length > 500) element.append(...children.splice(0, 500));
      children.length && element.append(...children);
    } else if (element.appendChild) {
      for (const child of children) element.appendChild(child);
    }
    return element;
  },

  createText: (content = '') => document$2.createTextNode(content),

  createFragment: () => document$2.createDocumentFragment(),
};

const dom = /*#__PURE__*/Object.freeze({
  document: document$2,
  Element: Element$1,
  Node: Node$1,
  Text: Text$1,
  DocumentFragment: DocumentFragment$1,
  createElement: createElement$1,
  createText: createText$1,
  createFragment: createFragment$1
});

// TEST: Trace for ESM testing
typeof process === 'object' && console.info('[ESM]: %o', import.meta.url);

const native = document$2 && dom;

/// Helpers
const InspectSymbol = Symbol.for('nodejs.util.inspect.custom');

const Null = Object.freeze(Object.create(null));

const raw = String.raw;

const RegExpFlags = /^\/((?:g(?=[^g]*$)|i(?=[^i]*$)|m(?=[^m]*$)|s(?=[^s]*$)|u(?=[^u]*$)|y(?=[^y]*$))+)$|/;

class SequenceExpression extends RegExp {}

/**
 * Create a sequence match expression from patterns.
 *
 * @type  {{(strings: TemplateStringsArray, ... patterns: pattern[]): sequence, (...patterns: pattern[]): sequence}}
 */
const sequence = (...patterns) => (
  patterns.length > 1 &&
    (patterns.flags = RegExpFlags.exec(patterns[patterns.length - 1]).pop()) &&
    (patterns[patterns.length - 1] = ''),
  new SequenceExpression(Reflect.apply(raw, null, patterns.map(p => (p && p.source) || p || '')), patterns.flags || 'g')
);

class IdentifierExpression extends RegExp {}

/**
 * Create a maybeIdentifier test (ie [<first>][<other>]*) expression.
 *
 * @type {{(first: pattern, other: pattern, flags?: string, boundary?: unknown): pattern.identifier}}
 */
const identifier = (first, other = first, flags = 'u', boundary = /yg/.test(flags) && '\\b') =>
  new IdentifierExpression(`${boundary || '^'}[${first}][${other}]*${boundary || '$'}`, flags);

/**
 * Create a sequence pattern from patterns.
 *
 * @param  {...Pattern} patterns
 */
const all = (...patterns) => patterns.map(p => (p && p.exec ? p.source : p)).join('|');

/// Symbols

class Symbols extends Set {
  static from(...sources) {
    const Species = this || Symbols;
    const symbols = (sources.length && Species.split(...sources)) || [];
    return new Species(symbols);
  }

  static split(...sources) {
    const Species = this || Symbols;
    const symbols = [];
    // TODO: Replace with sources.flat() for non-legacy
    for (const source of [].concat(...sources)) {
      source &&
        (typeof source === 'string'
          ? symbols.push(...source.split(/ +/))
          : Symbol.iterator in source
          ? symbols.push(...Species.split(...source))
          : source['(symbols)'] && typeof source['(symbols)'] === 'string'
          ? symbols.push(...Species.split(source['(symbols)']))
          : null);
    }
    return symbols;
  }

  static inspect(symbol, depth, {stylize = String, compact = false} = {}) {
    const type = typeof symbol;
    return `${stylize(
      type === 'symbol'
        ? `Symbol(${symbol.description || ''})`
        : type === 'string'
        ? JSON.stringify(symbol).slice(1, -1)
        : `${symbol}`,
      type,
    )}`;
  }

  get includes() {
    Object.defineProperty(Symbols.prototype, 'includes', Object.getOwnPropertyDescriptor(Set.prototype, 'has'));
    return this.has;
  }
  set includes(value) {
    this.includes = (this.includes, value);
  }

  get(symbol) {
    if (this.has(symbol)) return symbol;
  }

  [InspectSymbol](depth, {stylize = String, compact = false} = {}) {
    try {
      const depth = arguments[0] + 1;
      const options = arguments[1];
      let Species = (this && this.constructor) || Symbols;
      const {inspect = (Species = Closures).inspect} = Species;
      return `${(this && this.constructor && this.constructor.name) || 'Symbols'} ‹${Array.from(this.values())
        .map(symbol => Species.inspect(symbol, depth, options))
        .join('|')}›`;
    } catch (exception) {
      return super.toString(this);
    }
  }
}
/// Closures

class Closure extends String {
  constructor(opener, closer = opener) {
    if (!opener || !closer) throw Error(`Cannot construct closure from "${opener}" … "${closer}"`);
    super(`${opener}…${closer}`);
    this.opener = opener;
    this.closer = closer;
  }

  [InspectSymbol](depth, {stylize = String, compact = false} = {}) {
    try {
      return `${(this && this.constructor && this.constructor.name) || 'Closure'} ‹${Closures.inspect(this)}›`;
    } catch (exception) {
      return `${this}`;
    }
  }
}

class Closures extends Map {
  static get splitter() {
    Object.defineProperty(Closures, 'splitter', {value: / *?([^ ]+…[^ ]+|[^ …]+) *?/});
  }

  static from(...sources) {
    const Species = this || Closures;
    const closures = (sources.length && Species.split(...sources)) || [];
    return new Species(closures);
  }
  static split(...sources) {
    const Species = this || Closures;
    const Member = Species.Element || Closure;
    const closures = [];
    // TODO: Replace with sources.flat() for non-legacy
    for (const source of [].concat(...sources)) {
      if (!source) continue;
      switch (typeof source) {
        case 'object':
          source instanceof Member
            ? closures.push([source.opener, source])
            : source instanceof Species
            ? closures.push(...source)
            : source['(closures)'] && typeof source['(closures)'] === 'string'
            ? closures.push(...Closures.split(source['(closures)']))
            : null;
          break;
        case 'string': {
          for (const pair of source.split(Species.splitter || Closures.splitter)) {
            if (!pair) continue;
            const [opener, closer] = pair.split('…');
            const closure = new Member(opener, closer);
            closures.push([opener, closure]);
          }
          break;
        }
      }
    }
    return closures;
  }

  static inspect(closure, depth, {stylize = String, compact = false} = {}) {
    let opener, openerType, closer, closerType;
    return closure && 'opener' in closure && 'closer' in closure
      ? `${stylize(
          (openerType = typeof (opener = closure.opener)) === 'string' ? JSON.stringify(opener).slice(1, -1) : opener,
          openerType,
        )}\u{25CC}${stylize(
          (closerType = typeof (closer = closure.closer)) === 'string' ? JSON.stringify(closer).slice(1, -1) : closer,
          closerType,
        )}`
      : stylize(`${closure}`, typeof closure);
  }

  get includes() {
    Object.defineProperty(Closures.prototype, 'includes', Object.getOwnPropertyDescriptor(Map.prototype, 'has'));
    return this.has;
  }

  set includes(value) {
    this.includes = (this.includes, value);
  }

  [InspectSymbol](depth, {stylize = String, compact = false} = {}) {
    try {
      const depth = arguments[0] + 1;
      const options = arguments[1];
      let Species = (this && this.constructor) || Closures;
      const {inspect = (Species = Closures).inspect} = Species;
      return `${(this && this.constructor && this.constructor.name) || 'Closures'} ‹${Array.from(this.values())
        .map(closure => Species.inspect(closure, depth, options))
        .join('|')}›`;
    } catch (exception) {
      return super.toString(this);
    }
  }
}

/// TRAVERSING

const previousTextFrom = (token, matcher) => {
  const text = [];
  if (matcher != null) {
    if (matcher.test)
      do token.text && text.push(token.text), (token = token.previous);
      while (!token.text || !matcher.test(token.text));
    else if (matcher.includes)
      do token.text && text.push(token.text), (token = token.previous);
      while (!token.text || !matcher.includes(token.text));
    text.length && text.reverse();
  }
  return text.join('');
};

/// INDENTS

const indenter = (indenting, tabs = 2) => {
  let source = indenting;
  const indent = new RegExp(raw`(?:\t|${' '.repeat(tabs)})`, 'g');
  const space = indent.source;
  source = source.replace(/\\?(?=[\(\)\:\?\[\]])/g, '\\');
  const [, lead, tail] = /^(\s*.*?)(\s*?)$/.exec(source);
  return new RegExp(`^${lead.replace(indent, space)}(?:${tail.replace(indent, `${space}?`)})?`, 'm');
};

/** @typedef {string | RegExp} pattern */
/** @typedef {SequenceExpression} sequence */
/** @typedef {IdentifierExpression} pattern.identifier */

const patterns = {
  /** Basic latin Keyword like symbol (inteded to be extended) */
  // maybeKeyword: /^[a-z]+$/i,
};

/** Entities used to construct patterns. */
const entities = {
  es: {
    IdentifierStart: raw`_$\p{ID_Start}`,
    IdentifierPart: raw`_$\u200c\u200d\p{ID_Continue}\u034f`,
  },
};

/** Interoperability (for some browsers)  TODO: Simplify */
(Ranges => {
  const transforms = [];

  if (!supports(raw`\p{ID_Start}`, 'u')) {
    const UnicodePropertyEscapes = /\\p{ *(\w+) *}/g;
    UnicodePropertyEscapes.replace = (m, propertyKey) => {
      if (propertyKey in Ranges) return Ranges[propertyKey].toString();
      throw RangeError(`Cannot rewrite unicode property "${propertyKey}"`);
    };
    transforms.push(expression => {
      let flags = expression && expression.flags;
      let source = expression && `${expression.source || expression || ''}`;
      source &&
        UnicodePropertyEscapes.test(source) &&
        (source = source.replace(UnicodePropertyEscapes, UnicodePropertyEscapes.replace));
      return (flags && new RegExp(source, flags)) || source;
    });
  }

  if (!transforms.length) return;

  for (const key in entities) {
    const sources = entities[key];
    const changes = {};
    for (const id in sources) {
      let source = sources[id];
      if (!source || typeof source !== 'string') continue;
      for (const transform of transforms) source = transform(source);
      !source || source === sources[id] || (changes[id] = source);
    }
    Object.assign(sources, changes);
  }

  // prettier-ignore
  function supports() {try {return !!RegExp(... arguments)} catch (e) { }}
})({
  ID_Start: raw`a-zA-Z\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u037f\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u052f\u0531-\u0556\u0559\u0560-\u0588\u05d0-\u05ea\u05ef-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u0860-\u086a\u08a0-\u08b4\u08b6-\u08bd\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u09fc\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0af9\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c39\u0c3d\u0c58-\u0c5a\u0c60\u0c61\u0c80\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d54-\u0d56\u0d5f-\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f5\u13f8-\u13fd\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f8\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1878\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191e\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19b0-\u19c9\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1c80-\u1c88\u1c90-\u1cba\u1cbd-\u1cbf\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2118-\u211d\u2124\u2126\u2128\u212a-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309b-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312f\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fef\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua69d\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua7b9\ua7f7-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua8fd\ua8fe\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\ua9e0-\ua9e4\ua9e6-\ua9ef\ua9fa-\ua9fe\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa7e-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uab30-\uab5a\uab5c-\uab65\uab70-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc`,
  ID_Continue: raw`a-zA-Z0-9\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u037f\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u052f\u0531-\u0556\u0559\u0560-\u0588\u05d0-\u05ea\u05ef-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u0860-\u086a\u08a0-\u08b4\u08b6-\u08bd\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u09fc\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0af9\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c39\u0c3d\u0c58-\u0c5a\u0c60\u0c61\u0c80\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d54-\u0d56\u0d5f-\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f5\u13f8-\u13fd\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f8\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1878\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191e\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19b0-\u19c9\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1c80-\u1c88\u1c90-\u1cba\u1cbd-\u1cbf\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2118-\u211d\u2124\u2126\u2128\u212a-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309b-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312f\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fef\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua69d\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua7b9\ua7f7-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua8fd\ua8fe\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\ua9e0-\ua9e4\ua9e6-\ua9ef\ua9fa-\ua9fe\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa7e-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uab30-\uab5a\uab5c-\uab65\uab70-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc\u200c\u200d\xb7\u0300-\u036f\u0387\u0483-\u0487\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u064b-\u0669\u0670\u06d6-\u06dc\u06df-\u06e4\u06e7\u06e8\u06ea-\u06ed\u06f0-\u06f9\u0711\u0730-\u074a\u07a6-\u07b0\u07c0-\u07c9\u07eb-\u07f3\u07fd\u0816-\u0819\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0859-\u085b\u08d3-\u08e1\u08e3-\u0903\u093a-\u093c\u093e-\u094f\u0951-\u0957\u0962\u0963\u0966-\u096f\u0981-\u0983\u09bc\u09be-\u09c4\u09c7\u09c8\u09cb-\u09cd\u09d7\u09e2\u09e3\u09e6-\u09ef\u09fe\u0a01-\u0a03\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a66-\u0a71\u0a75\u0a81-\u0a83\u0abc\u0abe-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ae2\u0ae3\u0ae6-\u0aef\u0afa-\u0aff\u0b01-\u0b03\u0b3c\u0b3e-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b56\u0b57\u0b62\u0b63\u0b66-\u0b6f\u0b82\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd7\u0be6-\u0bef\u0c00-\u0c04\u0c3e-\u0c44\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62\u0c63\u0c66-\u0c6f\u0c81-\u0c83\u0cbc\u0cbe-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0ce2\u0ce3\u0ce6-\u0cef\u0d00-\u0d03\u0d3b\u0d3c\u0d3e-\u0d44\u0d46-\u0d48\u0d4a-\u0d4d\u0d57\u0d62\u0d63\u0d66-\u0d6f\u0d82\u0d83\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0de6-\u0def\u0df2\u0df3\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0e50-\u0e59\u0eb1\u0eb4-\u0eb9\u0ebb\u0ebc\u0ec8-\u0ecd\u0ed0-\u0ed9\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f3e\u0f3f\u0f71-\u0f84\u0f86\u0f87\u0f8d-\u0f97\u0f99-\u0fbc\u0fc6\u102b-\u103e\u1040-\u1049\u1056-\u1059\u105e-\u1060\u1062-\u1064\u1067-\u106d\u1071-\u1074\u1082-\u108d\u108f-\u109d\u135d-\u135f\u1369-\u1371\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17b4-\u17d3\u17dd\u17e0-\u17e9\u180b-\u180d\u1810-\u1819\u18a9\u1920-\u192b\u1930-\u193b\u1946-\u194f\u19d0-\u19da\u1a17-\u1a1b\u1a55-\u1a5e\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1ab0-\u1abd\u1b00-\u1b04\u1b34-\u1b44\u1b50-\u1b59\u1b6b-\u1b73\u1b80-\u1b82\u1ba1-\u1bad\u1bb0-\u1bb9\u1be6-\u1bf3\u1c24-\u1c37\u1c40-\u1c49\u1c50-\u1c59\u1cd0-\u1cd2\u1cd4-\u1ce8\u1ced\u1cf2-\u1cf4\u1cf7-\u1cf9\u1dc0-\u1df9\u1dfb-\u1dff\u203f\u2040\u2054\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2cef-\u2cf1\u2d7f\u2de0-\u2dff\u302a-\u302f\u3099\u309a\ua620-\ua629\ua66f\ua674-\ua67d\ua69e\ua69f\ua6f0\ua6f1\ua802\ua806\ua80b\ua823-\ua827\ua880\ua881\ua8b4-\ua8c5\ua8d0-\ua8d9\ua8e0-\ua8f1\ua8ff-\ua909\ua926-\ua92d\ua947-\ua953\ua980-\ua983\ua9b3-\ua9c0\ua9d0-\ua9d9\ua9e5\ua9f0-\ua9f9\uaa29-\uaa36\uaa43\uaa4c\uaa4d\uaa50-\uaa59\uaa7b-\uaa7d\uaab0\uaab2-\uaab4\uaab7\uaab8\uaabe\uaabf\uaac1\uaaeb-\uaaef\uaaf5\uaaf6\uabe3-\uabea\uabec\uabed\uabf0-\uabf9\ufb1e\ufe00-\ufe0f\ufe20-\ufe2f\ufe33\ufe34\ufe4d-\ufe4f\uff10-\uff19\uff3f`,
});

const TOKENIZERS = 'tokenizers';
const MAPPINGS = 'mappings';
const MODES = 'modes';

const none = {
  syntax: 'markup',
  matcher: /([\s\n]+)|(\\(?:(?:\\\\)*\\|[^\\\s])?|\/\/+|\/\*+|\*+\/|\(|\)|\[|\]|,|;|\.\.\.|\.|\b:\/\/\b|::|:|\?|`|"|'|\$\{|\{|\}|=>|<\/|\/>|\++|\-+|\*+|&+|\|+|=+|!={0,3}|<{1,3}=?|>{1,2}=?)|[+\-*/&|^%<>~!]=?/g,
};

const define = (instance, property, value, options) => {
  if (!instance.hasOwnProperty(property))
    return (
      Object.defineProperty(instance, property, {
        value,
        writable: (options && options.writable === true) || false,
        configurable: (options && options.configurable === true) || false,
        enumerable: !options || options.enumerable === true,
      }),
      value
    );
};

const EmptyTokenArray = (EmptyTokenArray =>
  Object.freeze(
    new (Object.freeze(Object.freeze(Object.setPrototypeOf(EmptyTokenArray.prototype, null)).constructor, null))(),
  ))(
  class EmptyTokenArray {
    *[Symbol.iterator]() {}
  },
);

/** @type {(string: string, sequence: string , index?: number) => number} */
const indexOf = Function.call.bind(String.prototype.indexOf);
/** @type {(string: string) => number} */
const countLineBreaks = text => {
  let breaks = 0;
  for (let index = -1; (index = indexOf(text, '\n', index + 1)) > -1; breaks++);
  return breaks;
};

const createBaselineTokenizer = () => {
  return class Tokenizer {
    *tokenize(sourceText) {
      let match, lastIndex;
      const matcher = RegExp(none.matcher);
      const string = String(sourceText || '');

      lastIndex = 0;
      while ((match = matcher.exec(string))) {
        const {0: text, index} = match;
        const pre = lastIndex < index && string.slice(lastIndex, index);
        lastIndex = matcher.lastIndex;
        pre && (yield {text: pre, breaks: countLineBreaks(pre)});
        yield {text, breaks: countLineBreaks(text)};
      }
    }
  };
};

/** @param {typeof import('./tokenizer.js')['Tokenizer']} [Tokenizer] */
const createParser = (Tokenizer = createBaselineTokenizer()) =>
  class Parser {
    constructor(options) {
      if (options) {
        const {mode, tokenizer, url, modes} = options;
        if (mode) {
          this.register((this.mode = mode));
          tokenizer && this[TOKENIZERS].set(mode, tokenizer);
        }
        if (modes) for (const id in modes) this.register(modes[id]);
        url && (this.MODULE_URL = url);
      }
    }

    /**
     * @param source {string}
     * @param state {{sourceType?: string}}
     */
    tokenize(source, state = {}) {
      const {
        options: {
          sourceType,
          mode = (state.options.mode = (sourceType && this.get(sourceType)) || this.mode || none),
        } = (state.options = {}),
      } = state;
      let tokenizer = mode && this[TOKENIZERS].get(mode);
      if (!source || !mode) return EmptyTokenArray;
      if (!tokenizer) {
        if (typeof Tokenizer !== 'function') {
          throw TypeError(
            `Parse factory expected the first argument to be a Tokenizer constructor (not ${typeof Tokenizer}) — either define a tokenizer mapping for "${sourceType ||
              mode.syntax ||
              'markup'}" or pass the a constructor to the factory.`,
          );
        }
        this[TOKENIZERS].set(mode, (tokenizer = new Tokenizer(mode)));
      }
      state.parser = this;
      state.tokenize = (this.hasOwnProperty('tokenize') && this.tokenize) || (this.tokenize = this.tokenize.bind(this));
      return tokenizer.tokenize(source, state);
    }

    get [TOKENIZERS]() {
      return define(this, TOKENIZERS, new WeakMap());
    }
    get [MAPPINGS]() {
      return define(this, MAPPINGS, Object.create(null));
    }

    get [MODES]() {
      return define(this, MODES, Object.create(null));
    }

    get(id = 'default') {
      const {[MAPPINGS]: mappings, [MODES]: modes} = this;
      if (id in modes) return modes[id];
      let mapping = mappings[id];
      !mapping || mapping.syntax === id || (mapping = mappings[mapping.syntax]);
      if (mapping) {
        const {syntax, mode, factory, options} = mapping;
        if (mode) {
          return (modes[id] = mode);
        }
        if (factory) {
          if (options.requires && options.requires.length > 0) {
            const list = [];
            for (const id of options.requires) id in modes || this.get(id) || list.push(id);
            if (list.length) {
              list.length > 1 && list.push(list.splice(-2, 2).join(' and '));
              throw Error(`Cannot initialize "${syntax}" which requires the list mode(s): ${list.join(', ')}`);
            }
          }
          return (mapping.mode = modes[id] = factory(options, modes));
        }
      }
    }

    /** @param {ModeFactory | Mode} mode @param {ModeOptions} [options] */
    register(mode, options) {
      if (!this[MAPPINGS]) return;

      const {[MAPPINGS]: mappings, [MODES]: modes} = this;
      const factory = typeof mode === 'function' && mode;
      const {syntax, aliases = (options.aliases = []), preregister, tokenizer} = ({
        syntax: options.syntax = mode.syntax,
      } = options = {
        syntax: undefined,
        ...(factory ? factory.defaults : mode),
        ...options,
      });

      if (!syntax || typeof syntax !== 'string') {
        throw TypeError(`Cannot register "${syntax}" since it not valid string'`);
      }

      if (preregister) preregister(this);

      if (mappings[syntax]) {
        if (factory ? factory === mappings[syntax].factory : mode === modes[syntax]) return;
        throw ReferenceError(`Cannot register "${syntax}" since it is already registered`);
      }

      const ids = [syntax];

      if (aliases && aliases.length > 0) {
        for (const alias of aliases) {
          const mapping = mappings[alias];
          if (!alias || typeof alias !== 'string') {
            throw TypeError(`Cannot register "${syntax}" since it's alias "${alias}" not valid string'`);
          }

          if (alias in modes || (mapping && (mapping.syntax === alias || mapping.syntax[0] === alias[0]))) {
            continue;
          }

          if (mapping) {
            Object.defineProperty(mappings, alias, {writable: true, configurable: true});
            delete mappings[alias];
            ids.push(alias);
          }

          ids.push(alias);
        }
      }

      const mapping = factory ? {syntax, factory, options} : {syntax, mode, options};
      const descriptor = {value: mapping, writable: false, configurable: true};

      for (const id of ids) Object.defineProperty(mappings, id, descriptor);

      if (tokenizer) this[TOKENIZERS].set(mode, tokenizer);
    }

    unregister(id) {
      const {[MAPPINGS]: mappings, [MODES]: modes} = this;
      if (id in modes) {
        throw ReferenceError(`Cannot unregister "${id}" since it's already been bootstrapped for use.`);
      }
      Object.defineProperty(mappings, id, {writable: true, configurable: true});
      delete mappings[id];
    }

    /** @param {string} mode @param {string[]} requires */
    requires(mode, requires) {
      const missing = [];
      for (const mode of requires) {
        mode in this[MAPPINGS] || missing.push(`"${mode}"`);
      }
      if (!missing.length) return;
      throw Error(`Cannot initialize "${mode}" which requires the missing mode(s): ${missing.join(', ')}`);
    }
  };

/**
 * @typedef { Partial<{syntax: string, matcher: RegExp, [name:string]: Set | Map | {[name:string]: Set | Map | RegExp} }> } Mode
 * @typedef { {[name: string]: Mode} } Modes
 * @typedef { {[name: string]: {syntax: string} } } Mappings
 * @typedef { {aliases?: string[], syntax: string} } ModeOptions
 * @typedef { (options: ModeOptions, modes: Modes) => Mode } ModeFactory
 */

/** Shared context state handler for token generator instances  */
class Contextualizer {
  constructor(tokenizer) {
    // Local contextualizer state
    let definitions, context;

    // Tokenizer mode
    const {defaults = {}, mode = defaults.mode, initializeContext} = tokenizer;

    if (!mode) throw Error(`Contextualizer constructed without a mode`);

    const prime = next => (
      definitions !== next &&
        next &&
        ((context = mappings.get((definitions = next))) ||
          ((context = this.contextualize(definitions)),
          initializeContext && apply(initializeContext, tokenizer, [context]))),
      (next != null && context) || ((definitions = mode), (context = root))
    );

    Object.defineProperties(this, {
      mode: {value: mode, writable: false},
      prime: {value: prime, writable: false},
    });

    // Eagerly contextualize "root" definitions on first use
    if (!(context = mappings.get((definitions = mode)))) {
      const {
        // Parent goal
        syntax,
        matcher = (mode.matcher = (defaults && defaults.matcher) || undefined),
        quotes,
        punctuators = (mode.punctuators = {aggregators: {}}),
        punctuators: {aggregators = (punctuators.aggregators = {})},
        patterns = (mode.patterns = {maybeKeyword: null}),
        patterns: {
          maybeKeyword = (patterns.maybeKeyword =
            (defaults && defaults.patterns && defaults.patterns.maybeKeyword) || undefined),
        },
        spans: {['(spans)']: spans} = (mode.spans = {}),
      } = mode;

      context = {syntax, goal: syntax, mode, punctuators, aggregators, matcher, quotes, spans};

      initializeContext && apply(initializeContext, tokenizer, [context]);

      mappings.set(mode, context);
    }

    const root = context;
  }

  contextualize(definitions) {
    const mode = this.mode;

    const {
      // Parent goal
      syntax = (definitions.syntax = mode.syntax),

      // Lexical goal
      goal = (definitions.goal = syntax),

      // Assumes shared parent and unrelated production lexicons
      punctuators = (definitions.punctuators = goal === syntax ? mode.punctuators : {}),
      aggregators = (definitions.aggregate =
        (punctuators && punctuators.aggregators) || (punctuators.aggregators = {})),

      // Contextual identity
      punctuator,
      closer,

      // Contextual grammar
      spans,
      matcher = (definitions.matcher = mode.matcher),
      quotes = (definitions.quotes = mode.quotes),
      forming = (definitions.forming = goal === mode.syntax),
    } = definitions;

    const context = {mode, syntax, goal, punctuator, punctuators, aggregators, closer, spans, matcher, quotes, forming};

    mappings.set(definitions, context);
    return context;
  }

  /** @deprecate Historical convenience sometimes used cautiously */
  normalize({
    syntax,
    goal = syntax,
    quote,
    comment,
    closure,
    span,
    grouping = comment || closure || span || undefined,
    punctuator,
    spans = (grouping && grouping.spans) || undefined,
    matcher = (grouping && grouping.matcher) || undefined,
    quotes = (grouping && grouping.quotes) || undefined,
    punctuators = {aggregators: {}},
    opener = quote || (grouping && grouping.opener) || undefined,
    closer = quote || (grouping && grouping.closer) || undefined,
    hinter,
    open = (grouping && grouping.open) || undefined,
    close = (grouping && grouping.close) || undefined,
  }) {
    return {syntax, goal, punctuator, spans, matcher, quotes, punctuators, opener, closer, hinter, open, close};
  }
}

Object.freeze(Object.freeze(Contextualizer.prototype).constructor);

const mappings = new WeakMap();
const {apply} = Reflect;

/** Private context state handler for token generator instances */
class Contexts {
  /** @param {Tokenizer} tokenizer */
  constructor(tokenizer) {
    ({
      syntax: this.syntax,
      syntax: this.goal,
      syntax: (this.hints = new Hints()).top,
      [Definitions]: this.definitions = (this.contextualizer.mode[Definitions] = {}),
    } = (this.contextualizer =
      // TODO: Undo if concurrent parsing shows side-effects
      tokenizer.contextualizer || (tokenizer.contextualizer = new Contextualizer(tokenizer))).mode);
    (this.stack = [(this.root = this.contextualizer.prime(null))]).hints = [(this.hint = this.hints.toString())];
  }

  /**
   * @param {Token} nextToken
   * @param {TokenizerState} state
   * @param {TokenizerContext} context
   */
  close(nextToken, state, context) {
    const childContext = context;
    let after, parentToken;
    const {stack, hints, syntax, contextualizer} = this;

    const childIndex = stack.length - 1;
    const childDefinitions = childIndex && stack[childIndex];

    // TODO: Handle childContext.closer !== childDefinitions.closer
    if (childDefinitions) {
      const {hinter, punctuator} = childDefinitions;
      stack.pop();
      stack.includes(childDefinitions) || hints.delete(hinter);
      (punctuator === 'opener' && (nextToken.punctuator = 'closer')) ||
        (punctuator && (nextToken.punctuator = punctuator));
      nextToken.type = 'punctuator';
      after = childDefinitions.close && childDefinitions.close(nextToken, state, childContext);
    }

    const parentIndex = stack.length - 1;
    const parentDefinitions = stack[parentIndex];
    const parentHint = stack.hints[parentIndex];

    // TODO: Verify coherent goal, context, and hints
    (parentDefinitions &&
      (this.hint = parentHint) &&
      (context = contextualizer.prime(parentDefinitions)) &&
      (this.goal = context.goal || syntax)) ||
      ((this.goal = (context = contextualizer.prime(null)).goal || syntax) && (this.hint = stack.hints[0] || syntax));
    parentToken = (nextToken.parent && nextToken.parent.parent) || undefined;

    return {context, after, parentToken};
  }

  /**
   * @param {Token} nextToken
   * @param {TokenizerState} state
   * @param {TokenizerContext} context
   */
  open(nextToken, state, context) {
    let childDefinitions, parentToken, after;
    let {punctuator, text} = nextToken;
    const parentContext = context;
    const {definitions, stack, hints, hint, syntax, contextualizer} = this;
    const hinter = punctuator ? `${syntax}-${punctuator}` : hint;
    const contextID = `${hinter},${text}`;
    const definedDefinitions = definitions[contextID];
    const {
      mode: {matchers, comments, spans, closures},
    } = parentContext;

    if (punctuator === 'span' && parentContext.spans) {
      const span = parentContext.spans.get(text);
      punctuator = nextToken.punctuator = 'span';
      childDefinitions =
        definedDefinitions ||
        contextualizer.normalize({
          syntax,
          goal: syntax,
          span,
          matcher: span.matcher || (matchers && matchers.span) || undefined,
          spans: (spans && spans[text]) || undefined,
          hinter,
          punctuator,
        });
    } else if (parentContext.punctuator !== 'quote') {
      if (punctuator === 'quote') {
        childDefinitions =
          definedDefinitions ||
          contextualizer.normalize({
            syntax,
            goal: punctuator,
            quote: text,
            matcher: (matchers && matchers.quote) || undefined,
            spans: (spans && spans[text]) || undefined,
            hinter,
            punctuator,
          });
      } else if (punctuator === 'comment') {
        const comment = comments.get(text);
        childDefinitions =
          definedDefinitions ||
          contextualizer.normalize({
            syntax,
            goal: punctuator,
            comment,
            matcher: comment.matcher || (matchers && matchers.comment) || undefined,
            hinter,
            punctuator,
          });
      } else if (punctuator === 'closure') {
        const closure = (definedDefinitions && definedDefinitions.closure) || closures.get(text);
        punctuator = nextToken.punctuator = 'opener';
        closure &&
          (childDefinitions =
            definedDefinitions ||
            contextualizer.normalize({
              syntax,
              goal: syntax,
              closure,
              matcher: closure.matcher || (matchers && matchers.closure) || undefined,
              hinter,
              punctuator,
            }));
      }
    }

    if (childDefinitions) {
      (contextID && definitions[contextID]) || (definitions[contextID] = childDefinitions);
      const childIndex = stack.push(childDefinitions) - 1;
      hints.add(hinter);
      this.goal = (childDefinitions && childDefinitions.goal) || syntax;
      this.hint = stack.hints[childIndex] = `${hints.toString()} in-${this.goal}`;
      parentToken = nextToken;
      context = contextualizer.prime(childDefinitions);
      nextToken.type = 'punctuator';
      after = childDefinitions.open && childDefinitions.open(nextToken, state, context);
    }

    return {context, after, parentToken};
  }
}

Object.freeze(Object.freeze(Contexts.prototype).constructor);

const Definitions = Symbol('[definitions]');

const Hints = Object.freeze(
  Object.defineProperties(
    class Hints extends Set {
      toString() {
        return `${(this.root && ` ${this.root}`) || ''}${(this.top && ` ${this.top}`) || ''}${(this.size &&
          ` ${this.join(' ')}`) ||
          ''}`.trim();
      }
    }.prototype,
    {join: Object.getOwnPropertyDescriptor(Array.prototype, 'join')},
  ),
).constructor;

/** @typedef {import('./types').Contextualizer} Contextualizer */
/** @typedef {import('./types').Token} Token */
/** @typedef {import('./types').Tokenizer} Tokenizer */
/** @typedef {import('./types').TokenizerState} TokenizerState */
/** @typedef {import('./types').TokenizerContext} TokenizerContext */

class TokenSynthesizer {
  constructor(context) {
    const {
      mode: {
        keywords,
        patterns: {
          maybeIdentifier,
          maybeKeyword,
          segments: {
            [SEGMENT]: matchSegment = context.mode.patterns.segments &&
              (context.mode.patterns.segments[SEGMENT] = createSegmenter(context.mode.patterns.segments)),
          } = (context.mode.patterns.segments = false),
        } = (context.mode.patterns = false),
      },
      punctuators,
      aggregators,
      forming = (context.forming = true),
      wording = (context.wording = keywords || maybeIdentifier ? true : false),
      [PUNCTUATOR]: matchPunctuator = (context[PUNCTUATOR] = createPunctuator(context)),
      [AGGREGATOR]: matchAggregator = (context[AGGREGATOR] = createAggregator(context)),
    } = context;

    this.create = next => {
      const {text, type, hint, previous, parent, last} = next;
      type === 'sequence'
        ? ((next.punctuator =
            (previous &&
              (aggregators[text] || (!(text in aggregators) && (aggregators[text] = matchAggregator(text))))) ||
            (punctuators[text] || (!(text in punctuators) && (punctuators[text] = matchPunctuator(text)))) ||
            undefined) &&
            (next.type = 'punctuator')) ||
          (matchSegment &&
            (next.type = matchSegment(text)) &&
            (next.hint = `${(hint && `${hint} `) || ''}${next.type}`)) ||
          (next.type = 'sequence')
        : type === 'whitespace'
        ? // ? (next.breaks = text.match(LineEndings).length - 1)
          (next.breaks = countLineBreaks(text))
        : forming && wording
        ? text &&
          (((!maybeKeyword || maybeKeyword.test(text)) &&
            (keywords && keywords.includes(text)) &&
            (!last || last.punctuator !== 'nonbreaker' || (previous && previous.breaks > 0)) &&
            (next.type = 'keyword')) ||
            (maybeIdentifier && maybeIdentifier.test(text) && (next.type = 'identifier')))
        : (next.type = 'text');

      previous && (previous.next = next) && (parent || (next.parent = previous.parent));

      return next;
    };
  }
}

Object.freeze(Object.freeze(TokenSynthesizer.prototype).constructor);

const PUNCTUATOR = Symbol('[punctuator]');
const AGGREGATOR = Symbol('[aggregator]');
const SEGMENT = Symbol('[segment]');

const createSegmenter = segments => {
  const sources = [];
  const names = [];
  for (const name of Object.getOwnPropertyNames(segments)) {
    const segment = segments[name];
    if (segment && segment.source && !/\\\d/.test(segment.source)) {
      names.push(name);
      sources.push(segment.source.replace(/\\?\((.)/g, (m, a) => (m[0] !== '\\' && a !== '?' && '(?:') || m));
    }
  }
  const length = names.length;
  if (!length) return false;
  const matcher = new RegExp(`(${sources.join('|)|(')}|)`, 'u');
  return text => {
    const match = matcher.exec(text);
    if (match[0]) for (let i = 1, n = length; n--; i++) if (match[i]) return names[i - 1];
  };
};

const createPunctuator = ({mode: {operators, nonbreakers, comments, closures, breakers}, quotes, spans}) => {
  return text =>
    (operators && operators.includes(text) && 'operator') ||
    (closures && closures.includes(text) && 'closure') ||
    (breakers && breakers.includes(text) && 'breaker') ||
    (nonbreakers && nonbreakers.includes(text) && 'nonbreaker') ||
    (comments && comments.includes(text) && 'comment') ||
    (quotes && quotes.includes(text) && 'quote') ||
    (spans && spans.includes(text) && 'span') ||
    false;
};

const createAggregator = ({mode: {assigners, combinators}}) => {
  return text =>
    (assigners && assigners.includes(text) && 'assigner') ||
    (combinators && combinators.includes(text) && 'combinator') ||
    false;
};

/** Tokenizer for a single mode (language) */
class Tokenizer {
  constructor(mode, defaults) {
    this.mode = mode;
    this.defaults = defaults || this.constructor.defaults || undefined;
  }

  initializeContext(context) {
    context.createToken || (context.createToken = new TokenSynthesizer(context).create);
    return context;
  }

  /** Token generator from source using tokenizer.mode (or defaults.mode) */
  *tokenize(source, state = {}) {
    let done, context;
    let previousToken, lastToken, parentToken;
    let {match, index = 0, flags} = state;
    const contexts = (state.contexts = new Contexts(this));
    const {tokenize = (state.tokenize = text => [{text}])} = state;
    const rootContext = (context = state.lastContext = contexts.root);
    const top = {type: 'top', text: '', offset: index};

    done = !(state.source = source);

    while (!done) {
      const {closer, matcher, createToken, forming = true} = context;

      // Current contextual hint (syntax or hint)
      const hint = contexts.hint;

      while (state.lastContext === (state.lastContext = context)) {
        let nextToken;

        const lastIndex = (state.index > -1 && state.index) || 0;

        matcher.lastIndex = lastIndex;
        match = state.match = matcher.exec(source);
        done = index === (index = state.index = matcher.lastIndex) || !match;

        if (done) break;

        // Current contextual match
        const {0: text, 1: whitespace, 2: sequence, index: offset} = match;

        // Current quasi-contextual fragment
        const pre = source.slice(lastIndex, offset);
        pre &&
          ((nextToken = createToken({
            type: 'pre',
            text: pre,
            offset: lastIndex,
            previous: previousToken,
            parent: parentToken,
            hint,
            last: lastToken,
          })),
          yield (previousToken = nextToken));

        // Current contextual fragment
        const type = (whitespace && 'whitespace') || (sequence && 'sequence') || 'text';
        nextToken = createToken({
          type,
          text,
          offset,
          previous: previousToken,
          parent: parentToken,
          hint,
          last: lastToken,
        });

        let after;

        // Current contextual punctuator (from sequence)
        const closing =
          closer && (closer.test ? closer.test(text) : closer === text || (whitespace && whitespace.includes(closer)));

        // Update context
        (closing && ({context, after, parentToken = top} = contexts.close(nextToken, state, context))) ||
          (nextToken.punctuator &&
            context.punctuator !== 'comment' &&
            ({context, after, parentToken = top} = contexts.open(nextToken, state, context)));

        // Current contextual tail token (yield from sequence)
        yield (previousToken = nextToken);

        // Next reference to last contextual sequence token
        nextToken && !whitespace && forming && (lastToken = nextToken);

        if (after) {
          let tokens, createToken, nextIndex;
          let hintTokenType, hintPrefix, hintSuffix;

          if (after.syntax) {
            const {syntax, offset, index} = after;
            const body = index > offset && source.slice(offset, index - 1);
            if (body && body.length > 0) {
              (tokens = tokenize(body, {options: {sourceType: syntax}}, this.defaults)), (nextIndex = index);
              hintSuffix = `${syntax}-in-${rootContext.syntax}`;
              createToken = token => ((token.hint = `${(token.hint && `${token.hint} `) || ''}${hintSuffix}`), token);
            }
          } else if (after.length) {
            hintTokenType = 'code';
            hintPrefix = contexts.hint ? `${contexts.hint} ` : '';
            createToken = token =>
              context.createToken(((token.hint = `${hintPrefix}${token.type || hintTokenType}`), token));
            (tokens = after).end > state.index && (nextIndex = after.end);
          }

          if (tokens) {
            for (const next of tokens) {
              previousToken && ((next.previous = previousToken).next = next);
              createToken && createToken(next);
              yield (previousToken = next);
            }
            nextIndex > state.index && (state.index = nextIndex);
          }
        }
      }
    }
    flags && flags.debug && console.info('[Tokenizer.tokenize‹state›]: %o', state);
  }
}

Object.freeze(Object.freeze(Tokenizer.prototype).constructor);

class TokenizerAPI {
  /** @param {API.Options} [options] */
  constructor(options) {
    /** @type {API.Options} */
    const {
      parsers = [],
      tokenize = (source, options = {}, flags) => {
        const state = new TokenizerAPI.State({options, flags: {}});
        const variant = !options.variant ? 1 : parseInt(options.variant);
        const {[variant >= 1 && variant <= parsers.length ? variant - 1 : (options.variant = 0)]: parser} = parsers;
        this.lastVariant === (this.lastVariant = variant) ||
          variant <= parsers.length ||
          console.warn(
            '[tokenize‹parser›] Variant %O[%d] out of bounds — using default parser: %o',
            parsers,
            variant,
            parser.MODULE_URL || {parser},
          );
        options.tokenize = parser.tokenize;
        if (flags && (flags.length > 0 || flags.size > 0)) {
          typeof flags === 'string' || (flags = [...flags].join(' '));
          /\bwarmup\b/i.test(flags) && (state.flags.warmup = true);
          /\bdebug\b/i.test(flags) && (state.flags.debug = true);
        }

        let returned = UNSET;
        try {
          this.lastParser === (this.lastParser = parser) ||
            console.info('[tokenize‹parser›]: %o', parser.MODULE_URL || {parser});
          return (returned = parser.tokenize((this.lastSource = source), (this.lastState = state)));
        } finally {
          returned !== UNSET || !state.flags.debug || console.info('[tokenize‹state›]: %o', state);
        }
      },

      warmup = (source, options, flags) => {
        const key = (options && JSON.stringify(options)) || '';
        let cache = (this.cache || (this.cache = new Map())).get(key);
        cache || this.cache.set(key, (cache = new Set()));
        if (!cache.has(source)) {
          cache.add(source);
          flags = `warmup ${(flags &&
            (flags.length > 0 || flags.size > 0) &&
            (typeof flags === 'string' || flags instanceof String ? flags : [...flags].join(' '))) ||
            ''}`;
          const tokens = tokenize(source, options, flags);
          const snapshot = {...this};
          console.log('[tokenize‹warmup›]: %o', snapshot);
        }
      },

      render,
    } = options;

    Object.defineProperties(this, {
      tokenize: {get: () => tokenize},
      warmup: {get: () => warmup},
      render: {get: () => render},
      parsers: {get: () => parsers},
    });
  }
}

Object.freeze(Object.setPrototypeOf(TokenizerAPI.prototype, null));

TokenizerAPI.State = class State {
  constructor(...properties) {
    Object.assign(this, ...properties);
  }
};

Object.freeze(Object.setPrototypeOf(TokenizerAPI.State.prototype, null));

const UNSET = Symbol('');

/**
 * @typedef {import('./parser.js').Parser & {MODULE_URL?: string}} Parser
 * @typedef {Partial<{variant?: number, fragment?: Fragment, [name: string]: any}>} Parser.Options
 */

/**
 * @typedef {TokenizerAPI & {tokenize: API.tokenize, warmup: API.warmup, render: API.render, parsers: Parser[]}} API
 * @typedef {TokenizerAPI.State} API.State
 * @typedef {Partial<Pick<API, 'tokenize' | 'warmup' | 'render' | 'parsers'>>} API.Options
 * @typedef {<T extends {}>(source: string, options: Parser.Options, flags?: Flags) => IterableIterator<T>} API.tokenize
 * @typedef {(source: string, options: Parser.Options, flags?: Flags) => void} API.warmup
 * @typedef {(source: string, options: Parser.Options, flags?: Flags) => Promise<Fragment>} API.render
 */

/**
 * @typedef {(string | Array<string> | Set<string>) & {length?: number, size?: number}} Flags
 * @typedef {DocumentFragment & {logs?: string[]}} Fragment
 */

// export {patterns, entities} from '../../grammars/common/patterns.js';

/**
 * @template T
 * @typedef {Promise<T> | T} async
 */

/**
 * @template T
 * @typedef {{next(): async<IteratorResult<async<T>>>}} iterator
 */

/**
 * @template T
 * @typedef {iterator<T> | {[Symbol.iterator](): iterator<T>}  | {[Symbol.asyncIterator](): iterator<T>}} iterable
 */

/**
 * @template T, U
 * @param {iterable<T>} iterable
 * @param {(value: T) => U} ƒ
 */
async function each(iterable, ƒ) {
  const iterator =
    (iterable && ('next' in iterable && typeof iterable.next === 'function' && iterable)) ||
    ((Symbol.asyncIterator in iterable && iterable[Symbol.asyncIterator]()) ||
      (Symbol.iterator in iterable && iterable[Symbol.iterator]()));
  try {
    if (iterator || typeof iterator.next === 'function') {
      let result, done;
      while (!done && (result = await iterator.next())) {
        await ƒ(await result.value);
        done = result.done;
      }
    }
  } finally {
    iterator &&
      iterable !== iterator &&
      'return' in iterator &&
      typeof iterator.return === 'function' &&
      iterator.return();
  }
}

const supported = !!native;
const implementation = pseudo;
const {createElement: Element$2, createText: Text$2, createFragment: Fragment} = implementation;
const Template = template =>
  !supported || Template.supported === false
    ? false
    : Template.supported === true
    ? document.createElement('template')
    : (Template.supported = !!(
        (template = document.createElement('template')) && 'HTMLTemplateElement' === (template.constructor || '').name
      )) && template;

/// IMPLEMENTATION

class MarkupRenderer {
  constructor(options) {
    // TODO: Consider making Renderer a thing
    const {factory, defaults} = new.target;

    const {SPAN = 'span', LINE = 'span', CLASS = 'markup', REFLOW = true} = {
      ...defaults,
      ...options,
    };

    const PUNCTUATOR = `${CLASS} punctuator`;
    const LITERAL = `${CLASS} literal`;

    this.renderers = {
      line: factory(LINE, {className: `${CLASS} ${CLASS}-line`}),

      fault: factory(SPAN, {className: `${CLASS} fault`}),
      text: factory(SPAN, {className: CLASS}),

      whitespace: Text$2,
      inset: factory(SPAN, {className: `${CLASS} inset whitespace`}),
      break: factory(SPAN, {className: `${CLASS} break whitespace`}),

      comment: factory(SPAN, {className: `${CLASS} comment`}),

      keyword: factory(SPAN, {className: `${CLASS} keyword`}),
      identifier: factory(SPAN, {className: `${CLASS} identifier`}),

      sequence: factory(SPAN, {className: `${CLASS} sequence`}),

      literal: factory(SPAN, {className: LITERAL}),
      number: factory(SPAN, {className: `${LITERAL} number`}),
      quote: factory(SPAN, {className: `${CLASS} quote`}),
      pattern: factory(SPAN, {className: `${CLASS} pattern`}),

      punctuator: factory(SPAN, {className: PUNCTUATOR}),
      operator: factory(SPAN, {className: `${PUNCTUATOR} operator`}),
      assigner: factory(SPAN, {className: `${PUNCTUATOR} operator assigner`}),
      combinator: factory(SPAN, {className: `${PUNCTUATOR} operator combinator`}),
      punctuation: factory(SPAN, {className: `${PUNCTUATOR} punctuation`}),

      breaker: factory(SPAN, {className: `${PUNCTUATOR} breaker`}),
      opener: factory(SPAN, {className: `${PUNCTUATOR} opener`}),
      closer: factory(SPAN, {className: `${PUNCTUATOR} closer`}),
      span: factory(SPAN, {className: `${PUNCTUATOR} span`}),
    };

    this.reflows = REFLOW;
  }

  async render(tokens, fragment) {
    let logs, template, first, elements;
    try {
      fragment || (fragment = Fragment());
      logs = fragment.logs; // || (fragment.logs = []);
      elements = this.renderer(tokens);
      if ((first = await elements.next()) && 'value' in first) {
        template = Template();
        if (template && 'textContent' in fragment) {
          logs && logs.push(`render method = 'text' in template`);
          const body = [first.value];
          first.done || (await each(elements, element => body.push(element)));
          template.innerHTML = body.join('');
          fragment.appendChild(template.content);
        } else if ('push' in fragment) {
          logs && logs.push(`render method = 'push' in fragment`);
          fragment.push(first.value);
          first.done || (await each(elements, element => fragment.push(element)));
        } else if ('append' in fragment) {
          logs && logs.push(`render method = 'append' in fragment`);
          fragment.append(first.value);
          first.done || (await each(elements, element => fragment.append(element)));
        }
      }
      return fragment;
    } finally {
      template && (template.innerHTML = '');
      template = fragment = logs = elements = first = null;
    }
  }

  *renderer(tokens) {
    const {renderers, reflows} = this;
    let renderedLine, LineInset, lineInset, lineText, lineBreak, insetHint;
    const createLine = reflows
      ? () => (renderedLine = renderers.line())
      : () => (renderedLine = renderers.line('', 'no-reflow'));
    const emit = (renderer, text, type, hint) => {
      (renderedLine || createLine()).appendChild((renderedLine.lastChild = renderer(text, hint || type)));
    };
    const emitInset = (text, hint) => emit(renderers.inset, text, 'inset', hint);
    const emitBreak = hint => emit(renderers.break, '\n', 'break', hint);
    const Lines = /^/gm;

    for (const token of tokens) {
      if (!token || !token.text) continue;

      let {type = 'text', text, inset, punctuator, breaks, hint} = token;
      let renderer =
        (punctuator &&
          (renderers[punctuator] || (type && renderers[type]) || renderers.punctuator || renderers.operator)) ||
        (type && renderers[type]) ||
        (type !== 'whitespace' && type !== 'break' && renderers.text) ||
        Text$2;

      // Normlize inset for { type != 'inset', inset = /\s+/ }
      if (reflows && breaks && type !== 'break') {
        LineInset = void (inset = inset || '');
        insetHint = `${hint || ''} in-${type || ''}`;
        for (const line of text.split(Lines)) {
          (lineInset = line.startsWith(inset)
            ? line.slice(0, inset.length)
            : line.match(LineInset || (LineInset = RegExp(`^${inset.replace(/./g, '$&?')}`)))[0]) &&
            emitInset(lineInset, insetHint);

          (lineText = lineInset ? line.slice(lineInset.length) : line) &&
            ((lineText === '\n'
              ? ((lineBreak = lineText), (lineText = ''))
              : lineText.endsWith('\n')
              ? ((lineBreak = '\n'), (lineText = lineText.slice(0, lineText.endsWith('\r\n') ? -2 : -1)))
              : !(lineBreak = '')) && emit(renderer, lineText, type, hint),
            lineBreak && (emitBreak(), (renderedLine = void (yield renderedLine))));
        }
      } else {
        // TODO: See if pseudom children can be optimized for WBR/BR clones
        emit(renderer, text, type, hint);
        type === 'break'
          ? (renderedLine = void (yield renderedLine))
          : type === 'whitespace' || renderedLine.appendChild(Element$2('wbr'));
      }
    }
    renderedLine && (yield renderedLine);
  }

  /**
   * @param {string} tag
   * @param {Partial<HTMLElement>} [properties]
   * @param {boolean} [unflattened]
   */
  static factory(tagName, elementProperties) {
    const [tag, properties] = arguments;
    return Object.defineProperties(
      (content, hint) => {
        typeof content === 'string' && (content = Text$2(content));
        const element = content != null ? Element$2(tag, properties, content) : Element$2(tag, properties);
        element &&
          (hint = typeof hint === 'string' && `${element.className || ''} ${hint}`.trim()) &&
          ((element.className = hint.split(/&#x[\da-f];/i, 1)[0]), (element.dataset = {hint: hint.slice(6).trim()}));
        return element;
      },
      {
        // flatten: {
        //   value: !arguments[2] || (/\bunflatten\b/i.test(arguments[2]) ? false : /\bflatten\b/i.test(arguments[2])),
        // },
      },
    );
  }
}

MarkupRenderer.defaults = Object.freeze({
  /** Tag name of the element to use for rendering a token. */
  SPAN: 'span',
  /** Tag name of the element to use for grouping tokens in a single line. */
  LINE: 'span',
  /** The class name of the element to use for rendering a token. */
  CLASS: 'markup',
  /** Enable renderer-side unpacking { inset } || { breaks > 0 } tokens */
  REFLOW: true,
});

/// INTERFACE

const markupDOM = new MarkupRenderer();

//@ts-check
/// <reference path="./types.d.ts" />

// const trace = /** @type {[function, any[]][]} */ [];

class Matcher extends RegExp {
	/**
	 * @template T
	 * @param {Matcher.Pattern} pattern
	 * @param {Matcher.Flags} [flags]
	 * @param {Matcher.Entities} [entities]
	 * @param {T} [state]
	 */
	constructor(pattern, flags, entities, state) {
		// trace.push([new.target, [...arguments]]);
		//@ts-ignore
		super(pattern, flags);
		// Object.assign(this, RegExp.prototype, new.target.prototype);
		(pattern &&
			pattern.entities &&
			Symbol.iterator in pattern.entities &&
			((!entities && (entities = pattern.entities)) || entities === pattern.entities)) ||
			Object.freeze((entities = (entities && Symbol.iterator in entities && [...entities]) || []));
		/** @type {MatcherEntities} */
		this.entities = entities;
		/** @type {T} */
		this.state = state;
		this.capture = this.capture;
		this.exec = this.exec;
		// this.test = this.test;
		({
			// LOOKAHEAD: this.LOOKAHEAD = Matcher.LOOKAHEAD,
			// INSET: this.INSET = Matcher.INSET,
			// OUTSET: this.OUTSET = Matcher.OUTSET,
			DELIMITER: this.DELIMITER = Matcher.DELIMITER,
			UNKNOWN: this.UNKNOWN = Matcher.UNKNOWN,
		} = new.target);
	}

	/**
	 * @template {MatcherMatchResult} T
	 * @param {string} text
	 * @param {number} capture
	 * @param {T} match
	 * @returns {T}
	 */
	capture(text, capture, match) {
		if (capture === 0) return void (match.capture = {});
		if (text === undefined) return;
		const index = capture - 1;
		const {
			entities: {[index]: entity},
			state,
		} = this;
		typeof entity === 'function'
			? ((match.entity = index), entity(text, capture, match, state))
			: entity == null || //entity === INSET ||
			  // entity === OUTSET ||
			  // entity === DELIMITER ||
			  // entity === LOOKAHEAD ||
			  // entity === UNKNOWN ||
			  (match.entity !== undefined || ((match.identity = entity), (match.entity = index)),
			  (match.capture[entity] = text));
	}

	/**
	 * @param {string} source
	 * @returns {MatcherMatchResult}
	 */
	exec(source) {
		// const tracing = trace.length;
		// trace.push([this.exec, [...arguments]]);
		/** @type {MatcherMatchArray} */
		const match = super.exec(source);
		// console.log(trace.slice(tracing, trace.length));
		match &&
			(match.forEach(this.capture || Matcher.prototype.capture, (match.matcher = this)),
			match.identity || (match.capture[this.UNKNOWN || Matcher.UNKNOWN] = match[0]));

		// @ts-ignore
		return match;
	}

	/**
	 * @param {Matcher.PatternFactory} factory
	 * @param {Matcher.Flags} [flags]
	 * @param {PropertyDescriptorMap} [properties]
	 */
	static define(factory, flags, properties) {
		/** @type {MatcherEntities} */
		const entities = [];
		entities.flags = '';
		// const pattern = factory(entity => void entities.push(((entity != null || undefined) && entity) || undefined));
		const pattern = factory(entity => {
			if (entity !== null && entity instanceof Matcher) {
				entities.push(...entity.entities);

				!entity.flags || (entities.flags = entities.flags ? Matcher.flags(entities.flags, entity.flags) : entity.flags);

				return entity.source;
			} else {
				entities.push(((entity != null || undefined) && entity) || undefined);
			}
		});
		flags = Matcher.flags('g', flags == null ? pattern.flags : flags, entities.flags);
		const matcher = new ((this && (this.prototype === Matcher.prototype || this.prototype instanceof RegExp) && this) ||
			Matcher)(pattern, flags, entities);

		properties && Object.defineProperties(matcher, properties);

		return matcher;
	}

	static flags(...sources) {
		let flags = '',
			iterative;
		for (const source of sources) {
			if (!source || (typeof source !== 'string' && typeof source.flags !== 'string')) continue;
			for (const flag of source.flags || source)
				(flag === 'g' || flag === 'y' ? iterative || !(iterative = true) : flags.includes(flag)) || (flags += flag);
		}
		// console.log('%o: ', flags, ...sources);
		return flags;
	}

	static get sequence() {
		const {raw} = String;
		const {replace} = Symbol;
		/**
		 * @param {TemplateStringsArray} template
		 * @param  {...any} spans
		 * @returns {string}
		 */
		const sequence = (template, ...spans) =>
			sequence.WHITESPACE[replace](raw(template, ...spans.map(sequence.span)), '');
		/**
		 * @param {any} value
		 * @returns {string}
		 */
		sequence.span = value =>
			(value &&
				// TODO: Don't coerce to string here?
				(typeof value !== 'symbol' && `${value}`)) ||
			'';

		sequence.WHITESPACE = /^\s+|\s*\n\s*|\s+$/g;

		Object.defineProperty(Matcher, 'sequence', {value: Object.freeze(sequence), enumerable: true, writable: false});
		return sequence;
	}

	static get join() {
		const {sequence} = this;

		const join = (...values) =>
			values
				.map(sequence.span)
				.filter(Boolean)
				.join('|');

		Object.defineProperty(Matcher, 'join', {value: Object.freeze(join), enumerable: true, writable: false});

		return join;
	}
}

const {
	// INSET = (Matcher.INSET = /* Symbol.for */ 'INSET'),
	// OUTSET = (Matcher.OUTSET = /* Symbol.for */ 'OUTSET'),
	DELIMITER = (Matcher.DELIMITER = /* Symbol.for */ 'DELIMITER'),
	UNKNOWN = (Matcher.UNKNOWN = /* Symbol.for */ 'UNKNOWN'),
	// LOOKAHEAD = (Matcher.LOOKAHEAD = /* Symbol.for */ 'LOOKAHEAD'),
	escape = (Matcher.escape = /** @type {<T>(source: T) => string} */ ((() => {
		const {replace} = Symbol;
		return source => /[\\^$*+?.()|[\]{}]/g[replace](source, '\\$&');
	})())),
	sequence: sequence$1,
	matchAll = (Matcher.matchAll =
		/**
		 * @template {RegExp} T
		 * @type {(string: Matcher.Text, matcher: T) => Matcher.Iterator<T> }
		 */
		//@ts-ignore
		(() =>
			Function.call.bind(
				// String.prototype.matchAll || // TODO: Uncomment eventually
				{
					/**
					 * @this {string}
					 * @param {RegExp | string} pattern
					 */
					*matchAll() {
						const matcher =
							arguments[0] &&
							(arguments[0] instanceof RegExp
								? Object.setPrototypeOf(RegExp(arguments[0].source, arguments[0].flags || 'g'), arguments[0])
								: RegExp(arguments[0], 'g'));
						const string = String(this);

						if (!(matcher.flags.includes('g') || matcher.flags.includes('y'))) return void (yield matcher.exec(string));

						for (
							let match, lastIndex = -1;
							lastIndex <
							((match = matcher.exec(string)) ? (lastIndex = matcher.lastIndex + (match[0].length === 0)) : lastIndex);
							yield match, matcher.lastIndex = lastIndex
						);
					},
				}.matchAll,
			))()),
} = Matcher;

const {
  ranges,
  BinaryDigit,
  DecimalDigit,
  ControlLetter,
  HexLetter,
  HexDigit,
  GraveAccent,
  Null: Null$1,
  ZeroWidthNonJoiner,
  ZeroWidthJoiner,
  ZeroWidthNoBreakSpace,
  Whitespace,
  ID_Start,
  ID_Continue,
  UnicodeIDStart,
  UnicodeIDContinue,
} = (factories => {
  const {String, RegExp, Symbol, Object} = globalThis;
  const {raw} = String;
  const {replace: ReplaceSymbol} = Symbol;
  const {defineProperty, create} = Object;

  const RegExpClass = /^(?:\[(?=.*?\]$)|)((?:\\.|[^\\\n\[\]]*)*)\]?$/;

  class RegExpRange extends RegExp {
    constructor(source, flags) {
      let range;
      range =
        source && typeof source === 'object' && source instanceof RegExp
          ? (flags === undefined && (flags = source.flags), source.source)
          : (typeof source === 'string' ? source : (source = `${source || ''}`)).trim() &&
            (source = RegExpClass[ReplaceSymbol](source, '[$1]'));

      if (!range || !RegExpClass.test(range)) {
        throw TypeError(`Invalid Regular Expression class range: ${range}`);
      }

      typeof flags === 'string' || (flags = `${flags || ''}` || '');

      flags.includes('u') || !(source.includes('\\p{') || source.includes('\\u')) || (flags += 'u');
      super(source, flags);
      defineProperty(this, 'range', {value: range.slice(1, -1), enumerable: true, writable: false});
    }

    toString() {
      return this.range;
    }

    static range(strings, ...values) {
      return new (this || RegExpRange)(raw(strings, ...values));
    }
  }

  const safeRange = (strings, ...values) => {
    try {
      return RegExpRange.range(strings, ...values).source.slice(1, -1);
    } catch (exception) {}
  };

  const descriptors = {
    ranges: {
      get() {
        return ranges;
      },
      enumerable: true,
      configurable: false,
    },
  };

  for (const property in factories) {
    descriptors[property] = {
      get() {
        const value = factories[property](safeRange, ranges);
        defineProperty(ranges, property, {value, enumerable: true, configurable: false});
        return value;
      },
      enumerable: true,
      configurable: true,
    };
  }

  /** @type {Record<keyof factories, string>} */
  const ranges = create(null, descriptors);

  return ranges;
})({
  UnicodeIDStart: (range, {ID_Start}) => range`_$${ID_Start}`,
  UnicodeIDContinue: (range, {ID_Continue, ZeroWidthNonJoiner, ZeroWidthJoiner, CombiningGraphemeJoiner}) =>
    range`$${ID_Continue}${ZeroWidthNonJoiner}${ZeroWidthJoiner}${CombiningGraphemeJoiner}`,
  Null: range => range`\0`,
  BinaryDigit: range => range`01`,
  DecimalDigit: range => range`0-9`,
  ControlLetter: range => range`a-zA-Z`,
  HexLetter: range => range`a-fA-F`,
  HexDigit: (range, {DecimalDigit, HexLetter}) => range`${DecimalDigit}${HexLetter}`,
  GraveAccent: range => range`${'`'}`,
  ZeroWidthNonJoiner: range => range`\u200c`,
  ZeroWidthJoiner: range => range`\u200d`,
  ZeroWidthNoBreakSpace: range => range`\ufeff`,
  CombiningGraphemeJoiner: range => range`\u034f`,
  Whitespace: (range, {ZeroWidthNoBreakSpace}) => range`\s${ZeroWidthNoBreakSpace}`,
  ID_Start: range =>
    // range`\p{ID_Start}` ||
    range`A-Za-z\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376-\u0377\u037a-\u037d\u037f\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u052f\u0531-\u0556\u0559\u0560-\u0588\u05d0-\u05ea\u05ef-\u05f2\u0620-\u064a\u066e-\u066f\u0671-\u06d3\u06d5\u06e5-\u06e6\u06ee-\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4-\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u0860-\u086a\u08a0-\u08b4\u08b6-\u08bd\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098c\u098f-\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc-\u09dd\u09df-\u09e1\u09f0-\u09f1\u09fc\u0a05-\u0a0a\u0a0f-\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32-\u0a33\u0a35-\u0a36\u0a38-\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2-\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0-\u0ae1\u0af9\u0b05-\u0b0c\u0b0f-\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32-\u0b33\u0b35-\u0b39\u0b3d\u0b5c-\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99-\u0b9a\u0b9c\u0b9e-\u0b9f\u0ba3-\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c39\u0c3d\u0c58-\u0c5a\u0c60-\u0c61\u0c80\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0-\u0ce1\u0cf1-\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d54-\u0d56\u0d5f-\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32-\u0e33\u0e40-\u0e46\u0e81-\u0e82\u0e84\u0e86-\u0e8a\u0e8c-\u0ea3\u0ea5\u0ea7-\u0eb0\u0eb2-\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065-\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f5\u13f8-\u13fd\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f8\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1878\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191e\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19b0-\u19c9\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae-\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1c80-\u1c88\u1c90-\u1cba\u1cbd-\u1cbf\u1ce9-\u1cec\u1cee-\u1cf3\u1cf5-\u1cf6\u1cfa\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2118-\u211d\u2124\u2126\u2128\u212a-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2-\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309b-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312f\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fef\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a-\ua62b\ua640-\ua66e\ua67f-\ua69d\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua7bf\ua7c2-\ua7c6\ua7f7-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua8fd-\ua8fe\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\ua9e0-\ua9e4\ua9e6-\ua9ef\ua9fa-\ua9fe\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa7e-\uaaaf\uaab1\uaab5-\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uab30-\uab5a\uab5c-\uab67\uab70-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40-\ufb41\ufb43-\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc`,
  ID_Continue: range =>
    // range`\p{ID_Continue}` ||
    range`0-9A-Z_a-z\xaa\xb5\xb7\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0300-\u0374\u0376-\u0377\u037a-\u037d\u037f\u0386-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u0483-\u0487\u048a-\u052f\u0531-\u0556\u0559\u0560-\u0588\u0591-\u05bd\u05bf\u05c1-\u05c2\u05c4-\u05c5\u05c7\u05d0-\u05ea\u05ef-\u05f2\u0610-\u061a\u0620-\u0669\u066e-\u06d3\u06d5-\u06dc\u06df-\u06e8\u06ea-\u06fc\u06ff\u0710-\u074a\u074d-\u07b1\u07c0-\u07f5\u07fa\u07fd\u0800-\u082d\u0840-\u085b\u0860-\u086a\u08a0-\u08b4\u08b6-\u08bd\u08d3-\u08e1\u08e3-\u0963\u0966-\u096f\u0971-\u0983\u0985-\u098c\u098f-\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bc-\u09c4\u09c7-\u09c8\u09cb-\u09ce\u09d7\u09dc-\u09dd\u09df-\u09e3\u09e6-\u09f1\u09fc\u09fe\u0a01-\u0a03\u0a05-\u0a0a\u0a0f-\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32-\u0a33\u0a35-\u0a36\u0a38-\u0a39\u0a3c\u0a3e-\u0a42\u0a47-\u0a48\u0a4b-\u0a4d\u0a51\u0a59-\u0a5c\u0a5e\u0a66-\u0a75\u0a81-\u0a83\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2-\u0ab3\u0ab5-\u0ab9\u0abc-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ad0\u0ae0-\u0ae3\u0ae6-\u0aef\u0af9-\u0aff\u0b01-\u0b03\u0b05-\u0b0c\u0b0f-\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32-\u0b33\u0b35-\u0b39\u0b3c-\u0b44\u0b47-\u0b48\u0b4b-\u0b4d\u0b56-\u0b57\u0b5c-\u0b5d\u0b5f-\u0b63\u0b66-\u0b6f\u0b71\u0b82-\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99-\u0b9a\u0b9c\u0b9e-\u0b9f\u0ba3-\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd0\u0bd7\u0be6-\u0bef\u0c00-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c39\u0c3d-\u0c44\u0c46-\u0c48\u0c4a-\u0c4d\u0c55-\u0c56\u0c58-\u0c5a\u0c60-\u0c63\u0c66-\u0c6f\u0c80-\u0c83\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbc-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5-\u0cd6\u0cde\u0ce0-\u0ce3\u0ce6-\u0cef\u0cf1-\u0cf2\u0d00-\u0d03\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d44\u0d46-\u0d48\u0d4a-\u0d4e\u0d54-\u0d57\u0d5f-\u0d63\u0d66-\u0d6f\u0d7a-\u0d7f\u0d82-\u0d83\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0de6-\u0def\u0df2-\u0df3\u0e01-\u0e3a\u0e40-\u0e4e\u0e50-\u0e59\u0e81-\u0e82\u0e84\u0e86-\u0e8a\u0e8c-\u0ea3\u0ea5\u0ea7-\u0ebd\u0ec0-\u0ec4\u0ec6\u0ec8-\u0ecd\u0ed0-\u0ed9\u0edc-\u0edf\u0f00\u0f18-\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f3e-\u0f47\u0f49-\u0f6c\u0f71-\u0f84\u0f86-\u0f97\u0f99-\u0fbc\u0fc6\u1000-\u1049\u1050-\u109d\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u135d-\u135f\u1369-\u1371\u1380-\u138f\u13a0-\u13f5\u13f8-\u13fd\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f8\u1700-\u170c\u170e-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176c\u176e-\u1770\u1772-\u1773\u1780-\u17d3\u17d7\u17dc-\u17dd\u17e0-\u17e9\u180b-\u180d\u1810-\u1819\u1820-\u1878\u1880-\u18aa\u18b0-\u18f5\u1900-\u191e\u1920-\u192b\u1930-\u193b\u1946-\u196d\u1970-\u1974\u1980-\u19ab\u19b0-\u19c9\u19d0-\u19da\u1a00-\u1a1b\u1a20-\u1a5e\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1aa7\u1ab0-\u1abd\u1b00-\u1b4b\u1b50-\u1b59\u1b6b-\u1b73\u1b80-\u1bf3\u1c00-\u1c37\u1c40-\u1c49\u1c4d-\u1c7d\u1c80-\u1c88\u1c90-\u1cba\u1cbd-\u1cbf\u1cd0-\u1cd2\u1cd4-\u1cfa\u1d00-\u1df9\u1dfb-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u203f-\u2040\u2054\u2071\u207f\u2090-\u209c\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2102\u2107\u210a-\u2113\u2115\u2118-\u211d\u2124\u2126\u2128\u212a-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d7f-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2de0-\u2dff\u3005-\u3007\u3021-\u302f\u3031-\u3035\u3038-\u303c\u3041-\u3096\u3099-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312f\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fef\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua62b\ua640-\ua66f\ua674-\ua67d\ua67f-\ua6f1\ua717-\ua71f\ua722-\ua788\ua78b-\ua7bf\ua7c2-\ua7c6\ua7f7-\ua827\ua840-\ua873\ua880-\ua8c5\ua8d0-\ua8d9\ua8e0-\ua8f7\ua8fb\ua8fd-\ua92d\ua930-\ua953\ua960-\ua97c\ua980-\ua9c0\ua9cf-\ua9d9\ua9e0-\ua9fe\uaa00-\uaa36\uaa40-\uaa4d\uaa50-\uaa59\uaa60-\uaa76\uaa7a-\uaac2\uaadb-\uaadd\uaae0-\uaaef\uaaf2-\uaaf6\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uab30-\uab5a\uab5c-\uab67\uab70-\uabea\uabec-\uabed\uabf0-\uabf9\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40-\ufb41\ufb43-\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe00-\ufe0f\ufe20-\ufe2f\ufe33-\ufe34\ufe4d-\ufe4f\ufe70-\ufe74\ufe76-\ufefc\uff10-\uff19\uff21-\uff3a\uff3f\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc`,
});

/** Symbol map @type {{ [key: string]: symbol }} */
const symbols = {};

/** Unique token records @type {{[symbol: symbol]: }} */
const tokens = {};

const identities = {
  UnicodeIDStart: 'ECMAScriptUnicodeIDStart',
  UnicodeIDContinue: 'ECMAScriptUnicodeIDContinue',
  HexDigits: 'ECMAScriptHexDigits',
  CodePoint: 'ECMAScriptCodePoint',
  ControlEscape: 'ECMAScriptControlEscape',
  ContextualWord: 'ECMAScriptContextualWord',
  RestrictedWord: 'ECMAScriptRestrictedWord',
  FutureReservedWord: 'ECMAScriptFutureReservedWord',
  Keyword: 'ECMAScriptKeyword',
};

const goals = {
  [Symbolic('ECMAScriptGoal')]: {
    type: undefined,
    flatten: undefined,
    fold: undefined,
    openers: ['{', '(', '[', "'", '"', '`', '/', '/*', '//'],
    closers: ['}', ')', ']'],
  },
  [Symbolic('CommentGoal')]: {type: 'comment', flatten: true, fold: true},
  [Symbolic('RegExpGoal')]: {
    type: 'pattern',
    flatten: undefined,
    fold: undefined,
    openers: ['['],
    closers: [']'],
    punctuators: ['+', '*', '?', '|', '^', '{', '}', '(', ')'],
  },
  [Symbolic('StringGoal')]: {type: 'quote', flatten: true, fold: true},
  [Symbolic('TemplateLiteralGoal')]: {
    type: 'quote',
    flatten: true,
    fold: false,
    openers: ['${'],
  },
  [Symbolic('FaultGoal')]: {type: 'fault', groups: {}},
};

const {
  [symbols.FaultGoal]: FaultGoal,
  [symbols.ECMAScriptGoal]: ECMAScriptGoal,
  [symbols.CommentGoal]: CommentGoal,
  [symbols.RegExpGoal]: RegExpGoal,
  [symbols.StringGoal]: StringGoal,
  [symbols.TemplateLiteralGoal]: TemplateLiteralGoal,
} = goals;

const groups = {
  ['{']: {opener: '{', closer: '}'},
  ['(']: {opener: '(', closer: ')'},
  ['[']: {opener: '[', closer: ']'},
  ['//']: {opener: '//', closer: '\n', goal: symbols.CommentGoal, parentGoal: symbols.ECMAScriptGoal},
  ['/*']: {opener: '/*', closer: '*/', goal: symbols.CommentGoal, parentGoal: symbols.ECMAScriptGoal},
  ['/']: {opener: '/', closer: '/', goal: symbols.RegExpGoal, parentGoal: symbols.ECMAScriptGoal},
  ["'"]: {opener: "'", closer: "'", goal: symbols.StringGoal, parentGoal: symbols.ECMAScriptGoal},
  ['"']: {opener: '"', closer: '"', goal: symbols.StringGoal, parentGoal: symbols.ECMAScriptGoal},
  ['`']: {
    opener: '`',
    closer: '`',
    goal: symbols.TemplateLiteralGoal,
    parentGoal: symbols.ECMAScriptGoal,
  },
  ['${']: {
    opener: '${',
    closer: '}',
    goal: symbols.ECMAScriptGoal,
    parentGoal: symbols.TemplateLiteralGoal,
  },
};

/**  @type {ECMAScript.Keywords} */
const keywords = {};

{
  const {create, freeze, entries, getOwnPropertySymbols, getOwnPropertyNames, setPrototypeOf} = Object;

  const punctuators = create(null);

  for (const opener of getOwnPropertyNames(groups)) {
    const {[opener]: group} = groups;
    'goal' in group && (group.goal = goals[group.goal] || FaultGoal);
    'parentGoal' in group && (group.parentGoal = goals[group.parentGoal] || FaultGoal);
    freeze(group);
  }

  for (const symbol of getOwnPropertySymbols(goals)) {
    const {[symbol]: goal} = goals;

    goal.name = (goal.symbol = symbol).description.replace(/Goal$/, '');
    goal.tokens = tokens[symbol] = {};
    goal.groups = [];

    if (goal.punctuators) {
      for (const punctuator of (goal.punctuators = [...goal.punctuators]))
        punctuators[punctuator] = !(goal.punctuators[punctuator] = true);
      freeze(setPrototypeOf(goal.punctuators, punctuators));
    }

    if (goal.closers) {
      for (const closer of (goal.closers = [...goal.closers])) punctuators[closer] = !(goal.closers[closer] = true);
      freeze(setPrototypeOf(goal.closers, punctuators));
    }

    if (goal.openers) {
      for (const opener of (goal.openers = [...goal.openers])) {
        const group = (goal.groups[opener] = groups[opener]);
        punctuators[opener] = !(goal.openers[opener] = true);
        GoalSpecificTokenRecord(goal, group.opener, 'opener', {group});
        GoalSpecificTokenRecord(goal, group.closer, 'closer', {group});
      }
      freeze(setPrototypeOf(goal.openers, punctuators));
    }

    freeze(goal.groups);
    freeze(goal.tokens);
    freeze(goal);
  }

  freeze(punctuators);
  freeze(goals);
  freeze(groups);
  freeze(identities);
  freeze(symbols);

  for (const [identity, list] of entries({
    [identities.Keyword]:
      'await break case catch class const continue debugger default delete do else export extends finally for function if import in instanceof let new return super switch this throw try typeof var void while with yield',
    [identities.RestrictedWord]: 'interface implements package private protected public',
    [identities.FutureReservedWord]: 'enum',
    // NOTE: This is purposely not aligned with the spec
    [identities.ContextualWord]: 'arguments async as from of static get set',
  })) {
    for (const keyword of list.split(/\s+/)) keywords[keyword] = identity;
  }
  keywords[Symbol.iterator] = Array.prototype[Symbol.iterator].bind(Object.getOwnPropertyNames(keywords));
  freeze(keywords);
}

/**
 * Creates a symbolically mapped goal-specific token record
 *
 * @template {{}} T
 * @param {goal} goal
 * @param {string} text
 * @param {type} type
 * @param {T} properties
 */
function GoalSpecificTokenRecord(goal, text, type, properties) {
  const symbol = Symbol(`‹${goal.name} ${text}›`);
  return (goal.tokens[text] = goal.tokens[symbol] = tokens[symbol] = {symbol, text, type, goal, ...properties});
}

function Symbolic(key, description = key) {
  return (symbols[key] = Symbol(description));
}

/** @typedef {typeof goals} goals */
/** @typedef {goals[keyof goals]} goal */
/** @typedef {goal['type']} type */
/** @typedef {{symbol: symbol, text: string, type: type, goal?: goal, group?: group}} token */
/** @typedef {typeof groups} groups */
/** @typedef {groups[keyof groups]} group */

/**
 * @typedef {'await'|'break'|'case'|'catch'|'class'|'const'|'continue'|'debugger'|'default'|'delete'|'do'|'else'|'export'|'extends'|'finally'|'for'|'function'|'if'|'import'|'in'|'instanceof'|'new'|'return'|'super'|'switch'|'this'|'throw'|'try'|'typeof'|'var'|'void'|'while'|'with'|'yield'} ECMAScript.Keyword
 * @typedef {'interface'|'implements'|'package'|'private'|'protected'|'public'} ECMAScript.RestrictedWord
 * @typedef {'enum'} ECMAScript.FutureReservedWord
 * @typedef {'arguments'|'async'|'as'|'from'|'of'|'static'} ECMAScript.ContextualKeyword
 * @typedef {Record<ECMAScript.Keyword|ECMAScript.RestrictedWord|ECMAScript.FutureReservedWord|ECMAScript.ContextualKeyword, symbol>} ECMAScript.Keywords
 */

/** Creates a list from a Whitespace-separated string @type { (string) => string[] } */
const List = RegExp.prototype[Symbol.split].bind(/\s+/g);

const stats = {
  captureCount: 0,
  contextCount: 0,
  tokenCount: 0,
  totalCaptures: 0,
  totalContexts: 0,
  totalTokens: 0,
};

/** @template {{}} T @param {T} context @returns {T & stats} */
const initializeContext = context => Object.assign(context, stats);

const capture = (identity, match, text) => {
  match.capture[(match.identity = identity)] = text || match[0];
  (match.fault = identity === 'fault') && (match.flatten = false);
  return match;
};

/**
 * Safely mutates matcher state to open a new context.
 *
 * @param {*} text - Text of the intended { type = "opener" } token
 * @param {*} state - Matcher state
 * @returns {undefined | string} - String when context is **not** open
 */
const open = (text, state) => {
  // const {goal: initialGoal, groups} = state;
  const {
    contexts,
    context: parentContext,
    context: {depth: index, goal: initialGoal},
    groups,
  } = state;
  const group = initialGoal.groups[text];

  if (!group) return initialGoal.type || 'sequence';
  groups.splice(index, groups.length, group);
  groups.closers.splice(index, groups.closers.length, group.closer);

  parentContext.contextCount++;

  const goal = group.goal === undefined ? initialGoal : group.goal;

  state.nextContext = contexts[index] = initializeContext({
    id: `${parentContext.id}${goal !== initialGoal ? ` ‹${group.opener}›&#x000A;«${goal.name}»` : ` ‹${group.opener}›`}`,
    number: contexts.count++,
    depth: index + 1,
    parentContext,
    goal,
    group,
    state,
  });
};

/**
 * Safely mutates matcher state to close the current context.
 *
 * @param {*} text - Text of the intended { type = "closer" } token
 * @param {*} state - Matcher state
 * @returns {undefined | string} - String when context is **not** closed
 */
const close = (text, state) => {
  // const {goal: initialGoal, group: initialGroup, groups} = state;
  const {
    contexts,
    context: {
      goal: initialGoal,
      group: initialGroup,
      parentContext,
      captureCount,
      contextCount,
      tokenCount,
      totalCaptures,
      totalContexts,
      totalTokens,
    },
    groups,
  } = state;
  const index = groups.closers.lastIndexOf(text);

  if (index === -1 || index !== groups.length - 1) return fault(text, state);

  parentContext.totalContexts += totalContexts + contextCount;
  parentContext.totalCaptures += totalCaptures + captureCount;
  parentContext.totalTokens += totalTokens + tokenCount;

  groups.closers.splice(index, groups.closers.length);
  groups.splice(index, groups.length);
  state.nextContext = parentContext;
};

const forward = (search, match, state) => {
  search &&
    (typeof search === 'object'
      ? ((search.lastIndex = match.index + match[0].length), (state.nextOffset = match.input.search(search)))
      : (state.nextOffset = match.input.indexOf(search, match.index + match[0].length)));
};

/**
 * @returns {'fault'}
 */
const fault = (text, state) => {
  console.warn(text, {...state});
  return 'fault';
};

const matcher = (ECMAScript =>
  Matcher.define(
    entity =>
      Matcher.join(
        entity(ECMAScript.Break()),
        entity(ECMAScript.Whitespace()),
        entity(ECMAScript.Escape()),
        entity(ECMAScript.Comment()),
        entity(ECMAScript.StringLiteral()),
        entity(ECMAScript.TemplateLiteral()),
        entity(ECMAScript.Opener()),
        entity(ECMAScript.Closer()),
        entity(ECMAScript.Solidus()),
        entity(ECMAScript.Operator()),
        entity(ECMAScript.Keyword()),
        entity(ECMAScript.Number()),
        entity(ECMAScript.Identifier()),
        /* Fallthrough */ '.',
      ),
    'gu',
    {
      goal: {value: ECMAScriptGoal, enumerable: true, writable: false},
    },
  ))({
  Break: ({lf = true, crlf = false} = {}) =>
    Matcher.define(
      entity => Matcher.sequence`(
        ${Matcher.join(lf && '\\n', crlf && '\\r\\n')}
        ${entity((text, entity, match, state) => {
          const group = state.context.group;
          match.format = 'whitespace';
          capture(group && group.closer === '\n' ? close(text, state) || 'closer' : 'break', match, text);
          match.flatten = false;
        })}
      )`,
    ),
  Whitespace: () =>
    Matcher.define(
      entity => Matcher.sequence`(
        \s+
        ${entity((text, entity, match, state) => {
          match.format = 'whitespace';
          capture((match.flatten = state.lineOffset !== match.index) ? 'whitespace' : 'inset', match, text);
        })}
      )`,
    ),
  Escape: ({
    ECMAScriptUnicodeIDContinue = RegExp(
      Matcher.sequence`[${UnicodeIDContinue}]+`,
      UnicodeIDContinue.includes('\\p{') ? 'u' : '',
    ),
  } = {}) =>
    Matcher.define(
      entity => Matcher.sequence`(
        \\u[${HexDigit}][${HexDigit}][${HexDigit}][${HexDigit}]
        ${entity((text, entity, match, state) => {
          const context = state.context;
          match.format = 'escape';
          capture(
            context.goal.type ||
              (context.goal === ECMAScriptGoal &&
              state.previousToken != null &&
              state.previousToken.type === 'identifier' &&
              ECMAScriptUnicodeIDContinue.test(String.fromCodePoint(parseInt(text.slice(2), 16)))
                ? ((match.flatten = true), 'identifier')
                : 'escape'),
            match,
            text,
          );
        })}
      )|(
        \\f|\\n|\\r|\\t|\\v|\\c[${ControlLetter}]
        |\\x[${HexDigit}][${HexDigit}]
        |\\u\{[${HexDigit}]*\}
        |\\.
        ${entity((text, entity, match, state) => {
          capture(state.context.goal.type || 'escape', match, (match.capture[keywords[text]] = text));
        })}
      )`,
    ),
  Comment: () =>
    Matcher.define(
      entity => Matcher.sequence`(
        \/\/|\/\*
        ${entity((text, entity, match, state) => {
          const context = state.context;
          match.format = 'punctuation';
          capture(
            context.goal === ECMAScriptGoal
              ? open(text, state) ||
                  // Safely fast skip to end of comment
                  (forward(text === '//' ? '\n' : '*/', match, state),
                  // No need to track delimiter
                  CommentGoal.type)
              : context.goal !== CommentGoal
              ? context.goal.type || 'sequence'
              : context.group.closer !== text
              ? CommentGoal.type
              : close(text, state) || (match.punctuator = CommentGoal.type),
            match,
            text,
          );
        })}
      )`,
    ),
  StringLiteral: () =>
    Matcher.define(
      entity => Matcher.sequence`(
        "|'
        ${entity((text, entity, match, state) => {
          const context = state.context;
          match.format = 'punctuation';
          capture(
            context.goal === ECMAScriptGoal
              ? open(text, state) ||
                  // TODO: Investigate why regexp forward is slow
                  // (void forward(text === '"' ? /(?:[^"\\\n]+?(?=\\.|")|\\.)*?"/g : /(?:[^'\\\n]+?(?=\\.|')|\\.)*?'/g, match, state)) ||
                  ((match.punctuator = StringGoal.type), 'opener')
              : context.goal !== StringGoal
              ? context.goal.type || 'sequence'
              : context.group.closer !== text
              ? StringGoal.type
              : ((match.flatten = false), close(text, state) || ((match.punctuator = StringGoal.type), 'closer')),
            match,
            text,
          );
        })}
      )`,
    ),
  TemplateLiteral: () =>
    Matcher.define(
      entity => Matcher.sequence`(
        ${'`'}
        ${entity((text, entity, match, state) => {
          const context = state.context;
          match.format = 'punctuation';
          capture(
            context.goal === ECMAScriptGoal
              ? open(text, state) || ((match.punctuator = TemplateLiteralGoal.type), 'opener')
              : context.goal !== TemplateLiteralGoal
              ? context.goal.type || 'sequence'
              : context.group.closer !== text
              ? TemplateLiteralGoal.type
              : close(text, state) || ((match.punctuator = TemplateLiteralGoal.type), 'closer'),
            match,
            text,
          );
        })}
      )`,
    ),
  Opener: () =>
    Matcher.define(
      entity => Matcher.sequence`(
        \$\{|\{|\(|\[
        ${entity((text, entity, match, state) => {
          const context = state.context;
          match.format = 'punctuation';
          capture(
            context.goal.punctuators && context.goal.punctuators[text] === true
              ? (match.punctuator = 'combinator')
              : context.goal.openers &&
                context.goal.openers[text] === true &&
                (text !== '[' || context.goal !== RegExpGoal || context.group.opener !== '[')
              ? open(text, state) || 'opener'
              : context.goal.type || 'sequence',
            match,
            text,
          );
        })}
      )`,
    ),
  Closer: () =>
    Matcher.define(
      entity => Matcher.sequence`(
        \}|\)|\]
        ${entity((text, entity, match, state) => {
          const context = state.context;
          match.format = 'punctuation';
          capture(
            context.goal.punctuators && context.goal.punctuators[text] === true
              ? (match.punctuator = 'combinator')
              : context.goal.closers && context.goal.closers[text] === true
              ? close(text, state) || 'closer'
              : context.goal.type || 'sequence',
            match,
            text,
          );
        })}
      )`,
    ),
  Solidus: () =>
    // TODO: Refine the necessary criteria for RegExp vs Div
    // SEE: https://github.com/sweet-js/sweet-core/wiki/design
    // SEE: https://inimino.org/~inimino/blog/javascript_semicolons
    // SEE: https://github.com/guybedford/es-module-shims/blob/master/src/lexer.js
    Matcher.define(
      entity => Matcher.sequence`(
        \*\/|\/=|\/
        ${entity((text, entity, match, state) => {
          let previousAtom;
          const context = state.context;
          match.format = 'punctuation';
          capture(
            context.goal === CommentGoal
              ? (context.group.closer === text && close(text, state)) || (match.punctuator = context.goal.type)
              : context.goal === RegExpGoal && context.group.closer !== ']' // ie /…*/ or /…/
              ? close('/', state) || ((match.punctuator = context.goal.type), 'closer')
              : context.goal !== ECMAScriptGoal
              ? context.goal.type || 'sequence'
              : text[0] === '*'
              ? fault(text, state)
              : !(previousAtom = state.previousAtom) ||
                (previousAtom.type === 'operator'
                  ? previousAtom.text !== '++' && previousAtom.text !== '--'
                  : previousAtom.type === 'closer'
                  ? previousAtom.text === '}'
                  : previousAtom.type === 'opener' || previousAtom.type === 'keyword')
              ? open(text, state) || ((match.punctuator = 'pattern'), 'opener')
              : (match.punctuator = 'operator'),
            match,
            text,
          );
        })}
      )`,
    ),
  Operator: () =>
    Matcher.define(
      entity => Matcher.sequence`(
        ,|;|\.\.\.|\.|:|\?|=>
        |\+\+|--
        |\+=|-=|\*\*=|\*=
        |&&|&=|&|\|\||\|=|\||%=|%|\^=|\^|~=|~
        |<<=|<<|<=|<|>>>=|>>>|>>=|>>|>=|>
        |!==|!=|!|===|==|=
        |\+|-|\*\*|\*
        ${entity((text, entity, match, state) => {
          const context = state.context;
          match.format = 'punctuation';
          capture(
            context.goal === ECMAScriptGoal
              ? 'operator'
              : context.goal.punctuators && context.goal.punctuators[text] === true
              ? (match.punctuator = 'punctuation')
              : context.goal.type || 'sequence',
            match,
            text,
          );
        })}
      )`,
    ),
  Keyword: () =>
    Matcher.define(
      entity => Matcher.sequence`\b(
        ${Matcher.join(...keywords)}
        ${entity((text, entity, match, state) => {
          let previousAtom, keywordSymbol;
          const context = state.context;
          match.format = 'identifier';
          capture(
            (match.flatten = context.goal !== ECMAScriptGoal)
              ? context.goal.type || 'sequence'
              : ((keywordSymbol = keywords[text]), (previousAtom = state.previousAtom)) && previousAtom.text === '.'
              ? 'identifier'
              : 'keyword',
            match,
            text,
          );
          keywordSymbol &&
            ((context.keywords = (context.keywords || 0) + 1),
            (context[`${(match.capture[keywordSymbol] = text)}-keyword-index`] = match.index));
        })}
      )\b(?=[^\s$_:]|\s+[^:]|$)`,
    ),
  Identifier: ({RegExpFlags = /^[gimsuy]+$/} = {}) =>
    Matcher.define(
      entity => Matcher.sequence`(
        [${UnicodeIDStart}][${UnicodeIDContinue}]*
        ${entity((text, entity, match, state) => {
          let previousToken;
          match.format = 'identifier';
          capture(
            state.context.goal !== ECMAScriptGoal
              ? state.context.goal.type || 'sequence'
              : (previousToken = state.previousToken) &&
                previousToken.punctuator === 'pattern' &&
                RegExpFlags.test(text)
              ? ((match.punctuator = RegExpGoal.type), 'closer')
              : ((match.flatten = true), 'identifier'),
            match,
            text,
          );
        })}
      )`,
      `${UnicodeIDStart}${UnicodeIDContinue}`.includes('\\p{') ? 'u' : '',
    ),
  Number: ({
    NumericSeparator,
    Digits = NumericSeparator
      ? Digit => Matcher.sequence`[${Digit}][${Digit}${Matcher.escape(NumericSeparator)}]*`
      : Digit => Matcher.sequence`[${Digit}]+`,
    DecimalDigits = Digits(DecimalDigit),
    HexDigits = Digits(HexDigit),
    BinaryDigits = Digits(BinaryDigit),
  } = {}) =>
    Matcher.define(
      entity => Matcher.sequence`\b(
        ${DecimalDigits}\.${DecimalDigits}[eE]${DecimalDigits}
        |\.${DecimalDigits}[eE]${DecimalDigits}
        |0[xX]${HexDigits}
        |0[bB]${BinaryDigits}
        |${DecimalDigits}\.${DecimalDigits}
        |\.${DecimalDigits}
        |${DecimalDigits}
        ${entity((text, entity, match, state) => {
          match.format = 'number';
          capture(state.context.goal.type || 'number', match, text);
        })}
      )\b`,
    ),
});

/// <reference path="./types.d.ts" />

const {
  createTokenFromMatch,
  createMatcherInstance,
  createString,
  createMatcherTokenizer,
  createMatcherMode,
} = (() => {
  const {
    RegExp,
    Object,
    Object: {assign, create, freeze, defineProperty, defineProperties, getOwnPropertyNames, setPrototypeOf},
    String,
  } = globalThis;

  /** @typedef {RegExpConstructor['prototype']} Matcher */

  /**
   * @template {Matcher} T
   * @template {{}} U
   * @param {T} matcher
   * @param {TokenizerState<T, U>} [state]
   * @returns {TokenMatcher<U>}
   */
  const createMatcherInstance = (matcher, state) =>
    defineProperty(
      ((state || (state = create(null))).matcher =
        (matcher && matcher instanceof RegExp && createMatcherClone(matcher)) || RegExp(matcher, 'g')),
      'state',
      {value: state},
    );

  /**
   * @template {Matcher} T
   * @template {T} U
   * @template {{}} V
   * @type {(matcher: T & V, instance?: U) => U & V}
   * @param {T} param0
   * @param {U} [param1]
   * @returns {U}
   */
  const createMatcherClone = ({constructor: {prototype}, source, flags, lastIndex, ...properties}, instance) => (
    (instance = assign(instance || RegExp(source, flags || 'g'), properties)),
    prototype && setPrototypeOf(instance, prototype),
    instance
  );

  /** @type {(value: any) => string} */
  const createString = String;

  /**
   * @type {<M extends MatchArray, T extends {}>(init: MatchResult<M>) => Token<T>}
   * @param {MatchResult<MatchArray>} param0
   */
  const createTokenFromMatch = ({0: text, identity, capture, index}) => ({
    type: (identity && (identity.description || identity)) || 'text',
    text,
    breaks: countLineBreaks(text),
    inset: (capture && capture.inset) || '',
    offset: index,
    capture,
  });

  const tokenizerProperties = Object.getOwnPropertyDescriptors(
    freeze(
      class Tokenizer {
        /**
         * @template {Matcher} T
         * @template {{}} U
         */
        *tokenize() {
          /** @type {Token<U>} */
          // let next;
          /** @type {{createToken: typeof createTokenFromMatch, initializeState: <V>(state: V) => V & TokenizerState<T, U>}} */
          const createToken = (this && this.createToken) || createTokenFromMatch;
          /** @type {string} */
          const string = createString(Object.keys({[arguments[0]]: 1})[0]);
          /** @type {TokenMatcher<U>} */
          const matcher = createMatcherInstance(this.matcher, assign(arguments[1] || {}, {sourceText: string}));
          /** @type {TokenizerState<T, U>} */
          const state = matcher.state;
          this.initializeState && this.initializeState(state);
          matcher.exec = matcher.exec; //.bind(matcher);
          // freeze(matcher);
          // console.log(this, {string, matcher, state}, [...arguments]);
          for (
            let match, token, next, index = 0;
            // Abort on first failed/empty match
            ((match = matcher.exec(string)) && match[0] !== '') ||
            //   but first yield a lastToken if present
            void (next && (yield next));
            // We hold back one grace token
            (token = createToken(match, state)) &&
            //  until createToken(…) !== undefined (ie new token)
            //  set the incremental token index for this lastToken
            (((state.lastToken = token).index = index++),
            //  and finally push the previous lastToken and yield
            next && (yield next),
            (next = token))
          );

          // console.log({...state});
        }
      }.prototype,
    ),
  );

  /**
   * @type { {<T extends Matcher, U extends {} = {}>(sourceText: string, initialState?: Partial<TokenizerState<undefined, U>): IterableIterator<Token<U>>} }
   */
  const createMatcherTokenizer = instance => defineProperties(instance, tokenizerProperties);

  /**
   * @param {import('/modules/matcher/matcher.js').Matcher} matcher
   * @param {any} [options]
   */
  const createMatcherMode = (matcher, options) => {
    const tokenizer = createMatcherTokenizer({
      createToken: createTokenFromMatch,
      /** @type {(state: {}) =>  void} */
      initializeState: undefined,
      matcher: freeze(createMatcherInstance(matcher)),
    });

    const mode = {syntax: 'matcher', tokenizer};
    options &&
      ({
        syntax: mode.syntax = mode.syntax,
        aliases: mode.aliases,
        preregister: mode.preregister,
        createToken: tokenizer.createToken = tokenizer.createToken,
        initializeState: tokenizer.initializeState,
        ...mode.overrides
      } = options);

    freeze(tokenizer);

    return mode;
  };

  return {createTokenFromMatch, createMatcherInstance, createString, createMatcherTokenizer, createMatcherMode};
})();

const mode = createMatcherMode(matcher, {
  syntax: 'ecmascript',
  aliases: ['es', 'js', 'javascript'],
  initializeState: state => {
    (state.groups = []).closers = [];
    state.lineOffset = state.lineIndex = 0;
    state.lineFault = false;
    const contexts = (state.contexts = Array(100));
    const context = initializeContext({
      id: `«${matcher.goal.name}»`,
      number: (contexts.count = 1),
      depth: 0,
      parent: undefined,
      goal: matcher.goal,
      group: undefined,
      state,
    });
    contexts[-1] = state.context = context;
  },
  preregister: parser => {
    parser.unregister('es');
    parser.unregister('ecmascript');
  },
  createToken: (match, state) => {
    let currentGoal,
      goalName,
      goalType,
      contextId,
      text,
      type,
      fault,
      punctuator,
      offset,
      inset,
      breaks,
      delimiter,
      comment,
      whitespace,
      flatten,
      fold,
      columnNumber,
      lineNumber,
      tokenNumber,
      captureNumber,
      hint;

    const {context, nextContext, lineIndex, lineOffset, nextOffset, previousToken} = state;

    /* Capture */

    ({
      0: text,
      capture: {inset},
      identity: type,
      flatten,
      fault,
      punctuator,
      index: offset,
    } = match);

    if (!text) return;

    /* Context */

    nextContext && (state.nextContext = void (nextContext !== context && (state.context = nextContext)));

    ({id: contextId, goal: currentGoal} = context);
    ({name: goalName, type: goalType} = currentGoal);

    nextOffset &&
      (state.nextOffset = void (nextOffset > offset && (text = match.input.slice(offset, nextOffset)),
      (state.matcher.lastIndex = nextOffset)));

    breaks = (text === '\n' && 1) || countLineBreaks(text);
    comment = type === 'comment' || punctuator === 'comment';
    delimiter = type === 'closer' || type === 'opener';
    whitespace = !delimiter && (type === 'whitespace' || type === 'break' || type === 'inset');

    type || (type = (!delimiter && !fault && goalType) || 'text');

    if (breaks) {
      state.lineIndex += breaks;
      state.lineOffset = offset + (text === '\n' ? 1 : text.lastIndexOf('\n'));
    }

    /* Flattening / Token Folding */

    flatten === false || flatten === true || (flatten = !delimiter && currentGoal.flatten === true);

    captureNumber = ++context.captureCount;

    if (
      (fold = flatten) && // fold only if flatten is allowed
      previousToken != null &&
      previousToken.context === context && // never fold across contexts
      previousToken.fold === true &&
      (previousToken.type === type || (currentGoal.fold === true && (previousToken.type = currentGoal.type)))
    ) {
      previousToken.text += text;
      breaks && (previousToken.breaks += breaks);
    } else {
      /* Token Creation */
      flatten = false;
      columnNumber = 1 + (offset - lineOffset || 0);
      lineNumber = 1 + (lineIndex || 0);
      tokenNumber = ++context.tokenCount;

      hint = `${(delimiter ? type : goalType && `in-${goalType}`) ||
        ''}&#x000A;${contextId} #${tokenNumber}&#x000A;(${lineNumber}:${columnNumber})`;

      return (state.previousToken = state[whitespace || comment ? 'previousTrivia' : 'previousAtom'] = {
        type,
        text,
        offset,
        breaks,
        inset,
        columnNumber,
        lineNumber,
        punctuator,
        fault,
        fold,
        flatten,
        delimiter,
        whitespace,
        comment,
        hint,

        captureNumber,
        tokenNumber,

        context,
        lineIndex,
        lineOffset,
      });
    }
  },
});

/**
 * @param {import('/markup/packages/tokenizer/lib/api').API} markup
 */
const experimentalES = ((
  sourceURL = './matcher.js',
  sourceType = 'es',
  resolveSourceType = (defaultType, {sourceType, resourceType, options}) => {
    if (!sourceType && resourceType === 'javascript') return 'es';
  },
) => async markup => {
  markup.parsers[0].register(mode);
  return {sourceURL, sourceType, resolveSourceType};
})();

const css = Object.defineProperties(
  ({syntax} = css.defaults) => ({
    syntax,
    comments: Closures.from('/*…*/'),
    closures: Closures.from('{…} (…) […]'),
    quotes: Symbols.from(`' "`),
    assigners: Symbols.from(`:`),
    combinators: Symbols.from('> :: + :'),
    nonbreakers: Symbols.from(`-`),
    breakers: Symbols.from(', ;'),
    matcher: /(\n|\s+)|(\\(?:(?:\\\\)*\\|[^\\\s])?|\/\*|\*\/|\(|\)|\[|\]|"|'|\{|\}|,|;|\.|\b:\/\/\b|::\b|:(?!active|after|any|any-link|backdrop|before|checked|default|defined|dir|disabled|empty|enabled|first|first-child|first-letter|first-line|first-of-type|focus|focus-visible|focus-within|fullscreen|host|hover|in-range|indeterminate|invalid|lang|last-child|last-of-type|left|link|matches|not|nth-child|nth-last-child|nth-last-of-type|nth-of-type|only-child|only-of-type|optional|out-of-range|read-only|required|right|root|scope|target|valid|visited))/g,
    matchers: {
      quote: /(\n)|(\\(?:(?:\\\\)*\\|[^\\\s])?|\*\/|`|"|'|\$\{)/g,
      comment: /(\n)|(\*\/|\b(?:[a-z]+\:\/\/|\w[\w\+\.]*\w@[a-z]+)\S+|@[a-z]+)/gi,
    },
  }),
  {
    defaults: {value: {syntax: 'css'}},
  },
);

const html = Object.defineProperties(
  ({syntax} = html.defaults) => {
    const html = {
      syntax,
      keywords: Symbols.from('DOCTYPE doctype'),
      comments: Closures.from('<!--…-->'),
      closures: Closures.from('<%…%> <!…> <…/> </…> <…>'),
      quotes: [],
      patterns: {
        maybeKeyword: /^[a-z](\w*)$/i,
        closeTag: /<\/\w[^<>{}]*?>/g,
        // maybeIdentifier: /^(?:(?:[a-z][\-a-z]*)?[a-z]+\:)?(?:[a-z][\-a-z]*)?[a-z]+$/,
      },
      matcher: /(\n|\s+)|("|'|=|&#x?[a-f0-9]+;|&[a-z]+;|\/?>|<%|%>|<!--|-->|<[\/\!]?(?=[a-z]+\:?[a-z\-]*[a-z]|[a-z]+))/gi,
      matchers: {
        quote: /(\n)|(\\(?:(?:\\\\)*\\|[^\\\s])|"|')/g,
        comment: /(\n)|(-->)/g,
      },
    };

    const DOCTAGS = Symbols.from('SCRIPT STYLE');
    const TAG = /^[a-z]+$/i;
    // TODO: Check if custom/namespace tags ever need special close logic
    // const TAGLIKE = /^(?:(?:[a-z][\-a-z]*)?[a-z]+\:)?(?:[a-z][\-a-z]*)?[a-z]+$/i;

    const HTMLTagClosure = html.closures.get('<');

    HTMLTagClosure.patterns = html.patterns;

    HTMLTagClosure.close = (next, state, context) => {
      const parent = next && next.parent;
      const first = parent && parent.next;
      const tag = first && first.text && TAG.test(first.text) && first.text.toUpperCase();

      if (tag && DOCTAGS.includes(tag)) {
        let {source, index} = state;
        const $$matcher = html.patterns.closeTag;

        let match;
        $$matcher.lastIndex = index;

        // TODO: Check if `<script>`…`</SCRIPT>` is still valid!
        const $$closer = new RegExp(raw`^<\/(?:${first.text.toLowerCase()}|${tag})\b`);

        let syntax = (tag === 'STYLE' && 'css') || '';

        if (!syntax) {
          const openTag = source.slice(parent.offset, index);
          const match = /\stype=.*?\b(.+?)\b/.exec(openTag);
          syntax = tag === 'SCRIPT' && (!match || !match[1] || /^module$|javascript/i.test(match[1])) ? 'es' : '';
        }

        while ((match = $$matcher.exec(source))) {
          if ($$closer.test(match[0])) {
            if (syntax) {
              return {offset: index, index: match.index, syntax};
            } else {
              const offset = index;
              const text = source.slice(offset, match.index - 1);
              state.index = match.index;
              return [{text, offset, previous: next, parent}];
            }
          }
        }
      }
    };
    HTMLTagClosure.quotes = Symbols.from(`' "`);
    HTMLTagClosure.closer = /\/?>/;

    return html;
  },
  {
    defaults: {value: {syntax: 'html', aliases: ['htm']}},
  },
);

const markdown = Object.defineProperties(
  ({syntax} = defaults, {html}) => {
    const matcher = ((...matchers) => {
      let matcher = matchers[matchers.length - 1];
      try {
        matchers.push(
          (matcher = sequence`${all(
            sequence`(${markdown.WHITESPACE})`,
            sequence`(${all(
              markdown.ESCAPES,
              markdown.ENTITIES,
              markdown.RULES,
              markdown.BLOCKS,
              markdown.INLINES,
              markdown.TYPOGRAPHS,
              markdown.TAGS,
              markdown.BRACKETS,
              markdown.FENCES,
              markdown.SPANS,
            )})`,
            markdown.INDICIES,
            markdown.DECIMAL,
            markdown.EXPONENTIAL,
            markdown.FRAGMENTS,
          )}${'/gim'}`),
        );
        return matcher;
      } catch (exception) {
        matchers.push(exception.message.replace(/.*Invalid regular expression: /, ''));
        console.warn(exception);
      }
      matcher.matchers = matchers;
      return matcher;
    })(
      /(^\s+|\n)|(&#x?[a-f0-9]+;|&[a-z]+;|(?:```+|\~\~\~+|(?:--+|==+)(?=\s*$)|(?:\#{1,6}|\-|\b\d+\.|\b[a-z]\.|\b[ivx]+\.)(?=\s+\S*))|–|—|"|'|=|\/>|<%|%>|<!--|-->|<[\/\!]?(?=[a-z]+\:?[a-z\-]*[a-z]|[a-z]+)|<|>|\(|\)|\[|\]|__?|([*~`])\3?\b|(?:\b|\b\B|\B)([*~`])\4?)|\b[^\n\s\[\]\(\)\<\>&]*[^\n\s\[\]\(\)\<\>&_]\b|[^\n\s\[\]\(\)\<\>&]+(?=__?\b)|\\./gim,
      sequence`(${markdown.WHITESPACE})|(${markdown.ENTITIES}|(?:${markdown.FENCES}|(?:${markdown.RULES})(?=\s*$)|(?:${
        markdown.BLOCKS
      })(?=\s+\S*))|${markdown.TYPOGRAPHS}|${markdown.TAGS}|${markdown.BRACKETS}|${markdown.INLINES})|${
        markdown.FRAGMENTS
      }|${markdown.ESCAPES}${'/gim'}`,
    );

    const mode = {
      syntax,
      comments: Closures.from('<!--…-->'),
      quotes: [],
      closures: Closures.from(html.closures, markdown.CLOSURES),
      operators: html.operators,
      matcher: matcher,
      spans: Closures.from('``…`` `…`'),
      matchers: {comment: /(\n)|(-->)/g},
    };

    const open = (parent, state, grouper) => {
      const {source, index: start} = state;
      const fence = parent.text;
      const fencing = previousTextFrom(parent, '\n');
      const indenting = fencing.slice(fencing.indexOf('\n') + 1, -fence.length) || '';
      let end = source.indexOf(`\n${fencing}`, start);
      const INDENT = (indenting && indenter(indenting)) || /^/m;
      const CLOSER = new RegExp(raw`^${INDENT.source.slice(1) || ''}${fence}`, 'mg');

      CLOSER.lastIndex = start;
      let closerMatch = CLOSER.exec(source);
      if (closerMatch && closerMatch.index >= start) {
        end = closerMatch.index;
      } else {
        const FENCE = new RegExp(raw`^[\>\|\s]*${fence}`, 'mg');
        FENCE.lastIndex = start;
        const fenceMatch = FENCE.exec(source);
        if (fenceMatch && fenceMatch.index >= start) {
          end = fenceMatch.index;
        } else return;
      }

      if (end > start) {
        let offset = start;
        let text, head, lines;

        const body = source.slice(start, end) || '';
        const tokens = [];
        tokens.end = end;
        {
          [head, ...lines] = body.split(/\r?(\n)\r?/g);
          if (head) {
            tokens.push({text: head, type: 'comment', offset, parent}), (offset += head.length);
          }
          for (const line of lines) {
            if (line === '\n') {
              text = line;
              tokens.push({text, type: 'whitespace', offset, parent}), (offset += text.length);
            } else {
              const [indent] = INDENT.exec(line) || '';
              const inset = (indent && indent.length) || 0;
              if (inset) {
                for (const text of indent.split(/(\s+)/g)) {
                  if (!text) continue;
                  const type = (text.trim() && 'sequence') || 'whitespace';
                  tokens.push({text, type, offset, parent});
                  offset += text.length;
                }
                text = line.slice(inset) || '';
              } else {
                text = line;
              }
              if (text) {
                tokens.push({text, type: 'code', offset, parent}), (offset += text.length);
              }
            }
          }
        }

        if (tokens.length) {
          const last = tokens[tokens.length - 1];
          if (!last.text) tokens.pop();
          return tokens;
        }
      }
    };

    {
      const quotes = html.closures.get('<').quotes;
      for (const opener of ['```', '~~~']) {
        const FenceClosure = mode.closures.get(opener);
        if (FenceClosure) {
          FenceClosure.matcher = new RegExp(raw`/(\s*\n)|(${opener}(?=\s|$)|^(?:[\s>|]*\s)?\s*)|.*$`, 'gm');
          FenceClosure.quotes = quotes;
          FenceClosure.open = open;
        }
      }
    }

    return mode;
  },
  {
    defaults: {get: () => ({...markdown.DEFAULTS})},
  },
);

Definitions: {
  Defaults: {
    markdown.DEFAULTS = {syntax: 'markdown', aliases: ['md'], requires: ['html']};
  }

  markdown.BLOCK = '```…``` ~~~…~~~';
  markdown.INLINE = '[…] (…) *…* **…** _…_ __…__ ~…~ ~~…~~';
  markdown.CLOSURES = `${markdown.BLOCK} ${markdown.INLINE}`;
  markdown.WHITESPACE = /^\s+|\s+$|\n+/;
  markdown.ESCAPES = /\\./;
  markdown.ENTITIES = /&#x?[a-f0-9]+;|&[a-z]+;/;
  markdown.FENCES = /(?:\x60{3,}|\x7E{3,})(?=\b| |$)/;
  markdown.RULES = /(?:[\-]{2,}|[=]{2,})(?=\s*$)/;
  markdown.BLOCKS = /(?:\#{1,6}|\-|\b\d+\.|\b[a-z]\.|\b[ivx]+\.)(?=\s+\S)/;
  markdown.TYPOGRAPHS = /\B[\–](?=\ )|"|'|=/;
  markdown.TAGS = /\/>|<%|%>|<!--|-->|<[\/\!]?(?=[a-z]+\:?[a-z\-]*[a-z]|[a-z]+)/;
  markdown.BRACKETS = /<|>|\(|\)|\[|\]/;
  markdown.INLINES = /\b([*~_])(?:\3\b(?=[^\n]*[^\n\s\\]\3\3)|\b(?=[^\n]*[^\n\s\\]\3))|(?:\b|\b\B|\B)([*~_])\4?/;
  markdown.SPANS = /(``?(?![`\n]))[^\n]*?[^\\`\n]\5/;
  markdown.INDICIES = /\b(?:[\da-zA-Z]+\.)+[\da-zA-Z]+\.?/;
  markdown.DECIMAL = /[+\-]?\d+(?:,\d{3})*(?:\.\d+)?|[+\-]?\d*\.\d+/;
  markdown.EXPONENTIAL = /\d+[eE]\-?\d+|\d+\.\d+[eE]\-?\d+/;
  markdown.FRAGMENTS = /\b[^\n\s\[\]\(\)\<\>&`"]*[^\n\s\[\]\(\)\<\>&_`"]\b|[^\n\s\[\]\(\)\<\>&`"]+(?=__?\b)/;
}

const javascript = Object.defineProperties(
  ({syntax} = defaults) => ({
    syntax,
    comments: Closures.from(javascript.COMMENTS),
    quotes: Symbols.from(javascript.QUOTES),
    closures: Closures.from(javascript.CLOSURES),
    spans: {'`': Closures.from(javascript.SPANS['`'])},
    keywords: Symbols.from(javascript.KEYWORDS),
    assigners: Symbols.from(javascript.ASSIGNERS),
    combinators: Symbols.from(javascript.COMBINATORS),
    nonbreakers: Symbols.from(javascript.NONBREAKERS),
    operators: Symbols.from(javascript.OPERATORS),
    breakers: Symbols.from(javascript.BREAKERS),
    patterns: {
      ...patterns,
      maybeIdentifier: identifier(entities.es.IdentifierStart, entities.es.IdentifierPart),
      maybeKeyword: /^[a-z][a-zA-Z]+$/,
      segments: {
        regexp: /^\/(?![\n*+/?])[^\n]*[^\\\n]\//,
      },
    },
    matcher: sequence`(\n|\s+)|(${all(
      javascript.REGEXPS,
      javascript.COMMENTS,
      javascript.QUOTES,
      javascript.CLOSURES,
      ...javascript.PUNCTUATORS,
    )})`,
    matchers: {
      "'": /(\n)|(')|(\\.)/g,
      '"': /(\n)|(")|(\\.)/g,
      '`': /(\n)|(`|\$\{)|(\\.)/g,
      quote: /(\n)|(`|"|'|\$\{)|(\\.)/g,
      comment: /(\n)|(\*\/|\b(?:[a-z]+\:\/\/|\w[\w+.]*\w@[a-z]+)\S+|@[a-z]+)/gi,
    },
  }),
  {
    defaults: {get: () => ({...javascript.DEFAULTS})},
  },
);

Definitions: {
  Defaults: {
    javascript.DEFAULTS = {syntax: 'javascript', aliases: ['js', 'es', 'ecmascript']};
    // javascript.DEFAULTS = {syntax: 'javascript', aliases: ['js']};
  }

  javascript.REGEXPS = /\/(?=[^*/\n][^\n]*\/(?:[a-z]+\b|)(?:[ \t]+[^\n\s\(\[\{\w]|[.\[;,]|[ \t]*[)\]};,\n]|\n|$))(?:[^\\\/\n\t\[]+|\\[^\n]|\[(?:\\[^\n]|[^\\\n\t\]]+)*?\][+*]?\??)*\/(?:[a-z]+\b|)/g;

  javascript.COMMENTS = /\/\/|\/\*|\*\/|^\#\!.*\n|<!--/g;
  javascript.COMMENTS['(closures)'] = '//…\n /*…*/ <!--…\n';

  javascript.QUOTES = /`|"|'/g;
  javascript.QUOTES['(symbols)'] = `' " \``;

  javascript.CLOSURES = /\{|\}|\(|\)|\[|\]/g;
  javascript.CLOSURES['(closures)'] = '{…} (…) […]';

  javascript.SPANS = {'`': {['(closures)']: '${…}'}};

  javascript.KEYWORDS = {
    ['(symbols)']:
      // 'abstract enum interface package namespace declare type module public protected ' +
      'arguments as async await break case catch class export const continue private debugger default delete do else export extends finally for from function get if import in instanceof let new of return set static super switch this throw try typeof var void while with yield',
  };

  javascript.PUNCTUATORS = [
    /,|;|\.\.\.|\.|:|\?|=>/,
    /\+\+|\+=|\+|--|-=|-|\*\*=|\*\*|\*=|\*|\/=|\//,
    /&&|&=|&|\|\||\|=|\||%=|%|\^=|\^|~=|~/,
    /<<=|<<|<=|<|>>>=|>>>|>>=|>>|>=|>/,
    /!==|!=|!|===|==|=/,
  ];

  javascript.ASSIGNERS = {['(symbols)']: '= += -= *= /= **= %= &= |= <<= >>= >>>= ^= ~='};

  javascript.COMBINATORS = {['(symbols)']: '=== == + - * / ** % & && | || ! !== != > < >= <= => >> << >>> ^ ~'};
  javascript.NONBREAKERS = {['(symbols)']: '.'};
  javascript.OPERATORS = {['(symbols)']: '++ -- ... ? :'};
  javascript.BREAKERS = {['(symbols)']: ', ;'};
}

const typescript = Object.defineProperties(
  ({syntax} = typescript.defaults, {javascript}) => ({
    ...javascript,
    keywords: Symbols.from(typescript.KEYWORDS),
  }),
  {
    defaults: {get: () => ({...typescript.DEFAULTS})},
  },
);

Definitions: {
  Defaults: {
    typescript.DEFAULTS = {syntax: 'typescript', aliases: ['ts'], requires: [javascript.defaults.syntax]};
  }
  typescript.KEYWORDS = {
    ['(symbols)']: `abstract enum interface namespace declare type module private public protected ${
      javascript.KEYWORDS['(symbols)']
    }`,
  };
}

const mjs = Object.defineProperties(
  ({syntax} = mjs.defaults, {javascript: {quotes, closures, spans, matchers}}) => ({
    syntax,
    keywords: Symbols.from('import export default'),
    quotes,
    closures,
    spans,
    matcher: javascript.extended.MJS,
    matchers: {quote: matchers.quote, closure: javascript.extended.CLOSURE},
  }),
  {
    defaults: {get: () => ({...mjs.DEFAULTS})},
  },
);

const cjs = Object.defineProperties(
  ({syntax} = cjs.defaults, {javascript: {quotes, closures, spans, matchers}}) => ({
    syntax,
    keywords: Symbols.from('import module exports require'),
    quotes,
    closures,
    spans,
    matcher: javascript.extended.CJS,
    matchers: {quote: matchers.quote, closure: javascript.extended.CLOSURE},
  }),
  {
    defaults: {get: () => ({...cjs.DEFAULTS})},
  },
);

const esx = Object.defineProperties(
  ({syntax} = esx.defaults, {javascript: {quotes, closures, spans, matchers}, mjs, cjs}) => ({
    syntax,
    keywords: Symbols.from(mjs.keywords, cjs.keywords),
    quotes,
    closures,
    spans,
    matcher: javascript.extended.ESX,
    matchers: {quote: matchers.quote, closure: javascript.extended.CLOSURE},
  }),
  {
    defaults: {get: () => ({...esx.DEFAULTS})},
  },
);

Definitions: {
  Defaults: {
    const requires = [javascript.defaults.syntax];

    mjs.DEFAULTS = {syntax: 'mjs', aliases: ['esm'], requires};
    cjs.DEFAULTS = {syntax: 'cjs', requires};
    esx.DEFAULTS = {syntax: 'esx', requires: [...requires, 'cjs', 'mjs']};
  }

  const {REGEXPS, CLOSURES, extended = (javascript.extended = {})} = javascript;

  // TODO: Undo $ matching once fixed
  const QUOTES = (javascript.extended.QUOTES = /`|"(?:[^\\"]+|\\.)*(?:"|$)|'(?:[^\\']+|\\.)*(?:'|$)/g);
  const COMMENTS = (javascript.extended.COMMENTS = /\/\/.*(?:\n|$)|\/\*[^]*?(?:\*\/|$)|^\#\!.*\n|<!--/g);
  const STATEMENTS = (javascript.extended.STATEMENTS = all(QUOTES, CLOSURES, REGEXPS, COMMENTS));
  const BLOCKLEVEL = (javascript.extended.BLOCKLEVEL = sequence`(\n|\s+)|(${STATEMENTS})`);
  const TOPLEVEL = (javascript.extended.TOPLEVEL = sequence`(\n|\s+)|(${STATEMENTS})`);
  javascript.extended.CLOSURE = sequence`(\n+)|(${STATEMENTS})`;
  javascript.extended.MJS = sequence`${TOPLEVEL}|\bexport\b|\bimport\b`;
  javascript.extended.CJS = sequence`${BLOCKLEVEL}|\bexports\b|\bmodule.exports\b|\brequire\b|\bimport(?=\(|\.)`;
  javascript.extended.ESX = sequence`${BLOCKLEVEL}|\bexports\b|\bimport\b|\bmodule.exports\b|\brequire\b`;
}



const modes = /*#__PURE__*/Object.freeze({
  css: css,
  html: html,
  markdown: markdown,
  javascript: javascript,
  typescript: typescript,
  mjs: mjs,
  cjs: cjs,
  esx: esx
});

// export const Parser = createParser(Tokenizer);

/** @type {{experimentalESExtendedAPI: import('../lib/api').API}} */
const {
  experimentalESExtendedAPI: experimentalESExtendedAPI,
  experimentalESExtendedAPI: {parsers, render, tokenize, warmup},
} = {
  //@ts-ignore
  experimentalESExtendedAPI: new TokenizerAPI({
    parsers: [new (createParser(Tokenizer))({url: import.meta.url, modes})],
    render: (source, options, flags) => {
      const fragment = options && options.fragment;
      const debugging = flags && /\bdebug\b/i.test(typeof flags === 'string' ? flags : [...flags].join(' '));

      debugging &&
        console.info('render: %o', {api: experimentalESExtendedAPI, source, options, flags, fragment, debugging});
      fragment && (fragment.logs = debugging ? [] : undefined);

      return markupDOM.render(tokenize(source, options, flags), fragment);
    },
  }),
};

// Integrate experimental ECMAScript mapping it to the
//   "es" mode and "ecmascript" alias, but leaving the
//   normal JavaScript intact for both "js" and its
//   "javascript" alias.

const overrides = Object.freeze(experimentalES(experimentalESExtendedAPI));

export default experimentalESExtendedAPI;
export { encodeEntities, encodeEntity, entities, modes, overrides, parsers, render, tokenize, warmup };
//# sourceMappingURL=tokenizer.browser.es.extended.js.map