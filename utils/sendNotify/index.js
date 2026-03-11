import BarkNotify, { BARK_PUSH } from './BarkNotify.js'
import ddBotNotify from './ddBotNotify.js'
import gobotNotify from './gobotNotify.js'
import iGotNotify from './iGotNotify.js'
import pushPlusNotify from './pushPlusNotify.js'
import qywxamNotify from './qywxamNotify.js'
import qywxBotNotify from './qywxBotNotify.js'
import serverNotify from './serverNotify.js'
import tgBotNotify from './tgBotNotify.js'

const titleReg = /^[^-]*/

/**
 * sendNotify 推送通知功能
 * @param {string} text - 通知头
 * @param {string} desp - 通知体
 * @param {object} params - 某些推送通知方式点击弹窗可跳转, 例：{ url: 'https://abc.com' }
 * @param {string} author - 作者仓库等信息  例：`本通知 By：https://github.com/whyour/qinglong`
 * @returns {Promise<void>}
 */
async function sendNotify(
  text,
  desp,
  params = {},
  author = `\n\n本通知 By：wqdy\n通知时间：${new Date()}`,
) {
  // 提供6种通知
  desp += author // 增加作者信息，防止被贩卖等
  await Promise.all([
    serverNotify(text, desp), // 微信server酱
    pushPlusNotify(text, desp), // pushplus(推送加)
  ])
  // 由于上述两种微信通知需点击进去才能查看到详情，故text(标题内容)携带了账号序号以及昵称信息，方便不点击也可知道是哪个京东哪个活动
  // 将正则提取到模块作用域，避免每次调用都重新编译

  text = text.match(titleReg)[0].trimEnd()
  await Promise.all([
    BarkNotify(text, desp, params), // iOS Bark APP
    tgBotNotify(text, desp), // telegram 机器人
    ddBotNotify(text, desp), // 钉钉机器人
    qywxBotNotify(text, desp), // 企业微信机器人
    qywxamNotify(text, desp), // 企业微信应用消息推送
    iGotNotify(text, desp, params), // iGot
    gobotNotify(text, desp), // go-cqhttp
  ])
}

// 导出BARK_PUSH常量
export { BARK_PUSH, sendNotify }
