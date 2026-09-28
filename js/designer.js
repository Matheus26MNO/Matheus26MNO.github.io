(function () {
  var corpo = document.body;
  var site = document.getElementById('siteDesigner');
  var preloader = site.querySelector('.dsg-preloader');
  var numeroPreloader = site.querySelector('.dsg-preloader-numero');
  var barraPreloader = site.querySelector('.dsg-preloader-barra span');
  var cabecalho = site.querySelector('.dsg-cabecalho');
  var hero = site.querySelector('.dsg-hero');
  var retrato = site.querySelector('.dsg-hero-retrato');
  var elementosProfundidade = Array.prototype.slice.call(site.querySelectorAll('[data-profundidade]'));
  var relogio = site.querySelector('.dsg-relogio');
  var faixa = site.querySelector('.dsg-faixa');
  var secaoSobre = site.querySelector('.dsg-sobre');
  var secaoTracado = site.querySelector('.dsg-tracado');
  var telemetriaAno = site.querySelector('.dsg-telemetria-ano');
  var telemetriaSetor = site.querySelector('.dsg-telemetria-setor');
  var telemetriaProgresso = site.querySelector('.dsg-telemetria-progresso');
  var cursorPonto = site.querySelector('.dsg-cursor-ponto');
  var cursorAnel = site.querySelector('.dsg-cursor-anel');
  var cursorRotulo = site.querySelector('.dsg-cursor-rotulo');
  var ponteiroFino = window.matchMedia('(pointer: fine)').matches;
  var reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var iniciado = false;
  var ativo = false;
  var emLaco = false;
  var cena = null;
  var tracado = null;
  var palavrasSobre = [];
  var opacidadesPalavras = [];
  var mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2, nx: 0, ny: 0 };
  var anel = { x: mouse.x, y: mouse.y };
  var ultimaRolagem = 0;
  var velocidade = 0;
  var intervaloRelogio = null;
  var medidas = {};
  var cache = { rolagem: -1, nx: 99, ny: 99, inclinacao: 99, progressoSobre: -1, progressoTracado: -1, cabecalhoClaro: null };

  var ROTULOS_CURSOR = { ver: 'VER', enviar: 'ENVIAR', rolar: 'ROLE', topo: 'TOPO' };

  function limitar(valor, minimo, maximo) {
    return Math.max(minimo, Math.min(maximo, valor));
  }

  function suavizar(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function topoAbsoluto(elemento) {
    return elemento.getBoundingClientRect().top + window.scrollY;
  }

  function medir() {
    if (!ativo) return;
    medidas.alturaJanela = window.innerHeight;
    medidas.larguraJanela = window.innerWidth;
    medidas.alturaHero = hero.offsetHeight;
    medidas.sobreTopo = topoAbsoluto(secaoSobre);
    medidas.sobreAltura = secaoSobre.offsetHeight;
    medidas.tracadoTopo = topoAbsoluto(secaoTracado);
    medidas.tracadoAltura = secaoTracado.offsetHeight;
    medidas.faixaTopo = topoAbsoluto(faixa);
    medidas.faixaAltura = faixa.offsetHeight;
    cache.rolagem = -1;
    cache.progressoSobre = -1;
    cache.progressoTracado = -1;
    acordar();
  }

  function dividirPalavras(elemento, lista) {
    Array.prototype.slice.call(elemento.childNodes).forEach(function (no) {
      if (no.nodeType === 3) {
        var fragmento = document.createDocumentFragment();
        no.textContent.split(/(\s+)/).forEach(function (parte) {
          if (!parte) return;
          if (/^\s+$/.test(parte)) {
            fragmento.appendChild(document.createTextNode(parte));
          } else {
            var span = document.createElement('span');
            span.className = 'palavra';
            span.textContent = parte;
            fragmento.appendChild(span);
            lista.push(span);
          }
        });
        elemento.replaceChild(fragmento, no);
      } else if (no.nodeType === 1) {
        dividirPalavras(no, lista);
      }
    });
    return lista;
  }

  function dividirLetras(elemento) {
    var texto = elemento.textContent;
    elemento.textContent = '';
    elemento.setAttribute('aria-label', texto);
    Array.prototype.forEach.call(texto, function (caractere, indice) {
      var mascara = document.createElement('span');
      mascara.className = 'letra-mascara';
      mascara.setAttribute('aria-hidden', 'true');
      var letra = document.createElement('span');
      letra.className = 'letra';
      letra.textContent = caractere === ' ' ? ' ' : caractere;
      letra.style.transitionDelay = (indice * 45) + 'ms';
      mascara.appendChild(letra);
      elemento.appendChild(mascara);
    });
  }

  function animarContador(elemento) {
    var alvo = parseFloat(elemento.dataset.alvo);
    var inicio = elemento.dataset.inicio ? parseFloat(elemento.dataset.inicio) : 0;
    var regressivo = elemento.dataset.regressivo;
    var de = regressivo ? alvo : inicio;
    var para = regressivo ? parseFloat(regressivo) : alvo;
    var duracao = regressivo ? 2200 : 1800;
    var atraso = regressivo ? 500 : 0;
    var comeco = null;
    var ultimoValor = null;
    function passo(agora) {
      if (!comeco) comeco = agora;
      var t = limitar((agora - comeco - atraso) / duracao, 0, 1);
      var valor = Math.round(de + (para - de) * suavizar(t));
      if (valor !== ultimoValor) {
        elemento.textContent = valor;
        ultimoValor = valor;
      }
      if (t < 1) requestAnimationFrame(passo);
    }
    requestAnimationFrame(passo);
  }

  function prepararRevelacoes() {
    site.querySelectorAll('.revelar-letras').forEach(dividirLetras);
    site.querySelectorAll('.revelar-texto').forEach(function (elemento) {
      palavrasSobre = palavrasSobre.concat(dividirPalavras(elemento, []));
    });
    opacidadesPalavras = palavrasSobre.map(function () { return -1; });

    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (!entrada.isIntersecting) return;
        var alvo = entrada.target;
        if (alvo.classList.contains('contador')) {
          animarContador(alvo);
        } else {
          alvo.classList.add('visivel');
        }
        observador.unobserve(alvo);
      });
    }, { threshold: 0.2 });

    site.querySelectorAll('.revelar-letras, .revelar-bloco, .contador').forEach(function (elemento) {
      observador.observe(elemento);
    });
  }

  function rodarPreloader() {
    if (reduzirMovimento) {
      preloader.classList.add('oculto');
      return;
    }
    var duracao = 1500;
    var comeco = null;
    function passo(agora) {
      if (!comeco) comeco = agora;
      var t = limitar((agora - comeco) / duracao, 0, 1);
      var valor = Math.round(suavizar(t) * 100);
      numeroPreloader.textContent = ('00' + valor).slice(-3);
      barraPreloader.style.transform = 'scaleX(' + valor / 100 + ')';
      if (t < 1) {
        requestAnimationFrame(passo);
      } else {
        setTimeout(function () {
          preloader.classList.add('concluido');
          setTimeout(function () { preloader.classList.add('oculto'); }, 1000);
        }, 150);
      }
    }
    requestAnimationFrame(passo);
  }

  function atualizarRelogio() {
    relogio.textContent = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' BRT';
  }

  function configurarCursor() {
    if (!ponteiroFino) return;
    window.addEventListener('pointermove', function (evento) {
      if (!ativo) return;
      mouse.x = evento.clientX;
      mouse.y = evento.clientY;
      cursorPonto.style.transform = 'translate3d(' + mouse.x + 'px,' + mouse.y + 'px,0)';
      acordar();
    }, { passive: true });

    site.addEventListener('pointerover', function (evento) {
      var comRotulo = evento.target.closest('[data-cursor]');
      var link = evento.target.closest('a, button');
      if (comRotulo) {
        cursorRotulo.textContent = ROTULOS_CURSOR[comRotulo.dataset.cursor] || '';
        cursorAnel.classList.add('expandido');
        cursorAnel.classList.remove('sobre-link');
      } else if (link) {
        cursorAnel.classList.add('sobre-link');
        cursorAnel.classList.remove('expandido');
      } else {
        cursorAnel.classList.remove('expandido', 'sobre-link');
      }
    });

    var alternador = document.querySelector('.alternador-modo');
    alternador.addEventListener('pointerenter', function () {
      cursorAnel.classList.add('sobre-link');
    });
    alternador.addEventListener('pointerleave', function () {
      cursorAnel.classList.remove('sobre-link');
    });
  }

  function configurarMagneticos() {
    if (!ponteiroFino) return;
    site.querySelectorAll('.magnetico').forEach(function (elemento) {
      var caixa = null;
      elemento.addEventListener('pointerenter', function () {
        elemento.style.transform = '';
        caixa = elemento.getBoundingClientRect();
        elemento.style.transition = 'transform .15s ease-out';
      });
      elemento.addEventListener('pointermove', function (evento) {
        if (!caixa) return;
        var x = evento.clientX - (caixa.left + caixa.width / 2);
        var y = evento.clientY - (caixa.top + caixa.height / 2);
        elemento.style.transform = 'translate3d(' + x * 0.35 + 'px,' + y * 0.45 + 'px,0)';
      });
      elemento.addEventListener('pointerleave', function () {
        caixa = null;
        elemento.style.transition = 'transform .6s cubic-bezier(.2,.9,.2,1.4)';
        elemento.style.transform = '';
      });
    });
  }

  function configurarInclinacao() {
    site.querySelectorAll('.cartao-inclinavel').forEach(function (cartao) {
      var caixa = null;
      var pendente = null;
      function aplicar() {
        var px = pendente.px;
        var py = pendente.py;
        pendente = null;
        cartao.style.setProperty('--mx', px * 100 + '%');
        cartao.style.setProperty('--my', py * 100 + '%');
        if (ponteiroFino) {
          cartao.style.transform = 'rotateX(' + (0.5 - py) * 14 + 'deg) rotateY(' + (px - 0.5) * 16 + 'deg)';
        }
      }
      cartao.addEventListener('pointerenter', function () {
        caixa = cartao.getBoundingClientRect();
        cartao.style.transition = 'transform .1s ease-out, border-color .3s ease';
      });
      cartao.addEventListener('pointermove', function (evento) {
        if (!caixa) caixa = cartao.getBoundingClientRect();
        var agendar = !pendente;
        pendente = { px: (evento.clientX - caixa.left) / caixa.width, py: (evento.clientY - caixa.top) / caixa.height };
        if (agendar) requestAnimationFrame(aplicar);
      });
      cartao.addEventListener('pointerleave', function () {
        caixa = null;
        cartao.style.transition = 'transform .7s cubic-bezier(.2,.9,.2,1), border-color .3s ease';
        cartao.style.transform = '';
      });
    });
  }

  function aoAtualizarMarco(marco) {
    telemetriaAno.textContent = marco.ano;
    telemetriaSetor.textContent = marco.titulo;
  }

  function acordar() {
    if (!ativo || emLaco) return;
    emLaco = true;
    requestAnimationFrame(laco);
  }

  function laco() {
    if (!ativo) {
      emLaco = false;
      return;
    }
    var rolagem = window.scrollY;
    var alturaJanela = medidas.alturaJanela;
    var rolou = rolagem !== cache.rolagem;
    var continuar = false;

    velocidade += ((rolagem - ultimaRolagem) - velocidade) * 0.12;
    ultimaRolagem = rolagem;
    if (Math.abs(velocidade) > 0.05) continuar = true;

    if (ponteiroFino) {
      var dx = mouse.x - anel.x;
      var dy = mouse.y - anel.y;
      if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
        anel.x += dx * 0.16;
        anel.y += dy * 0.16;
        cursorAnel.style.transform = 'translate3d(' + anel.x + 'px,' + anel.y + 'px,0)';
        continuar = true;
      }
      var alvoNx = mouse.x / medidas.larguraJanela - 0.5;
      var alvoNy = mouse.y / alturaJanela - 0.5;
      if (Math.abs(alvoNx - mouse.nx) > 0.0005 || Math.abs(alvoNy - mouse.ny) > 0.0005) {
        mouse.nx += (alvoNx - mouse.nx) * 0.08;
        mouse.ny += (alvoNy - mouse.ny) * 0.08;
        continuar = true;
      }
    }

    var alturaHero = medidas.alturaHero;
    var progressoHero = limitar(rolagem / alturaHero, 0, 1);
    var heroMudou = rolou || mouse.nx !== cache.nx || mouse.ny !== cache.ny;
    if (progressoHero < 1 && heroMudou) {
      cache.nx = mouse.nx;
      cache.ny = mouse.ny;
      for (var i = 0; i < elementosProfundidade.length; i++) {
        var elemento = elementosProfundidade[i];
        var profundidade = parseFloat(elemento.dataset.profundidade);
        var mx = mouse.nx * profundidade * medidas.larguraJanela;
        var my = mouse.ny * profundidade * alturaJanela + progressoHero * alturaHero * 0.25;
        if (elemento === retrato) {
          elemento.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0) scale(' + (1 - progressoHero * 0.25) + ')';
        } else {
          var direcao = i === 0 ? -1 : 1;
          elemento.style.transform = 'translate3d(' + (mx + direcao * progressoHero * medidas.larguraJanela * 0.25) + 'px,' + my + 'px,0)';
        }
      }
      if (cena) cena.definirRolagem(progressoHero);
    }

    var claro = rolagem < alturaHero - 40;
    if (claro !== cache.cabecalhoClaro) {
      cache.cabecalhoClaro = claro;
      cabecalho.classList.toggle('sobre-claro', claro);
    }

    var faixaVisivel = rolagem + alturaJanela > medidas.faixaTopo && rolagem < medidas.faixaTopo + medidas.faixaAltura;
    if (faixaVisivel) {
      var inclinacao = Math.round(limitar(velocidade * 0.25, -12, 12) * 10) / 10;
      if (inclinacao !== cache.inclinacao) {
        cache.inclinacao = inclinacao;
        faixa.style.transform = 'rotate(-2deg) scale(1.04) skewX(' + inclinacao + 'deg)';
      }
    }

    if (rolou && palavrasSobre.length) {
      var topoSobreNaTela = medidas.sobreTopo - rolagem;
      if (topoSobreNaTela < alturaJanela && topoSobreNaTela + medidas.sobreAltura > 0) {
        var progressoSobre = limitar((alturaJanela * 0.85 - topoSobreNaTela) / (medidas.sobreAltura * 0.6), 0, 1);
        if (progressoSobre !== cache.progressoSobre) {
          cache.progressoSobre = progressoSobre;
          var acesas = progressoSobre * palavrasSobre.length;
          for (var p = 0; p < palavrasSobre.length; p++) {
            var opacidade = Math.round(limitar(acesas - p, 0.12, 1) * 20) / 20;
            if (opacidade !== opacidadesPalavras[p]) {
              opacidadesPalavras[p] = opacidade;
              palavrasSobre[p].style.opacity = opacidade;
            }
          }
        }
      }
    }

    if (tracado) {
      var topoTracadoNaTela = medidas.tracadoTopo - rolagem;
      var tracadoVisivel = topoTracadoNaTela < alturaJanela - 1 && topoTracadoNaTela + medidas.tracadoAltura > 1;
      if (tracadoVisivel) {
        tracado.iniciar();
        if (rolou) {
          var progressoTracado = limitar(-topoTracadoNaTela / (medidas.tracadoAltura - alturaJanela), 0, 1);
          tracado.definirProgresso(progressoTracado);
          var porcentagem = Math.round(progressoTracado * 100);
          if (porcentagem !== cache.progressoTracado) {
            cache.progressoTracado = porcentagem;
            telemetriaProgresso.textContent = porcentagem + '%';
          }
        }
      } else {
        tracado.pausar();
      }
    }

    cache.rolagem = rolagem;

    if (continuar) {
      requestAnimationFrame(laco);
    } else {
      emLaco = false;
    }
  }

  function iniciarPrimeiraVez() {
    iniciado = true;
    prepararRevelacoes();
    configurarCursor();
    configurarMagneticos();
    configurarInclinacao();
    tracado = new TracadoCircuito(document.getElementById('tracadoCanvas'), aoAtualizarMarco);
    if (window.THREE) {
      try {
        cena = new CenaHero(document.getElementById('cena3d'), retrato);
      } catch (erro) {
        cena = null;
      }
    }
    window.addEventListener('scroll', acordar, { passive: true });
    var temporizador = null;
    window.addEventListener('resize', function () {
      clearTimeout(temporizador);
      temporizador = setTimeout(medir, 150);
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(medir);
    if ('ResizeObserver' in window) new ResizeObserver(function () { medir(); }).observe(site);
  }

  function ativar() {
    if (ativo) return;
    ativo = true;
    var primeira = !iniciado;
    if (primeira) iniciarPrimeiraVez();
    if (ponteiroFino) corpo.classList.add('cursor-customizado');
    atualizarRelogio();
    intervaloRelogio = setInterval(atualizarRelogio, 1000);
    ultimaRolagem = window.scrollY;
    if (primeira) rodarPreloader();
    medir();
    if (cena) cena.iniciar();
    if (tracado) tracado.ajustarTamanho();
    acordar();
  }

  function desativar() {
    ativo = false;
    corpo.classList.remove('cursor-customizado');
    clearInterval(intervaloRelogio);
    if (cena) cena.pausar();
    if (tracado) tracado.pausar();
  }

  window.addEventListener('modoalterado', function (evento) {
    if (evento.detail.modo === 'designer') {
      ativar();
    } else {
      desativar();
    }
  });

  if (corpo.classList.contains('modo-designer')) ativar();
})();
