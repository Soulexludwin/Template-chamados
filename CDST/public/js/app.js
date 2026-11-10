let chamadosData = [];
let filtroAtual = "todos";

// Identificador único da máquina no localStorage
let clientId = localStorage.getItem("chamados_client_id");
if (!clientId) {
  clientId = crypto.randomUUID();
  localStorage.setItem("chamados_client_id", clientId);
}

const modal = document.getElementById("modalForm");
const btnNovoChamado = document.getElementById("btnNovoChamado");
const btnFecharModal = document.getElementById("btnFecharModal");
const btnCancelar = document.getElementById("btnCancelar");
const formChamado = document.getElementById("formChamado");

const toggleModal = (show) => {
  modal.classList.toggle("hidden", !show);
  modal.classList.toggle("flex", show);
};

btnNovoChamado.addEventListener("click", () => toggleModal(true));
btnFecharModal.addEventListener("click", () => toggleModal(false));
btnCancelar.addEventListener("click", () => toggleModal(false));

async function carregarMeusChamados() {
  try {
    const res = await fetch(`/chamados/meus?clientId=${clientId}`);
    chamadosData = await res.json();
    atualizarContadores();
    renderizarChamados();
  } catch (err) {
    console.error("Erro ao carregar chamados:", err);
  }
}

function atualizarContadores() {
  document.getElementById("totalAbertos").innerText = chamadosData.filter(c => c.status === "Aberto").length;
  document.getElementById("totalEmAtendimento").innerText = chamadosData.filter(c => c.status === "Em Atendimento").length;
  document.getElementById("totalConcluidos").innerText = chamadosData.filter(c => c.status === "Concluído").length;
}

function formatarData(dataISO) {
  if (!dataISO) return "Data não informada";
  const data = new Date(dataISO);
  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function renderizarChamados() {
  const container = document.getElementById("listaChamados");
  const filtrados = chamadosData.filter(c => filtroAtual === "todos" || c.status === filtroAtual);

  if (filtrados.length === 0) {
    container.innerHTML = `
      <div class="bg-indigo-950/40 border border-indigo-900/50 p-8 text-center text-slate-400 rounded-xl">
        Nenhum chamado encontrado para esta máquina.
      </div>`;
    return;
  }

  const badgePrioridade = {
    Alta: "bg-red-500/20 text-red-300 border-red-500/30",
    Média: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    Baixa: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  };

  const badgeStatus = {
    Aberto: "bg-amber-500/30 text-amber-300 border-amber-500/40",
    "Em Atendimento": "bg-blue-500/30 text-blue-300 border-blue-500/40",
    Concluído: "bg-emerald-500/30 text-emerald-300 border-emerald-500/40",
  };

  container.innerHTML = filtrados
    .slice()
    .reverse()
    .map(c => `
      <div class="bg-indigo-950/60 border border-indigo-900/60 p-5 rounded-xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-indigo-700/60 transition">
        <div class="space-y-2 w-full">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full border ${badgePrioridade[c.prioridade]}">${c.prioridade}</span>
            <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full border ${badgeStatus[c.status]}">${c.status}</span>
            <span class="text-xs text-slate-400 font-mono">#${c.id}</span>
          </div>

          <h3 class="text-base font-bold text-slate-100">${c.titulo}</h3>
          <p class="text-sm text-slate-300">${c.descricao}</p>

          <div class="flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-indigo-900/40">
            <span>📍 Setor: <strong class="text-slate-200">${c.solicitante}</strong></span>
            <span>📅 Solicitado em: <strong class="text-slate-200">${formatarData(c.criadoEm)}</strong></span>
          </div>
        </div>
      </div>
    `)
    .join("");
}

formChamado.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    clientId,
    solicitante: document.getElementById("solicitante").value,
    titulo: document.getElementById("titulo").value,
    descricao: document.getElementById("descricao").value,
    prioridade: document.getElementById("prioridade").value,
  };

  await fetch("/chamados", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  formChamado.reset();
  toggleModal(false);
  carregarMeusChamados();
});

document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", (e) => {
    document.querySelectorAll(".filter-btn").forEach(b => {
      b.classList.remove("bg-blue-600", "text-white", "shadow");
      b.classList.add("bg-indigo-900/40", "text-slate-300");
    });
    e.target.classList.remove("bg-indigo-900/40", "text-slate-300");
    e.target.classList.add("bg-blue-600", "text-white", "shadow");

    filtroAtual = e.target.dataset.status;
    renderizarChamados();
  });
});

setInterval(carregarMeusChamados, 5000);
carregarMeusChamados();