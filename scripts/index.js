const API_BASE_URL = "https://productivity-assistant-backend.onrender.com"; 
let tarefas = [];

document.addEventListener('DOMContentLoaded', () => {
    carregarTarefasSalvas();
    carregarAgenda();
    document.getElementById('taskForm').addEventListener('submit', adicionarTarefa);
    document.getElementById('analisarBtn').addEventListener('click', enviarTarefas);
    document.getElementById('limparBtn').addEventListener('click', limparLista);
    renderizarTarefas();
});

function adicionarTarefa(e) {
    e.preventDefault();
    const titulo = document.getElementById('titulo').value.trim();
    const prazo = document.getElementById('prazo').value;
    const prioridade = parseInt(document.getElementById('prioridade').value, 10);
    const descricao = document.getElementById('descricao').value.trim();

    if (titulo) {
        tarefas.push({ titulo, prazo, prioridade, descricao });
        salvarTarefas();
        renderizarTarefas();
        document.getElementById('taskForm').reset();
    }
}

function removerTarefa(index) {
    tarefas.splice(index, 1);
    salvarTarefas();
    renderizarTarefas();
}

function renderizarTarefas() {
    const listaDiv = document.getElementById('tarefasLista');
    listaDiv.innerHTML = '';
    
    if (tarefas.length === 0) {
        listaDiv.innerHTML = '<p style="text-align: center; color: var(--color-text-light);">Nenhuma tarefa adicionada ainda.</p>';
        return;
    }

    tarefas.forEach((tarefa, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'lista-item';
        itemDiv.innerHTML = `
            <div>
                <strong>${tarefa.titulo}</strong>
                <small>Prazo: ${tarefa.prazo || 'N/A'}</small>
                <small>Prioridade: ${tarefa.prioridade}</small>
                <small>Descrição: ${tarefa.descricao}</small>
            </div>
            <button class="btn" style="background: var(--color-danger) !important;" onclick="removerTarefa(${index})">Remover</button>
        `;
        
        const li = document.createElement('li');
        li.appendChild(itemDiv);
        listaDiv.appendChild(li);
    });
}

function salvarTarefas() {
    localStorage.setItem('tarefas', JSON.stringify(tarefas));
}

function carregarTarefasSalvas() {
    const tarefasSalvas = localStorage.getItem('tarefas');
    if (tarefasSalvas) {
        tarefas = JSON.parse(tarefasSalvas);
    }
}

function limparLista() {
    tarefas = [];
    salvarTarefas();
    renderizarTarefas();
    document.getElementById('resultado').innerHTML = '<h4><i class="fa-solid fa-clipboard-list"></i> Relatório</h4>';
    document.getElementById('agenda-eventos').innerHTML = '';
}

async function carregarAgenda() {
    try {
        const res = await fetch(`${API_BASE_URL}/agenda`);
        if (!res.ok) {
            throw new Error('Falha ao carregar a agenda');
        }
        const data = await res.json();
        renderizarAgenda(data.compromissos);
    } catch (error) {
        renderizarAgenda([]);
    }
}

function renderizarAgenda(compromissos) {
    const agendaDiv = document.getElementById('agenda-eventos');
    agendaDiv.innerHTML = '';

    if (compromissos.length === 0) {
        agendaDiv.innerHTML = '<ul><li>Nenhum compromisso fixo cadastrado.</li></ul>';
        return;
    }

    const ul = document.createElement('ul');
    compromissos.forEach(comp => {
        const li = document.createElement('li');
        const [titulo, tempo, local] = comp.split(' - ');
        li.innerHTML = `
            <strong>${titulo}</strong>
            <small><i class="fa-regular fa-clock"></i> ${tempo}</small>
            <small><i class="fa-solid fa-location-dot"></i> ${local}</small>
        `;
        ul.appendChild(li);
    });
    agendaDiv.appendChild(ul);
}

async function enviarTarefas() {
    const resultadoDiv = document.getElementById('resultado');
    const agendaCompromissos = [];
    document.querySelectorAll('#agenda-eventos li').forEach(li => {
        const titulo = li.querySelector('strong')?.textContent || '';
        const tempo = li.querySelector('.fa-clock')?.nextSibling?.textContent?.trim() || '';
        const local = li.querySelector('.fa-location-dot')?.nextSibling?.textContent?.trim() || '';
        if (titulo) {
            agendaCompromissos.push(`${titulo} - ${tempo} - ${local}`);
        }
    });

    resultadoDiv.innerHTML = `
        <h4><i class="fa-solid fa-spinner fa-spin-pulse"></i> Processando com IA...</h4>
    `;

    try {
        const res = await fetch(`${API_BASE_URL}/analisar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tarefas: tarefas,
                compromissos_fixos: agendaCompromissos
            })
        });

        if (!res.ok) {
            throw new Error(`Erro HTTP: ${res.status}`);
        }

        const data = await res.json();
        let analise = data.analise;
        
        if (typeof analise === 'string') {
            try {
                analise = JSON.parse(analise);
            } catch (jsonError) {
                analise = { 
                    error: "Erro ao analisar resposta da IA (JSON inválido).", 
                    detalhe: analise || "Resposta vazia." 
                };
            }
        }

        if (analise.error) {
            resultadoDiv.innerHTML = `
                <div class="resultado">
                    <h4><i class="fa-solid fa-triangle-exclamation" style="color: var(--color-danger);"></i> Erro na Análise</h4>
                    <pre style="white-space: pre-wrap; word-wrap: break-word;">${JSON.stringify(analise, null, 2)}</pre>
                    <small style="color: var(--color-danger);">Verifique sua chave de API do Gemini e o log do servidor Render.</small>
                </div>
            `;
        } else {
            renderizarRelatorio(analise);
        }

    } catch (error) {
        resultadoDiv.innerHTML = `
            <div class="resultado" style="border-left: 5px solid var(--color-danger);">
                <h4><i class="fa-solid fa-ban" style="color: var(--color-danger);"></i> Erro de Conexão</h4>
                <p>Não foi possível conectar ao servidor FastAPI (${API_BASE_URL}).</p>
                <p>Verifique se:</p>
                <ul>
                    <li>O servidor Python está rodando na Render.</li>
                    <li>O URL na variável API_BASE_URL (neste script) está correto.</li>
                    <li>Não há erros de CORS (seu Frontend precisa estar na lista 'origins' do Backend).</li>
                </ul>
                <small style="color: var(--color-danger);">Detalhe do erro: ${error.message}</small>
            </div>
        `;
    }
}

function renderizarRelatorio(analise) {
    const resultadoDiv = document.getElementById('resultado');
    const listaOrdenadaHTML = analise.lista_ordenada.map((item, index) => `
        <li value="${index + 1}">
            <strong>${item.titulo}</strong> (Prioridade: ${item.prioridade})
            <small>Motivo: ${item.motivo}</small>
        </li>
    `).join('');

    resultadoDiv.innerHTML = `
        <div class="resultado">
            <h4><i class="fa-solid fa-square-check" style="color: var(--color-success);"></i> Assistente de Produtividade: Análise do Dia</h4>

            <div style="margin-top: 1.5rem;">
                <h4><i class="fa-solid fa-list-check" style="color: var(--color-accent);"></i> Tarefa Para Fazer Primeiro</h4>
                <p style="padding-left: 12px; font-weight: 600; color: var(--color-primary);">${analise.primeira_tarefa}</p>
            </div>

            <div style="margin-top: 1.5rem;">
                <h4><i class="fa-solid fa-list-ol" style="color: var(--color-accent);"></i> Lista de Prioridades (Ordem Sugerida)</h4>
                <ol style="list-style: decimal; padding-left: 30px; margin-top: 0.5rem;">
                    ${listaOrdenadaHTML}
                </ol>
            </div>

            <div style="margin-top: 1.5rem;">
                <h4><i class="fa-solid fa-lightbulb" style="color: var(--color-accent);"></i> Insights e Recomendações</h4>
                <p style="font-weight: 500;">Motivo Geral da Ordem:</p>
                <p class="relatorio-resumo-container">${analise.motivo_ordem}</p>

                <p style="font-weight: 500; margin-top: 1rem;">Recomendações:</p>
                <p class="relatorio-resumo-container">${analise.recomendacoes}</p>

                <p style="font-weight: 500; margin-top: 1rem;">Sugestões de Produtividade:</p>
                <p class="relatorio-resumo-container">${analise.sugestoes}</p>
            </div>
        </div>
    `;
}