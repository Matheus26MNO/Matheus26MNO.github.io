(function () {
  function criarTexturaPonto() {
    var tela = document.createElement('canvas');
    tela.width = tela.height = 64;
    var ctx = tela.getContext('2d');
    var gradiente = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradiente.addColorStop(0, 'rgba(255,255,255,1)');
    gradiente.addColorStop(0.35, 'rgba(255,255,255,.9)');
    gradiente.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradiente;
    ctx.fillRect(0, 0, 64, 64);
    var textura = new THREE.CanvasTexture(tela);
    return textura;
  }

  function CenaHero(canvas, retrato) {
    this.canvas = canvas;
    this.retrato = retrato;
    this.ativa = false;
    this.visivel = true;
    this.mouse = { x: 0, y: 0 };
    this.mouseSuave = { x: 0, y: 0 };
    this.progressoRolagem = 0;
    this.relogio = new THREE.Clock();
    this.montar();
  }

  CenaHero.prototype.montar = function () {
    var self = this;
    var dpr = window.devicePixelRatio || 1;
    this.renderizador = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: dpr < 1.5, powerPreference: 'high-performance' });
    this.renderizador.setPixelRatio(Math.min(dpr, 1.5));
    this.renderizador.setClearColor(0x000000, 0);

    this.cena = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    this.camera.position.set(0, 0, 10);

    this.grupo = new THREE.Group();
    this.cena.add(this.grupo);

    var geometriaCasca = new THREE.IcosahedronGeometry(1, 1);
    this.casca = new THREE.Mesh(geometriaCasca, new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.9,
      roughness: 0.18,
      flatShading: true,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide
    }));
    this.grupo.add(this.casca);

    this.arame = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometriaCasca),
      new THREE.LineBasicMaterial({ color: 0x0b0b0c, transparent: true, opacity: 0.55 })
    );
    this.grupo.add(this.arame);

    var texturaPonto = criarTexturaPonto();
    this.vertices = new THREE.Points(geometriaCasca, new THREE.PointsMaterial({
      color: 0x00b8a3,
      size: 9,
      sizeAttenuation: false,
      map: texturaPonto,
      transparent: true,
      depthWrite: false
    }));
    this.grupo.add(this.vertices);

    this.anelExterno = new THREE.Mesh(
      new THREE.TorusGeometry(1.32, 0.006, 6, 128),
      new THREE.MeshBasicMaterial({ color: 0x00b8a3 })
    );
    this.anelExterno.rotation.x = Math.PI * 0.42;
    this.grupo.add(this.anelExterno);

    this.anelInterno = new THREE.Mesh(
      new THREE.TorusGeometry(1.2, 0.004, 6, 128),
      new THREE.MeshBasicMaterial({ color: 0x0b0b0c, transparent: true, opacity: 0.5 })
    );
    this.anelInterno.rotation.y = Math.PI * 0.35;
    this.grupo.add(this.anelInterno);

    this.satelite = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x00b8a3 })
    );
    this.anelExterno.add(this.satelite);

    var quantidade = 520;
    var posicoes = new Float32Array(quantidade * 3);
    for (var i = 0; i < quantidade; i++) {
      var raio = 1.6 + Math.random() * 2.6;
      var theta = Math.random() * Math.PI * 2;
      var phi = Math.acos(2 * Math.random() - 1);
      posicoes[i * 3] = raio * Math.sin(phi) * Math.cos(theta) * 1.8;
      posicoes[i * 3 + 1] = raio * Math.sin(phi) * Math.sin(theta);
      posicoes[i * 3 + 2] = raio * Math.cos(phi) * 0.6;
    }
    var geometriaParticulas = new THREE.BufferGeometry();
    geometriaParticulas.setAttribute('position', new THREE.BufferAttribute(posicoes, 3));
    this.particulas = new THREE.Points(geometriaParticulas, new THREE.PointsMaterial({
      color: 0x1a1a1d,
      size: 3,
      sizeAttenuation: false,
      map: texturaPonto,
      transparent: true,
      opacity: 0.55,
      depthWrite: false
    }));
    this.cena.add(this.particulas);

    this.cena.add(new THREE.AmbientLight(0xffffff, 0.35));
    this.luzCursor = new THREE.PointLight(0x00e0c6, 3.2, 12, 1.6);
    this.luzCursor.position.set(2, 1, 3);
    this.cena.add(this.luzCursor);
    this.luzFundo = new THREE.DirectionalLight(0xffffff, 0.8);
    this.luzFundo.position.set(-3, 4, 2);
    this.cena.add(this.luzFundo);

    window.addEventListener('pointermove', function (evento) {
      self.mouse.x = (evento.clientX / window.innerWidth) * 2 - 1;
      self.mouse.y = -((evento.clientY / window.innerHeight) * 2 - 1);
    }, { passive: true });

    var temporizador = null;
    window.addEventListener('resize', function () {
      clearTimeout(temporizador);
      temporizador = setTimeout(function () { self.ajustarTamanho(); }, 150);
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entradas) {
        self.visivel = entradas[0].isIntersecting;
        if (self.visivel) self.iniciarLaco();
      }).observe(this.canvas);
    }

    this.ajustarTamanho();
  };

  CenaHero.prototype.ajustarTamanho = function () {
    var largura = this.canvas.clientWidth;
    var altura = this.canvas.clientHeight;
    if (!largura || !altura) return;
    this.renderizador.setSize(largura, altura, false);
    this.camera.aspect = largura / altura;
    this.camera.updateProjectionMatrix();
    var alturaVisivel = 2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * this.camera.position.z;
    this.unidadesPorPixel = alturaVisivel / altura;
    var diametroRetrato = this.retrato ? this.retrato.offsetWidth : Math.min(largura, altura) * 0.4;
    this.escalaBase = (diametroRetrato / 2) * 1.32 * this.unidadesPorPixel;
    this.grupo.scale.setScalar(this.escalaBase);
    this.renderizar();
  };

  CenaHero.prototype.definirRolagem = function (progresso) {
    this.progressoRolagem = progresso;
  };

  CenaHero.prototype.iniciar = function () {
    this.ativa = true;
    this.ajustarTamanho();
    this.iniciarLaco();
  };

  CenaHero.prototype.pausar = function () {
    this.ativa = false;
  };

  CenaHero.prototype.iniciarLaco = function () {
    if (this.emLaco || !this.ativa || !this.visivel) return;
    this.emLaco = true;
    var self = this;
    function quadro() {
      if (!self.ativa || !self.visivel) {
        self.emLaco = false;
        return;
      }
      self.atualizar();
      self.renderizar();
      requestAnimationFrame(quadro);
    }
    requestAnimationFrame(quadro);
  };

  CenaHero.prototype.atualizar = function () {
    var tempo = this.relogio.getElapsedTime();
    this.mouseSuave.x += (this.mouse.x - this.mouseSuave.x) * 0.06;
    this.mouseSuave.y += (this.mouse.y - this.mouseSuave.y) * 0.06;

    this.grupo.rotation.y = tempo * 0.18 + this.mouseSuave.x * 0.9;
    this.grupo.rotation.x = -this.mouseSuave.y * 0.6 + Math.sin(tempo * 0.4) * 0.08;
    this.grupo.position.x = this.mouseSuave.x * 0.15;
    this.grupo.position.y = this.mouseSuave.y * 0.1 + this.progressoRolagem * 1.2;

    var escala = this.escalaBase * (1 + this.progressoRolagem * 0.6);
    this.grupo.scale.setScalar(escala);

    this.anelExterno.rotation.z = tempo * 0.5;
    this.anelInterno.rotation.x = tempo * 0.3;
    this.satelite.position.set(Math.cos(tempo * 1.4) * 1.32, Math.sin(tempo * 1.4) * 1.32, 0);

    this.particulas.rotation.y = tempo * 0.03 + this.mouseSuave.x * 0.15;
    this.particulas.rotation.x = this.mouseSuave.y * 0.1;

    var alturaVisivel = 2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * this.camera.position.z;
    var larguraVisivel = alturaVisivel * this.camera.aspect;
    this.luzCursor.position.set(this.mouseSuave.x * larguraVisivel / 2, this.mouseSuave.y * alturaVisivel / 2, 2.5);

    this.casca.material.opacity = 0.05 + (Math.sin(tempo * 1.2) + 1) * 0.03;
  };

  CenaHero.prototype.renderizar = function () {
    this.renderizador.render(this.cena, this.camera);
  };

  window.CenaHero = CenaHero;
})();
