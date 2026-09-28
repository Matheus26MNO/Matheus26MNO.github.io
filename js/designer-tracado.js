(function () {
  var PONTOS_CIRCUITO = [
    [0.10, 0.62], [0.16, 0.40], [0.30, 0.30], [0.42, 0.40], [0.50, 0.22],
    [0.66, 0.12], [0.84, 0.18], [0.92, 0.36], [0.80, 0.50], [0.88, 0.70],
    [0.78, 0.88], [0.56, 0.84], [0.46, 0.66], [0.32, 0.80], [0.16, 0.84]
  ];

  var MARCOS = [
    { fracao: 0.0, ano: '2019', titulo: 'JOVEM APRENDIZ', detalhe: 'SUPERMERCADO COVABRA' },
    { fracao: 0.08, ano: '2020', titulo: 'ESTÁGIO', detalhe: 'ALMOXARIFADO · ILUMI' },
    { fracao: 0.19, ano: 'JAN 2022', titulo: 'TIRO DE GUERRA', detalhe: 'SERVIÇO MILITAR · JAN — DEZ' },
    { fracao: 0.3, ano: 'JUL 2022', titulo: 'ETEC', detalhe: 'DEP. SALIM SEDEH · DESENV. DE SISTEMAS' },
    { fracao: 0.4, ano: 'SET 2022', titulo: 'VIMAN SISTEMAS', detalhe: 'ENTRADA COMO ESTAGIÁRIO' },
    { fracao: 0.5, ano: 'JAN 2023', titulo: 'EFETIVADO', detalhe: 'VIMAN SISTEMAS' },
    { fracao: 0.6, ano: 'MAI 2023', titulo: 'SUPORTE ERP', detalhe: 'INDÚSTRIAS DA SAÚDE E SIDERURGIA' },
    { fracao: 0.7, ano: 'OUT 2024', titulo: 'IMPLANTAÇÕES', detalhe: 'ACOMPANHAMENTO DE PROJETOS' },
    { fracao: 0.8, ano: 'JAN 2025', titulo: 'IMPLANTAÇÕES SOLO', detalhe: '13 CLIENTES · 5 → 2 MESES' },
    { fracao: 0.92, ano: 'HOJE', titulo: 'CIÊNCIA DE DADOS', detalhe: 'UNIVESP · +100 CLIENTES EM SUPORTE' }
  ];

  var PASSO_TRILHA = 2;

  function catmullRom(p0, p1, p2, p3, t) {
    var t2 = t * t;
    var t3 = t2 * t;
    return [
      0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
      0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
    ];
  }

  function amostrarCircuito(pontos, porSegmento) {
    var resultado = [];
    var total = pontos.length;
    for (var i = 0; i < total; i++) {
      var p0 = pontos[(i - 1 + total) % total];
      var p1 = pontos[i];
      var p2 = pontos[(i + 1) % total];
      var p3 = pontos[(i + 2) % total];
      for (var j = 0; j < porSegmento; j++) {
        resultado.push(catmullRom(p0, p1, p2, p3, j / porSegmento));
      }
    }
    resultado.push(resultado[0]);
    return resultado;
  }

  function TracadoCircuito(canvas, aoAtualizarMarco) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.camadaEstatica = document.createElement('canvas');
    this.aoAtualizarMarco = aoAtualizarMarco;
    this.progresso = 0;
    this.progressoSuave = 0;
    this.amostras = amostrarCircuito(PONTOS_CIRCUITO, 40);
    this.ativo = false;
    this.marcoAtual = -1;
    this.revelacaoMarcos = MARCOS.map(function () { return 0; });
    var self = this;
    var temporizador = null;
    window.addEventListener('resize', function () {
      clearTimeout(temporizador);
      temporizador = setTimeout(function () { self.ajustarTamanho(); }, 150);
    });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        MARCOS.forEach(function (marco) { marco.larguras = null; });
      });
    }
    this.ajustarTamanho();
  }

  TracadoCircuito.prototype.ajustarTamanho = function () {
    var largura = this.canvas.clientWidth;
    var altura = this.canvas.clientHeight;
    if (!largura || !altura) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    if (largura === this.largura && altura === this.altura && dpr === this.dpr) return;
    this.dpr = dpr;
    this.largura = largura;
    this.altura = altura;
    this.canvas.width = Math.round(largura * dpr);
    this.canvas.height = Math.round(altura * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.movel = largura < 760;

    var area = this.movel
      ? { x: 40, y: altura * 0.38, l: largura - 80, a: altura * 0.54 }
      : { x: largura * 0.36, y: altura * 0.12, l: largura * 0.5, a: altura * 0.78 };

    var brutos = this.amostras.map(function (p) {
      return [area.x + p[0] * area.l, area.y + p[1] * area.a];
    });

    var trilha = [];
    var acumulado = 0;
    var proximo = 0;
    for (var i = 1; i < brutos.length; i++) {
      var a = brutos[i - 1];
      var b = brutos[i];
      var dx = b[0] - a[0];
      var dy = b[1] - a[1];
      var trecho = Math.sqrt(dx * dx + dy * dy);
      var angulo = Math.atan2(dy, dx);
      while (proximo <= acumulado + trecho) {
        var t = trecho ? (proximo - acumulado) / trecho : 0;
        trilha.push({ x: a[0] + dx * t, y: a[1] + dy * t, angulo: angulo });
        proximo += PASSO_TRILHA;
      }
      acumulado += trecho;
    }
    this.trilha = trilha;

    var somaX = 0;
    var somaY = 0;
    trilha.forEach(function (p) { somaX += p.x; somaY += p.y; });
    this.centro = [somaX / trilha.length, somaY / trilha.length];

    var self = this;
    this.posicoesMarcos = MARCOS.map(function (marco) { return self.pontoNaFracao(marco.fracao); });
    this.desenharCamadaEstatica();
    this.desenhar();
  };

  TracadoCircuito.prototype.indiceNaFracao = function (fracao) {
    return Math.max(0, Math.min(this.trilha.length - 1, Math.round(fracao * (this.trilha.length - 1))));
  };

  TracadoCircuito.prototype.pontoNaFracao = function (fracao) {
    return this.trilha[this.indiceNaFracao(fracao)];
  };

  TracadoCircuito.prototype.tracarAte = function (ctx, ate) {
    var trilha = this.trilha;
    ctx.beginPath();
    ctx.moveTo(trilha[0].x, trilha[0].y);
    for (var i = 3; i <= ate; i += 3) {
      ctx.lineTo(trilha[i].x, trilha[i].y);
    }
    ctx.lineTo(trilha[ate].x, trilha[ate].y);
  };

  TracadoCircuito.prototype.desenharCamadaEstatica = function () {
    var camada = this.camadaEstatica;
    camada.width = this.canvas.width;
    camada.height = this.canvas.height;
    var ctx = camada.getContext('2d');
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    var ultimo = this.trilha.length - 1;

    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    var passo = 28;
    for (var gx = passo / 2; gx < this.largura; gx += passo) {
      for (var gy = passo / 2; gy < this.altura; gy += passo) {
        ctx.fillRect(gx, gy, 1, 1);
      }
    }

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    this.tracarAte(ctx, ultimo);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = this.movel ? 18 : 28;
    ctx.setLineDash([2, 10]);
    ctx.stroke();
    ctx.setLineDash([]);

    this.tracarAte(ctx, ultimo);
    ctx.strokeStyle = '#161618';
    ctx.lineWidth = this.movel ? 16 : 26;
    ctx.stroke();

    var largada = this.pontoNaFracao(0);
    ctx.save();
    ctx.translate(largada.x, largada.y);
    ctx.rotate(largada.angulo + Math.PI / 2);
    var tamanho = this.movel ? 4 : 5;
    for (var cx = -3; cx < 3; cx++) {
      for (var cy = 0; cy < 2; cy++) {
        ctx.fillStyle = (cx + cy) % 2 === 0 ? '#f3f3f1' : '#0b0b0c';
        ctx.fillRect(cx * tamanho, cy * tamanho - tamanho, tamanho, tamanho);
      }
    }
    ctx.restore();

    this.posicoesMarcos.forEach(function (pos) {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#0b0b0c';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.stroke();
    });
  };

  TracadoCircuito.prototype.definirProgresso = function (progresso) {
    this.progresso = Math.max(0, Math.min(1, progresso));
  };

  TracadoCircuito.prototype.iniciar = function () {
    if (this.ativo) return;
    this.ativo = true;
    this.ajustarTamanho();
    var self = this;
    function quadro() {
      if (!self.ativo) return;
      self.progressoSuave += (self.progresso - self.progressoSuave) * 0.09;
      self.desenhar();
      requestAnimationFrame(quadro);
    }
    requestAnimationFrame(quadro);
  };

  TracadoCircuito.prototype.pausar = function () {
    this.ativo = false;
  };

  TracadoCircuito.prototype.desenhar = function () {
    if (!this.trilha) return;
    var ctx = this.ctx;
    var tempo = performance.now() / 1000;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.drawImage(this.camadaEstatica, 0, 0);
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    this.tracarAte(ctx, this.trilha.length - 1);
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1;
    ctx.setLineDash([8, 10]);
    ctx.lineDashOffset = -tempo * 20;
    ctx.stroke();
    ctx.setLineDash([]);

    var indiceCabeca = Math.max(1, this.indiceNaFracao(this.progressoSuave));
    var cabeca = this.trilha[indiceCabeca];

    this.tracarAte(ctx, indiceCabeca);
    ctx.strokeStyle = 'rgba(0,224,198,0.14)';
    ctx.lineWidth = this.movel ? 12 : 16;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0,224,198,0.3)';
    ctx.lineWidth = this.movel ? 6 : 8;
    ctx.stroke();
    ctx.strokeStyle = '#00e0c6';
    ctx.lineWidth = this.movel ? 3 : 4;
    ctx.stroke();

    var afastamento = this.movel ? 12 : 20;
    var saltos = Math.round(14 / PASSO_TRILHA);
    ctx.fillStyle = 'rgba(0,224,198,0.35)';
    for (var d = 0; d < indiceCabeca; d += saltos) {
      var p = this.trilha[d];
      var nx = -Math.sin(p.angulo);
      var ny = Math.cos(p.angulo);
      if (nx * (p.x - this.centro[0]) + ny * (p.y - this.centro[1]) < 0) {
        nx = -nx;
        ny = -ny;
      }
      ctx.fillRect(p.x + nx * afastamento - 1, p.y + ny * afastamento - 1, 2, 2);
    }

    var pulso = 1 + Math.sin(tempo * 6) * 0.25;
    var brilho = ctx.createRadialGradient(cabeca.x, cabeca.y, 0, cabeca.x, cabeca.y, 26 * pulso);
    brilho.addColorStop(0, 'rgba(0,224,198,0.55)');
    brilho.addColorStop(1, 'rgba(0,224,198,0)');
    ctx.fillStyle = brilho;
    ctx.fillRect(cabeca.x - 30, cabeca.y - 30, 60, 60);
    ctx.beginPath();
    ctx.arc(cabeca.x, cabeca.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    var marcoAtual = 0;
    var m;
    for (m = 0; m < MARCOS.length; m++) {
      if (this.progressoSuave >= MARCOS[m].fracao - 0.002) marcoAtual = m;
    }

    for (m = 0; m < MARCOS.length; m++) {
      var marco = MARCOS[m];
      var pos = this.posicoesMarcos[m];
      var passou = m <= marcoAtual && this.progressoSuave >= marco.fracao - 0.002;
      var mostrar = this.movel ? m === marcoAtual : passou;
      this.revelacaoMarcos[m] += ((mostrar ? 1 : 0) - this.revelacaoMarcos[m]) * 0.12;

      if (passou) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#00e0c6';
        ctx.fill();
      }

      if (this.revelacaoMarcos[m] > 0.01) this.desenharRotulo(marco, pos, this.revelacaoMarcos[m]);
    }

    if (marcoAtual !== this.marcoAtual) {
      this.marcoAtual = marcoAtual;
      if (this.aoAtualizarMarco) this.aoAtualizarMarco(MARCOS[marcoAtual]);
    }
  };

  TracadoCircuito.prototype.desenharRotulo = function (marco, pos, revelacao) {
    var ctx = this.ctx;
    var nx = -Math.sin(pos.angulo);
    var ny = Math.cos(pos.angulo);
    if (nx * (pos.x - this.centro[0]) + ny * (pos.y - this.centro[1]) < 0) {
      nx = -nx;
      ny = -ny;
    }
    var alcance = (this.movel ? 24 : 42) * revelacao;
    var fimX = pos.x + nx * alcance;
    var fimY = pos.y + ny * alcance;
    var paraDireita = nx >= 0;

    var tamanhoAno = this.movel ? 10 : 11;
    var tamanhoTitulo = this.movel ? 14 : 18;
    var tamanhoDetalhe = this.movel ? 9 : 10;

    if (!marco.larguras || marco.larguras.movel !== this.movel) {
      ctx.font = tamanhoTitulo + 'px "Anton", sans-serif';
      var larguraTitulo = ctx.measureText(marco.titulo).width;
      ctx.font = '500 ' + tamanhoDetalhe + 'px "JetBrains Mono", monospace';
      var larguraDetalhe = ctx.measureText(marco.detalhe).width;
      marco.larguras = { movel: this.movel, total: Math.max(larguraTitulo, larguraDetalhe) };
    }
    var larguraTexto = marco.larguras.total;

    var textoX = fimX + (paraDireita ? 22 : -22);
    if (paraDireita && textoX + larguraTexto > this.largura - 12) paraDireita = false;
    if (!paraDireita && textoX - larguraTexto < 12) paraDireita = true;
    textoX = fimX + (paraDireita ? 22 : -22);
    textoX = Math.max(12 + (paraDireita ? 0 : larguraTexto), Math.min(this.largura - 12 - (paraDireita ? larguraTexto : 0), textoX));

    ctx.globalAlpha = revelacao;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineTo(fimX, fimY);
    ctx.lineTo(fimX + (paraDireita ? 16 : -16), fimY);
    ctx.strokeStyle = 'rgba(0,224,198,0.7)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.textAlign = paraDireita ? 'left' : 'right';
    ctx.fillStyle = 'rgba(7,7,8,0.8)';
    ctx.fillRect(paraDireita ? textoX - 4 : textoX - larguraTexto - 4, fimY - 32, larguraTexto + 8, 58);
    ctx.fillStyle = '#00e0c6';
    ctx.font = '700 ' + tamanhoAno + 'px "JetBrains Mono", monospace';
    ctx.fillText(marco.ano, textoX, fimY - 18);
    ctx.fillStyle = '#f3f3f1';
    ctx.font = tamanhoTitulo + 'px "Anton", sans-serif';
    ctx.fillText(marco.titulo, textoX, fimY + 4);
    ctx.fillStyle = '#8b8b90';
    ctx.font = '500 ' + tamanhoDetalhe + 'px "JetBrains Mono", monospace';
    ctx.fillText(marco.detalhe, textoX, fimY + 20);
    ctx.globalAlpha = 1;
  };

  window.TracadoCircuito = TracadoCircuito;
})();
