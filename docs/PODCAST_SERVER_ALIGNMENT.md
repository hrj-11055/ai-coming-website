# 播客链路服务器对齐规则

## 目标

播客相关配置和代码如果出现“本地与服务器不一致”，一律以服务器 `/var/www/ai-coming-website` 为准。本地工作区是开发副本，不再默认代表线上真实状态。

## 服务器是真实来源的对象

- `/var/www/ai-coming-website/.env`
- `/var/www/ai-coming-website/server/services/news-podcast.js`
- `/var/www/ai-coming-website/server/services/podcast-script.js`
- `/var/www/ai-coming-website/config/podcast-script-system-prompt.md`
- `/var/www/ai-coming-website/scripts/smoke-json.js`

## 本地是派生副本的对象

- `.env.example`
- `tests/news-podcast.test.mjs`
- `tests/podcast-script.test.mjs`
- `.env`，除非明确要求将服务器值同步回来

## 固定排查顺序

1. 先检查服务器文件与服务器 `.env`
2. 再检查线上 `GET /api/podcast/news/:date`
3. 如需变更，优先修改服务器侧真实来源
4. 需要时再同步回本地仓库

## 固定验证优先级

1. 服务器直连 Minimax 探针
2. 线上 `GET /api/podcast/news/:date`
3. 线上 `POST /api/podcast/news/:date/generate`
4. 本地单测和本地 smoke

只有服务器验证结果可以作为最终结论。本地测试通过只能说明开发副本没坏，不能证明线上已生效。

## 推荐命令

```bash
npm run podcast:audit:server
```

这个脚本会输出播客链路的服务器优先审计结果，包括：

- 服务器 canonical 文件与本地副本的 hash 对比
- 服务器 `.env` 中播客相关键名的隐藏清单
- 当前线上播客状态接口返回
- `script_model`、`tts_model`、`script_mode` 的有效来源判断
