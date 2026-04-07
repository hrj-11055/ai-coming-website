export const FEATURED_SKILL_GROUPS = [
    {
        id: 'document-processing',
        title: '文档处理',
        icon: 'fa-solid fa-file-lines',
        tone: 'orange',
        description: '4 个最容易立刻产生交付结果的文档类 Skill，适合第一次体验 Skill 能力时直接上手。',
        skillSlugs: ['docx', 'pptx', 'pdf', 'xlsx']
    },
    {
        id: 'efficiency-tools',
        title: '效率工具',
        icon: 'fa-solid fa-bolt',
        tone: 'amber',
        description: '先把需求想清楚、把资料查清楚，再进入真正执行阶段，会比直接硬做更稳。',
        skillSlugs: ['brainstorming', 'search-first']
    },
    {
        id: 'research-content',
        title: '研究与内容',
        icon: 'fa-solid fa-compass-drafting',
        tone: 'rose',
        description: '从调研、内容拆分到素材获取，围绕真实业务场景挑出最常用的 3 个 Skill。',
        skillSlugs: ['market-research', 'content-engine', 'douyin-video-downloader']
    },
    {
        id: 'mcp-starter',
        title: 'MCP 入门',
        icon: 'fa-solid fa-plug',
        tone: 'sky',
        description: '如果你想先给 Claude Code 补一项最实用的联网能力，就从这个入门 Skill 开始。',
        skillSlugs: ['mcp-server-fetch']
    }
];

export const FEATURED_SKILL_CONTENT = {
    docx: {
        name: 'Word 文档生成',
        statusLabel: '已实测',
        featuredBadge: '精选 10',
        beginnerNote: '第一次用时，先做一份页数不多的小文档，把标题、表格和导出链路跑通，再上复杂版式。',
        preparation: [
            '先确定文档主题、目标读者和最终文件名。',
            '如果要插入表格、封面或图片，先把素材和结构说明整理好。',
            '如果文档要正式交付，生成后再用 Word 或兼容工具做一次分页检查。'
        ],
        promptExample: `请调用 docx 技能，帮我生成一份名为 \`AI_Strategy_2026.docx\` 的文档，要求如下：
1. 封面页标题为“2026 全球 AI 战略演进报告”，一号字、加粗、居中。
2. 正文包含三级标题结构，并写一段关于“提示词工程学”的说明，关键词加粗。
3. 插入一个 4x4 表格，列名为“模型名称 / 参数量 / 逻辑得分 / 部署成本”，补 3 行示例数据，表头加粗并用浅灰底色。
4. 文末插入当前日期，并告诉我文件保存路径。`,
        resultSummary: 'Skill 会在当前目录直接生成一份真正可打开的 `.docx` 文件，而不是只给你一段可复制文字。',
        resultBullets: [
            '通常会返回保存路径，方便你立刻打开检查。',
            '标题层级、表格样式和基础格式会跟着一起写入 Word。',
            '如果需求写得足够细，生成结果会更接近正式交付稿。'
        ],
        notes: [
            '如果输入是旧 `.doc` 文件，建议先转成 `.docx` 再继续编辑。',
            '涉及复杂排版时，最后一定要做一次可视化复检。'
        ]
    },
    pptx: {
        name: 'PPT 演示文稿生成',
        statusLabel: '已实测',
        featuredBadge: '精选 10',
        beginnerNote: '先用 5 页左右的小型演示稿试一次，确认标题页、正文页和数据页都能按预期生成。',
        preparation: [
            '先确定 PPT 的用途，是路演、汇报、培训还是提案。',
            '提前想好页数范围和每页核心信息，不要让一次 prompt 想表达太多。',
            '如果你有品牌色、模板或固定结构，直接写进提示词里。'
        ],
        promptExample: `使用 pptx 技能创建一份“2025 年度市场复盘”PPT：
1. 首页：2025 市场表现年度总结。
2. 核心指标页：展示用户增长、留存率、获客成本（CAC）。
3. 渠道分析页：对比社媒、搜索和线下活动的转化率。
4. 竞品对比页：突出我们的市场占有率优势。
5. 2026 战略方向页：总结品牌升级与全球化布局。`,
        resultSummary: 'Skill 会产出可继续编辑的 `.pptx` 演示文稿，适合后续再细调文案、顺序和样式。',
        resultBullets: [
            '适合先快速搭出结构完整的演示稿骨架。',
            '如果每页要求写得清楚，生成效果会明显更稳。',
            '生成后建议快速过一遍标题长度、图表占位和每页信息密度。'
        ],
        notes: [
            '如果后续还要套品牌模板，先让 Skill 出内容版，再做模板迁移会更省力。'
        ]
    },
    pdf: {
        name: 'PDF 文档生成',
        statusLabel: '已实测',
        featuredBadge: '精选 10',
        beginnerNote: 'PDF 更适合做“最终交付件”，第一次上手时尽量把版式要求写具体一些。',
        preparation: [
            '先确定 PDF 是偏报告、表单、海报还是多页说明书。',
            '如果包含图形、表格或多页布局，最好把每页任务单独写清楚。',
            '如果要对外发送，生成后记得检查分页和元数据。'
        ],
        promptExample: `创建一个名为 \`Skill_Validation_Report.pdf\` 的 PDF：
1. 第 1 页顶部居中放标题“Claude Skill Integration Test”，字号 24。
2. 页面中间绘制一个浅蓝色矩形，内部写入“Encapsulated Artifact”。
3. 第 2 页插入一个 3 行数据表，字段为 Model / Parameter / Score，表头灰底。
4. 设置文档 Author 为“ClaudeClaw_User”，Subject 为“Skill Testing”。`,
        resultSummary: 'Skill 会直接输出 PDF 文件，适合做固定版式文档、报告或需要一次性交付的材料。',
        resultBullets: [
            '图形、表格和多页结构可以一起完成。',
            '文档元数据也能一并写入，不只是页面内容。',
            '生成后最好再打开看一眼分页和元素位置。'
        ],
        notes: [
            '如果你后面还要继续编辑内容，先做 docx/pptx 版本，再导出 PDF 会更灵活。'
        ]
    },
    xlsx: {
        name: 'Excel 表格生成',
        statusLabel: '已实测',
        featuredBadge: '精选 10',
        beginnerNote: '第一次建议从“单个 sheet + 一段筛选逻辑”开始，确认它会输出真正可编辑的 Excel 文件。',
        preparation: [
            '先想清楚表头字段、主键列和最终交付格式。',
            '如果有筛选或计算逻辑，直接写成明确条件。',
            '如果后面还要人工继续维护，尽量要求保留公式和可编辑结构。'
        ],
        promptExample: `使用 xlsx skill，创建一个销售数据表：
1. 在 \`data_comparison_test.xlsx\` 的 Sheet1 中，从 A1 开始写入 20 行模拟销售数据，字段为 ID、日期、地区、产品、金额、状态。
2. 确保至少有 5 条数据属于“欧洲”且“金额大于 3000”。
3. 将筛选出的记录写到同一工作表的 I1 开始区域，并标注标题“PROCESSED_DATA_FILTERED”。
4. 保持 G 列和 H 列为空白，用作左右区域分隔。
5. 完成后告诉我文件保存路径，并说明左右两个区域分别有多少行数据。`,
        resultSummary: 'Skill 会输出真正的 `.xlsx` 文件，适合继续筛选、补列、改公式，而不是只返回一次性表格结果。',
        resultBullets: [
            '可以同时生成原始区和处理结果区。',
            '适合把数据写入、筛选、格式整理放在同一次执行里完成。',
            '生成后建议打开 Excel 检查公式、列宽和筛选区域。'
        ],
        notes: [
            '如果数据本来是 CSV/TSV，也可以直接让 Skill 帮你整理成正式的 `.xlsx`。'
        ]
    },
    brainstorming: {
        name: '深度头脑风暴',
        statusLabel: '已实测',
        featuredBadge: '精选 10',
        beginnerNote: '这个 Skill 的重点不是快，而是把模糊想法打磨成能执行的设计，所以要预留多轮确认时间。',
        preparation: [
            '把主题、目标、受众、预算和成功标准尽量写清楚。',
            '如果你希望它更有风格感，把语气、氛围和限制条件一起给到。',
            '准备好和它多轮来回确认，它不会一上来就直接产出最终成品。'
        ],
        promptExample: `使用 brainstorming skill，帮我策划一家“只在深夜 12 点到凌晨 4 点营业”的冥想书店开业活动。
补充信息：
- 地点：上海静安区
- 受众：高压力的金融从业者和深夜失眠的创意工作者
- 目标：在小红书获得 10k+ 收藏
- 必须包含：一个令人意外的线下装置、一个能够引起共鸣的话题标签
- 整体风格：治愈、深邃、略带一点赛博朋克感`,
        resultSummary: '你会先得到方向拆解、方案比较和结构化设计文档，而不是直接跳到执行层。',
        resultBullets: [
            '适合在需求还模糊、方向还不稳的时候先把框架想透。',
            '复杂题目可能要跑较长时间，结果通常是一份比较完整的设计文档。',
            '如果你持续给出确认，它会不断把方案往可执行方向收口。'
        ],
        gallery: [
            {
                src: '/pic/skills-guides/brainstorming-example.png',
                alt: 'brainstorming Skill 生成设计文档的实测截图',
                caption: '实测中，brainstorming 会把模糊创意沉淀成一份结构化设计文档，适合先定方向再执行。'
            }
        ],
        notes: [
            '如果你已经很确定要做什么，再用它就不一定划算；它最适合前期定方向。'
        ]
    },
    'search-first': {
        name: '先搜索再动手',
        statusLabel: '已实测',
        featuredBadge: '精选 10',
        beginnerNote: '当你不确定“要不要自己造轮子”时，先用这个 Skill 去查现成方案，通常能省下很多试错时间。',
        preparation: [
            '先把你真正要解决的问题写清楚，而不是只写一个抽象主题。',
            '如果你有技术栈偏好、预算限制或部署限制，也一起写出来。',
            '把“我要最后得到什么决策”写清楚，结果会更聚焦。'
        ],
        promptExample: `先不要直接写代码。请用 search-first skill 帮我调研“把 Markdown 批量转成微信公众号可发布 HTML”有哪些现成方案。
我想知道：
1. 最值得看的 3 到 5 个工具或仓库
2. 各自适合什么场景
3. 上手成本、维护状态和明显局限
4. 最后推荐一个最适合我当前项目的方案`,
        resultSummary: 'Skill 会先帮你搜现成工具、脚本和成熟模式，再把结果整理成可直接决策的建议。',
        resultBullets: [
            '适合在开工前做快速选型，避免重复造轮子。',
            '如果你把限制条件说得越清楚，推荐结果越实用。',
            '它最有价值的地方不是“搜到了”，而是帮你筛掉不适合你的方案。'
        ],
        notes: [
            '如果你已经有候选库名，直接写进去，会比泛泛搜索更高效。'
        ]
    },
    'market-research': {
        name: '市场调研与竞品分析',
        statusLabel: '已实测',
        featuredBadge: '精选 10',
        beginnerNote: '最关键的是先说清楚你要做什么决策，Skill 才会把资料整理成有判断价值的输出。',
        preparation: [
            '先明确你要判断的是市场机会、竞品差异、出海可行性还是价格策略。',
            '尽量把时间范围写出来，例如最近一个月、最近一个季度。',
            '如果你需要表格对比或来源引用，也请提前说明。'
        ],
        promptExample: `用 market-research skill 帮我查一下 2026 年初中国新能源汽车市场的现状，重点看：
1. 比亚迪、小米和华为（鸿蒙智行）最近一个月的销量与单车利润对比
2. 20 万到 30 万价位最近降价最狠的车型和具体降价金额
3. 智己或蔚来最近有没有新的固态电池实测续航数据
4. 这些品牌出海欧洲和中东的最新进展，以及被加关税的风险

最后请给我一张核心参数对比表，并给出你认为最关键的结论。`,
        resultSummary: 'Skill 会把资料搜集、对比和判断串起来，最后给你的是可用于决策的研究结论，而不是一堆零散链接。',
        resultBullets: [
            '适合竞品分析、行业扫描、进入新市场前的快速判断。',
            '如果要求来源和表格，它会更像一份可读的研究小结。',
            '你给的时间范围越具体，结果越容易落到“现在可用”的层面。'
        ],
        notes: [
            '最好明确“最终要决定什么”，否则结果容易泛成一份资料综述。'
        ]
    },
    'content-engine': {
        name: '多平台内容改写',
        statusLabel: '已实测',
        featuredBadge: '精选 10',
        beginnerNote: '这个 Skill 不适合“把同一段话复制到所有平台”，它的价值就在于把同一份母稿拆成平台原生表达。',
        preparation: [
            '先准备一份已经写好的母稿、长文、播客提纲或产品说明。',
            '先列清楚你要发的平台，例如公众号、朋友圈、社群、X 或短视频。',
            '把每个平台想达成的目标写清楚，比如引流、转化、收藏或讨论。'
        ],
        promptExample: `用 content-engine skill，基于我这篇长文《AI 出海产品怎么做冷启动》，帮我拆成 4 个版本：
1. 微信公众号摘要版（600 到 800 字）
2. 朋友圈短文版（150 字以内）
3. 社群预告版（突出一个钩子和一个 CTA）
4. X / 短帖版（更有节奏感，适合连续发布）

要求：四个平台都保留同一个核心观点，但不要直接复制同一句话。`,
        resultSummary: 'Skill 会把一份核心内容拆成多平台版本，每个平台的语气、开头和 CTA 都会更贴近发布场景。',
        resultBullets: [
            '适合把长文、课程、播客或产品发布说明做二次分发。',
            '它不是简单缩写，而是会按平台语境重写内容。',
            '你越明确每个平台的目标，输出就越像能直接发的版本。'
        ],
        notes: [
            '如果母稿本身还不成熟，先用 article-writing 一类 Skill 把母稿写顺，再来拆平台版本会更稳。',
            '如果后续还要做封面图或视觉素材，可以再串上封面图相关 Skill。'
        ]
    },
    'douyin-video-downloader': {
        name: '抖音无水印视频下载',
        slug: 'douyin-video-downloader',
        headline: '把抖音分享口令或短链接解析成可直接保存的无水印视频文件，适合快速存档和素材整理。',
        scenario: '适合案例收集、短视频素材整理、竞品拆解和二次剪辑前的下载动作。',
        overview: '这个 Skill 聚焦一件事：把你手里的抖音分享文案或短链接，解析成真正可下载的无水印视频文件。对不想折腾 Cookie、登录和手动找直链的人来说，它非常省事。',
        useCases: ['下载单个抖音视频', '保存案例素材到本地', '竞品拆解前先拉取原视频'],
        gettingStarted: ['先复制完整分享口令或短链接', '让 Skill 先解析真实视频地址', '确认输出文件名和保存路径'],
        installCommand: 'npx skills add openclaw/skills',
        installHint: '如果你已经装过 `openclaw/skills` 整仓，后续直接调用 `douyin-video-downloader` 就可以；这里保留的是最容易复制的整仓安装方式。',
        sourceUrl: 'https://skillsmp.com/zh/skills/openclaw-skills-skills-ansonlianson-douyin-video-downloader-skill-md',
        skillDocPurpose: '这个 Skill 的说明重点在于把“分享口令解析 -> 获取直链 -> 保存 MP4”这条链路固定下来，让 Agent 不用依赖登录态也能完成无水印下载。',
        relatedSlugs: ['content-engine', 'mcp-server-fetch'],
        statusLabel: '已实测',
        featuredBadge: '精选 10',
        beginnerNote: '第一次使用时，直接贴完整分享文案最省心，因为里面通常已经带了可解析的短链接。',
        preparation: [
            '先拿到抖音分享文案或短链接，越完整越好。',
            '确认你希望视频保存到当前目录，还是另一个指定目录。',
            '如果只是测试流程，先用 1 个短视频样本跑通即可。'
        ],
        promptExample: `用 douyin-video-downloader skill 帮我下载这个抖音视频：
https://v.douyin.com/C7-Eq5Paw6A/

如果你拿到的是整段分享文案，也可以直接整段贴进去，让 Skill 自己抽取链接。`,
        resultSummary: 'Skill 会把视频下载成 `.mp4` 文件保存到本地，适合你继续做剪辑、归档或内容拆解。',
        resultBullets: [
            '通常会直接返回保存路径和文件名。',
            '对普通分享口令和短链接都比较友好。',
            '下载成功后，你就不需要再手动找无水印地址。'
        ],
        gallery: [
            {
                src: '/pic/skills-guides/douyin-video-downloader-example.png',
                alt: 'douyin-video-downloader Skill 成功下载抖音视频的实测截图',
                caption: '实测中，贴入抖音分享链接后会直接生成本地 MP4 文件，并返回保存位置。'
            }
        ],
        notes: [
            '如果解析失败，优先检查分享链接是否已失效，或者换成更完整的分享文案再试一次。'
        ]
    },
    'mcp-server-fetch': {
        name: '网页内容抓取（MCP）',
        slug: 'mcp-server-fetch',
        headline: '给 Claude Code 补上最基础的网页抓取能力，装好之后就能直接读取 URL 内容和 JSON 返回。',
        scenario: '适合读单页网页、文档页、API JSON，以及给其它 Skill 补联网输入。',
        overview: '它本质上是最轻量的联网入口。先把 fetch server 接进 Claude Code，后面不管是网页摘要、资料整理还是研究流程，AI 都能先把网页内容拿下来，而不是只靠记忆回答。',
        useCases: ['读取单个网页内容', '抓取 JSON API 返回', '给研究类 Skill 补网页输入'],
        gettingStarted: ['先把 MCP 服务注册到 Claude Code', '用一个普通网页和一个 JSON 接口各试一次', '如果是强动态页面，再升级到更重的浏览器类工具'],
        installCommand: 'claude mcp add search -- npx -y @modelcontextprotocol/server-fetch',
        installHint: '这条命令会把 fetch server 注册成 `search` MCP。执行后重新打开会话或刷新客户端，通常更稳。',
        sourceUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/fetch',
        skillDocPurpose: '这个 Skill 的说明重点在于把“先给客户端加联网抓取能力”这件事说清楚，让 AI 能真的去读网页，而不是继续只凭模型记忆作答。',
        relatedSlugs: ['search-first', 'market-research'],
        statusLabel: '已实测',
        featuredBadge: '精选 10',
        beginnerNote: '它更像一个“能力开关”而不是普通内容 Skill。装好之后，后续很多联网任务都会直接受益。',
        preparation: [
            '先在 Claude Code 环境里执行安装命令。',
            '准备一个普通网页 URL 和一个 JSON 接口作为测试样例。',
            '执行完命令后，重新开始一次会话，确认 MCP 已生效。'
        ],
        promptExample: `安装完成后，可以直接这样测试：
1. 帮我抓一下这个网页的正文并用中文总结重点：https://modelcontextprotocol.io/introduction
2. 读取这个 JSON 接口，并告诉我里面有哪些主要字段：https://example.com/data.json`,
        resultSummary: '配置生效后，Claude Code 就能直接读取网页或 JSON 内容，再继续做总结、抽取或整理。',
        resultBullets: [
            '很适合当作第一个联网 MCP 来上手。',
            '适合轻量读取，不适合需要登录、点击和复杂交互的页面。',
            '如果读取失败，先检查客户端是否已重载 MCP，再检查目标站点限制。'
        ],
        notes: [
            '后续如果你要处理复杂动态网页，可以再升级到 Playwright 一类浏览器型 MCP。'
        ]
    }
};
