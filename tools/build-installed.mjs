// DocSuite 安装式插件构建脚本（无外部依赖，v2）
// 读 src/host.js + src/client.js（动态插件源码快照），精确切片 + 改写为安装式插件产物。
// 关键锚点：
//   host  源码 = 注释头 + "return {\n  apply(ctx) {\n    const fs = ..." + <业务体> + "  },\n}"
//         业务体 = 从 "const fs = ctx.get('fs')" 到 尾部最后一个 "    register('docsuite/ppt/export', ...)" 行之后、
//                  再到 "    let disposed = false" 之前的整段。
//   client 源码 = 注释头 + "return {\n  apply(ctx) {\n    const slots = ..." + <业务体> + "  },\n}"
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const read = (f) => readFileSync(join(here, f), 'utf8')
const write = (f, c) => { mkdirSync(dirname(join(here, f)), { recursive: true }); writeFileSync(join(here, f), c) }

// ============ HOST ============
const hostSrc = read('src/host.js')

// 定位业务体：跳过 apply(ctx) 内的 DSH 服务获取段（骨架已注入），从第一个业务函数开始
const HOST_BODY_MARK = 'function collectText('
const hostBodyStart = hostSrc.indexOf(HOST_BODY_MARK)
if (hostBodyStart < 0) throw new Error('host.js 未找到业务体起点标记 (collectText)')

// 终点：最后一个 register 调用（"register('docsuite/ppt/export'"）所在行之后
//（register 调用段必须保留给骨架尾部的 register 定义；cleanups/register/dispose 由骨架提供）
const HOST_REG_LAST = "register('docsuite/ppt/export'"
const hostRegIdx = hostSrc.lastIndexOf(HOST_REG_LAST)
if (hostRegIdx < 0) throw new Error('host.js 未找到 ppt/export 注册标记')
const hostRegLineEnd = hostSrc.indexOf('\n', hostRegIdx)
let hostBody = hostSrc.slice(hostBodyStart, hostRegLineEnd + 1)

// 去掉 src 自带的 cleanups/register 定义段（骨架尾部已提供同名定义）
hostBody = hostBody.replace(/    const cleanups = \[\]\n/, '')
hostBody = hostBody.replace(/    const register = \(method, handler\) => \{\n      try \{ const dispose = harness\.handle\(method, handler\); if \(typeof dispose === 'function'\) cleanups\.push\(dispose\) \} catch \(e\) \{ console\.log\('\[docsuite\] handle register failed:', method, String\(\(e && e\.message\) \|\| e\)\) \}\n    \}\n/, '')

// 骨架（含 Node 兼容层）
const HOST_PRELUDE = `// DocSuite 文档工坊 — 安装式 link 插件（host）
// 由 build.mjs 从 src/host.js 机械生成；改业务逻辑请改 src/host.js 后重新 build。
import { readFile, writeFile, readdir, stat as fsStat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { join } from 'node:path'
import os from 'node:os'

const execAsync = promisify(exec)

// ---- Node 原生兼容层（替代 DSH 的 ctx.get('fs'|'shell'|'subprocess'|'web')）----
const fsLocal = {
  async resolve(p) { const displayPath = String(p); return { targetKey: displayPath, displayPath } },
  async stat(target) {
    try {
      const p = typeof target === 'string' ? target : target.targetKey
      const st = await fsStat(p)
      return { version: null, type: st.isDirectory() ? 'directory' : 'file', size: st.size }
    } catch (e) { return undefined }
  },
  async readText(target) {
    const p = typeof target === 'string' ? target : target.targetKey
    return await readFile(p, 'utf8')
  },
  async readBytes(target, signal, maxBytes) {
    const p = typeof target === 'string' ? target : target.targetKey
    const raw = await readFile(p)
    if (maxBytes && raw.length > maxBytes) throw new Error('FS_TOO_LARGE')
    return raw
  },
  async writeText(target, content) {
    const p = typeof target === 'string' ? target : target.targetKey
    await writeFile(p, content, 'utf8')
  },
  async listDir(target) {
    const p = typeof target === 'string' ? target : target.targetKey
    const names = await readdir(p)
    const out = []
    for (const name of names) {
      const child = join(p, name)
      let isDir = false
      try { isDir = (await fsStat(child)).isDirectory() } catch (e) {}
      out.push({ name, type: isDir ? 'directory' : 'file', target: { targetKey: child, displayPath: child } })
    }
    return out
  },
}
const shellLocal = {
  resolve({ command, env, timeoutMs, cwd }) { return { command, env, timeoutMs, cwd } },
  async run(spec) {
    try {
      const opts = { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
      if (spec.timeoutMs) opts.timeout = spec.timeoutMs
      if (spec.cwd) opts.cwd = spec.cwd
      if (spec.env) opts.env = Object.assign({}, process.env, spec.env)
      const { stdout, stderr } = await execAsync(spec.command, opts)
      return { exitCode: 0, code: 0, stdout: { text: String(stdout || '') }, stderr: { text: String(stderr || '') } }
    } catch (e) {
      return { exitCode: (e && e.code != null) ? e.code : 1, code: (e && e.code) || 1, stdout: { text: String((e && e.stdout) || '') }, stderr: { text: String((e && e.stderr) || (e && e.message) || '') } }
    }
  },
}
const subprocessLocal = {
  async resolveExecutable(name) {
    const found = findInPath(name)
    if (found) return found
    throw new Error('not found: ' + name)
  },
}
function findInPath(name) {
  const pathext = (process.env.PATHEXT || '.EXE;.CMD;.BAT;.COM').split(';')
  const dirs = (process.env.PATH || '').split(';')
  for (const d of dirs) {
    if (!d) continue
    for (const ext of ['', ...pathext]) {
      const c1 = join(d, name + ext.toLowerCase())
      if (existsSync(c1)) return c1
      const c2 = join(d, name + ext)
      if (existsSync(c2)) return c2
    }
  }
  return null
}
const webLocal = {
  async search() { return { sources: [], content: '' } },
  async fetch({ url }) {
    const res = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0' } })
    const text = await res.text()
    return { statusCode: res.status, body: { kind: 'html', content: text } }
  },
}

export const name = 'docsuite'
export const inject = ['webServer']

export function apply(ctx) {
  const fs = fsLocal
  const shell = shellLocal
  const subprocess = subprocessLocal
  const web = webLocal
  // llm 服务：启动时 base bundle 的 llm 可能尚未激活，业务体全部在请求处理时才用 llm，
  // 因此惰性解析——每个守卫/调用点重新 ctx.get('llm')，首次成功即缓存到 llm。
  let llm = null
  const llmResolve = () => {
    try { const s = (ctx && typeof ctx.get === 'function') ? ctx.get('llm') : undefined; llm = s || null } catch (e) { llm = null }
    return llm
  }
  const agentDefaultModel = null
  // 数据目录：优先环境变量 DOCSUITE_DATA_ROOT；否则用 cwd（DSH 启动目录即工作区根）。
  // 注意：不用 DSH_HOME（它是用户配置目录，不是工作区根）。
  const envRoot = process.env.DOCSUITE_DATA_ROOT
  const sandboxPolicy = { workspaceRoot: envRoot || process.cwd() }
  const workspaceRoot = envRoot || process.cwd()

  // 业务体顶层变量（src/host.js apply 顶部定义，搬移时补齐）
  const joinPath = (...parts) => {
    const out = []
    for (const p of parts) { const s = String(p == null ? '' : p); if (s) out.push(s.replace(/[\\\\/]+$/g, '')) }
    return out.join('\\\\')
  }
  let rootDir = workspaceRoot ? joinPath(workspaceRoot, '.docsuite-data') : '.docsuite-data'
  let CONFIG_PATH = joinPath(rootDir, 'config.json')
  const DEFAULT_CONFIG = { version: 1, dataDir: rootDir, language: 'zh', pptTheme: 'ocean', model: { mode: 'dsh', customApi: { baseUrl: '', apiKey: '', model: '' } }, scanDirs: [] }
  const CATEGORIES = ['导航定位', '推进动力', '通信遥测', '能源电池', '水密耐压', '作业工具', '通用设备', '其他']
  const DOC_KINDS = ['tech', 'research', 'bid', 'test']
  const KIND_NAMES = { tech: '技术方案', research: '调研报告', bid: '投标技术文件', test: '机器人测试方案' }
  const PPT_THEME_KEYS = ['ocean', 'tech', 'dark', 'light']

  // harness 兼容：handle() 注册到方法表，由 webServer 前缀路由分发
  const routeHandlers = new Map()
  const harness = {
    handle(method, handler) { routeHandlers.set(method, handler); return () => routeHandlers.delete(method) },
  }
  const dispatch = async (req, res) => {
    try {
      const url = new URL(req.url || '/', 'http://localhost')
      // 路由路径 /docsuite/<method>（注意：/api/* 被 DSH api-gateway 占用，必须避开 /api 前缀）
      const method = decodeURIComponent(url.pathname.replace(/^\\//, '').replace(/\\/+$/, ''))
      const handler = routeHandlers.get(method)
      if (!handler) {
        res.statusCode = 404
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(JSON.stringify({ ok: false, message: '未知方法: ' + method }))
        return
      }
      let args = {}
      if (req.method === 'POST' || req.method === 'PUT') {
        const chunks = []
        for await (const c of req) chunks.push(c)
        const body = Buffer.concat(chunks).toString('utf8')
        if (body) { try { args = JSON.parse(body) } catch (e) { args = {} } }
      } else if (url.searchParams.has('args')) {
        try { args = JSON.parse(url.searchParams.get('args')) } catch (e) { args = {} }
      }
      const result = await handler(args)
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.setHeader('Cache-Control', 'no-store')
      res.end(JSON.stringify(result === undefined ? { ok: true } : result))
    } catch (e) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify({ ok: false, message: String((e && e.message) || e) }))
    }
  }
  let disposeRouteFn = null
  try {
    disposeRouteFn = ctx.webServer.register({ kind: 'prefix', path: '/docsuite', handler: dispatch })
  } catch (e) {
    console.error('[docsuite] register prefix route failed:', String((e && e.message) || e))
  }

  // ============ 以下为从 src/host.js 搬移的业务逻辑 ============

  // register 定义必须在业务体的 register 调用之前（业务体 42 个调用直接使用）
  const cleanups = []
  const register = (method, handler) => {
    try { const dispose = harness.handle(method, handler); if (typeof dispose === 'function') cleanups.push(dispose) } catch (e) { console.log('[docsuite] handle register failed:', method, String((e && e.message) || e)) }
  }

`

// 尾部：业务体结束后的清理
const HOST_FOOTER = `
  // ============ 业务逻辑结束 ============
`

const HOST_CLOSE = `
  let disposed = false
  const cleanup = () => {
    if (disposed) return
    disposed = true
    // 路由销毁必须放在 cleanup 里（仅在 fiber 销毁时执行），不能立即调用——否则路由刚注册就被注销。
    try { if (disposeRouteFn) disposeRouteFn() } catch (e) {}
    for (const d of cleanups) { try { d() } catch (e) {} }
  }
  // Cordis 的 ctx.effect 会立即执行回调并把返回值作为销毁器（对照 dsh-deepseek-billing 的
  // ctx.effect(() => ctx.webServer.register(...)) 模式）。这里传 (() => cleanup)，
  // 让 cleanup 仅在 fiber 销毁时执行一次；直接传 cleanup 会被立即执行并清空全部 handler。
  ctx.effect(() => cleanup)
  return cleanup
}
`

const hostOut = HOST_PRELUDE + hostBody + HOST_FOOTER + HOST_CLOSE
write('lib/index.js', hostOut)
console.log('[build] host: lib/index.js 生成 (' + hostOut.split('\\n').length + ' 行)')

// ============ CLIENT ============
const clientSrc = read('src/client.js')
// 业务体起点：跳过 src 自带的 stripUndefined/rpc 定义（骨架已提供 fetch 版），从 disposeCss 开始
const CLIENT_BODY_MARK = 'const disposeCss = styles.insert('
const clientBodyStart = clientSrc.indexOf(CLIENT_BODY_MARK)
if (clientBodyStart < 0) throw new Error('client.js 未找到业务体起点标记 (disposeCss)')
const clientDisposedIdx = clientSrc.lastIndexOf('slots.inject(')
if (clientDisposedIdx < 0) throw new Error('client.js 未找到 slots.inject 标记')
let clientBody = clientSrc.slice(clientBodyStart, clientDisposedIdx)
const clientTail = clientSrc.slice(clientDisposedIdx, clientSrc.lastIndexOf('return () => { disposeCss() }'))

// 剥离 src 自带的 stripUndefined/rpc 定义（骨架已提供 fetch 版；避免重复声明与递归）
clientBody = clientBody.replace(/    function stripUndefined\(v\) \{[\s\S]*?\n    \}\n/, '')
clientBody = clientBody.replace(/    function rpc\(method, args\) \{\n      const clean = args === undefined \? undefined : stripUndefined\(args\)\n      return host\.call\(method, clean\)\n    \}\n/, '')

const CLIENT_PRELUDE = `// DocSuite 文档工坊 — 安装式 link 插件（client）
// 由 build.mjs 从 src/client.js 机械生成。
window.__ModuleLoader__.load({
  id: 'docsuite',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    var react = require('react');
    var React = react;
    var el = react.createElement;
    // CSS 注入（对照 dsh-deepseek-billing 的 lib/client.js 模式：直接创建 <style> 挂到
    // document.head，带去重 data-plugin-css；销毁时移除）。动态插件时代的 styles 服务
    // 在安装式 client 里不存在，必须自己注入，否则页面只有文字没有样式。
    var styles = {
      insert: function (css, tagId) {
        var id = tagId || 'docsuite-css';
        if (typeof document !== 'undefined' && document.querySelector('style[data-plugin-css="' + id + '"]') === null) {
          var tag = document.createElement('style');
          tag.dataset.plugin = 'docsuite';
          tag.dataset.pluginCss = id;
          tag.textContent = css;
          document.head.appendChild(tag);
        }
        return function () {
          if (typeof document !== 'undefined') {
            var t = document.querySelector('style[data-plugin-css="' + id + '"]');
            if (t) t.remove();
          }
        };
      }
    };

    function stripUndefined(v) {
      if (v === undefined) return null;
      if (v === null) return null;
      if (Array.isArray(v)) { var out = []; for (var i = 0; i < v.length; i++) out.push(stripUndefined(v[i])); return out; }
      if (typeof v === 'object') { var out = {}; for (var k of Object.keys(v)) { if (v[k] === undefined) continue; out[k] = stripUndefined(v[k]); } return out; }
      return v;
    }
    function rpc(method, args) {
      // 业务体传入的 method 已含 'docsuite/' 前缀（全部调用都是 rpc('docsuite/xxx')），
      // 不能再拼一次 /docsuite/（否则变成 /docsuite/docsuite/... 404）。带 '/' 的按完整路径。
      var url = method.indexOf('/') >= 0 ? '/' + method : '/docsuite/' + method;
      return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args === undefined ? {} : stripUndefined(args)),
      }).then(function (r) { return r.json(); });
    }

    // host.call 兼容（业务体里可能残留的调用会走 rpc）
    var host = { call: function (method, args) { return rpc(method, args); } };

    function applyClient(ctx) {
      var slots = ctx && ctx.slots;
      if (!slots || typeof slots.inject !== 'function' || typeof slots.register !== 'function') {
        console.warn('[docsuite] slots 服务不可用，跳过槽位注入');
        return;
      }
      // 业务体使用 slots.inject / slots.register，注入上下文闭包变量
`

const CLIENT_MID = `
    }

    exports.name = 'docsuite';
    exports.inject = ['slots'];
    exports.apply = function apply(ctx) { applyClient(ctx); };
    return module.exports;
  }
});
`

const clientOut = CLIENT_PRELUDE + clientBody + '\n' + clientTail + CLIENT_MID
write('lib/client.js', clientOut)
console.log('[build] client: lib/client.js 生成 (' + clientOut.split('\n').length + ' 行)')

console.log('[build] 完成')
