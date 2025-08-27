// Atualiza data
document.getElementById('now').textContent = new Date().toLocaleString('pt-BR', {dateStyle:'short',timeStyle:'short'});

// Canvas setup
const canvas = document.getElementById('court');
const ctx = canvas.getContext('2d');
const W = canvas.width; const H = canvas.height;

// Objetos
const paddleWidth = 12, paddleHeight = 90;
const player = {x:20, y:(H-paddleHeight)/2, w:paddleWidth, h:paddleHeight, score:0};
const cpu = {x:W-20-paddleWidth, y:(H-paddleHeight)/2, w:paddleWidth, h:paddleHeight, score:0};
const ball = {x:W/2, y:H/2, r:8, vx:5, vy:3, speed:6};

let running = false; let aiSkill = 0.7; let maxScore = 7;

function resetBall(direction = 1){
  ball.x = W/2; ball.y = H/2;
  const angle = (Math.random()*Math.PI/4) - Math.PI/8;
  ball.vx = direction * ball.speed * Math.cos(angle);
  ball.vy = ball.speed * Math.sin(angle);
}

function drawCourt(){
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  ctx.fillRect(W/2-1,20,2,H-40);
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(0,10,W,4); ctx.fillRect(0,H-14,W,4);
}

function drawPaddle(p){ ctx.fillStyle='white'; ctx.fillRect(p.x,p.y,p.w,p.h); }
function drawBall(){
  ctx.beginPath();
  const grad = ctx.createRadialGradient(ball.x-3,ball.y-3,2,ball.x,ball.y,16);
  grad.addColorStop(0,'#fff'); grad.addColorStop(1,'#ffd');
  ctx.fillStyle = grad; ctx.arc(ball.x,ball.y,ball.r,0,Math.PI*2); ctx.fill();
}
function drawScore(){
  ctx.fillStyle = '#e6f0ff'; ctx.font = '28px Inter, Arial'; ctx.textAlign='center';
  ctx.fillText(player.score, W*0.25, 40); ctx.fillText(cpu.score, W*0.75, 40);
}
function clamp(v,min,max){return Math.max(min,Math.min(max,v));}

function update(){
  if(!running) return render();

  ball.x += ball.vx; ball.y += ball.vy;

  if(ball.y - ball.r < 14){ ball.y = 14 + ball.r; ball.vy *= -1; }
  if(ball.y + ball.r > H-14){ ball.y = H-14 - ball.r; ball.vy *= -1; }

  function collide(p){
    return (ball.x - ball.r < p.x + p.w && ball.x + ball.r > p.x && ball.y + ball.r > p.y && ball.y - ball.r < p.y + p.h);
  }

  if(collide(player) && ball.vx < 0){
    const relY = (ball.y - (player.y + player.h/2)) / (player.h/2);
    const ang = relY * Math.PI/4;
    const speed = Math.min(10, Math.hypot(ball.vx, ball.vy) * 1.05);
    ball.vx = Math.abs(speed * Math.cos(ang));
    ball.vy = speed * Math.sin(ang);
    ball.x = player.x + player.w + ball.r + 0.1;
  }
  if(collide(cpu) && ball.vx > 0){
    const relY = (ball.y - (cpu.y + cpu.h/2)) / (cpu.h/2);
    const ang = relY * Math.PI/4;
    const speed = Math.min(10, Math.hypot(ball.vx, ball.vy) * 1.05);
    ball.vx = -Math.abs(speed * Math.cos(ang));
    ball.vy = speed * Math.sin(ang);
    ball.x = cpu.x - ball.r - 0.1;
  }

  if(ball.x < -30){ cpu.score++; checkScore(); resetBall(1); }
  if(ball.x > W+30){ player.score++; checkScore(); resetBall(-1); }

  const cpuCenter = cpu.y + cpu.h/2;
  const dir = (ball.y - cpuCenter) * aiSkill;
  cpu.y += clamp(dir, -6, 6);
  cpu.y = clamp(cpu.y, 14, H - 14 - cpu.h);

  render();
}

function checkScore(){
  if(player.score >= maxScore || cpu.score >= maxScore){
    running = false;
    const winner = player.score > cpu.score ? 'Você venceu! 🎉' : 'CPU venceu — tente novamente';
    announce(winner);
  }
}

function render(){ drawCourt(); drawPaddle(player); drawPaddle(cpu); drawBall(); drawScore(); }

const keys = {};
window.addEventListener('keydown', (e)=>{ keys[e.key.toLowerCase()] = true; if(e.key===' '){ e.preventDefault(); togglePlay(); } });
window.addEventListener('keyup', (e)=>{ keys[e.key.toLowerCase()] = false; });

function handleInput(){
  if(keys['w'] || keys['arrowup']){ player.y -= 8; }
  if(keys['s'] || keys['arrowdown']){ player.y += 8; }
  player.y = clamp(player.y, 14, H - 14 - player.h);
}

function loop(){ handleInput(); update(); requestAnimationFrame(loop); }
loop();

const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const difficulty = document.getElementById('difficulty');
const announceBtn = document.getElementById('announceBtn');

startBtn.addEventListener('click', ()=>{ togglePlay(); });
resetBtn.addEventListener('click', resetGame);
difficulty.addEventListener('change', ()=>{ aiSkill = parseFloat(difficulty.value); });

function togglePlay(){
  if(player.score >= maxScore || cpu.score >= maxScore){ resetGame(); }
  running = !running; startBtn.textContent = running ? '⏸ Pausar' : '▶ Jogar';
  if(running) announce('Jogo iniciado. Use W/S ou as setas para mover.');
}
function resetGame(){
  player.score=0; cpu.score=0; resetBall(Math.random()>0.5?1:-1);
  running=false; startBtn.textContent='▶ Jogar'; announce('Jogo reiniciado.');
}

resetBall(Math.random() > 0.5 ? 1 : -1);

function announce(text){
  if('speechSynthesis' in window){
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang='pt-BR';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(msg);
  }
}
announceBtn.addEventListener('click', ()=>{
  announce('Bem-vindo ao mini-jogo de tênis. Use W e S ou as setas para cima e para baixo para mover. Primeiro a 7 pontos vence. Boa sorte!');
});

canvas.setAttribute('tabindex','0');

setInterval(()=>{ document.getElementById('now').textContent = new Date().toLocaleString('pt-BR', {dateStyle:'short',timeStyle:'short'}); },10000);

announce('Mini-jogo pronto. Pressione o botão Instruções para ouvir as regras.');

// ===== ACESSIBILIDADE =====
const accessibilityBtn = document.getElementById("accessibilityBtn");
const instructionsDiv = document.getElementById("instructions");

let highContrast = false;
let largeFont = false;
let altControls = false;

accessibilityBtn.addEventListener("click", () => {
    // Texto das instruções acessíveis
    const text = `
    🎾 Instruções do Jogo de Tênis 🎾
    - Mova sua raquete com W/S ou Setas.
    - O objetivo é marcar 7 pontos primeiro.
    - Você pode ativar alto contraste, aumentar fonte e alternar controles.
    `;

    // Mostrar na tela
    instructionsDiv.innerText = text;

    // Leitura em voz alta
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "pt-BR";
    speechSynthesis.speak(utter);

    // Alternar alto contraste
    highContrast = !highContrast;
    document.body.classList.toggle("high-contrast", highContrast);

    // Alternar fonte maior
    largeFont = !largeFont;
    document.body.classList.toggle("large-font", largeFont);

    // Alternar controles
    altControls = !altControls;
    useAltControls = altControls; // variável no jogo que define W/S ou setas
});