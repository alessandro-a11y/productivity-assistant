let tarefas = [];

// ⬇️ FUNÇÕES DE PERSISTÊNCIA (LOCAL STORAGE)
function salvarTarefas() {
    localStorage.setItem('tarefasApp', JSON.stringify(tarefas));
}

function carregarTarefas() {
    const tarefasSalvas = localStorage.getItem('tarefasApp');
    if (tarefasSalvas) {
        tarefas = JSON.parse(tarefasSalvas);
        atualizarLista();
    }
}
// ⬆️ FIM FUNÇÕES DE PERSISTÊNCIA

function adicionarTarefa() {
    const titulo = document.getElementById("titulo").value;
    const prazo = document.getElementById("prazo").value;
    const prioridade = document.getElementById("prioridade").value;
    const descricao = document.getElementById("descricao").value;

    if (!titulo) {
        alert("Digite o título da tarefa!");
        return;
    }

    let prioridadeNum = prioridade ? Number(prioridade) : null;
    let prazoFormatado = prazo === "" ? null : prazo;

    const task = {
        titulo,
        prazo: prazoFormatado,
        prioridade: prioridadeNum,
        descricao: descricao === "" ? null : descricao
    };

    tarefas.push(task);
    atualizarLista();
    salvarTarefas(); // ⬅️ Salva após adicionar

    document.getElementById("titulo").value = "";
    document.getElementById("prazo").value = "";
    document.getElementById("prioridade").value = "";
    document.getElementById("descricao").value = "";
}

function atualizarLista() {
    const lista = document.getElementById("lista");
    lista.innerHTML = "";

    tarefas.forEach((t, i) => {
        const li = document.createElement("li");
        li.innerHTML = `
            <div style="padding: 15px; border: 1px solid #e9ecef; margin-bottom: 10px; border-radius: 8px; background: #f7f9fb; border-left: 5px solid var(--color-primary-light);">
                <strong>${t.titulo}</strong> <br>
                Prazo: ${t.prazo || "—"} <br>
                Prioridade: ${t.prioridade || "—"} <br>
                Descrição: ${t.descricao || "—"}
                <br><button onclick="remover(${i})" class="btn" style="margin-top: 10px; background-color: red; !important; width: auto; align-self: flex-end; padding: 8px 18px; font-size: 0.9em;">Remover</button>
            </div>
        `;
        lista.appendChild(li);
    });
}

function remover(index) {
    tarefas.splice(index, 1);
    atualizarLista();
    salvarTarefas(); // ⬅️ Salva após remover
}

/**
 * Função principal: Formata o objeto JSON de resposta da IA em HTML amigável (Visual Premium, com Font Awesome).
 * @param {object} data - O objeto JSON retornado pelo FastAPI.
 */
function formatarRelatorio(data) {
    const analise = data.analise;

    const relatorio = (data.relatorio || "A IA não forneceu um resumo adicional para o relatório.")
        .replace(/\n/g, '<br>');

    // 1. Formatação da Lista Ordenada
    let listaHtml = '<ol>';
    if (analise.lista_ordenada && analise.lista_ordenada.length > 0) {
        analise.lista_ordenada.forEach((item, index) => {
            const prioridadeDisplay = item.prioridade ? item.prioridade : (index + 1); 
            listaHtml += `
                <li style="margin-bottom: 12px;">
                    <span style="color: var(--color-primary-light); font-weight: 600;">#${prioridadeDisplay}</span>
                    &nbsp;<strong>${item.titulo}</strong>
                    <br>
                    <small style="color: var(--color-text-light);">Motivo: ${item.motivo}</small>
                </li>
            `;
        });
    } else {
        listaHtml += `<li>Nenhuma tarefa para ordenar.</li>`;
    }
    listaHtml += '</ol>';
    
    // 2. Formatação das Subtarefas Sugeridas 
    let subtarefasHtml = '';
    if (analise.sub_tarefas_sugeridas && analise.sub_tarefas_sugeridas.length > 0) {
        analise.sub_tarefas_sugeridas.forEach(grupo => {
            subtarefasHtml += `
                <div style="margin-top: 15px; padding: 10px; background: #f0f3f8; border-radius: 8px;">
                    <p style="font-weight: 600; color: var(--color-primary);">Quebre esta tarefa: 
                        <span style="border-bottom: 2px dashed #004d99; padding-bottom: 2px;">${grupo.tarefa_original}</span>
                    </p>
                    <ul style="padding-left: 20px;">`;
            grupo.sub_tarefas.forEach(sub => {
                subtarefasHtml += `<li><i class="fa-regular fa-square"></i> ${sub}</li>`;
            });
            subtarefasHtml += `
                    </ul>
                </div>
            `;
        });
    } else {
        subtarefasHtml = `<p style="color: var(--color-text-light);">A IA não sugeriu sub tarefas para esta lista.</p>`;
    }


    // 3. Construção do HTML Final com Ícones Font Awesome
    const html = `
        <div style="border: 2px solid var(--color-primary-light); padding: 25px; border-radius: 14px; background: #ffffff; color: var(--color-text);">
            <h2 style="color: var(--color-primary); font-weight: 700; margin-bottom: 5px; padding-bottom: 10px; border-bottom: 2px solid #ecf0f1;">
                <i class="fa-solid fa-clipboard-check"></i> Assistente de Produtividade: Análise do Dia
            </h2>
            <hr style="border-top: 1px solid #ccc; margin-top: 15px;">
            
            <h4 style="color: var(--color-text); font-size: 1.1em; border-left: 4px solid var(--color-success); padding-left: 12px;"><i class="fa-solid fa-rocket"></i> Tarefa Para Fazer Primeiro</h4>
            <p style="font-size: 1.2em; font-weight: 600; color: var(--color-success); padding-left: 15px;">
                ${analise.primeira_tarefa || 'Não definido'}
            </p>

            <h4 style="color: var(--color-text); font-size: 1.1em; border-left: 4px solid #ffc107; padding-left: 12px;"><i class="fa-solid fa-list-check"></i> Lista de Prioridades (Ordem Sugerida)</h4>
            ${listaHtml}

            <h4 style="color: var(--color-text); font-size: 1.1em; border-left: 4px solid #17a2b8; padding-left: 12px;"><i class="fa-solid fa-lightbulb"></i> Insights e Recomendações</h4>
            <p style="margin-bottom: 5px;"><strong>Motivo Geral da Ordem:</strong> ${analise.motivo_ordem || 'N/A'}</p>
            <p style="margin-bottom: 5px;"><strong>Recomendações:</strong> ${analise.recomendacoes || 'N/A'}</p>
            <p><strong>Sugestões de Produtividade:</strong> ${analise.sugestoes || 'N/A'}</p>
            
            <h4 style="color: var(--color-text); font-size: 1.1em; border-left: 4px solid #7f8c8d; padding-left: 12px;"><i class="fa-solid fa-layer-group"></i> Quebra de Tarefas (Para Ação)</h4>
            ${subtarefasHtml}
            
            <hr style="border-top: 1px solid #ccc; margin-top: 20px;">

            <h4 style="color: var(--color-text-light); font-size: 1.1em; border-left: 4px solid var(--color-text-light); padding-left: 12px;"><i class="fa-solid fa-file-lines"></i> Resumo Adicional do Relatório</h4>
            
            <div class="relatorio-resumo-container">
                <p>${relatorio}</p>
            </div>
        </div>
    `;

    return html;
}

async function enviarTarefas() {
    if (tarefas.length === 0) {
        alert("Adicione tarefas antes!");
        return;
    }

    document.getElementById("resultado").innerHTML = `<p style="text-align: center; font-size: 1.2em; color: var(--color-primary);">Processando com IA...</p>`;

    try {
        const res = await fetch("http://localhost:8000/analisar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tarefas })
        });

        const data = await res.json();
        
        if (data.erro) {
            document.getElementById("resultado").innerHTML = `
                <div style="border: 2px solid var(--color-danger); padding: 25px; border-radius: 12px; background: #fef4f4; color: var(--color-danger);">
                    <h3><i class="fa-solid fa-triangle-exclamation"></i> Erro de Processamento da IA</h3>
                    <p style="font-weight: bold;">Motivo: ${data.erro}</p>
                    <pre style="white-space: pre-wrap; margin-top: 15px; padding: 10px; background: #fcebeb; border-radius: 5px; font-size: 0.9em;">Detalhes: ${data.detalhe || data.texto || 'N/A'}</pre>
                </div>
            `;
            return;
        }

        const relatorioFormatado = formatarRelatorio(data);
        document.getElementById("resultado").innerHTML = relatorioFormatado; 

    } catch (error) {
        document.getElementById("resultado").innerHTML = `
            <div style="border: 2px solid var(--color-danger); padding: 25px; border-radius: 12px; background: #fef4f4; color: var(--color-danger);">
                <h3>🚨 Erro de Conexão com o Servidor</h3>
                <p>Não foi possível conectar ao servidor FastAPI (<code>http://localhost:8000</code>). Verifique se o servidor Python está rodando.</p>
            </div>
        `;
        console.error("Erro ao enviar tarefas:", error);
    }
}

function limparLista() {
    tarefas = [];
    atualizarLista();
    localStorage.removeItem('tarefasApp'); // ⬅️ Limpa o Local Storage

    document.getElementById("resultado").innerHTML = `
        <div style="padding: 25px; background: var(--color-card-bg); color: var(--color-text); border-radius: 12px; min-height: 150px; box-shadow: var(--shadow-subtle); border: 2px solid var(--color-primary-light);">
            <p style="font-size: 1.1em; text-align: center;">Relatório limpo. Adicione tarefas para gerar uma nova análise.</p>
        </div>
    `;
}

// ⬇️ FUNÇÃO PARA CARREGAR E EXIBIR A AGENDA
async function carregarAgenda() {
    const agendaDiv = document.getElementById("agenda-eventos");
    agendaDiv.innerHTML = `<p style="text-align: center; color: var(--color-text-light);">Carregando eventos...</p>`;

    try {
        const res = await fetch("http://localhost:8000/agenda");
        const data = await res.json();
        const eventos = data.eventos;

        if (eventos && eventos.length > 0) {
            let html = '<ul style="list-style-type: none; padding: 0;">';
            eventos.forEach(evento => {
                // Formata a hora de início e fim
                const horaInicio = evento.data_inicio.substring(11, 16);
                const horaFim = evento.data_fim.substring(11, 16);

                html += `
                    <li style="background: #f0f3f8; padding: 10px 15px; margin-bottom: 8px; border-left: 5px solid #004d99; border-radius: 6px;">
                        <strong>${evento.titulo}</strong>
                        <br>
                        <small style="color: var(--color-text-light);">
                            <i class="fa-regular fa-clock"></i> ${horaInicio} - ${horaFim} 
                            &nbsp;|&nbsp; 
                            <i class="fa-solid fa-location-dot"></i> ${evento.local}
                        </small>
                    </li>
                `;
            });
            html += '</ul>';
            agendaDiv.innerHTML = html;
        } else {
            agendaDiv.innerHTML = `<p style="text-align: center; color: var(--color-text-light);"><i class="fa-regular fa-calendar-check"></i> Nenhuma reunião ou evento fixo para hoje.</p>`;
        }

    } catch (error) {
        agendaDiv.innerHTML = `<p style="color: var(--color-danger); text-align: center;"><i class="fa-solid fa-exclamation-triangle"></i> Erro ao carregar a agenda. Verifique o servidor.</p>`;
    }
}
// ⬆️ FIM FUNÇÃO PARA CARREGAR AGENDA

// ⬇️ CHAMA FUNÇÕES AO CARREGAR A PÁGINA
document.addEventListener('DOMContentLoaded', carregarTarefas);
document.addEventListener('DOMContentLoaded', carregarAgenda);