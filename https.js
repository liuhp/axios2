/* eslint-disable no-underscore-dangle */
import axios from 'axios';
// import Mockjs from 'mockjs';
// import jwt from 'jsonwebtoken';
import qs from 'qs';
// import fingerprints from 'fingerprints';
// import { logout } from './util';

// 默认配置
const defaultOptions = {
  method: 'post', // 请求 type  get post delete header put
  withCredentials: true, // 设置该属性可以把 cookie 信息传到后台
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json; charset=utf-8',
  },
};

export function callApi({
  url,
  data = {},
  option = {},
  prefix = 'api', // api也可以使用APP_NAME
}) {
  if (!url) {
    const error = new Error('请传入 url');
    error.errorCode = 0;
    return Promise.reject(error);
  }

  const options = { ...defaultOptions, ...option };
  const { method } = options;

  if (method !== 'get' && method !== 'head') {
    if (data instanceof FormData) {
      options.data = data;
      options.headers = {
        'x-requested-with': 'XMLHttpRequest',
        'cache-control': 'no-cache',
      };
    } else if (options.headers['Content-Type'] === 'application/x-www-form-urlencoded') {
      options.data = qs.stringify(data);
    } else {
      Object.keys(data).forEach((item) => {
        if (data[item] === null || data[item] === undefined || data[item] === '') {
          delete data[item];
        }
      });
      options.data = JSON.stringify(data);
    }
  }

  // 添加设备指纹
//   axios.interceptors.request.use(async (config) => {
//     if (!window.__FP__) {
//       // eslint-disable-next-line no-underscore-dangle
//       window.__FP__ = await new Promise((resolve) => {
//         fingerprints.getNew((info, id) => resolve(id));
//       });
//     }
//     if (window.__FP__) {
//       config.headers['Auth-Fp'] = jwt.sign({
//       // 失效时间：3分钟（单位：秒）
//         exp: Math.floor(Date.now() / 1000) + (60 * 3),
//         // 发签时间：请求发出时间（单位：秒），往前减3分钟防止客户端比服务器端时间快，导致验签不通过问题
//         iat: Math.floor(Date.now() / 1000) - (60 * 3),
//         // 其它参数：主要用于每次请求时加密串保持不一样（单位：豪秒）
//         oth: Date.now(),
//       }, window.__FP__); // fingerprint.id 设备指纹（浏览器唯一标识）
//     }
//     return config;
//   });

  return axios({
    url: fullUrl,
    ...options,
  })
    .then((res) => {
      const { data: resData } = res || {};
      // uwc接口、指标、监控接口以及uas获取注册子应用接口 特殊处理
      if (fullUrl.startsWith('/uwc') || fullUrl.match('getIndicator') || fullUrl.match('getMonitor')) {
        return Promise.resolve(resData);
      }
      const { code, data: datas } = resData;
      if (code === '0') {
        return Promise.resolve(datas);
      }
      return Promise.reject(res);
      // return Promise.resolve(resData);

      // return Promise.reject(new Error(msg || '接口错误！'));
      // const error = new Error(resData.msg || '获取数据出错');
      // error.errorCode = resData.code;
      // Message.error(error.message);
      // return Promise.reject(error);
    })
    .catch((error) => {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const { status: responseStatus, config = {} } = error.response;
        if (responseStatus === 403) {
          const { data: responseData } = error.response;
          let loginUrl = '';
          if (responseData && responseData.code === '403') {
            loginUrl = `${responseData.login_url.split('?')[0]}?return_url=`;
          }
          if (loginUrl) {
            window.BASE_UAS_LOGIN_URL = loginUrl;
          }
          // 是否处理错误信息
          if ((config && config.params && config.params.ignoreError)
            || (data && data.ignoreError)) {
            return Promise.reject(error);
          }
          logout();
          // window.location.href =
          // `${loginUrl || window.BASE_UAS_LOGIN_URL}${window.location.origin}/api/account/login`;
        } else {
          // 需要引入Message组件，以下同理
          Message.error('服务端接口异常！');
          return Promise.reject(new Error('服务端接口异常！'));
        }
      } else {
        // Something happened in setting up the request that triggered an Error
        const { data: resData, status } = error;
        if (status === 200 && resData.code !== '0') {
          const msg = resData.msg || '服务端执行出错！';
          Message.error(msg);
          return Promise.reject(new Error(msg));
        }
      }
    });
}
