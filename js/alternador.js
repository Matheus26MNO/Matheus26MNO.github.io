(function () {
  var corpo = document.body;
  var alternador = document.querySelector('.alternador-modo');
  var opcoes = alternador.querySelectorAll('.alternador-opcao');
  var indicador = alternador.querySelector('.alternador-indicador');
  var cortina = document.querySelector('.cortina-transicao');
  var siteProfissional = document.getElementById('siteProfissional');
  var siteDesigner = document.getElementById('siteDesigner');
  var emTransicao = false;
  var CHAVE = 'portfolio-modo';

  function lerPreferencia() {
    var hash = window.location.hash.replace('#', '');
    if (hash === 'designer' || hash === 'profissional') return hash;
    try {
      return localStorage.getItem(CHAVE) || 'profissional';
    } catch (erro) {
      return 'profissional';
    }
  }

  function salvarPreferencia(modo) {
    try {
      localStorage.setItem(CHAVE, modo);
    } catch (erro) {}
  }

  function posicionarIndicador() {
    var ativa = alternador.querySelector('.alternador-opcao.ativo');
    if (!ativa) return;
    indicador.style.width = ativa.offsetWidth + 'px';
    indicador.style.transform = 'translateX(' + (ativa.offsetLeft - 4) + 'px)';
  }

  function definirModo(modo) {
    corpo.classList.remove('modo-profissional', 'modo-designer');
    corpo.classList.add('modo-' + modo);
    siteProfissional.setAttribute('aria-hidden', modo !== 'profissional');
    siteDesigner.setAttribute('aria-hidden', modo !== 'designer');
    opcoes.forEach(function (opcao) {
      var ativa = opcao.dataset.modo === modo;
      opcao.classList.toggle('ativo', ativa);
      opcao.setAttribute('aria-pressed', ativa);
    });
    document.title = modo === 'designer' ? 'MATHEUS OLIVEIRA — /012' : 'Matheus Oliveira · Portfólio';
    posicionarIndicador();
    requestAnimationFrame(posicionarIndicador);
    window.dispatchEvent(new CustomEvent('modoalterado', { detail: { modo: modo } }));
  }

  function trocarModo(modo) {
    if (emTransicao || corpo.classList.contains('modo-' + modo)) return;
    emTransicao = true;
    salvarPreferencia(modo);
    cortina.classList.toggle('cortina-clara', modo === 'profissional');
    cortina.classList.remove('saindo');
    cortina.classList.add('entrando');

    cortina.addEventListener('animationend', function aoEntrar() {
      cortina.removeEventListener('animationend', aoEntrar);
      window.scrollTo(0, 0);
      definirModo(modo);
      setTimeout(function () {
        cortina.classList.remove('entrando');
        cortina.classList.add('saindo');
        cortina.addEventListener('animationend', function aoSair() {
          cortina.removeEventListener('animationend', aoSair);
          cortina.classList.remove('saindo');
          emTransicao = false;
        });
      }, 250);
    });
  }

  opcoes.forEach(function (opcao) {
    opcao.addEventListener('click', function () {
      trocarModo(opcao.dataset.modo);
    });
  });

  window.addEventListener('resize', posicionarIndicador);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(posicionarIndicador);
  }

  document.querySelectorAll('.ano-atual').forEach(function (elemento) {
    elemento.textContent = new Date().getFullYear();
  });

  definirModo(lerPreferencia());
})();
