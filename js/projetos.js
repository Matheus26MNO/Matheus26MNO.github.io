(function () {
  var lista = window.PROJETOS || [];
  var alvoProfissional = document.getElementById('projetosProfissional');
  var alvoDesigner = document.getElementById('projetosDesigner');

  function criar(tag, classe, texto) {
    var elemento = document.createElement(tag);
    if (classe) elemento.className = classe;
    if (texto) elemento.textContent = texto;
    return elemento;
  }

  function doisDigitos(numero) {
    return ('0' + numero).slice(-2);
  }

  function montarProfissional() {
    if (!lista.length) {
      alvoProfissional.classList.add('pro-projetos-vazio-grade');
      var vazio = criar('div', 'pro-projeto-vazio pro-aparecer');
      var icone = criar('span', 'pro-projeto-vazio-icone', '+');
      vazio.appendChild(icone);
      vazio.appendChild(criar('h3', '', 'Projetos em construção'));
      vazio.appendChild(criar('p', '', 'Em breve, novos projetos por aqui — integrações, automações e estudos de dados.'));
      alvoProfissional.appendChild(vazio);
      return;
    }
    lista.forEach(function (projeto) {
      var cartao = criar(projeto.link ? 'a' : 'article', 'pro-cartao-projeto pro-aparecer');
      if (projeto.link) {
        cartao.href = projeto.link;
        cartao.target = '_blank';
        cartao.rel = 'noopener';
      }
      if (projeto.imagem) {
        var capa = criar('div', 'pro-projeto-capa');
        var imagem = criar('img');
        imagem.src = projeto.imagem;
        imagem.alt = projeto.titulo || '';
        imagem.loading = 'lazy';
        capa.appendChild(imagem);
        cartao.appendChild(capa);
      }
      var corpo = criar('div', 'pro-projeto-corpo');
      if (projeto.ano) corpo.appendChild(criar('span', 'pro-projeto-ano', projeto.ano));
      corpo.appendChild(criar('h3', '', projeto.titulo || ''));
      if (projeto.descricao) corpo.appendChild(criar('p', '', projeto.descricao));
      if (projeto.tecnologias && projeto.tecnologias.length) {
        var tags = criar('ul', 'pro-lista-tags');
        projeto.tecnologias.forEach(function (tecnologia) {
          tags.appendChild(criar('li', '', tecnologia));
        });
        corpo.appendChild(tags);
      }
      if (projeto.link) corpo.appendChild(criar('span', 'pro-projeto-link', 'Ver projeto →'));
      cartao.appendChild(corpo);
      alvoProfissional.appendChild(cartao);
    });
  }

  function slotVazio(numero) {
    var slot = criar('div', 'dsg-slot-vazio');
    slot.appendChild(criar('span', 'dsg-rotulo', 'SLOT ' + doisDigitos(numero)));
    slot.appendChild(criar('strong', '', 'EM BREVE'));
    slot.appendChild(criar('span', 'dsg-slot-status', '● AQUECENDO PNEUS'));
    return slot;
  }

  function montarDesigner() {
    lista.forEach(function (projeto, indice) {
      var cartao = criar(projeto.link ? 'a' : 'article', 'dsg-cartao-stack dsg-cartao-projeto cartao-inclinavel');
      if (projeto.link) {
        cartao.href = projeto.link;
        cartao.target = '_blank';
        cartao.rel = 'noopener';
        cartao.setAttribute('data-cursor', 'ver');
      }
      if (projeto.imagem) {
        var imagem = criar('img', 'dsg-projeto-imagem');
        imagem.src = projeto.imagem;
        imagem.alt = projeto.titulo || '';
        imagem.loading = 'lazy';
        cartao.appendChild(imagem);
      }
      cartao.appendChild(criar('span', 'dsg-cartao-indice', doisDigitos(indice + 1)));
      if (projeto.ano) cartao.appendChild(criar('span', 'dsg-rotulo', projeto.ano));
      cartao.appendChild(criar('h3', '', (projeto.titulo || '').toUpperCase()));
      var detalhes = [projeto.descricao, (projeto.tecnologias || []).join(' · ')].filter(Boolean).join(' — ');
      if (detalhes) cartao.appendChild(criar('p', '', detalhes));
      cartao.appendChild(criar('span', 'dsg-cartao-brilho'));
      alvoDesigner.appendChild(cartao);
    });
    var vazios = lista.length ? 1 : 3;
    for (var i = 0; i < vazios; i++) {
      alvoDesigner.appendChild(slotVazio(lista.length + i + 1));
    }
  }

  montarProfissional();
  montarDesigner();
})();
