#!/usr/bin/env python3
"""
LLM配置工具
提供EAS模型实例创建功能
"""

import os
from crewai import LLM
from ..config.config import Config

def create_llm(temperature=None, max_tokens=None):
    """
    创建并配置语言模型实例 / Create and configure language model instance

    Args:
        temperature (float, optional): 模型温度参数，控制输出随机性 / Model temperature parameter, controlling output randomness
        max_tokens (int, optional): 最大令牌数限制 / Maximum token limit

    Returns:
        LLM: CrewAI LLM 实例 / CrewAI LLM instance
    """
    # 检查模型名称
    model_name = Config.QWEN_MODEL_NAME
    if not model_name:
        raise ValueError("QWEN_MODEL_NAME 未在环境变量中设置")

    # 使用 openai/ 前缀 + DashScope OpenAI 兼容接口
    # DashScope 原生支持 OpenAI 协议，用 openai/ 前缀更稳定
    llm = LLM(
        model=f"dashscope/{model_name}",     # CrewAI native DashScope provider
        base_url=Config.QWEN_API_BASE,       # DashScope OpenAI 兼容端点
        api_key=Config.QWEN_API_KEY,         # API密钥
        temperature=temperature or Config.MODEL_TEMPERATURE,  # 温度参数
        max_tokens=max_tokens or Config.MODEL_MAX_TOKENS,     # 最大令牌数
    )

    return llm

def create_eas_llm():
    """
    创建EAS模型实例

    Returns:
        LLM: CrewAI LLM EAS模型实例
    """
    if not Config.EAS_ENABLED:
        raise ValueError("EAS is disabled; using the primary Qwen model")

    # 检查EAS配置是否存在
    if not Config.EAS_ENDPOINT or not Config.EAS_TOKEN:
        raise ValueError("EAS配置未设置，请在.env文件中配置有效的EAS_ENDPOINT和EAS_TOKEN")

    # 检查模型名称
    model_name = Config.EAS_MODEL_NAME
    if not model_name:
        raise ValueError("EAS_MODEL_NAME 未在环境变量中设置")

    try:
        eas_llm = LLM(
            model=f"hosted_vllm/{model_name}",
            base_url=Config.EAS_ENDPOINT,
            api_key=Config.EAS_TOKEN,
            temperature=Config.MODEL_TEMPERATURE,
            max_tokens=Config.MODEL_MAX_TOKENS,
        )
        return eas_llm
    except Exception as e:
        print(f"创建EAS模型实例失败: {e}")
        raise
