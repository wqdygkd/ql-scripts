import process from 'node:process'
import { httpRequest } from '../common.js'
import Env from '../env.js'
import querystring from 'node:querystring'

const $ = new Env()
const timeout = 15000 // 超时时间(单位毫秒)
let IGOT_PUSH_KEY = '' // iGot推送Key

// 云端环境变量的判断与接收
if (process.env.IGOT_PUSH_KEY) {
  IGOT_PUSH_KEY = process.env.IGOT_PUSH_KEY
}

/**
 * iGot聚合推送通知
 * @param {string} text - 通知头
 * @param {string} desp - 通知体
 * @param {object} params - 附加参数
 * @returns {Promise<any>}
 */
async function iGotNotify(text, desp, params = {}) {
  if (IGOT_PUSH_KEY) {
    // 校验传入的IGOT_PUSH_KEY是否有效
    const IGOT_PUSH_KEY_REGX = new RegExp('^[a-z0-9]{24}$', 'i')
    if (!IGOT_PUSH_KEY_REGX.test(IGOT_PUSH_KEY)) {
      console.log('您所提供的IGOT_PUSH_KEY无效\n')
      return
    }
    const options = {
      url: `https://push.hellyw.com/${IGOT_PUSH_KEY.toLowerCase()}`,
      body: `title=${text}&content=${desp}&${querystring.stringify(params)}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout,
    }
    try {
      const data = await httpRequest(options)
      if (typeof data === 'string') data = JSON.parse(data)
      if (data.ret === 0) {
        console.log('iGot发送通知消息成功🎉\n')
      } else {
        console.log(`iGot发送通知消息失败：${data.errMsg}\n`)
      }
      return data
    } catch (e) {
      console.log('发送通知调用API失败！！\n')
      console.log(e)
      $.logErr(e)
      return
    }
  } else {
    return
  }
}

export default iGotNotify
