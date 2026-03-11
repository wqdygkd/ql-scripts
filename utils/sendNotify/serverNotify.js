import process from 'node:process'
import { httpRequest } from '../common.js'
import Env from '../env.js'

const $ = new Env()
const timeout = 15000 // 超时时间(单位毫秒)
let SCKEY = '' // 微信server酱SCKEY

// 云端环境变量的判断与接收
if (process.env.PUSH_KEY) {
  SCKEY = process.env.PUSH_KEY
}

/**
 * 微信server酱通知
 * @param {string} text - 通知头
 * @param {string} desp - 通知体
 * @param {number} time - 延迟时间(毫秒)
 * @returns {Promise<any>}
 */
async function serverNotify(text, desp, time = 2100) {
  if (SCKEY) {
    // 微信server酱推送通知一个\n不会换行，需要两个\n才能换行，故做此替换
    desp = desp.replace(/[\n\r]/g, '\n\n')
    const options = {
      url: SCKEY.includes('SCT')
        ? `https://sctapi.ftqq.com/${SCKEY}.send`
        : `https://sc.ftqq.com/${SCKEY}.send`,
      body: `text=${text}&desp=${desp}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout,
    }
    await new Promise(resolve => setTimeout(resolve, time))
    try {
      const data = await httpRequest(options)
      // server酱和Server酱·Turbo版的返回json格式不太一样
      if (data.errno === 0 || data.data.errno === 0) {
        console.log('server酱发送通知消息成功🎉\n')
      } else if (data.errno === 1024) {
        // 一分钟内发送相同的内容会触发
        console.log(`server酱发送通知消息异常: ${data.errmsg}\n`)
      } else {
        console.log(
          `server酱发送通知消息异常\n${JSON.stringify(data)}`,
        )
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

export default serverNotify
