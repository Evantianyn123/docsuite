# DocSuite 文档工坊

> **可安装包（2026-11-03 起）**：本仓库同时是一个可直接安装的 DSH 插件包。在 DSH 侧边栏
> **插件 → 添加插件** 里填 `git+https://github.com/Evantianyn123/docsuite.git` 即可安装；
> 安装时由 `prepare` 钩子自动执行 `node build.mjs`，从 `src/` 生成 `lib/`，所以仓库里不需要提交构建产物。
> 也可以把 `npm pack` 出的 tgz 发给别人，或在插件页填本地绝对路径。
> 下文是动态插件时代的开发与版本管理说明。

水下机器人（ROV/AUV）技术文档工作台 —— DSH（DeepSeek Harness）动态 Cordis 插件。

- 知识库：说明书上传解析（PDF/Word/TXT）、AI 参数抽取、多型号拆分、网页抓取、OCR、全文检索、多型号对比
- 模板库：从历史报告自动学习章节结构与文风、手工模板编辑器
- 文档工坊：技术方案 / 调研报告 / 投标技术文件 / 机器人测试方案 四类文档交互式生成
- 投标增强：招标文件解析 → 需求响应矩阵 → 逐条 AI 应答 → 交货期推算时间节点
- 导出：Markdown / Word / HTML / PDF / PPTX（4 主题）

---

## 部署位置

本插件是 **DSH 动态 Cordis 插件**，源码以"不可变 Package"形式存放在 **DSH 运行时会话状态**中
（通过 `cordis_define` 定义，`cordis_inspect_self` 可读回，不占用磁盘源文件）。

| 项目 | 位置 |
|---|---|
| 插件源码（运行时） | DSH 会话状态，`cordis_inspect_self(docsu-1, pkg-N)` 读取 |
| 插件运行入口 | DSH 会话视图 → "DocSuite" 标签页（GUI http://127.0.0.1:3080） |
| 业务数据（默认） | `D:\01.Daily\DS_Harness\.docsuite-data\`（可经设置中心 → 迁移数据目录 搬走） |
| Python 工具链 | 数据目录 `scripts\` 下（`ingest_file.py` / `export_docx.py` / `export_pptx.py` / `ocr_file.py`） |

> ⚠️ 动态插件本身不落盘为独立项目文件。**本仓库就是它的源码版本库** —— 每次用
> `tools/export-source.js` 从运行时快照导出，git 提交即完成版本管理。

## 仓库结构

```
docsuite/
├── src/
│   ├── host.js          # 插件 Host 端源码（RPC 处理、数据层、Python 工具链）
│   └── client.js        # 插件 Client 端源码（DocSuite 界面，React.createElement 风格）
├── scripts/             # 内嵌 Python 工具脚本（从 host.js 还原，运行时自动写入数据目录）
│   ├── ingest_file.py   # 上传文件解析（pypdf / python-docx）
│   ├── export_docx.py   # Markdown → Word
│   ├── export_pptx.py   # 幻灯片 JSON → PPTX（4 主题）
│   └── ocr_file.py      # 扫描件 PDF → OCR 文本（PyMuPDF + RapidOCR）
├── tools/
│   ├── export-source.js # 源码导出脚本（快照 → src/ + scripts/）
│   └── pkg-12-snapshot.json # cordis_inspect_self 原始快照（存档）
└── docs/
    └── 开发计划书.md     # 需求确认与 M0–M5 里程碑开发计划
```

## 版本管理流程（推荐工作流）

插件在 DSH 里"活"着，仓库是它的版本快照。每次功能更新后同步一次：

```bash
# 1. 在 DSH 会话里把新版源码导出为快照文件（或由助手完成）
#    cordis_inspect_self(docsu-1, pkg-N) 结果保存为 tools/pkg-N-snapshot.json

# 2. 用导出脚本从快照生成可读源码
node tools/export-source.js tools/pkg-N-snapshot.json .

# 3. 提交
git add -A
git commit -m "feat: 新增 XXX（pkg-N）"
git tag pkg-N
git push origin main --tags
```

版本约定：**DSH 内包号 `pkg-N` ↔ git tag `pkg-N`**，一一对应，随时可回滚对照。

## 从仓库恢复到 DSH（重新部署）

1. 打开 DSH 会话，调用 `cordis_define`（kind: new，idPrefix 如 `docsu`）
2. 把 `src/host.js` 内容（去掉头部注释行）作为 `code.host`、`src/client.js` 作为 `code.client` 传入
3. 调用 `cordis_run` 激活 → 界面出现在 "DocSuite" 标签页
4. 首次使用在设置中心"初始化工具链"安装 Python 依赖（pypdf / python-docx / python-pptx）

> 数据目录中的知识库 / 模板 / 项目**不进 git**（属个人数据），恢复插件后数据仍在原目录，无需迁移。
