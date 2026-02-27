# Website 项目结构分析与清理指南

## 📂 当前项目结构

```
website/
├── 📄 核心文件
│   ├── index.html                  # ✅ 主页
│   ├── tools.html                  # ✅ AI工具库页面
│   ├── admin-login.html            # ✅ 管理员登录
│   ├── data-manager.html           # ✅ 数据管理后台
│   ├── footer.html                 # ⚠️ 页脚组件（可能是旧的）
│   ├── dispatch_dashboard.html     # ❓ 派单仪表板（不确定是否使用）
│   │
│   ├── main.js                     # ✅ 主逻辑
│   ├── tools.js                    # ✅ 工具页面逻辑
│   ├── api.js                      # ✅ API封装
│   ├── (历史管理员脚本，现已删除)
│   │
│   ├── styles.css                  # ✅ 主样式
│   ├── tools.css                   # ✅ 工具样式
│   │
├── 🖥️  服务器文件
│   ├── server-mysql.js             # ✅ MySQL版服务器（新版，推荐）
│   ├── server-json.js              # ✅ JSON版服务器（旧版，兼容保留）
│   ├── server.js                   # ❓ 可能是旧版本（需确认）
│   │
├── ⚙️  配置文件
│   ├── package.json                # ✅ 依赖配置
│   ├── .env                        # ✅ 环境变量
│   ├── .env.example                # ✅ 环境变量模板
│   ├── .gitignore                  # ✅ Git忽略配置
│   │
├── 🗄️  数据库相关
│   ├── database/schema.sql         # ✅ MySQL表结构
│   ├── config/database.js          # ✅ MySQL连接配置
│   ├── scripts/migrate-data.js     # ✅ 数据迁移脚本
│   │
├── 📊 数据目录
│   ├── data/*.json                 # ✅ 各种数据文件
│   ├── data/archive/               # ✅ 归档数据
│   │
├── 🖼️  资源文件
│   ├── pic/                        # ✅ 网站图片
│   ├── logos/                      # ✅ 工具Logo
│   │
├── 📝 文档
│   ├── README.md                   # ✅ 项目说明
│   ├── MYSQL-QUICK-START.md        # ✅ MySQL快速指南
│   ├── MYSQL-SETUP-GUIDE.md        # ✅ MySQL完整指南
│   ├── TECH-STACK-ANALYSIS.md      # ✅ 技术栈分析
│   ├── README-CROSS-PLATFORM.md    # ✅ 跨平台指南
│   ├── QUICK_START.md              # ⚠️ 快速开始（可能重复）
│   ├── README_SERVER.md            # ⚠️ 服务器说明（可能重复）
│   ├── ADMIN_ACCOUNTS.md           # ⚠️ 管理员说明（可能重复）
│   ├── SYNC_GUIDE.md               # ⚠️ 同步指南（不确定）
│   ├── SECURITY_FIXES.md           # ⚠️ 安全修复（可能过时）
│   │
├── 🗑️  可删除文件（数据分析相关）
│   ├── *.py                        # Python脚本（10个文件）
│   ├── *.xlsx                      # Excel文件（5个文件）
│   ├── *.csv                       # CSV文件（1个）
│   ├── result*.txt                 # 结果文件（5个）
│   ├── AI_xlsx_数据分析报告.md    # 分析报告
│   ├── AI工单数据分析报告.md        # 分析报告
│   ├── Excel文件使用说明.md         # 说明文档
│   ├── final_diagnosis_summary.md  # 诊断总结
│   ├── corrected_converter.py      # 转换脚本
│   ├── data_analysis_report.md     # 数据分析报告
│   ├── 转换后数据说明.md            # 数据说明
│   ├── 001.jpg - 004.jpg           # 临时图片（4个）
│   │
├── 📦 备份文件
│   ├── backup/                     # ⚠️ 备份目录（可归档）
│   │
└── 🧪 测试数据
    └── data/测试数据/              # ⚠️ 测试数据（可删除）
```

---

## ✅ 必须保留的文件

### 1. 核心页面（HTML）
```
✅ index.html              # 主页
✅ tools.html              # AI工具库
✅ admin-login.html        # 管理员登录
✅ data-manager.html       # 数据管理后台
```

### 2. JavaScript文件
```
✅ main.js                 # 主逻辑
✅ tools.js                # 工具逻辑
✅ api.js                  # API调用
```

### 3. CSS样式
```
✅ styles.css              # 主样式
✅ tools.css               # 工具样式
```

### 4. 服务器文件
```
✅ server-mysql.js         # MySQL版（主服务器）
✅ server-json.js          # JSON版（兼容保留）
⚠️ server.js              # 需确认是否使用
```

### 5. 配置文件
```
✅ package.json
✅ .env
✅ .env.example
✅ .gitignore
```

### 6. 数据库
```
✅ database/schema.sql
✅ config/database.js
✅ scripts/migrate-data.js
```

### 7. 数据文件
```
✅ data/*.json             # 所有JSON数据
✅ data/archive/           # 归档目录
```

### 8. 资源
```
✅ pic/                    # 网站图片
✅ logos/                  # 工具Logo
```

---

## ❌ 可以删除的文件

### 1. Python数据分析脚本（10个文件）
```bash
# 这些是数据分析脚本，与网站运行无关
❌ analyze_dispatch_filtered.py
❌ analyze_dispatch.py
❌ check_columns.py
❌ compare_classification.py
❌ corrected_converter.py
❌ excel_analysis.py
❌ excel_analysis2.py
❌ simple_compare.py
❌ simple_test.py
❌ test_excel.py
```

### 2. Excel数据文件（5个文件）
```bash
# 工单数据分析的Excel文件
❌ AI_工单数据_简化版.xlsx
❌ AI_工单数据_完整版.xlsx
❌ AI_工单数据.xlsx
❌ 智能派单对比.xlsx
❌ 转换后的工单数据.xlsx
```

### 3. 数据分析相关文档（7个文件）
```bash
# 数据分析报告和说明
❌ AI_xlsx_数据分析报告.md
❌ AI工单数据分析报告.md
❌ Excel文件使用说明.md
❌ final_diagnosis_summary.md
❌ data_analysis_report.md
❌ 转换后数据说明.md
❌ repaired_AI.csv
```

### 4. 临时结果文件（5个文件）
```bash
# Python脚本输出的临时文件
❌ result.txt
❌ result2.txt
❌ result3.txt
❌ result4.txt
❌ result5.txt
```

### 5. 临时图片（4个文件）
```bash
# 临时图片文件
❌ 001.jpg
❌ 002.jpg
❌ 003.jpg
❌ 004.jpg
```

### 6. 测试数据
```bash
❌ data/测试数据/
❌ data/测试数据/日数据.json
❌ data/测试数据/周数据.json
```

### 7. 备份文件（可归档到其他地方）
```bash
⚠️ backup/
⚠️ backup/*.html
```

### 8. 可能过时的文件
```bash
⚠️ footer.html              # 页脚组件（不确定是否使用）
⚠️ dispatch_dashboard.html  # 派单仪表板（不确定）
⚠️ 历史管理员脚本 # 现已删除
⚠️ server.js                # 旧版服务器（需确认）
```

### 9. 重复的文档（可合并或删除）
```bash
⚠️ QUICK_START.md           # 与MYSQL-QUICK-START重复
⚠️ README_SERVER.md         # 内容可能已过时
⚠️ ADMIN_ACCOUNTS.md        # 内容可能已过时
⚠️ SYNC_GUIDE.md            # 不确定用途
⚠️ SECURITY_FIXES.md        # 可能已过时
```

---

## 🧹 清理命令

### 方式一：创建清理脚本（推荐）

创建 `cleanup-project.sh`:

```bash
#!/bin/bash

echo "开始清理无关文件..."

# 删除Python脚本
rm -f *.py

# 删除Excel文件
rm -f *.xlsx

# 删除CSV文件
rm -f *.csv

# 删除结果文件
rm -f result*.txt

# 删除临时图片
rm -f 00*.jpg

# 删除数据分析文档
rm -f *_数据分析报告.md Excel文件使用说明.md final_diagnosis_summary.md
rm -f data_analysis_report.md 转换后数据说明.md

# 删除测试数据
rm -rf data/测试数据

echo "✅ 清理完成！"
echo "建议手动检查以下文件/目录："
echo "- backup/"
echo "- footer.html"
echo "- dispatch_dashboard.html"
echo "- 历史管理员脚本 (已删除)"
echo "- server.js"
```

运行：
```bash
chmod +x cleanup-project.sh
./cleanup-project.sh
```

### 方式二：手动删除

```bash
# 删除Python文件
rm -f *.py

# 删除Excel文件
rm -f *.xlsx

# 删除CSV和结果文件
rm -f *.csv result*.txt

# 删除临时图片
rm -f 00*.jpg

# 删除分析文档
rm -f *_数据分析报告.md Excel文件使用说明.md
rm -f final_diagnosis_summary.md data_analysis_report.md

# 删除测试数据
rm -rf data/测试数据
```

---

## 📊 清理后的目录结构

```
website/
├── index.html                  # 主页
├── tools.html                  # 工具页
├── admin-login.html            # 登录页
├── data-manager.html           # 管理页
│
├── main.js                     # 主逻辑
├── tools.js                    # 工具逻辑
├── api.js                      # API
│
├── styles.css                  # 主样式
├── tools.css                   # 工具样式
│
├── server-mysql.js             # MySQL服务器
├── server-json.js              # JSON服务器
│
├── package.json                # 依赖
├── .env                        # 环境变量
├── .env.example                # 环境变量模板
├── .gitignore                  # Git忽略
│
├── database/
│   └── schema.sql              # 数据库结构
├── config/
│   └── database.js             # 数据库配置
├── scripts/
│   └── migrate-data.js         # 迁移脚本
│
├── data/                       # 数据目录
│   ├── *.json
│   └── archive/
│
├── pic/                        # 网站图片
├── logos/                      # Logo
│
└── docs/                       # 文档（建议创建）
    ├── MYSQL-QUICK-START.md
    ├── MYSQL-SETUP-GUIDE.md
    ├── TECH-STACK-ANALYSIS.md
    └── README.md
```

---

## 💡 建议

### 1. 创建docs目录整理文档

```bash
mkdir docs
mv MYSQL-*.md TECH-STACK-ANALYSIS.md README-*.md docs/
```

### 2. 归档backup目录

```bash
# 如果不需要这些备份，可以删除
rm -rf backup/

# 或者移到项目外部
mv backup/ ../backups/
```

### 3. 确认可疑文件

检查以下文件是否还在使用：
- `footer.html` - 搜索项目中是否引用
- `dispatch_dashboard.html` - 确认是否需要
- 历史管理员脚本 - 历史文件，当前已删除
- `server.js` - 与其他两个server文件对比

### 4. 合并重复文档

将以下文档合并或删除：
- `QUICK_START.md` → 内容已在 `MYSQL-QUICK-START.md`
- `README_SERVER.md` → 内容可能已过时
- `ADMIN_ACCOUNTS.md` → 内容可能已过时

---

## ⚡ 快速清理（一键执行）

```bash
cd website

# 删除数据分析相关文件
rm -f *.py *.xlsx *.csv result*.txt 00*.jpg

# 删除分析文档
rm -f *_数据分析报告.md Excel文件使用说明.md \
      final_diagnosis_summary.md data_analysis_report.md \
      转换后数据说明.md

# 删除测试数据
rm -rf data/测试数据

echo "✅ 清理完成！"
```

执行后可以节省：
- **~40个文件**
- **~5MB空间**
- 项目结构更清晰

---

## 🎯 总结

| 类型 | 数量 | 状态 |
|------|------|------|
| 核心文件 | ~20 | ✅ 保留 |
| 数据分析文件 | ~32 | ❌ 可删除 |
| 文档 | ~10 | ⚠️ 需整理 |
| 备份文件 | ~5 | ⚠️ 可归档 |
| **总计** | **~67** | |

**清理后保留：~35个核心文件**
