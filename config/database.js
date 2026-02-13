// MySQL数据库连接配置
const mysql = require('mysql2/promise');

// 数据库连接池配置
const poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ai_news_system',
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    charset: 'utf8mb4'
};

// 创建连接池
const pool = mysql.createPool(poolConfig);

// 测试数据库连接
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ MySQL数据库连接成功');
        console.log(`📊 数据库: ${poolConfig.database}`);
        console.log(`🖥️  主机: ${poolConfig.host}:${poolConfig.port}`);
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ MySQL数据库连接失败:', error.message);
        console.error('请检查数据库配置和环境变量');
        return false;
    }
}

// 通用查询方法
async function query(sql, params = []) {
    try {
        const [rows] = await pool.execute(sql, params);
        return rows;
    } catch (error) {
        console.error('数据库查询错误:', error);
        throw error;
    }
}

// 插入数据并返回插入ID
async function insert(sql, params = []) {
    try {
        const [result] = await pool.execute(sql, params);
        return result.insertId;
    } catch (error) {
        console.error('数据库插入错误:', error);
        throw error;
    }
}

// 更新数据并返回影响行数
async function update(sql, params = []) {
    try {
        const [result] = await pool.execute(sql, params);
        return result.affectedRows;
    } catch (error) {
        console.error('数据库更新错误:', error);
        throw error;
    }
}

// 删除数据并返回影响行数
async function remove(sql, params = []) {
    try {
        const [result] = await pool.execute(sql, params);
        return result.affectedRows;
    } catch (error) {
        console.error('数据库删除错误:', error);
        throw error;
    }
}

// 事务支持
async function transaction(callback) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const result = await callback(connection);
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

// 关闭连接池
async function closePool() {
    try {
        await pool.end();
        console.log('数据库连接池已关闭');
    } catch (error) {
        console.error('关闭连接池时出错:', error);
    }
}

// 导出模块
module.exports = {
    pool,
    query,
    insert,
    update,
    remove,
    transaction,
    testConnection,
    closePool
};
