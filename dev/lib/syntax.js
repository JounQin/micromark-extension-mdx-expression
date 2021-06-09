/**
 * @typedef {import('micromark-util-types').Extension} Extension
 * @typedef {import('micromark-util-types').Tokenizer} Tokenizer
 * @typedef {import('micromark-util-types').State} State
 * @typedef {import('./util-events-to-acorn.js').Acorn} Acorn
 * @typedef {import('./util-events-to-acorn.js').AcornOptions} AcornOptions
 */

/**
 * @typedef Options
 * @property {boolean} [addResult=false]
 * @property {Acorn} [acorn]
 * @property {AcornOptions} [acornOptions]
 * @property {boolean} [spread=false]
 * @property {boolean} [forbidEmpty=false]
 */

import assert from 'assert'
import {factorySpace} from 'micromark-factory-space'
import {markdownLineEnding} from 'micromark-util-character'
import {codes} from 'micromark-util-symbol/codes.js'
import {types} from 'micromark-util-symbol/types.js'
import {factoryExpression} from './factory-expression.js'

/**
 * @param {Options} options
 * @returns {Extension}
 */
export function mdxExpression(options = {}) {
  const addResult = options.addResult
  const acorn = options.acorn
  // Hidden: `micromark-extension-mdx-jsx` supports expressions in tags,
  // and one of them is only “spread” elements.
  // It also has expressions that are not allowed to be empty (`<x y={}/>`).
  // Instead of duplicating code there, this are two small hidden feature here
  // to test that behavior.
  const spread = options.spread
  const forbidEmpty = options.forbidEmpty
  /** @type {AcornOptions} */
  let acornOptions

  if (acorn) {
    if (!acorn.parseExpressionAt) {
      throw new Error(
        'Expected a proper `acorn` instance passed in as `options.acorn`'
      )
    }

    /** @type {AcornOptions} */
    acornOptions = Object.assign(
      /** @type {AcornOptions} */
      {ecmaVersion: 2020, sourceType: 'module'},
      /** @type {AcornOptions} */
      options.acornOptions
    )
  } else if (options.acornOptions || options.addResult) {
    throw new Error('Expected an `acorn` instance passed in as `options.acorn`')
  }

  return {
    flow: {
      [codes.leftCurlyBrace]: {tokenize: tokenizeFlowExpression, concrete: true}
    },
    text: {[codes.leftCurlyBrace]: {tokenize: tokenizeTextExpression}}
  }

  /** @type {Tokenizer} */
  function tokenizeFlowExpression(effects, ok, nok) {
    const self = this

    return start

    /** @type {State} */
    function start(code) {
      assert(code === codes.leftCurlyBrace, 'expected `{`')
      return factoryExpression.call(
        self,
        effects,
        factorySpace(effects, after, types.whitespace),
        'mdxFlowExpression',
        'mdxFlowExpressionMarker',
        'mdxFlowExpressionChunk',
        acorn,
        acornOptions,
        addResult,
        spread,
        forbidEmpty
      )(code)
    }

    /** @type {State} */
    function after(code) {
      return code === codes.eof || markdownLineEnding(code)
        ? ok(code)
        : nok(code)
    }
  }

  /** @type {Tokenizer} */
  function tokenizeTextExpression(effects, ok) {
    const self = this

    return start

    /** @type {State} */
    function start(code) {
      assert(code === codes.leftCurlyBrace, 'expected `{`')
      return factoryExpression.call(
        self,
        effects,
        ok,
        'mdxTextExpression',
        'mdxTextExpressionMarker',
        'mdxTextExpressionChunk',
        acorn,
        acornOptions,
        addResult,
        spread,
        forbidEmpty
      )(code)
    }
  }
}
