# Nginx 504 Gateway Time-out 事故记录（2026-07-04）

更新日期：`2026-07-04`

## 结论

本次 `https://aicoming.cn/` 与登录页出现 `504 Gateway Time-out` 的直接原因是：

**Nginx 可以正常接收 HTTPS 请求，但转发到后端 Node 服务 `127.0.0.1:3000` 后，长时间等不到响应头，最终超时。**

后端 Node/PM2 进程没有崩溃，PM2 仍显示 `online`。真正的问题是生产服务器出现系统级 IO 与内存压力，导致 Node 虽然存活但无法及时处理请求。

本次最强触发信号是 `snapd` 自动刷新异常：

- `2026-07-04 12:30 CST` 左右 snap 自动刷新开始。
- 之后 `snapd.service` 持续 `watchdog` / `timeout` / 重启。
- 重启计数一路增长到 `1066`。
- `2026-07-04 13:51 CST` 起，Nginx 开始集中出现 `upstream timed out`。

同时，这台机器资源偏紧：

- 内存：`3.4GiB`
- 同机运行：AIcoming、RSSHub、Dify/Docker、阿里云备份 HBR、阿里云安全/监控代理等
- 故障前根分区使用率：`89%`

因此根因应记录为：

**小内存生产机上，系统自动刷新/更新与多服务共驻叠加，触发严重 IO/内存压力；AIcoming 后端进程被拖慢但未崩溃，Nginx 代理等待超时，表现为 504。**

## 影响范围

- 站点首页：`https://aicoming.cn/`
- 管理登录页：`https://aicoming.cn/admin-login.html`
- 管理登录接口：`/api/auth/login`
- 其他经 Nginx 代理到 `127.0.0.1:3000` 的页面和 API

## 典型现象

浏览器显示：

```text
504 Gateway Time-out
nginx/1.18.0 (Ubuntu)
```

外部 `curl -v https://aicoming.cn/` 现象：

1. DNS 解析成功。
2. TCP 连接成功。
3. TLS 握手成功。
4. 请求发送成功。
5. 一直等不到 HTTP 响应体，直到超时。

Nginx 错误日志：

```text
upstream timed out (110: Unknown error) while reading response header from upstream,
upstream: "http://127.0.0.1:3000/"
```

PM2 状态容易误导：

```text
ai-news-system online
```

这只能说明 Node 进程没退出，不代表它还能及时响应 HTTP。

## 时间线

### 2026-07-02

- 首次发现同类 504。
- 排查到 Nginx 正常，后端 `127.0.0.1:3000` 接连接但不返回。
- `pm2 restart ai-news-system --update-env` 后恢复。
- 当时未安装外部健康检查 watchdog。

### 2026-07-04

- 用户再次反馈 `504 Gateway Time-out`。
- SSH 一度卡在 `Connection timed out during banner exchange`，说明服务器整体响应也异常，不只是应用层问题。
- 用户通过云控制台重启 ECS。
- 重启后站点恢复。
- 继续做根因排查，发现故障窗口内系统 IO/内存压力异常。

关键证据：

```text
2026/07/04 13:51:44 upstream timed out while reading response header from upstream
2026/07/04 13:51:46 upstream timed out while reading response header from upstream
2026/07/04 13:52:46 upstream timed out while reading response header from upstream
...
```

`atop` 历史采样显示：

```text
2026/07/04 13:40
CPL avg1 45.18 avg5 51.09 avg15 51.91
CPU wait 171%
cpu000 wait 86%
cpu001 wait 86%
PSI memsome 99% memfull 83% iosome 99% iofull 80%
DSK vda busy 109%
```

系统日志显示 `snapd` 重启风暴：

```text
snapd.service: start operation timed out. Terminating.
snapd.service: Failed with result 'timeout'.
Failed to start Snap Daemon.
snapd.service: Scheduled restart job, restart counter is at 1066.
```

snap 自动刷新时间：

```text
last: today at 12:30 CST
next: today at 20:43 CST
```

## 排查命令

### 外部确认站点是否 504

```bash
curl -v --connect-timeout 8 --max-time 25 https://aicoming.cn/
curl -v --connect-timeout 8 --max-time 25 https://aicoming.cn/admin-login.html
```

判断点：

- 如果 TLS 成功但请求后一直无响应，说明入口网络和证书不是主因。
- 继续查 Nginx upstream 与 Node。

### 检查 PM2 与端口

```bash
ssh root@8.135.37.159 'date; uptime; pm2 list; ss -ltnp | grep -E ":(80|443|3000)\b" || true'
```

判断点：

- `ai-news-system online` 不代表服务健康。
- 必须继续测本机 HTTP。

### 本机直连 Node

```bash
ssh root@8.135.37.159 'timeout 10 curl -sv http://127.0.0.1:3000/ 2>&1 | sed -n "1,100p"'
```

如果这里也卡住，说明问题在 Node 或系统资源，不是 Nginx。

### 查看 Nginx 错误日志

```bash
ssh root@8.135.37.159 'grep -E "upstream timed out|no live upstreams|connect\\(\\) failed" /var/log/nginx/error.log | tail -120'
```

关键字段：

```text
while reading response header from upstream
upstream: "http://127.0.0.1:3000/..."
```

### 查看系统资源与历史压力

```bash
ssh root@8.135.37.159 'uptime; free -h; df -h /; vmstat 1 5'
ssh root@8.135.37.159 'atop -r /var/log/atop/atop_YYYYMMDD -b HH:MM -e HH:MM'
```

本次重点看：

- load average
- CPU iowait
- PSI `memsome` / `memfull` / `iosome` / `iofull`
- `vda` 磁盘 busy

### 查看系统自动任务

```bash
ssh root@8.135.37.159 'snap refresh --time'
ssh root@8.135.37.159 'systemctl list-timers --all --no-pager "apt-*" "snapd*"'
ssh root@8.135.37.159 'journalctl -b -1 --since "YYYY-MM-DD HH:MM:SS" --until "YYYY-MM-DD HH:MM:SS" --no-pager | grep -Ei "apt|unattended|snapd|snap |dpkg|packagekit|fwupd"'
```

### 查看共驻服务

```bash
ssh root@8.135.37.159 'docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Image}}"'
ssh root@8.135.37.159 'timeout 8 docker stats --no-stream'
ssh root@8.135.37.159 'ps -eo pid,ppid,stat,pcpu,pmem,etime,cmd --sort=-pcpu | head -30'
```

本次同机存在 Dify/Docker、RSSHub、HBR、Aegis 等服务，AIcoming 不是主要资源占用者。

## 已执行恢复动作

### 1. 重启 ECS

当 SSH 卡在 banner exchange 阶段，无法通过远程 shell 执行 `pm2 restart`。用户通过云控制台重启 ECS 后，SSH 与站点恢复。

### 2. 部署健康检查接口

新增：

- `server/routes/health.js`
- `/api/health`

公网验证：

```bash
curl -s -i https://aicoming.cn/api/health
```

成功响应：

```json
{"ok":true,"uptime":357,"timestamp":"2026-07-04T07:19:22.486Z"}
```

### 3. 安装 AIcoming 健康 watchdog

新增脚本：

```text
scripts/setup-health-watchdog-cron.sh
```

生产 crontab：

```cron
* * * * * cd /var/www/ai-coming-website && timeout 5s curl -fsS http://127.0.0.1:3000/api/health >/dev/null || { echo "[$(date -Is)] health check failed, restarting ai-news-system"; pm2 restart ai-news-system --update-env; } >> /var/www/ai-coming-website/logs/health-watchdog.log 2>> /var/www/ai-coming-website/logs/health-watchdog.err.log # ai-coming health watchdog
```

作用：

- Node 进程崩溃：PM2 自带恢复。
- Node 进程假在线但 HTTP 不响应：watchdog 1 分钟内自动重启 `ai-news-system`。

### 4. 暂停 snap 自动刷新

执行：

```bash
snap refresh --hold=720h
```

结果：

```text
Auto-refresh of all snaps held until 2026-08-03T15:15:55+08:00
next: today at 20:43 CST (but held)
```

目的：

- 避免当天晚间再次触发 snap 刷新和 `snapd` 重启风暴。

### 5. 关闭 apt 自动定时器

执行：

```bash
systemctl disable --now apt-daily.timer apt-daily-upgrade.timer
```

目的：

- 避免白天自动 apt 任务与业务服务争抢 IO。
- 后续改为人工维护窗口执行更新。

### 6. 清理磁盘

执行：

```bash
journalctl --vacuum-time=7d
find /var/log/atop -type f -name "atop_*" -mtime +3 -print -delete
docker image prune -af
docker volume prune -f
```

结果：

- 根分区从 `89%` 降到 `81%`
- 可用空间从 `4.3G` 增加到 `7.3G`
- journal 从约 `1.9G` 降到约 `136M`

## 当前生产状态

最终检查时间：`2026-07-04 15:19 CST`

```text
load average: 1.48, 1.26, 1.10
Mem available: 719Mi
Swap used: 0B
/dev/vda3: 81% used, 7.3G available
```

PM2：

```text
ai-news-system online
rsshub online
```

公网：

```text
GET https://aicoming.cn/api/health -> 200 OK
POST https://aicoming.cn/api/auth/login with empty body -> 400 用户名和密码不能为空
```

登录接口能快速返回 `400`，说明后端响应链路已恢复。

## 误判点

### 误判 1：看到 PM2 online 就认为后端正常

不可靠。PM2 online 只说明进程还活着。

正确检查：

```bash
curl -fsS http://127.0.0.1:3000/api/health
```

### 误判 2：认为 504 是账号或登录接口问题

不是。504 发生在 Nginx 等后端响应阶段，甚至静态页面也会受影响。

### 误判 3：只重启 PM2 就算解决

PM2 重启可以短期恢复，但无法处理系统 IO/内存雪崩。需要同时看：

- `atop`
- `journalctl`
- `snap refresh --time`
- `systemctl list-timers`
- `docker stats`
- 磁盘空间

## 后续建议

### P0：保留健康 watchdog

不要删除：

- `/api/health`
- `# ai-coming health watchdog`

这是防止“进程假在线”的最低成本恢复手段。

### P1：把系统更新改为人工维护窗口

当前已临时：

- hold snap 30 天
- disable apt daily timers

后续建议固定维护窗口，例如每月一次：

```bash
apt update && apt upgrade
snap refresh
reboot
```

执行前先确认业务低峰、可登录 SSH、可回滚。

### P1：减少共驻服务或升级机器

当前机器只有 `3.4GiB` 内存，同时跑：

- AIcoming
- RSSHub
- Dify/Docker
- Postgres/Redis
- 阿里云 HBR
- 阿里云安全与监控代理

建议二选一：

1. AIcoming 单独迁移到轻量机器。
2. 当前 ECS 升级到至少 `8GiB` 内存，并提高磁盘容量。

### P2：调整 HBR 备份范围

HBR 日志显示会扫描 `/`：

```text
Scanning for dir /
```

建议在阿里云备份策略中排除：

- `/var/lib/docker`
- `/var/log`
- `/tmp`
- `/run`
- `/snap`
- 缓存目录

避免备份扫描与业务争抢 IO。

### P2：限制 journal 和 atop 留存

建议保留：

- journal：7 天或 200M
- atop：3-7 天

可考虑配置：

```text
/etc/systemd/journald.conf
SystemMaxUse=200M
MaxRetentionSec=7day
```

## 快速应急流程

以后再看到 `504 Gateway Time-out`，按这个顺序：

1. 外部确认：

   ```bash
   curl -v --connect-timeout 8 --max-time 20 https://aicoming.cn/
   ```

2. 本机健康检查：

   ```bash
   ssh root@8.135.37.159 'curl -fsS http://127.0.0.1:3000/api/health'
   ```

3. 如果健康检查失败，先恢复业务：

   ```bash
   ssh root@8.135.37.159 'pm2 restart ai-news-system --update-env'
   ```

4. 如果 SSH 卡在 banner exchange：

   - 说明系统层也卡住。
   - 先从云控制台重启 ECS。

5. 恢复后立刻看根因：

   ```bash
   ssh root@8.135.37.159 'uptime; free -h; df -h /; vmstat 1 5'
   ssh root@8.135.37.159 'grep "upstream timed out" /var/log/nginx/error.log | tail -80'
   ssh root@8.135.37.159 'journalctl -b -1 -p warning..alert --no-pager | tail -220'
   ssh root@8.135.37.159 'atop -r /var/log/atop/atop_YYYYMMDD -b HH:MM -e HH:MM'
   ```

6. 如果看到 snap/apt 自动任务或 IO wait 爆表，按本文处理。

