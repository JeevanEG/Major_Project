from langchain_openai import ChatOpenAI
import os
from typing import List, Any

class OpenAIProvider:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.model = os.getenv("OPENAI_MODEL", "gpt-4-turbo-preview")
        self.llm = ChatOpenAI(
            model=self.model,
            openai_api_key=self.api_key,
            temperature=0.2
        )

    def generate(self, messages: List[Any]):
        return self.llm.invoke(messages)

    def generate_structured(self, messages: List[Any], output_schema: Any):
        structured_llm = self.llm.with_structured_output(output_schema)
        return structured_llm.invoke(messages)
