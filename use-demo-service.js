export const getAppList = (data) => callApi({
  url: 'getList/apps?appName=',
  option: {
    method: 'get',
    data,
  },
});



// 在使用接口的组件内引入该方法即可
