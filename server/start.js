function logStartup(host, port) {
    console.log(`服务器运行在 http://${host}:${port}`);
    if (host === '0.0.0.0') {
        console.log('🌐 如果是云服务器，请使用公网IP或域名访问');
        console.log(`📡 例如: http://YOUR_SERVER_IP:${port}`);
    }
    console.log('API文档:');
    console.log('  POST /api/auth/login - 管理员登录');
    console.log('  GET  /api/keywords - 获取关键词列表');
    console.log('  POST /api/keywords/refresh-weekly - 手动刷新上周词云关键词（管理员）');
    console.log('  POST /api/keywords/batch - 批量导入关键词');
    console.log('  DELETE /api/keywords/:id - 删除关键词');
    console.log('  GET  /api/news - 获取新闻列表（支持配置数量）');
    console.log('  POST /api/news/batch - 批量导入新闻（自动归档）');
    console.log('  DELETE /api/news/:id - 删除新闻');
    console.log('  GET  /api/news/template - 下载今日资讯模板');
    console.log('  GET  /api/stats - 获取统计数据');
    console.log('  GET  /api/settings - 获取系统设置');
    console.log('  POST /api/settings - 更新系统设置');
    console.log('  GET  /api/archive/dates - 获取历史日期列表');
    console.log('  GET  /api/archive/:date - 获取指定日期历史数据');
    console.log('  DELETE /api/archive/:date - 删除指定日期历史数据');
    console.log('  GET  /api/tools - 获取AI工具列表（支持筛选和分页）');
    console.log('  GET  /api/tools/categories - 获取工具分类');
    console.log('  GET  /api/tools/:id - 获取单个工具详情');
    console.log('  POST /api/tools - 添加工具（管理员）');
    console.log('  PUT  /api/tools/:id - 更新工具（管理员）');
    console.log('  DELETE /api/tools/:id - 删除工具（管理员）');
    console.log('  POST /api/tools/batch - 批量导入工具（管理员）');
    console.log('  POST /api/tools/upload-logo - 上传工具Logo（管理员）');
    console.log('  GET  /api/podcast/minimax/tasks/:taskId - 查询 MiniMax 语音任务状态');
    console.log('  GET  /api/podcast/news/:date - 获取指定日期播客状态');
    console.log('  GET  /api/podcast/news/:date/audio - 播放本地日报播客音频');
    console.log('  POST /api/podcast/news/:date/generate - 生成指定日期播客');
    console.log('');
    console.log('默认管理员账户:');
    console.log('  用户名: admin');
    console.log('  密码: admin123456');
}

function startServer(app, { host, port }) {
    return app.listen(port, host, () => {
        logStartup(host, port);
    });
}

module.exports = {
    startServer
};
