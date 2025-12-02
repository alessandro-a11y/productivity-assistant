from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ai_engine import analisar_tarefas
from calendar_reader import carregar_eventos_agenda # ⬅️ NOVO IMPORT

app = FastAPI()

# Libera o front-end para acessar o back-end (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Tarefa(BaseModel):
    titulo: str
    prazo: str | None = None
    prioridade: int | None = None
    descricao: str | None = None

class ListaTarefas(BaseModel):
    tarefas: list[Tarefa]

@app.get("/")
def root():
    return {"status": "Servidor rodando"}

@app.get("/agenda") # ⬅️ NOVO ENDPOINT
def obter_eventos_agenda():
    """Retorna os eventos fixos de agenda para o frontend."""
    return {"eventos": carregar_eventos_agenda()}

@app.post("/analisar")
def analisar(lista: ListaTarefas):
    # 2. Obtém os eventos da agenda
    eventos_agenda = carregar_eventos_agenda()
    
    # Converte a lista de objetos Pydantic em uma lista de dicionários
    tarefas_dict = [t.model_dump() for t in lista.tarefas]
    
    # 3. Chama a função principal, PASSANDO OS EVENTOS DA AGENDA
    resultado_completo_ia = analisar_tarefas(tarefas_dict, eventos_agenda)

    # Retorna o resultado exato da IA. 
    return resultado_completo_ia