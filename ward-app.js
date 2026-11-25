(function () {
  'use strict';

  const state = {
    currentRoom: '401',
    shutterOpen: false,
    room404Drop: false,
    tapeMode: 'stop', // 'stop' | 'fwd' | 'rev'
    tapeAngle: 0,
    keyAFound: false,
    keyBFound: false,
    hintClicks: 0
  };

  const ROOM_LOGS = {
    '401': {
      title: '探视窗目标：401 病房 · 失眠患者赵某',
      chart:
        '<strong>【1998.11.13 23:40 护理记录】</strong> 患者入院前曾误入云溪县断魂岭采药。近三日彻夜不眠，反复用指甲抓挠左前臂，声称“血管里长出了硬邦邦的细竹篾”。<br/>' +
        '<strong>【03:17 巡房补记】</strong> 患者突然停止抓挠，端坐床头对铁门微笑，双颊浮现两团对称深红斑块，手电筒直射瞳孔无任何收缩反应。'
    },
    '402': {
      title: '探视窗目标：402 病房 · 双人睡眠剥夺观察室',
      chart:
        '<strong>【1998.11.14 01:20 多导睡眠图记录】</strong> 沈槐主任在病房内试播 <code>#W4-9811</code> 降噪母带（18.98Hz）。两张病床相隔四米，两名素不相识的患者在 4 分钟内呼吸起伏达到 <strong>100.00% 绝对同相</strong>。<br/>' +
        '<strong>【02:55 异常】</strong> 监护仪显示病房内出现<strong>第三条、第四条</strong>完全重合的胸腔阻抗波形，位置分别来自病房衣柜夹缝与床板下方。'
    },
    '403': {
      title: '探视窗目标：403 室 · 声学技师值班台（空置）',
      chart:
        '<strong>【保卫科事后勘查记录】</strong> 24岁实习声学技师<strong>陆承安</strong>于封院当晚 02:50 擅自打开防磁柜，盗走 <code>#W4-9811</code> 母带第 3 号备份盘及《伴睡声纹滤波算法手稿》，从消防通道逃离。<br/>' +
        '<span style="color:#8c1d1d; font-weight:700;">【2026 跨时代批注】 经核查工商底档，陆承安于二十五年后在杭州注册成立“安隅智能声学科技”，推出爆款独居助眠硬件——眠栖 S3。</span>'
    },
    '404': {
      title: '⚠ 探视窗目标：404 特级隔离室 · 祠山幸存者顾言 (#96-0715)',
      chart:
        '<strong>【沈槐主任亲笔封条】</strong> 患者系 1994 年云溪县祠山镇“七一五纸人案”唯一逃出山口之活人，入院时双腿膝盖以下已呈桑皮纸质化。<br/>' +
        '<strong style="color:#9e1f1f;">警告：严禁在 03:17 拉开 404 室铁门探视滑盖！患者昨晚用指甲在铁滑盖内侧刻下了一串四位频段数字……</strong>'
    }
  };

  // =========================================================================
  // 1. CROSS-SITE LOCALSTORAGE TELEMETRY BAR (SHARED ORIGIN MAGIC!)
  // =========================================================================
  function syncCrossSiteStatus() {
    localStorage.setItem('ward4_visited', '1');

    const anyuAssimilated = localStorage.getItem('anyu_assimilated') === '1';
    const cishanCursed = localStorage.getItem('cishan_cursed') === '1';
    const purified = localStorage.getItem('trilogy_purified') === '1';

    const nodeCishan = document.getElementById('node-cishan');
    const nodeAnyu = document.getElementById('node-anyu');
    const gateReport = document.getElementById('gate-cross-site-report');

    if (purified) {
      document.body.classList.add('purified-universe');
      nodeCishan.className = 'node-pill purified';
      nodeCishan.textContent = '[1994 源头] 祠山非遗馆: 已净化';
      nodeAnyu.className = 'node-pill purified';
      nodeAnyu.textContent = '[2026 终端] 安隅眠栖S3: 已净化';
      gateReport.innerHTML = '✓ 跨节点状态：1998 一号母带已完成强磁销毁，三站诅咒链路处于【已净化】状态。';
      return;
    }

    if (cishanCursed) {
      nodeCishan.classList.add('infected');
      nodeCishan.textContent = '⚠ [1994 源头] 祠山: 已立死契';
    } else {
      nodeCishan.textContent = '[1994 源头] 祠山非遗馆: 待勘查';
    }

    if (anyuAssimilated) {
      nodeAnyu.classList.add('infected');
      nodeAnyu.textContent = '⚠ [2026 终端] 安隅: 已被同频';
    } else {
      nodeAnyu.textContent = '[2026 终端] 安隅眠栖S3: 待勘查';
    }

    const lines = [];
    if (anyuAssimilated) {
      lines.push('⚠ 检出《安隅·眠栖S3》污染印记：您的现代卧室终端已被第 12,409 号伴睡体锁定！');
    }
    if (cishanCursed) {
      lines.push('⚠ 检出《寻梦祠山》朱砂死契：您已在古镇点亮纸童双睛并误焚黄表纸！');
    }
    if (!lines.length) {
      lines.push('● 跨站扫描完毕：尚未检出重度终端污染（可随时点击顶部导航跨站勘查 1994 祠山与 2026 安隅）。');
    }
    gateReport.innerHTML = lines.join('<br/>');
  }

  // =========================================================================
  // 2. BOOT & TOP CONTROLS
  // =========================================================================
  function setupBoot() {
    document.getElementById('enter-ward-btn').addEventListener('click', () => {
      window.wardAudio.init(false);
      document.getElementById('his-gate').classList.add('hidden');
    });
    document.getElementById('enter-ward-mild').addEventListener('click', () => {
      window.wardAudio.init(true);
      document.getElementById('his-gate').classList.add('hidden');
      document.getElementById('ward-mute-btn').textContent = '🔉 低刺激音';
    });
    document.getElementById('ward-mute-btn').addEventListener('click', () => {
      const on = window.wardAudio.toggleMute();
      document.getElementById('ward-mute-btn').textContent = on ? '🔊 监护音: 开' : '🔇 监护音: 静';
    });
    document.getElementById('reset-universe-btn').addEventListener('click', () => {
      localStorage.removeItem('anyu_assimilated');
      localStorage.removeItem('cishan_cursed');
      localStorage.removeItem('trilogy_purified');
      localStorage.removeItem('ward4_fallen');
      window.location.reload();
    });
  }

  // =========================================================================
  // 3. MODULE A: WARD ROOMS & IRON DOOR OBSERVATION SLIT CANVAS
  // =========================================================================
  function setupWardPeepSlot() {
    const canvas = document.getElementById('ward-peep-canvas');
    const ctx = canvas.getContext('2d');
    const shutterBtn = document.getElementById('slide-shutter-btn');
    const label = document.getElementById('peep-room-label');
    const chart = document.getElementById('ward-chart-text');

    function selectRoom(room) {
      state.currentRoom = room;
      state.shutterOpen = false;
      state.room404Drop = false;
      shutterBtn.textContent = '拉开铁门探视滑盖';
      const info = ROOM_LOGS[room];
      label.textContent = info.title;
      chart.innerHTML = info.chart;
    }
    selectRoom('401');

    document.querySelectorAll('.room-cell').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.room-cell').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        window.wardAudio.playIronDoorSlam(-0.3, false);
        selectRoom(btn.getAttribute('data-room'));
      });
    });

    shutterBtn.addEventListener('click', () => {
      state.shutterOpen = !state.shutterOpen;
      window.wardAudio.playIronDoorSlam(0.4, false);
      shutterBtn.textContent = state.shutterOpen ? '关闭铁门探视滑盖' : '拉开铁门探视滑盖';

      if (state.shutterOpen && state.currentRoom === '404' && !state.room404Drop) {
        // After 1.05s of looking at an empty hospital bed, upside-down paper-skinned face drops into the slot!!
        setTimeout(() => {
          if (!state.shutterOpen || state.currentRoom !== '404') return;
          state.room404Drop = true;
          window.wardAudio.playIronDoorSlam(0, true);
          window.wardAudio.startECG(138);
          state.keyAFound = true;
          document.getElementById('vault-key-a').value = '1898';
          label.innerHTML = '<strong style="color:#ff6b6b;">⚠ 患者倒挂在门框上方！！铁盖背面抓痕显出频段码：1898</strong>';
        }, 950);
      }
    });

    function renderSlot() {
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = '#101715';
      ctx.fillRect(0, 0, w, h);

      // Heavy riveted hospital steel door background
      ctx.strokeStyle = '#263832';
      ctx.lineWidth = 3;
      ctx.strokeRect(20, 16, w - 40, h - 32);

      // Slit viewport window (x: 110..450, y: 52..168)
      ctx.save();
      ctx.beginPath();
      ctx.rect(110, 52, 340, 116);
      ctx.clip();

      if (!state.shutterOpen) {
        // Closed brushed-steel sliding plate
        ctx.fillStyle = '#1b2824';
        ctx.fillRect(110, 52, 340, 116);
        ctx.fillStyle = '#6c8a80';
        ctx.font = '13px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`[ 病房 ${state.currentRoom} 铁质探视滑盖已锁闭 — 点击右上按钮拉开 ]`, 280, 115);
      } else {
        // Inside the dimly lit green hospital room
        ctx.fillStyle = '#0a1410';
        ctx.fillRect(110, 52, 340, 116);

        // Hospital iron bedframe in background
        ctx.fillStyle = '#cdd6d0';
        ctx.fillRect(180, 128, 190, 26);
        ctx.strokeStyle = '#4c635b';
        ctx.strokeRect(180, 112, 190, 48);

        if (state.currentRoom === '401' || state.currentRoom === '402') {
          // Stiff sitting silhouette on bed with unblinking eyes
          ctx.fillStyle = '#dce3de';
          ctx.fillRect(256, 92, 36, 40);
          ctx.beginPath();
          ctx.arc(274, 78, 13, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#b82525';
          ctx.fillRect(265, 79, 4, 4);
          ctx.fillRect(279, 79, 4, 4);
        } else if (state.currentRoom === '403') {
          ctx.fillStyle = '#7fa396';
          ctx.font = '12px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('防磁母带柜敞开 · 第 3 号拷贝盘遗失', 280, 102);
        } else if (state.currentRoom === '404') {
          if (!state.room404Drop) {
            ctx.fillStyle = '#7fa396';
            ctx.font = '12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('病床空置……天花板通风管有纸张摩擦声……', 280, 96);
          } else {
            // UPSIDE-DOWN PALE PAPER-SKINNED FACE PRESSED AGAINST OBSERVATION GLASS!
            ctx.fillStyle = '#ebe5d8';
            ctx.beginPath();
            ctx.arc(280, 96, 56, 0, Math.PI * 2);
            ctx.fill();

            // Vermilion cheek spots
            ctx.fillStyle = 'rgba(185, 24, 24, 0.78)';
            ctx.beginPath();
            ctx.arc(242, 82, 14, 0, Math.PI * 2);
            ctx.arc(318, 82, 14, 0, Math.PI * 2);
            ctx.fill();

            // Upside-down wide hollow eyes staring right through the slit!
            [256, 304].forEach((ex) => {
              ctx.fillStyle = '#090707';
              ctx.beginPath();
              ctx.ellipse(ex, 112, 13, 8, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#ff3b3b';
              ctx.beginPath();
              ctx.arc(ex, 112, 3.5, 0, Math.PI * 2);
              ctx.fill();
            });

            // Scratched blood digits on glass: 1898
            ctx.fillStyle = '#ff4d4d';
            ctx.font = 'bold 20px monospace';
            ctx.textAlign = 'left';
            ctx.fillText('1898', 124, 156);
          }
        }

        // Wire-mesh safety glass grid
        ctx.strokeStyle = 'rgba(160, 190, 175, 0.15)';
        ctx.lineWidth = 1;
        for (let x = 110; x < 450; x += 22) {
          ctx.beginPath();
          ctx.moveTo(x, 52);
          ctx.lineTo(x, 168);
          ctx.stroke();
        }
      }
      ctx.restore();

      // Heavy steel slot frame border
      ctx.strokeStyle = '#48665c';
      ctx.lineWidth = 5;
      ctx.strokeRect(110, 52, 340, 116);

      requestAnimationFrame(renderSlot);
    }
    renderSlot();
  }

  // =========================================================================
  // 4. MODULE B: OPEN-REEL MAGNETIC TAPE & BAMBOO X-RAY FLUOROSCOPY
  // =========================================================================
  function setupLabInstruments() {
    const tCanvas = document.getElementById('tape-canvas');
    const tCtx = tCanvas.getContext('2d');
    const modeLabel = document.getElementById('tape-mode-label');
    const transcript = document.getElementById('tape-transcript');

    document.getElementById('play-fwd-btn').addEventListener('click', () => {
      state.tapeMode = 'fwd';
      modeLabel.textContent = '▶ PLAYING FORWARD (18.98Hz)';
      window.wardAudio.playReelTape(false);
      transcript.innerHTML =
        `<strong>[正放录音 · 1998.11.13 沈槐问诊顾言]</strong><br/>` +
        `顾言（声音嘶哑如砂纸摩擦）：“沈主任，快把录音机关了！祠山的纸人根本不是靠法术活的，是靠那口铜瓮里的 18.98Hz 驻波借活人呼吸！刚才那个叫<strong>陆承安</strong>的实习生把第 3 号磁带揣进白大褂口袋了——如果他把这段声波做成助眠器卖进城里，二十年后千家万户的衣柜缝里都会长出替身！！”`;
      setTimeout(() => {
        if (state.tapeMode === 'fwd') state.tapeMode = 'stop';
      }, 3200);
    });

    document.getElementById('play-rev-btn').addEventListener('click', () => {
      state.tapeMode = 'rev';
      modeLabel.textContent = '◀ REVERSE DECODING (-18dB)';
      window.wardAudio.playReelTape(true);
      state.keyBFound = true;
      document.getElementById('vault-key-b').value = '0715';
      transcript.innerHTML =
        `<strong style="color:#ff7b7b;">[倒放磁带底噪显影 · 十四人齐声低语]</strong><br/>` +
        `“……一号母带锁在地下二层消磁柜……声学频段码 <strong>1898</strong>……祠山封山病案码 <strong>0715</strong>……千万别听母带最后十七秒……”`;
      setTimeout(() => {
        if (state.tapeMode === 'rev') state.tapeMode = 'stop';
      }, 3200);
    });

    function drawTapeDeck() {
      const w = tCanvas.width;
      const h = tCanvas.height;
      tCtx.fillStyle = '#080d0b';
      tCtx.fillRect(0, 0, w, h);

      if (state.tapeMode === 'fwd') state.tapeAngle += 0.07;
      else if (state.tapeMode === 'rev') state.tapeAngle -= 0.11;

      [145, 335].forEach((rx) => {
        tCtx.save();
        tCtx.translate(rx, 96);
        tCtx.rotate(state.tapeAngle);
        tCtx.strokeStyle = '#6f9487';
        tCtx.lineWidth = 3;
        tCtx.beginPath();
        tCtx.arc(0, 0, 58, 0, Math.PI * 2);
        tCtx.stroke();

        tCtx.fillStyle = '#291c18';
        tCtx.beginPath();
        tCtx.arc(0, 0, 44, 0, Math.PI * 2);
        tCtx.fill();

        // 3 metal reel spokes
        for (let i = 0; i < 3; i++) {
          const a = (i * Math.PI * 2) / 3;
          tCtx.strokeStyle = '#9ab8ad';
          tCtx.lineWidth = 5;
          tCtx.beginPath();
          tCtx.moveTo(0, 0);
          tCtx.lineTo(Math.cos(a) * 56, Math.sin(a) * 56);
          tCtx.stroke();
        }
        tCtx.restore();
      });

      // Magnetic tape path across read head
      tCtx.strokeStyle = '#8c533e';
      tCtx.lineWidth = 2;
      tCtx.beginPath();
      tCtx.moveTo(145, 154);
      tCtx.lineTo(240, 178);
      tCtx.lineTo(335, 154);
      tCtx.stroke();

      tCtx.fillStyle = state.tapeMode === 'rev' ? '#d94848' : '#52b788';
      tCtx.fillRect(226, 172, 28, 16);

      requestAnimationFrame(drawTapeDeck);
    }
    drawTapeDeck();

    // X-Ray Bamboo Ribcage Fluoroscopy
    const xCanvas = document.getElementById('xray-canvas');
    const xCtx = xCanvas.getContext('2d');
    const xSlider = document.getElementById('xray-slider');
    const kvReadout = document.getElementById('kv-readout');
    const xFinding = document.getElementById('xray-finding');

    function renderXRay() {
      const kv = Number(xSlider.value);
      const norm = (kv - 45) / 70; // 0.0 -> 1.0
      kvReadout.textContent =
        kv >= 95 ? `${kv} kV (高穿透骨髓显影 · 异常检出)` : `${kv} kV (常规胸透)`;

      if (kv >= 95) {
        xFinding.innerHTML =
          `<span style="color:#ff7b7b;">⚠ 病理警报：心影完全消失！患者双侧肋骨髓腔内检出交错编织的【六角细竹篾骨架】，与 1994 祠山纸人及 2026 安隅毫米波重影特征 100% 吻合！</span>`;
      }

      const w = xCanvas.width;
      const h = xCanvas.height;
      xCtx.fillStyle = '#04080a';
      xCtx.fillRect(0, 0, w, h);

      // Spine & Thoracic Rib Pairs
      xCtx.strokeStyle = `rgba(190, 225, 235, ${0.72 - norm * 0.25})`;
      xCtx.lineWidth = 10;
      xCtx.beginPath();
      xCtx.moveTo(w / 2, 18);
      xCtx.lineTo(w / 2, h - 18);
      xCtx.stroke();

      xCtx.lineWidth = 6;
      for (let i = 0; i < 6; i++) {
        const y = 38 + i * 26;
        const span = 85 + Math.sin((i / 5) * Math.PI) * 48;
        // Left & right ribs
        [-1, 1].forEach((dir) => {
          xCtx.beginPath();
          xCtx.moveTo(w / 2, y);
          xCtx.quadraticCurveTo(w / 2 + dir * span, y + 4, w / 2 + dir * (span * 0.72), y + 20);
          xCtx.stroke();
        });
      }

      // High-KV Reveal: Woven Cishan Bamboo-Strip Lattice inside the chest!
      if (norm > 0.25) {
        const alpha = Math.min(0.92, (norm - 0.25) * 1.3);
        xCtx.strokeStyle = `rgba(235, 95, 85, ${alpha})`;
        xCtx.lineWidth = 1.6;
        for (let x = 155; x <= 325; x += 18) {
          xCtx.beginPath();
          xCtx.moveTo(x, 32);
          xCtx.lineTo(x + 28, 182);
          xCtx.moveTo(x + 28, 32);
          xCtx.lineTo(x, 182);
          xCtx.stroke();
        }
      }
    }

    xSlider.addEventListener('input', () => {
      renderXRay();
      if (window.wardAudio && window.wardAudio.ctx) {
        window.wardAudio.playIronDoorSlam(0, false);
      }
    });
    renderXRay();
  }

  // =========================================================================
  // 5. MODULE C: GRAND TRILOGY DEMAGNETIZER VAULT & UNIVERSE ENDINGS
  // =========================================================================
  function setupTrilogyVault() {
    const keyA = document.getElementById('vault-key-a');
    const keyB = document.getElementById('vault-key-b');
    const msg = document.getElementById('vault-msg');
    const choices = document.getElementById('vault-final-choices');

    document.getElementById('unlock-vault-btn').addEventListener('click', () => {
      const a = keyA.value.trim();
      const b = keyB.value.trim();
      if (a === '1898' && b === '0715') {
        window.wardAudio.playIronDoorSlam(0, true);
        msg.style.color = '#84d9a0';
        msg.textContent = '✓ 跨站双钥核验通过！地下二层一号防磁柜已解锁。';
        choices.style.display = 'block';
      } else {
        window.wardAudio.playIronDoorSlam(-0.7, false);
        msg.style.color = '#ff8080';
        msg.textContent =
          '✗ 双钥不匹配：密令 A 为声学频段码 (1898)，密令 B 为祠山封山码 (0715)。';
      }
    });

    document.getElementById('vault-autofill-btn').addEventListener('click', () => {
      state.hintClicks++;
      if (state.hintClicks === 1 && (!state.keyAFound || !state.keyBFound)) {
        msg.style.color = '#e6b85c';
        msg.textContent =
          '提示：拉开 404 病房探视窗可得 1898；倒放磁带（或前往《寻梦祠山》看花轿）可得 0715。再点一次自动填入。';
      } else {
        keyA.value = '1898';
        keyB.value = '0715';
        msg.style.color = '#84d9a0';
        msg.textContent = '已自动汇总跨站双钥（1898 / 0715），点击左侧【核验双钥】即可开启总闸。';
      }
    });

    // TRUE UNIVERSE PURIFICATION ENDING
    document.getElementById('purify-universe-btn').addEventListener('click', () => {
      window.wardAudio.playDemagnetizeSurge();
      // Purge curses across ALL THREE SITES in shared github.io localStorage!
      localStorage.removeItem('anyu_assimilated');
      localStorage.removeItem('cishan_cursed');
      localStorage.setItem('trilogy_purified', '1');
      syncCrossSiteStatus();

      const overlay = document.getElementById('ward-climax');
      const card = document.getElementById('climax-card');
      overlay.classList.add('active');
      document.getElementById('climax-tag').style.color = '#7cc6fe';
      document.getElementById('climax-tag').textContent = '● TRILOGY TRUE ENDING · 三站诅咒源头已彻底抹除';
      document.getElementById('climax-title').textContent = '4000 高斯消磁完成：18.98Hz 驻波归于寂静。';
      document.getElementById('climax-desc').innerHTML =
        '随着地下二层强磁线圈合闸，<code>#W4-9811</code> 母带上的磁粉彻底归零，浸泡在古井冷水中的宗祠铜瓮停止了持续三十二年的嗡鸣。<br/><br/>' +
        '远在杭州的 12,408 台「安隅眠栖 S3」指示灯同时熄灭；祠山古镇网页上的扎彩纸童也缓缓合上了双眼。<br/><br/>' +
        '<strong>【跨站联动已生效】</strong> 您浏览器中《安隅》与《寻梦祠山》的污染存档已被同步净化！现在点击下方按钮回访另外两座网站，可验证诅咒已解除。';
      card.style.display = 'block';
    });

    // TOTAL UNIVERSE ASSIMILATION BAD ENDING
    document.getElementById('listen-17s-btn').addEventListener('click', () => {
      // Infect ALL THREE SITES simultaneously in shared localStorage!
      localStorage.removeItem('trilogy_purified');
      localStorage.setItem('anyu_assimilated', '1');
      localStorage.setItem('cishan_cursed', '1');
      localStorage.setItem('ward4_fallen', '1');
      syncCrossSiteStatus();

      const overlay = document.getElementById('ward-climax');
      const cCanvas = document.getElementById('ward-climax-canvas');
      const card = document.getElementById('climax-card');
      overlay.classList.add('active');

      window.wardAudio.triggerWardBreach(() => {
        cCanvas.width = window.innerWidth;
        cCanvas.height = window.innerHeight;
        const ctx = cCanvas.getContext('2d');
        let f = 0;

        const anim = setInterval(() => {
          ctx.fillStyle = f % 2 === 0 ? '#070404' : '#260808';
          ctx.fillRect(0, 0, cCanvas.width, cCanvas.height);

          // Dual horror convergence: Hospital ECG Flatline + Giant Paper/Night-Vision Eyes!
          const cx = cCanvas.width / 2;
          const cy = cCanvas.height / 2;
          ctx.strokeStyle = '#ff2e2e';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(0, cy + 120);
          ctx.lineTo(cCanvas.width, cy + 120);
          ctx.stroke();

          [-110, 110].forEach((ox) => {
            ctx.fillStyle = '#f2ece1';
            ctx.beginPath();
            ctx.ellipse(cx + ox, cy - 20, 68, 34, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#090505';
            ctx.beginPath();
            ctx.arc(cx + ox, cy - 20, 22, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ff3838';
            ctx.beginPath();
            ctx.arc(cx + ox, cy - 20, 5, 0, Math.PI * 2);
            ctx.fill();
          });
          f++;
        }, 65);

        setTimeout(() => {
          clearInterval(anim);
          ctx.fillStyle = '#060303';
          ctx.fillRect(0, 0, cCanvas.width, cCanvas.height);
          card.style.borderColor = '#d63030';
          document.getElementById('climax-tag').style.color = '#ff6b6b';
          document.getElementById('climax-tag').textContent = '⚠ TOTAL CONTAMINATION · 三站全线沦陷（坏结局）';
          document.getElementById('climax-title').textContent = '第十五张病床已经替你铺好了。';
          document.getElementById('climax-desc').innerHTML =
            '母带最后 17 秒根本不是空白——那是你的呼吸声。<br/><br/>' +
            '<strong>【跨站全局感染已触发】</strong> 现在不仅四院内网已将你录入病历，你浏览器里的<strong>《安隅眠栖 S3》</strong>与<strong>《寻梦祠山》</strong>也已同时进入被替身接管的沦陷态！不信的话，点下面去另外两个网站看看……';
          card.style.display = 'block';
        }, 1650);
      });
    });

    document.getElementById('climax-close-btn').addEventListener('click', () => {
      document.getElementById('ward-climax').classList.remove('active');
    });
  }

  // INIT
  syncCrossSiteStatus();
  setupBoot();
  setupWardPeepSlot();
  setupLabInstruments();
  setupTrilogyVault();
})();
