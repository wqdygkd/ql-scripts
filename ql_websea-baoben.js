/**
 * WebSea 交易员监控
 * 描述: 监控指定交易员的剩余特权保证金
 * Author: c
 * Date: 2026-03-09
 * cron "* * 1 2" ql_websea-baoben.js
 * export WEBSEA_TRADERS = Shark killer,Dark Whale 多个交易员用逗号分隔
 */

import process from 'node:process'
import { httpRequest } from './utils/common.js'
import Env from './utils/env.js'
import { getWebSeaTradersMockData } from './utils/mock.js'
import { sendNotify } from './utils/sendNotify/index.js'

const $ = new Env('WebSea 交易员监控保证金余额监控')

const env_name = 'WEBSEA_TRADERS' // 环境变量名字
const env = process.env[env_name] || 'Soaring'
const Notify = 1 // 是否通知, 1通知, 0不通知. 默认通知
const mock = 0 // 是否使用mock数据, 1使用, 0不使用. 默认不使用
let msg = ''
const LAST_MSG_KEY = 'websea_last_message'
const LAST_MSG_TIME_KEY = 'websea_last_message_time'
const MESSAGE_INTERVAL = 30 * 60 * 1000 // 30分钟间隔

// ======================================异步顺序==============================================
async function run() {
  try {
    await main()
    await SendMsg(msg)
  } catch (e) {
    $.logErr(e)
    $.done()
    return
  }

  // 随机等待 0.5-2 秒
  const randomWait = Math.random() * 1500 + 500 // 500ms - 2000ms
  setTimeout(() => {
    run()
  }, randomWait)
}

console.log(`\n========== 开始监控交易员 ==========`)
run()

// ==================================脚本入口函数main()==============================================================
async function main() {
  console.log(`\n============= 开始获取交易员数据 =============`)
  try {
    let response

    // 检查是否使用 mock 数据
    if (mock) {
      console.log('使用 mock 数据')
      // 生成 mock 数据
      response = getWebSeaTradersMockData(env)
    } else {
      const url = 'https://capi.websea.com/webApi/protected/trader/trader-list?sortType=1&pageSize=20&pageNo=1&name='
      response = await httpRequest(url, {
        method: 'GET',
        responseType: 'json',
      })
    }

    const list = response && response.result && response.result.list
    if (list && list.length > 0) {
      // 从环境变量获取交易员名称，默认值为 'Shark killer,Dark Whale'
      const traders = env.split(',').map(name => name.trim())
      const arr = new Set(traders)
      const filteredTraders = list.filter(item => arr.has(item.nickname))

      console.log(`🌸监控的交易员: ${traders.join(', ')}`)
      if (filteredTraders.length > 0) {
        console.log(`🌸发现 ${filteredTraders.length} 个目标交易员`)
        let hasPositiveValue = false
        const positiveTraders = []

        for (const item of filteredTraders) {
          const remainingMargin = Number.parseFloat(item.remainingMargin) || 0
          const remainingPrivilegeMargin = Number.parseFloat(item.remainingPrivilegeMargin) || 0
          console.log(`🌸${item.nickname}: ${remainingMargin} ${remainingPrivilegeMargin}`)
          if (remainingMargin > 0 || remainingPrivilegeMargin > 0) {
            hasPositiveValue = true
            positiveTraders.push(`${item.nickname}: 保证金余额 ${remainingMargin} 特权保证金余额 ${remainingPrivilegeMargin}`)
          }
        }

        if (hasPositiveValue) {
          // 重新构建消息，只包含有正值的交易员
          msg = `\n========== WebSea 交易员监控 ==========\n`
          msg += `🌸监控的交易员: ${traders.join(', ')}\n`
          msg += `🌸发现 ${positiveTraders.length} 个交易员有余额\n`
          positiveTraders.forEach((trader) => {
            msg += `🌸${trader}\n`
          })
        } else {
          msg = '' // 清空消息，不发送通知
        }
      } else {
        console.log(`🌸未找到目标交易员`)
        msg = '' // 清空消息，不发送通知
      }
    } else {
      console.log(`🌸获取交易员数据失败`)
    }
  } catch (e) {
    if (e.response) {
      console.log(`🌸HTTP错误:${e.response.status} - ${e.response.statusText}❌`)
    } else {
      console.log(`🌸网络错误:${e.message}❌`)
    }
  }
}

/**
 * =========================================================发送消息=============================================
 */
async function SendMsg(message) {
  if (!message) return

  // 检查是否需要发送消息
  const shouldSend = await checkMessageShouldSend(message)
  if (!shouldSend) {
    console.log('消息未变化且未到发送间隔，跳过通知')
    return
  }

  if (Notify > 0) {
    try {
      await sendNotify($.name, message)
      // 发送成功后更新消息记录
      await updateMessageRecord(message)
    } catch (e) {
      console.log('发送通知失败:', e.message)
    }
  } else {
    console.log(message)
  }
}

/**
 * 检查消息是否应该发送
 * @param {string} message 当前消息
 * @returns {boolean} 是否应该发送
 */
async function checkMessageShouldSend(message) {
  try {
    // 获取上次发送的消息和时间
    const lastMessage = $.getdata(LAST_MSG_KEY) || ''
    const lastTimeStr = $.getdata(LAST_MSG_TIME_KEY) || '0'
    const lastTime = Number.parseInt(lastTimeStr)
    const currentTime = Date.now()

    // 如果消息不同，直接发送
    if (message !== lastMessage) {
      return true
    }

    // 如果消息相同，检查时间间隔
    if (currentTime - lastTime >= MESSAGE_INTERVAL) {
      return true
    }

    return false
  } catch (e) {
    console.log('检查消息发送状态失败:', e.message)
    return true // 出错时默认发送
  }
}

/**
 * 更新消息记录
 * @param {string} message 当前消息
 */
async function updateMessageRecord(message) {
  try {
    $.setdata(message, LAST_MSG_KEY)
    $.setdata(Date.now().toString(), LAST_MSG_TIME_KEY)
  } catch (e) {
    console.log('更新消息记录失败:', e.message)
  }
}
