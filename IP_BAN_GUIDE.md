# IP监控和封禁功能 - 使用说明

## 功能概述

已成功实现IP监控和自动封禁功能，保护大模型API免受滥用。系统能够监控每个IP地址的API调用频率，当超过限制时自动封禁。

## 核心功能

### 1. 自动监控
- 实时监控所有对 `/api/ai/chat` 的调用
- 记录每个IP的调用次数和时间
- 1小时时间窗口内统计调用次数
- 自动清理过期记录

### 2. 自动封禁
- 同一IP在1小时内调用超过10次自动封禁
- 封禁时长：24小时
- 封禁后所有API请求被拒绝
- 返回友好的错误提示

### 3. 手动管理
- 管理员可手动封禁任意IP
- 自定义封禁原因和时长
- 支持提前解封IP
- 批量清理过期封禁

### 4. 可视化统计
- 实时显示当前封禁列表
- API调用统计Top 50
- 使用进度条展示
- 接近限制时预警

## 工作原理

### 监控流程

```
用户请求 → IP封禁检查 → API频率监控 → 业务处理
    ↓           ↓            ↓
  已封禁?    调用次数+1   超过限制?
    ↓           ↓            ↓
  拒绝请求   记录日志    自动封禁IP
```

### 数据存储

**api-calls.json** - API调用记录
```json
[
    {
        "id": 1707123456789,
        "ip": "123.45.67.89",
        "timestamp": 1707123456789
    }
]
```

**banned-ips.json** - 封禁记录
```json
[
    {
        "id": 1707123456789,
        "ip": "123.45.67.89",
        "reason": "在1小时内调用大模型API 11次，超过限制(10次)",
        "bannedAt": 1707123456789,
        "bannedUntil": 1707210000000,
        "callCount": 11,
        "manualBan": false
    }
]
```

## 配置参数

在 `server-json.js` 中可调整以下参数：

```javascript
const API_RATE_LIMIT = {
    MAX_CALLS: 10,           // 最大调用次数
    TIME_WINDOW: 3600000,    // 时间窗口：1小时
    BAN_DURATION: 86400000   // 封禁时长：24小时
};
```

### 参数说明

| 参数 | 默认值 | 说明 |
|------|--------|------|
| MAX_CALLS | 10 | 时间窗口内允许的最大调用次数 |
| TIME_WINDOW | 3600000 | 统计时间窗口（毫秒），默认1小时 |
| BAN_DURATION | 86400000 | 封禁时长（毫秒），默认24小时 |

### 调整示例

```javascript
// 更严格：5次/30分钟，封禁7天
const API_RATE_LIMIT = {
    MAX_CALLS: 5,
    TIME_WINDOW: 30 * 60 * 1000,
    BAN_DURATION: 7 * 24 * 60 * 60 * 1000
};

// 更宽松：20次/小时，封禁12小时
const API_RATE_LIMIT = {
    MAX_CALLS: 20,
    TIME_WINDOW: 60 * 60 * 1000,
    BAN_DURATION: 12 * 60 * 60 * 1000
};
```

## API接口说明

### 1. 获取封禁IP列表
```
GET /api/banned-ips
Authorization: Bearer {token}

响应:
{
    "bannedIPs": [
        {
            "id": 1707123456789,
            "ip": "123.45.67.89",
            "reason": "API调用频率超限",
            "bannedAt": "2025-02-05 10:30:00",
            "bannedUntil": "2025-02-06 10:30:00",
            "remainingTime": 120,
            "isExpired": false
        }
    ],
    "stats": {
        "totalBanned": 5,
        "bannedInLast24h": 3,
        "banReasons": { "API调用频率超限": 4, "管理员手动封禁": 1 }
    }
}
```

### 2. 获取API调用统计
```
GET /api/api-calls/stats
Authorization: Bearer {token}

响应:
{
    "totalCalls": 150,
    "uniqueIPs": 25,
    "ipStats": [
        {
            "ip": "123.45.67.89",
            "callCount": 8,
            "firstCall": "2025-02-05 09:00:00",
            "lastCall": "2025-02-05 10:25:00",
            "isNearLimit": false
        }
    ],
    "timeWindow": 60,
    "limit": 10
}
```

### 3. 手动封禁IP
```
POST /api/banned-ips
Authorization: Bearer {token}
Content-Type: application/json

请求体:
{
    "ip": "123.45.67.89",
    "reason": "恶意刷屏",
    "duration": 24  // 小时
}

响应:
{
    "success": true,
    "message": "IP已成功封禁",
    "ip": "123.45.67.89",
    "bannedUntil": "2025-02-06 10:30:00"
}
```

### 4. 解封IP
```
DELETE /api/banned-ips/:ip
Authorization: Bearer {token}

响应:
{
    "success": true,
    "message": "IP已成功解封",
    "ip": "123.45.67.89",
    "deleted": 1
}
```

### 5. 清理过期封禁
```
POST /api/banned-ips/cleanup
Authorization: Bearer {token}

响应:
{
    "success": true,
    "message": "过期封禁记录已清理",
    "activeBans": 8,
    "timestamp": "2025-02-05T10:30:00.000Z"
}
```

## 管理后台使用

### 访问IP封禁管理页面

1. 登录管理员账号
2. 访问 http://localhost:3000/admin-ipban.html
3. 或从地理位置统计页面点击 "🔒 IP封禁管理"

### 页面功能

#### 标签页1：封禁列表

**统计卡片**:
- 当前封禁数 - 所有未过期的封禁
- 24小时内封禁 - 最近一天的封禁数
- 自动封禁 - 系统自动封禁的数量
- 手动封禁 - 管理员手动封禁的数量

**操作按钮**:
- 刷新 - 重新加载封禁列表
- 手动封禁IP - 打开封禁弹窗
- 清理过期 - 删除所有已过期的封禁记录

**封禁列表**:
显示每个被封禁IP的详细信息：
- IP地址
- 封禁原因
- 封禁时间
- 解封时间
- 剩余时间（分钟）
- 解封按钮

#### 标签页2：API调用统计

**统计卡片**:
- 总调用次数 - 时间窗口内所有调用
- 活跃IP数 - 有调用的IP数量
- 接近限制 - 调用次数≥8次的IP
- 时间窗口 - 统计周期（分钟）

**调用详情列表**:
显示Top 50活跃IP：
- IP地址
- 调用次数 / 限制
- 使用进度条（颜色预警）
- 首次调用时间
- 最后调用时间
- 状态标签（正常/接近限制/已超限）

#### 手动封禁弹窗

字段说明：
- **IP地址** * 必填 - 要封禁的IP地址
- **封禁原因** - 封禁的原因说明
- **封禁时长** - 选择预设时长（1/6/24/72/168小时）

### 颜色标识

| 颜色 | 含义 | 进度条颜色 |
|------|------|-----------|
| 绿色 | 正常使用（<80%） | 蓝紫色渐变 |
| 橙色 | 接近限制（≥80%） | 橙色 |
| 红色 | 已超限（≥100%） | 红色 |

## 用户端体验

### 正常访问
```
用户调用API → 成功响应 → 返回结果
```

### 接近限制（调用8-9次）
```
用户调用API → 成功响应 + 响应头警告
X-RateLimit-Remaining: 1
X-RateLimit-Limit: 10
X-RateLimit-Warning: API调用次数接近限制，请合理使用
```

### 超过限制（调用11+次）
```
用户调用API → 403 Forbidden
{
    "error": "API调用频率超限",
    "message": "您在短时间内的API调用次数超过限制，IP已被暂时封禁24小时",
    "callCount": 11,
    "limit": 10
}
```

### 已被封禁
```
用户任何请求 → 403 Forbidden
{
    "error": "IP地址已被封禁",
    "reason": "在1小时内调用大模型API 11次，超过限制(10次)",
    "bannedUntil": "2025-02-06 10:30:00",
    "message": "您的IP地址因违反使用规则已被暂时封禁，请联系管理员或稍后重试"
}
```

## 自动化特性

### 1. 定时清理任务
- 每小时自动执行一次
- 清理过期的封禁记录
- 清理超过时间窗口的调用记录

### 2. IP白名单
以下IP不受监控和限制：
- 127.0.0.1 (本地回环)
- ::1 (IPv6本地)
- 192.168.x.x (内网)
- 10.x.x.x (内网)

### 3. 智能去重
- 同一IP短时间内多次请求不重复封禁
- 检查现有封禁记录再执行封禁操作

## 故障排除

### 问题1: 本地开发时被封禁

**原因**: 内网IP应该被白名单排除，但可能配置有误

**解决**:
1. 检查监控中间件中的白名单逻辑
2. 确认本地IP地址格式
3. 临时调整MAX_CALLS限制

### 问题2: 合法用户被封禁

**原因**: 用户频繁使用AI聊天功能

**解决**:
1. 在管理后台手动解封该IP
2. 适当提高MAX_CALLS限制
3. 考虑实施用户级限制而非IP级

### 问题3: 封禁列表不更新

**原因**: 数据文件未正确保存或读取

**解决**:
1. 检查 `data/banned-ips.json` 文件权限
2. 查看服务器控制台错误日志
3. 手动清理过期封禁记录

### 问题4: 统计数据不准确

**原因**: 时间窗口或清理逻辑问题

**解决**:
1. 检查TIME_WINDOW配置
2. 确认定时清理任务正常运行
3. 重启服务器重置统计

## 性能优化建议

### 1. 使用Redis替代JSON文件

当前使用JSON文件存储，高并发场景下建议升级到Redis：

```javascript
// 安装redis客户端
npm install redis

// 使用Redis存储
const redis = require('redis');
const client = redis.createClient();

// 记录API调用
await client.lpush(`api_calls:${ip}`, Date.now());
await client.expire(`api_calls:${ip}`, TIME_WINDOW / 1000);

// 获取调用次数
const count = await client.llen(`api_calls:${ip}`);
```

### 2. 分布式部署

使用Redis可实现多台服务器共享封禁状态：

```javascript
// 所有服务器共享Redis实例
// 实现统一的IP封禁管理
```

### 3. 数据库持久化

对于大规模部署，使用数据库存储封禁记录：

```sql
CREATE TABLE banned_ips (
    id BIGINT PRIMARY KEY,
    ip VARCHAR(45),
    reason TEXT,
    banned_at DATETIME,
    banned_until DATETIME,
    INDEX idx_ip (ip),
    INDEX idx_banned_until (banned_until)
);
```

## 扩展功能建议

### 1. 封禁通知
- 邮件通知管理员
- 企业微信/钉钉通知
- 短信通知

### 2. 分级限制
- 普通用户：10次/小时
- 注册用户：50次/小时
- VIP用户：无限制

### 3. CAPTCHA验证
- 接近限制时显示验证码
- 通过验证继续使用
- 防止机器人滥用

### 4. 用户级限制
- 基于用户ID而非IP
- 需要用户登录系统
- 更精准的流量控制

### 5. 动态调整限制
- 根据系统负载调整
- 高峰期降低限制
- 低峰期提高限制

## 安全建议

### 1. 定期审计
- 定期检查封禁记录
- 识别异常模式
- 调整封禁策略

### 2. 日志备份
- 保存封禁历史
- 便于后续分析
- 支持审计追溯

### 3. 异常检测
- 监控封禁频率
- 检测攻击行为
- 临时加强防护

### 4. 规则更新
- 根据实际情况调整
- 测试新规则效果
- 逐步优化参数

## 文件清单

### 新增文件
- `data/api-calls.json` - API调用记录
- `data/banned-ips.json` - 封禁IP记录
- `admin-ipban.html` - IP封禁管理页面
- `IP_BAN_GUIDE.md` - 本文档

### 修改文件
- `server-json.js` - 添加IP监控和封禁功能
- `admin-analytics.html` - 添加IP封禁管理入口

## 技术实现细节

### 中间件执行顺序

```javascript
app.use(checkIPBan);           // 1. 检查IP是否被封禁
app.use(monitorAPIRateLimit);  // 2. 监控API调用频率
app.use(authenticateToken);    // 3. 验证用户Token（特定路由）
```

### 性能考虑

1. **内存优化**: 定期清理过期记录
2. **查询优化**: IP索引和快速查找
3. **并发安全**: 文件锁或使用数据库
4. **错误处理**: 完善的异常捕获

## 监控和告警

### 建议监控指标

- 每小时新增封禁数量
- API调用总量趋势
- 高频IP排行
- 解封请求次数

### 告警规则

- 1小时内封禁数>10 → 疑似攻击
- 单日封禁数>50 → 需要关注
- API调用量激增 → 可能是滥用

## 联系支持

如有问题或建议，请查看项目文档或提交Issue。

---

**最后更新**: 2025-02-05
**版本**: 1.0.0
**作者**: AI资讯管理系统开发团队
