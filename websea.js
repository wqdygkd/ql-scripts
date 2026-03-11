/**
 * websea跟单 超短线-Mike 监控
 * Author: c
 * Date: 2025-08-03
 * cron "0 7,17 * * *"
 */

// ============================================================================================================
const $ = new Env('websea跟单')
const axios = require('axios')
const dayjs = require('dayjs')

const Notify = 1
const debug = 0
let msg = ''

// ==================================异步顺序==============================================================================
!(async () => {
  await main()
})()
  .catch(e => $.logErr(e))
  .finally(() => $.done())
// ==================================脚本入口函数main()==============================================================

// ======================================开始任务=========================================
let buyOrSell = {
  1: '开多',
  2: '开空',
  3: '平多',
  4: '平空',
}
async function main(result) {
  let index = 1 // 用来给账号标记序号, 从1开始
  index = index + 1
  console.log(`\n========= 开始任务 ${index} =========`)
  let traderOperation = []
  try {
    let { data } = await axios.request({
      method: 'get',
      url: `https://capi.websea.com/webApi/follow/trader-operation?trader=485142&pageNo=1&pageSize=10`,
    })
    if (data.errno === 0) {
      traderOperation = data?.result?.list || []

      if (result?.traderOperation) {
        let list = traderOperation.filter((item) => {
          return item.time >= result.traderOperation[0].time
        })
        let msg = ''
        list.forEach((item) => {
          msg += `时间 ${dayjs(item.time * 1000).format('YYYY-MM-DD HH:mm:ss')}  合约 ${buyOrSell[item.buyOrSell]} ${item.symbol} 数量${item.amountConvert} 价格 ${item.price} 盈亏 ${item.profitLoss}\n`
        })
        if (msg) {
          console.log(msg)
        }
      } else {
        console.log(`没有新订单`)
      }
    }
  } catch (e) {
    console.log(e)
  }

  // 等1~5秒随机时间
  let rnd_time = Math.floor(Math.random() * 4000) + 1000
  console.log(`随机等待${rnd_time / 1000}秒...`)
  await $.wait(rnd_time)
  await main({ traderOperation })
}
async function objToStr(obj) {
  return JSON.stringify(obj)
}
/**
 * =========================================================发送消息=============================================
 */
async function SendMsg(message) {
  if (!message) return
  if (Notify > 0) {
    if ($.isNode()) {
      let notify = require('./sendNotify')
      await notify.sendNotify($.name, message)
    } else {
      // $.msg(message);
      $.msg($.name, '', message)
    }
  } else {
    console.log(message)
  }
}
/**
 * =====================================================双平台log输出==========================================
 */
function DoubleLog(data) {
  if ($.isNode()) {
    if (data) {
      console.log(`${data}`)
      msg += `\n${data}`
    }
  } else {
    console.log(`${data}`)
    msg += `\n${data}`
  }
}
