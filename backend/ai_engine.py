import os
import json
from google import genai
from google.genai.errors import APIError
from dotenv import load_dotenv

# CARREGA AS VARIÁVEIS DO ARQUIVO .ENV
load_dotenv() 

MODEL_NAME = "gemini-2.5-flash"

# O construtor client = genai.Client() buscará GEMINI_API_KEY automaticamente
try:
    client = genai.Client()
except Exception as e:
    print(f"Erro na inicialização global do cliente Gemini: {e}")
    client = None

def analisar_tarefas(tarefas, eventos_agenda=None):
    if client is None:
        return {"erro": "Cliente Gemini não inicializado.", "detalhe": "Verifique a variável de ambiente GEMINI_API_KEY no arquivo .env."}
        
    texto_tarefas = json.dumps(tarefas, indent=2)
    texto_eventos = json.dumps(eventos_agenda, indent=2) if eventos_agenda else "Nenhum evento fixo de agenda para considerar."

    system_instruction = (
        "Você é um assistente de produtividade. Organize e analise as tarefas."
        "Você DEVE considerar a agenda do usuário para priorizar tarefas de forma realista."
        "Você DEVE responder APENAS com um objeto JSON válido, sem NENHUM texto introdutório ou adicional. "
        "Se a lista de tarefas estiver vazia, retorne um JSON vazio com as chaves esperadas."
    )
    
    prompt_user = f"""
    Tarefas a analisar:
    {texto_tarefas}

    Compromissos Fixos da Agenda (Eventos):
    {texto_eventos}

    Estrutura JSON que você DEVE seguir:
    {{
        "lista_ordenada": [ {{ "titulo": "...", "prioridade": "...", "motivo": "..." }} ],
        "motivo_ordem": "...",
        "recomendacoes": "...",
        "primeira_tarefa": "...",
        "sugestoes": "...",
        "sub_tarefas_sugeridas": [ {{ "tarefa_original": "título da tarefa", "sub_tarefas": ["subtarefa 1", "subtarefa 2"] }} ], 
        "relatorio": "Um resumo conciso de toda a sua análise, usando no máximo 5 frases. Não use Markdown (como **, #, *) ou listas aqui."
    }}
    
    Ao criar a lista ordenada e a primeira tarefa, use os eventos fixos da agenda para otimizar a distribuição de tempo. 
    Se a tarefa for grande, use o campo sub_tarefas_sugeridas para quebrá-la em passos menores e acionáveis.
    """
    
    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=[prompt_user],
            config=genai.types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json" 
            )
        )
        
        resposta_texto = response.text.strip()
        
        if resposta_texto.startswith("```json"):
            resposta_texto = resposta_texto.removeprefix("```json").removesuffix("```").strip()

        analise_json = json.loads(resposta_texto)
        
        return {
            "analise": analise_json,
            "relatorio": analise_json.get("relatorio", "Relatório de resumo não fornecido pela IA.")
        }

    except APIError as e:
        print(f"Erro na API do Gemini: {e}")
        return {"erro": "Falha na comunicação com a IA (Gemini)", "detalhe": f"Erro de API: {e}"}
    except json.JSONDecodeError:
        # Tenta extrair a resposta bruta para debug
        response_text = getattr(response, 'text', 'Resposta não disponível')
        print(f"Erro de JSON. Resposta bruta: {response_text}")
        return {"erro": "Resposta da IA não é JSON válido", "texto": response_text}
    except Exception as e:
        return {"erro": "Um erro inesperado ocorreu no Gemini", "detalhe": str(e)}