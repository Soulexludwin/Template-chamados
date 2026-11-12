let setorSalvo = localStorage.getItem("chamados_setor") || "";
let chamadosData = [];
let filtroAtual = "todos";

const modal = document.getElementById("modalForm");
const btnNovoChamado = document.getElementById("btnNovoChamado");
const btnFecharModal = document.getElementById("btnFecharModal");
const btnCancelar = document.getElementById("btnCancelar");
const formChamado = document.getElementById("formChamado");
const arquivoAnexo = document.getElementById("arquivoAnexo");
const previewAnexoForm = document.getElementById("previewAnexoForm");

if (setorSalvo) {
  carregarMeusChamados();
}

const toggleModal = (show) => {
  if (!modal) return;
  modal.classList.toggle("hidden", !show);
  modal.classList.toggle("flex", show);
  if (!show && previewAnexoForm) {
    previewAnexoForm.classList.add("hidden");
  }
};

if (btnNovoChamado) {
  btnNovoChamado.onclick = () => {
    toggleModal(true);
    const inputSetor = document.getElementById("solicitante");
    if (inputSetor && setorSalvo) {
      inputSetor.value = setorSalvo;
    }
  };
}
if (btnFecharModal) btnFecharModal.onclick = () => toggleModal(false);
if (btnCancelar) btnCancelar.onclick = () => toggleModal(false);

if (arquivoAnexo) {
  arquivoAnexo.onchange = () => {
    if (arquivoAnexo.files[0] && previewAnexoForm) {
      previewAnexoForm.textContent = `📎 Imagem selecionada: ${arquivoAnexo.files[0].name}`;
      previewAnexoForm.classList.remove("hidden");
    }
  };
}

// Permite colar print (Ctrl+V) direto no modal de abertura de chamado
if (modal) {
  modal.addEventListener("paste", (e) => {
    const items = e.clipboardData?.items;
    if (!items || !arquivoAnexo) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          const dt = new DataTransfer();
          dt.items.add(new File([file], `print-${Date.now()}.png`, { type: file.type }));
          arquivoAnexo.files = dt.files;
          if (previewAnexoForm) {
            previewAnexoForm.textContent = "📋 Print colado da área de transferência pronto para envio!";
            previewAnexoForm.classList.remove("hidden");
          }
        }
      }
    }
  });
}

async function carregarMeusChamados() {
  try {
    let url = "/chamados/meus";
    if (setorSalvo) {
      url += `?solicitante=${encodeURIComponent(setorSalvo)}`;
    }
    const res = await fetch(url);
    if (!res.ok) return;
    chamadosData = await res.json();
    atualizarContadores();
    renderizarChamados();
  } catch (err) {
    console.error("Erro ao carregar chamados:", err);
  }
}

function normalizarTexto(str) {
  if (!str) return "";
  return str.toString().trim().toLowerCase();
}

function atualizarContadores() {
  const totalAbertos = document.getElementById("totalAbertos");
  const totalEmAtendimento = document.getElementById("totalEmAtendimento");
  const totalConcluidos = document.getElementById("totalConcluidos");

  if (totalAbertos) {
    totalAbertos.innerText = chamadosData.filter(c => normalizarTexto(c.status) === "aberto").length;
  }
  if (totalEmAtendimento) {
    totalEmAtendimento.innerText = chamadosData.filter(c => normalizarTexto(c.status) === "em atendimento").length;
  }
  if (totalConcluidos) {
    totalConcluidos.innerText = chamadosData.filter(c => 
      normalizarTexto(c.status) === "concluído" || normalizarTexto(c.status) === "concluido"
    ).length;
  }
}

function formatarData(dataISO) {
  if (!dataISO) return "Data não informada";
  const data = new Date(dataISO);
  if (isNaN(data.getTime())) return dataISO;
  return data.toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
}

function renderizarChamados() {
  const container = document.getElementById("listaChamados");
  if (!container) return;

  const filtrados = chamadosData.filter(c => {
    if (filtroAtual === "todos") return true;
    return normalizarTexto(c.status) === normalizarTexto(filtroAtual);
  });

  if (filtrados.length === 0) {
    container.innerHTML = `
      <div class="bg-indigo-950/40 border border-indigo-900/50 p-8 text-center text-slate-400 rounded-xl">
        Nenhuma solicitação encontrada.
      </div>`;
    return;
  }

  const badgePrioridade = {
    "Alta": "bg-red-500/20 text-red-300 border-red-500/30",
    "Média": "bg-amber-500/20 text-amber-300 border-amber-500/30",
    "Baixa": "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  };

  const badgeStatus = {
    "Aberto": "bg-amber-500/30 text-amber-300 border-amber-500/40",
    "Em Atendimento": "bg-blue-500/30 text-blue-300 border-blue-500/40",
    "Concluído": "bg-emerald-500/30 text-emerald-300 border-emerald-500/40",
  };

  container.innerHTML = filtrados
    .slice()
    .reverse()
    .map(c => `
      <div class="bg-indigo-950/60 border border-indigo-900/60 p-5 rounded-xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div class="space-y-2 w-full">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full border ${badgePrioridade[c.prioridade] || 'bg-slate-700 text-slate-200'}">${c.prioridade}</span>
            <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full border ${badgeStatus[c.status] || 'bg-slate-700 text-slate-200'}">${c.status}</span>
            <span class="text-xs text-slate-400 font-mono">#${c.id}</span>
          </div>

          <h3 class="text-base font-bold text-slate-100">${c.titulo}</h3>
          <p class="text-sm text-slate-300">${c.descricao}</p>

          ${c.anexo ? `<div class="mt-2"><a href="${c.anexo}" target="_blank"><img src="${c.anexo}" alt="Anexo" class="max-h-32 rounded-lg border border-indigo-800 hover:opacity-90 transition"></a></div>` : ''}
          ${c.notasConclusao ? `<p class="text-xs text-emerald-400 bg-emerald-950/40 p-2 rounded border border-emerald-900/50"><strong>Notas de Conclusão:</strong> ${c.notasConclusao}</p>` : ''}

          <div class="flex items-center gap-6 text-xs text-slate-400 pt-2 border-t border-indigo-900/40">
            <span>📍 Setor: <strong class="text-slate-200">${c.solicitante}</strong></span>
            <span>📅 Solicitado em: <strong class="text-slate-200">${formatarData(c.criadoEm)}</strong></span>
          </div>
        </div>
        <div class="flex items-center gap-2 w-full md:w-auto justify-end shrink-0">
          <button onclick="abrirChat(${c.id})" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium shadow flex items-center gap-1 transition">
            💬 Chat / Anexos
          </button>
        </div>
      </div>
    `)
    .join("");
}

if (formChamado) {
  formChamado.onsubmit = async (e) => {
    e.preventDefault();

    const inputSolicitante = document.getElementById("solicitante").value.trim();
    localStorage.setItem("chamados_setor", inputSolicitante);
    setorSalvo = inputSolicitante;

    const formData = new FormData();
    formData.append("clientId", inputSolicitante);
    formData.append("solicitante", inputSolicitante);
    formData.append("titulo", document.getElementById("titulo").value.trim());
    formData.append("descricao", document.getElementById("descricao").value.trim());
    formData.append("prioridade", document.getElementById("prioridade").value);

    if (arquivoAnexo && arquivoAnexo.files[0]) {
      formData.append("anexo", arquivoAnexo.files[0]);
    }

    try {
      const res = await fetch("/chamados", {
        method: "POST",
        body: formData
      });

      if (res.ok) {
        formChamado.reset();
        toggleModal(false);
        carregarMeusChamados();
      } else {
        const erro = await res.text();
        alert(`Erro ao enviar o chamado: ${erro}`);
      }
    } catch (err) {
      console.error("Erro na requisição:", err);
      alert("Erro de conexão ao abrir chamado.");
    }
  };
}

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

// --- SISTEMA DE CHAT NO PORTAL DO USUÁRIO ---
const modalChat = document.getElementById("modalChat");
const btnFecharChat = document.getElementById("btnFecharChat");
const chatIdSpan = document.getElementById("chatIdSpan");
const chatChamadoId = document.getElementById("chatChamadoId");
const chatMensagensContainer = document.getElementById("chatMensagensContainer");
const formEnviarMensagem = document.getElementById("formEnviarMensagem");
const chatTextoInput = document.getElementById("chatTextoInput");
const chatAnexoInput = document.getElementById("chatAnexoInput");
const chatAnexoStatus = document.getElementById("chatAnexoStatus");

let chatIntervaloId = null;

if (btnFecharChat) {
  btnFecharChat.onclick = () => {
    modalChat.classList.add("hidden");
    modalChat.classList.remove("flex");
    if (chatIntervaloId) clearInterval(chatIntervaloId);
  };
}

if (chatAnexoInput) {
  chatAnexoInput.onchange = () => {
    if (chatAnexoInput.files[0] && chatAnexoStatus) {
      chatAnexoStatus.textContent = `📎 Anexo pronto: ${chatAnexoInput.files[0].name}`;
      chatAnexoStatus.classList.remove("hidden");
    }
  };
}

// Permite colar print (Ctrl+V) direto no chat do usuário
if (modalChat) {
  modalChat.addEventListener("paste", (e) => {
    const items = e.clipboardData?.items;
    if (!items || !chatAnexoInput) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          const dt = new DataTransfer();
          dt.items.add(new File([file], `print-chat-${Date.now()}.png`, { type: file.type }));
          chatAnexoInput.files = dt.files;
          if (chatAnexoStatus) {
            chatAnexoStatus.textContent = "📋 Print colado! Clique em Enviar.";
            chatAnexoStatus.classList.remove("hidden");
          }
        }
      }
    }
  });
}

async function abrirChat(chamadoId) {
  if (!modalChat) return;
  chatIdSpan.innerText = chamadoId;
  chatChamadoId.value = chamadoId;
  modalChat.classList.remove("hidden");
  modalChat.classList.add("flex");

  await carregarMensagensChat(chamadoId);

  if (chatIntervaloId) clearInterval(chatIntervaloId);
  chatIntervaloId = setInterval(() => carregarMensagensChat(chamadoId), 3000);
}

async function carregarMensagensChat(chamadoId) {
  try {
    const res = await fetch(`/chamados/${chamadoId}/mensagens`);
    if (!res.ok) return;
    const mensagens = await res.json();

    chatMensagensContainer.innerHTML = mensagens.length === 0 
      ? `<p class="text-center text-slate-500 text-xs py-4">Nenhuma mensagem ainda. Inicie a conversa com o técnico.</p>`
      : mensagens.map(m => {
          const ehTecnico = m.autor === "tecnico";
          const alinhamento = ehTecnico ? "justify-start" : "justify-end";
          const fundo = ehTecnico ? "bg-purple-950/80 border-purple-800 text-purple-200" : "bg-blue-950/80 border-blue-800 text-blue-200";
          
          return `
            <div class="flex ${alinhamento}">
              <div class="max-w-md p-3 rounded-xl border ${fundo} shadow-sm space-y-1">
                <p class="text-[10px] uppercase font-semibold tracking-wider opacity-75">${ehTecnico ? '🛠️ Técnico' : '👤 Usuário / Setor'}</p>
                ${m.texto ? `<p class="text-sm whitespace-pre-wrap">${m.texto}</p>` : ''}
                ${m.anexo ? `<a href="${m.anexo}" target="_blank"><img src="${m.anexo}" alt="Anexo Chat" class="max-h-40 rounded border border-indigo-700 mt-1"></a>` : ''}
                <span class="block text-[9px] text-right opacity-60">${new Date(m.criadoEm).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
            </div>
          `;
        }).join("");

    chatMensagensContainer.scrollTop = chatMensagensContainer.scrollHeight;
  } catch (err) {
    console.error("Erro ao carregar mensagens:", err);
  }
}

if (formEnviarMensagem) {
  formEnviarMensagem.onsubmit = async (e) => {
    e.preventDefault();
    const chamadoId = chatChamadoId.value;
    const texto = chatTextoInput.value.trim();
    const anexoFile = chatAnexoInput.files[0];

    if (!texto && !anexoFile) return;

    const formData = new FormData();
    formData.append("autor", "solicitante");
    if (texto) formData.append("texto", texto);
    if (anexoFile) formData.append("anexo", anexoFile);

    try {
      const res = await fetch(`/chamados/${chamadoId}/mensagens`, {
        method: "POST",
        body: formData
      });

      if (res.ok) {
        chatTextoInput.value = "";
        chatAnexoInput.value = "";
        if (chatAnexoStatus) chatAnexoStatus.classList.add("hidden");
        await carregarMensagensChat(chamadoId);
      } else {
        const erro = await res.text();
        alert(`Erro ao enviar mensagem: ${erro}`);
      }
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
    }
  };
}