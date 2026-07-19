const CC_IMG = (file, caption) => ({ src: `/pic/skills-guides/claude-code/${file}`, caption });

const GIT_SETUP_IMAGES = [
    CC_IMG('git-setup-01.png', '打开 Git 官网，下载 Windows 安装程序'),
    CC_IMG('git-setup-02.png', 'Git 安装：接受 GNU 许可协议'),
    CC_IMG('git-setup-03.png', 'Git 安装：选择安装路径（建议 D 盘，路径不含中文）'),
    CC_IMG('git-setup-04.png', 'Git 安装：选择安装组件（保持默认即可）'),
    CC_IMG('git-setup-05.png', 'Git 安装：选择开始菜单文件夹'),
    CC_IMG('git-setup-06.png', 'Git 安装：选择默认编辑器（Vim）'),
    CC_IMG('git-setup-07.png', 'Git 安装：调整初始分支名称（Let Git decide）'),
    CC_IMG('git-setup-08.png', 'Git 安装：设置 PATH 环境（推荐第二项）'),
    CC_IMG('git-setup-09.png', 'Git 安装：配置 SSL 后端（默认即可）'),
    CC_IMG('git-setup-10.png', 'Git 安装：选择 HTTPS 传输后端'),
    CC_IMG('git-setup-11.png', 'Git 安装：配置行尾符号转换（Windows 风格）'),
    CC_IMG('git-setup-12.png', 'Git 安装：配置终端模拟器（MinTTY）'),
    CC_IMG('git-setup-13.png', 'Git 安装：配置 git pull 默认行为'),
    CC_IMG('git-setup-14.png', 'Git 安装：选择凭证助手'),
    CC_IMG('git-setup-15.png', 'Git 安装：勾选额外功能后点击 Install'),
    CC_IMG('git-setup-16.png', 'Git 安装验证：cmd 中显示 git version')
];

export const FEATURED_SKILL_GROUPS = [
    {
        id: 'ai-coding-assistant',
        title: '最强 AI 工具推荐',
        icon: 'fa-solid fa-terminal',
        tone: 'indigo',
        description: '精选真正能提升交付效率的 AI 工具教程，覆盖安装、配置、首次任务和进阶工作流。',
        skillSlugs: ['codex-install-guide', 'claude-code-config']
    },
    {
        id: 'document-processing',
        title: '文档处理',
        icon: 'fa-solid fa-file-lines',
        tone: 'orange',
        description: '4 个最容易立刻产生交付结果的文档类 Skill，适合第一次体验 Skill 能力时直接上手。',
        skillSlugs: ['docx', 'ppt-master', 'pdf', 'xlsx']
    },
    {
        id: 'efficiency-tools',
        title: '效率工具',
        icon: 'fa-solid fa-bolt',
        tone: 'amber',
        description: '先把需求想清楚、找到合适 Skill 和现成方案，再把高频经验沉淀成可复用能力。',
        skillSlugs: ['brainstorming', 'find-skills', 'search-first', 'creator-skill', 'hepha-skill']
    },
    {
        id: 'research-content',
        title: '研究与内容',
        icon: 'fa-solid fa-compass-drafting',
        tone: 'rose',
        description: '从调研、研报检索、数据可视化、信息图、内容拆分到素材获取，围绕真实业务场景挑出最常用的 6 个 Skill。',
        skillSlugs: ['market-research', 'report-search', 'baoyu-infographic-cocoloop', 'aitubiao-smart-chart', 'content-engine', 'douyin-video-downloader']
    },
    {
        id: 'mcp-starter',
        title: 'MCP 入门',
        icon: 'fa-solid fa-plug',
        tone: 'sky',
        description: '先把文件、文档、网页、流程图和搜索这 5 类最常用的外部能力接进来，AI 才会真正开始帮你干活。',
        skillSlugs: ['filesystem-mcp', 'pdf-reader-mcp', 'playwright-mcp', 'mermaid-mcp', 'free-web-search-mcp']
    }
];

export const FEATURED_SKILL_CONTENT = {
    'codex-install-guide': {
        name: 'Codex App 从 0 到 1 入门教程',
        slug: 'codex-install-guide',
        detailLayout: 'markdown',
        statusLabel: '小白入门',
        featuredBadge: '真实截图',
        headline: '把 Codex App 的界面、项目、插件、自动化和权限一次讲清楚，让第一次打开的人也知道从哪里开始。',
        guideIntro: [
            '看懂 Codex App 左边、中间、右边分别在做什么',
            '分清普通对话、本地项目与云端任务应该怎么选',
            '理解插件、Skill、MCP、自动化和电脑操控',
            '按一条低风险路线完成第一次真实任务'
        ],
        scenario: '适合第一次打开 Codex App、不懂代码，但希望用它处理文件、做内容、查资料、生成网页或自动完成重复任务的人。',
        overview: '很多人不是不想用 Codex，而是第一次打开时根本不知道从哪里开始。这篇教程不从命令和技术名词讲起，而是先用大白话带你看懂界面，再完成一个低风险任务，最后才接触插件、自动化、项目和权限。',
        useCases: ['第一次安装和认识 Codex App', '用 Codex 处理本地文件和项目', '安装插件扩展文档与浏览器能力', '设置自动化和电脑操控'],
        gettingStarted: [
            '从 OpenAI 官方 Codex 页面下载并安装 Codex App，用 ChatGPT / OpenAI 账号登录。',
            '先开一个普通对话，让 Codex 解释概念或整理一段文字，不要一上来操作私人文件。',
            '熟悉左侧导航、中央对话区和右侧结果区，知道 Codex 的工作过程与产物分别在哪里。',
            '新建一个干净的演示项目，让 Codex 生成一份简单 Markdown，并让它解释做了什么。',
            '确认理解权限后，再逐步尝试插件、自动化、浏览器和电脑操控。'
        ],
        installCommand: `# 打开官方页面下载 Codex App
https://openai.com/codex/

# 已安装 Codex CLI 的用户也可以直接启动桌面 App
codex app`,
        installHint: '优先从 OpenAI 官方入口下载。本文截图基于 macOS 版 Codex App，版本更新后按钮位置可能变化，但核心逻辑一致。',
        promptExample: `我是第一次使用 Codex App，也不是程序员。
请先不要修改任何文件，用大白话告诉我：
1. 当前对话能访问什么；
2. 如果我要让你整理一个本地文件夹，应该创建普通对话还是项目；
3. 你需要哪些权限，每项权限有什么风险；
4. 给我安排一个低风险的第一次练习任务。`,
        resultSummary: '完成教程后，你会知道 Codex App 每个核心区域的作用，并能在理解权限的前提下完成第一次任务。',
        resultBullets: [
            '能判断什么时候用普通对话、什么时候创建项目。',
            '能看懂右侧结果区、插件、自动化和设置页。',
            '遇到权限请求时，知道如何让 Codex 先解释风险。'
        ],
        markdownSections: [
            {
                title: 'Codex App 从 0 到 1：小白第一次打开，到底该从哪里开始？',
                body: [
                    '很多人第一次打开 Codex App 的反应不是“好强”，而是“这玩意儿到底从哪开始？”左边一堆入口，中间是聊天，右边还会弹出网页、图片、文件和代码变化。真正困住小白的，往往不是不会提问，而是不知道 Codex 正在做什么。',
                    '所以这篇教程不讲一大堆技术名词。我们先把 Codex App 当成一个会在电脑上做事的超级助理，按普通人的使用路线一步步拆开。'
                ],
                image: { src: '/pic/skills-guides/codex-app/cover.jpg', caption: 'Codex App 从 0 到 1 入门教程。图片来源：逸尘 @gengdaJ' },
                links: [
                    { label: '参考原文：逸尘的 Codex App 完整入门教程', href: 'https://x.com/gengdaJ/status/2051891231953920174' },
                    { label: 'OpenAI Codex 官方入口', href: 'https://openai.com/codex/' }
                ]
            },
            {
                title: '一、一句话解释：Codex App 到底是什么',
                body: [
                    'Codex App 不是一个只负责回答问题的聊天框。更准确地说，它是一个把 AI Agent 放进电脑里的工作台。',
                    '普通 ChatGPT 更像“告诉你怎么做”；Codex App 在获得权限后，可以直接读文件、改文件、运行命令、搜索网页、生成图片和文档，甚至操作浏览器或 Mac 应用。你可以先把它理解成：一个更偏“做事”的 ChatGPT。'
                ],
                list: [
                    '能和你聊天，也能读取你指定的本地文件。',
                    '能生成图片、文档、PPT、网页和代码。',
                    '能通过插件连接 GitHub、Google Drive、Slack 等外部服务。',
                    '能设置自动化，定期执行检查、总结和跟进任务。'
                ],
                image: { src: '/pic/skills-guides/codex-app/interface-overview.jpg', caption: 'Codex App 主界面：左侧找入口，中间对话，右侧展示结果。图片来源：逸尘 @gengdaJ' }
            },
            {
                title: '二、下载安装：只认官方入口',
                body: [
                    '安装 Codex App 和安装普通桌面软件差不多。打开官方页面下载，安装后使用 ChatGPT / OpenAI 账号登录即可。',
                    '本文截图基于 macOS 版实测。Codex App 更新很快，你看到的按钮名称和位置可能略有变化，但使用逻辑不会变。'
                ],
                code: `官方下载入口：
https://openai.com/codex/

安装后：
1. 打开 Codex App
2. 使用 ChatGPT / OpenAI 账号登录
3. 先保持默认设置，不要急着开启最大权限`,
                links: [
                    { label: 'OpenAI Codex 官方下载入口', href: 'https://openai.com/codex/' },
                    { label: 'Codex App 官方文档', href: 'https://developers.openai.com/codex/app/' }
                ]
            },
            {
                title: '三、普通对话、本地项目、云端 Codex 怎么选',
                body: [
                    '这三个入口看起来很像，但判断方法非常简单：只是问问题，用普通对话；需要处理电脑上的文件或项目，用 Codex App 项目；希望任务在远程持续运行，用云端 Codex。',
                    '小白第一次使用，建议先开普通对话，等理解权限后，再建一个不含隐私文件的演示项目。'
                ],
                list: [
                    '普通对话：解释概念、写文案、整理思路，不绑定本地项目。',
                    'Codex App 项目：读取和修改指定文件夹，适合真实工作。',
                    '云端 Codex：任务在远程环境运行，本地电脑关机也不影响。'
                ]
            },
            {
                title: '四、主界面地图：左边找入口，中间下任务，右边看作业',
                body: [
                    '把 Codex App 想成一张工作台：左边是抽屉和入口，中间是你和助理沟通的地方，右边是它交作业的地方。',
                    '当 Codex 生成图片、文件、网页或修改代码时，右侧结果区会展示预览和变化。不要只看聊天里的“完成了”，要去右侧确认真正产出了什么。'
                ],
                image: { src: '/pic/skills-guides/codex-app/plugins-layout.jpg', caption: 'Codex App 的三分区布局。图片来源：逸尘 @gengdaJ' }
            },
            {
                title: '五、左侧导航栏：每个入口到底干什么',
                body: [
                    '左侧是 Codex 的入口区。小白最常用的是新对话、搜索、插件、自动化和项目。',
                    '不想沿用旧上下文就开新对话；需要找以前做过的事就用搜索；需要处理某个本地文件夹就进入项目。'
                ],
                list: [
                    '新对话：开启一个不沿用旧聊天记录的新任务。',
                    '搜索：查找历史对话、任务和上下文。',
                    '插件：给 Codex 增加外部能力。',
                    '自动化：让 Codex 稍后或定期执行任务。',
                    '项目：让 Codex 围绕指定文件夹开展工作。'
                ],
                image: { src: '/pic/skills-guides/codex-app/sidebar.jpg', caption: '左侧导航栏是进入不同工作流的起点。图片来源：逸尘 @gengdaJ' }
            },
            {
                title: '六、插件、连接器、Skill、MCP：别被名字吓到',
                body: [
                    '这些词第一次看很技术，其实用大白话很好理解：插件是能力包，连接器是接账号，Skill 是工作流说明书，MCP 是接外部工具的通道。',
                    '刚开始不要一次装很多。只有当你明确知道“我希望 Codex 帮我做 PPT”或“我要连接 GitHub”时，再去找对应插件。'
                ],
                list: [
                    'Plugin 插件：安装一组能力，例如表格、演示文稿、Browser Use。',
                    'Connector 连接器：连接 Gmail、GitHub、Google Drive 等账号。',
                    'Skill 技能：让 Codex 按一套固定步骤完成某类任务。',
                    'MCP：让外部工具或服务向 Codex 提供能力。'
                ],
                image: { src: '/pic/skills-guides/codex-app/plugins.jpg', caption: '插件页：按需要给 Codex 增加能力，不要一开始全装。图片来源：逸尘 @gengdaJ' }
            },
            {
                title: '七、自动化：让 Codex 稍后或定期帮你做事',
                body: [
                    '自动化就是提前告诉 Codex：什么时候执行、检查什么、输出什么、不要做什么。它适合那些重复、稳定、边界清楚的任务。',
                    '描述越泛，自动化越容易跑偏。设置前至少写清执行时间、对象、输出格式和异常处理方式。'
                ],
                list: [
                    '每天早上整理项目状态。',
                    '每周检查一次仓库或网页。',
                    '半小时后继续当前线程。',
                    '定时生成日报、周报和复盘。'
                ],
                image: { src: '/pic/skills-guides/codex-app/automations.jpg', caption: '自动化页面：设置定期或延后执行的任务。图片来源：逸尘 @gengdaJ' }
            },
            {
                title: '八、右侧结果区：不要只听它说完成了',
                body: [
                    '右侧结果区可能展示文件、来源、网页预览、图片、PDF、内置浏览器、代码差异和 Git 变化。',
                    '你可以把中间对话区理解成“它做了什么”，把右侧理解成“它真正交了什么作业”。每次任务完成后，都应该看一眼右侧结果。'
                ],
                image: { src: '/pic/skills-guides/codex-app/results-panel.jpg', caption: 'Codex 执行过程与右侧预览：任务结果需要实际检查。图片来源：逸尘 @gengdaJ' }
            },
            {
                title: '九、设置页先关注什么：工作模式、权限、个性化',
                body: [
                    '设置页内容很多，但第一次只需要关注三件事：工作模式是否适合你、默认权限是否过大、个性化说明是否清楚。',
                    '如果你不是程序员，可以在个性化说明里要求 Codex 默认用中文、少用术语、每一步标出成功标志，并在修改文件或访问账号前解释风险。'
                ],
                code: `请默认用中文回答。
我不是程序员，涉及技术内容时先用大白话解释目的，再给具体操作。
如果要修改文件、运行命令、访问外部账号或发布内容，请先说明风险。
教程类内容请写成我能照着操作的步骤，并标注每一步的成功标志。`,
                images: [
                    { src: '/pic/skills-guides/codex-app/general-settings.jpg', caption: '常规设置：优先检查工作模式和默认权限。图片来源：逸尘 @gengdaJ' },
                    { src: '/pic/skills-guides/codex-app/personalization.jpg', caption: '个性化设置：告诉 Codex 你希望它如何协作。图片来源：逸尘 @gengdaJ' }
                ]
            },
            {
                title: '十、浏览器使用和电脑操控：很强，但边界一定要说清楚',
                body: [
                    '浏览器使用让 Codex 在内置浏览器里打开网页、搜索资料、测试页面和截图。电脑操控则可以操作 Mac 上的应用、点击按钮和处理可视化流程。',
                    '电脑操控是 Codex App 最强的能力之一，也是最需要谨慎的能力。第一次使用时，只操作无风险应用，不要直接让它操作社媒账号、微信、支付页面、私人邮箱或公司敏感工具。'
                ],
                image: { src: '/pic/skills-guides/codex-app/browser-computer-use.jpg', caption: '设置页中的浏览器使用与电脑操控入口。图片来源：逸尘 @gengdaJ' }
            },
            {
                title: '十一、权限确认：看不懂就先让 Codex 自己解释',
                body: '小白最容易犯的错，是看到确认按钮就直接点。正确做法是先看路径、操作对象和风险；不懂时，直接让 Codex 解释为什么需要这项权限，有没有更低风险的做法。',
                code: `这个权限具体会让你访问什么？
为什么当前任务需要它？
它可能修改、上传或发布什么内容？
有没有权限更小、风险更低的做法？
我是第一次使用，应该允许吗？`,
                list: [
                    '文件访问：先确认路径是不是你允许它处理的文件夹。',
                    '终端命令：不懂命令时，先要求解释作用和风险。',
                    '浏览器操作：付款、删除、发布类操作必须格外谨慎。',
                    '第三方账号：看清楚授权范围，不要默认全部允许。',
                    '电脑操控：明确允许操作的 App 和禁止触碰的区域。'
                ]
            },
            {
                title: '十二、第一次使用路线：不要一上来挑战复杂任务',
                body: '第一次使用的目标不是展示 Codex 能有多强，而是让你看懂它如何工作、如何交付、如何请求权限。按下面顺序走一遍，比直接丢一个大任务更容易真正学会。',
                list: [
                    '打开 App，先熟悉左侧导航，不改任何设置。',
                    '新建普通对话，问一个低风险问题。',
                    '建立一个不含隐私内容的演示项目。',
                    '让 Codex 在项目里生成一份简单 Markdown。',
                    '去右侧结果区查看文件，让它解释做了什么。',
                    '再尝试一个官方插件或简单自动化。',
                    '最后再接触 Git、MCP、浏览器和电脑操控。'
                ],
                code: `请在当前演示项目中创建一份“我的第一份 Codex 使用记录.md”。
内容包括：
1. 你读取了哪些文件；
2. 你创建或修改了什么；
3. 我应该在哪里查看结果；
4. 如果要继续改，我可以怎么描述需求。

这是第一次练习，不要访问项目文件夹之外的内容。`
            },
            {
                title: '十三、常见踩坑：卡住时先这样处理',
                list: [
                    'Codex 一直在跑：先看任务状态，确认它是在执行还是已经结束。',
                    '权限不知道能不能点：不要直接确认，让 Codex 先解释风险。',
                    '它改了文件但你看不懂：让它按文件逐个解释本次变化。',
                    '结果不满意：不要立即重开对话，基于当前结果继续明确修改要求。',
                    '插件太多不知道装哪个：先不装，等真正需要连接某项能力时再添加。',
                    '自动化跑偏：补充执行时间、执行对象、输出格式、禁止事项和异常处理。'
                ],
                code: `请不要重新开始。
保留当前结果的整体结构，先告诉我哪里没有满足要求，
然后只修改这些部分，并在完成后列出具体变化。`,
                links: [
                    { label: '阅读逸尘的完整原文与全部截图', href: 'https://x.com/gengdaJ/status/2051891231953920174' },
                    { label: 'OpenAI Codex App 官方文档', href: 'https://developers.openai.com/codex/app/' }
                ]
            }
        ],
        notes: [
            '本文的叙事结构、实操经验和界面截图参考自逸尘 @gengdaJ 的 X 长文，并已在正文中标注来源。',
            '截图基于 macOS 版 Codex App；产品更新后，具体按钮名称和位置可能变化。',
            '不要把 API Key、密码、Cookie、身份证、银行卡或公司机密写入个性化说明。'
        ],
        sourceUrl: 'https://x.com/gengdaJ/status/2051891231953920174',
        sourceLabel: '参考原文：逸尘 @gengdaJ',
        skillDocPurpose: '这是 AI 能力库中的 Codex App 小白入门教程，用大白话和真实截图帮助第一次使用的人看懂界面、权限与完整使用路线。'
    },
    docx: {
        name: 'Word 文档生成',
        statusLabel: '已实测',
        featuredBadge: '精选 16',
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
    'ppt-master': {
        name: 'PPT Master',
        statusLabel: '新增收录',
        featuredBadge: '官方示例',
        beginnerNote: '它更像一个本地 PPTX 生成工作流，不是一次性出图工具。第一次使用建议先用官方示例或一份短 PDF 跑通完整链路。',
        preparation: [
            '先安装 Python 3.10+，并准备一个能读写文件和执行命令的 Agent 环境，例如 Claude Code、Cursor、VS Code Copilot 或 Codex CLI。',
            '把 PDF、DOCX、图片或其它源材料放进项目目录，最好按 `projects/<name>/sources/` 这类结构整理。',
            '如果要追求高质量结果，提前准备模型与图片生成配置；上游推荐大上下文 Claude 搭配 `gpt-image-2`。'
        ],
        promptExample: `请使用 PPT Master，把 \`projects/q3-report/sources/report.pdf\` 做成一份 8-10 页、16:9 的可编辑 PowerPoint：
1. 先确认设计规格，包括页数、受众、风格和是否套用模板。
2. 每页只保留一个核心观点，避免信息过载。
3. 输出原生可编辑的 \`.pptx\`，不要把整页压成图片。
4. 为每页补 speaker notes，并告诉我最终文件保存路径。`,
        resultSummary: 'PPT Master 会在本地生成原生形状、文本框和图表组成的 `.pptx`，重点是后续还能在 PowerPoint 里逐元素编辑。',
        resultBullets: [
            '适合把 PDF、DOCX、图片或粘贴文本转成完整演示稿。',
            '支持从零设计，也支持把新内容填入已有 `.pptx` 模板。',
            '可生成讲者备注，并支持进一步把备注合成为音频旁白。'
        ],
        notes: [
            '上游明确强调它是 harness，不是“许愿池”；结果质量取决于模型、输入材料和后续打磨。',
            '通过 `npx skills add hugohe3/ppt-master` 安装时主要拉取 skill 文件，后处理脚本仍需要在安装位置补 `pip install -r requirements.txt`。',
            '它是一整套从材料分析、视觉设计、SVG 生成到 PPTX 导出的完整流水线。'
        ]
    },
    pdf: {
        name: 'PDF 文档生成',
        statusLabel: '已实测',
        featuredBadge: '精选 16',
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
        featuredBadge: '精选 16',
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
        featuredBadge: '精选 16',
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
    'find-skills': {
        name: 'Skill 搜索与安装',
        statusLabel: '新增收录',
        featuredBadge: 'Vercel Labs',
        beginnerNote: '当你觉得某类任务可能已有成熟 Skill 时，先让它帮你查找、验证质量并给出安装命令。',
        preparation: [
            '先说清楚任务领域和具体目标，例如 React 性能优化、PR 评审或部署。',
            '明确你更看重官方来源、安装量，还是某项特定能力。',
            '安装前检查来源信誉、GitHub stars 和安装量，不要只看搜索结果标题。'
        ],
        promptExample: `请使用 find-skills 帮我找一个适合做 React 性能优化的 Skill：
1. 优先查看 skills.sh 排行榜和官方来源。
2. 对比候选 Skill 的安装量、来源信誉和 GitHub stars。
3. 推荐最合适的一项，并给出安装命令和详情链接。
4. 暂时不要安装，先让我确认。`,
        resultSummary: '它会把模糊的能力需求转成 Skill 搜索，并在推荐前检查安装量、来源信誉和 GitHub stars。',
        resultBullets: [
            '优先从 skills.sh 排行榜和成熟来源寻找候选项。',
            '会给出可直接运行的 `npx skills add` 安装命令。',
            '找不到合适 Skill 时，会建议直接处理任务或创建新 Skill。'
        ],
        notes: [
            '上游建议优先考虑安装量超过 1K 的 Skill，并谨慎评估安装量低于 100 的项目。',
            '推荐 Skill 前仍需核查源仓库，避免安装来源不明或维护不足的能力包。'
        ]
    },
    'search-first': {
        name: '先搜索再动手',
        statusLabel: '已实测',
        featuredBadge: '精选 16',
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
    'creator-skill': {
        name: 'Skill 创建助手',
        slug: 'creator-skill',
        headline: '把你反复使用的工作方法整理成可安装、可触发、可测试的 AI Skill。',
        scenario: '适合想创建个人 Skill、团队工作流 Skill、项目专用 Skill，或把已有提示词升级成长期可复用能力的人。',
        overview: 'creator-skill 面向的是“创建 Skill”这件事本身。它会帮你先判断一个经验是否值得沉淀成 Skill，再梳理触发时机、输入要求、执行步骤、边界限制和测试样例。相比只写一段提示词，它更适合把稳定流程做成能长期复用、能交给团队共享、也方便后续迭代的能力说明。',
        useCases: ['从零创建一个新的 Skill', '把常用提示词整理成标准 SKILL.md', '为团队流程补触发规则和使用说明', '给已有 Skill 增加测试样例和边界约束'],
        gettingStarted: [
            '先写清楚这个 Skill 要解决的具体任务，不要只写成一个宽泛主题。',
            '列出它应该在什么场景触发，以及哪些场景不应该触发。',
            '把执行步骤拆成 Agent 能照着做的流程，并补上输入、输出和验收标准。',
            '准备 2 到 3 个真实测试提示词，确认 Skill 会在正确场景生效。',
            '首次写完后先小范围试用，根据失败案例调整描述和步骤。'
        ],
        installCommand: 'npx skills add anthropics/skills --skill "skill-creator" --yes',
        installHint: '这个入口对应 Anthropic 官方 `skill-creator`。安装后，你可以让 Agent 按它的工作流帮你设计、编写和评估新的 Skill。',
        sourceUrl: 'https://github.com/anthropics/skills/tree/main/skills/skill-creator',
        skillDocPurpose: '这个 Skill 的说明文件主要是在规范“如何创建 Skill”：先确认目标和触发条件，再编写 SKILL.md、补测试样例、用真实任务验证效果，最后根据失败点继续迭代。它的价值在于让 Skill 不只是写得像文档，而是真的能被 Agent 正确识别和调用。',
        relatedSlugs: ['brainstorming', 'search-first', 'mcp-builder'],
        statusLabel: '已收录',
        featuredBadge: '精选 16',
        beginnerNote: '第一次使用时，不要试图做一个“万能 Skill”。先选一个你最近重复做过 3 次以上的具体流程，成功率会高很多。',
        preparation: [
            '准备一个你想沉淀的具体工作流，例如“公众号排版检查”“每周数据复盘”或“PR 发布前自查”。',
            '整理 1 到 2 个真实输入样例，让 Skill 创建过程不只停留在抽象描述。',
            '提前想好输出形式，是一份 SKILL.md、一组测试提示词，还是同时包含安装说明。'
        ],
        promptExample: `请使用 creator-skill 帮我创建一个新的 Skill，主题是“公众号文章发布前检查”。
我希望这个 Skill 能做到：
1. 在我准备发布公众号长文前触发。
2. 检查标题、摘要、段落长度、图片占位、CTA 和错别字风险。
3. 输出一份可执行的发布前检查清单。
4. 不要改写整篇文章，除非我明确要求。
5. 帮我写好 SKILL.md，并补 3 个测试提示词。`,
        resultSummary: '你会得到一份更接近可安装 Skill 的结构化说明，而不是零散提示词。',
        resultBullets: [
            '通常会产出 Skill 的触发描述、执行步骤、边界限制和示例提示词。',
            '适合把个人经验、团队流程和项目规范沉淀成可复用能力。',
            '如果提供真实样例，生成的 Skill 会更容易在正确场景触发。'
        ],
        notes: [
            'Skill 的范围越具体，越容易写清楚触发条件，也越容易测试。',
            '不要把临时一次性任务都做成 Skill；只有反复出现的流程才值得沉淀。',
            '写完后最好用正例和反例各测一次，确认它不会在无关任务里误触发。'
        ]
    },
    'hepha-skill': {
        name: 'Hepha 自主迭代交付',
        slug: 'hepha-skill',
        headline: '把大型需求拆成 plan、execute、check、review、commit 的小步交付循环。',
        scenario: '适合 Claude Code 深度用户处理多阶段开发任务，希望每一步都有任务账本、质量检查和可回滚提交。',
        overview: 'Hepha 是 CocoLoop 最新上传区里更贴近工程交付的一项 Skill。它不是可执行工具，而是一套纯文档型工作流协议：通过 .autopilot 目录维护 backlog、progress 和 decision-log，让 Agent 按计划、执行、检查、审查、提交的闭环推进复杂需求。相比人格类或娱乐类 Skill，它更适合 AIcoming 能力库的效率与工程用户。',
        useCases: ['大型需求拆解', 'Claude Code 自动迭代', '提交前质量门禁', '技术决策留痕'],
        gettingStarted: [
            '只在任务确实需要多轮迭代时启用，不要把一次性小改动也套进 Hepha 循环。',
            '先准备清晰的目标、停止条件和验收方式，再让 Agent 建立 .autopilot 工作文件。',
            '每个循环只交付一个最小可验证子任务，检查和审查通过后再提交。',
            '涉及 UI 或流程变化时，要求 Agent 使用浏览器或 Playwright 留下验证证据。'
        ],
        installCommand: `# CocoLoop 手动下载
https://dl.cocoloop.cn/bss/skills/hepha-skill-main.zip

# 来源页
https://hub.cocoloop.cn/skills/7572`,
        installHint: 'CocoLoop 当前提供的是下载包入口。下载前请在来源页复核作者、CLS 安全报告和最新版本。',
        sourceUrl: 'https://hub.cocoloop.cn/skills/7572',
        sourceLabel: 'CocoLoop 来源页',
        skillDocPurpose: '这个 Skill 的说明文件把“长任务如何持续推进”协议化：先建立 backlog、progress、decision-log 三本账，再按 plan / research / execute / check / review / commit 的顺序小步循环。它的价值在于减少 AI 直接大跨度改代码带来的不可审计风险。',
        relatedSlugs: ['verification-loop', 'requesting-code-review', 'subagent-driven-development'],
        statusLabel: 'CocoLoop 新收录',
        featuredBadge: 'S+ 安全',
        beginnerNote: 'Hepha 更适合有代码项目经验的人。第一次使用时建议先拿一个低风险 feature 试跑，不要直接交给生产紧急任务。',
        preparation: [
            '准备一个可拆解的开发目标，并写清最终验收标准。',
            '确认项目里已有可运行的测试、lint、build 或浏览器验证方式。',
            '提前约定连续失败、需求不清或凭证缺失时必须停下来询问。'
        ],
        promptExample: `请进入 hepha mode，帮我把下面这个需求拆成可提交的小步循环：

目标：为当前网站新增一个“最近更新的 AI Skill”展示区。
要求：
1. 先建立 .autopilot/backlog.md、progress.md 和 decision-log.md。
2. 每次只推进一个最小可验证子任务。
3. 每一轮都要运行相关检查。
4. 涉及页面展示时必须做浏览器验证。
5. check 和 review 都通过后再准备提交。`,
        resultSummary: '你会得到一条更可审计的长任务执行轨道，而不是让 Agent 一口气改完所有东西。',
        resultBullets: [
            '任务会被拆成更小的可验证单元，降低一次性大改的风险。',
            '技术选择和失败原因会进入 decision-log / progress，方便复盘。',
            'S+ 报告显示它是纯 Markdown 文档型 Skill，无外部 API 调用和可执行代码。'
        ],
        gallery: [
            {
                src: 'https://hub.cocoloop.cn/assets/images/0a4ee0138dce4d05c2ae93b332ed6409.png',
                alt: 'CocoLoop hepha-skill 封面图',
                caption: '图片来源：CocoLoop hepha-skill 详情/列表页，作者账号 melonlee。'
            }
        ],
        notes: [
            'CocoLoop 标注作者为 melonlee，来源信任级别为 T3 个人开发者/社区项目。',
            '安全报告日期为 2026-05-02，认证等级 S+，但仍建议使用前阅读来源页和下载包内容。',
            '它适合“长任务更稳”，不适合“所有任务都自动化”。'
        ]
    },
    'market-research': {
        name: '市场调研与竞品分析',
        statusLabel: '已实测',
        featuredBadge: '精选 16',
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
    'report-search': {
        name: '行业研报搜索与提取',
        slug: 'report-search',
        headline: '按关键词、机构、作者和时间检索行业研报，并提取摘要与正文用于研究分析。',
        scenario: '适合市场研究、竞品分析、行业扫描和商业计划书前期取材，需要快速定位中文研报时使用。',
        overview: '这是 CocoLoop 最新批次中交付物最完整、与 AIcoming 研究受众最匹配的 Skill。它提供搜索、正文提取、校验脚本、模板和示例，但依赖第三方研报站 fxbaogao.com；使用者仍需遵守来源站条款、版权和引用规范。',
        useCases: ['行业趋势研究', '竞品与市场分析', '机构观点检索', '报告摘要与证据整理'],
        gettingStarted: [
            '先明确关键词、时间范围和需要回答的研究问题。',
            '优先读取报告摘要和元数据，只提取与当前问题直接相关的正文。',
            '保留报告标题、机构、作者、日期和原始链接，避免把二手摘要当成一手结论。',
            '下载或引用全文前，确认来源站条款及报告版权允许当前用途。'
        ],
        installCommand: `# CocoLoop 手动下载
https://dl.cocoloop.cn/bss/skills/eliauktm-report-search-1.0.0.zip

# 来源页
https://hub.cocoloop.cn/skills/62249`,
        installHint: '下载前请在 CocoLoop 来源页复核当前版本和文件清单；该条目尚无可用安全扫描报告。',
        sourceUrl: 'https://hub.cocoloop.cn/skills/62249',
        sourceLabel: 'CocoLoop 来源页',
        skillDocPurpose: '该 Skill 用脚本把研报搜索、正文提取、结果校验和 Markdown 输出串成可复用流程，并提供示例与模板。',
        relatedSlugs: ['market-research', 'aitubiao-smart-chart', 'content-engine'],
        statusLabel: 'CocoLoop 新收录',
        featuredBadge: '实用研究',
        beginnerNote: '研报可能受版权和来源站使用条款约束；请做摘要、引用和链接回源，不要未经授权批量转载全文。',
        preparation: [
            '准备 2 到 5 个准确行业关键词。',
            '明确机构、作者或发布日期筛选条件。',
            '提前定义最终输出是资料清单、观点对比还是研究结论。'
        ],
        promptExample: `请使用 report-search 检索近 12 个月的中国企业级 AI Agent 行业研报。
1. 优先权威机构，并按发布日期倒序筛选。
2. 返回标题、机构、作者、日期、原始链接和摘要。
3. 只提取与市场规模、商业模式和竞争格局相关的正文片段。
4. 区分报告原文、你的概括和你的推断。
5. 不要转载与问题无关的全文。`,
        resultSummary: '你会得到一份带来源信息的研报清单，以及围绕研究问题提取的摘要和正文证据。',
        resultBullets: [
            '支持按关键词、机构、作者和时间筛选。',
            '包含搜索、正文提取、校验脚本、模板和示例。',
            '更适合作为研究取材入口，不应替代对原始报告的核验。'
        ],
        notes: [
            '原始标题：report-search；作者/账号：eliauktm。',
            '来源可信度标注为 T2，但 CocoLoop 当前未提供该版本的安全扫描结果。',
            '该 Skill 访问 fxbaogao.com；使用前需自行复核接口稳定性、网站条款与报告版权。',
            '详情页和作者页未提供作者头像、Skill 封面或相关图片，本条目未使用无关配图。'
        ]
    },
    'baoyu-infographic-cocoloop': {
        name: '宝玉信息图',
        slug: 'baoyu-infographic-cocoloop',
        headline: '自动分析内容，从 21 种布局和 22 种视觉风格中组合生成出版级信息图。',
        scenario: '适合把研究结论、产品对比、流程、时间线和数据摘要转成可分享的视觉交付物。',
        overview: '这是 CocoLoop 新增批次中完成度最高的内容可视化 Skill 之一。它会先分析信息结构，再推荐布局与风格组合并生成信息图；原仓库公开，CocoLoop 安全等级为 S+，但仍应在安装前复核当前版本和扫描报告。',
        useCases: ['研究结论可视化', '产品与竞品对比', '流程与时间线说明', '社交媒体信息卡片'],
        gettingStarted: [
            '准备结构清楚的原始内容，并明确受众、用途和画布尺寸。',
            '先让 Skill 分析信息层级并推荐布局，再选择与品牌和内容匹配的风格。',
            '生成后人工复核数字、引用、专有名词和中文字形，不把视觉效果当成事实校验。'
        ],
        installCommand: `# CocoLoop 手动下载（当前复核版本 1.117.4）
https://dl.cocoloop.cn/bss/skills/jimliu-baoyu-infographic-1.117.4.zip

# 原始开源仓库
https://github.com/JimLiu/baoyu-skills`,
        installHint: '优先从原始 GitHub 仓库核对最新版本；CocoLoop 条目显示 MIT-0 许可、T3 社区来源和 S+ 安全等级。',
        sourceUrl: 'https://hub.cocoloop.cn/skills/15614',
        sourceLabel: 'CocoLoop 来源页',
        skillDocPurpose: '该 Skill 通过内容分析、布局选择、风格匹配和图像生成流程，把长文或结构化资料转换为信息图。',
        relatedSlugs: ['market-research', 'report-search', 'aitubiao-smart-chart'],
        statusLabel: 'CocoLoop 新收录',
        featuredBadge: 'S+ 安全',
        beginnerNote: '信息图可能重排或简化原文；发布前必须复核数据、引用和图片权利。',
        preparation: ['原始文本或结构化数据', '目标受众与发布平台', '尺寸、品牌色和字体约束'],
        promptExample: `请使用 Baoyu Infographic 把以下研究摘要制作成竖版信息图。
1. 先列出信息层级，并说明推荐的布局和风格。
2. 保留关键数字、单位、时间和来源。
3. 不要补写原文没有的数据或因果关系。
4. 生成后附一份文字校对清单，便于人工验收。`,
        resultSummary: '你会得到一张与内容结构匹配的信息图，以及便于发布前验收的文字核对依据。',
        resultBullets: ['21 种布局与 22 种视觉风格可组合', '支持先分析内容再推荐呈现方案', '适合从研究材料直接产出可分享视觉交付物'],
        notes: [
            '原始标题：Baoyu Infographic；作者/账号：jimliu。',
            '出处：CocoLoop 来源页与 JimLiu/baoyu-skills 公开仓库；CocoLoop 标注许可证为 MIT-0。',
            'CocoLoop 扫描报告显示 S+ 等级、52 个文件和 2 项发现；安装时仍需阅读当前报告和文件清单。',
            '详情页和作者页未提供作者头像、Skill 封面或交付物图片；本条目未使用无关平台配图。'
        ]
    },
    'aitubiao-smart-chart': {
        name: '爱图表智能图表',
        slug: 'aitubiao-smart-chart',
        headline: '把 Excel、CSV 或粘贴数据转成 40+ 种专业图表，用于分析、汇报和内容配图。',
        scenario: '适合商务分析、市场运营、产品经理和内容创作者，在不写可视化代码的情况下快速产出柱状图、桑基图、词云等图表。',
        overview: '这是 CocoLoop 新上传区里用途最广的数据可视化 Skill。它由 aitubiao 账号维护，通过官方 API 解析结构化数据并生成 40 余种图表。它的优势是类型覆盖广、流程和费用确认写得完整；边界是必须上传数据到第三方云端，且免费额度用完后需付费。',
        useCases: ['汇报图表生成', '运营数据可视化', '研究与论文配图', '内容文章配图'],
        gettingStarted: [
            '只使用非敏感或已脱敏的 Excel、CSV 与粘贴数据。',
            '首次使用前在爱图表官方页面创建 API Key，并确认本地凭证文件权限。',
            '让 Skill 先识别字段和推荐图表，在它显示预计消耗后再确认生成。',
            '下载结果后检查数据、标题和标注，不要把 AI 选图当成分析结论。'
        ],
        installCommand: `# CocoLoop 手动下载
https://dl.cocoloop.cn/bss/skills/%E7%88%B1%E5%9B%BE%E8%A1%A8-%E6%99%BA%E8%83%BD%E5%9B%BE%E8%A1%A8.zip

# 来源页
https://hub.cocoloop.cn/skills/15342`,
        installHint: '下载前请在 CocoLoop 来源页复核当前版本、安全报告、计费与数据上传条款。',
        sourceUrl: 'https://hub.cocoloop.cn/skills/15342',
        sourceLabel: 'CocoLoop 来源页',
        skillDocPurpose: '该 Skill 把认证、数据识别、图表推荐、费用确认、生成与下载固定成一条可检查流程，并明确禁止对可能重复扣费的创建请求自动重试。',
        relatedSlugs: ['xlsx', 'market-research', 'ppt-master'],
        statusLabel: 'CocoLoop 新收录',
        featuredBadge: 'A 级安全',
        beginnerNote: '这是云端 API Skill，不适合未脱敏的客户、财务或个人数据；生成前务必确认 AI 贝消耗。',
        preparation: [
            '准备一份小于 100KB 的脱敏结构化数据。',
            '提前想清楚图表需要支撑哪个汇报结论。',
            '确认能够接受第三方 API、项目数上限和后续付费。'
        ],
        promptExample: `请使用爱图表-智能图表分析这份已脱敏的 CSV。
1. 先说明字段结构和你推荐的 3 种图表。
2. 解释每种图表分别回答什么业务问题。
3. 查询配额并明确告诉我预计消耗。
4. 在我确认前不要创建项目。
5. 生成后返回在线项目和可下载格式。`,
        resultSummary: '你会得到一组可在线编辑和导出的图表项目，以及选图与费用说明。',
        resultBullets: [
            '覆盖 40+ 种基础与高级图表。',
            '支持 Excel、CSV、TXT 和粘贴数据。',
            '结果保存在爱图表云端，可在线编辑并导出。'
        ],
        notes: [
            '原始标题：爱图表-智能图表；作者/账号：aitubiao。',
            'CocoLoop 标注安全等级 A、来源可信度 T2；使用前仍需自行复核下载包与最新条款。',
            '该 Skill 会把数据上传到 api.aitubiao.com，不要用于敏感或未授权数据。',
            '详情页与 aitubiao 账号页未提供作者头像或 Skill 封面，本条目未使用无关平台图片。'
        ]
    },
    'content-engine': {
        name: '多平台内容改写',
        statusLabel: '已实测',
        featuredBadge: '精选 16',
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
        featuredBadge: '精选 16',
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
    'filesystem-mcp': {
        name: '文件系统操作（MCP）',
        statusLabel: '已实测',
        featuredBadge: '精选 16',
        beginnerNote: '它最适合拿来做“AI 直接读你的工作目录”这件事。第一次不要一上来就开放整个硬盘，先只给一个项目文件夹。',
        preparation: [
            '先想清楚你要让 AI 访问哪一个工作目录，尽量只开放最小范围。',
            '准备一个真实测试场景，例如“整理会议纪要”“汇总本周日报”或“批量改几个 markdown 文件”。',
            '如果目录里有敏感文件，先单独挪走，或者先在测试目录里试跑。'
        ],
        promptExample: `安装完成后，可以先这样测试 Filesystem MCP：
1. 读取我这个项目目录里的所有 Markdown 文件，按主题分组整理。
2. 帮我找出上周新增的周报文件，并汇总成一份待办清单。
3. 不要修改原文件，先把整理结果输出成一个新的 \`weekly-summary.md\` 草稿。`,
        resultSummary: 'MCP 生效后，AI 不再只是“告诉你应该怎么整理文件”，而是能直接读取目录、抓取内容，并把整理结果写成新的交付文件。',
        resultBullets: [
            '特别适合资料归档、日报周报汇总、批量改文档和项目目录梳理。',
            '第一次就能明显感受到 AI 从“聊天”变成“处理文件”。',
            '如果你只开放了一个工作目录，安全边界也会更清楚。'
        ],
        notes: [
            '先把权限范围缩小，再逐步扩大，比一开始就开放整个电脑更稳。',
            '涉及批量写文件时，第一次建议先要求 AI 只生成草稿，不直接覆盖原文。'
        ]
    },
    'pdf-reader-mcp': {
        name: 'PDF 文档解析（MCP）',
        statusLabel: '已实测',
        featuredBadge: '精选 16',
        beginnerNote: '如果你经常看合同、方案、研究报告或扫描件，这个 MCP 会是最容易立刻产生价值的一项。',
        preparation: [
            '先准备 1 到 2 份真实 PDF 样本，最好包含一份普通 PDF 和一份较复杂或较长的 PDF。',
            '先明确你最想让 AI 帮你做什么，是提取重点、转结构化内容，还是整理成提纲。',
            '如果是扫描件，第一次测试时先观察抽取质量，再决定要不要继续做表格或流程图转换。'
        ],
        promptExample: `安装完成后，请帮我测试这个 PDF Reader MCP：
1. 读取这份 PDF 并提取核心结论。
2. 把全文整理成“背景 / 关键数据 / 风险点 / 下一步动作”四段结构。
3. 如果文档里有流程或步骤，再补一版适合转成流程图的结构化摘要。`,
        resultSummary: '你会先拿到一份更适合继续处理的结构化内容，而不是自己一页页硬读 PDF。',
        resultBullets: [
            '适合长文档快速抓重点，也适合把 PDF 变成后续汇报和知识整理的输入。',
            '如果文档原本难复制或页数很长，节省时间会非常明显。',
            '和 Mermaid MCP 连起来用时，可以把文档里的流程再转成图。'
        ],
        notes: [
            '第一次先用“摘要 + 提纲”类任务最稳，确认质量后再做更复杂的抽取。',
            '如果 PDF 质量很差，先把预期放在“提取关键信息”，不要一开始就要求完美还原版式。'
        ]
    },
    'playwright-mcp': {
        name: '网页自动化（MCP）',
        statusLabel: '已实测',
        featuredBadge: '精选 16',
        beginnerNote: '它适合替你做重复网页动作。第一次先选一个登录要求低、步骤不长的页面流程，最容易跑通。',
        preparation: [
            '先明确一段最短网页流程，例如打开页面、搜索、点击、读取结果。',
            '如果目标页面需要登录，先确认测试环境和账号权限是否合适。',
            '第一次尽量避免过长的多系统流程，先从 3 到 5 步的简单操作开始。'
        ],
        promptExample: `安装 Playwright MCP 后，请先做一个最小测试：
1. 打开指定网页。
2. 点击页面上的主要按钮或导航项。
3. 截图并告诉我页面上出现了哪些关键内容。

如果这个最小流程没问题，再继续帮我把整套网页操作步骤串起来。`,
        resultSummary: '配置完成后，AI 能真实执行点击、输入、等待和截图，不只是“描述应该怎么操作网页”。',
        resultBullets: [
            '很适合重复后台操作、表单检查、页面巡检和数据收集。',
            '如果网页是动态加载的，效果会明显比普通抓取类 MCP 更稳。',
            '一旦最小流程跑通，后续就可以把多个步骤串成自动化任务。'
        ],
        notes: [
            '先验证最小流程成功，再加登录、跳转和复杂条件判断。',
            '遇到需要验证码或严格风控的网站时，先确认是否适合自动化。'
        ]
    },
    'mermaid-mcp': {
        name: '流程图生成（MCP）',
        statusLabel: '已实测',
        featuredBadge: '精选 16',
        beginnerNote: '它最适合把“说不清的一段流程描述”直接变成一张能看、能改、能继续复用的图。',
        preparation: [
            '先准备一段流程说明，哪怕只是几步自然语言也可以。',
            '提前想好你要的是业务流程、SOP、系统结构，还是任务拆解图。',
            '第一次先做结构简单的图，确认风格和节点层级都对，再扩成复杂版本。'
        ],
        promptExample: `请用 Mermaid MCP 帮我把下面这段说明画成流程图：
1. 用户提交需求
2. 系统自动分类
3. 运营人工复核
4. 通过后进入执行
5. 执行结果回传并归档

要求：先输出一版清晰的主流程图，再补一个适合放进汇报文档的简洁版本。`,
        resultSummary: '你会得到可视化流程图产物，而不是只有一段“建议你自己去画图”的文字说明。',
        resultBullets: [
            '适合把 SOP、项目流程、业务步骤和系统结构说清楚。',
            '修改成本很低，后续只要改文字描述就能继续生成新图。',
            '和 PDF Reader 一起用时，能把文档中的流程直接转成图。'
        ],
        notes: [
            '第一次先追求结构正确，不要一开始就追求很复杂的视觉美化。',
            '如果输入描述本身不清楚，先让 AI 帮你整理成步骤，再生成流程图会更稳。'
        ]
    },
    'free-web-search-mcp': {
        name: 'Tavily 实时网络搜索（MCP）',
        statusLabel: '已实测',
        featuredBadge: '精选 16',
        beginnerNote: '这条 MCP 最适合当“联网搜索入口”来装。先把 Tavily API Key 配好，再用一个最新问题做测试，通常最容易确认有没有生效。',
        preparation: [
            '先到 Tavily 控制台注册账号并复制 API Key。',
            '执行安装命令前，把命令里的 `<your-api-key>` 替换成你自己的真实 Key。',
            '添加完成后，重启 Claude Code，再用 `/mcp` 确认 `tavily` 服务已经出现。'
        ],
        promptExample: `安装完成后，请先这样测试 Tavily MCP：
1. 搜索最近一周关于“AI Agent”最值得关注的 5 条消息。
2. 给出每条消息的来源和一句话摘要。
3. 再帮我判断哪些信息更值得继续深挖，哪些只是热闹。

如果 Tavily MCP 没有生效，请先提醒我检查 API Key 和 \`/mcp\` 列表。`,
        resultSummary: '配置成功后，它会先联网搜索，再把结果整理成带来源的资料列表，适合继续做判断、对比和汇总。',
        resultBullets: [
            '特别适合最新资料查询、事实核验和轻量研究。',
            '相比只靠模型记忆，它更适合回答带时间性的搜索问题。',
            '如果 `/mcp` 里已经能看到 `tavily`，通常就说明安装链路已经通了。'
        ],
        notes: [
            '如果你已经拿到目标链接，直接用 Fetch 或 Playwright 读取正文通常会更高效。',
            '这条配置是 HTTP transport 方式，不是本地命令行拉起型 MCP。'
        ]
    },
    'claude-code-config': {
        name: 'Claude Code + MiniMax 安装配置',
        slug: 'claude-code-config',
        detailLayout: 'markdown',
        headline: 'Windows 用户从零安装 Claude Code CLI，通过 CC-Switch 接入 MiniMax，预计耗时 30-60 分钟。',
        guideIntro: [
            '用自然语言对话，直接操作你电脑上的文件、代码和数据',
            '理解完整项目上下文，支持跨文件分析、重构和批量修改',
            '终端里完成复杂任务：合并 Excel、批量重命名、自动生成报告',
            '配合 MiniMax 月付 29 元即可使用，无需 Anthropic 官方账号'
        ],
        scenario: '适合第一次在 Windows 上安装 Claude Code，希望用 MiniMax Coding Plan 替代官方账号的用户。',
        overview: '本教程以 Windows 10/11 为例，按”安装 Claude Code → 开通 MiniMax → 配置 CC-Switch → 启动验证”顺序一步步完成。CC-Switch 会拦截 Claude Code 的 API 请求并转发到 MiniMax，无需额外写环境变量。',
        useCases: [
            'Windows 电脑首次安装 Claude Code CLI',
            '使用 MiniMax Coding Plan 替代 Anthropic 官方账号',
            '通过 CC-Switch 管理模型服务商配置',
            '排查 Claude Code 启动、PATH 和模型连接问题'
        ],
        gettingStarted: [
            '确认电脑已安装 Node.js（v18+）和 Git for Windows，在 PowerShell 运行 `node --version` 和 `git --version` 验证。',
            '执行 `npm install -g @anthropic-ai/claude-code --registry=https://registry.npmmirror.com`，安装后运行 `claude --version`。',
            '在 MiniMax 官网注册账号，开通 29 元/月的 Coding Plan 套餐，进入 API Key 页面复制 Key。',
            '下载并安装 CC-Switch，添加 MiniMax 配置（选择预设 MiniMax 供应商，填入 API Key，模型名称填 MiniMax-M2.5），点击启用。',
            '按 Win+R 输入 `notepad %USERPROFILE%\\.claude.json`，写入 `{“hasCompletedOnboarding”: true}` 并保存。',
            '在项目目录运行 `claude`，出现聊天界面即配置成功。'
        ],
        installCommand: `npm install -g @anthropic-ai/claude-code --registry=https://registry.npmmirror.com
claude --version`,
        installHint: '先通过 npm 安装 Claude Code CLI，再用 CC-Switch 接入 MiniMax，无需手动写环境变量。',
        promptExample: `我已经完成 Claude Code + MiniMax 配置。请帮我做一次验收：
1. 检查 claude --version 是否可用。
2. 确认 CC-Switch 是否处于已启用状态。
3. 在当前项目目录运行 claude，测试一次简单对话。
4. 如果有任何步骤失败，请给我最小排查顺序。`,
        resultSummary: '完成后在项目目录运行 `claude` 即可进入聊天界面，所有 API 请求通过 CC-Switch 转发到 MiniMax，无需 Anthropic 账号。',
        resultBullets: [
            'CC-Switch 常驻后台时，后续只需在项目目录运行 `claude` 即可。',
            '可在 CC-Switch 中一键切换不同模型服务商。',
            '验收最简路径：`claude --version` → CC-Switch 绿色启用 → `claude` 出现聊天界面。'
        ],
        markdownSections: [
            {
                title: 'Claude Code + MiniMax 安装配置指南（Windows）',
                body: '本教程以 Windows 10/11 为例，带你从零安装 Claude Code CLI，并通过 CC-Switch 将模型请求接入 MiniMax。预计耗时 30-60 分钟（首次配置）。\n如果已有旧版环境变量配置（ANTHROPIC_BASE_URL、ANTHROPIC_AUTH_TOKEN 等），请先删除，再按本教程重新配置，本文只使用 CC-Switch + MiniMax 方案。'
            },
            {
                title: '前提条件：确认 Node.js 与 Git 已安装',
                body: '打开 PowerShell（按 Win+X 选 Windows PowerShell），分别运行以下命令，能看到版本号说明环境已就绪，可跳过安装步骤直接进入第一步。',
                code: `node --version
npm --version
git --version`
            },
            {
                title: '前提条件：安装 Node.js（未安装者参考）',
                body: '打开 https://nodejs.org/，下载 LTS（长期支持版，版本号 ≥ 18）。双击运行安装程序，一路 Next 使用默认选项。安装完成后，重新打开 PowerShell 或 CMD，运行验证命令。',
                links: [
                    { label: 'Node.js 官网', href: 'https://nodejs.org/' }
                ],
                code: `node --version
# 应输出 v18.x.x 或更高版本

npm --version
# 应输出 9.x.x 或更高版本`,
                images: [
                    CC_IMG('nodejs-homepage.png', 'Node.js 官网首页：点击"获取 Node.js®"下载 LTS 版'),
                    CC_IMG('nodejs-download.png', 'Node.js 下载页：选择 Windows 安装程序（.msi）下载')
                ]
            },
            {
                title: '前提条件：安装 Git for Windows（未安装者参考）',
                body: '访问 https://git-scm.com/download/win 下载安装包。安装过程按下图顺序操作，大多数选项保持默认即可。安装完成后关闭并重新打开 PowerShell，运行 git --version 验证。',
                images: GIT_SETUP_IMAGES
            },
            {
                title: '一、安装 Claude Code',
                body: '打开 PowerShell，执行以下安装命令。安装完成后运行 `claude --version`，看到版本号（如 claude v2.x.x）即成功。如果出现红色报错提示，这是正常的——因为还没有配置模型，配置好 CC-Switch 后就会恢复正常。',
                code: `npm install -g @anthropic-ai/claude-code --registry=https://registry.npmmirror.com
claude --version`,
                image: CC_IMG('cc-install-success.png', 'Claude Code 安装成功，终端显示版本号')
            },
            {
                title: '二、申请 MiniMax 账号并开通套餐',
                body: '访问 MiniMax 官网注册或登录账号，进入用户中心的 Coding Plan 页面，开通 29 元/月套餐。开通后才能获得 Claude Code 接入所需的模型调用额度。',
                links: [
                    { label: 'MiniMax 订阅页面', href: 'https://platform.minimaxi.com/user-center/payment/coding-plan' }
                ],
                image: CC_IMG('minimax-coding-plan.jpeg', 'MiniMax 开通 Coding Plan 套餐（29 元/月）')
            },
            {
                title: '二、获取 MiniMax API Key',
                body: '打开下方链接进入接口密钥页面。找到 Token Plan Key 区域，点击”复制”按钮，保存 sk-cp- 开头的 Key，后面会填入 CC-Switch。不要把 Key 发给他人或提交到代码仓库。',
                links: [
                    { label: 'MiniMax 接口密钥页面', href: 'https://platform.minimaxi.com/user-center/basic-information/interface-key' }
                ],
                image: CC_IMG('minimax-api-key-new.png', 'MiniMax 接口密钥页面：在 Token Plan Key 区域点击复制')
            },
            {
                title: '三、安装 CC-Switch',
                body: 'CC-Switch 是代理工具，它会拦截 Claude Code 的 API 请求并转发到指定模型（如 MiniMax）。下载 Windows 安装包（MSI 格式），双击安装后按提示完成，无需特殊配置。如果 GitHub 链接无法打开，请使用百度网盘备用下载（提取码：hraa）。',
                links: [
                    { label: 'GitHub 下载 CC-Switch-v3.14.1-Windows.msi（推荐）', href: 'https://github.com/farion1231/cc-switch/releases/download/v3.14.1/CC-Switch-v3.14.1-Windows.msi' },
                    { label: '百度网盘备用下载（提取码：hraa）', href: 'https://pan.baidu.com/s/1_hLr95tA1VS98WsMyCMzRQ?pwd=hraa' }
                ]
            },
            {
                title: '三、在 CC-Switch 中添加 MiniMax 配置',
                body: '打开 CC-Switch，点击右上角”+”按钮，选择预设的 MiniMax 供应商，在 API Key 栏填入刚才复制的 MiniMax API Key。',
                image: CC_IMG('cc-switch-provider.jpeg', 'CC-Switch：选择 MiniMax 供应商并填入 API Key')
            },
            {
                title: '三、将模型名称改为 MiniMax-M2.5',
                body: '将模型名称修改为 MiniMax-M2.5，完成后点击右下角”添加”按钮保存配置。',
                image: CC_IMG('cc-switch-minimax.jpeg', 'CC-Switch：将模型名称改为 MiniMax-M2.5')
            },
            {
                title: '三、启用 MiniMax 配置',
                body: '回到 CC-Switch 首页，找到刚添加的 MiniMax 配置，点击”启用”。状态变为绿色”已启用”后，CC-Switch 就会接管 Claude Code 的 API 请求。',
                image: CC_IMG('cc-switch-enable.png', 'CC-Switch：点击启用，状态变为绿色')
            },
            {
                title: '三、创建首次引导配置文件（跳过登录界面）',
                body: '按 Win+R，输入 `notepad %USERPROFILE%\\.claude.json` 后回车，在打开的记事本中填入以下内容，按 Ctrl+S 保存后关闭。此文件的作用是跳过 Claude Code 首次要求登录 Anthropic 账号的引导流程。',
                code: `{
  “hasCompletedOnboarding”: true
}`,
                image: CC_IMG('claude-json-onboarding.png', '创建 .claude.json，跳过 Claude Code 首次登录引导')
            },
            {
                title: '四、启动 Claude Code',
                body: '打开 PowerShell，进入你想使用的项目文件夹，运行 `claude`。',
                code: `cd D:\\我的项目
claude`
            },
            {
                title: '五、验证配置成功',
                body: '看到类似下图的聊天界面，说明 Claude Code 已经通过 CC-Switch 成功连接到 MiniMax。现在可以用自然语言和 Claude Code 对话了。',
                image: CC_IMG('cc-chat-success.jpg', '配置成功：Claude Code 聊天界面正常启动')
            },
            {
                title: '六、快速上手技巧',
                list: [
                    '每次使用前确认 CC-Switch 处于绿色”已启用”状态。',
                    '在项目根目录创建 CLAUDE.md 文件，写入项目说明和编码规范，AI 会自动读取。',
                    '用 /clear 清空对话历史，避免上下文过长影响质量。',
                    '用 /help 查看所有可用命令，用 Ctrl+C 中断当前任务，用 Ctrl+D 退出 Claude Code。',
                    '复杂任务可以先用”帮我规划一下……”，让 Claude Code 列出步骤后再逐步执行。'
                ]
            },
            {
                title: '七、常见问题',
                list: [
                    'npm command not found / npm 不是内部或外部命令：Node.js 未安装或未生效，重新安装后关闭并重新打开终端。',
                    'claude command not found：安装成功后有时需要重启终端才能识别，关闭 PowerShell 窗口重新打开再试。',
                    'CC-Switch 已启用但 Claude Code 还是报连接错误：确认 CC-Switch 状态为绿色已启用；关闭终端重新打开；重启 CC-Switch 后再次点击启用。',
                    '之前配过 ANTHROPIC_BASE_URL 等环境变量想改回 CC-Switch：打开系统环境变量，删除 ANTHROPIC_BASE_URL、ANTHROPIC_AUTH_TOKEN、CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC，关闭所有终端后重新打开。',
                    '配置完成后不需要每次重新配置：只要 CC-Switch 保持启用状态，以后直接在项目目录运行 claude 即可。'
                ]
            }
        ],
        notes: [
            '本教程只写 Windows 版安装与 CC-Switch + MiniMax 接入流程，不涉及手动写环境变量方案。',
            'MiniMax API Key 属于敏感信息，只填在 CC-Switch 配置中，不要写进项目文件或分享给他人。',
            'CC-Switch 支持多个配置，可以在首页一键切换不同模型服务商。'
        ],
        sourceUrl: 'https://platform.minimaxi.com/user-center/payment/coding-plan',
        sourceLabel: 'MiniMax Coding Plan 页面',
        skillDocPurpose: '这个条目不是可安装 Skill，而是 AI 能力库中的配置教程。它把 Windows 版 Claude Code + CC-Switch + MiniMax 实操安装流程整理成可浏览的教程，帮助读者完成首次配置。'
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
        featuredBadge: '精选 16',
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
