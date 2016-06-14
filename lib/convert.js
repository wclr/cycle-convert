'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var isFunction = function isFunction(target) {
  return typeof target === 'function';
};
var isObject = function isObject(target) {
  return (typeof target === 'undefined' ? 'undefined' : _typeof(target)) === 'object' && !Array.isArray(target);
};
var isPlainObject = function isPlainObject(target) {
  return target && target.constructor === Object;
};

var _traverse = function _traverse(traverseTarget, originalSA, targetSA, options) {
  if (traverseTarget && originalSA.isValidStream(traverseTarget)) {
    return traverseAndConvertStream(traverseTarget, originalSA, targetSA, options);
  }
  if (isObject(traverseTarget)) {
    for (var key in traverseTarget) {
      var traversed = _traverse(traverseTarget[key], originalSA, targetSA, options);
      if (traversed && targetSA.isValidStream(traversed)) {
        traverseTarget[key] = traversed;
      }
    }
  }
  return traverseTarget;
};

var traverseAndConvertStream = function traverseAndConvertStream(original, originalSA, targetSA, options) {
  var traversedOriginal = originalSA.adapt({}, function (_, observer) {
    originalSA.streamSubscribe(original, {
      next: function next(value) {
        observer.next(_traverse(value, originalSA, targetSA, options));
      },
      error: observer.error.bind(observer),
      complete: observer.complete.bind(observer)
    });
  });
  return convertStream(traversedOriginal, originalSA, targetSA, options);
};

var convertAndAttachAdHocMethods = function convertAndAttachAdHocMethods(original, target, originalSA, targetSA) {
  var prototype = original.constructor.prototype;
  Object.keys(original).forEach(function (key) {
    if (!prototype.hasOwnProperty(key) && isFunction(original[key])) {
      target[key] = convertDataflow(original[key].bind(original), originalSA, targetSA).bind(target);
    }
  });
  return target;
};

var convertStream = exports.convertStream = function convertStream(original, originalSA, targetSA) {
  var options = arguments.length <= 3 || arguments[3] === undefined ? {} : arguments[3];

  var target = targetSA.adapt(original, originalSA.streamSubscribe);
  return options.convertMethods ? convertAndAttachAdHocMethods(original, target, originalSA, targetSA) : target;
};

var convertObject = exports.convertObject = function convertObject(obj, originalSA, targetSA) {
  var options = arguments.length <= 3 || arguments[3] === undefined ? {} : arguments[3];

  var converted = {};
  for (var key in obj) {
    var property = obj[key];
    if (key[0] === '_') {
      // do not convert private
      converted[key] = property;
    } else if (property && options.traverse && options.traverse.indexOf(key) >= 0 && originalSA.isValidStream(property)) {
      converted[key] = traverseAndConvertStream(property, originalSA, targetSA, options);
    } else if (isFunction(property)) {
      converted[key] = convertDataflow(property.bind(converted), originalSA, targetSA, options);
    } else {
      converted[key] = _convert(property, originalSA, targetSA, options);
    }
  }
  return converted;
};

var convertDataflow = exports.convertDataflow = function convertDataflow(originalDataflow, originalSA, targetSA) {
  var options = arguments.length <= 3 || arguments[3] === undefined ? {} : arguments[3];

  return function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var originalArgs = args.map(function (arg) {
      return _convert(arg, targetSA, originalSA, _extends({
        convertMethods: true
      }, options, {
        traverse: options.traverseSources && options.traverse
      }));
    });
    var sinks = originalDataflow.apply(undefined, _toConsumableArray(originalArgs));
    if (options.traverse === true && sinks && originalSA.isValidStream(sinks)) {
      return traverseAndConvertStream(sinks, originalSA, targetSA, options);
    }
    return _convert(sinks, originalSA, targetSA, options);
  };
};

var _convert = function _convert() {
  for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
    args[_key2] = arguments[_key2];
  }

  var original = args[0];
  var originalSA = args[1];

  if (isFunction(original)) {
    return convertDataflow.apply(undefined, args);
  }
  if (original && originalSA.isValidStream(original)) {
    return convertStream.apply(undefined, args);
  }
  if (isObject(original)) {
    return convertObject.apply(undefined, args);
  }
  return original;
};

var convert = exports.convert = function convert(original, originalSA, targetSA) {
  var options = arguments.length <= 3 || arguments[3] === undefined ? {} : arguments[3];

  if (!originalSA || !isFunction(originalSA.adapt)) {
    throw new Error('You should pass original stream adapter as second argument');
  }
  if (!targetSA || !isFunction(targetSA.adapt)) {
    throw new Error('You should pass target stream adapter as third argument');
  }
  return _convert(original, originalSA, targetSA, options);
};

exports.default = convert;