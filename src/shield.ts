import * as hash from 'object-hash'
import { middleware, IMiddlewareGenerator } from 'graphql-middleware'
import { ValidationError, validateRuleTree } from './validation'
import {
  IRules,
  IOptions,
  IOptionsConstructor,
  ShieldRule,
  IHashFunction,
} from './types'
import { generateMiddlewareGeneratorFromRuleTree } from './generator'
import { allow } from './constructors'
import { withDefault } from './utils'

/**
 *
 * @param options
 *
 * Makes sure all of defined rules are in accord with the options
 * shield can process.
 *
 */
function normalizeOptions(options: IOptionsConstructor): IOptions {
  if (typeof options.fallbackError === 'string') {
    options.fallbackError = new Error(options.fallbackError)
  }

  return {
    debug: options.debug !== undefined ? options.debug : false,
    allowExternalErrors: withDefault(false)(options.allowExternalErrors),
    fallbackRule: withDefault<ShieldRule>(allow)(options.fallbackRule),
    fallbackError: withDefault(new Error('Not Authorised!'))(
      options.fallbackError,
    ),
    hashFunction: withDefault<IHashFunction>(hash)(options.hashFunction),
  }
}

/**
 *
 * @param ruleTree
 * @param options
 *
 * Validates rules and generates middleware from defined rule tree.
 *
 */
export function shield<TSource = any, TContext = any, TArgs = any>(
  ruleTree: IRules,
  options: IOptionsConstructor = {},
): IMiddlewareGenerator<TSource, TContext, TArgs> {
  const normalizedOptions = normalizeOptions(options)
  const ruleTreeValidity = validateRuleTree(ruleTree)

  if (ruleTreeValidity.status === 'ok') {
    const generatorFunction = generateMiddlewareGeneratorFromRuleTree<
      TSource,
      TContext,
      TArgs
    >(ruleTree, normalizedOptions)

    return middleware(generatorFunction)
  } else {
    throw new ValidationError(ruleTreeValidity.message)
  }
}
