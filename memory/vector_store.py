from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import Chroma
from config import GOOGLE_API_KEY
import os

class VectorStoreManager:
    def __init__(self, persist_directory: str = "data/vector_db"):
        self.persist_directory = persist_directory
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model="models/gemini-embedding-001",
            google_api_key=GOOGLE_API_KEY
        )

    def get_vector_store(self):
        if not os.path.exists(self.persist_directory):
            # Create an empty vector store if it doesn't exist
            os.makedirs(self.persist_directory, exist_ok=True)
            
        return Chroma(
            persist_directory=self.persist_directory,
            embedding_function=self.embeddings
        )

    def add_documents(self, documents):
        vector_db = self.get_vector_store()
        vector_db.add_documents(documents)
        vector_db.persist()
