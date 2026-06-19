<div align="center">

# 🤖 Coder

### Your AI pair-programmer with deep RAG over *your own* codebase

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](#)
[![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)](#)
[![LangGraph](https://img.shields.io/badge/LangGraph-1C3C3C?logo=langchain&logoColor=white)](#)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)](#)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](#)
[![Stripe](https://img.shields.io/badge/Stripe-635BFF?logo=stripe&logoColor=white)](#)

*Ask questions and ship changes with an assistant that actually understands how your repository fits together — not just the file in front of it.*

</div>

---

## ✨ Why Coder is different

Most "chat with your code" tools embed raw source and hope cosine similarity finds the right chunk. Coder takes a smarter route:

- 🧠 **Understands before it indexes.** An `AIDocumenter` generates a concise **summary + dependency map for every file**, and embeds the *summaries* — semantic intent, not noisy tokens.
- ⚡ **Incremental by design.** Each file is cached by **SHA‑256 hash**; only what changed gets re-processed. Re-indexing a large repo costs cents, not minutes.
- 🎯 **Two-stage retrieval.** Top‑100 candidates by cosine similarity, then a **cross-encoder re-rank** for precision, assembled into a **token-budgeted context window**.
- 🔁 **Stateful agent.** Built on **LangGraph** with a MongoDB checkpointer, so conversations are durable and resumable.
- 💳 **Production-ready from day one.** Auth (JWT), usage metering and **Stripe** token billing baked in.

## 🛠️ Tech stack

| Layer | Technologies |
|-------|--------------|
| **Backend** | Node.js · Express · LangGraph / LangChain · MongoDB + Mongoose · JWT · Stripe |
| **Frontend** | React · TypeScript · MUI · CodeMirror (multi-language editor) · Stripe Elements |
| **AI** | LLM summarization · embeddings · cross-encoder re-ranking · token-budgeted context |

## 🏗️ How it works

```
your repo ──▶ AIDocumenter ──▶ per-file summary + deps ──▶ embeddings (cached by hash)
                                                              │
question ──▶ cosine top-100 ──▶ cross-encoder re-rank ──▶ token-budgeted context ──▶ LLM ──▶ answer / code changes
```

## 🚀 Quick start

```bash
# 1. Backend
cd api
cp .env.example .env        # set GEMINI_API_KEY / OPENAI_API_KEY, MONGODB_URI
npm install
npm run dev

# 2. Frontend
cd ../ui
npm install
npm start
```

## 📁 Project structure

```
coder/
├── api/   # Express + LangGraph backend, RAG pipeline, billing
└── ui/    # React + TypeScript client with embedded code editor
```

---

<div align="center">
<sub>Built by <a href="https://github.com/GuillermoPastoriniRivas">Guillermo Pastorini</a></sub>
</div>
