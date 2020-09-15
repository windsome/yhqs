'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.memGenerate = exports.memParse = undefined;

var _getOwnPropertyNames = require('babel-runtime/core-js/object/get-own-property-names');

var _getOwnPropertyNames2 = _interopRequireDefault(_getOwnPropertyNames);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _objectWithoutProperties2 = require('babel-runtime/helpers/objectWithoutProperties');

var _objectWithoutProperties3 = _interopRequireDefault(_objectWithoutProperties2);

exports.parse = parse;
exports.generate = generate;

var _debug2 = require('debug');

var _debug3 = _interopRequireDefault(_debug2);

var _qs = require('qs');

var _qs2 = _interopRequireDefault(_qs);

var _type = require('./type');

var _type2 = _interopRequireDefault(_type);

var _memoize = require('lodash/memoize');

var _memoize2 = _interopRequireDefault(_memoize);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug3.default)('yh:qs:qs');


var DEF_PAGESIZE = 20;
var MAX_PAGESIZE = 100;
function alphabeticalSort(a, b) {
  return a.localeCompare(b);
}

/**
 * @api {NONE} /apis/v1/mqtt/:model?:qs 查询参数标准化
 * @apiDescription 内部函数,定义查询条件的标准，方便查询字符串转化为json查询结构</br>
 * 详见: <https://www.moesif.com/blog/technical/api-design/REST-API-Design-Filtering-Sorting-and-Pagination/>
 * 注意: 查询字符串是通过qs.stringfy()将json数据转化而成.</br>
 * 1. and组合和$or组合</br>
 *   + 原子查询条件：</br>
 *    `qs.stringify({company: '5b210fea77c0a27c84c0ea23'}):company=5b210fea77c0a27c84c0ea23`</br>
 *    `qs.stringify({vehicle:'京A12345'}):vehicle=京A12345`</br>
 *    `qs.stringify({status:0}):status=0`</br>
 *    `qs.stringify({user:'5b210fea77c0a27c84c0ea23'}):user=5b210fea77c0a27c84c0ea23`</br>
 *   + and组合查询：车牌京A开头并且status=0的设备</br>
 *    `qs.stringify({vehicle:'$regex-京A',status:0}):device?vehicle=$regex-京A&status=0`</br>
 *   + or组合查询：车牌京A开头或者status=0的设备</br>
 *    `qs.stringify({$or:[{'vehicle':/京A/i}, {'status':0}]}):device?$or[0][vehicle]=$regex-京A&$or[1][status]=0`</br>
 *   + and和or组合查询：</br>
 *    `qs.stringify({company:'5b210fea77c0a27c84c0ea23', $or:[{'vehicle':/京A/i}, {'status':0}]}):company=5b210fea77c0a27c84c0ea23&$or[0][vehicle]=$regex-京A&$or[1][status]=0`</br>
 * 2. 正则表达式内容查询，在内容前加`$regex-`</br>
 *    查所有绑定了京A车辆的设备：`device?vehicle=$regex-京A`转化为：`{'vehicle':/京A/i}`</br>
 * 3. 时间区间查询</br>
 *    时间查询：`createdAt[$gt]=2018-06-20T10:10:10Z&createdAt[$lt]=2018-06-27T10:10:10Z`转化为：`createdAt: { $gt: 17, $lt: 66 }`</br>
 * 4. 特殊字段</br>
 *    每次查询分页条数 _limit：`_limit=10` => `{ _limit:10 }`</br>
 *    排序 _sort: `_sort[info.method]=-1&_sort[createdAt]=-1` => `{_sort: { 'info.method': '-1', 'createdAt': '-1' }}`</br>
 * @apiName querystring
 * @apiGroup AStandard
 * @apiVersion 1.0.0
 * @apiContentType application/json
 * @apiParam {String} model  Mandatory 数据表名
 * @apiParam {String} qs="attr1=ATTR1&attr2=ATTR2&attr3=ATTR3"  Mandatory 查询条件
 * @apiSuccess {Number} errcode=0 result of operation, 0 when success.
 * @apiError errcode=40010 The <code>id</code> of the User was not found.
 */
function parse(qstr) {
  // args解析成json
  // let parsedArgs = {
  //   _pagination: {
  //     createdAt: { $lt: 1544629726000 }
  //   }, // 分页排序相关
  //   _page: 数字,默认0,
  //   _limit: 分页数量,默认20,
  //   _sort: 排序,默认{ createdAt: -1 },
  //   _populates: 数组,需要扩展表的字段,如[{path:"author",model:"user",select:"-password"}]
  //   ...where
  // };
  // 注意, 目前_page和_pagination不共存.优先考虑_pagination,当_pagination存在时,_page置位0.
  // let jsonArgs =
  //   (args && qs.parse(args, { allowDots: true, delimiter: /[;,&]/ })) || {};
  var jsonArgs = qstr && _qs2.default.parse(qstr, { delimiter: /[;,&]/ }) || {};
  var _sort = jsonArgs._sort,
      _select = jsonArgs._select,
      _populates = jsonArgs._populates,
      _limit = jsonArgs._limit,
      _pagination = jsonArgs._pagination,
      _page = jsonArgs._page,
      where = (0, _objectWithoutProperties3.default)(jsonArgs, ['_sort', '_select', '_populates', '_limit', '_pagination', '_page']);

  _limit = _limit && parseInt(_limit) || DEF_PAGESIZE;
  if (_limit <= 0) _limit = DEF_PAGESIZE;
  if (_limit > MAX_PAGESIZE) _limit = MAX_PAGESIZE;
  _sort = _sort || { createdAt: -1 };
  _page = _page && parseInt(_page) || 0;
  if (_page < 0) _page = 0;

  var skip = _limit * _page;

  if (_pagination) {
    // TODO: 目前不用_pagination模式,用_page模式.
    // 优先考虑_pagination,存在时skip置为0.不使用page分页
    // 一般来说,前端不会同时传page和pagination过来.
    where = (0, _extends3.default)({}, where, _pagination);
    skip = 0;
  }
  var where2 = doValueTransform(where);
  // debug('parseQueryString after doValueTransform', where, where2);
  where = where2;
  var options = {
    where: where,
    sort: _sort,
    select: _select,
    limit: _limit,
    skip: skip,
    page: _page,
    populates: _populates
  };
  // debug('parseQueryString', stringify(arguments), { args, jsonArgs, options });
  return options;
}

var memParse = exports.memParse = (0, _memoize2.default)(parse);

/**
 * 将字符串值做转换,处理$regex-/$date-/$number-/$bool-打头的字符串值.
 * 一般一级查询字段不需要做转化,只有是mix类型的字段,不知道子字段类型时才需要.
 * {'gstat.updatedAt':{'$gt':'$date-'+dateWeekBegin}}
 * {'gstat.week':{'$gt':'$int-'+0}}
 * {'gstat.week':{'$gt':'$float-'+0}}
 * @param {string} where
 */
function doValueTransform(where) {
  var typewhere = (0, _type2.default)(where);
  // debug('doValueTransform ' + typewhere, JSON.stringify(where));
  if (typewhere === 'string') {
    if (where.startsWith('$regex-')) {
      where = where.substring('$regex-'.length);
      var reg = new RegExp(where, 'i');
      return reg;
    } else if (where.startsWith('$date-')) {
      where = where.substring('$date-'.length);
      return new Date(where);
    } else if (where.startsWith('$number-')) {
      where = where.substring('$number-'.length);
      return Number(where);
    } else if (where.startsWith('$bool-')) {
      where = where.substring('$bool-'.length);
      where = where.toLowerCase();
      if (where == 'false') return false;else return true;
    } else {
      return where;
    }
  } else if (typewhere === 'object') {
    var dest = {};
    var props = (0, _getOwnPropertyNames2.default)(where);
    for (var i = 0; i < props.length; i++) {
      var name = props[i];
      var value = where[name];
      dest[name] = doValueTransform(value);
    }
    return dest;
  } else if (typewhere === 'array') {
    var _dest = [];
    for (var _i = 0; _i < where.length; _i++) {
      _dest.push(doValueTransform(where[_i]));
    }
    return _dest;
  } else {
    return where;
  }
}

/**
 * 将字符串值做转换,将regex/date/number/bool转换成$regex-/$date-/$number-/$bool-打头的字符串值.
 * 一般一级查询字段不需要做转化,只有是mix类型的字段,不知道子字段类型时才需要.
 * {'gstat.updatedAt':{'$gt':'$date-'+dateWeekBegin}}
 * {'gstat.week':{'$gt':'$int-'+0}}
 * {'gstat.week':{'$gt':'$float-'+0}}
 * @param {string} where
 */
function doValueTransformReverse(where) {
  var typewhere = (0, _type2.default)(where);
  // debug('doValueTransformReverse ' + typewhere, JSON.stringify(where));
  if (typewhere === 'regexp') {
    return '$regex-' + where.toString();
  } else if (typewhere === 'date') {
    return '$date-' + where.toString();
  } else if (typewhere === 'number') {
    return '$number-' + where.toString();
  } else if (typewhere === 'boolean') {
    return '$bool-' + where.toString();
  } else if (typewhere === 'object') {
    var dest = {};
    var props = (0, _getOwnPropertyNames2.default)(where);
    for (var i = 0; i < props.length; i++) {
      var name = props[i];
      var value = where[name];
      dest[name] = doValueTransformReverse(value);
    }
    return dest;
  } else if (typewhere === 'array') {
    var _dest2 = [];
    for (var _i2 = 0; _i2 < where.length; _i2++) {
      _dest2.push(doValueTransformReverse(where[_i2]));
    }
    return _dest2;
  } else if (typewhere === 'string') {
    return where;
  } else {
    debug('warning! not support:' + typewhere, where);
    return where;
  }
}

function generate() {
  var query = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

  /**
   * 查询关键参数: where查询条件, sort排序, populate扩展字段, limit每页条数, regex是否支持正则
   * 分页关键参数: pagination分页额外排序字段,后台从sort解析得到, page页
   * 用page分页: opts = {sort: null, populate: null, limit: null, page: -1}
   * 用pagination分页: opts = {sort: null, populate: null, limit: null, pagination: null}
   */
  var _ref = query || {},
      _sort = _ref._sort,
      _select = _ref._select,
      _populates = _ref._populates,
      _limit = _ref._limit,
      _pagination = _ref._pagination,
      _page = _ref._page,
      where = (0, _objectWithoutProperties3.default)(_ref, ['_sort', '_select', '_populates', '_limit', '_pagination', '_page']);

  where = doValueTransformReverse(where);

  var args = (0, _extends3.default)({}, where);
  if (_sort) args = (0, _extends3.default)({}, args, { _sort: _sort });
  if (_select) args = (0, _extends3.default)({}, args, { _select: _select });
  if (_populates) args = (0, _extends3.default)({}, args, { _populates: _populates });
  if (_limit) args = (0, _extends3.default)({}, args, { _limit: _limit });

  var bPage = query.hasOwnProperty('_page');
  var bPagination = query.hasOwnProperty('_pagination');
  if (bPagination) args = (0, _extends3.default)({}, args, { _pagination: _pagination });else if (bPage) args = (0, _extends3.default)({}, args, { _page: _page });

  var str = _qs2.default.stringify(args, { sort: alphabeticalSort });
  return str;
}

var memGenerate = exports.memGenerate = (0, _memoize2.default)(generate);

exports.default = memParse;