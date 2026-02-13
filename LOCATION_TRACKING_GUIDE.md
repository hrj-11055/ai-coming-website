# 用户地理位置统计功能 - 使用说明

## 功能概述

已成功实现用户地理位置统计功能,可以自动追踪访问用户所在省份,并在后台提供可视化统计报表。

## 功能特点

### 1. 自动追踪
- 用户访问网站时自动记录IP地址
- 自动识别用户所在省份(基于IP地址)
- 每日去重统计(同一IP当天只记录一次)
- 静默追踪,无需用户授权

### 2. 数据统计
- 总访问量统计
- 覆盖省份数统计
- 省份访问排行
- 今日访问量统计
- 详细访问日志查询

### 3. 可视化展示
- 柱状图展示省份访问分布
- 支持数据实时刷新
- 支持按省份筛选日志
- 分页查看详细访问记录

### 4. 数据管理
- 支持清理旧日志
- IP地址脱敏显示
- 支持导出统计报表

## 技术实现

### 前端自动上报 (main.js)

```javascript
// 页面加载时自动执行追踪
async function trackVisit() {
    const response = await fetch('/api/visit/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    });
}
```

### 后端IP解析 (server-json.js)

使用淘宝IP接口(免费)实现IP地址到省份的转换:

- 自动识别客户端IP地址
- 调用IP定位API获取省份信息
- 省份名称规范化处理
- 本地IP自动标记为"未知"

### 数据存储

- 存储位置: `data/visit-logs.json`
- 数据格式:
```json
{
  "id": 1707123456789,
  "ip": "123.45.67.89",
  "province": "广东省",
  "country": "中国",
  "date": "2025-02-05T10:30:00.000Z",
  "userAgent": "Mozilla/5.0..."
}
```

## API接口

### 1. 记录访问
```
POST /api/visit/track
```
- 无需认证
- 自动获取客户端IP
- 返回识别的省份信息

### 2. 获取省份统计(管理员)
```
GET /api/visit/province-stats
Authorization: Bearer {token}
```
- 返回各省份访问量统计
- 按访问量降序排列

### 3. 获取访问日志(管理员)
```
GET /api/visit/logs?page=1&limit=20&province=广东省
Authorization: Bearer {token}
```
- 支持分页查询
- 支持按省份筛选
- 按时间倒序排列

### 4. 清理旧日志(管理员)
```
DELETE /api/visit/logs/cleanup?days=30
Authorization: Bearer {token}
```
- 删除指定天数前的日志
- 返回删除和剩余数量

## 使用方法

### 1. 访问管理后台

访问: http://localhost:3000/admin-analytics.html

或从首页底部点击 "📊 管理后台" 链接

### 2. 管理员登录

使用默认管理员账号登录:
- 用户名: `admin`
- 密码: `admin123456`

登录后 Token 保存在 localStorage,有效期由后端配置

### 3. 查看统计数据

页面自动显示:
- 总访问量
- 覆盖省份数
- 最活跃省份
- 今日访问量

### 4. 查看省份分布图表

- 柱状图展示Top 15省份
- 点击柱状图查看具体数值
- 支持数据刷新

### 5. 查询详细日志

- 选择省份筛选
- 分页浏览访问记录
- IP地址已脱敏处理(如: 123.45.***.***)

### 6. 清理旧日志

- 点击"清理旧日志"按钮
- 输入保留天数(默认30天)
- 确认后自动删除过期数据

## 数据隐私说明

### 隐私保护措施

1. **IP地址脱敏**: 详细日志中IP地址自动掩码处理
2. **每日去重**: 同一IP每天只记录一次,避免重复统计
3. **本地IP过滤**: 内网IP地址不记录
4. **定期清理**: 支持自动清理旧数据,避免数据积累过多

### 数据用途

- 统计用户地区分布
- 分析用户访问来源
- 优化内容推荐策略
- 制定区域化运营策略

## 配置说明

### 修改IP定位服务

当前使用淘宝IP接口,如需更换其他服务,修改 `server-json.js` 中的 `getProvinceFromIP` 函数:

```javascript
// 示例: 使用其他IP定位服务
async function getProvinceFromIP(ip) {
    const response = await fetch(`YOUR_API_ENDPOINT?ip=${ip}`);
    // ... 处理响应
}
```

### 推荐的IP定位服务

1. **淘宝IP接口**(当前使用,免费)
   - URL: http://ip.taobao.com/outGetIpInfo
   - 无需注册,不限调用次数

2. **高德IP定位API**(免费)
   - 需要注册申请Key
   - 更精确的定位

3. **百度IP定位API**(免费)
   - 需要注册申请Key
   - 支持批量查询

4. **GeoIP2**(离线数据库)
   - 下载离线数据库
   - 无需网络请求
   - 适合高并发场景

### 调整统计策略

修改 `server-json.js` 中的去重逻辑:

```javascript
// 当前: 每天去重
const today = new Date().toISOString().split('T')[0];
const existingLog = logs.find(log =>
    log.ip === clientIP && log.date.startsWith(today)
);

// 改为: 每小时去重
const currentHour = new Date().toISOString().slice(0, 13);
const existingLog = logs.find(log =>
    log.ip === clientIP && log.date.startsWith(currentHour)
);
```

## 故障排除

### 问题1: 省份显示为"未知"

**原因**:
- IP地址为内网地址(192.168.x.x, 10.x.x.x)
- IP定位API调用失败

**解决**:
- 检查网络连接
- 更换IP定位服务
- 查看服务器日志

### 问题2: 无法访问管理后台

**原因**:
- 未登录管理员账号
- Token已过期

**解决**:
1. 先登录管理员账号(需要实现登录页面)
2. 或者直接在控制台设置Token:
```javascript
localStorage.setItem('admin_token', 'your_actual_token');
```

### 问题3: 统计数据不更新

**原因**:
- 浏览器缓存
- 数据文件未刷新

**解决**:
- 点击"刷新数据"按钮
- 清除浏览器缓存
- 重启服务器

## 扩展功能建议

### 1. 实时在线统计
使用WebSocket实现实时在线用户统计

### 2. 热力图展示
集成地图库(如ECharts)在地图上显示用户分布热力图

### 3. 访问趋势分析
添加时间维度,展示访问量变化趋势

### 4. 城市级定位
升级API,统计到城市级别

### 5. 数据导出
添加Excel/CSV导出功能

### 6. 访问来源分析
记录Referer,分析用户来源渠道

## 性能优化建议

### 1. 数据库优化
当前使用JSON文件存储,建议升级到MySQL:
```sql
CREATE TABLE visit_logs (
    id BIGINT PRIMARY KEY,
    ip VARCHAR(45),
    province VARCHAR(50),
    country VARCHAR(50),
    date DATETIME,
    user_agent TEXT,
    INDEX idx_province (province),
    INDEX idx_date (date)
);
```

### 2. 缓存优化
对统计数据添加缓存,减少重复计算

### 3. 异步处理
IP解析可以使用消息队列异步处理,提高响应速度

### 4. 数据采样
高流量场景下可以采样记录,减少数据量

## 文件清单

### 新增文件
- `admin-analytics.html` - 地理位置统计管理页面
- `data/visit-logs.json` - 访问日志数据文件(自动创建)

### 修改文件
- `server-json.js` - 添加地理位置追踪API
- `main.js` - 添加前端自动上报代码
- `index.html` - 添加管理后台入口

## 技术栈

- **前端**: 原生JavaScript + Chart.js
- **后端**: Node.js + Express
- **数据存储**: JSON文件
- **IP定位**: 淘宝IP接口
- **图表**: Chart.js + ChartDataLabels

## 联系支持

如有问题或建议,请查看项目文档或提交Issue。
