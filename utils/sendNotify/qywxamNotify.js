import process from 'node:process'
import { httpRequest } from '../common.js'
import Env from '../env.js'

const $ = new Env()
const timeout = 15000 // 超时时间(单位毫秒)
let QYWX_AM = '' // 企业微信应用消息配置

// 云端环境变量的判断与接收
if (process.env.QYWX_AM) {
  QYWX_AM = process.env.QYWX_AM
}

/**
 * 企业微信应用消息通知
 * @param {string} text - 通知头
 * @param {string} desp - 通知体
 * @returns {Promise<any>}
 */
async function qywxamNotify(text, desp) {
  if (QYWX_AM) {
    const QYWX_AM_AY = QYWX_AM.split(',')
    const options_accesstoken = {
      url: `https://qyapi.weixin.qq.com/cgi-bin/gettoken`,
      json: {
        corpid: `${QYWX_AM_AY[0]}`,
        corpsecret: `${QYWX_AM_AY[1]}`,
      },
      headers: {
        'Content-Type': 'application/json',
      },
      timeout,
    }
    try {
      const data = await httpRequest(options_accesstoken)
      let html = desp.replace(/\n/g, '<br/>')
      let json = data
      let accesstoken = json.access_token
      let options

      switch (QYWX_AM_AY[4]) {
        case '0':
          options = {
            msgtype: 'textcard',
            textcard: {
              title: `${text}`,
              description: `${desp}`,
              url: 'https://github.com/whyour/qinglong',
              btntxt: '更多',
            },
          }
          break

        case '1':
          options = {
            msgtype: 'text',
            text: {
              content: `${text}\n\n${desp}`,
            },
          }
          break

        default:
          options = {
            msgtype: 'mpnews',
            mpnews: {
              articles: [
                {
                  title: `${text}`,
                  thumb_media_id: `${QYWX_AM_AY[4]}`,
                  author: `智能助手`,
                  content_source_url: ``,
                  content: `${html}`,
                  digest: `${desp}`,
                },
              ],
            },
          }
      }
      if (!QYWX_AM_AY[4]) {
        // 如不提供第四个参数,则默认进行文本消息类型推送
        options = {
          msgtype: 'text',
          text: {
            content: `${text}\n\n${desp}`,
          },
        }
      }
      options = {
        url: `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${accesstoken}`,
        json: {
          touser: `${ChangeUserId(desp)}`,
          agentid: `${QYWX_AM_AY[3]}`,
          safe: '0',
          ...options,
        },
        headers: {
          'Content-Type': 'application/json',
        },
      }

      const result = await httpRequest(options)
      if (result.errcode === 0) {
        console.log(
          `成员ID:${
            ChangeUserId(desp)
          }企业微信应用消息发送通知消息成功🎉。\n`,
        )
      } else {
        console.log(`${result.errmsg}\n`)
      }
      return result
    } catch (e) {
      console.log(
        `成员ID:${
          ChangeUserId(desp)
        }企业微信应用消息发送通知消息失败！！\n`,
      )
      console.log(e)
      $.logErr(e)
      return
    }
  } else {
    return
  }
}

/**
 * 企业微信应用消息通知 - 变更用户ID
 * @param {string} desp - 通知体
 * @returns {string} - 用户ID
 */
function ChangeUserId(desp) {
  const QYWX_AM_AY = QYWX_AM.split(',')
  if (QYWX_AM_AY[2]) {
    const userIdTmp = QYWX_AM_AY[2].split('|')
    let userId = ''
    for (let i = 0; i < userIdTmp.length; i++) {
      const count = `账号${i + 1}`
      const count2 = `签到号 ${i + 1}`
      if (desp.match(count2)) {
        userId = userIdTmp[i]
      }
    }
    if (!userId) userId = QYWX_AM_AY[2]
    return userId
  } else {
    return '@all'
  }
}

export default qywxamNotify
