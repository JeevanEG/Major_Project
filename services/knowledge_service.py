import os
from pathlib import Path
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import Chroma
from config import GOOGLE_API_KEY
from langchain_core.messages import HumanMessage
from services.llm_service import LLMService



class KnowledgeService:

    def __init__(self):

        self.base_path = Path("data/knowledge_base")
        self.persist_directory = "data/vector_db"

        self.embeddings = GoogleGenerativeAIEmbeddings(
            model="models/gemini-embedding-001",
            google_api_key=GOOGLE_API_KEY
        )

        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )

    def ingest_documents(self):

        documents = []
        
        if not self.base_path.exists():
            print(f"Directory {self.base_path} does not exist. Skipping ingestion.")
            return

        for domain_folder in self.base_path.iterdir():

            if not domain_folder.is_dir():
                continue

            domain = domain_folder.name

            for pdf_file in domain_folder.glob("*.pdf"):

                loader = PyPDFLoader(str(pdf_file))
                pages = loader.load()

                for page in pages:
                    cleaned_text = page.page_content.encode("utf-8", "ignore").decode("utf-8")
                    cleaned_text = cleaned_text.replace("\x00", "")
                    page.page_content = cleaned_text
                    page.metadata["book"] = pdf_file.stem
                    page.metadata["domain"] = domain

                documents.extend(pages)

        if not documents:
            print("No documents found for ingestion.")
            return

        print(f"Loaded {len(documents)} pages")

        chunks = self.text_splitter.split_documents(documents)

        print(f"Created {len(chunks)} chunks")

        vector_db = Chroma.from_documents(
            documents=chunks,
            embedding=self.embeddings,
            persist_directory=self.persist_directory
        )

        vector_db.persist()

        print("Vector database created successfully")

    def load_vector_store(self):
        if not os.path.exists(self.persist_directory):
            return None

        vector_db = Chroma(
            persist_directory=self.persist_directory,
            embedding_function=self.embeddings
        )

        return vector_db

    def get_retriever(self):
        vector_db = self.load_vector_store()
        
        if vector_db is None:
            return None

        retriever = vector_db.as_retriever(
            search_type="similarity",
            search_kwargs={"k": 5}
        )
        return retriever

    def retrieve_context(self, query: str):

        retriever = self.get_retriever()
        if not retriever:
            return "", []

        docs = retriever.invoke(query)

        context = "\n\n".join([doc.page_content for doc in docs])

        return context, docs

    def evaluate_retrieval(self, query: str, docs):
        if not docs:
            return False
            
        llm = LLMService()

        context_preview = "\n\n".join(
            [doc.page_content[:500] for doc in docs]
        )

        prompt = f"""
            You are a grader assessing whether a retrieved document is relevant to a user query.
            
            User query: 
            {query}

            Retrieved context: 
            {context_preview}

            Grading Criteria:
            - Respond RELEVANT only if the context contains specific facts or data to answer the query.
            - If the context is only broadly related but doesn't provide a direct answer, respond IRRELEVANT.
            
            Respond with exactly one word: RELEVANT or IRRELEVANT
            """

        response = llm.generate([HumanMessage(content=prompt)])
        decision = response.content.strip().upper()

        return "RELEVANT" in decision and "IRRELEVANT" not in decision

    def retrieve_with_crag(self, query: str):
        context, docs = self.retrieve_context(query)

        is_relevant = self.evaluate_retrieval(query, docs)

        if is_relevant: 
            return {
                "mode": "rag",
                "context": context,
                "sources": [doc.metadata for doc in docs]
            }
        else:
            return {
                "mode": "parametric",
                "context": "",
                "sources": []
            }
