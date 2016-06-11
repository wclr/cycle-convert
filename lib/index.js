'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _convert = require('./convert');

Object.keys(_convert).forEach(function (key) {
  if (key === "default") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _convert[key];
    }
  });
});

var _convert2 = _interopRequireDefault(_convert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _convert2.default;