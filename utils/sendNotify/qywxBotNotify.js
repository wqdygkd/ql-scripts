import process from 'node:process'
import { httpRequest } from '../common.js'
import Env from '../env.js'

const $ = new Env()
const timeout = 15000 // 超时时间(单位毫秒)
let QYWX_KEY = '' // 企业微信机器人Key

// 云端环境变量的判断与接收
if (process.env.QYWX_KEY) {
  QYWX_KEY = process.env.QYWX_KEY
}

/**
 * 企业微信机器人通知
 * @param {string} text - 通知头
 * @param {string} desp - 通知体
 * @returns {Promise<any>} - 返回值
 */
async function qywxBotNotify(text, desp) {
  const options = {
    url: `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=${QYWX_KEY}`,
    body: {
      msgtype: 'text',
      text: {
        content: ` ${text}\n\n${desp}`,
      },
    },
    headers: {
      'Content-Type': 'application/json',
    },
    timeout,
  }
  if (QYWX_KEY) {
    try {
      const data = await httpRequest(options)
      if (data.errcode === 0) {
        console.log('企业微信发送通知消息成功🎉。\n')
      } else {
        console.log(`${data.errmsg}\n`)
      }
      return data
    } catch (e) {
      console.log('企业微信发送通知消息失败！！\n')
      console.log(e)
      $.logErr(e)
    }
  }
}

export default qywxBotNotify
