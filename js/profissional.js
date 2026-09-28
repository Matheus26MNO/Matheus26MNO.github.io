(function () {
  var cabecalho = document.querySelector('.pro-cabecalho');
  var linksMenu = document.querySelectorAll('.pro-menu a');
  var secoes = document.querySelectorAll('.site-profissional section[id]');
  var elementosAparecer = document.querySelectorAll('.pro-aparecer');

  var observadorAparecer = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (entrada) {
      if (!entrada.isIntersecting) return;
      var irmaos = Array.prototype.filter.call(entrada.target.parentElement.children, function (filho) {
        return filho.classList.contains('pro-aparecer');
      });
      var atraso = Math.max(0, irmaos.indexOf(entrada.target)) * 90;
      entrada.target.style.transitionDelay = atraso + 'ms';
      entrada.target.classList.add('visivel');
      observadorAparecer.unobserve(entrada.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  elementosAparecer.forEach(function (elemento) {
    observadorAparecer.observe(elemento);
  });

  var observadorSecoes = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (entrada) {
      if (!entrada.isIntersecting) return;
      linksMenu.forEach(function (link) {
        link.classList.toggle('ativo', link.getAttribute('href') === '#' + entrada.target.id);
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });

  secoes.forEach(function (secao) {
    observadorSecoes.observe(secao);
  });

  function aoRolar() {
    if (!document.body.classList.contains('modo-profissional')) return;
    cabecalho.classList.toggle('rolado', window.scrollY > 10);
  }

  window.addEventListener('scroll', aoRolar, { passive: true });
  aoRolar();
})();
