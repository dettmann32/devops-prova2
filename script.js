/* =========================================================
   DevOps · Resumo Prova 2 — interações
   ========================================================= */
(() => {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ---------------- armazenamento seguro ---------------- */
  const storage = {
    get(key) {
      try { return localStorage.getItem(key); } catch (_) { return null; }
    },
    set(key, value) {
      try { localStorage.setItem(key, value); } catch (_) { /* modo privado */ }
    }
  };

  /* ---------------- tema claro/escuro ---------------- */
  const root = document.documentElement;
  const themeBtn = $("#themeToggle");
  const savedTheme = storage.get("devops2:theme");
  if (savedTheme === "light" || savedTheme === "dark") {
    root.setAttribute("data-theme", savedTheme);
  }
  const syncThemeLabel = () => {
    const dark = root.getAttribute("data-theme") !== "light";
    themeBtn?.setAttribute("aria-label", dark ? "Ativar tema claro" : "Ativar tema escuro");
    const meta = $("#metaTheme");
    if (meta) meta.setAttribute("content", dark ? "#060a13" : "#f4f7fc");
  };
  syncThemeLabel();
  themeBtn?.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    root.setAttribute("data-theme", next);
    storage.set("devops2:theme", next);
    syncThemeLabel();
  });

  /* ---------------- barra de leitura ---------------- */
  const readbar = $("#readbar");
  const toTop = $("#toTop");
  const onScroll = () => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    const pct = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    if (readbar) readbar.style.transform = `scaleX(${pct})`;
    if (toTop) toTop.classList.toggle("is-visible", window.scrollY > 700);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  toTop?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  /* ---------------- scrollspy ---------------- */
  const navLinks = $$(".toc a, .mobile-nav a");
  const sections = $$("main section[id]");
  const linkFor = (id) => navLinks.filter((a) => a.getAttribute("href") === "#" + id);

  if ("IntersectionObserver" in window && sections.length) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.id;
          navLinks.forEach((a) => a.classList.remove("is-active"));
          linkFor(id).forEach((a) => a.classList.add("is-active"));
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach((s) => spy.observe(s));
    if (!navLinks.some((a) => a.classList.contains("is-active"))) {
      linkFor("overview").forEach((a) => a.classList.add("is-active"));
    }
    window.addEventListener("scroll", () => {
      if (window.scrollY < 120) {
        navLinks.forEach((a) => a.classList.remove("is-active"));
        linkFor("overview").forEach((a) => a.classList.add("is-active"));
      }
    }, { passive: true });
  }

  /* ---------------- revelar seções ao rolar ---------------- */
  const revealables = sections.filter((s) => s.getBoundingClientRect().top > window.innerHeight * 0.92);
  if ("IntersectionObserver" in window && revealables.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );
    revealables.forEach((s) => {
      s.classList.add("reveal");
      io.observe(s);
    });
  }

  /* ---------------- progresso de estudo ---------------- */
  const studyButtons = $$(".study-btn");
  const progressFill = $("#progressFill");
  const progressCount = $("#progressCount");
  const progressMsg = $("#progressMsg");
  const STORE = "devops2:studied";

  let studied = new Set();
  try {
    const raw = JSON.parse(storage.get(STORE) || "[]");
    if (Array.isArray(raw)) studied = new Set(raw);
  } catch (_) { /* ignora */ }

  const total = studyButtons.length;

  function renderProgress() {
    const done = studyButtons.filter((b) => studied.has(b.dataset.study)).length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    studyButtons.forEach((btn) => {
      const on = studied.has(btn.dataset.study);
      btn.setAttribute("aria-pressed", String(on));
      const label = btn.querySelector(".study-label");
      if (label) label.textContent = on ? "Estudado" : "Marcar estudado";
      btn.closest(".section")?.classList.toggle("is-studied", on);
    });
    if (progressFill) progressFill.style.width = pct + "%";
    if (progressCount) progressCount.textContent = done + "/" + total;
    if (progressMsg) {
      progressMsg.textContent =
        done === 0
          ? "Marque os tópicos conforme for revisando. Seu progresso fica salvo neste navegador."
          : done === total
          ? "Tudo revisado! Agora encare o quiz final. 🚀"
          : `Faltam ${total - done} tópico${total - done > 1 ? "s" : ""} para fechar a revisão.`;
    }
  }

  studyButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.study;
      if (studied.has(id)) studied.delete(id);
      else studied.add(id);
      storage.set(STORE, JSON.stringify([...studied]));
      renderProgress();
    });
  });
  renderProgress();

  /* ---------------- copiar código ---------------- */
  $$(".copy-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const code = btn.closest(".code")?.querySelector("pre code");
      if (!code) return;
      const text = code.innerText;
      try {
        await navigator.clipboard.writeText(text);
      } catch (_) {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); } catch (__) { /* ignora */ }
        ta.remove();
      }
      const old = btn.textContent;
      btn.textContent = "Copiado!";
      btn.classList.add("is-copied");
      setTimeout(() => {
        btn.textContent = old;
        btn.classList.remove("is-copied");
      }, 1600);
    });
  });

  /* ---------------- quiz ---------------- */
  const QUIZ = [
    {
      q: "O que caracteriza a Integração Contínua (CI)?",
      options: [
        "Integrar alterações com frequência e validar automaticamente build e testes a cada mudança",
        "Publicar automaticamente toda alteração em produção, sem aprovação",
        "Manter uma versão pronta para produção, mas com deploy manual",
        "Executar o deploy apenas uma vez por mês"
      ],
      answer: 0,
      why: "CI é integrar cedo e sempre, disparando build, testes e verificações a cada push para descobrir problemas o quanto antes."
    },
    {
      q: "Qual é a diferença entre Continuous Delivery e Continuous Deployment?",
      options: [
        "Delivery não usa testes; Deployment usa",
        "Delivery deixa a versão pronta e pode exigir aprovação; Deployment publica automaticamente após as validações",
        "Delivery é para containers; Deployment é para máquinas virtuais",
        "São exatamente a mesma coisa, só mudam o nome"
      ],
      answer: 1,
      why: "No Delivery existe uma decisão/aprovação antes de produção. No Deployment, passou nos critérios automatizados, vai para produção sozinho."
    },
    {
      q: "Onde ficam os workflows do GitHub Actions?",
      options: [".github/workflows/*.yml", ".gitlab-ci.yml na raiz", "package.json", "/etc/actions.conf"],
      answer: 0,
      why: "Cada arquivo YAML em .github/workflows/ define um workflow do GitHub Actions. No GitLab, o equivalente é o .gitlab-ci.yml."
    },
    {
      q: "No pipeline, quem executa efetivamente os comandos de um job?",
      options: ["O evento", "O YAML", "O runner", "O Registry"],
      answer: 2,
      why: "O YAML descreve o que fazer; o runner é a máquina/ambiente que executa. No GitLab ele é o GitLab Runner; no GitHub, o hosted ou self-hosted runner."
    },
    {
      q: "Em YAML, o que define a hierarquia das chaves?",
      options: ["O uso de TAB", "A indentação com espaços", "As vírgulas", "O ponto e vírgula no fim da linha"],
      answer: 1,
      why: "YAML usa espaços para indicar níveis. TAB costuma quebrar o arquivo — um erro de indentação pode derrubar o pipeline inteiro."
    },
    {
      q: "Qual arquivo define o pipeline no GitLab CI/CD?",
      options: [".github/workflows/ci.yml", "Dockerfile", ".gitlab-ci.yml", "docker-compose.yml"],
      answer: 2,
      why: "O GitLab CI usa normalmente um .gitlab-ci.yml na raiz do projeto, com stages e jobs."
    },
    {
      q: "Qual é a ordem correta de um pipeline com Docker?",
      options: [
        "Deploy → Docker build → Test → Push",
        "Push → Test → Build → Docker build → Registry → Deploy",
        "Docker build → Push → Test → Build → Deploy",
        "Test → Deploy → Build → Docker build"
      ],
      answer: 1,
      why: "O código entra por push, é testado e compilado; só então a imagem é construída, publicada no Registry e implantada. Se o teste falhar, o pipeline para antes de gerar a imagem."
    },
    {
      q: "Qual comando cria uma imagem a partir do Dockerfile?",
      options: ["docker run", "docker build", "docker pull", "docker push"],
      answer: 1,
      why: "docker build cria a imagem. docker run cria e inicia um container a partir de uma imagem existente."
    },
    {
      q: "Por que o Registry é importante para rollback?",
      options: [
        "Porque guarda versões antigas de imagens identificadas por tag, permitindo voltar a uma versão conhecida",
        "Porque executa os testes automaticamente",
        "Porque substitui o Git",
        "Porque compacta o código-fonte"
      ],
      answer: 0,
      why: "Com imagens versionadas (app:v1.1.0, app:v1.2.0) no Registry, o rollback é só puxar e subir a versão anterior."
    },
    {
      q: "No versionamento semântico, uma correção de bug compatível gera qual mudança?",
      options: ["MAJOR (2.0.0)", "MINOR (1.3.0)", "PATCH (1.2.4)", "Nenhuma, a versão não muda"],
      answer: 2,
      why: "PATCH é para correções compatíveis: 1.2.3 → 1.2.4. MINOR adiciona funcionalidade compatível; MAJOR quebra compatibilidade."
    },
    {
      q: "Produção está na v1.2.0 com erro. Qual sequência descreve o rollback com Docker?",
      options: [
        "docker build da v1.2.0 e deploy",
        "Puxar a imagem v1.1.0, parar/remover a atual e subir o container com a versão anterior",
        "Apagar o Registry e reconstruir tudo",
        "Alterar a tag da v1.2.0 para latest"
      ],
      answer: 1,
      why: "Rollback = voltar a uma versão anterior conhecida e funcional: pull da imagem v1.1.0, parar a atual e subir a anterior."
    },
    {
      q: "Qual estratégia mantém duas versões (atual e nova) e troca o tráfego entre elas?",
      options: ["Recreate", "Canary", "Blue/Green", "Rollback"],
      answer: 2,
      why: "Blue/Green mantém BLUE (atual) e GREEN (nova), testa a GREEN e troca o tráfego; se der problema, volta para a BLUE."
    },
    {
      q: "No IaaS, qual é a responsabilidade típica do cliente?",
      options: [
        "Apenas usar o software pronto",
        "Administrar o sistema operacional e o que está acima dele (runtime, aplicação)",
        "Administrar somente o hardware do datacenter",
        "Nenhuma: o provedor administra tudo"
      ],
      answer: 1,
      why: "No IaaS o provedor entrega a infraestrutura virtualizada (VM, disco, rede); o cliente administra o SO e as camadas acima. É o modelo de maior controle e maior responsabilidade."
    },
    {
      q: "O que é uma Availability Zone (AZ)?",
      options: [
        "Uma área geográfica ampla que contém várias regiões",
        "Uma unidade de infraestrutura isolada dentro de uma região, usada para aumentar resiliência",
        "Um tipo de banco de dados gerenciado",
        "Um plano de cobrança por uso"
      ],
      answer: 1,
      why: "A região é a área geográfica; as AZs são unidades isoladas dentro dela. Distribuir componentes entre AZs reduz o impacto de falhas isoladas."
    },
    {
      q: "Qual comando do Terraform mostra a prévia das alterações comparando código e state?",
      options: ["terraform init", "terraform plan", "terraform apply", "terraform destroy"],
      answer: 1,
      why: "plan compara o código HCL com o state e mostra o que seria criado, alterado ou destruído. apply executa; init baixa providers; destroy remove tudo."
    },
    {
      q: "Qual é a função do Terraform State (.tfstate)?",
      options: [
        "Guardar os arquivos .tf versionados no Git",
        "Mapear o código aos recursos reais, detectar drift e evitar execuções concorrentes",
        "Executar os containers da aplicação",
        "Substituir o Dockerfile"
      ],
      answer: 1,
      why: "O state é a fonte única da verdade: liga o HCL aos recursos provisionados, detecta mudanças manuais (drift), melhora performance e permite locking."
    },
    {
      q: "No Prometheus, como funciona o modelo de coleta?",
      options: [
        "A aplicação envia métricas continuamente (push) para o servidor",
        "O servidor faz requisições HTTP periódicas nos targets (pull/scraping)",
        "O Grafana coleta direto do banco da aplicação",
        "As métricas são gravadas apenas em arquivos de log"
      ],
      answer: 1,
      why: "Prometheus usa pull/scraping: ele busca periodicamente /metrics dos targets. Se o scrape falha, já é um sinal de que a instância caiu."
    },
    {
      q: "Quais são os três pilares da observabilidade?",
      options: [
        "Logs, métricas e tracing",
        "CI, CD e deploy",
        "IaaS, PaaS e SaaS",
        "Counter, Gauge e Histogram"
      ],
      answer: 0,
      why: "Logs explicam eventos, métricas mostram números/tendências e tracing acompanha o caminho da requisição entre serviços."
    }
  ];

  const quizEl = $("#quizList");
  const scoreEl = $("#quizScore");
  const resultEl = $("#quizResult");
  const resetBtn = $("#quizReset");
  let answers = [];

  function buildQuestion(item, index) {
    const wrap = document.createElement("div");
    wrap.className = "quiz__q";
    wrap.dataset.index = index;

    const title = document.createElement("p");
    title.className = "quiz__title";
    const num = document.createElement("span");
    num.textContent = String(index + 1).padStart(2, "0");
    const qtext = document.createElement("span");
    qtext.textContent = item.q;
    title.append(num, qtext);
    wrap.appendChild(title);

    const opts = document.createElement("div");
    opts.className = "quiz__options";
    const letters = ["A", "B", "C", "D"];

    item.options.forEach((text, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quiz__opt";
      btn.dataset.choice = i;
      const letter = document.createElement("span");
      letter.className = "letter";
      letter.textContent = letters[i];
      const label = document.createElement("span");
      label.textContent = text;
      btn.append(letter, label);
      btn.addEventListener("click", () => answerQuestion(wrap, index, i));
      opts.appendChild(btn);
    });

    const explain = document.createElement("div");
    explain.className = "quiz__explain";
    explain.setAttribute("aria-live", "polite");
    wrap.append(opts, explain);
    return wrap;
  }

  function renderQuiz() {
    if (!quizEl) return;
    quizEl.textContent = "";
    answers = new Array(QUIZ.length).fill(null);
    QUIZ.forEach((item, i) => quizEl.appendChild(buildQuestion(item, i)));
    if (resultEl) {
      resultEl.classList.remove("is-visible");
      resultEl.textContent = "";
    }
    updateScore();
  }

  function answerQuestion(wrap, qIndex, choice) {
    if (answers[qIndex] !== null) return;
    answers[qIndex] = choice;
    const correct = QUIZ[qIndex].answer;
    const buttons = $$(".quiz__opt", wrap);
    buttons.forEach((btn, i) => {
      btn.disabled = true;
      if (i === correct) btn.classList.add("is-correct");
      if (i === choice && choice !== correct) btn.classList.add("is-wrong");
    });
    const explain = $(".quiz__explain", wrap);
    const acertou = choice === correct;
    explain.innerHTML = "";
    const strong = document.createElement("b");
    strong.textContent = acertou ? "Correto! " : "Resposta correta: " + "ABCD"[correct] + ". ";
    const txt = document.createElement("span");
    txt.textContent = QUIZ[qIndex].why;
    explain.append(strong, txt);
    explain.classList.add("is-visible");
    updateScore();
  }

  function updateScore() {
    const answered = answers.filter((a) => a !== null).length;
    const hits = answers.reduce((acc, a, i) => acc + (a === QUIZ[i].answer ? 1 : 0), 0);
    if (scoreEl) {
      scoreEl.innerHTML = "";
      const b = document.createElement("b");
      b.textContent = hits;
      scoreEl.append(b, document.createTextNode(` acertos · ${answered}/${QUIZ.length} respondidas`));
    }
    if (answered === QUIZ.length && resultEl) {
      const pct = Math.round((hits / QUIZ.length) * 100);
      const msg =
        pct === 100
          ? "Perfeito! Você dominou o conteúdo. 🏆"
          : pct >= 80
          ? "Excelente! Só revise os pontos que errou. 💪"
          : pct >= 60
          ? "Bom caminho — releia as seções dos erros e tente de novo. 📚"
          : "Vale revisar o resumo com calma e refazer o quiz. Você chega lá! 🚀";
      resultEl.innerHTML = "";
      const strong = document.createElement("strong");
      strong.textContent = `${hits}/${QUIZ.length} — ${pct}%`;
      const p = document.createElement("p");
      p.style.margin = "4px 0 0";
      p.textContent = msg;
      resultEl.append(strong, p);
      resultEl.classList.add("is-visible");
    }
  }

  resetBtn?.addEventListener("click", renderQuiz);
  renderQuiz();

  /* ---------------- atalhos de teclado ---------------- */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.activeElement?.blur?.();
    }
  });
})();
