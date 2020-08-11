// DEST=dev DEBUG="app:*" node ./test_qs.js
require('babel-register');
let _key = require('../src/key').default;
let qs = require('../src/qs');
let genNextPagination = require('../src/paging').default;
let parseQueryString = qs.default;
let genQs = qs.memGenerate;

function testParse(arr) {
  for (let i = 0; i < arr.length; i++) {
    let args = arr[i];
    let key = _key(args);
    let strArgs = genQs(args);
    let strArgsDecoded = decodeURIComponent(strArgs);
    let parsedArgs = parseQueryString(strArgs);
    console.log({
      i,
      args,
      key,
      // strArgs,
      strArgsDecoded,
      parsedArgs: JSON.stringify(parsedArgs)
    });
    // console.log({ i, args, strArgs, strArgsDecoded, parsedArgs });
    console.log('');
  }
}

/**
 * 测试
 */
Promise.resolve(1)
  .then(ret => {
    let argsArr = [
      // 简单条件
      { company: '5b210fea77c0a27c84c0ea23' },
      { vehicle: '京A12345' },
      { status: 0 },
      { user: '5b210fea77c0a27c84c0ea23' },
      // 组合与条件
      { vehicle: '京A12345', status: 0 },
      // 组合或条件
      { $or: [{ vehicle: '京A12345' }, { status: 0 }] },
      // 组合与&或条件
      {
        company: '5b210fea77c0a27c84c0ea23',
        $or: [{ vehicle: '京A12345' }, { status: 0 }]
      },
      // 正则表达式条件(包含京A的车牌号),注意,如果使用正则,则需要字段名在regexProps中
      { _regex: 1, vehicle: '$regex-京A', status: 0 },
      // 时间范围条件 datetime
      {
        createdAt: { $gt: '2018-06-20T10:10:10Z', $lt: '2018-06-27T10:10:10Z' }
      },
      // 时间范围条件 毫秒时间戳
      { createdAt: { $gt: 1544631840000, $lt: 1544631940000 } },
      // 排序条件
      { _sort: { 'info.method': '-1', createdAt: '-1' } },
      // 特殊字段pageSize,每页条数
      { _limit: 80 },
      // 大合成条件
      {
        _regex: 1,
        _limit: 70,
        company: '5b210fea77c0a27c84c0ea23',
        $or: [{ vehicle: '$regex-京A' }, { status: 0 }],
        _sort: { 'info.method': '-1', createdAt: '-1' },
        _pagination: { createdAt: { $lt: 1544631840000 } }
      },
      // 测试实例:
      {
        ancestor: '5ba27cc3a70db45dd108b545',
        vtime: 0,
        _limit: 3,
        _sort: { createdAt: '-1' },
        _pagination: { createdAt: { $lt: 1544631840000 } }
      },
      // 分页,用pagination/_pagination和page/_page共同决定
      { _pagination: { createdAt: { $lt: 1544631840000 } } },
      {
        // 前端H5分页, pagination/_pagination
        _pagination: {
          createdAt: {
            $lt: '2018-12-18T14:38:03.291Z'
          }
        }
      },
      // 分页带每页条数
      { _limit: 80, _pagination: { createdAt: { $lt: 1544631840000 } } },
      {
        // 后台页面分页, page/_page
        _page: 1,
        ancestor: '5ba27cc3a70db45dd108b545'
      },
      {
        // 基本不共同使用, pagination/_pagination和page/_page共同决定分页
        _page: 1,
        ancestor: '5ba27cc3a70db45dd108b545',
        _pagination: {
          createdAt: {
            $lt: '2018-12-18T14:38:03.291Z'
          }
        }
      },
      // 扩展对象populates/_populates
      {
        _populates: [
          {
            path: 'author',
            model: ['user'],
            select: '-password'
          }
        ]
      }
    ];
    testParse(argsArr);
    return true;
  })
  .then(ret => {
    let arrVideosPage = [
      // page翻页方式查询视频列表
      {
        // 第一次开始查询视频列表
        type: '视频',
        _limit: 10,
        _page: 0
      },
      {
        // 刷新数据列表
        type: '视频',
        _limit: 10,
        _page: -1
      },
      {
        // 查第1页的数据
        type: '视频',
        _limit: 10,
        _page: 1
      }
    ];
    testParse(arrVideosPage);
    return true;
  })
  .then(ret => {
    let arrVideosPagination = [
      // page翻页方式查询视频列表
      {
        // 第一次开始查询视频列表
        type: '视频',
        _limit: 10,
        _sort: { createdAt: -1, updatedAt: -1 },
        _pagination: {},
        _page: 0
      },
      {
        // 刷新数据列表
        type: '视频',
        _limit: 10,
        _sort: { createdAt: -1, updatedAt: -1 },
        _pagination: {},
        _page: -1
      },
      {
        // 查第1页的数据
        type: '视频',
        _limit: 10,
        _sort: { createdAt: -1, updatedAt: -1 },
        _pagination: {
          createdAt: {
            $lt: '2018-12-18T14:38:03.291Z'
          }
        },
        _page: 1
      }
    ];
    testParse(arrVideosPagination);
    return true;
  })
  .then(ret => {
    console.log('测试获得分页数据');
    let items = [
      {
        _id: '5b986eb9b4f64c0005f8d659',
        city: 'beijing',
        cityname: '北京',
        desc: {
          count: 10,
          size: 100
        },
        createdAt: '2018-09-12T01:41:13.645Z',
        updatedAt: '2018-09-12T01:41:13.645Z'
      }
    ];
    let sorts = [
      { createdAt: -1 },
      { updatedAt: -1 },
      { 'desc.count': -1 },
      { 'desc.count': -1, createdAt: 1 }
    ];

    for (let i = 0; i < sorts.length; i++) {
      let sort = sorts[i];
      let pagination = genNextPagination(items[0], sort);
      console.log({ i, sort, pagination });
      console.log('');
    }
  })
  .then(ret => {
    console.log('测试结束');
  });
