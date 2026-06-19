export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/settlement/index',
    'pages/records/index',
    'pages/mine/index',
    'pages/record-detail/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#FFFFFF',
    navigationBarTitleText: '悦齿日清助手',
    navigationBarTextStyle: 'black',
    backgroundColor: '#F0FDF9'
  },
  tabBar: {
    color: '#9CA3AF',
    selectedColor: '#10B981',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '工作台'
      },
      {
        pagePath: 'pages/settlement/index',
        text: '日清对账'
      },
      {
        pagePath: 'pages/records/index',
        text: '交班记录'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
