import process from 'node:process'
import querystring from 'node:querystring'
import { httpRequest } from '../common.js'
import Env from '../env.js'

const $ = new Env()
const timeout = 15000 // 超时时间(单位毫秒)
let BARK_PUSH = '' // Bark APP推送地址
let BARK_SOUND = '' // Bark APP推送铃声
let BARK_GROUP = 'QingLong' // Bark APP推送消息分组

// 云端环境变量的判断与接收
if (process.env.BARK_PUSH) {
  if (
    process.env.BARK_PUSH.includes('https')
    || process.env.BARK_PUSH.includes('http')
  ) {
    // 兼容BARK自建用户
    BARK_PUSH = process.env.BARK_PUSH
  } else {
    BARK_PUSH = `https://api.day.app/${process.env.BARK_PUSH}`
  }
  if (process.env.BARK_SOUND) {
    BARK_SOUND = process.env.BARK_SOUND
  }
  if (process.env.BARK_GROUP) {
    BARK_GROUP = process.env.BARK_GROUP
  }
} else {
  if (
    BARK_PUSH
    && !BARK_PUSH.includes('https')
    && !BARK_PUSH.includes('http')
  ) {
    // 兼容BARK本地用户只填写设备码的情况
    BARK_PUSH = `https://api.day.app/${BARK_PUSH}`
  }
}

/**
 * Bark APP通知
 * @param {string} text - 通知头
 * @param {string} desp - 通知体
 * @param {object} params - 附加参数
 * @returns {Promise<void>}
 */
async function BarkNotify(text, desp, params = {}) {
  if (BARK_PUSH) {
    const options = {
      url: `${BARK_PUSH}/${encodeURIComponent(text)}/${encodeURIComponent(
        desp,
      )}?sound=${BARK_SOUND}&group=${BARK_GROUP}&${querystring.stringify(params)}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout,
    }
    try {
      const data = await httpRequest(options)
      if (data.code === 200) {
        console.log('Bark APP发送通知消息成功🎉\n')
      } else {
        console.log(`${data.message}\n`)
      }
    } catch (e) {
      console.log('Bark APP发送通知调用API失败！！\n')
      console.log(e)
      $.logErr(e)
    }
  }
}

export default BarkNotify
export { BARK_PUSH }
