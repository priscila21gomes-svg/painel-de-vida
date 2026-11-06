(() => {
  "use strict";

  const CFG = window.PHOTOBOOTH_CONFIG;
  const $ = (id) => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const liberarTodos = params.has("todos");
  const SEMANA = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  // ---------------------------------------------------------------- estado
  const st = {
    dia: null,
    moldura: null,       // { canvas, janela:{x,y,w,h}, W, H }
    stream: null,
    facing: "user",
    video: null,
    still: null,         // foto da galeria (modo ajuste)
    zoom: 1, panX: 0, panY: 0,
    timer: 3,
    ocupado: false,
    loop: null,
    resultadoURL: null,
    resultadoFile: null,
  };
  const cacheMolduras = new Map();

  // ---------------------------------------------------------------- datas
  const hojeISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const rotuloData = (iso) => {
    const [y, m, d] = iso.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return `${SEMANA[dt.getDay()]} ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`;
  };
  const statusDia = (dia) => {
    const hoje = hojeISO();
    if (!dia.moldura) return { ok: false, texto: "Moldura em breve" };
    if (dia.data === hoje) return { ok: true, hoje: true, texto: "Hoje! Tirar foto" };
    if (dia.data > hoje && CFG.bloquearDiasFuturos && !liberarTodos) {
      return { ok: false, texto: `Libera ${rotuloData(dia.data).split(" ")[1]}` };
    }
    return { ok: true, texto: "Tirar foto" };
  };

  // ---------------------------------------------------------------- tela inicial
  function montarInicio() {
    $("campanha").textContent = CFG.campanha;
    $("subtitulo").textContent = CFG.subtitulo;
    $("hashtag").textContent = CFG.hashtag;
    $("hashtag-2").textContent = CFG.hashtag;

    const grade = $("grade");
    grade.innerHTML = "";
    for (const dia of CFG.dias) {
      const s = statusDia(dia);
      const b = document.createElement("button");
      b.className = "card" + (s.hoje ? " hoje" : "") + (dia.destaque ? " destaque" : "") + (s.ok ? "" : " bloqueado");
      b.type = "button";
      b.innerHTML = `
        ${dia.destaque ? `<span class="card-fita"></span>` : ""}
        <span class="card-topo"><span class="card-dia">DIA ${dia.dia}</span><span class="card-data">${rotuloData(dia.data)}</span></span>
        <span class="card-corpo">
          <span class="card-icone"></span>
          <span class="card-nome"></span>
          <span class="card-desc"></span>
          <span class="card-status"></span>
        </span>`;
      if (dia.destaque) b.querySelector(".card-fita").textContent = dia.destaque;
      b.querySelector(".card-icone").textContent = dia.icone || "📷";
      b.querySelector(".card-nome").textContent = dia.nome;
      b.querySelector(".card-desc").textContent = dia.descricao || "";
      b.querySelector(".card-status").textContent = s.texto;
      b.addEventListener("click", () => {
        if (!s.ok) return;
        comLocal(() => { location.hash = `dia-${dia.dia}`; });
      });
      grade.appendChild(b);
    }
    atualizarChipLocal();
    montarAderencia();
  }

  // ---------------------------------------------------------------- estado / região
  let aposLocal = null;
  function atualizarChipLocal() {
    const l = Aderencia.localAtual();
    $("local-chip").hidden = !l;
    if (l) $("local-txt").textContent = `${l.nome} · ${l.regiao}`;
  }
  function comLocal(fn) {
    if (Aderencia.localAtual()) { fn(); return; }
    abrirModalLocal(fn);
  }
  function abrirModalLocal(fn) {
    aposLocal = fn || null;
    const sel = $("ml-estado");
    const l = Aderencia.localAtual();
    sel.value = l ? l.uf : "";
    mostrarRegiao();
    $("modal-local").hidden = false;
    sel.focus();
  }
  function mostrarRegiao() {
    const e = Aderencia.porUF[$("ml-estado").value];
    $("ml-regiao").textContent = e ? `Região: ${e.regiao}` : "Região: —";
    $("ml-ok").disabled = !e;
  }
  function montarSeletorEstados() {
    const sel = $("ml-estado");
    for (const r of Aderencia.REGIOES) {
      const g = document.createElement("optgroup");
      g.label = r;
      for (const e of Aderencia.ESTADOS.filter((x) => x.regiao === r).sort((a, b) => a.nome.localeCompare(b.nome))) {
        const o = document.createElement("option");
        o.value = e.uf; o.textContent = `${e.nome} (${e.uf})`;
        g.appendChild(o);
      }
      sel.appendChild(g);
    }
    sel.addEventListener("change", mostrarRegiao);
    $("ml-ok").addEventListener("click", () => {
      Aderencia.salvarLocal(sel.value);
      $("modal-local").hidden = true;
      atualizarChipLocal();
      const fn = aposLocal; aposLocal = null;
      if (fn) fn();
    });
    $("ml-cancelar").addEventListener("click", () => {
      $("modal-local").hidden = true;
      aposLocal = null;
      if (location.hash) location.hash = "";
    });
    $("local-chip").addEventListener("click", () => abrirModalLocal(null));
  }

  // ---------------------------------------------------------------- aderência
  const fmt = new Intl.NumberFormat("pt-BR");
  const fmtPct = new Intl.NumberFormat("pt-BR", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 });
  function lista(el, itens, total) {
    el.innerHTML = "";
    const max = Math.max(1, ...itens.map((i) => i.valor));
    itens.forEach((i, idx) => {
      const li = document.createElement("li");
      const pct = total ? fmtPct.format(i.valor / total) : "–";
      li.title = `${i.rotulo}: ${fmt.format(i.valor)} participações (${pct} do total)`;
      li.innerHTML = `<span class="ad-pos"></span><span class="ad-info"><span class="ad-linha"><span class="ad-nome"></span><span class="ad-valor"><b></b><span class="ad-pct"></span></span></span><span class="ad-sub"></span><span class="ad-trilho"><span class="ad-barra"></span></span></span>`;
      li.querySelector(".ad-pos").textContent = `${idx + 1}º`;
      li.querySelector(".ad-nome").textContent = i.rotulo;
      li.querySelector(".ad-valor b").textContent = fmt.format(i.valor);
      li.querySelector(".ad-pct").textContent = pct;
      const sub = li.querySelector(".ad-sub");
      if (i.sub) sub.textContent = i.sub; else sub.remove();
      li.querySelector(".ad-barra").style.width = `${(i.valor / max) * 100}%`;
      el.appendChild(li);
    });
  }
  function vazio(el, texto) {
    el.innerHTML = "";
    const li = document.createElement("li");
    li.className = "ad-vazio";
    li.textContent = texto;
    el.appendChild(li);
  }
  async function montarAderencia() {
    try {
      const { linhas, ficticio } = await Aderencia.carregar();
      const r = Aderencia.resumir(linhas, CFG.dias);
      $("ad-selo").hidden = !ficticio;
      $("ad-total").textContent = fmt.format(r.total);
      $("ad-estados").textContent = `${r.estadosAtivos}/27`;
      $("ad-campeao").textContent = r.total && r.dias[0] ? r.dias[0].rotulo : "–";
      $("ad-aviso").hidden = r.total > 0;
      lista($("ad-regioes"), r.regioes, r.total);
      if (r.estados.length) lista($("ad-top-estados"), r.estados, r.total);
      else vazio($("ad-top-estados"), "Os estados aparecem aqui assim que as primeiras fotos forem tiradas.");
      if (r.dias.length) lista($("ad-top-dias"), r.dias, r.total);
      else vazio($("ad-top-dias"), "Os dias aparecem aqui assim que as primeiras fotos forem tiradas.");
    } catch (e) {
      $("ad-total").textContent = "–";
    }
  }

  function mostrar(tela) {
    for (const id of ["tela-inicio", "tela-camera", "tela-resultado"]) $(id).hidden = id !== tela;
    window.scrollTo(0, 0);
  }

  // ---------------------------------------------------------------- moldura
  const carregarImagem = (src) => new Promise((ok, erro) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = () => erro(new Error("Falha ao carregar " + src));
    img.src = src;
  });

  // Flood fill a partir de (sx,sy) sobre pixels que satisfazem `pode`.
  function preencher(data, W, H, sx, sy, pode) {
    const marca = new Uint8Array(W * H);
    const pilha = new Int32Array(W * H);
    let topo = 0;
    const ini = sy * W + sx;
    if (!pode(ini * 4)) return null;
    pilha[topo++] = ini; marca[ini] = 1;
    let x0 = sx, x1 = sx, y0 = sy, y1 = sy, n = 0;
    while (topo) {
      const p = pilha[--topo];
      const x = p % W, y = (p - x) / W;
      n++;
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
      const viz = [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, y > 0 ? p - W : -1, y < H - 1 ? p + W : -1];
      for (const q of viz) {
        if (q >= 0 && !marca[q] && pode(q * 4)) { marca[q] = 1; pilha[topo++] = q; }
      }
    }
    return { marca, n, x0, x1, y0, y1 };
  }

  async function prepararMoldura(src) {
    if (cacheMolduras.has(src)) return cacheMolduras.get(src);
    const img = await carregarImagem(src);
    const W = img.naturalWidth, H = img.naturalHeight;
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const img2 = ctx.getImageData(0, 0, W, H);
    const d = img2.data;
    const cx = Math.round(W / 2), cy = Math.round(H * 0.45);

    // 1) Moldura com área transparente (o ideal).
    let r = preencher(d, W, H, cx, cy, (i) => d[i + 3] < 40);
    let janela = null;
    if (r && r.n > W * H * 0.03) {
      janela = { x: r.x0, y: r.y0, w: r.x1 - r.x0 + 1, h: r.y1 - r.y0 + 1 };
    } else {
      // 2) Moldura sem transparência: abre a área branca do centro.
      r = preencher(d, W, H, cx, cy, (i) => d[i] > 232 && d[i + 1] > 232 && d[i + 2] > 225 && d[i + 3] > 200);
      if (r && r.n > W * H * 0.03) {
        // Se houver legenda dentro do cartão branco, mantém a faixa dela branca.
        let corte = r.y1 + 1;
        const xa = Math.round(r.x0 + (r.x1 - r.x0) * 0.15), xb = Math.round(r.x0 + (r.x1 - r.x0) * 0.85);
        for (let y = cy; y <= r.y1 && corte === r.y1 + 1; y++) {
          for (let x = xa; x <= xb; x++) if (!r.marca[y * W + x]) { corte = Math.max(cy, y - 24); break; }
        }
        let y1 = 0;
        for (let p = 0; p < W * H; p++) {
          if (r.marca[p] && p < corte * W) { d[p * 4 + 3] = 0; y1 = Math.floor(p / W); }
        }
        ctx.putImageData(img2, 0, 0);
        janela = { x: r.x0, y: r.y0, w: r.x1 - r.x0 + 1, h: y1 - r.y0 + 1 };
      }
    }
    if (!janela) {
      // 3) Último recurso: foto ocupa a tela inteira e a moldura vai por cima.
      janela = { x: 0, y: 0, w: W, h: H };
    }
    const m = { canvas, janela, W, H };
    cacheMolduras.set(src, m);
    return m;
  }

  // ---------------------------------------------------------------- composição
  function desenhar(ctx, escala, fonte, espelhar) {
    const m = st.moldura;
    const W = m.W * escala, H = m.H * escala;
    const j = m.janela;
    ctx.save();
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, W, H);
    if (fonte) {
      const fw = fonte.videoWidth || fonte.naturalWidth || fonte.width;
      const fh = fonte.videoHeight || fonte.naturalHeight || fonte.height;
      if (fw && fh) {
        const jx = j.x * escala, jy = j.y * escala, jw = j.w * escala, jh = j.h * escala;
        const s = Math.max(jw / fw, jh / fh) * st.zoom;
        const dw = fw * s, dh = fh * s;
        const dx = jx + (jw - dw) / 2 + st.panX * escala;
        const dy = jy + (jh - dh) / 2 + st.panY * escala;
        ctx.beginPath(); ctx.rect(jx, jy, jw, jh); ctx.clip();
        if (espelhar) {
          ctx.translate(jx * 2 + jw, 0); ctx.scale(-1, 1);
          ctx.drawImage(fonte, jx * 2 + jw - dx - dw, dy, dw, dh);
        } else {
          ctx.drawImage(fonte, dx, dy, dw, dh);
        }
      }
    }
    ctx.restore();
    ctx.drawImage(m.canvas, 0, 0, W, H);
  }

  // Mantém a foto cobrindo toda a janela ao arrastar/zoom.
  function limitarPan() {
    const fonte = st.still;
    if (!fonte) { st.panX = st.panY = 0; return; }
    const j = st.moldura.janela;
    const s = Math.max(j.w / fonte.width, j.h / fonte.height) * st.zoom;
    const mx = Math.max(0, (fonte.width * s - j.w) / 2), my = Math.max(0, (fonte.height * s - j.h) / 2);
    st.panX = Math.min(mx, Math.max(-mx, st.panX));
    st.panY = Math.min(my, Math.max(-my, st.panY));
  }

  function iniciarLoop() {
    pararLoop();
    const cv = $("preview");
    const ctx = cv.getContext("2d");
    const passo = () => {
      if (st.moldura) {
        const escala = cv.width / st.moldura.W;
        if (st.still) desenhar(ctx, escala, st.still, false);
        else desenhar(ctx, escala, st.video && st.video.readyState >= 2 ? st.video : null, st.facing === "user");
      }
      st.loop = requestAnimationFrame(passo);
    };
    passo();
  }
  function pararLoop() { if (st.loop) cancelAnimationFrame(st.loop); st.loop = null; }

  // ---------------------------------------------------------------- câmera
  async function ligarCamera() {
    desligarCamera();
    $("aviso-camera").hidden = true;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      avisoCamera("Este navegador não libera a câmera. Use o botão Galeria ou abra o link no Safari/Chrome.");
      return;
    }
    try {
      st.stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: st.facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      if (!st.video) {
        st.video = document.createElement("video");
        st.video.setAttribute("playsinline", "");
        st.video.muted = true;
      }
      st.video.srcObject = st.stream;
      await st.video.play();
    } catch (e) {
      const negado = e && (e.name === "NotAllowedError" || e.name === "SecurityError");
      avisoCamera(negado
        ? "Você não permitiu o uso da câmera. Libere o acesso nas configurações do navegador ou use o botão Galeria."
        : "Não encontramos uma câmera disponível. Use o botão Galeria para escolher uma foto.");
    }
  }
  function desligarCamera() {
    if (st.stream) st.stream.getTracks().forEach((t) => t.stop());
    st.stream = null;
  }
  function marcarCamera() {
    for (const b of $("seletor-camera").querySelectorAll("button")) {
      b.classList.toggle("ativo", b.dataset.facing === st.facing);
    }
  }
  function avisoCamera(txt) {
    $("aviso-texto").textContent = txt;
    $("aviso-camera").hidden = false;
  }

  // ---------------------------------------------------------------- modos da tela de câmera
  function modoCamera() {
    st.still = null; st.zoom = 1; st.panX = st.panY = 0;
    $("zoom").value = 1;
    $("linha-zoom").hidden = true;
    $("usar-foto").hidden = true;
    $("dica-ajuste").hidden = true;
    $("disparar").hidden = false;
    $("timer").hidden = false;
    $("seletor-camera").hidden = false;
    marcarCamera();
  }
  function modoAjuste(img) {
    st.still = img; st.zoom = 1; st.panX = st.panY = 0;
    $("zoom").value = 1;
    desligarCamera();
    $("aviso-camera").hidden = true;
    $("linha-zoom").hidden = false;
    $("usar-foto").hidden = false;
    $("dica-ajuste").hidden = false;
    $("disparar").hidden = true;
    $("timer").hidden = true;
    $("seletor-camera").hidden = true;
  }

  async function abrirDia(n) {
    const dia = CFG.dias.find((d) => d.dia === n);
    if (!dia || !statusDia(dia).ok) { location.hash = ""; return; }
    st.dia = dia;
    $("titulo-dia").textContent = `Dia ${dia.dia} · ${dia.nome}`;
    mostrar("tela-camera");
    modoCamera();
    st.moldura = null;
    const cv = $("preview");
    const ctx = cv.getContext("2d");
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.fillStyle = "#fff"; ctx.font = "600 28px Fredoka, sans-serif"; ctx.textAlign = "center";
    ctx.fillText("Carregando moldura…", cv.width / 2, cv.height / 2);
    try {
      const m = await prepararMoldura(dia.moldura);
      if (st.dia !== dia) return;
      st.moldura = m;
      // Prévia em meia resolução (mais leve no celular).
      cv.width = Math.round(m.W / 2); cv.height = Math.round(m.H / 2);
      cv.style.aspectRatio = `${m.W} / ${m.H}`;
    } catch (e) {
      avisoCamera("Não foi possível carregar a moldura deste dia. Tente novamente mais tarde.");
      return;
    }
    iniciarLoop();
    ligarCamera();
  }

  function sairCamera() {
    desligarCamera();
    pararLoop();
  }

  // ---------------------------------------------------------------- captura
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

  async function disparar() {
    if (st.ocupado || !st.moldura) return;
    if (!st.video || !st.stream || st.video.readyState < 2) return;
    st.ocupado = true;
    $("disparar").disabled = true;
    const c = $("contagem");
    for (let i = st.timer; i > 0; i--) {
      c.textContent = i; c.hidden = false;
      await esperar(1000);
    }
    c.hidden = true;
    const f = $("flash");
    f.classList.add("on");
    requestAnimationFrame(() => requestAnimationFrame(() => f.classList.remove("on")));
    await gerarResultado(st.video, st.facing === "user");
    $("disparar").disabled = false;
    st.ocupado = false;
  }

  async function gerarResultado(fonte, espelhar) {
    const m = st.moldura;
    const cv = document.createElement("canvas");
    cv.width = m.W; cv.height = m.H;
    desenhar(cv.getContext("2d"), 1, fonte, espelhar);
    const blob = await new Promise((r) => cv.toBlob(r, "image/jpeg", 0.92));
    if (!blob) return;
    if (st.resultadoURL) URL.revokeObjectURL(st.resultadoURL);
    const nome = `${slug(CFG.campanha)}-dia-${st.dia.dia}-${Date.now().toString(36)}.jpg`;
    st.resultadoFile = new File([blob], nome, { type: "image/jpeg" });
    st.resultadoURL = URL.createObjectURL(blob);
    sairCamera();
    $("foto-final").src = st.resultadoURL;
    const baixar = $("baixar");
    baixar.href = st.resultadoURL;
    baixar.download = nome;
    const podeCompartilhar = !!(navigator.canShare && navigator.canShare({ files: [st.resultadoFile] }));
    $("compartilhar").hidden = !podeCompartilhar;
    baixar.className = "btn " + (podeCompartilhar ? "btn-claro" : "btn-amarelo");
    $("dica-salvar").hidden = false;
    const local = Aderencia.localAtual();
    if (local) Aderencia.registrar(st.dia.dia, local.uf);
    prepararAlbum();
    mostrar("tela-resultado");
  }

  // ---------------------------------------------------------------- álbum (Google Drive)
  const urlDrive = () => (CFG.drive && CFG.drive.urlScript) || "";
  function prepararAlbum() {
    $("album").hidden = !urlDrive();
    $("album").className = "album";
    $("album-enviar").hidden = true;
    $("album-enviar").disabled = false;
    $("album-status").textContent = "";
    st.albumEnviado = false;
    // A foto sobe sozinha para o álbum assim que fica pronta.
    if (urlDrive()) enviarAlbum();
  }
  const paraBase64 = (blob) => new Promise((ok, erro) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result).split(",")[1]);
    r.onerror = erro;
    r.readAsDataURL(blob);
  });
  // Pergunta ao script por <script> (JSONP): o navegador não bloqueia, mesmo sem CORS.
  function perguntarScript(params, tempoMax = 8000) {
    return new Promise((ok, erro) => {
      const cb = "pbcb_" + Math.random().toString(36).slice(2);
      const tag = document.createElement("script");
      const limpar = () => { clearTimeout(timer); delete window[cb]; tag.remove(); };
      const timer = setTimeout(() => { limpar(); erro(new Error("sem resposta")); }, tempoMax);
      window[cb] = (dados) => { limpar(); ok(dados); };
      tag.onerror = () => { limpar(); erro(new Error("script não carregou")); };
      // Carregou mas não chamou a função de retorno: é o script antigo (responde JSON puro).
      tag.onload = () => setTimeout(() => { if (window[cb]) { limpar(); erro(new Error("versao-antiga")); } }, 50);
      tag.src = `${urlDrive()}?${new URLSearchParams({ ...params, callback: cb, _: Date.now() })}`;
      document.head.appendChild(tag);
    });
  }
  const novoId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`);

  async function enviarAlbum() {
    if (!st.resultadoFile || st.albumEnviado) return;
    const local = Aderencia.localAtual();
    const botao = $("album-enviar");
    const status = $("album-status");
    const foto = st.resultadoFile; // se a pessoa tirar outra no meio do envio, não mistura
    botao.hidden = true;
    botao.disabled = true;
    $("album").className = "album enviando";
    status.textContent = "⏳ Enviando sua foto para o álbum da campanha…";
    const id = novoId();
    try {
      // 1) Envia sem ler a resposta (modo no-cors): o navegador não bloqueia esse envio.
      await fetch(urlDrive(), {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({
          id,
          dia: st.dia.dia,
          uf: local ? local.uf : "",
          autorizado: true,
          imagem: await paraBase64(foto),
        }),
      });
      // 2) Confirma com o script se a foto foi salva no Drive.
      status.textContent = "⏳ Confirmando o envio…";
      let r = null;
      for (const pausa of [500, 1000, 1500, 2500, 4000]) {
        await esperar(pausa);
        let falha = null;
        r = await perguntarScript({ acao: "status", id }).catch((e) => { falha = e; return null; });
        if (falha && falha.message === "versao-antiga") {
          throw new Error("O álbum precisa ser atualizado (versão nova do script no Google).");
        }
        if (r && r.status !== "aguardando") break;
      }
      if (!r) throw new Error("O álbum não respondeu. Confira a internet e tente de novo.");
      if (r.status === "erro") throw new Error("O álbum recusou a foto (" + (r.erro || "erro") + ").");
      if (r.status !== "salva") throw new Error("Não conseguimos confirmar o envio. Tente de novo.");
      if (foto !== st.resultadoFile) return;
      st.albumEnviado = true;
      $("album").className = "album enviado";
      status.textContent = "✅ Sua foto foi para o álbum da campanha! Valeu por participar 🧡";
    } catch (e) {
      if (foto !== st.resultadoFile) return;
      $("album").className = "album falhou";
      botao.hidden = false;
      botao.disabled = false;
      botao.textContent = "📤 Tentar enviar de novo";
      status.textContent = "⚠️ A foto não foi para o álbum: " + ((e && e.message && !/fetch/i.test(e.message)) ? e.message : "confira a internet e tente de novo.");
    }
  }

  const slug = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  // No iPhone o download vai para o app Arquivos; pelo menu do celular dá para escolher
  // "Salvar imagem" e a foto vai direto para a galeria de Fotos.
  async function salvarNoCelular(e) {
    if (!st.resultadoFile) return;
    const podeMenu = !!(navigator.canShare && navigator.canShare({ files: [st.resultadoFile] }));
    if (!(isIOS && podeMenu)) return; // Android/computador: segue o download normal do link
    e.preventDefault();
    try {
      await navigator.share({ files: [st.resultadoFile] });
    } catch (erro) {
      if (erro && erro.name === "AbortError") return; // a pessoa fechou o menu
      window.open(st.resultadoURL, "_blank"); // último recurso: abre a foto para tocar e segurar
    }
  }

  async function compartilhar() {
    if (!st.resultadoFile) return;
    try {
      await navigator.share({
        files: [st.resultadoFile],
        title: `${CFG.campanha} · Dia ${st.dia.dia}`,
        text: `${st.dia.nome} ${CFG.hashtag}`,
      });
    } catch (e) {
      // Usuário cancelou o compartilhamento: nada a fazer.
    }
  }

  // ---------------------------------------------------------------- galeria + ajuste
  function lerGaleria(file) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      // Reduz fotos enormes para não travar o celular.
      const max = 2400;
      const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement("canvas");
      c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      modoAjuste(c);
    };
    img.onerror = () => { URL.revokeObjectURL(url); alert("Não foi possível abrir essa imagem."); };
    img.src = url;
  }

  function configurarArraste() {
    const cv = $("preview");
    const ponteiros = new Map();
    let distIni = 0, zoomIni = 1;
    const fator = () => st.moldura ? st.moldura.W / cv.clientWidth : 1;
    cv.addEventListener("pointerdown", (e) => {
      if (!st.still) return;
      cv.setPointerCapture(e.pointerId);
      ponteiros.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ponteiros.size === 2) {
        const [a, b] = [...ponteiros.values()];
        distIni = Math.hypot(a.x - b.x, a.y - b.y); zoomIni = st.zoom;
      }
      $("dica-ajuste").hidden = true;
    });
    cv.addEventListener("pointermove", (e) => {
      if (!st.still || !ponteiros.has(e.pointerId)) return;
      const ant = ponteiros.get(e.pointerId);
      const atual = { x: e.clientX, y: e.clientY };
      ponteiros.set(e.pointerId, atual);
      if (ponteiros.size === 1) {
        st.panX += (atual.x - ant.x) * fator();
        st.panY += (atual.y - ant.y) * fator();
      } else if (ponteiros.size === 2 && distIni) {
        const [a, b] = [...ponteiros.values()];
        st.zoom = Math.min(3, Math.max(1, zoomIni * Math.hypot(a.x - b.x, a.y - b.y) / distIni));
        $("zoom").value = st.zoom;
      }
      limitarPan();
    });
    const soltar = (e) => { ponteiros.delete(e.pointerId); if (ponteiros.size < 2) distIni = 0; };
    cv.addEventListener("pointerup", soltar);
    cv.addEventListener("pointercancel", soltar);
    cv.addEventListener("wheel", (e) => {
      if (!st.still) return;
      e.preventDefault();
      st.zoom = Math.min(3, Math.max(1, st.zoom * (e.deltaY < 0 ? 1.06 : 0.94)));
      $("zoom").value = st.zoom;
      limitarPan();
    }, { passive: false });
    $("zoom").addEventListener("input", (e) => { st.zoom = Number(e.target.value); limitarPan(); });
  }

  // ---------------------------------------------------------------- rotas
  function rota() {
    const m = location.hash.match(/^#dia-(\d+)$/);
    if (m) {
      if (!Aderencia.localAtual()) { montarInicio(); mostrar("tela-inicio"); abrirModalLocal(rota); return; }
      abrirDia(Number(m[1])); return;
    }
    sairCamera();
    st.dia = null;
    montarInicio();
    mostrar("tela-inicio");
  }

  function voltarParaCamera() {
    if (!st.dia) { location.hash = ""; return; }
    mostrar("tela-camera");
    modoCamera();
    iniciarLoop();
    ligarCamera();
  }

  // ---------------------------------------------------------------- eventos
  function iniciar() {
    if (/Instagram|FBAN|FBAV|FB_IAB|Line\/|TikTok|musical_ly|LinkedInApp/i.test(navigator.userAgent)) {
      $("inapp").hidden = false;
    }
    $("voltar").addEventListener("click", () => { location.hash = ""; });
    for (const b of $("seletor-camera").querySelectorAll("button")) {
      b.addEventListener("click", () => {
        if (st.facing === b.dataset.facing && st.stream) return;
        st.facing = b.dataset.facing;
        marcarCamera();
        ligarCamera();
      });
    }
    $("tentar-camera").addEventListener("click", ligarCamera);
    $("disparar").addEventListener("click", disparar);
    const tempos = [0, 3, 5, 10];
    $("timer").addEventListener("click", () => {
      st.timer = tempos[(tempos.indexOf(st.timer) + 1) % tempos.length];
      $("timer-txt").textContent = st.timer ? `${st.timer}s` : "Sem";
    });
    $("galeria").addEventListener("change", (e) => { lerGaleria(e.target.files[0]); e.target.value = ""; });
    $("usar-foto").addEventListener("click", () => { if (st.still) gerarResultado(st.still, false); });
    $("compartilhar").addEventListener("click", compartilhar);
    $("baixar").addEventListener("click", salvarNoCelular);
    $("album-enviar").addEventListener("click", enviarAlbum);
    $("refazer").addEventListener("click", voltarParaCamera);
    $("refazer-topo").addEventListener("click", voltarParaCamera);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) desligarCamera();
      else if (!$("tela-camera").hidden && !st.still && st.moldura) ligarCamera();
    });
    configurarArraste();
    montarSeletorEstados();
    // Atualiza os números da página inicial a cada minuto enquanto ela estiver aberta.
    setInterval(() => { if (!$("tela-inicio").hidden && !document.hidden) montarAderencia(); }, 60000);
    window.addEventListener("hashchange", rota);
    rota();
  }

  iniciar();
})();
