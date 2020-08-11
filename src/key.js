import _debug from 'debug';
const debug = _debug('yhqs:key');
import memoize from 'lodash/memoize';
import stringify from 'json-stable-stringify';

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
export function _key(query = null) {
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
  return 'q_' + stringify(args, stableSort);
}

/**
 * 这是缓存版本.
 * 将json查询条件转化成字符串key,用来作为redux中retrieve下的key
 * 一般用在前端.
 * @param {json} query
 * @returns {string} 字符串key值
 */
export const _memkey = memoize(_key);

// export default parseQueryString;
export default _memkey;
