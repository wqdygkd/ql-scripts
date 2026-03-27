/**
 * WebSea 跟单
 * 描述: WebSea 跟单
 * Author: c
 * Date: 2026-03-09
 * cron "0  * * *" ql_websea-follow.js
 *
 * 环境变量配置:
 * export WEBSEA_FOLLOW_ID=''               # 交易员ID
 * export WEBSEA_FOLLOW_DAYS=''             # 跟单天数
 * export WEBSEA_FOLLOW_AMOUNT=''           # 跟单金额
 * export WEBSEA_FOLLOW_CODE=''             # 特权码
 * export WEBSEA_FOLLOW_IS_PRIVILEGE='1'    # 是否特权订阅
 * export WEBSEA_IMEI=''                    # 设备IMEI
 * export WEBSEA_TOKEN=''                   # 用户Token
 * export WEBSEA_USERID=''                  # 用户ID
 * export WEBSEA_COOKIE=''                  # Cookie
 */

import process from 'node:process'
import axios from 'axios'
import qs from 'qs'
// ============================================================================================================
import Env from './utils/env.js'
import { sendNotify } from './utils/sendNotify/index.js'

const $ = new Env('WebSea 跟单')

const Notify = 1 // 是否通知, 1通知, 0不通知. 默认通知

// WebSea 跟单配置环境变量
const WEBSEA_FOLLOW_ID = process.env.WEBSEA_FOLLOW_ID || 'B7z9G'
const WEBSEA_FOLLOW_DAYS = process.env.WEBSEA_FOLLOW_DAYS || '7'
const WEBSEA_FOLLOW_AMOUNT = process.env.WEBSEA_FOLLOW_AMOUNT || '5000'
const WEBSEA_FOLLOW_CODE = process.env.WEBSEA_FOLLOW_CODE || 'GVPMZH67'
const WEBSEA_FOLLOW_IS_PRIVILEGE = process.env.WEBSEA_FOLLOW_IS_PRIVILEGE || '1'
const WEBSEA_IMEI = process.env.WEBSEA_IMEI || '60306'
const WEBSEA_TOKEN = process.env.WEBSEA_TOKEN || '7ad60d'
const WEBSEA_USERID = process.env.WEBSEA_USERID || '633895'
const WEBSEA_COOKIE = process.env.WEBSEA_COOKIE || 'shareToken=7ad60d'

const WEBSEA_ADD_SUB_ID = process.env.WEBSEA_ADD_SUB_ID || ''
const WEBSEA_ADD_AMOUNT = process.env.WEBSEA_ADD_AMOUNT || '500'

async function follow() {
  try {
    const result = await followHandler()

    console.log(result.message)

    if (result.shouldSendNotify) {
      await SendMsg(result.message)
    }
    if (result.shouldAddFlow) {
      addFollow()
      return
    }

    if (!result.shouldContinue) {
      $.done()
      return
    }
  } catch (e) {
    $.logErr(e)
    $.done()
    return
  }

  // 随机等待 3.5-3 秒
  const randomWait = Math.random() * 1500 + 3500
  setTimeout(() => {
    follow()
  }, randomWait)
}

async function addFollow() {
  try {
    const result = await addFollowHandler()

    console.log(result.message)

    if (result.shouldSendNotify) {
      await SendMsg(result.message)
    }
    if (result.shouldImmediateContinue) {
      addFollow()
      return
    }

    if (!result.shouldContinue) {
      $.done()
      return
    }
  } catch (e) {
    $.logErr(e)
    $.done()
    return
  }

  // 随机等待 3.5-3 秒
  const randomWait = Math.random() * 1500 + 3500
  setTimeout(() => {
    addFollow()
  }, randomWait)
}

console.log(`\n========== 开始监控跟单 ==========`)
follow()

async function followHandler() {
  const data = qs.stringify({
    id: WEBSEA_FOLLOW_ID,
    days: WEBSEA_FOLLOW_DAYS,
    followAmount: WEBSEA_FOLLOW_AMOUNT,
    code: WEBSEA_FOLLOW_CODE,
    isPrivilegeSub: WEBSEA_FOLLOW_IS_PRIVILEGE,
  })
  const config = {
    method: 'post',
    url: 'https://capi.websea.com/webApi/protected/follow/sub',
    headers: {
      'imei': WEBSEA_IMEI,
      'isnight': '1',
      'language': 'zh-CN',
      'platform': 'pc',
      'pragma': 'no-cache',
      'priority': 'u=1, i',
      'token': WEBSEA_TOKEN,
      'userid': WEBSEA_USERID,
      'Cookie': WEBSEA_COOKIE,
      'content-type': 'application/x-www-form-urlencoded',
    },
    data,
  }

  const response = await axios(config)
  const resData = response.data

  if (resData.errno === 20001) {
    if (resData.errmsg === '保本带单交易员保证金余额不足') {
      return {
        shouldContinue: true,
        shouldSendNotify: false,
        message: `🌸保本带单交易员保证金余额不足，继续循环调用...`,
      }
    } else if (resData.errmsg === '特权码无效') {
      return {
        shouldContinue: false,
        shouldSendNotify: true,
        message: `\n========== WebSea 跟单 ==========\n❌特权码无效，请检查特权码`,
      }
    } else {
      return {
        shouldContinue: false,
        shouldSendNotify: true,
        message: `🌸其他错误: ${resData.errmsg}`,
      }
    }
  } else if (resData.errno === 0) {
    if (resData.result && resData.result.followStatus === 1) {
      return {
        shouldContinue: false,
        shouldAddFlow: true,
        shouldSendNotify: true,
        message: `\n========== WebSea 跟单 ==========\n🎉跟单成功！\n📊跟单状态: ${resData.result.followStatus}\n⏰开始时间: ${resData.result.subStartTime}\n📅订阅天数: ${resData.result.days}天\n⏳结束时间: ${resData.result.subEndTime}`,
      }
    } else {
      return {
        shouldContinue: false,
        shouldSendNotify: true,
        message: `🌸请求成功，但跟单状态异常: ${JSON.stringify(resData.result)}`,
      }
    }
  } else {
    return {
      shouldContinue: false,
      shouldSendNotify: true,
      message: `🌸未知错误: errno=${resData.errno}, errmsg=${resData.errmsg}`,
    }
  }
}

async function addFollowHandler() {
  const data = qs.stringify({
    subId: WEBSEA_ADD_SUB_ID,
    amount: WEBSEA_ADD_AMOUNT,
  })
  const config = {
    method: 'post',
    url: 'https://capi.websea.com/webApi/protected/follow/addFollowAmount',
    headers: {
      'imei': WEBSEA_IMEI,
      'isnight': '1',
      'language': 'zh-CN',
      'platform': 'pc',
      'pragma': 'no-cache',
      'priority': 'u=1, i',
      'token': WEBSEA_TOKEN,
      'userid': WEBSEA_USERID,
      'Cookie': WEBSEA_COOKIE,
      'content-type': 'application/x-www-form-urlencoded',
    },
    data,
  }

  const response = await axios(config)
  const resData = response.data

  if (resData.errno === 20001) {
    if (resData.errmsg === '交易员的保证金不足，请减少添加金额，再重试') {
      return {
        shouldContinue: true,
        shouldSendNotify: false,
        message: `🌸交易员保证金不足，请减少添加金额，继续循环...`,
      }
    } else {
      return {
        shouldContinue: false,
        shouldSendNotify: true,
        message: `🌸其他错误: ${resData.errmsg}`,
      }
    }
  } else if (resData.errno === 0) {
    return {
      shouldContinue: false,
      shouldSendNotify: true,
      message: `\n========== WebSea 跟单 ==========\n🎉添加跟单金额成功！`,
    }
  } else {
    return {
      shouldContinue: false,
      shouldSendNotify: true,
      message: `🌸未知错误: errno=${resData.errno}, errmsg=${resData.errmsg}`,
    }
  }
}

/**
 * =========================================================发送消息=============================================
 */
async function SendMsg(message) {
  if (!message) return

  if (Notify > 0) {
    try {
      await sendNotify($.name, message)
    } catch (e) {
      console.log('发送通知失败:', e.message)
    }
  } else {
    console.log(message)
  }
}
