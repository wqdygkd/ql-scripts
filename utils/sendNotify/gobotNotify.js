import process from 'node:process'
import { httpRequest } from '../common.js'
import Env from '../env.js'

const $ = new Env()
const timeout = 15000 // 超时时间(单位毫秒)
let GOBOT_URL = '' // 推送到个人QQ: http://127.0.0.1/send_private_msg  群：http://127.0.0.1/send_group_msg
let GOBOT_TOKEN = '' // 访问密钥
let GOBOT_QQ = '' // 如果GOBOT_URL设置 /send_private_msg 则需要填入 user_id=个人QQ 相反如果是 /send_group_msg 则需要填入 group_id=QQ群

// 云端环境变量的判断与接收
if (process.env.GOBOT_URL) {
  GOBOT_URL = process.env.GOBOT_URL
}
if (process.env.GOBOT_TOKEN) {
  GOBOT_TOKEN = process.env.GOBOT_TOKEN
}
if (process.env.GOBOT_QQ) {
  GOBOT_QQ = process.env.GOBOT_QQ
}

/**
 * go-cqhttp通知
 * @param {string} text - 通知头
 * @param {string} desp - 通知体
 * @param {number} time - 延迟时间(毫秒)
 * @returns {Promise<any>}
 */
async function gobotNotify(text, desp, time = 2100) {
  if (GOBOT_URL) {
    const options = {
      url: `${GOBOT_URL}?access_token=${GOBOT_TOKEN}&${GOBOT_QQ}`,
      json: { message: `${text}\n${desp}` },
      headers: {
        'Content-Type': 'application/json',
      },
      timeout,
    }
    await new Promise(resolve => setTimeout(resolve, time))
    try {
      const data = await httpRequest(options)
      if (data.retcode === 0) {
        console.log('go-cqhttp发送通知消息成功🎉\n')
      } else if (data.retcode === 100) {
        console.log(`go-cqhttp发送通知消息异常: ${data.errmsg}\n`)
      } else {
        console.log(
          `go-cqhttp发送通知消息异常\n${JSON.stringify(data)}`,
        )
      }
      return data
    } catch (e) {
      console.log('发送go-cqhttp通知调用API失败！！\n')
      console.log(e)
      $.logErr(e)
      return
    }
  } else {
    return
  }
}

export default gobotNotify
