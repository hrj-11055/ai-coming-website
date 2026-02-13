#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Qwen模型对比测试工具
用于对比不同Qwen模型在同一提示词下的效果

测试模型：
- qwen-plus
- qwen-max-latest
- qwen3-max-preview

使用方法：
python test_model_comparison.py
"""

import os
import sys
import json
import time
from pathlib import Path
from typing import Dict, Any, List
import requests

# =====================================================
# 配置区域
# =====================================================

class Config:
    """配置类"""

    # 阿里云百炼 API 配置
    API_KEY = os.getenv('QWEN_API_KEY', 'sk-d110d2cda10d428a8e0b3551d7fc2105')
    API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'

    # Qwen 模型列表
    MODELS = [
        {
            'model_id': 'qwen-plus',
            'name': 'Qwen-Plus',
            'description': '通用型模型，平衡性能与成本'
        },
        {
            'model_id': 'qwen-max-latest',
            'name': 'Qwen-Max-Latest',
            'description': '最强模型，质量最高'
        },
        {
            'model_id': 'qwen3-max-preview',
            'name': 'Qwen3-Max-Preview',
            'description': 'Qwen3预览版，最新能力'
        }
    ]

    # 测试问题
    TEST_QUERIES = [
        "做一个汽车产业链研究",
        "做一个汽车供应链研究的提示词",
        "研究智能座舱的发展"
    ]


# =====================================================
# 工具函数
# =====================================================

def load_system_prompt() -> str:
    """加载系统提示词"""
    try:
        prompt_file = Path(__file__).parent / 'config' / 'system-prompt.txt'
        if prompt_file.exists():
            with open(prompt_file, 'r', encoding='utf-8') as f:
                prompt = f.read()
            print('✅ 系统提示词已加载\n')
            return prompt
    except Exception as e:
        print(f'⚠️  无法加载系统提示词: {e}')
        print('将使用默认提示词\n')
    return '你是一个专业的AI助手。'


def print_separator(char='=', length=80):
    """打印分隔线"""
    print(char * length)


def format_duration(ms: int) -> str:
    """格式化时长"""
    if ms >= 1000:
        return f'{ms/1000:.2f}秒'
    return f'{ms}毫秒'


# =====================================================
# API 调用函数
# =====================================================

def call_qwen_model(model_config: Dict, query: str, system_prompt: str) -> Dict[str, Any]:
    """
    调用指定的 Qwen 模型

    Args:
        model_config: 模型配置字典
        query: 用户问题
        system_prompt: 系统提示词

    Returns:
        包含响应结果的字典
    """
    model_id = model_config['model_id']
    model_name = model_config['name']

    start_time = time.time()

    try:
        response = requests.post(
            Config.API_URL,
            headers={
                'Content-Type': 'application/json',
                'Authorization': f"Bearer {Config.API_KEY}"
            },
            json={
                'model': model_id,
                'messages': [
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user', 'content': query}
                ],
                'temperature': 0.7,
                'max_tokens': 4000,
                'stream': False
            },
            timeout=120
        )

        end_time = time.time()
        duration = int((end_time - start_time) * 1000)

        response.raise_for_status()
        data = response.json()

        return {
            'model': model_name,
            'model_id': model_id,
            'query': query,
            'response': data['choices'][0]['message']['content'],
            'duration': duration,
            'duration_forma'
            'tted': format_duration(duration),
            'tokens': {
                'prompt': data.get('usage', {}).get('prompt_tokens', 0),
                'completion': data.get('usage', {}).get('completion_tokens', 0),
                'total': data.get('usage', {}).get('total_tokens', 0)
            },
            'raw': data
        }

    except requests.exceptions.RequestException as e:
        return {'error': str(e), 'model': model_name, 'model_id': model_id}
    except Exception as e:
        return {'error': f'未知错误: {str(e)}', 'model': model_name, 'model_id': model_id}


# =====================================================
# 对比测试函数
# =====================================================

def run_comparison(query: str, system_prompt: str) -> List[Dict[str, Any]]:
    """
    运行单个查询的对比测试

    Args:
        query: 测试问题
        system_prompt: 系统提示词

    Returns:
        所有模型的结果列表
    """
    print_separator()
    print(f'📝 测试问题: {query}')
    print_separator()
    print()

    results = []

    # 测试所有模型
    for i, model_config in enumerate(Config.MODELS, 1):
        model_name = model_config['name']
        print(f'[{i}/{len(Config.MODELS)}] 🔄 正在调用 {model_name}...')

        result = call_qwen_model(model_config, query, system_prompt)
        results.append(result)

        if 'error' in result:
            print(f'  ❌ {model_name} 调用失败: {result["error"]}')
        else:
            print(f'  ✅ {model_name} 响应成功')
            print(f'     生成时间: {result["duration_formatted"]}')
            print(f'     Tokens: {result["tokens"]["total"]} '
                  f'(输入: {result["tokens"]["prompt"]}, '
                  f'输出: {result["tokens"]["completion"]})')
        print()

    # 显示所有结果
    print_separator()
    print('📊 各模型回答对比')
    print_separator()
    print()

    for result in results:
        if 'error' in result:
            continue

        print_separator('-')
        print(f'🔹 {result["model"]} ({result["model_id"]})')
        print_separator('-')
        print(f'⏱️  生成时间: {result["duration_formatted"]}')
        print(f'📏 回答长度: {len(result["response"])} 字符')
        print(f'📊 Token数: {result["tokens"]["total"]}')
        print()
        print('回答内容:')
        print('-' * 40)
        print(result['response'])
        print()
        print()

    return results


# =====================================================
# 主函数
# =====================================================

def main():
    """主函数"""

    # 打印标题
    print()
    print('█' * 80)
    print('█' + ' ' * 78 + '█')
    print('█' + '  Qwen 模型对比测试工具'.center(76) + '  █')
    print('█' + ' ' * 78 + '█')
    print('█' * 80)
    print()

    # 显示测试模型
    print('🤖 测试模型:')
    for i, model in enumerate(Config.MODELS, 1):
        print(f'  {i}. {model["name"]} ({model["model_id"]})')
        print(f'     {model["description"]}')
    print()

    # 加载系统提示词
    system_prompt = load_system_prompt()

    # 检查 API Key
    if not Config.API_KEY or 'your-qwen-api-key' in Config.API_KEY:
        print('❌ 请在环境变量中配置 QWEN_API_KEY')
        print('   export QWEN_API_KEY=sk-your-actual-api-key')
        sys.exit(1)

    # 显示测试计划
    print(f'📋 测试计划: 共 {len(Config.TEST_QUERIES)} 个问题\n')

    # 运行所有测试
    all_results = []
    for i, query in enumerate(Config.TEST_QUERIES, 1):
        print(f'\n{"="*80}')
        print(f'测试进度: {i}/{len(Config.TEST_QUERIES)}')
        print(f'{"="*80}\n')

        results = run_comparison(query, system_prompt)
        all_results.append({
            'query': query,
            'results': results
        })

        # 如果不是最后一个问题，延迟一下避免API限流
        if i < len(Config.TEST_QUERIES):
            print('⏳ 等待 2 秒后继续下一个测试...\n')
            time.sleep(2)

    # 汇总报告
    print('\n' + '█' * 80)
    print('█' + ' ' * 78 + '█')
    print('█' + '  测试完成 - 汇总报告'.center(76) + '  █')
    print('█' + ' ' * 78 + '█')
    print('█' * 80)
    print()

    # 性能对比表
    print('⚡ 性能对比汇总')
    print_separator('-')
    print()

    # 表头
    print(f'{"问题":<30} | {"模型":<20} | {"生成时间":<12} | {"Token数":<10}')
    print('-' * 80)

    # 数据行
    for test_idx, test_data in enumerate(all_results, 1):
        query_short = test_data['query'][:28] + '..' if len(test_data['query']) > 30 else test_data['query']

        for result in test_data['results']:
            if 'error' in result:
                status = '❌ 失败'
                print(f'{query_short:<30} | {result["model"]:<20} | {status:<12} | {"N/A":<10}')
            else:
                print(f'{query_short:<30} | {result["model"]:<20} | {result["duration_formatted"]:<12} | {result["tokens"]["total"]:<10}')

    print()

    # 统计每个模型的平均时间
    print('📈 各模型平均生成时间')
    print_separator('-')
    print()

    model_stats = {}
    for model in Config.MODELS:
        model_name = model['name']
        total_time = 0
        count = 0

        for test_data in all_results:
            for result in test_data['results']:
                if result.get('model') == model_name and 'error' not in result:
                    total_time += result['duration']
                    count += 1

        if count > 0:
            avg_time = total_time / count
            model_stats[model_name] = {
                'avg_time': avg_time,
                'count': count
            }

    # 排序并显示
    sorted_models = sorted(model_stats.items(), key=lambda x: x[1]['avg_time'])

    for model_name, stats in sorted_models:
        print(f'  {model_name:<25} {format_duration(int(stats["avg_time"])):<15} '
              f'(基于{stats["count"]}个测试)')

    print()

    # Token使用统计
    print('📊 各模型平均Token使用')
    print_separator('-')
    print()
    

    model_token_stats = {}
    for model in Config.MODELS:
        model_name = model['name']
        total_tokens = 0
        count = 0

        for test_data in all_results:
            for result in test_data['results']:
                if result.get('model') == model_name and 'error' not in result:
                    total_tokens += result['tokens']['total']
                    count += 1

        if count > 0:
            avg_tokens = total_tokens / count
            model_token_stats[model_name] = {
                'avg_tokens': avg_tokens,
                'count': count
            }

    # 排序并显示
    sorted_tokens = sorted(model_token_stats.items(), key=lambda x: x[1]['avg_tokens'])

    for model_name, stats in sorted_tokens:
        print(f'  {model_name:<25} {int(stats["avg_tokens"]):>8} tokens  '
              f'(基于{stats["count"]}个测试)')

    print()

    print_separator()
    print('✅ 测试完成！')
    print_separator()
    print()

    # 保存测试结果到文件
    timestamp = int(time.time() * 1000)
    output_file = f'qwen-comparison-{timestamp}.json'

    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(all_results, f, ensure_ascii=False, indent=2)
        print(f'📄 详细测试结果已保存到: {output_file}')
        print()
    except Exception as e:
        print(f'⚠️  保存测试结果失败: {e}')
        print()


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print('\n\n⚠️  测试被用户中断')
        sys.exit(0)
    except Exception as e:
        print(f'\n\n❌ 测试失败: {str(e)}')
        import traceback
        traceback.print_exc()
        sys.exit(1)
