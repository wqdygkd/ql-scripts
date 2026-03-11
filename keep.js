/**
 * Keep奖牌
 * keep
 * 描述: 签到、抽奖、积分
 * Author: Mist
 * Date: 2026-02-6
 * cron "10 12 * * *" Keep.js
 * export Keep = Authorization     多账号换行或者#分隔
 */
// ============================================================================================================
const Env = require('./utils/env')
const $ = new Env('Keep奖牌')
const { ifError } = require('assert')
const axios = require('axios')
const md5 = require('md5')
const env_name = 'Keep' //环境变量名字
const env = process.env[env_name] || '' //获取环境变量
const Notify = 1//是否通知, 1通知, 0不通知. 默认通知
const debug = 0//是否调试, 1调试, 0不调试. 默认不调试
let scriptVersionNow = "1.0.0";//脚本版本号
let msg = "";
// ======================================异步顺序==============================================
!(async () => {
    //await getNotice();  //远程通知
    //await getVersion("yang7758258/ohhh154@main/mswefls.js");
    await main();//主函数
    await SendMsg(msg); //发送通知

})()
    .catch((e) => $.logErr(e))
    .finally(() => $.done());
//==================================脚本入口函数main()==============================================================
async function main() {
    if (env == '') {
        //没有设置变量,直接退出
        console.log(`没有填写变量,请查看脚本说明: ${env_name}`)
        return
    }
    let user_ck = env.split('\n')
    DoubleLog(`\n========== 共找到 ${user_ck.length} 个账号 ==========`);
    let index = 1 //用来给账号标记序号, 从1开始
    for (let ck of user_ck) {
        if (!ck) continue //跳过空行
        let ck_info = ck.split('&')
        let Authorization = ck_info[0]
        let user = {
            index: index,
            Authorization,
        }
        index = index + 1 //每次用完序号+1
        //开始账号任务
        await userTask(user)
        //每个账号之间等1~5秒随机时间
        let rnd_time = Math.floor(Math.random() * 4000) + 1000
        console.log(`账号[${user.index}]随机等待${rnd_time / 1000}秒...`)
        await $.wait(rnd_time)
    }
}
// ======================================开始任务=========================================
async function userTask(user) {
    console.log(`\n============= 账号[${user.index}]开始任务 =============`)
    await Sign (user)
    await collect(user)

    // 初始化用户积分
    user.point = 0
    user.data = null

    try {
        // 先获取用户当前积分
        await GetUserPoint(user);

        // 如果积分足够，进行抽奖
        if (user.point >= 15) {
            try {
                await draw(user); // 第一次抽奖
                await wait(1); // 等待1秒

                // 继续抽奖直到剩余积分少于15
                while (user.point >= 15) {
                    try {
                        await GetUserPoint(user); // 重新获取积分
                        if (user.point >= 15) {
                            await draw(user);
                            await wait(1); // 每次抽奖后等待1秒
                        } else {
                            break; // 积分不足时跳出循环
                        }
                    } catch (error) {
                        console.log(`账号[${user.index}]抽奖过程出错: ${error.message}`);
                        break; // 出现错误时跳出循环
                    }
                }
            } catch (error) {
                DoubleLog(`账号[${user.index}]首次抽奖失败: ${error.message}`);
            }
        } else {
            DoubleLog(`🌸账号[${user.index}]积分不足15,跳过抽奖`);
        }

        // 最后再次获取积分显示结果
        await GetUserPoint(user);

    } catch (error) {
        DoubleLog(`账号[${user.index}]任务执行出错: ${error.message}`);
    }
}
// =============================================================================================================================
//签到
async function Sign(user) {
    try {
        let urlObject = {
            method: 'get',
            url: 'https://api.gotokeep.com/shadow-webapp/shadow/signIn/userSignIn?actId=67fce2c430a68900015cdd16&signInId=698168dc69f2d100013bc425',
            headers: {
                'Host': 'api.gotokeep.com',
                'content-type': 'application/json',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 MicroMessenger/7.0.20.1781(0x6700143B) NetType/WIFI MiniProgramEnv/Windows WindowsWechat/WMPF WindowsWechat(0x63090a13) UnifiedPCWindowsWechat(0xf2541022) XWEB/16467',
                'authorization': user.Authorization,
            }
        };

        let { data: result} = await axios.request(urlObject)
        // 成功情况
        if (result?.ok == true) {
            DoubleLog(`🌸账号[${user.index}]` + `🕊签到状态${result.text}🎉`);
        } else {
            // 失败情况 - 检查是否是已签到
            if (result?.errorCode === 100100 && result?.text === '签到记录已经存在') {
                DoubleLog(`🌸账号[${user.index}]今日已签到，无需重复签到✅`);
            } else {
                DoubleLog(`🌸账号[${user.index}]签到失败:${result.text} (错误码:${result?.errorCode})❌`);
            }
        }

    } catch (e) {
        // HTTP错误响应处理
        if (e.response) {
            if (e.response.status === 400) {
                const errorData = e.response.data;
                // 精确匹配已签到错误（服务器返回400时）
                if (errorData?.errorCode === 100100 && errorData?.text === '签到记录已经存在') {
                    DoubleLog(`🌸账号[${user.index}]今日已签到，无需重复签到✅`);
                    return; // 正常返回，不视为错误
                } else {
                    DoubleLog(`🌸账号[${user.index}]签到错误:${errorData?.text || '未知错误'} (错误码:${errorData?.errorCode})❌`);
                }
            } else {
                DoubleLog(`🌸账号[${user.index}]签到HTTP错误:${e.response.status} - ${e.response.statusText}❌`);
            }
        } else {
            // 网络错误
            DoubleLog(`🌸账号[${user.index}]签到网络错误:${e.message}❌`);
        }
        // 注意：这里不抛出异常，让程序继续执行
    }
}
//领取积分
async function collect(user) {
    try {
        let urlObject = {
            method: 'post',
            url: `https://api.gotokeep.com/shadow-webapp/assetUser/collect?platform=MP-WEIXIN`,
            headers: {
                'Host': 'api.gotokeep.com',
                'content-type': 'application/json',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36 MicroMessenger/7.0.20.1781(0x6700143B) NetType/WIFI MiniProgramEnv/Windows WindowsWechat/WMPF WindowsWechat(0x63090b11) XWEB/9129',
                'Authorization': user.Authorization,
            },
            data:{
                "collectType": "all",
                "recordId": ""
            }

        }
        //
        let { data: result} = await axios.request(urlObject)
        //console.log(urlObject);
        //console.log(result);
        if (result?.ok == true) {
            //打印签到结果
            DoubleLog(`🌸账号[${user.index}]` + `🕊积分领取${result.data}🎉`);
        }else {
            DoubleLog(`🌸账号[${user.index}]积分领取:${result.data}❌`)
        }
    } catch (e) {
        //打印错误信息
        console.log(e.response.data);
    }
}


//抽奖
async function draw(user) {
    try {
        let urlObject = {
            method: 'get',
            url: 'https://api.gotokeep.com/shadow-webapp/shadow/draw/doDraw?actId=67fce2c430a68900015cdd16&drawId=6931468e3c246b00013d8462&platform=MP-WEIXIN',
            headers: {
                'Host': 'api.gotokeep.com',
                'content-type': 'application/json',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 MicroMessenger/7.0.20.1781(0x6700143B) NetType/WIFI MiniProgramEnv/Windows WindowsWechat/WMPF WindowsWechat(0x63090a13) UnifiedPCWindowsWechat(0xf2541022) XWEB/16467',
                'authorization': user.Authorization,
            }
        };

        let { data: result} = await axios.request(urlObject)
        // 成功情况
        if (result?.ok == true) {
            DoubleLog(`🌸账号[${user.index}]` + `🕊抽奖成功-获得${result.data.drawSuccessContext}🎉`);
        } else {
            // 失败情况
            DoubleLog(`🌸账号[${user.index}]抽奖失败:${result.text} (错误码:${result?.errorCode})❌`);
        }

    } catch (e) {
        // HTTP错误响应处理
        if (e.response) {
            if (e.response.status === 400) {
                const errorData = e.response.data;
                // 精确匹配积分不足错误
                if (errorData?.errorCode === 289330 && errorData?.text === '资产不足以抽奖') {
                    DoubleLog(`🌸账号[${user.index}]积分不足，无法抽奖❌`);
                    return; // 正常返回，不视为错误
                } else {
                    DoubleLog(`🌸账号[${user.index}]抽奖错误:${errorData?.text || '未知错误'} (错误码:${errorData?.errorCode})❌`);
                }
            } else {
                DoubleLog(`🌸账号[${user.index}]抽奖HTTP错误:${e.response.status} - ${e.response.statusText}❌`);
            }
        } else {
            // 网络错误
            DoubleLog(`🌸账号[${user.index}]抽奖网络错误:${e.message}❌`);
        }
        // 注意：这里不抛出异常，让程序继续执行
    }
}

//获取用户积分
async function GetUserPoint(user) {
    try {
        let urlObject = {
            method: 'get',
            url: 'https://api.gotokeep.com/shadow-webapp/assetUser/account/detail?assetType=vitality_coin',
            headers: {
                'Host': 'api.gotokeep.com',
                'content-type': 'application/json',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36 MicroMessenger/7.0.20.1781(0x6700143B) NetType/WIFI MiniProgramEnv/Windows WindowsWechat/WMPF WindowsWechat(0x63090b11) XWEB/9129',
                "Authorization":user.Authorization,
            },

        };
        //console.log(urlObject);
        let { data: result} = await axios.request(urlObject)
        if (result?.errorCode === 0 || result?.errorCode === "0") {
            //打印签到结果
            DoubleLog(`🌸账号[${user.index}]` + `当前积分[${result.data.availableAmount}]💰`);
            user.point = result.data.availableAmount;
        }else{
            DoubleLog(`🌸账号[${user.index}]积分查询失败:${result.data}❌`)
            user.msg = result.data
            throw new Error(result.data); // 失败时抛出错误
        }

    } catch (e) {
        //打印错误信息
            console.log('以下是报错输出：');
            console.log(e.response.data);
            throw e;
    }
}
/**
 * =========================================================发送消息=============================================
 */
async function SendMsg(message) {
    if (!message) return;
    if (Notify > 0) {
        if ($.isNode()) {
            var notify = require("./utils/sendNotify");
            await notify.sendNotify($.name, message);
        } else {
            // $.msg(message);
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
/**
* ======================================================等待 X 秒============================================
*/
function wait(n) {
    return new Promise(function (resolve) {
        setTimeout(resolve, n * 1000);
    });
}
/**
* ======================================================随机等待 1-5 秒============================================
*/
function sjwait() {
    return new Promise(function (resolve) {
        let waitTime = Math.floor(Math.random() * 4000 + 1000);
        setTimeout(resolve, waitTime);
    });
}
// ==========================================================13位时间戳=====================================================
function getTimestamp() {
    return new Date().getTime();
}
//===============================================网络请求httpRequest=========================================
function httpRequest(options, timeout = 1 * 1000) {
    method = options.method ? options.method.toLowerCase() : options.body ? "post" : "get";
    return new Promise(resolve => {
        setTimeout(() => {
            $[method](options, (err, resp, data) => {
                try {
                    if (err) {
                        console.log(JSON.stringify(err));
                        $.logErr(err);
                    } else {
                        try { data = JSON.parse(data); } catch (error) { }
                    }
                } catch (e) {
                    console.log(e);
                    $.logErr(e, resp);
                } finally {
                    resolve(data);
                }
            })
        }, timeout)
    })
}
//==============================================Debug模式===============================================
function debugLog(...args) {
    if (debug) {
        console.log(...args);
    }
}
//===============================================获取远程通知========================================
async function getNotice() {
    try {
        const urls = [
            "https://gitee.com/ohhhooh/jd_haoyangmao/raw/master/Notice.json",

        ];
        let notice = null;
        for (const url of urls) {
            const options = { url, headers: { "User-Agent": "" }, };
            const result = await httpRequest(options);
            if (result && "notice" in result) {
                notice = result.notice.replace(/\\n/g, "\n");
                break;
            }
        }
        if (notice) { $.DoubleLog(notice); }
    } catch (e) {
        console.log(e);
    }
}
//==============================================获取远程版本=================================================
function getVersion(scriptUrl, timeout = 3 * 1000) {
    return new Promise((resolve) => {
        const options = { url: `https://fastly.jsdelivr.net/gh/${scriptUrl}` };
        $.get(options, (err, resp, data) => {
            try {
                const regex = /scriptVersionNow\s*=\s*(["'`])([\d.]+)\1/;
                const match = data.match(regex);
                const scriptVersionLatest = match ? match[2] : "";
                console.log(`\n============= 当前版本：${scriptVersionNow} 🌟 最新版本：${scriptVersionLatest} =============`);
            } catch (e) {
                $.logErr(e, resp);
            }
            resolve();
        }, timeout);
    });
}
