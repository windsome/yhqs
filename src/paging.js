import _debug from 'debug';
const debug = _debug('yhqs:paging');
import type from './type';

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
export function genNextPagination(item, sort) {
  if (!item) return null;
  if (!sort) return null;
  let pagination = {};
  let props = Object.getOwnPropertyNames(sort);
  for (let i = 0; i < props.length; i++) {
    let name = props[i];
    let ascdesc = (sort[name] && parseInt(sort[name])) || -1;
    let subnames = name.split('.');
    let subitem = item;
    for (let j = 0; j < subnames.length; j++) {
      let subname = subnames[j].trim();
      subitem = subitem && subitem[subname];
    }
    let typesubitem = type(subitem);
    if (typesubitem === 'object' || typesubitem === 'array') {
      debug(
        'warning!数组/对象无法排序,type(name=' + name + ')=' + typesubitem,
        subitem
      );
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

export default genNextPagination;