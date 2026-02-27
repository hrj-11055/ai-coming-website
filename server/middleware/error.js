function notFoundHandler(req, res, next) {
    if (res.headersSent) {
        return next();
    }

    res.status(404).json({
        error: '资源不存在',
        path: req.originalUrl
    });
}

function errorHandler(err, req, res, next) {
    console.error('未处理异常:', err);

    if (res.headersSent) {
        return next(err);
    }

    const status = err.statusCode || 500;
    const message = err.message || '服务器内部错误';
    res.status(status).json({ error: message });
}

module.exports = {
    notFoundHandler,
    errorHandler
};
