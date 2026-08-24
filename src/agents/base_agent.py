import logging
import os
from crewai import Agent, LLM
from src.utils.prompt_loader import load_prompt
from src.config.config import Config

# 配置日志 / Configure logging
logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)


class BaseAgent:
    """基础智能体类，提供通用的智能体创建功能 / Base agent class that provides general agent creation functionality"""

    def __init__(self, llm, role, goal, prompt_file, temperature=None):
        self.llm = llm
        self.role = role
        self.goal = goal
        self.prompt_file = prompt_file
        self.temperature = temperature

    def create_agent(self):
        # 如果提供了特定温度，则使用该温度，否则使用LLM的默认温度
        agent_llm = self.llm
        if self.temperature is not None:
            # 使用 CrewAI 原生 LLM 类创建新实例
            model = getattr(self.llm, 'model', None) or Config.QWEN_MODEL_NAME
            base_url = getattr(self.llm, 'base_url', None) or Config.QWEN_API_BASE
            api_key = getattr(self.llm, 'api_key', None) or Config.QWEN_API_KEY
            max_tokens = getattr(self.llm, 'max_tokens', None) or Config.MODEL_MAX_TOKENS

            agent_llm = LLM(
                model=model,
                base_url=base_url,
                api_key=api_key,
                temperature=self.temperature,
                max_tokens=max_tokens,
            )

        return Agent(
            role=self.role,
            goal=self.goal,
            backstory=load_prompt(self.prompt_file),
            verbose=False,
            allow_delegation=False,
            llm=agent_llm
        )