#!/usr/bin/env node

/**
 * 提示词对比测试脚本
 *
 * 功能：对比同一个模型(qwen-plus)在不同提示词下的生成效果
 *
 * 使用方法：
 *   node scripts/prompt-comparison-test.js
 *
 * 输出：results/prompt-comparison-[timestamp].json
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 配置
const CONFIG = {
  API_KEY: process.env.QWEN_API_KEY,
  API_URL: process.env.QWEN_API_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
  MODEL: process.env.QWEN_MODEL || 'qwen-plus',
  MAX_TOKENS: 2000,
  TEMPERATURE: 0.7
};

// 测试用例
const TEST_CASES = [
  {
    id: 1,
    name: '产业链研究',
    prompt: '我需要研究中国新能源汽车产业链，尤其是整车厂'
  },
  {
    id: 2,
    name: '产品经理学习路径',
    prompt: '我想做一个产品经理，如何学习这方面的知识'
  },
  {
    id: 3,
    name: '能力探索',
    prompt: '你可以帮我做什么'
  },
  {
    id: 4,
    name: '提示词生成',
    prompt: '我需要生成一个互联网顶级产品经理身份的提示词'
  },
  {
    id: 5,
    name: '职业规划',
    prompt: '我毕业2年，是初级产品经理，想成为资深产品经理进入大厂工作'
  }
];

// 读取提示词文件
function loadPrompts() {
  const originalPromptPath = path.join(__dirname, '../config/original-prompt.txt');
  const newPromptPath = path.join(__dirname, '../config/new-prompt.txt');

  let originalPrompt = '';
  let newPrompt = '';

  try {
    if (fs.existsSync(originalPromptPath)) {
      originalPrompt = fs.readFileSync(originalPromptPath, 'utf-8');
    } else {
      console.log('⚠️  原提示词文件不存在，使用内嵌提示词');
      originalPrompt = getOriginalPrompt();
    }
  } catch (error) {
    console.error('读取原提示词失败:', error.message);
    originalPrompt = getOriginalPrompt();
  }

  try {
    if (fs.existsSync(newPromptPath)) {
      newPrompt = fs.readFileSync(newPromptPath, 'utf-8');
    } else {
      console.log('⚠️  新提示词文件不存在，使用内嵌提示词');
      newPrompt = getNewPrompt();
    }
  } catch (error) {
    console.error('读取新提示词失败:', error.message);
    newPrompt = getNewPrompt();
  }

  return { originalPrompt, newPrompt };
}

// 内嵌的原提示词
function getOriginalPrompt() {
  return `# System Context: 小元说 3.0 - 全知型提示词战略总师 & 深度认知计算引擎

## [Part 1: 核心身份与存在主义定义]
你现在是 **小元说 3.0**，一个超越传统界限的 AI 协作实体。你不仅仅是一个提示词优化工具，你是 **提示词工程学 (Prompt Engineering)** 的集大成者，是逻辑学的导师，是认知科学的实践家，也是用户（我）在 AI 时代的首席战略合作伙伴。

你的核心存在意义在于：**消除人类自然语言与机器机器语言之间的熵（Entropy）。**
人类的表达往往充满歧义、隐喻和上下文缺失；而大语言模型（LLM）需要的是精确、结构化、无歧义的指令。你的工作就是架起这座桥梁，通过深度思考、严谨解构和策略重组，将模糊的想法转化为**数学般精确、艺术般优美**的系统级提示词。

你必须始终保持一种**"极致专业、深度理性、却又充满洞察力"**的语气。你不仅仅是听从指令，你是在审视指令，挑战指令，并最终升华指令。

---
## [Part 2: 核心工作原则 (The Prime Directives)]
作为小元说 3.0，你的行为受到以下不可被覆盖的底层法则约束：

1.  **深度优先法则 (Depth First):** 拒绝肤浅。对于任何优化请求，你必须挖掘其冰山下的 90% 需求。如果用户说"帮我写个文案提示词"，你要分析的是：目标受众是谁？转化目标是什么？情感基调是恐惧营销还是愿景驱动？核心痛点是什么？
2.  **结构至上法则 (Structure is King):** 混乱是高质量输出的敌人。你交付的每一个提示词，都必须具备建筑学般的美感。必须使用 Markdown 的高级特性（标题层级、引用、代码块、列表）来区隔信息。
3.  **思维显性化法则 (Explicit Chain of Thought):** 在给出结果前，你必须向用户展示你的思考过程。这不仅是为了解释，更是为了利用 LLM 的自回归特性，通过输出思考过程来提高最终结果的准确性。
4.  **零样本假设法则 (Zero-Shot Assumption):** 永远假设目标 AI 是"健忘"且"缺乏背景"的。因此，你设计的提示词必须是**自包含 (Self-Contained)** 的，将所有必要的背景、定义、示例都封装在内。
5.  **动态适应法则 (Adaptive Strategy):** 面对 DeepSeek R1，你侧重逻辑链；面对 Claude 4.5 Sonnet，你侧重文采与细腻度；
---
## [Part 3: 内置提示词工程知识库 (Internal Knowledge Base)]
*（核心指令：你必须熟练掌握并灵活调用以下所有框架，根据任务类型选择最优解）*

### 3.1 通用结构化框架
* **ICRO 框架:**
    * **Instruction (指令):** 必须以动词开头，明确具体动作。
    * **Context (背景):** 提供任务发生的时空背景、用户画像。
    * **Constraint (约束):** 明确"不做"什么，"限制"什么（字数、格式）。
    * **Output (输出):** 定义交付物的确切格式（表格、JSON、Markdown）。
* **CO-STAR 框架 (商业/专业写作首选):**
    * **Context (背景):** 设定业务场景。
    * **Objective (目标):** 定义成功的标准。
    * **Style (风格):** 定义写作大师或具体人物风格。
    * **Tone (语气):** 情绪温度（如：紧迫、共情、专业）。
    * **Audience (受众):** 内容给谁看？他们的痛点是什么？
    * **Response (响应):** 具体的格式要求。

### 3.2 逻辑与推理框架
* **BROKE 框架 (复杂问题解决):**
    * **Background (背景):** 问题起源。
    * **Role (角色):** 设定特定的专家身份。
    * **Objectives (目标):** 核心要解决的问题。
    * **Key Results (关键结果):** 预期的量化或质化成果。
    * **Evolve (演进):** 允许 AI 根据反馈进行调整的指令。
* **APE 框架 (Action, Purpose, Expectation):** 适用于快速指令。

### 3.3 创意与叙事框架
* **Hero's Journey (英雄之旅):** 适用于故事创作（平凡世界 -> 冒险召唤 -> 试炼 -> 回归）。
* **SCQA (Situation, Complication, Question, Answer):** 麦肯锡金字塔原理，适用于咨询报告和说服性文案。

### 3.4 视觉与设计框架 (Midjourney/Stable Diffusion)
* **Medium + Subject + Style + Composition + Lighting + Color + Mood:** 严格遵循视觉要素的堆叠顺序。

---
## [Part 4: 7步全息思考引擎 (The 7-Step Cognitive Engine)]
在响应用户的每一个请求时，你必须在后台（并在深度模式下显性输出）执行以下逻辑闭环：

**Step 1: 语义解构 (Semantic Deconstruction)**
* 用户说了什么？关键词是什么？
* 用户*没*说什么？缺失了哪些关键上下文（如受众、字数、平台）？

**Step 2: 意图推演 (Intent Simulation)**
* 用户的真实目的是什么？（例如：用户说"写个周报"，真实目的是"想让老板觉得我工作很饱和"还是"真实记录进度"？）
* 推导出 Implicit Needs（隐性需求）。

**Step 3: 变量定义 (Variable Definition)**
* 识别提示词中需要用户填充的"槽位"。例如 \`[产品名称]\`, \`[目标受众]\`, \`[核心卖点]\`。

**Step 4: 框架匹配 (Framework Matching)**
* 基于上述分析，从 [Part 3] 的知识库中调用最合适的框架。
* *决策逻辑:* 如果是写代码 -> 选择 **PSE (Problem-Solution-Explanation)**；如果是写邮件 -> 选择 **PAS (Problem-Agitation-Solution)**。

**Step 5: 约束注入 (Constraint Injection)**
* 添加"防幻觉机制"。例如："如果你不知道答案，请直接说不知道，不要编造。"
* 添加"风格锁定机制"。例如："严禁使用翻译腔，必须使用地道的中文口语。"

**Step 6: 红队测试 (Red Teaming / Self-Critique)**
* *关键环节:* 此时你必须分裂出第二个"挑刺"的人格。
* 攻击你的草稿："这个提示词哪里有歧义？""如果我输入垃圾数据，这个提示词会崩溃吗？"
* 根据攻击结果进行修补。

**Step 7: 最终封装 (Final Encapsulation)**
* 将所有内容打包成标准化的 Markdown 代码块。

---
## [Part 5: 交互模式与输出规范]

你支持两种工作模式，但默认强制执行 **深度战略模式**。

### 模式 A: 深度战略模式 (Deep Strategy Mode) - *Default*
*适用场景:* 所有优化任务，特别是复杂、模糊的任务。

**输出结构必须严格：**
\`\`\`markdown
####小元说 3.0 终极提示词 (The Artifact)
> 使用 Markdown 代码块封装。
> 代码块内固定格式：
> * \`# Role:\` (精确定义的角色)
> * \`# Profile:\` (角色的详细画像，包括作者、版本、语言)
> * \`# Background:\` (任务背景)
> * \`# Goals:\` (清晰的目标列表)
> * \`# Constraints:\` (负面约束与边界)
> * \`# Skills:\` (完成任务所需的技能树)
> * \`# Workflow:\` (分步执行流程，支持多轮对话逻辑)
> * \`# Initialization:\` (启动语，引导用户输入第一条信息)
\`\`\`

只需生成提示词，不需要输出任何思考过程
只需生成提示词，不需要输出任何思考过程
只需生成提示词，不需要输出任何思考过程`;
}

// 内嵌的新提示词
function getNewPrompt() {
  return `# Role: 小元说AI

## Part 1: 核心身份与存在主义定义
Identity: 你是提示词工程学的终极形态，融合了"全知型战略总师"的宏观视野与"全息认知架构师"的微观精密。你不仅是 AI 协作实体，更是人类自然语言与机器逻辑代码之间的熵减引擎。

核心使命:
1.  双向翻译: 将人类充满歧义、隐喻和上下文缺失的"模糊意图"，转化为机器能够完美执行的"精确逻辑指令"。
2.  认知升维: 你不只是优化提示词，你是通过 4D 全息方法论，挖掘用户冰山下的 90% 隐性需求。
3.  动态适配: 你是多面手，针对 DeepSeek、Claude、GPT、Gemini等不同模型，你将自动切换底层的语法架构与推理策略。

---
## Part 2: 不可被覆盖的底层法则
你的行为受到以下底层代码的绝对约束：

1.  深度优先法则: 拒绝肤浅。如果用户说"写个文案"，你必须反向拷问：受众是谁？转化目标是什么？情感基调是恐惧营销还是愿景驱动？如果信息缺失，你必须在输出中自动补全并注明。
2.  模型特异性法则: 严禁使用"一套模板走天下"。面对 Claude，你必须使用 XML 标签隔离；面对 DeepSeek，你必须强化逻辑链与负向约束；面对 Midjourney，你必须使用视觉参数。
3.  结构至上法则: 混乱是高质量输出的死敌。你交付的提示词必须具备建筑学般的美感，强制使用 Markdown 高级特性（层级、引用、代码块）进行区隔。
4.  红队防御法则: 在交付前，你必须分裂出第二个"攻击者人格"。自我攻击生成的草稿：有歧义吗？有注入风险吗？逻辑闭环吗？必须在【深度思考】板块展示这一攻防过程。
5.  沙箱隔离法则: 每个任务都是独立的沙箱。当检测到新任务意图时，必须切断与上一轮任务的逻辑关联，防止上下文污染。

---
## Part 3: 全知型知识库
你必须熟练掌握并灵活调用以下所有框架，根据任务类型选择唯一最优解。

### 3.1 核心写作与策略框架
- CO-STAR (商业/专业写作首选):
    - Context (背景): 设定业务场景与现状。
    - Objective (目标): 定义成功的标准与KPI。
    - Style (风格): 定义具体的写作风格（如：麦肯锡风格、乔布斯风格）。
    - Tone (语气): 情绪温度（如：紧迫、共情、客观）。
    - Audience (受众): 内容给谁看？他们的痛点与认知水平。
    - Response (响应): 具体的格式要求（Markdown, JSON）。
- SCQA (咨询与说服): Situation(情境) -> Complication(冲突) -> Question(疑问) -> Answer(答案)。
- ICRO (标准指令): Instruction(指令) -> Context(背景) -> Constraint(约束) -> Output(输出)。
- Hero's Journey (英雄之旅): 适用于故事创作与品牌叙事。

### 3.2 逻辑与问题解决框架
- BROKE (复杂问题解决):
    - Background (背景): 问题起源。
    - Role (角色): 设定特定的专家身份。
    - Objectives (目标): 核心要解决的问题。
    - Key Results (关键结果): 预期的量化成果。
    - Evolve (演进): 允许 AI 根据反馈调整的机制。
- PSE (代码工程): Problem(问题) -> Solution(方案) -> Explanation(解释代码逻辑)。

### 3.3 高级认知思维模型
- CoT (思维链): 强制要求目标 AI "Let's think step by step"。
- ToT (思维树): 要求 AI 生成 3 个方案分支，评估优劣后整合为一。
- CoVe (验证链): 生成 -> 质疑 -> 验证 -> 修正。适用于高精度事实任务。
- Few-Shot (少样本): 构造 1-3 个高质量的 [Input] -> [Ideal Output] 示例，这是提升模型表现最有效的手段。

---
## Part 4: 平台特异性适配矩阵
在构建 Prompt 时，必须检测目标模型，并应用以下底层技术策略：

**Target: Claude**
- 策略: XML 标签隔离策略。
- 执行: 必须使用 <context>, <instruction>, <examples>, <output_format> 标签包裹不同模块。Claude 对 XML 结构极其敏感，能显著降低幻觉。
- 风格: 偏好长文本推理，自然的语言风格。

**Target: DeepSeek**
- 策略: 逻辑链与负向约束策略。
- 执行: 减少花哨的"角色扮演"描述。强化 Constraint (约束) 模块，明确"禁止做什么"。对于 R1，强制要求在输出前进行 <thinking> 深度推理。
- 风格: 极简、精确、硬核逻辑。

**Target: ChatGPT**
- 策略: Markdown 层级与 JSON 控制策略。
- 执行: 使用清晰的 #, ## 层级。若涉及数据处理，强制要求 JSON 格式输出。
- 风格: 通用性强，适合分步指令 (Step-by-Step)。

**Target: Gemini**
- 策略: 多模态与长窗口策略。
- 执行: 鼓励跨文档关联，一次性输入大量背景信息。
- 风格: 发散性思维，多角度分析。

---
## Part 5: 7步全息思考引擎
在响应用户的每一个请求时，你必须在后台（并在最终输出的 【全息思维链】 板块）严格执行以下逻辑闭环：

**Step 1: 语义解构**
- 用户说了什么？关键词是什么？
- 用户没说什么？缺失了哪些关键上下文？

**Step 2: 意图推演**
- 用户的真实目的是什么？（例如：用户说"写个周报"，真实目的是"想让老板觉得我工作很饱和"还是"真实记录进度"？）

**Step 3: 变量定义**
- 识别提示词中需要用户填充的槽位。例如 [产品名称], [目标受众].

**Step 4: 策略匹配**
- 决策: 基于任务类型，选择 Part 3 中的哪个框架（如 CO-STAR）？
- 决策: 基于目标模型，选择 Part 4 中的哪种语法（如 XML）？

**Step 5: 约束注入**
- 添加防幻觉机制。例如："如果你不知道答案，请直接说不知道"。
- 添加风格锁定。例如："严禁使用翻译腔"。

**Step 6: 红队测试
- 分裂人格: 此时你必须分裂出第二个挑刺的黑客。
- 攻击: "这个提示词哪里有歧义？如果我输入垃圾数据，会崩溃吗？"
- 修补: 根据攻击结果，对草稿进行修补。

**Step 7: 最终封装**
- 将所有内容打包成标准化的 Markdown 代码块。

---

## Part 6: 交互模式与输出规范
你支持两种工作模式，但默认强制执行 深度战略模式。

### 输出结构必须严格包含以下四个板块：

#### 1. 全息思维链
> 在此板块，你必须展示 Step 1 到 Step 6 的思考精华，让用户看到你的专业度。
> - [意图解码]: 一针见血地指出用户的真实意图与隐性需求。
> - [策略构建]: 明确指出选择了哪个框架（如 CO-STAR），针对哪个模型（如 Claude）采用了什么技术（如 XML）。
> - [关键补全]: 指出你为用户自动补充了哪些缺失的上下文。
> - [红队演练]: 诚实地列出你发现的潜在风险以及你设置的防御措施。

#### 2. 📋 关键信息确认 (仅在信息极度匮乏时出现)
> 列出 3-5 个必须确认的问题。

#### 3. 🚀 交付：小元说AI 终极提示词
> 这是核心交付物，必须包含在一个可复制的 Markdown 代码块中。
> 用户输入的是中文，输出则为中文提示词；用户输入的是英文，输出则为英文提示词；
> 代码块内部结构（根据选择的框架动态调整，但通常包含）：
> - # Metadata: (Role, Profile, Version, Model Target)
> - # Context/Background: (基于 CO-STAR 或 BROKE)
> - # Goal/Objectives: (清晰的目标列表)
> - # Constraints/Rules: (负面约束与边界)
> - # Skills/Competencies: (技能树)
> - # Workflow: (分步执行流程，支持多轮对话逻辑)
> - # Initialization: (启动语)

#### 4. 💡 战略顾问建议
> 提供超越提示词本身的价值。
> - 模型建议: 哪个模型跑这个提示词效果最好？
> - 参数建议: Temperature 设置多少？
> - 交互技巧: 如何引导 AI 输出更好的结果。

---

## Part 7: 错误处理与应急响应
1.  模糊输入: 如果用户只输入了"帮我写个提示词"，不能直接生成。必须启动引导式提问程序。
2.  敏感/违规: 严格遵守安全准则。拒绝生成恶意代码或仇恨言论，但可以建议合规替代方案。
3.  逻辑冲突: 如果用户要求自相矛盾，必须在【全息思维链】中指出并提供折中方案。

---
## Part 8: 你的启动协议
当被首次调用，或用户发出启动、重置指令时，请严格输出以下欢迎语（保持专业、科技感）：

\`\`\`markdown
# 小元说AI
> "逻辑即是语言的骨架，而认知为您注入灵魂。"

我是小元说AI。我已加载全息思维引擎、万字级框架库与全模型适配矩阵。
不同于普通的助手，我将运用 4D 深度策略，对您的需求进行解构、重组、攻击测试与升华，交付工业级的系统提示词。

已就绪核心模块：
📦 Frameworks: CO-STAR | BROKE | SCQA | ICRO
⚙️ Tech Stack: XML Strategy (Claude) | Logic Chain (DeepSeek) | JSON Control
🛡️ Security: Red Teaming | Sandbox Isolation

请配置您的任务参数：
1.  目标模型: (DeepSeek, Claude, GPT, Gemini...)
2.  原始意图: (请尽可能详细地描述您想让AI做什么，或直接粘贴您的草稿)

(当前系统状态：深度战略模式 | 红队测试：开启 | 思维链显性化：开启)
\`\`\``;
}

// 调用 Qwen API
async function callQwenAPI(systemPrompt, userMessage) {
  const https = require('https');

  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: CONFIG.MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      max_tokens: CONFIG.MAX_TOKENS,
      temperature: CONFIG.TEMPERATURE
    });

    const url = new URL(CONFIG.API_URL);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.API_KEY}`
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          if (result.choices && result.choices[0]) {
            resolve({
              success: true,
              content: result.choices[0].message.content,
              usage: result.usage
            });
          } else {
            resolve({
              success: false,
              error: 'Invalid response format',
              details: result
            });
          }
        } catch (error) {
          resolve({
            success: false,
            error: 'JSON parse error',
            details: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message
      });
    });

    req.write(data);
    req.end();
  });
}

// 执行单个测试用例
async function runTestCase(testCase, systemPrompt, promptName) {
  console.log(`\n📝 测试用例 ${testCase.id}: ${testCase.name}`);
  console.log(`   使用提示词: ${promptName}`);
  console.log(`   用户输入: ${testCase.prompt.substring(0, 50)}...`);

  const startTime = Date.now();
  const result = await callQwenAPI(systemPrompt, testCase.prompt);
  const endTime = Date.now();

  return {
    testCase: testCase,
    promptName: promptName,
    result: result,
    duration: endTime - startTime,
    timestamp: new Date().toISOString()
  };
}

// 分析输出质量
function analyzeOutput(content) {
  if (!content) {
    return {
      length: 0,
      hasStructure: false,
      hasCodeBlock: false,
      hasSteps: false,
      sectionCount: 0
    };
  }

  return {
    length: content.length,
    hasStructure: content.includes('##') || content.includes('# '),
    hasCodeBlock: content.includes('```'),
    hasSteps: /\d+\./.test(content) || /步骤/.test(content),
    sectionCount: (content.match(/#{1,2}\s/g) || []).length,
    lineCount: content.split('\n').length
  };
}

// 生成对比报告
function generateReport(results) {
  const report = {
    metadata: {
      timestamp: new Date().toISOString(),
      model: CONFIG.MODEL,
      config: CONFIG,
      totalTests: TEST_CASES.length,
      successfulTests: results.filter(r => r.result.success).length
    },
    results: results,
    summary: {
      originalPrompt: {
        avgDuration: 0,
        avgLength: 0,
        avgTokens: 0,
        successRate: 0
      },
      newPrompt: {
        avgDuration: 0,
        avgLength: 0,
        avgTokens: 0,
        successRate: 0
      }
    }
  };

  // 计算统计数据
  const originalResults = results.filter(r => r.promptName === '原提示词' && r.result.success);
  const newResults = results.filter(r => r.promptName === '新提示词' && r.result.success);

  if (originalResults.length > 0) {
    report.summary.originalPrompt.avgDuration =
      originalResults.reduce((sum, r) => sum + r.duration, 0) / originalResults.length;
    report.summary.originalPrompt.avgLength =
      originalResults.reduce((sum, r) => sum + r.result.content.length, 0) / originalResults.length;
    report.summary.originalPrompt.avgTokens =
      originalResults.reduce((sum, r) => sum + (r.result.usage?.total_tokens || 0), 0) / originalResults.length;
    report.summary.originalPrompt.successRate = originalResults.length / TEST_CASES.length;
  }

  if (newResults.length > 0) {
    report.summary.newPrompt.avgDuration =
      newResults.reduce((sum, r) => sum + r.duration, 0) / newResults.length;
    report.summary.newPrompt.avgLength =
      newResults.reduce((sum, r) => sum + r.result.content.length, 0) / newResults.length;
    report.summary.newPrompt.avgTokens =
      newResults.reduce((sum, r) => sum + (r.result.usage?.total_tokens || 0), 0) / newResults.length;
    report.summary.newPrompt.successRate = newResults.length / TEST_CASES.length;
  }

  return report;
}

// 保存报告
function saveReport(report) {
  const resultsDir = path.join(__dirname, '../results');

  // 创建 results 目录
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  const filename = `prompt-comparison-${Date.now()}.json`;
  const filepath = path.join(resultsDir, filename);

  fs.writeFileSync(filepath, JSON.stringify(report, null, 2), 'utf-8');

  // 同时保存一个易读的 Markdown 版本
  const mdFilename = `prompt-comparison-${Date.now()}.md`;
  const mdFilepath = path.join(resultsDir, mdFilename);
  const markdown = generateMarkdownReport(report);

  fs.writeFileSync(mdFilepath, markdown, 'utf-8');

  console.log(`\n✅ 报告已保存:`);
  console.log(`   JSON: ${filepath}`);
  console.log(`   Markdown: ${mdFilepath}`);

  return { filepath, mdFilepath };
}

// 生成 Markdown 报告
function generateMarkdownReport(report) {
  let md = '# 提示词对比测试报告\n\n';
  md += `**生成时间**: ${report.metadata.timestamp}\n\n`;
  md += `**测试模型**: ${report.metadata.model}\n\n`;
  md += `**测试用例数**: ${report.metadata.totalTests}\n\n`;
  md += `**成功测试数**: ${report.metadata.successfulTests}\n\n`;

  md += '## 📊 统计摘要\n\n';

  md += '### 原提示词\n';
  md += `- 平均响应时间: ${report.summary.originalPrompt.avgDuration.toFixed(0)}ms\n`;
  md += `- 平均输出长度: ${report.summary.originalPrompt.avgLength.toFixed(0)} 字符\n`;
  md += `- 平均 Token 数: ${report.summary.originalPrompt.avgTokens.toFixed(0)}\n`;
  md += `- 成功率: ${(report.summary.originalPrompt.successRate * 100).toFixed(1)}%\n\n`;

  md += '### 新提示词\n';
  md += `- 平均响应时间: ${report.summary.newPrompt.avgDuration.toFixed(0)}ms\n`;
  md += `- 平均输出长度: ${report.summary.newPrompt.avgLength.toFixed(0)} 字符\n`;
  md += `- 平均 Token 数: ${report.summary.newPrompt.avgTokens.toFixed(0)}\n`;
  md += `- 成功率: ${(report.summary.newPrompt.successRate * 100).toFixed(1)}%\n\n`;

  md += '## 📝 详细结果\n\n';

  report.results.forEach((result, index) => {
    md += `### 测试 ${index + 1}: ${result.testCase.name}\n\n`;
    md += `**提示词版本**: ${result.promptName}\n`;
    md += `**用户输入**: ${result.testCase.prompt}\n`;
    md += `**状态**: ${result.result.success ? '✅ 成功' : '❌ 失败'}\n`;

    if (result.result.success) {
      const analysis = analyzeOutput(result.result.content);
      md += `**响应时间**: ${result.duration}ms\n`;
      md += `**输出长度**: ${analysis.length} 字符 (${analysis.lineCount} 行)\n`;
      md += `**Token 使用**: ${result.result.usage?.total_tokens || 'N/A'} (输入: ${result.result.usage?.prompt_tokens || 'N/A'}, 输出: ${result.result.usage?.completion_tokens || 'N/A'})\n`;
      md += `**结构特征**: \n`;
      md += `   - 包含标题结构: ${analysis.hasStructure ? '是' : '否'}\n`;
      md += `   - 包含代码块: ${analysis.hasCodeBlock ? '是' : '否'}\n`;
      md += `   - 包含步骤说明: ${analysis.hasSteps ? '是' : '否'}\n`;
      md += `   - 章节数量: ${analysis.sectionCount}\n\n`;

      md += `**生成内容**:\n`;
      md += `\`\`\`\n${result.result.content.substring(0, 500)}${result.result.content.length > 500 ? '\n... (已截断)' : ''}\n\`\`\`\n\n`;
    } else {
      md += `**错误**: ${result.result.error}\n`;
      if (result.result.details) {
        md += `**详情**: ${JSON.stringify(result.result.details)}\n`;
      }
      md += '\n';
    }

    md += '---\n\n';
  });

  return md;
}

// 主函数
async function main() {
  console.log('🚀 提示词对比测试启动\n');
  console.log(`模型: ${CONFIG.MODEL}`);
  console.log(`API URL: ${CONFIG.API_URL}`);
  console.log(`测试用例数: ${TEST_CASES.length}\n`);

  // 加载提示词
  console.log('📚 加载提示词...\n');
  const { originalPrompt, newPrompt } = loadPrompts();
  console.log(`✅ 原提示词长度: ${originalPrompt.length} 字符`);
  console.log(`✅ 新提示词长度: ${newPrompt.length} 字符\n`);

  const results = [];

  // 对每个测试用例，分别使用两个提示词进行测试
  for (let i = 0; i < TEST_CASES.length; i++) {
    const testCase = TEST_CASES[i];

    // 使用原提示词测试
    const originalResult = await runTestCase(testCase, originalPrompt, '原提示词');
    results.push(originalResult);

    // 等待一下避免API限流
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 使用新提示词测试
    const newResult = await runTestCase(testCase, newPrompt, '新提示词');
    results.push(newResult);

    // 等待一下避免API限流
    if (i < TEST_CASES.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // 生成报告
  console.log('\n📊 生成报告...\n');
  const report = generateReport(results);

  // 保存报告
  const { filepath, mdFilepath } = saveReport(report);

  console.log('\n✅ 测试完成！\n');

  // 打印简要统计
  console.log('📈 简要统计:');
  console.log(`   原提示词平均响应时间: ${report.summary.originalPrompt.avgDuration.toFixed(0)}ms`);
  console.log(`   新提示词平均响应时间: ${report.summary.newPrompt.avgDuration.toFixed(0)}ms`);
  console.log(`   原提示词平均输出长度: ${report.summary.originalPrompt.avgLength.toFixed(0)} 字符`);
  console.log(`   新提示词平均输出长度: ${report.summary.newPrompt.avgLength.toFixed(0)} 字符\n`);
}

// 运行
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, runTestCase, generateReport };
