from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.messages import HumanMessage, SystemMessage
from config import GEMINI_MODEL, GOOGLE_API_KEY, TEMPERATURE


class GeminiProvider:
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model=GEMINI_MODEL,
            temperature=TEMPERATURE,
            google_api_key=GOOGLE_API_KEY,
            timeout=60, # 60 seconds timeout
        )

    def generate(self, messages):
        return self.llm.invoke(messages)

    def generate_structured(self, messages, output_schema):
        parser = PydanticOutputParser(pydantic_object=output_schema)
        format_instructions = parser.get_format_instructions()

        # Inject instructions into the last human message or a new system message
        if isinstance(messages[-1], HumanMessage):
            messages[-1].content += f"\n\n{format_instructions}"
        else:
            messages.append(SystemMessage(content=format_instructions))

        response = self.llm.invoke(messages)

        # Robust parsing to handle potential markdown wrappers
        content = response.content
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()

        return parser.parse(content)