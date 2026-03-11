import process from 'node:process'
import { httpRequest } from '../common.js'
import Env from '../env.js'

const $ = new Env()
const timeout = 15000 // 超时时间(单位毫秒)
let DD_BOT_TOKEN = '' // 钉钉机器人Token
let DD_BOT_SECRET = '' // 钉钉机器人密钥

// 云端环境变量的判断与接收
if (process.env.DD_BOT_TOKEN) {
  DD_BOT_TOKEN = process.env.DD_BOT_TOKEN
  if (process.env.DD_BOT_SECRET) {
    DD_BOT_SECRET = process.env.DD_BOT_SECRET
  }
}

/**
 * 钉钉机器人通知
 * @param {string} text - 通知头
 * @param {string} desp - 通知体
 * @returns {Promise<any>}
 */
async function ddBotNotify(text, desp) {
  const options = {
    url: `https://oapi.dingtalk.com/robot/send?access_token=${DD_BOT_TOKEN}`,
    json: {
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
  if (DD_BOT_TOKEN && DD_BOT_SECRET) {
    try {
      const { default: crypto } = await import('node:crypto')
      const dateNow = Date.now()
      const hmac = crypto.createHmac('sha256', DD_BOT_SECRET)
      hmac.update(`${dateNow}\n${DD_BOT_SECRET}`)
      const result = encodeURIComponent(hmac.digest('base64'))
      options.url = `${options.url}&timestamp=${dateNow}&sign=${result}`
      const data = await httpRequest(options)
      if (data.errcode === 0) {
        console.log('钉钉发送通知消息成功🎉。\n')
      } else {
        console.log(`${data.errmsg}\n`)
      }
      return data
    } catch (e) {
      console.log('钉钉发送通知消息失败！！\n')
      console.log(e)
      $.logErr(e)
      return
    }
  } else if (DD_BOT_TOKEN) {
    try {
      const data = await httpRequest(options)
      if (data.errcode === 0) {
        console.log('钉钉发送通知消息完成。\n')
      } else {
        console.log(`${data.errmsg}\n`)
      }
      return data
    } catch (e) {
      console.log('钉钉发送通知消息失败！！\n')
      console.log(e)
      $.logErr(e)
      return
    }
  } else {
    return
  }
}

export default ddBotNotify
