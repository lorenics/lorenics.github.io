/* ロアニクス：背景にうっすら漂う「しずく・らせん・回路」
   ロゴの成り立ち（遺伝子のらせんと回路 → しずく → L）を、魚が泳ぐように画面のうしろで漂わせる
   ・キャンバス1枚を画面のいちばんうしろ（z-index:-1）に固定して描く。文字・写真・カードの上には出ない
   ・「アニメーションを停止する」ボタン（.motion-off）が押されたら止めて、止まった絵を1枚だけ描く
   ・タブが裏にあるときは描かない。描き直しは1秒に約30回
   ・色はロゴの2色（青 #2C77BB・藍 #374EA2）だけ。濃さは1割前後 */
(function () {
  'use strict';
  var cv = document.createElement('canvas');
  if (!cv.getContext || !window.requestAnimationFrame) { return; }
  var ctx = cv.getContext('2d');
  if (!ctx) { return; }
  cv.className = 'drift';
  /* CSSが古いまま残っていても崩れないよう、置き方はここでも指定する */
  cv.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;z-index:-1;pointer-events:none';
  cv.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(cv, document.body.firstChild);

  var BLUE = '44,119,187', INDIGO = '55,78,162';
  var TAU = Math.PI * 2;
  var W = 0, H = 0, DPR = 1, SM = false;
  var T = 0;
  var fish = [], helices = [], wires = [];
  var root = document.getElementById('tb') || document.documentElement;

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function col(c, a) { return 'rgba(' + c + ',' + Math.max(0, a).toFixed(3) + ')'; }
  function wrap(v, lo, hi) { var s = hi - lo; return lo + (((v - lo) % s) + s) % s; }

  /* ---------- しずく（ロゴのかたち）を1つ描く。頭が進む向き、しっぽがうしろ ---------- */
  function drop(x, y, r, ang, wig, c, a) {
    var L = r * 2.2;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, false);
    ctx.quadraticCurveTo(-L * 0.5, r * 0.8 + wig * 0.4, -L, wig);
    ctx.quadraticCurveTo(-L * 0.5, -r * 0.8 + wig * 0.4, 0, -r);
    ctx.closePath();
    ctx.fillStyle = col(c, a);
    ctx.fill();
    ctx.restore();
  }

  /* ---------- しずくの群れ：魚のように横切る ---------- */
  function School(first) { this.reset(first); }
  School.prototype.reset = function (first) {
    this.dir = Math.random() < 0.5 ? 1 : -1;
    this.r = SM ? rnd(6, 8.5) : rnd(8, 11.5);
    this.v = rnd(9, 16);                                  /* 1秒に進む距離（px） */
    this.y = rnd(0.08, 0.92) * H;
    this.x = first ? rnd(-0.1, 1.1) * W : (this.dir > 0 ? -180 : W + 180);
    this.amp = rnd(16, 42);
    this.k = rnd(0.004, 0.008);
    this.ph = rnd(0, TAU);
    this.m = [];
    var n = SM ? 3 : 4;
    for (var i = 0; i < n; i++) {
      this.m.push({ dx: -i * rnd(24, 34), dy: rnd(-18, 18), ph: rnd(0, TAU), c: i % 2 ? INDIGO : BLUE, s: rnd(0.8, 1.15) });
    }
  };
  School.prototype.step = function (dt) {
    this.x += this.v * this.dir * dt;
    if ((this.dir > 0 && this.x > W + 260) || (this.dir < 0 && this.x < -260)) { this.reset(false); }
  };
  School.prototype.draw = function (t, oy) {
    for (var i = 0; i < this.m.length; i++) {
      var m = this.m[i];
      var x = this.x + m.dx * this.dir;
      var u = x * this.k + this.ph + t * 0.25;
      var y = wrap(this.y + Math.sin(u) * this.amp + m.dy + oy, -80, H + 80);
      var vy = Math.cos(u) * this.amp * (this.k * this.v * this.dir + 0.25);
      var ang = Math.atan2(vy, this.v * this.dir);
      var wig = Math.sin(t * 5 + m.ph) * this.r * 0.45;
      drop(x, y, this.r * m.s, ang, wig, m.c, 0.11);
    }
  };

  /* ---------- らせん（遺伝子）：ねじれながら、ゆっくり泳ぐ帯 ---------- */
  function Helix(first) { this.reset(first); }
  Helix.prototype.reset = function (first) {
    this.dir = Math.random() < 0.5 ? 1 : -1;
    this.len = SM ? rnd(170, 220) : rnd(260, 360);
    this.amp = SM ? rnd(9, 12) : rnd(12, 17);
    this.wl = SM ? rnd(70, 90) : rnd(90, 120);             /* ねじれ1回分の長さ */
    this.v = rnd(5, 9);
    this.tilt = rnd(-0.35, 0.35);
    this.y = rnd(0.12, 0.88) * H;
    this.x = first ? rnd(0, 1) * W : (this.dir > 0 ? -this.len : W + this.len);
    this.bend = rnd(8, 18);
    this.ph = rnd(0, TAU);
  };
  Helix.prototype.step = function (dt) {
    this.x += this.v * this.dir * dt;
    if ((this.dir > 0 && this.x > W + this.len) || (this.dir < 0 && this.x < -this.len)) { this.reset(false); }
  };
  Helix.prototype.draw = function (t, oy) {
    var n = Math.round(this.len / 6), a1 = [], a2 = [], i, u, tp, c, p, am;
    for (i = 0; i <= n; i++) {
      u = -this.len / 2 + i * this.len / n;
      tp = Math.sin(Math.PI * i / n);                       /* 両端は細く、真ん中は太く */
      c = Math.sin(u * TAU / (this.len * 1.4) - t * 0.9 * this.dir + this.ph) * this.bend;   /* 体のうねり */
      p = u * TAU / this.wl + t * 1.1 * this.dir + this.ph;                                   /* ねじれ */
      am = this.amp * (0.3 + 0.7 * tp);
      a1.push([u, c + Math.sin(p) * am, Math.cos(p), tp]);
      a2.push([u, c - Math.sin(p) * am, -Math.cos(p), tp]);
    }
    ctx.save();
    ctx.translate(this.x, wrap(this.y + oy, -this.len, H + this.len));
    ctx.rotate(this.tilt);
    ctx.lineCap = 'round';
    /* 横木（はしごの段）と、その両端の玉。手前にある玉ほど大きく濃い */
    for (i = 2; i < n - 1; i += 3) {
      var q1 = a1[i], q2 = a2[i];
      ctx.beginPath();
      ctx.moveTo(q1[0], q1[1]);
      ctx.lineTo(q2[0], q2[1]);
      ctx.strokeStyle = col(BLUE, 0.07 * q1[3]);
      ctx.lineWidth = 1.2;
      ctx.stroke();
      [[q1, BLUE], [q2, INDIGO]].forEach(function (e) {
        var d = (e[0][2] + 1) / 2;
        ctx.beginPath();
        ctx.arc(e[0][0], e[0][1], 1.4 + 1.8 * d, 0, TAU);
        ctx.fillStyle = col(e[1], (0.06 + 0.08 * d) * e[0][3]);
        ctx.fill();
      });
    }
    /* 2本の鎖 */
    [[a1, BLUE], [a2, INDIGO]].forEach(function (e) {
      var s = e[0];
      ctx.beginPath();
      ctx.moveTo(s[0][0], s[0][1]);
      for (var j = 1; j < s.length; j++) { ctx.lineTo(s[j][0], s[j][1]); }
      ctx.strokeStyle = col(e[1], 0.12);
      ctx.lineWidth = SM ? 1.6 : 2;
      ctx.stroke();
    });
    ctx.restore();
  };

  /* ---------- 回路：基板の線と、線の上を走る光。ゆっくり現れて消える ---------- */
  function Wire(first) { this.reset(first); }
  Wire.prototype.reset = function (first) {
    var pts = [[0, 0]], dir = Math.floor(rnd(0, 8)) * Math.PI / 4, x = 0, y = 0, len = 0;
    var segs = Math.floor(rnd(3, 6));
    for (var i = 0; i < segs; i++) {
      var l = SM ? rnd(22, 60) : rnd(30, 90);
      x += Math.cos(dir) * l; y += Math.sin(dir) * l; len += l;
      pts.push([x, y]);
      dir += (Math.random() < 0.5 ? -1 : 1) * Math.PI / 4;
    }
    this.pts = pts;
    this.len = len;
    this.x = rnd(0.05, 0.95) * W;
    this.y = rnd(0.05, 0.95) * H;
    this.vx = rnd(-4, 4);
    this.vy = rnd(-2.5, 2.5);
    this.life = rnd(18, 30);
    this.age = first ? rnd(0, this.life) : 0;
    this.sp = rnd(45, 80);                                /* 光の速さ（px/秒） */
    this.p0 = rnd(0, len);
  };
  Wire.prototype.step = function (dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.age += dt;
    if (this.age > this.life) { this.reset(false); }
  };
  Wire.prototype.at = function (d) {
    var p = this.pts;
    for (var i = 1; i < p.length; i++) {
      var sx = p[i][0] - p[i - 1][0], sy = p[i][1] - p[i - 1][1], sl = Math.sqrt(sx * sx + sy * sy);
      if (d <= sl) { return [p[i - 1][0] + sx * d / sl, p[i - 1][1] + sy * d / sl]; }
      d -= sl;
    }
    return p[p.length - 1];
  };
  Wire.prototype.draw = function (t, oy) {
    var env = Math.max(0, Math.min(1, this.age / 3, (this.life - this.age) / 3));
    if (env <= 0) { return; }
    var p = this.pts, i;
    ctx.save();
    ctx.translate(this.x, wrap(this.y + oy, -120, H + 120));
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(p[0][0], p[0][1]);
    for (i = 1; i < p.length; i++) { ctx.lineTo(p[i][0], p[i][1]); }
    ctx.strokeStyle = col(BLUE, 0.09 * env);
    ctx.lineWidth = 1.6;
    ctx.stroke();
    /* 両端のパッド（丸い端子）と、曲がり角の小さな穴 */
    ctx.lineWidth = 1.6;
    [p[0], p[p.length - 1]].forEach(function (q) {
      ctx.beginPath();
      ctx.arc(q[0], q[1], 4.2, 0, TAU);
      ctx.strokeStyle = col(INDIGO, 0.12 * env);
      ctx.stroke();
    });
    for (i = 1; i < p.length - 1; i += 2) {
      ctx.beginPath();
      ctx.arc(p[i][0], p[i][1], 2.2, 0, TAU);
      ctx.fillStyle = col(BLUE, 0.1 * env);
      ctx.fill();
    }
    /* 線の上を走る光 */
    var g = this.at((this.p0 + t * this.sp) % this.len);
    ctx.beginPath();
    ctx.arc(g[0], g[1], 6, 0, TAU);
    ctx.fillStyle = col(BLUE, 0.06 * env);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(g[0], g[1], 2.6, 0, TAU);
    ctx.fillStyle = col(BLUE, 0.22 * env);
    ctx.fill();
    ctx.restore();
  };

  /* ---------- 大きさ・組み立て・描画 ---------- */
  function size() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth || document.documentElement.clientWidth;
    H = window.innerHeight || document.documentElement.clientHeight;
    cv.width = Math.round(W * DPR);
    cv.height = Math.round(H * DPR);
  }
  function build() {
    SM = W < 700;
    var i, nf = SM ? 2 : 3, nh = SM ? 1 : 2, nw = SM ? 2 : 3;
    fish = []; helices = []; wires = [];
    for (i = 0; i < nw; i++) { wires.push(new Wire(true)); }
    for (i = 0; i < nh; i++) { helices.push(new Helix(true)); }
    for (i = 0; i < nf; i++) { fish.push(new School(true)); }
  }
  function offsetY() {
    /* 少しだけスクロールについてくる（うしろにある感じを出す） */
    return -(window.pageYOffset || document.documentElement.scrollTop || 0) * 0.08;
  }
  function paint(moving) {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var oy = moving ? offsetY() : 0, i;
    for (i = 0; i < wires.length; i++) { wires[i].draw(T, oy); }
    for (i = 0; i < helices.length; i++) { helices[i].draw(T, oy); }
    for (i = 0; i < fish.length; i++) { fish[i].draw(T, oy); }
  }
  function step(dt) {
    var i;
    for (i = 0; i < wires.length; i++) { wires[i].step(dt); }
    for (i = 0; i < helices.length; i++) { helices[i].step(dt); }
    for (i = 0; i < fish.length; i++) { fish[i].step(dt); }
  }

  var running = false, raf = 0, last = 0;
  function frame(now) {
    raf = window.requestAnimationFrame(frame);
    if (now - last < 32) { return; }                      /* 1秒に約30回 */
    var dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    T += dt;
    step(dt);
    paint(true);
  }
  function stopped() { return document.hidden || root.classList.contains('motion-off'); }
  function sync() {
    if (stopped()) {
      if (running) { running = false; window.cancelAnimationFrame(raf); }
      paint(false);
    } else if (!running) {
      running = true;
      last = (window.performance && performance.now()) || 0;
      raf = window.requestAnimationFrame(frame);
    }
  }

  var wasSM = null, rt = 0;
  function onResize() {
    size();
    if ((W < 700) !== wasSM) { build(); wasSM = SM; }      /* スマホとパソコンをまたいだときだけ組み直す */
    if (!running) { paint(false); }
  }
  size();
  build();
  wasSM = SM;
  window.addEventListener('resize', function () { window.clearTimeout(rt); rt = window.setTimeout(onResize, 150); });
  document.addEventListener('visibilitychange', sync);
  if (window.MutationObserver) { new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['class'] }); }
  sync();
})();
