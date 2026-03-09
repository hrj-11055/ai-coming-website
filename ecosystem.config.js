module.exports = {
  apps: [
    {
      name: 'ai-news-system',
      script: 'server-json.js',
      instances: 2,                    // 启动 2 个进程（多核利用）
      exec_mode: 'cluster',            // 集群模式
      watch: false,                    // 生产环境不监听文件变化
      ignore_watch: [
        'node_modules',
        'data',
        'logs'
      ],
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: 'logs/pm2-error.log',   // 错误日志
      out_file: 'logs/pm2-out.log',       // 标准输出
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,                    // 多进程日志合并

      // 进程守护配置
      autorestart: true,                  // 崩溃自动重启
      max_restarts: 10,                   // 最多重启 10 次
      min_uptime: '10s',                  // 启动后存活 10s 算成功
      max_memory_restart: '500M',          // 内存超 500MB 自动重启

      // 优雅停止（SIGTERM 信号）
      kill_timeout: 5000,
      listen_timeout: 3000,

      // 资源限制（可选）
      max_cpu_restart: 80                 // CPU 持续 80%+ 时重启
    }
  ]
};
