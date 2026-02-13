#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
提示词对比测试工具
对比两个提示词在相同测试用例下的生成效果

输出格式：CSV文件，包含响应时长、Token数、完整生成内容等

使用方法:
    python scripts/prompt_comparison_test.py
"""

import os
import sys
import json
import time
import csv
from pathlib import Path
from typing import Dict, Any, List
import requests
from dotenv import load_dotenv

# =====================================================
# 配置区域
# =====================================================

class Config:
    """配置类"""

    # 加载环境变量
    load_dotenv()

    # Qwen API 配置
    API_KEY = os.getenv('QWEN_API_KEY', 'sk-d110d2cda10d428a8e0b3551d7fc2105')
    API_URL = os.getenv('QWEN_API_URL', 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions')
    MODEL = os.getenv('QWEN_MODEL', 'qwen-plus')

    # 提示词文件路径
    PROMPT_FILES = {
        'original': 'config/original-prompt.txt',
        'new': 'config/new-prompt.txt'
    }

    # 测试用例
    TEST_CASES = [
        {
            'id': 1,
            'name': '产业链研究',
            'prompt': '我需要研究中国新能源汽车产业链，尤其是整车厂'
        },
        {
            'id': 2,
            'name': '产品经理学习路径',
            'prompt': '我想做一个产品经理，如何学习这方面的知识'
        },
        {
            'id': 3,
            'name': '能力探索',
            'prompt': '你可以帮我做什么'
        },
        {
            'id': 4,
            'name': '提示词生成',
            'prompt': '我需要生成一个互联网顶级产品经理身份的提示词'
        },
        {
            'id': 5,
            'name': '职业规划',
            'prompt': '我毕业2年，是初级产品经理，想成为资深产品经理进入大厂工作'
        }
    ]

    # 输出目录
    RESULTS_DIR = 'results'


# =====================================================
# 工具函数
# =====================================================

def print_separator(char='=', length=80):
    """打印分隔线"""
    print(char * length)


def format_duration(ms: int) -> str:
    """格式化时长"""
    if ms >= 1000:
        return f'{ms/1000:.2f}秒'
    return f'{ms}毫秒'


def ensure_results_dir():
    """确保结果目录存在"""
    results_path = Path(Config.RESULTS_DIR)
    results_path.mkdir(exist_ok=True)
    return results_path


# =====================================================
# 提示词加载
# =====================================================

def load_prompts() -> Dict[str, str]:
    """
    加载两个提示词文件

    Returns:
        包含 'original' 和 'new' 两个提示词的字典
    """
    prompts = {}

    for key, filepath in Config.PROMPT_FILES.items():
        try:
            prompt_path = Path(filepath)
            if prompt_path.exists():
                with open(prompt_path, 'r', encoding='utf-8') as f:
                    prompts[key] = f.read()
                print(f'✅ {key}提示词已加载: {len(prompts[key])} 字符')
            else:
                print(f'⚠️  文件不存在: {filepath}')
                prompts[key] = ''
        except Exception as e:
            print(f'❌ 读取 {key} 提示词失败: {e}')
            prompts[key] = ''

    return prompts


# =====================================================
# API 调用
# =====================================================

def call_qwen_api(system_prompt: str, user_message: str) -> Dict[str, Any]:
    """
    调用 Qwen API

    Args:
        system_prompt: 系统提示词
        user_message: 用户消息

    Returns:
        包含响应结果的字典
    """
    start_time = time.time()

    try:
        response = requests.post(
            Config.API_URL,
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {Config.API_KEY}'
            },
            json={
                'model': Config.MODEL,
                'messages': [
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user', 'content': user_message}
                ],
                'temperature': 0.7,
                'max_tokens': 2000
            },
            timeout=120
        )

        end_time = time.time()
        duration = int((end_time - start_time) * 1000)

        response.raise_for_status()
        data = response.json()

        return {
            'success': True,
            'content': data['choices'][0]['message']['content'],
            'duration': duration,
            'tokens': {
                'prompt': data.get('usage', {}).get('prompt_tokens', 0),
                'completion': data.get('usage', {}).get('completion_tokens', 0),
                'total': data.get('usage', {}).get('total_tokens', 0)
            }
        }

    except requests.exceptions.RequestException as e:
        return {
            'success': False,
            'error': str(e),
            'duration': 0,
            'tokens': {'prompt': 0, 'completion': 0, 'total': 0}
        }
    except Exception as e:
        return {
            'success': False,
            'error': f'未知错误: {str(e)}',
            'duration': 0,
            'tokens': {'prompt': 0, 'completion': 0, 'total': 0}
        }


# =====================================================
# CSV 保存
# =====================================================

def save_to_csv(results: List[Dict[str, Any]], output_file: str):
    """
    保存测试结果到CSV文件

    Args:
        results: 测试结果列表
        output_file: 输出文件路径
    """
    fieldnames = [
        '测试用例ID',
        '测试名称',
        '提示词版本',
        '响应时长(ms)',
        '总Token数',
        '输入Token数',
        '输出Token数',
        '输出长度',
        '完整生成内容'
    ]

    with open(output_file, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()

        for result in results:
            writer.writerow({
                '测试用例ID': result['test_case_id'],
                '测试名称': result['test_name'],
                '提示词版本': result['prompt_version'],
                '响应时长(ms)': result['duration_ms'],
                '总Token数': result['total_tokens'],
                '输入Token数': result['prompt_tokens'],
                '输出Token数': result['completion_tokens'],
                '输出长度': result['content_length'],
                '完整生成内容': result['content']
            })


def save_to_json(results: List[Dict[str, Any]], output_file: str):
    """
    保存测试结果到JSON文件（原始数据）

    Args:
        results: 测试结果列表
        output_file: 输出文件路径
    """
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)


# =====================================================
# 测试执行
# =====================================================

def run_single_test(test_case: Dict, system_prompt: str, prompt_version: str) -> Dict[str, Any]:
    """
    运行单个测试

    Args:
        test_case: 测试用例
        system_prompt: 系统提示词
        prompt_version: 提示词版本名称（'原提示词' 或 '新提示词'）

    Returns:
        测试结果字典
    """
    print(f'\n📝 测试用例 {test_case["id"]}: {test_case["name"]}')
    print(f'   提示词版本: {prompt_version}')
    print(f'   用户输入: {test_case["prompt"][:50]}...')

    result = call_qwen_api(system_prompt, test_case['prompt'])

    if result['success']:
        print(f'   ✅ 响应成功 | 时长: {format_duration(result["duration"])} | '
              f'Token: {result["tokens"]["total"]}')
    else:
        print(f'   ❌ 响应失败: {result["error"]}')

    return {
        'test_case_id': test_case['id'],
        'test_name': test_case['name'],
        'prompt_version': prompt_version,
        'duration_ms': result['duration'],
        'total_tokens': result['tokens']['total'],
        'prompt_tokens': result['tokens']['prompt'],
        'completion_tokens': result['tokens']['completion'],
        'content_length': len(result.get('content', '')),
        'content': result.get('content', ''),
        'success': result['success'],
        'error': result.get('error', '')
    }


def run_all_tests(prompts: Dict[str, str]) -> List[Dict[str, Any]]:
    """
    运行所有测试

    Args:
        prompts: 提示词字典

    Returns:
        所有测试结果列表
    """
    all_results = []
    total_tests = len(Config.TEST_CASES) * 2  # 每个测试用例运行2次（原+新）
    current_test = 0

    print(f'\n🚀 开始测试，共 {len(Config.TEST_CASES)} 个测试用例，每个测试2个提示词版本')
    print(f'总计: {total_tests} 次API调用\n')

    for test_case in Config.TEST_CASES:
        print_separator('-')
        print(f'\n📋 测试进度: {test_case["id"]}/{len(Config.TEST_CASES)} - {test_case["name"]}')
        print_separator('-')

        # 使用原提示词测试
        current_test += 1
        print(f'\n[{current_test}/{total_tests}] 原提示词测试...')
        result = run_single_test(test_case, prompts['original'], '原提示词')
        all_results.append(result)

        # 延迟避免API限流
        if current_test < total_tests:
            print('⏳ 等待 1.5 秒...\n')
            time.sleep(1.5)

        # 使用新提示词测试
        current_test += 1
        print(f'\n[{current_test}/{total_tests}] 新提示词测试...')
        result = run_single_test(test_case, prompts['new'], '新提示词')
        all_results.append(result)

        # 延迟避免API限流
        if current_test < total_tests:
            print('⏳ 等待 1.5 秒...\n')
            time.sleep(1.5)

    return all_results


# =====================================================
# 统计与报告
# =====================================================

def print_summary(results: List[Dict[str, Any]]):
    """打印统计摘要"""
    print('\n' + '=' * 80)
    print('📊 测试完成 - 统计摘要')
    print('=' * 80 + '\n')

    # 分离原提示词和新提示词的结果
    original_results = [r for r in results if r['prompt_version'] == '原提示词' and r['success']]
    new_results = [r for r in results if r['prompt_version'] == '新提示词' and r['success']]

    print(f'✅ 成功测试数: {len([r for r in results if r["success"]])}/{len(results)}\n')

    # 原提示词统计
    if original_results:
        avg_duration = sum(r['duration_ms'] for r in original_results) / len(original_results)
        avg_tokens = sum(r['total_tokens'] for r in original_results) / len(original_results)
        avg_length = sum(r['content_length'] for r in original_results) / len(original_results)

        print('📊 原提示词统计:')
        print(f'   平均响应时长: {format_duration(int(avg_duration))}')
        print(f'   平均Token数: {avg_tokens:.0f}')
        print(f'   平均输出长度: {avg_length:.0f} 字符\n')

    # 新提示词统计
    if new_results:
        avg_duration = sum(r['duration_ms'] for r in new_results) / len(new_results)
        avg_tokens = sum(r['total_tokens'] for r in new_results) / len(new_results)
        avg_length = sum(r['content_length'] for r in new_results) / len(new_results)

        print('📊 新提示词统计:')
        print(f'   平均响应时长: {format_duration(int(avg_duration))}')
        print(f'   平均Token数: {avg_tokens:.0f}')
        print(f'   平均输出长度: {avg_length:.0f} 字符\n')

    # 对比
    if original_results and new_results:
        orig_dur = sum(r['duration_ms'] for r in original_results) / len(original_results)
        new_dur = sum(r['duration_ms'] for r in new_results) / len(new_results)
        improvement = ((orig_dur - new_dur) / orig_dur) * 100

        print('🔄 对比分析:')
        if improvement > 0:
            print(f'   新提示词响应速度提升: {improvement:.1f}%')
        else:
            print(f'   新提示词响应速度降低: {abs(improvement):.1f}%')


# =====================================================
# 主函数
# =====================================================

def main():
    """主函数"""
    # 打印标题
    print('\n' + '█' * 80)
    print('█' + ' ' * 78 + '█')
    print('█' + '  提示词对比测试工具 (Python版)'.center(76) + '  █')
    print('█' + ' ' * 78 + '█')
    print('█' * 80)
    print()

    # 显示配置信息
    print(f'🤖 测试模型: {Config.MODEL}')
    print(f'📝 API地址: {Config.API_URL}')
    print(f'📋 测试用例数: {len(Config.TEST_CASES)}')
    print(f'🔄 每个用例测试次数: 2 (原提示词 + 新提示词)\n')

    # 检查API Key
    if not Config.API_KEY:
        print('❌ 请在 .env 文件中配置 QWEN_API_KEY')
        sys.exit(1)

    # 加载提示词
    print('📚 加载提示词...\n')
    prompts = load_prompts()

    if not prompts.get('original') or not prompts.get('new'):
        print('❌ 提示词加载失败，请检查文件是否存在')
        sys.exit(1)

    print()

    # 确保结果目录存在
    ensure_results_dir()

    # 运行所有测试
    results = run_all_tests(prompts)

    # 打印统计摘要
    print_summary(results)

    # 保存结果
    timestamp = int(time.time() * 1000)
    csv_file = f'{Config.RESULTS_DIR}/prompt-comparison-{timestamp}.csv'
    json_file = f'{Config.RESULTS_DIR}/prompt-comparison-{timestamp}.json'

    save_to_csv(results, csv_file)
    save_to_json(results, json_file)

    print('=' * 80)
    print('✅ 测试完成！')
    print('=' * 80)
    print(f'\n📄 CSV报告已保存: {csv_file}')
    print(f'📄 JSON数据已保存: {json_file}')
    print('\n💡 提示: 在Excel中打开CSV文件即可查看详细对比结果\n')


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
