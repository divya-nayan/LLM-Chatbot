# MultiModal AI Document Assistant

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Node.js 18+](https://img.shields.io/badge/node-18+-green.svg)](https://nodejs.org/)

**Author:** Divya Nayan
**Contact:** divyanayan88@gmail.com

A sophisticated AI-powered document assistant with intelligent processing capabilities and knowledge base management. This application provides ultra-fast inference for document analysis, allowing users to upload various document types (PDF, DOCX, TXT, MD, images), build a searchable knowledge base, and have intelligent conversations about their documents.

## Features

- **Advanced Language Models**: Supports multiple state-of-the-art language models for optimal performance
- **Multi-format Document Support**: Upload and process PDF, DOCX, TXT, Markdown, and image files (JPG, PNG)
- **Intelligent OCR**: Extract text from images using Tesseract OCR
- **Vector Database**: Efficient document search using ChromaDB and sentence transformers
- **Session Management**: Maintain multiple chat sessions with conversation history
- **Real-time Chat**: WebSocket support for streaming responses
- **Modern UI**: Clean, responsive interface built with Next.js and Tailwind CSS
- **RESTful API**: Well-documented FastAPI backend
- **Docker Support**: Easy deployment with Docker Compose

## Available Language Models

- **High-Performance Models** - Best quality with large context windows
- **Optimized Models** - Latest generation with excellent performance
- **Fast Models** - Quick response times for real-time interactions
- **Specialized Models** - Tailored for specific document processing tasks

## Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **Advanced AI SDK**: For language model inference
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
- AI API Key (obtain from your AI provider)
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

6. Edit `.env` file and add your AI API key:
```env
AI_API_KEY=your-api-key-here
AI_MODEL=your-preferred-model
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
# Edit backend/.env and add your AI API key
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
- Powered by advanced AI inference

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

### Getting an AI API Key

1. Contact your preferred AI service provider
2. Sign up for an account
3. Generate an API key
4. Add it to your `.env` file

### Environment Variables

Key environment variables in `backend/.env`:

```env
# AI Configuration
AI_API_KEY=your-ai-api-key
AI_MODEL=your-preferred-model
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

### Changing AI Models

Update `AI_MODEL` in `.env`:
```env
# For best quality:
AI_MODEL=high-performance-model

# For balanced performance:
AI_MODEL=optimized-model

# For faster responses:
AI_MODEL=fast-model

# For specialized tasks:
AI_MODEL=specialized-model
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
│   │       ├── ai_service.py       # AI integration
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

The system provides:
- **Ultra-fast inference**: Optimized for high-speed document processing
- **Scalable architecture**: Supports varying usage patterns
- **High-quality results**: State-of-the-art language model performance

## Usage Considerations

- Request limits vary by AI provider
- Token usage optimized for efficiency
- Scalable for both development and production use

## Troubleshooting

### Common Issues

1. **AI API errors**:
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
- Contact: Divya Nayan (divyanayan88@gmail.com)

## Roadmap

- [ ] User authentication and authorization
- [ ] Multi-user support with isolated knowledge bases
- [ ] Support for more document formats
- [ ] Advanced RAG features
- [ ] Conversation export functionality
- [ ] Model comparison interface
- [ ] Usage analytics dashboard