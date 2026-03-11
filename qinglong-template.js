/**
 * 青龙脚本模板
 * 描述: 通用青龙脚本模板
 * Author: Template
 * Date: 2026-03-09
 * cron "0 0 * * *" template.js
 * export TEMPLATE_COOKIE = cookie_value     多账号换行或者#分隔
 */
// ============================================================================================================
const Env = require('./utils/env')
const $ = new Env('青龙脚本模板')
const axios = require('axios')
const { wait, sjwait, getTimestamp, httpRequest } = require('./utils/common')
const env_name = 'TEMPLATE_COOKIE' // 环境变量名字
const env = process.env[env_name] || '' // 获取环境变量
const Notify = 1 // 是否通知, 1通知, 0不通知. 默认通知
const debug = 0 // 是否调试, 1调试, 0不调试. 默认不调试
let scriptVersionNow = "1.0.0"; // 脚本版本号
let msg = "";

// ======================================异步顺序==============================================
!(async () => {
    await main(); // 主函数
    await SendMsg(msg); // 发送通知

})()
    .catch((e) => $.logErr(e))
    .finally(() => $.done());

//==================================脚本入口函数main()==============================================================
async function main() {
    if (env == '') {
        // 没有设置变量,直接退出
        console.log(`没有填写变量,请查看脚本说明: ${env_name}`)
        return
    }
    let user_ck = env.split('\n')
    DoubleLog(`\n========== 共找到 ${user_ck.length} 个账号 ==========`);
    let index = 1 // 用来给账号标记序号, 从1开始
    for (let ck of user_ck) {
        if (!ck) continue // 跳过空行
        let user = {
            index: index,
            cookie: ck,
        }
        index = index + 1 // 每次用完序号+1
        // 开始账号任务
        await userTask(user)
        // 每个账号之间等1~5秒随机时间
        let rnd_time = Math.floor(Math.random() * 4000) + 1000
        console.log(`账号[${user.index}]随机等待${rnd_time / 1000}秒...`)
        await $.wait(rnd_time)
    }
}

// ======================================开始任务=========================================
async function userTask(user) {
    console.log(`\n============= 账号[${user.index}]开始任务 =============`)
    try {
        // 这里添加具体任务逻辑
        // 例如：签到、领取奖励、执行操作等
        await exampleTask(user);
    } catch (error) {
        DoubleLog(`账号[${user.index}]任务执行出错: ${error.message}`);
    }
}

// 示例任务
async function exampleTask(user) {
    try {
        let urlObject = {
            method: 'get',
            url: 'https://api.example.com/task',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
                'Cookie': user.cookie,
            }
        };

        let { data: result} = await axios.request(urlObject)
        if (result?.ok == true || result?.code == 0) {
            DoubleLog(`🌸账号[${user.index}]任务执行成功🎉`);
        } else {
            DoubleLog(`🌸账号[${user.index}]任务执行失败:${result?.message || result?.text}❌`);
        }

    } catch (e) {
        if (e.response) {
            DoubleLog(`🌸账号[${user.index}]任务HTTP错误:${e.response.status} - ${e.response.statusText}❌`);
        } else {
            DoubleLog(`🌸账号[${user.index}]任务网络错误:${e.message}❌`);
        }
    }
}

/**
 * =========================================================发送消息=============================================
 */
async function SendMsg(message) {
    if (!message) return;
    if (Notify > 0) {
        if ($.isNode()) {
            try {
                var notify = require("./utils/sendNotify");
                await notify.sendNotify($.name, message);
            } catch (e) {
                console.log("发送通知失败:", e.message);
            }
        } else {
            $.msg($.name, '', message)
        }
    } else {
        console.log(message);
    }
}

/**
 * =====================================================双平台log输出==========================================
 */
function DoubleLog(data) {
    if ($.isNode()) {
        if (data) {
            console.log(`${data}`);
            msg += `\n${data}`;
        }
    } else {
        console.log(`${data}`);
        msg += `\n${data}`;
    }
}
