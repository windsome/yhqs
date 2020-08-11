'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getOwnPropertyNames = require('babel-runtime/core-js/object/get-own-property-names');

var _getOwnPropertyNames2 = _interopRequireDefault(_getOwnPropertyNames);

exports.genNextPagination = genNextPagination;

var _debug2 = require('debug');

var _debug3 = _interopRequireDefault(_debug2);

var _type = require('./type');

var _type2 = _interopRequireDefault(_type);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug3.default)('yh:qs:paging');


/**
 * @api {NONE} /none 获取分页排序参数
 * @apiDescription 内部函数,用来供下次查询使用,目前支持两种类型排序参数
 * 1. 简单类型,表的一级字段,如{createdAt: -1, updatedAt:1}<br/>
 * 2. 以.分割的多级对象字段,如{'stat.count:-1, 'desc.age':1}<br/>
 * 3. 两种类型可以混合使用<br/>
 * @apiName genPagination
 * @apiGroup AStandard
 * @apiVersion 1.0.0
 * @apiParam {String} item 一次查询获得的记录
 * @apiParam {String} sort 排序条件
 * @apiSuccess {json} pagination对象
 */
function genNextPagination(item, sort) {
  if (!item) return null;
  if (!sort) return null;
  var pagination = {};
  var props = (0, _getOwnPropertyNames2.default)(sort);
  for (var i = 0; i < props.length; i++) {
    var name = props[i];
    var ascdesc = sort[name] && parseInt(sort[name]) || -1;
    var subnames = name.split('.');
    var subitem = item;
    for (var j = 0; j < subnames.length; j++) {
      var subname = subnames[j].trim();
      subitem = subitem && subitem[subname];
    }
    var typesubitem = (0, _type2.default)(subitem);
    if (typesubitem === 'object' || typesubitem === 'array') {
      debug('warning!数组/对象无法排序,type(name=' + name + ')=' + typesubitem, subitem);
      continue;
    }
    if (ascdesc < 0) {
      pagination[name] = { $lt: subitem };
    } else {
      pagination[name] = { $gt: subitem };
    }
  }
  return pagination;
}

exports.default = genNextPagination;