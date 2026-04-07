let tarefas = [];
let idEmEdicao = null;
let filtroAtivo = 'todos';

document.addEventListener('DOMContentLoaded', () => {
  carregarTarefas();
});

async function carregarTarefas() {
  try {
    const resposta = await fetch('/api/tarefas');
    tarefas = await resposta.json();
    renderizarLista();
  } catch (erro) {
    console.error('Erro ao carregar tarefas:', erro);
    alert('Não foi possível conectar ao servidor.');
  }
}

function renderizarLista() {
  const lista = document.getElementById('listaTarefas');
  const vazio = document.getElementById('mensagemVazio');
  const contador = document.getElementById('contadorTarefas');

  const filtradas = filtroAtivo === 'todos' ? tarefas : tarefas.filter(t => t.status === filtroAtivo);

  contador.textContent = `${tarefas.length} ${tarefas.length === 1 ? 'tarefa' : 'tarefas'}`;

  if (filtradas.length === 0) {
    lista.innerHTML = '';
    vazio.style.display = 'block';
    return;
  }

  vazio.style.display = 'none';
  lista.innerHTML = filtradas.map(tarefa => criarCardTarefa(tarefa)).join('');
}

function criarCardTarefa(tarefa) {
  const statusClass = tarefa.status.replace(' ', '-').replace('í', 'i');
  const labels = {
    'pendente': 'Pendente',
    'em andamento': 'Em andamento',
    'concluída': 'Concluída'
  };
  const data = new Date(tarefa.criado_em).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
  const concluida = tarefa.status === 'concluída' ? 'concluida' : '';

  return `
    <div class="tarefa-item ${concluida}" id="tarefa-${tarefa.id}">
      <span class="status-dot ${statusClass}"></span>
      <div class="tarefa-conteudo">
        <p class="tarefa-titulo">${escaparHTML(tarefa.titulo)}</p>
        ${tarefa.descricao ? `<p class="tarefa-descricao">${escaparHTML(tarefa.descricao)}</p>` : ''}
        <div class="tarefa-meta">
          <span class="badge-status ${statusClass}">${labels[tarefa.status] || tarefa.status}</span>
          <span class="tarefa-data">${data}</span>
        </div>
      </div>
      <div class="tarefa-acoes">
        <button class="btn-icone" title="Editar" onclick="prepararEdicao(${tarefa.id})">✏️</button>
        <button class="btn-icone excluir" title="Excluir" onclick="abrirModal(${tarefa.id})">🗑️</button>
      </div>
    </div>
  `;
}

async function salvarTarefa() {
  const titulo = document.getElementById('titulo').value.trim();
  const descricao = document.getElementById('descricao').value.trim();
  const status = document.getElementById('status').value;

  if (!titulo) {
    alert('Por favor, informe o titulo da tarefa.');
    document.getElementById('titulo').focus();
    return;
  }

  const corpo = { titulo, descricao, status };

  try {
    if (idEmEdicao == null) {
      const resposta = await fetch('/api/tarefas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo)
      });
      const nova = await resposta.json();
      tarefas.unshift(nova);
    } else {
      const resposta = await fetch(`/api/tarefas/${idEmEdicao}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo)
      });
      const atualizada = await resposta.json();
      const indice = tarefas.findIndex(t => t.id === idEmEdicao);
      if (indice !== -1) tarefas[indice] = atualizada;
    }
    limparFormulario();
    renderizarLista();
  } catch (erro) {
    console.error('Erro ao salvar tarefa:', erro);
    alert('Erro ao salvar. Verifique o servidor.');
  }
}

function prepararEdicao(id) {
  const tarefa = tarefas.find(t => t.id === id);
  if (!tarefa) return;
  idEmEdicao = id;
  document.getElementById('titulo').value = tarefa.titulo;
  document.getElementById('descricao').value = tarefa.descricao || '';
  document.getElementById('status').value = tarefa.status;
  document.getElementById('formTitulo').textContent = 'Editar Tarefa';
  document.getElementById('btnSalvar').textContent = 'Salvar Alterações';
  document.getElementById('btnCancelar').style.display = 'inline-block';
}

function cancelarEdicao() {
  idEmEdicao = null;
  limparFormulario();
}

function limparFormulario() {
  document.getElementById('titulo').value = '';
  document.getElementById('descricao').value = '';
  document.getElementById('status').value = 'pendente';
  document.getElementById('formTitulo').textContent = 'Nova Tarefa';
  document.getElementById('btnSalvar').textContent = 'Adicionar Tarefa';
  document.getElementById('btnCancelar').style.display = 'none';
  idEmEdicao = null;
}

async function excluirTarefa(id) {
  try {
    await fetch(`/api/tarefas/${id}`, { method: 'DELETE' });
    tarefas = tarefas.filter(t => t.id !== id);
    renderizarLista();
  } catch (erro) {
    console.error('Erro ao excluir tarefa:', erro);
    alert('Erro ao excluir. Verifique o servidor.');
  }
}

function abrirModal(id) {
  document.getElementById('modalOverlay').style.display = 'flex';
  document.getElementById('btnConfirmarExcluir').onclick = () => {
    fecharModal();
    excluirTarefa(id);
  };
}

function fecharModal() {
  document.getElementById('modalOverlay').style.display = 'none';
}

function filtrar(botao) {
  document.querySelectorAll('.filtro').forEach(b => b.classList.remove('ativo'));
  botao.classList.add('ativo');
  filtroAtivo = botao.dataset.filtro;
  renderizarLista();
}

function escaparHTML(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}
