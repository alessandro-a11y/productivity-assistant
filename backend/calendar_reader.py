import json
from datetime import datetime, timedelta

def gerar_eventos_mockup():
    """
    Simula a leitura de eventos futuros de uma agenda.
    Estes eventos serão usados para a IA considerar compromissos fixos.
    """
    hoje = datetime.now()
    amanha = hoje + timedelta(days=1)
    
    eventos = [
        {
            "titulo": "Reunião de Alinhamento do Projeto X",
            "data_inicio": (hoje + timedelta(hours=2)).strftime("%Y-%m-%d %H:%M"),
            "data_fim": (hoje + timedelta(hours=3)).strftime("%Y-%m-%d %H:%M"),
            "local": "Zoom Call",
        },
        {
            "titulo": "Compromisso Médico Anual",
            "data_inicio": amanha.strftime("%Y-%m-%d 10:00"),
            "data_fim": amanha.strftime("%Y-%m-%d 11:30"),
            "local": "Clínica Central",
        },
        {
            "titulo": "Treino de Tênis",
            "data_inicio": (hoje + timedelta(hours=6)).strftime("%Y-%m-%d 18:00"),
            "data_fim": (hoje + timedelta(hours=7)).strftime("%Y-%m-%d 19:30"),
            "local": "Clube",
        },
    ]
    return eventos

def carregar_eventos_agenda():
    """
    Função principal que a API irá chamar para obter os eventos.
    No futuro, esta função seria substituída pela leitura de uma API real (Google Calendar/Outlook).
    """
    return gerar_eventos_mockup()