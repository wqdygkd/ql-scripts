import process from 'node:process'
import 'dotenv/config'

import ky from 'ky'
import { FlatCache } from 'flat-cache';
const cache = new FlatCache();

console.log(process.env.IKUUU)
const str = process.env.IKUUU
const regex = /(email|pass)=((?:(?!email=|pass=).)+?)(?=,email=|,pass=|$)/g

// 提取结果存储对象
const result = { emails: [], passwords: [] };

let match;
while ((match = regex.exec(str)) !== null) {
  const [_, key, value] = match;
  if (key === 'email') {
    result.emails.push(value);
  } else if (key === 'pass') {
    result.passwords.push(value);
  }
}

// 输出结果
console.log(result.emails);
console.log(result.passwords);

async function getIkuuuHost() {
    if (process.env.IKUUU_ORIGIN)
        return process.env.IKUUU_ORIGIN.replace(/\/$/, '')
    let host = 'https://ikuuu.club1'
    try {
        const html = await ky('https://ikuuu.club');
        host = /<p><a href="(https:\/\/[^"]+)\/?"/g.exec(html.body)?.[1] || host;
    }
    catch (e) {
        console.error(e.message);
    }
    return host.replace(/\/$/, '');
}
export async function signCheckIn(email, passwd) {
    const HOST = await getIkuuuHost()

    const url = {
        login: `${HOST}/auth/login`,
        checkin: `${HOST}/user/checkin`,
    };
    if (cache.get(`ikuuu_cookie_${email}`)) {
        return checkin(url.checkin, email);
    }
    try {
        const data = await ky.post(url.login, { json: {email, passwd}})
        let result = await data.json()

        if (result.ret === 1) {
            let cookie = data.headers.getSetCookie()

            cookie = cookie.map(d => d.split(';')[0]).join(';');
            console.log(data.msg || `登录成功！`);
            cache.set(`ikuuu_cookie_${email}`, cookie)
            cache.save();
        }
        else {
            console.log(data.msg || `登录失败！`, 'error');
            return;
        }
        return checkin(url.checkin, email);
    } catch (e) {
        console.error(e.message);
    }
}
async function checkin(url, email) {
    console.log('checkin url:', url);
    let cookie = cache.get(`ikuuu_cookie_${email}`)
    let data = await ky.post(url, {
        headers: {
            'Cookie': cookie
        }
    }).json()
    if (data.ret === 1 || String(data.msg).includes('签到过')) {
        console.log(`签到成功！${data.msg}`);
        return true;
    }
    else {
        console.log(`❌签到失败：${data.msg}`, isUseCache ? 'info' : 'error');
    }
    return false;
}

signCheckIn(result.emails[0], result.passwords[0])
