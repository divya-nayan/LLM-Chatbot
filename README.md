# MultiModal AI ChatBot with Groq

A sophisticated AI-powered chatbot with document processing capabilities and knowledge base management. This application uses **Groq's ultra-fast LLM API** for inference, allowing users to upload various document types (PDF, DOCX, TXT, MD, images), build a searchable knowledge base, and have intelligent conversations with AI models like Mixtral, LLaMA3, and more.

## Features

- **Groq-Powered LLMs**: Uses Groq's free tier with models like Mixtral 8x7B, LLaMA3 70B, and Gemma 7B
- **Multi-format Document Support**: Upload and process PDF, DOCX, TXT, Markdown, and image files (JPG, PNG)
- **Intelligent OCR**: Extract text from images using Tesseract OCR
- **Vector Database**: Efficient document search using ChromaDB and sentence transformers
- **Session Management**: Maintain multiple chat sessions with conversation history
- **Real-time Chat**: WebSocket support for streaming responses
- **Modern UI**: Clean, responsive interface built with Next.js and Tailwind CSS
- **RESTful API**: Well-documented FastAPI backend
- **Docker Support**: Easy deployment with Docker Compose

## Groq Models Available (Free Tier)

- **Mixtral 8x7B (32k context)** - Best quality, largest context window
- **LLaMA3 70B (8k context)** - Latest LLaMA model with good performance
- **LLaMA3 8B (8k context)** - Faster, lighter version
- **LLaMA2 70B (4k context)** - Previous generation LLaMA
- **Gemma 7B Instruct** - Google's efficient model

## Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **Groq SDK**: For LLM inference
- **SQLAlchemy**: Database ORM with async support
- **ChromaDB**: Vector database for semantic search
- **Sentence Transformers**: For document embeddings
- **Redis**: Caching and session management
- **Tesseract OCR**: Image text extraction

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **React Query**: Data fetching and caching
- **Zustand**: State management
- **React Dropzone**: File upload handling

## Prerequisites

- Python 3.11+
- Node.js 18+
- Docker and Docker Compose (for containerized deployment)
- Groq API Key (get free at https://console.groq.com)
- Redis (optional, for caching)
- Tesseract OCR (for image text extraction)

## Installation

### Method 1: Local Development

#### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Install Tesseract OCR:
- **Windows**: Download from https://github.com/UB-Mannheim/tesseract/wiki
- **macOS**: `brew install tesseract`
- **Linux**: `sudo apt-get install tesseract-ocr`

5. Set up environment variables:
```bash
cp .env.example .env
```

6. Edit `.env` file and add your Groq API key:
```env
GROQ_API_KEY=your-groq-api-key-here
GROQ_MODEL=mixtral-8x7b-32768
```

7. Start the backend server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Access the application at http://localhost:3000

### Method 2: Docker Deployment

1. Clone the repository:
```bash
git clone <repository-url>
cd chatbot
```

2. Create environment file:
```bash
cp backend/.env.example backend/.env
# Edit backend/.env and add your Groq API key
```

3. Start all services:
```bash
docker-compose up -d
```

4. Access the application at http://localhost

## Usage

### 1. Document Upload
- Click on "Documents" in the sidebar
- Drag and drop files or click to browse
- Supported formats: PDF, DOCX, TXT, MD, JPG, PNG
- Maximum file size: 10MB per file
- Documents are automatically processed and added to the knowledge base

### 2. Chat Interface
- Click on "Chat" in the sidebar
- Type your message in the input field
- The AI will respond using both general knowledge and your uploaded documents
- Chat history is preserved across sessions
- Powered by Groq's ultra-fast inference

### 3. Knowledge Base Search
- Click on "Knowledge Base" in the sidebar
- Enter search queries to find relevant information from your documents
- View document chunks and relevance scores
- Clear the entire knowledge base if needed

## API Documentation

When the backend is running, access the interactive API documentation at:
- Swagger UI: http://localhost:8000/api/v1/docs
- ReDoc: http://localhost:8000/api/v1/redoc

## Configuration

### Getting a Groq API Key

1. Visit https://console.groq.com
2. Sign up for a free account
3. Generate an API key
4. Add it to your `.env` file

### Environment Variables

Key environment variables in `backend/.env`:

```env
# Groq Configuration
GROQ_API_KEY=your-groq-api-key
GROQ_MODEL=mixtral-8x7b-32768
MAX_TOKENS=4096
TEMPERATURE=0.7

# File Upload
MAX_FILE_SIZE=10485760  # 10MB
ALLOWED_EXTENSIONS=pdf,docx,txt,md,jpg,jpeg,png

# Vector Database
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
CHROMA_PERSIST_DIR=./data/vectordb

# Database
DATABASE_URL=sqlite+aiosqlite:///./data/chatbot.db
```

### Changing Groq Models

Update `GROQ_MODEL` in `.env`:
```env
# For best quality (32k context):
GROQ_MODEL=mixtral-8x7b-32768

# For LLaMA3 70B (8k context):
GROQ_MODEL=llama3-70b-8192

# For faster responses:
GROQ_MODEL=llama3-8b-8192

# For Google's Gemma:
GROQ_MODEL=gemma-7b-it
```

Then restart the backend server.

## Project Structure

```
chatbot/
├── backend/
│   ├── app/
│   │   ├── api/           # API endpoints
│   │   ├── core/          # Core configuration
│   │   ├── db/            # Database models
│   │   ├── models/        # Data models
│   │   └── services/      # Business logic
│   │       ├── groq_llm_service.py  # Groq integration
│   │       ├── chat_service.py      # Chat management
│   │       └── ...
│   ├── data/              # Data storage
│   ├── logs/              # Application logs
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/           # Next.js app router
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   └── services/      # API services
│   └── package.json
├── docker-compose.yml
└── README.md
```

## Testing

### Backend Tests
```bash
cd backend
pytest tests/ -v
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Deployment

### Production Deployment with Docker

1. Set environment variables for production
2. Build and start services:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Cloud Deployment

The application can be deployed to:
- **Vercel/Netlify**: Frontend deployment
- **Railway/Render**: Backend deployment
- **AWS/GCP/Azure**: Full stack deployment

## Performance

Groq provides:
- **Ultra-fast inference**: Up to 10x faster than traditional APIs
- **Free tier**: Generous rate limits for development
- **High-quality models**: Access to state-of-the-art open models

## Rate Limits (Free Tier)

- Requests per minute: ~30
- Tokens per minute: ~15,000
- Ideal for development and small applications

## Troubleshooting

### Common Issues

1. **Groq API errors**:
   - Verify API key is correct
   - Check rate limits haven't been exceeded
   - Try a different model if one is unavailable

2. **OCR not working**:
   - Verify Tesseract installation: `tesseract --version`
   - Check PATH environment variable

3. **Database errors**:
   - Delete `data/chatbot.db` and restart
   - Run migrations: `alembic upgrade head`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue on GitHub
- Check the API documentation
- Review Groq's documentation at https://console.groq.com/docs

## Roadmap

- [ ] User authentication and authorization
- [ ] Multi-user support with isolated knowledge bases
- [ ] Support for more document formats
- [ ] Advanced RAG features
- [ ] Conversation export functionality
- [ ] Model comparison interface
- [ ] Usage analytics dashboard