import process from 'node:process'
import { httpRequest } from '../common.js'
import Env from '../env.js'

const $ = new Env()
const timeout = 15000 // 超时时间(单位毫秒)
let PUSH_PLUS_TOKEN = '' // push+ Token
let PUSH_PLUS_USER = '' // push+ 用户分组

// 云端环境变量的判断与接收
if (process.env.PUSH_PLUS_TOKEN) {
  PUSH_PLUS_TOKEN = process.env.PUSH_PLUS_TOKEN
}
if (process.env.PUSH_PLUS_USER) {
  PUSH_PLUS_USER = process.env.PUSH_PLUS_USER
}

/**
 * push+通知
 * @param {string} text - 通知头
 * @param {string} desp - 通知体
 * @returns {Promise<any>}
 */
async function pushPlusNotify(text, desp) {
  if (PUSH_PLUS_TOKEN) {
    desp = desp.replace(/[\n\r]/g, '<br>') // 默认为html, 不支持plaintext
    const body = {
      token: `${PUSH_PLUS_TOKEN}`,
      title: `${text}`,
      content: `${desp}`,
      topic: `${PUSH_PLUS_USER}`,
    }
    const options = {
      url: `https://www.pushplus.plus/send`,
      body: JSON.stringify(body),
      headers: {
        'Content-Type': ' application/json',
      },
      timeout,
    }
    try {
      const data = await httpRequest(options)
      if (data.code === 200) {
        console.log(
          `push+发送${
            PUSH_PLUS_USER ? '一对多' : '一对一'
          }通知消息完成。\n`,
        )
      } else {
        console.log(
          `push+发送${
            PUSH_PLUS_USER ? '一对多' : '一对一'
          }通知消息失败：${data.msg}\n`,
        )
      }
      return data
    } catch (e) {
      console.log(
        `push+发送${
          PUSH_PLUS_USER ? '一对多' : '一对一'
        }通知消息失败！！\n`,
      )
      console.log(e)
      $.logErr(e)
      return
    }
  } else {
    return
  }
}

export default pushPlusNotify
