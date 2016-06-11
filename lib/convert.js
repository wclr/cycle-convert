'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var isFunction = function isFunction(target) {
  return typeof target === 'function';
};
var isObject = function isObject(target) {
  return (typeof target === 'undefined' ? 'undefined' : _typeof(target)) === 'object';
};

var convertAndAttachNotNativeMethods = function convertAndAttachNotNativeMethods(original, target, originalSA, targetSA) {
  var prototype = original.constructor.prototype;
  Object.keys(original).forEach(function (key) {
    if (!prototype.hasOwnProperty(key) && isFunction(original[key])) {
      target[key] = convertDataflow(original[key].bind(original), originalSA, targetSA).bind(target);
    }
  });
  return target;
};

var convertStream = exports.convertStream = function convertStream(original, originalSA, targetSA) {
  var convertMethods = arguments.length <= 3 || arguments[3] === undefined ? false : arguments[3];

  var target = targetSA.adapt(original, originalSA.streamSubscribe);
  return convertMethods ? convertAndAttachNotNativeMethods(original, target, originalSA, targetSA) : target;
};

var convertObject = exports.convertObject = function convertObject(obj, originalSA, targetSA, convertMethods) {
  var converted = {};
  for (var key in obj) {
    var property = obj[key];
    converted[key] = _convert(obj[key], originalSA, targetSA, convertMethods);
  }
  return converted;
};

var convertDataflow = exports.convertDataflow = function convertDataflow(originalDataflow, originalSA, targetSA) {
  return function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var originalArgs = args.map(function (arg) {
      return _convert(arg, targetSA, originalSA, true);
    });
    var sinks = originalDataflow.apply(undefined, _toConsumableArray(originalArgs));
    return _convert(sinks, originalSA, targetSA);
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
  if (!originalSA || !isFunction(originalSA.adapt)) {
    throw new Error('You should pass original stream adapter as second argument');
  }
  if (!targetSA || !isFunction(targetSA.adapt)) {
    throw new Error('You should pass target stream adapter as third argument');
  }
  return _convert(original, originalSA, targetSA);
};

exports.default = convert;