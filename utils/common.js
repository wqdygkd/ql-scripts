/**
 * 公共工具方法
 * 包含：wait、sjwait、httpRequest 等公共方法
 */
import got from 'got'

/**
 * ======================================================等待 X 秒============================================
 */
export function wait(n) {
  return new Promise((resolve) => {
    setTimeout(resolve, n * 1000)
  })
}

/**
 * ======================================================随机等待 1-5 秒============================================
 */
export function sjwait() {
  return new Promise((resolve) => {
    const waitTime = Math.floor(Math.random() * 4000 + 1000)
    setTimeout(resolve, waitTime)
  })
}

/**
 * ==========================================================13位时间戳=====================================================
 */
export function getTimestamp() {
  return Date.now()
}

/**
 * =======================================================网络请求httpRequest=========================================
 * 使用 got 库封装，支持 Promise 链式调用
 * @param {string|object} options - 请求配置，可为字符串URL或配置对象
 * @param {object} config - 额外配置
 * @returns {Promise} - 返回请求结果
 */
export async function httpRequest(options, config = {}) {
  try {
    // 处理简单URL字符串情况
    if (typeof options === 'string') {
      options = { url: options }
    }

    // 合并配置
    const defaultConfig = {
      method: options.method || (options.body ? 'POST' : 'GET'),
      headers: options.headers || {},
      // timeout: options.timeout || 30000,
      // retry: {
      //   limit: 3,
      //   delay: 1000,
      // },
      responseType: 'json',
      ...config,
    }

    // 处理请求体
    if (options.body && typeof options.body === 'object') {
      defaultConfig.json = options.body
    } else if (options.body) {
      defaultConfig.body = options.body
    }

    // 执行请求
    const response = await got(options.url, defaultConfig)
    return response.body
  } catch (error) {
    console.error('HTTP请求错误:', error.message)
    // 尝试获取错误响应数据
    if (error.response) {
      console.error('错误响应状态:', error.response.statusCode)
      console.error('错误响应数据:', error.response.body)
      return error.response.body
    }
    throw error
  }
}
