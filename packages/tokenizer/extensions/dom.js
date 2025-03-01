//@ts-check
import * as pseudom from '../../pseudom/pseudom.js';
import {each} from './helpers.js';

/// IMPLEMENTATION

class MarkupRenderer {
  constructor(options) {
    // TODO: Consider making Renderer a thing
    const {factory, defaults} = new.target;

    const {SPAN = 'span', LINE = 'span', CLASS: classPrefix = 'markup', REFLOW = true} = {
      ...defaults,
      ...options,
    };

    const PUNCTUATOR = `punctuator`;
    const LITERAL = `literal`;

    this.renderers = {
      line: factory(LINE, {markupHint: `${classPrefix}-line`, markupClass: classPrefix}),

      fault: factory(SPAN, {markupHint: `fault`, markupClass: classPrefix}),
      text: factory(SPAN, {markupHint: classPrefix, markupClass: classPrefix}),

      whitespace: MarkupRenderer.dom.Text,
      inset: factory(SPAN, {markupHint: `inset whitespace`, markupClass: classPrefix}),
      break: factory(SPAN, {markupHint: `break whitespace`, markupClass: classPrefix}),

      comment: factory(SPAN, {markupHint: `comment`, markupClass: classPrefix}),

      keyword: factory(SPAN, {markupHint: `keyword`, markupClass: classPrefix}),
      identifier: factory(SPAN, {markupHint: `identifier`, markupClass: classPrefix}),

      sequence: factory(SPAN, {markupHint: `sequence`, markupClass: classPrefix}),

      literal: factory(SPAN, {markupHint: LITERAL, markupClass: classPrefix}),
      number: factory(SPAN, {markupHint: `${LITERAL} number`, markupClass: classPrefix}),
      quote: factory(SPAN, {markupHint: `string quote`, markupClass: classPrefix}),
      string: factory(SPAN, {markupHint: `string`, markupClass: classPrefix}),
      pattern: factory(SPAN, {markupHint: `pattern`, markupClass: classPrefix}),

      punctuator: factory(SPAN, {markupHint: PUNCTUATOR, markupClass: classPrefix}),
      operator: factory(SPAN, {markupHint: `${PUNCTUATOR} operator`, markupClass: classPrefix}),
      assigner: factory(SPAN, {markupHint: `${PUNCTUATOR} operator assigner`, markupClass: classPrefix}),
      combinator: factory(SPAN, {markupHint: `${PUNCTUATOR} operator combinator`, markupClass: classPrefix}),
      delimiter: factory(SPAN, {markupHint: `${PUNCTUATOR} operator delimiter`, markupClass: classPrefix}),

      punctuation: factory(SPAN, {markupHint: `${PUNCTUATOR} punctuation`, markupClass: classPrefix}),

      breaker: factory(SPAN, {markupHint: `${PUNCTUATOR} breaker`, markupClass: classPrefix}),
      opener: factory(SPAN, {markupHint: `${PUNCTUATOR} opener`, markupClass: classPrefix}),
      closer: factory(SPAN, {markupHint: `${PUNCTUATOR} closer`, markupClass: classPrefix}),
      span: factory(SPAN, {markupHint: `${PUNCTUATOR} span`, markupClass: classPrefix}),
    };

    this.reflows = REFLOW;
  }

  async render(tokens, fragment) {
    let logs, template, first, elements;
    try {
      fragment || (fragment = MarkupRenderer.dom.Fragment());
      logs = fragment.logs; // || (fragment.logs = []);
      elements = this.renderer(tokens);
      if ((first = await elements.next()) && 'value' in first) {
        template = MarkupRenderer.dom.Template();
        if (!MarkupRenderer.dom.native && template && 'textContent' in fragment) {
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
    let renderedLine, LineInset, normalizedLineInset, normalizedLineText, lineBreak, insetHint;
    let type, text, punctuator, hint, lineInset, lineBreaks, renderer;
    const {renderers, reflows} = this;
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

      ({type = 'text', text, punctuator, hint, lineInset, lineBreaks} = token);

      renderer =
        (punctuator &&
          (renderers[punctuator] || (type && renderers[type]) || renderers.punctuator || renderers.operator)) ||
        (type && (renderers[type] || (type !== 'whitespace' && type !== 'break' && renderers.text))) ||
        MarkupRenderer.dom.Text;

      // Normlize inset for { type != 'inset', inset = /\s+/ }
      if (reflows && lineBreaks && type !== 'break') {
        LineInset = void (lineInset = lineInset || '');
        insetHint = `${hint || ''} in-${type || ''}`;
        for (const normlizedline of text.split(Lines)) {
          (normalizedLineInset = normlizedline.startsWith(lineInset)
            ? normlizedline.slice(0, lineInset.length)
            : normlizedline.match(LineInset || (LineInset = RegExp(`^${lineInset.replace(/./g, '$&?')}|`)))[0]) &&
            emitInset(normalizedLineInset, insetHint);

          (normalizedLineText = normalizedLineInset
            ? normlizedline.slice(normalizedLineInset.length)
            : normlizedline) &&
            ((normalizedLineText === '\n'
              ? ((lineBreak = normalizedLineText), (normalizedLineText = ''))
              : normalizedLineText.endsWith('\n')
              ? ((lineBreak = '\n'),
                (normalizedLineText = normalizedLineText.slice(0, normalizedLineText.endsWith('\r\n') ? -2 : -1)))
              : !(lineBreak = '')) && emit(renderer, normalizedLineText, type, hint),
            lineBreak && (emitBreak(), (renderedLine = void (yield renderedLine))));
        }
      } else {
        // TODO: See if pseudom children can be optimized for WBR/BR clones
        emit(renderer, text, type, hint);
        type === 'break'
          ? (renderedLine = void (yield renderedLine))
          : type === 'whitespace' || renderedLine.appendChild(MarkupRenderer.dom.Element('wbr'));
      }
    }
    renderedLine && (yield renderedLine);
  }

  /**
   * @template {{defaults?: Partial<typeof MarkupRenderer.defaults>; markupClass?: string; markupHint?: string;}} T
   * @param {string} tagName
   * @param {Partial<HTMLElement> & T} [elementProperties]
   */
  static factory(tagName, elementProperties) {
    const [
      tag,
      {
        defaults = (this || MarkupRenderer).defaults,
        markupClass = defaults.CLASS || MarkupRenderer.defaults.CLASS || 'markup',
        markupHint = '',
        ...properties
      } = {},
    ] = arguments;
    properties.className = markupHint ? `${markupClass} ${markupHint}` : markupClass;
    Object.freeze(properties);

    return Object.freeze((content, hint) => {
      let element, hintSeparator;

      element =
        (typeof content === 'string' && (content = MarkupRenderer.dom.Text(content))) || content != null
          ? MarkupRenderer.dom.Element(tag, properties, content)
          : MarkupRenderer.dom.Element(tag, properties);

      typeof hint === 'string' && hint !== '' && (hintSeparator = hint.indexOf('\n\n')) !== -1
        ? ((element.dataset = {
            hint: `${markupHint}${MarkupRenderer.dom.escape(hint.slice(hintSeparator))}`,
          }),
          hintSeparator === 0 || (element.className = `${element.className} ${hint.slice(0, hintSeparator)}`))
        : (hint && (element.className = `${element.className} ${hint}`),
          (element.dataset = {hint: hint || markupHint || element.className}));

      return element;
    });
  }
}

MarkupRenderer.defaults = Object.freeze({
  /** Specifies the intended mode for rendering a token @type {'html'} */
  MODE: 'html',
  /** Tag name of the element to use for rendering a token. */
  SPAN: 'span',
  /** Tag name of the element to use for grouping tokens in a single line. */
  LINE: 'span',
  /** The class name of the element to use for rendering a token. */
  CLASS: 'markup',
  /** Enable renderer-side unpacking { inset } || { breaks > 0 } tokens */
  REFLOW: true,
});

MarkupRenderer.dom = (() => {
  /** Uses lightweight proxy objects that can be serialized into HTML text */
  const HTML_MODE = MarkupRenderer.defaults.MODE === 'html';
  const supported = !!pseudom.native;
  const native = !HTML_MODE && supported;
  const implementation = native ? pseudom.native : pseudom.pseudo;
  const {createElement: Element, createText: Text, createFragment: Fragment} = implementation;
  const Template = template =>
    !supported || Template.supported === false
      ? false
      : Template.supported === true
      ? document.createElement('template')
      : (Template.supported = !!(
          (template = document.createElement('template')) && 'HTMLTemplateElement' === (template.constructor || '').name
        )) && template;
  const escape = /** @type {(source: string) => string} */ (((replace, replacement) => string =>
    replace(string, replacement))(
    RegExp.prototype[Symbol.replace].bind(/[\0-\x1F"\\]/g),
    m => `&#x${m.charCodeAt(0).toString(16)};`,
  ));

  Template.supported = undefined;

  return Object.freeze({supported, native, implementation, escape, Element, Text, Fragment, Template});
})();

/// INTERFACE

export default new MarkupRenderer();
