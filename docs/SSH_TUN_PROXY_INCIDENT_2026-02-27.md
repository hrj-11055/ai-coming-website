# SSH 连接异常事故记录（2026-02-27）

## 结论（根因）

本次 `ssh` 无法连接服务器的根因是：**本地开启了 TUN 模式代理**，导致 SSH 握手流量被代理链路干扰，出现连接建立后在 KEX 阶段被断开。

关闭本地 TUN 模式后，SSH 连接恢复正常。

## 典型现象

- 本地命令：
  - `ssh -vvv aliyun`
  - 报错：`kex_exchange_identification: Connection closed by remote host`
- TCP 端口探测显示正常：
  - `nc -zv 8.135.37.159 22` 成功
- 服务器端 `sshd` 服务正常：
  - `systemctl status ssh` 为 `active (running)`
  - `ss -ltnp` 显示 `22/2222` 均在监听
- 服务器本机回环测试正常：
  - `timeout 3 bash -lc 'exec 3<>/dev/tcp/127.0.0.1/2222; head -n1 <&3'`
  - 返回 `SSH-2.0-OpenSSH_...`

## 误判点（本次已踩）

- 误以为是服务器 `sshd` 挂掉或配置错误。
- 误以为是密钥、账号、端口、Nginx 问题。
- 误以为是安全组未放行（实际已放行仍失败）。

## 快速判定流程（推荐）

1. 本地先看是否为 KEX 前断开：
   - `ssh -vvv <host>`
2. 服务器检查服务状态与监听：
   - `systemctl status ssh`
   - `ss -ltnp | grep -E ':22|:2222'`
3. 服务器本机验证 banner：
   - `timeout 3 bash -lc 'exec 3<>/dev/tcp/127.0.0.1/22; head -n1 <&3'`
4. 若服务端都正常但本地仍断开，优先排查本地网络链路：
   - 关闭代理 TUN 模式
   - 换网络（如手机热点）复测
   - 再执行 `ssh -vvv <host>`

## 预防措施（后续固定执行）

- 发布/运维前检查项新增：
  - **关闭本地 TUN 代理模式**
  - 确认 `ssh <alias>` 可直连后再执行部署
- 如必须开代理：
  - 为服务器 IP 与 `22/2222` 配置 `DIRECT` 直连规则，避免 SSH 走代理隧道
- 保留备用 SSH 端口（如 `2222`），用于应急连接

## 本次环境

- 本地：macOS + OpenSSH_9.9p2
- 服务器：Ubuntu 22.04 + OpenSSH_8.9p1
- 目标主机：`8.135.37.159`

