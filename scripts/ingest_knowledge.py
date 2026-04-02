import os
import sys
from pathlib import Path

# Add the project root to sys.path
sys.path.append(str(Path(__file__).parent.parent))

from services.knowledge_service import KnowledgeService

def main():
    print("--- Knowledge Ingestion Service ---")
    
    # Ensure directories exist
    base_path = Path("data/knowledge_base")
    if not base_path.exists():
        base_path.mkdir(parents=True, exist_ok=True)
        print(f"Created directory: {base_path}")
        print("Please place your PDF files in domain-specific folders within this directory.")
        return

    service = KnowledgeService()
    print("Starting ingestion...")
    service.ingest_documents()
    print("Ingestion process completed.")

if __name__ == "__main__":
    main()
