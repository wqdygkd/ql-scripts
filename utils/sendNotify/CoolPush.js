import process from 'node:process'
import { httpRequest } from '../common.js'
import Env from '../env.js'

const $ = new Env()
const timeout = 15000 // 超时时间(单位毫秒)
let QQ_SKEY = '' // QQ酷推SKEY
let QQ_MODE = '' // QQ酷推模式

// 云端环境变量的判断与接收
if (process.env.QQ_SKEY) {
  QQ_SKEY = process.env.QQ_SKEY
}

if (process.env.QQ_MODE) {
  QQ_MODE = process.env.QQ_MODE
}

/**
 * QQ酷推通知
 * @param {string} text - 通知头
 * @param {string} desp - 通知体
 * @returns {Promise<any>}
 */
async function CoolPush(text, desp) {
  if (QQ_SKEY) {
    let options = {
      url: `https://push.xuthus.cc/${QQ_MODE}/${QQ_SKEY}`,
      headers: {
        'Content-Type': 'application/json',
      },
    }

    // 已知敏感词
    text = text.replace(/京豆/g, '豆豆')
    desp = desp.replace(/京豆/g, '')
    desp = desp.replace(/🐶/g, '')
    desp = desp.replace(/红包/g, 'H包')

    switch (QQ_MODE) {
      case 'email':
        options.json = {
          t: text,
          c: desp,
        }
        break
      default:
        options.body = `${text}\n\n${desp}`
    }

    let pushMode = function (t) {
      switch (t) {
        case 'send':
          return '个人'
        case 'group':
          return 'QQ群'
        case 'wx':
          return '微信'
        case 'ww':
          return '企业微信'
        case 'email':
          return '邮件'
        default:
          return '未知方式'
      }
    }

    try {
      const data = await httpRequest(options)
      if (data.code === 200) {
        console.log(`酷推发送${pushMode(QQ_MODE)}通知消息成功🎉\n`)
      } else if (data.code === 400) {
        console.log(
          `QQ酷推(Cool Push)发送${pushMode(QQ_MODE)}推送失败：${
            data.msg
          }\n`,
        )
      } else if (data.code === 503) {
        console.log(`QQ酷推出错，${data.message}：${data.data}\n`)
      } else {
        console.log(`酷推推送异常: ${JSON.stringify(data)}`)
      }
      return data
    } catch (e) {
      console.log(`发送${pushMode(QQ_MODE)}通知调用API失败！！\n`)
      console.log(e)
      $.logErr(e)
    }
  } else {

  }
}

export default CoolPush
