export const getAppList = (data) => callApi({
  url: 'getList/apps?appName=',
  option: {
    method: 'get',
    data,
  },
});
