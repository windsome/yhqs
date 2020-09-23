import _debug from 'debug';
const debug = _debug('yh:qs:key');
import memoize from 'lodash/memoize';
import stringify from 'json-stable-stringify';

// Object.defineProperty(RegExp.prototype, "toJSON", {
//   value: RegExp.prototype.toString
// });

function replacer(key, value) {
  if (value instanceof RegExp)
    return ("__REGEXP " + value.toString());
  else
    return value;
}

function reviver(key, value) {
  if (value.toString().indexOf("__REGEXP ") == 0) {
    var m = value.split("__REGEXP ")[1].match(/\/(.*)\/(.*)?/);
    return new RegExp(m[1], m[2] || "");
  } else
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
export function _key(query = null, prefix='q_') {
  /**
   * 查询关键参数: where查询条件, sort排序, populate扩展字段, limit每页条数, regex是否支持正则
   * 分页关键参数: pagination分页额外排序字段,后台从sort解析得到, page页
   */
  let { _pagination, _limit, _sort, _select, _page, _populates, ...where } =
    query || {};

  let args = { ...where };
  if (_sort) args = { ...args, _sort };
  if (_select) args = { ...args, _select };
  if (_populates) args = { ...args, _populates };
  if (_limit) args = { ...args, _limit };
  //注意key中不包含分页数据.
  // return 'q_' + stringify(args, stableSort);
  return prefix + stringify(args, {cmp: stableSort, replacer });
}

/**
 * 将json字符串解析成json,处理了RegExp
 * @param {string} str 带前缀的序列化的json字符串
 * @param {string} prefix 前缀,默认为'q_'
 */
export function _parseKey(str, prefix='q_') {
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
export const _memkey = memoize(_key);

/**
 * 这是缓存版本.
 * 将json字符串解析成json,处理了RegExp
 * @param {string} str 带前缀的序列化的json字符串
 * @param {string} prefix 前缀,默认为'q_'
 */
export const _memParseKey = memoize(_parseKey);

// export default parseQueryString;
export default _memkey;
