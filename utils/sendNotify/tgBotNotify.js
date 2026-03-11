import process from 'node:process'
import { httpRequest } from '../common.js'
import Env from '../env.js'

const $ = new Env()
const timeout = 15000 // 超时时间(单位毫秒)
let TG_BOT_TOKEN = '' // Telegram机器人Token
let TG_USER_ID = '' // Telegram用户ID
let TG_PROXY_HOST = '' // Telegram代理主机
let TG_PROXY_PORT = '' // Telegram代理端口
let TG_PROXY_AUTH = '' // Telegram代理认证
let TG_API_HOST = 'api.telegram.org' // Telegram API主机

// 云端环境变量的判断与接收
if (process.env.TG_BOT_TOKEN) {
  TG_BOT_TOKEN = process.env.TG_BOT_TOKEN
}
if (process.env.TG_USER_ID) {
  TG_USER_ID = process.env.TG_USER_ID
}
if (process.env.TG_PROXY_AUTH) TG_PROXY_AUTH = process.env.TG_PROXY_AUTH
if (process.env.TG_PROXY_HOST) TG_PROXY_HOST = process.env.TG_PROXY_HOST
if (process.env.TG_PROXY_PORT) TG_PROXY_PORT = process.env.TG_PROXY_PORT
if (process.env.TG_API_HOST) TG_API_HOST = process.env.TG_API_HOST

/**
 * Telegram机器人通知
 * @param {string} text - 通知头
 * @param {string} desp - 通知体
 * @returns {Promise<any>}
 */
async function tgBotNotify(text, desp) {
  if (TG_BOT_TOKEN && TG_USER_ID) {
    const options = {
      url: `https://${TG_API_HOST}/bot${TG_BOT_TOKEN}/sendMessage`,
      body: `chat_id=${TG_USER_ID}&text=${text}\n\n${desp}&disable_web_page_preview=true`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout,
    }
    if (TG_PROXY_HOST && TG_PROXY_PORT) {
      try {
        const { default: tunnel } = await import('tunnel')
        const agent = {
          https: tunnel.httpsOverHttp({
            proxy: {
              host: TG_PROXY_HOST,
              port: TG_PROXY_PORT * 1,
              proxyAuth: TG_PROXY_AUTH,
            },
          }),
        }
        Object.assign(options, { agent })
        const data = await httpRequest(options)
        if (data.ok) {
          console.log('Telegram发送通知消息成功🎉。\n')
        } else if (data.error_code === 400) {
          console.log(
            '请主动给bot发送一条消息并检查接收用户ID是否正确。\n',
          )
        } else if (data.error_code === 401) {
          console.log('Telegram bot token 填写错误。\n')
        }
        return data
      } catch (e) {
        console.log('telegram发送通知消息失败！！\n')
        console.log(e)
        $.logErr(e)
        return
      }
    } else {
      try {
        const data = await httpRequest(options)
        if (data.ok) {
          console.log('Telegram发送通知消息成功🎉。\n')
        } else if (data.error_code === 400) {
          console.log(
            '请主动给bot发送一条消息并检查接收用户ID是否正确。\n',
          )
        } else if (data.error_code === 401) {
          console.log('Telegram bot token 填写错误。\n')
        }
        return data
      } catch (e) {
        console.log('telegram发送通知消息失败！！\n')
        console.log(e)
        $.logErr(e)
        return
      }
    }
  } else {
    return
  }
}

export default tgBotNotify
