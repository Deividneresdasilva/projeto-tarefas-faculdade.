const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = new Database('tarefas.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS tarefas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    descricao TEXT,
    status TEXT NOT NULL DEFAULT 'pendente',
    criado_em TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  )
`);

app.get('/api/tarefas', (req, res) => {
  const tarefas = db.prepare('SELECT * FROM tarefas ORDER BY id DESC').all();
  res.json(tarefas);
});

app.post('/api/tarefas', (req, res) => {
  const { titulo, descricao, status } = req.body;
  if (!titulo || titulo.trim() === '') {
    return res.status(400).json({ erro: 'O título é obrigatório.' });
  }
  const stmt = db.prepare('INSERT INTO tarefas (titulo, descricao, status) VALUES (?, ?, ?)');
  const resultado = stmt.run(titulo.trim(), descricao?.trim() || '', status || 'pendente');
  const novaTarefa = db.prepare('SELECT * FROM tarefas WHERE id=?').get(resultado.lastInsertRowid);
  res.status(201).json(novaTarefa);
});

app.put('/api/tarefas/:id', (req, res) => {
  const { id } = req.params;
  const { titulo, descricao, status } = req.body;
  if (!titulo || titulo.trim() === '') {
    return res.status(400).json({ erro: 'O título é obrigatório.' });
  }
  const stmt = db.prepare('UPDATE tarefas SET titulo=?, descricao=?, status=? WHERE id=?');
  const resultado = stmt.run(titulo.trim(), descricao?.trim() || '', status, id);
  if (resultado.changes === 0) {
    return res.status(404).json({ erro: 'Tarefa não encontrada.' });
  }
  const tarefaAtualizada = db.prepare('SELECT * FROM tarefas WHERE id=?').get(id);
  res.json(tarefaAtualizada);
});

app.delete('/api/tarefas/:id', (req, res) => {
  const { id } = req.params;
  const resultado = db.prepare('DELETE FROM tarefas WHERE id=?').run(id);
  if (resultado.changes === 0) {
    return res.status(404).json({ erro: 'Tarefa não encontrada.' });
  }
  res.json({ mensagem: 'Tarefa removida com sucesso.' });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

