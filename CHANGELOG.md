# DocSuite 版本历史（CHANGELOG）

版本号约定：DSH 动态插件内不可变包 `pkg-N` ↔ 本仓库 git tag `pkg-N`。

## pkg-12 — M5 增强（当前，tag `pkg-12`）
- 网页抓取入库：web.search/fetch + HTML 清洗 + AI 抽取，一键导入知识库
- OCR：扫描件 PDF 自动识别（PyMuPDF 渲染 + RapidOCR），支持手动重新识别
- 数据目录迁移：设置中心一键搬迁（robocopy + config 更新 + 旧目录清理）
- 前置依赖：pymupdf、rapidocr-onnxruntime（Python 3.14 已验证可装）

## pkg-11 — M4 PPT 与 PDF（tag `pkg-11`）
- PPT 生成器：文档 → LLM 抽取幻灯片 → python-pptx 导出，内置 4 主题（ocean/tech/dark/light）16:9
- 文档 PDF 导出：Markdown → HTML → Chrome 无头打印

## pkg-10 — M3 标书结构增强（tag `pkg-10`）
- 招标解析提取编制要求（组成/顺序/排版）
- 大纲按「响应文件 + 技术方案 + 售后及服务方案」组织，技术方案参考技术模板
- 导出为三段式排版

## pkg-9 — M3 投标增强（tag `pkg-9`）
- 招标解析提取商务条款（交货期/质保/付款/地点）
- 时间节点安排：基于合同签订日 + 交货期自动推算各阶段日期

## pkg-8 — M3 文档工坊（tag `pkg-8`）
- 四类文档交互式生成：大纲 → 逐章 → Markdown 预览/编辑
- 知识库自动引用（[出处] + 参考文献附录）
- 投标需求响应矩阵；导出 Word / Markdown / HTML

## pkg-7 — M2 模板库（tag `pkg-7`）
- 自动学习历史报告：LLM 归纳章节树 + 文风（语气/表格偏好/典型图表/篇幅）
- 手工模板树形章节编辑器、写作风格编辑、按文档类型分类

## pkg-6 — M1 多型号拆分（tag `pkg-6`）
- AI 抽取支持多型号：models 数组 → 每个型号独立条目（共享源文件目录）

## pkg-5 — M1 AI 解析增强（tag `pkg-5`）
- 收集 reasoning 通道内容；强化 JSON 解析（整体/代码块/剥杂文/逐层回退）
- 失败保存调试日志并回显模型原始输出

## pkg-4 — M1 AI 参数抽取（tag `pkg-4`）
- 上传说明书后自动 LLM 提取技术参数 + 中文摘要 + 自动归类

## pkg-3 — M1 修复版（tag `pkg-3`）
- 修复 ShellRunResult 输出读取（CollectedOutput.text）
- 上传解析容错（extracted.txt 恢复）、孤儿数据自动修复、删除改真删除

## pkg-2 — M1 知识库（tag `pkg-2`）
- 说明书上传解析（pypdf / python-docx）、全文检索（n-gram 倒排）
- 型号资料卡 CRUD、多型号对比表、手动录入、源文件下载

## pkg-1 — M0 骨架（tag `pkg-1`）
- conversation.view 导航主页、Host RPC 框架、数据层（配置持久化）、设置页与环境自检
