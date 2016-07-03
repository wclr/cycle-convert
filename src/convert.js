const isFunction = (target) => typeof target === 'function'
const isObject = (target) => typeof target === 'object' && !Array.isArray(target)
const isPlainObject = (target) => target && target.constructor === Object

const _traverse = (traverseTarget, originalSA, targetSA, options) => {
  if (traverseTarget && originalSA.isValidStream(traverseTarget)){
    return traverseAndConvertStream(traverseTarget, originalSA, targetSA, options)
  }
  if (isObject(traverseTarget)){
    for (let key in traverseTarget) {
      let traversed = _traverse(traverseTarget[key], originalSA, targetSA, options)
      if (traversed && targetSA.isValidStream(traversed)){
        traverseTarget[key] = traversed
      }
    }
  }
  return traverseTarget
}

export const traverseAndConvertStream = (original, originalSA, targetSA, options) => {
  let traversedOriginal = originalSA.adapt({}, (_, observer) => {
    originalSA.streamSubscribe(original, {
      next: (value) => {
        observer.next(_traverse(value, originalSA, targetSA, options))
      },
      error: ::observer.error,
      complete: ::observer.complete
    })
  })
  return convertStream(traversedOriginal, originalSA, targetSA, options)
}

export const convertAndAttachAdHocMethods = (original, target, originalSA, targetSA) => {
  let prototype = original.constructor.prototype
  Object.keys(original).forEach(key => {
    if (!prototype.hasOwnProperty(key)
      && isFunction(original[key])) {
      target[key] = convertDataflow(
        original[key].bind(original), originalSA, targetSA
      ).bind(target)
    }
  })
  return target
}

export const convertStream = (original, originalSA, targetSA, options = {}) => {
  let target = targetSA.adapt(original, originalSA.streamSubscribe)
  return options.convertMethods ? convertAndAttachAdHocMethods(
      original, target, originalSA, targetSA
  ) : target
}

export const convertObject = (obj, originalSA, targetSA, options = {}) => {
  let converted = {}
  for (let key in obj) {
    let property = obj[key]
    if (key[0] === '_') { // do not convert private
      converted[key] = property
    } else if (property && options.traverse
      && options.traverse.indexOf(key) >= 0
      && originalSA.isValidStream(property)
    ){
      converted[key] = traverseAndConvertStream(property, originalSA, targetSA, options)
    } else if (isFunction(property)) {
      converted[key] = convertDataflow(property.bind(converted), originalSA, targetSA, options)
    } else {
      converted[key] = _convert(property, originalSA, targetSA, options)
    }
  }
  return converted
}

export const convertDataflow = (originalDataflow, originalSA, targetSA, options = {}) => {
  return (...args) => {
    let originalArgs = args.map(arg =>
      _convert(arg, targetSA, originalSA, {
        convertMethods: true,
        ...options,
        traverse: options.traverseSources && options.traverse
      })
    )
    let sinks = originalDataflow(...originalArgs)
    if (options.traverse === true && sinks && originalSA.isValidStream(sinks)){
      return traverseAndConvertStream(sinks, originalSA, targetSA, options)
    }
    return _convert(sinks, originalSA, targetSA, options)
  }
}

const _convert = (...args) => {
  let [original, originalSA] = args
  if (isFunction(original)) {
    return convertDataflow(...args)
  }
  if (original && originalSA.isValidStream(original)){
    return convertStream(...args)
  }
  if (isObject(original)) {
    return convertObject(...args)
  }
  return original
}

export const convert = (original, originalSA, targetSA, options = {}) => {
  if (!originalSA || !isFunction(originalSA.adapt)) {
    throw new Error(`You should pass original stream adapter as second argument`)
  }
  if (!targetSA || !isFunction(targetSA.adapt)) {
    throw new Error(`You should pass target stream adapter as third argument`)
  }
  return _convert(original, originalSA, targetSA, options)
}

export default convert
