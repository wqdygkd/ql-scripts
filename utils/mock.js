/**
 * Mock 数据生成工具
 */

/**
 * 生成交易员 mock 数据
 * @param {string} tradersEnv 交易员环境变量值
 * @returns {object} mock 数据
 */
export function getWebSeaTradersMockData(tradersEnv) {
  // 从环境变量获取交易员名称，默认值为 'Soaring'
  const traders = tradersEnv.split(',').map(name => name.trim())

  // 生成 mock 交易员数据
  const mockList = traders.map((nickname) => {
    // 随机生成余额数据（1、2、3中随机）
    const values = [1, 2, 3]
    const remainingMargin = values[Math.floor(Math.random() * values.length)].toString()
    const remainingPrivilegeMargin = values[Math.floor(Math.random() * values.length)].toString()

    return {
      nickname,
      remainingMargin,
      remainingPrivilegeMargin,
      // 其他可能需要的字段
      traderId: `trader_${Math.floor(Math.random() * 1000)}`,
      avatar: 'https://example.com/avatar.jpg',
      level: Math.floor(Math.random() * 10) + 1,
      followers: Math.floor(Math.random() * 10000),
    }
  })

  return {
    code: 0,
    message: 'success',
    result: {
      list: mockList,
      total: mockList.length,
      pageNo: 1,
      pageSize: 20,
    },
  }
}
