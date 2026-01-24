/*
  Sistema simples de notas escolares
  - JavaScript puro (sem dependências)
  - Código moderno e organizado para portfólio
*/

const aluno = {
  nome: "Ana Luiza Ribeiro",
  idade: 16,
  notas: [8.5, 7.2, 9.1],
  calcularMedia() {
    const soma = this.notas.reduce((acumulador, nota) => acumulador + nota, 0);
    return soma / this.notas.length;
  },
};

// Usa o spread operator para adicionar uma nova nota dinamicamente.
const novaNota = 8.7;
aluno.notas = [...aluno.notas, novaNota];

// Desestruturação para extrair dados principais.
const { nome, idade } = aluno;

function verificarSituacao(media) {
  if (media >= 7) {
    return "Aprovado! Excelente trabalho — continue assim.";
  }
  return "Reprovado. Não desista, você consegue melhorar.";
}

const mediaFinal = aluno.calcularMedia();
const mediaFormatada = mediaFinal.toFixed(2);
const situacaoMensagem = verificarSituacao(mediaFinal);
const situacaoStatus = mediaFinal >= 7 ? "Aprovado" : "Reprovado";

// Console: dados solicitados.
console.log(`Aluno: ${nome} (${idade} anos)`);
console.log("Notas do aluno:");
for (const [index, nota] of aluno.notas.entries()) {
  console.log(`Nota ${index + 1}: ${nota}`);
}
console.log(`Média final: ${mediaFormatada}`);
console.log(`Situação final do aluno: ${situacaoStatus}`);
console.log(situacaoMensagem);

// UI
const yearEl = document.querySelector("[data-year]");
const nameEl = document.querySelector("[data-name]");
const ageEl = document.querySelector("[data-age]");
const notesEl = document.querySelector("[data-notes]");
const averageEl = document.querySelector("[data-average]");
const statusEl = document.querySelector("[data-status]");
const messageEl = document.querySelector("[data-message]");

if (yearEl) {
  yearEl.textContent = `Atualizado ${new Date().getFullYear()}`;
}

if (nameEl) nameEl.textContent = nome;
if (ageEl) ageEl.textContent = `${idade} anos`;

if (notesEl) {
  notesEl.innerHTML = "";
  aluno.notas.forEach((nota, index) => {
    const item = document.createElement("li");
    item.innerHTML = `<span>Nota ${index + 1}</span><strong>${nota}</strong>`;
    notesEl.appendChild(item);
  });
}

if (averageEl) averageEl.textContent = mediaFormatada;
if (statusEl) {
  statusEl.textContent = situacaoStatus;
  statusEl.classList.add(
    situacaoStatus === "Aprovado" ? "status--approved" : "status--reproved"
  );
}

if (messageEl) messageEl.textContent = situacaoMensagem;
