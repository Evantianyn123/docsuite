# AGENTS.md

本文件给所有在本工作区工作的 Agent 看的硬性约定。**优先级高于“把上下文读全”的默认倾向。**

---

## 1. 知识库：禁止全量读取，只按索引按需取用

`.docsuite-data/` 是本机 DocSuite 的知识库数据目录，当前规模约 **135 MB**：
`kb/` 8.5 MB、`templates/` 127 MB（其中 `templates/tmp/` 单个上传就含 27 MB PDF + 36 MB base64）。
一次性读完相当于几千万 token，且 99% 与当前任务无关。

### 必须遵守

1. **禁止** `cat` / `Get-Content` / 递归遍历 `.docsuite-data/**`；禁止为了“了解项目”把知识库读一遍。
2. **先索引，后正文**：
   - 找有哪些资料 → 只读 `kb/items/kb_*.json`（每个 2–6 KB，含 id / 标题 / 来源 / 摘要）。
   - 确认要用某一份 → 才读对应的 `kb/sources/<id>/extracted.txt`（只读这一个）。
3. **单次读取预算**：单个文件 ≤ 32 KB；单个任务累计 ≤ 200 KB。超出时先拆分，或先问用户要哪一部分。
4. **默认不碰**：`kb/sources/**`、`templates/tmp/**`、任何 `*.pdf`、`*.b64`。
   需要这些内容时，走 DocSuite 界面的解析 / 检索 / 导出能力，而不是直接读文件。
5. **模板**只读 `templates/learned/tpl_*.json`（4–16 KB），不要读 `templates/tmp/` 里的原始上传件。
6. **需要全库统计**时，用脚本在本地聚合（只把计数、ID 列表、字段名输出到上下文），不要把原文拉进来。

### 判断标准

读之前先自问：**这份内容现在的任务真的用得上吗？有没有更小的索引可以先看？**
如果答不上来，就先看索引，或者直接问用户。

---

## 2. 开发时同样节省上下文

- 改 DocSuite 代码只读相关源文件（`src/host.js` / `src/client.js` 的对应片段），不要整仓通读。
- 大文件用 `offset` + `limit` 分段读，或先 `grep` 定位行号再读那一段。
- 运行结果优先重定向到文件再按需查看，避免把整篇日志灌进上下文。

---

## 3. 数据目录结构速查（只看结构，不看内容）

```
.docsuite-data/
├── config.json          # 配置（dataDir / 语言 / PPT 主题 / 模型）
├── kb/
│   ├── items/           # ★ 索引：每份资料的元数据 + 解析摘要（2–6 KB/个）
│   ├── sources/<id>/    # 原始文件 + extracted.txt（重，按需单读）
│   └── enrich-debug/    # 调试产物（一般不读）
├── templates/
│   ├── learned/         # ★ 学到的模板结构（4–16 KB/个）
│   └── tmp/             # 上传暂存（最重，禁止批量读）
├── projects/            # 文档工坊项目状态
├── exports/             # 导出产物
└── scripts/             # 内嵌 Python 工具链
```
