const isFunction = (target) => typeof target === 'function'
const isObject = (target) => typeof target === 'object'

const convertAndAttachNotNativeMethods = (original, target, originalSA, targetSA) => {
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

export const convertStream = (original, originalSA, targetSA, convertMethods = false) => {
  var target = targetSA.adapt(original, originalSA.streamSubscribe)
  return convertMethods ? convertAndAttachNotNativeMethods(
      original, target, originalSA, targetSA
  ) : target
}

export const convertObject = (obj, originalSA, targetSA, convertMethods) => {
  let converted = {}
  for (let key in obj) {
    let property = obj[key]
      converted[key] = _convert(obj[key], originalSA, targetSA, convertMethods)
  }
  return converted
}

export const convertDataflow = (originalDataflow, originalSA, targetSA) => {
  return (...args) => {
    let originalArgs = args.map(arg =>
      _convert(arg, targetSA, originalSA, true)
    )
    let sinks = originalDataflow(...originalArgs)
    return _convert(sinks, originalSA, targetSA)
  }
}

const _convert = (...args) => {
  let [original, originalSA] = args
  if (isFunction(original)){
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

export const convert = (original, originalSA, targetSA) => {
  if (!originalSA || !isFunction(originalSA.adapt)){
    throw new Error(`You should pass original stream adapter as second argument`)
  }
  if (!targetSA || !isFunction(targetSA.adapt)){
    throw new Error(`You should pass target stream adapter as third argument`)
  }
  return _convert(original, originalSA, targetSA)
}

export default convert
