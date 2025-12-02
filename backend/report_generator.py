def gerar_relatorio(tarefas, analise):
    if "erro" in analise:
        return "A IA não conseguiu gerar relatório."

    rel = "RESUMO DO DIA\n\n"

    if "tarefas_ordenadas" in analise:
        rel += "**Tarefas em ordem sugerida:**\n"
        for t in analise["tarefas_ordenadas"]:
            rel += f"- {t}\n"

    if "recomendacoes" in analise:
        rel += "\n**Recomendações:**\n"
        for r in analise["recomendacoes"]:
            rel += f"- {r}\n"

    if "tarefa_principal" in analise:
        rel += f"\n COMEÇAR POR: {analise['tarefa_principal']}\n"

    return rel
