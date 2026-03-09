# from services.knowledge_service import KnowledgeService

# service = KnowledgeService()
# service.ingest_documents()
from services.knowledge_service import KnowledgeService

service = KnowledgeService()

result = service.retrieve_with_crag("What is the news of current war ongoing in Ukraine?")
print()
print(result["mode"])
print(result["context"])
print(result["sources"])