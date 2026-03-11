import process from 'node:process'
import fs from 'fs';
import path from 'path';
import got from 'got';
import { Cookie, CookieJar } from 'tough-cookie'
import iconvLite from 'iconv-lite';

/**
 * 固定 API 封装
 * Env 类的实现
 */

/**
 * =======================================================固定API======================================================
 */
function Env(t, e) {
  class s {
    constructor(t) {
      this.env = t
    }
    send(t, e = 'GET') {
      t = 'string' == typeof t ? { url: t } : t
      let s = this.get
      return (
        'POST' === e && (s = this.post),
        new Promise((e, a) => {
          s.call(this, t, (t, s, r) => {
            t ? a(t) : e(s)
          })
        })
      )
    }
    get(t) {
      return this.send.call(this.env, t)
    }
    post(t) {
      return this.send.call(this.env, t, 'POST')
    }
  }
  return new (class {
    constructor(t, e) {
      this.userList = []
      this.userIdx = 0
      this.name = t
      this.http = new s(this)
      this.data = null
      this.dataFile = 'cache.dat'
      this.logs = []
      this.isMute = !1
      this.isMuteLog = !1
      this.isNeedRewrite = !1
      this.logSeparator = '\n'
      this.encoding = 'utf-8'
      this.startTime = new Date().getTime()
      Object.assign(this, e)
      this.name && this.log('', `🔔${this.name},开始!`)
    }
    toObj(t, e = null) {
      try {
        return JSON.parse(t)
      } catch {
        return e
      }
    }
    toStr(t, e = null) {
      try {
        return JSON.stringify(t)
      } catch {
        return e
      }
    }
    getjson(t, e) {
      let s = e
      const a = this.getdata(t)
      if (a)
        try {
          s = JSON.parse(this.getdata(t))
        } catch {}
      return s
    }
    setjson(t, e) {
      try {
        return this.setdata(JSON.stringify(t), e)
      } catch {
        return !1
      }
    }
    loaddata() {
      ;((this.fs = this.fs ? this.fs : fs), (this.path = this.path ? this.path : path))
      const t = this.path.resolve(this.dataFile),
        e = this.path.resolve(process.cwd(), this.dataFile),
        s = this.fs.existsSync(t),
        a = !s && this.fs.existsSync(e)
      if (!s && !a) return {}
      {
        const a = s ? t : e
        try {
          return JSON.parse(this.fs.readFileSync(a))
        } catch (t) {
          return {}
        }
      }
    }
    writedata() {
      ;((this.fs = this.fs ? this.fs : fs), (this.path = this.path ? this.path : path))
      const t = this.path.resolve(this.dataFile),
        e = this.path.resolve(process.cwd(), this.dataFile),
        s = this.fs.existsSync(t),
        a = !s && this.fs.existsSync(e),
        r = JSON.stringify(this.data)
      s ? this.fs.writeFileSync(t, r) : a ? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r)
    }
    lodash_get(t, e, s) {
      const a = e.replace(/\[(\d+)\]/g, '.$1').split('.')
      let r = t
      for (const t of a) if (((r = Object(r)[t]), void 0 === r)) return s
      return r
    }
    lodash_set(t, e, s) {
      return Object(t) !== t
        ? t
        : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []),
          (e.slice(0, -1).reduce((t, s, a) => (Object(t[s]) === t[s] ? t[s] : (t[s] = Math.abs(e[a + 1]) >> 0 == +e[a + 1] ? [] : {})), t)[
            e[e.length - 1]
          ] = s),
          t)
    }
    getdata(t) {
      let e = this.getval(t)
      if (/^@/.test(t)) {
        const [, s, a] = /^@(.*?)\.(.*?)$/.exec(t),
          r = s ? this.getval(s) : ''
        if (r)
          try {
            const t = JSON.parse(r)
            e = t ? this.lodash_get(t, a, '') : e
          } catch (t) {
            e = ''
          }
      }
      return e
    }
    setdata(t, e) {
      let s = !1
      if (/^@/.test(e)) {
        const [, a, r] = /^@(.*?)\.(.*?)$/.exec(e),
          i = this.getval(a),
          o = a ? ('null' === i ? null : i || '{}') : '{}'
        try {
          const e = JSON.parse(o)
          ;(this.lodash_set(e, r, t), (s = this.setval(JSON.stringify(e), a)))
        } catch (e) {
          const i = {}
          ;(this.lodash_set(i, r, t), (s = this.setval(JSON.stringify(i), a)))
        }
      } else s = this.setval(t, e)
      return s
    }
    getval(t) {
      return ((this.data = this.loaddata()), this.data[t])
    }
    setval(t, e) {
      return ((this.data = this.loaddata()), (this.data[e] = t), this.writedata(), !0)
    }
    initGotEnv(t) {
      ;((this.got = this.got ? this.got : got),
        (this.ckjar = this.ckjar ? this.ckjar : new CookieJar()),
        t && ((t.headers = t.headers ? t.headers : {}), void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar)))
    }
    get(t, e = () => {}) {
      t.headers &&
        (delete t.headers['Content-Type'],
        delete t.headers['Content-Length'],
        delete t.headers['content-type'],
        delete t.headers['content-length'])
      let s = iconvLite
      ;(this.initGotEnv(t),
        this.got(t)
          .on('redirect', (t, e) => {
            try {
              if (t.headers['set-cookie']) {
                const s = t.headers['set-cookie'].map(Cookie.parse).toString()
                ;(s && this.ckjar.setCookieSync(s, null), (e.cookieJar = this.ckjar))
              }
            } catch (t) {
              this.logErr(t)
            }
          })
          .then(
            (t) => {
              const { statusCode: a, statusCode: r, headers: i, rawBody: o } = t,
                n = s.decode(o, this.encoding)
              e(null, { status: a, statusCode: r, headers: i, rawBody: o, body: n }, n)
            },
            (t) => {
              const { message: a, response: r } = t
              e(a, r, r && s.decode(r.rawBody, this.encoding))
            }
          ))
    }
    post(t, e = () => {}) {
      const s = t.method ? t.method.toLocaleLowerCase() : 'post'
      t.body &&
        t.headers &&
        !t.headers['Content-Type'] &&
        !t.headers['content-type'] &&
        (t.headers['content-type'] = 'application/x-www-form-urlencoded')
      t.headers && (delete t.headers['Content-Length'], delete t.headers['content-length'])
      let a = iconvLite
      this.initGotEnv(t)
      const { url: r, ...i } = t
      this.got[s](r, i).then(
        (t) => {
          const { statusCode: s, statusCode: r, headers: i, rawBody: o } = t,
            n = a.decode(o, this.encoding)
          e(null, { status: s, statusCode: r, headers: i, rawBody: o, body: n }, n)
        },
        (t) => {
          const { message: s, response: r } = t
          e(s, r, r && a.decode(r.rawBody, this.encoding))
        }
      )
    }
    time(t, e = null) {
      const s = e ? new Date(e) : new Date()
      let a = {
        'M+': s.getMonth() + 1,
        'd+': s.getDate(),
        'H+': s.getHours(),
        'm+': s.getMinutes(),
        's+': s.getSeconds(),
        'q+': Math.floor((s.getMonth() + 3) / 3),
        S: s.getMilliseconds()
      }
      ;/(y+)/.test(t) && (t = t.replace(RegExp.$1, (s.getFullYear() + '').substr(4 - RegExp.$1.length)))
      for (let e in a)
        new RegExp('(' + e + ')').test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? a[e] : ('00' + a[e]).substr(('' + a[e]).length)))
      return t
    }
    queryStr(t) {
      let e = ''
      for (const s in t) {
        let a = t[s]
        null != a && '' !== a && ('object' == typeof a && (a = JSON.stringify(a)), (e += `${s}=${a}&`))
      }
      return ((e = e.substring(0, e.length - 1)), e)
    }
    msg(e = t, s = '', a = '', r) {
      if (!this.isMuteLog) {
        let t = ['', '==============📣系统通知📣==============']
        ;(t.push(e), s && t.push(s), a && t.push(a), console.log(t.join('\n')), (this.logs = this.logs.concat(t)))
      }
    }
    log(...t) {
      ;(t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)))
    }
    logErr(t, e) {
      this.log('', `❗️${this.name},错误!`, t.stack)
    }
    wait(t) {
      return new Promise((e) => setTimeout(e, t))
    }

    done(t = {}) {
      const e = new Date().getTime(),
        s = (e - this.startTime) / 1e3
      this.log('', `🔔${this.name},结束!🕛${s}秒`)
      this.log()
      process.exit(1)
    }
  })(t, e)
}

export default Env
