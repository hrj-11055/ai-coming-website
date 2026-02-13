#!/usr/bin/env python3
"""
Claude Code Conversation Analyzer
Generates personal coding diaries from conversation history
"""

import json
import os
import re
import sys
from datetime import datetime, timedelta
from pathlib import Path
from collections import defaultdict

# Configuration
HISTORY_FILE = Path.home() / '.claude' / 'history.jsonl'
DIARY_BASE_DIR = Path.home() / '日记'

# Work type classification keywords
KEYWORDS = {
    'bug_fix': ['修复', 'fix', 'bug', '错误', '报错', '解决', 'error', 'issue', '问题'],
    'optimization': ['优化', '改进', '提升', 'improve', 'optimize', 'refactor', '重构'],
    'new_feature': ['新增', '添加', 'create', 'add', 'implement', '功能', 'feature'],
    'documentation': ['文档', 'readme', '说明', 'document', 'write', '更新'],
    'testing': ['测试', 'test', '运行', 'run', '验证'],
    'deployment': ['部署', 'deploy', '发布', '上线'],
    'configuration': ['配置', 'config', '环境', '设置', 'setup'],
}

WORK_TYPE_EMOJIS = {
    'bug_fix': '🔧',
    'optimization': '⚡',
    'new_feature': '✨',
    'documentation': '📝',
    'testing': '🧪',
    'deployment': '🚀',
    'configuration': '⚙️',
    'other': '📦'
}

WORK_TYPE_NAMES = {
    'bug_fix': 'Bug修复',
    'optimization': '性能优化',
    'new_feature': '新功能',
    'documentation': '文档更新',
    'testing': '测试工作',
    'deployment': '部署发布',
    'configuration': '配置调整',
    'other': '其他'
}


def read_history(date_filter=None):
    """Read conversation history from JSONL file"""
    if not HISTORY_FILE.exists():
        print(f"❌ 历史记录文件不存在: {HISTORY_FILE}")
        return []

    conversations = []
    try:
        with open(HISTORY_FILE, 'r', encoding='utf-8') as f:
            for line_num, line in enumerate(f, 1):
                try:
                    data = json.loads(line.strip())
                    if not data:
                        continue

                    # Convert timestamp from milliseconds to datetime
                    timestamp_ms = data.get('timestamp', 0)
                    if timestamp_ms:
                        timestamp = datetime.fromtimestamp(timestamp_ms / 1000)

                        # Apply date filter if specified
                        if date_filter:
                            if not (date_filter['start'] <= timestamp < date_filter['end']):
                                continue

                        conversations.append({
                            'timestamp': timestamp,
                            'project': data.get('project', 'unknown'),
                            'content': data.get('display', ''),
                            'session_id': data.get('sessionId', ''),
                            'line_num': line_num
                        })
                except json.JSONDecodeError as e:
                    print(f"⚠️  跳过第{line_num}行: JSON解析错误")
                    continue
                except Exception as e:
                    print(f"⚠️  跳过第{line_num}行: {e}")
                    continue

        print(f"✅ 读取了 {len(conversations)} 条对话记录")
        return conversations

    except Exception as e:
        print(f"❌ 读取历史文件失败: {e}")
        return []


def classify_work(text):
    """Classify conversation by work type using keywords"""
    if not text:
        return 'other'

    text_lower = text.lower()

    for work_type, keywords in KEYWORDS.items():
        if any(keyword in text_lower for keyword in keywords):
            return work_type

    return 'other'


def get_project_name(project_path):
    """Extract friendly project name from path"""
    if project_path == 'unknown':
        return '未知项目'

    # Get last component of path
    return Path(project_path).name


def analyze_conversations(conversations, project_filter=None):
    """Analyze and categorize conversations"""
    # Group by project and work type
    by_project = defaultdict(lambda: defaultdict(list))

    for conv in conversations:
        project = conv['project']
        project_name = get_project_name(project)

        # Apply project filter if specified
        if project_filter and project_filter.lower() not in project.lower():
            continue

        work_type = classify_work(conv['content'])

        by_project[project_name][work_type].append(conv)

    return by_project


def generate_markdown_diary(conversations, date_str):
    """Generate Markdown format diary entry"""
    if not conversations:
        return None

    # Analyze conversations
    by_project = analyze_conversations(conversations)

    # Calculate statistics
    total_conversations = len(conversations)
    unique_projects = len(by_project)
    most_active_project = max(by_project.items(), key=lambda x: sum(len(v) for v in x[1].values()))[0] if by_project else 'N/A'

    # Build markdown content
    md_lines = []

    # Header
    md_lines.append(f"# 编程日记 - {date_str}")
    md_lines.append("")
    md_lines.append(f"## 📊 今日统计")
    md_lines.append(f"- **对话次数**: {total_conversations}次")
    md_lines.append(f"- **涉及项目**: {unique_projects}个")
    md_lines.append(f"- **主要项目**: {most_active_project}")
    md_lines.append("")

    # Group by work type across all projects
    by_work_type = defaultdict(list)
    for project_name, work_types in by_project.items():
        for work_type, convs in work_types.items():
            for conv in convs:
                by_work_type[work_type].append({
                    'project': project_name,
                    'content': conv['content'],
                    'timestamp': conv['timestamp']
                })

    # Generate sections for each work type
    for work_type in ['bug_fix', 'optimization', 'new_feature', 'documentation', 'testing', 'deployment', 'configuration', 'other']:
        items = by_work_type.get(work_type, [])
        if not items:
            continue

        emoji = WORK_TYPE_EMOJIS.get(work_type, '📦')
        type_name = WORK_TYPE_NAMES.get(work_type, work_type.capitalize())

        md_lines.append(f"## {emoji} {type_name} ({len(items)}个)")
        md_lines.append("")

        for item in items:
            project = item['project']
            content = item['content']
            time_str = item['timestamp'].strftime('%H:%M')

            # Truncate long content
            if len(content) > 200:
                content = content[:200] + "..."

            md_lines.append(f"### {project}项目")
            md_lines.append(f"**时间**: {time_str}")
            md_lines.append(f"**内容**: {content}")
            md_lines.append("")
            md_lines.append("---")
            md_lines.append("")

    # Add insights section if there are enough conversations
    if total_conversations >= 5:
        md_lines.append("## 💡 今日收获")
        md_lines.append("")
        md_lines.append("*（手动添加今天学到的知识点和经验）*")
        md_lines.append("")
        md_lines.append("")

    # Add tomorrow plan section
    md_lines.append("## 📅 明日计划")
    md_lines.append("")
    md_lines.append("- [ ] 待定")
    md_lines.append("")
    md_lines.append("")

    # Add important conversations section
    important_convs = [c for c in conversations if len(c['content']) > 50]
    if important_convs:
        md_lines.append("## 🔗 重要对话片段")
        md_lines.append("")
        for conv in important_convs[:5]:  # Top 5
            content = conv['content'][:150]
            if len(conv['content']) > 150:
                content += "..."
            md_lines.append(f"- {content}")
        md_lines.append("")

    # Footer
    md_lines.append("---")
    md_lines.append(f"**生成时间**: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    md_lines.append(f"**保存位置**: {DIARY_BASE_DIR}")
    md_lines.append("")

    return "\n".join(md_lines)


def save_diary(markdown_content, date_str):
    """Save diary to local file"""
    # Parse date
    date_obj = datetime.strptime(date_str, '%Y-%m-%d')

    # Create directory structure: YYYY/MM/
    year_month_dir = DIARY_BASE_DIR / str(date_obj.year) / f"{date_obj.month:02d}"
    year_month_dir.mkdir(parents=True, exist_ok=True)

    # File path: YYYY/MM/YYYY-MM-DD.md
    filename = f"{date_str}.md"
    file_path = year_month_dir / filename

    # Check if file already exists
    if file_path.exists():
        print(f"⚠️  日记文件已存在: {file_path}")
        response = input("是否覆盖? (y/N): ").strip().lower()
        if response != 'y':
            print("❌ 取消保存")
            return None

    # Write content
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(markdown_content)

        print(f"✅ 日记已保存: {file_path}")
        return file_path

    except Exception as e:
        print(f"❌ 保存失败: {e}")
        return None


def main():
    """Main function"""
    import argparse

    parser = argparse.ArgumentParser(description='生成编程日记')
    parser.add_argument('--date', default=datetime.now().strftime('%Y-%m-%d'),
                        help='日期 (YYYY-MM-DD), 默认今天')
    parser.add_argument('--project', help='只分析指定项目')
    parser.add_argument('--output', help='自定义保存路径')
    parser.add_argument('--print', action='store_true', help='打印到终端')

    args = parser.parse_args()

    # Parse date
    try:
        date_obj = datetime.strptime(args.date, '%Y-%m-%d')
    except ValueError:
        print(f"❌ 无效的日期格式: {args.date}")
        sys.exit(1)

    # Date filter
    date_filter = {
        'start': date_obj.replace(hour=0, minute=0, second=0, microsecond=0),
        'end': date_obj.replace(hour=23, minute=59, second=59, microsecond=999999)
    }

    print(f"📖 正在读取 {args.date} 的对话记录...")
    conversations = read_history(date_filter)

    if not conversations:
        print(f"❌ 没有找到 {args.date} 的对话记录")
        sys.exit(1)

    # Apply project filter
    if args.project:
        print(f"🔍 过滤项目: {args.project}")
        conversations = [c for c in conversations if args.project.lower() in c['project'].lower()]

        if not conversations:
            print(f"❌ 没有找到项目 '{args.project}' 的对话记录")
            sys.exit(1)

    print(f"✅ 找到 {len(conversations)} 条对话")
    print(f"📝 正在生成日记...")

    # Generate markdown
    markdown_content = generate_markdown_diary(conversations, args.date)

    if not markdown_content:
        print("❌ 生成日记失败")
        sys.exit(1)

    # Print to terminal if requested
    if args.print:
        print("\n" + "="*80)
        print(markdown_content)
        print("="*80 + "\n")

    # Save to file
    if args.output:
        # Custom output path
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(markdown_content)
        print(f"✅ 日记已保存到: {output_path}")
    else:
        # Default save location
        save_diary(markdown_content, args.date)

    print("\n🎉 完成！")


if __name__ == '__main__':
    main()
