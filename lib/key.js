'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports._memParseKey = exports._memkey = undefined;

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _objectWithoutProperties2 = require('babel-runtime/helpers/objectWithoutProperties');

var _objectWithoutProperties3 = _interopRequireDefault(_objectWithoutProperties2);

exports._key = _key;
exports._parseKey = _parseKey;

var _debug2 = require('debug');

var _debug3 = _interopRequireDefault(_debug2);

var _memoize = require('lodash/memoize');

var _memoize2 = _interopRequireDefault(_memoize);

var _jsonStableStringify = require('json-stable-stringify');

var _jsonStableStringify2 = _interopRequireDefault(_jsonStableStringify);

var _type = require('./type');

var _type2 = _interopRequireDefault(_type);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug3.default)('yh:qs:key');


// Object.defineProperty(RegExp.prototype, "toJSON", {
//   value: RegExp.prototype.toString
// });

function replacer(key, value) {
  if (value instanceof RegExp) return "__REGEXP " + value.toString();else return value;
}

function reviver(key, value) {
  if ((0, _type2.default)(value) === 'string') {
    if (value.toString().indexOf("__REGEXP ") == 0) {
      var m = value.split("__REGEXP ")[1].match(/\/(.*)\/(.*)?/);
      return new RegExp(m[1], m[2] || "");
    }
  }
  return value;
}
function stableSort(a, b) {
  return a.key.localeCompare(b.key);
  // return a.key < b.key ? -1 : 1;
}
/**
 * 将json查询条件转化成字符串key,用来作为redux中retrieve下的key
 * 一般用在前端.
 * @param {json} query
 * @returns {string} 字符串key值
 */
function _key() {
  var query = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
  var prefix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'q_';

  /**
   * 查询关键参数: where查询条件, sort排序, populate扩展字段, limit每页条数, regex是否支持正则
   * 分页关键参数: pagination分页额外排序字段,后台从sort解析得到, page页
   */
  var _ref = query || {},
      _pagination = _ref._pagination,
      _limit = _ref._limit,
      _sort = _ref._sort,
      _select = _ref._select,
      _page = _ref._page,
      _populates = _ref._populates,
      where = (0, _objectWithoutProperties3.default)(_ref, ['_pagination', '_limit', '_sort', '_select', '_page', '_populates']);

  var args = (0, _extends3.default)({}, where);
  if (_sort) args = (0, _extends3.default)({}, args, { _sort: _sort });
  if (_select) args = (0, _extends3.default)({}, args, { _select: _select });
  if (_populates) args = (0, _extends3.default)({}, args, { _populates: _populates });
  if (_limit) args = (0, _extends3.default)({}, args, { _limit: _limit });
  //注意key中不包含分页数据.
  // return 'q_' + stringify(args, stableSort);
  return prefix + (0, _jsonStableStringify2.default)(args, { cmp: stableSort, replacer: replacer });
}

/**
 * 将json字符串解析成json,处理了RegExp
 * @param {string} str 带前缀的序列化的json字符串
 * @param {string} prefix 前缀,默认为'q_'
 */
function _parseKey(str) {
  var prefix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'q_';

  if (!str) return {};
  if (!str.startsWith(prefix)) return {};
  str = str.substr(prefix.length);
  return JSON.parse(str, reviver);
}

/**
 * 这是缓存版本.
 * 将json查询条件转化成字符串key,用来作为redux中retrieve下的key
 * @param {json} query
 * @returns {string} 字符串key值
 */
var _memkey = exports._memkey = (0, _memoize2.default)(_key);

/**
 * 这是缓存版本.
 * 将json字符串解析成json,处理了RegExp
 * @param {string} str 带前缀的序列化的json字符串
 * @param {string} prefix 前缀,默认为'q_'
 */
var _memParseKey = exports._memParseKey = (0, _memoize2.default)(_parseKey);

// export default parseQueryString;
exports.default = _memkey;