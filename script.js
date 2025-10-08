// Simple tap-to-jump endless runner
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
let DPR = devicePixelRatio || 1;

function resize(){
  canvas.width = Math.floor(canvas.clientWidth * DPR);
  canvas.height = Math.floor(canvas.clientHeight * DPR);
  ctx.scale(DPR, DPR);
}
resize();
window.addEventListener('resize', ()=>{ DPR = devicePixelRatio || 1; resize(); });

const W = () => canvas.clientWidth;
const H = () => canvas.clientHeight;

let groundY = ()=> H() * 0.85;

let player = {
  x: 40, y: 0, vy:0, w:40, h:40, onGround:false
};
let gravity = 0.9;
let jumpPower = -16;
let obstacles = [];
let spawnTimer = 0;
let score = 0;
let speed = 4;
let running = true;
let highscore = 0;

function reset(){
  player.y = groundY() - player.h;
  player.vy = 0;
  obstacles = [];
  spawnTimer = 0;
  score = 0;
  speed = 4;
  running = true;
  document.getElementById('restart').classList.add('hidden');
  document.getElementById('msg').textContent = 'Tap to jump • Hold to boost';
}
reset();

function spawnObstacle(){
  const h = 30 + Math.random()*40;
  obstacles.push({
    x: W() + 40, y: groundY() - h, w: 20 + Math.random()*30, h: h
  });
}

function update(){
  if(!running) return;
  // player physics
  player.vy += gravity;
  player.y += player.vy;
  if(player.y + player.h >= groundY()){
    player.y = groundY() - player.h;
    player.vy = 0;
    player.onGround = true;
  } else player.onGround = false;

  // spawn obstacles
  spawnTimer -= 1;
  if(spawnTimer <= 0){
    spawnObstacle();
    spawnTimer = 60 + Math.floor(Math.random()*60) - Math.floor(score/100);
    if(spawnTimer < 30) spawnTimer = 30;
  }

  // move obstacles
  for(let i=obstacles.length-1;i>=0;i--){
    obstacles[i].x -= speed;
    if(obstacles[i].x + obstacles[i].w < -50) {
      obstacles.splice(i,1);
      score += 10;
      if(score % 100 === 0) speed += 0.5;
    }
  }

  // collision
  for(let ob of obstacles){
    if(rectIntersect(player, ob)){
      gameOver();
    }
  }

  // update UI
  document.getElementById('score').textContent = 'Score: ' + score;
}

function rectIntersect(a,b){
  return !(a.x > b.x + b.w || a.x + a.w < b.x || a.y > b.y + b.h || a.y + a.h < b.y);
}

function draw(){
  // clear
  ctx.clearRect(0,0,canvas.width/DPR,canvas.height/DPR);

  // background
  // sky gradient handled by CSS behind canvas

  // ground
  ctx.fillStyle = '#0b1720';
  ctx.fillRect(0, groundY(), W(), H() - groundY());

  // player
  ctx.fillStyle = '#f97316';
  ctx.fillRect(player.x, player.y, player.w, player.h);

  // obstacles
  ctx.fillStyle = '#94a3b8';
  for(let ob of obstacles){
    ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
  }

  // small shadow
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.fillRect(player.x+6, groundY()+2, player.w-12, 6);
}

function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

function jump(stronger=false){
  if(player.onGround){
    player.vy = jumpPower * (stronger?1.2:1);
    player.onGround = false;
  }
}

function gameOver(){
  running = false;
  document.getElementById('msg').textContent = 'Game Over • Score: ' + score;
  document.getElementById('restart').classList.remove('hidden');
  if(score > highscore) highscore = score;
}

// Controls: touch, click, spacebar
let pointerDown = false;
let holdTimeout = null;

function onDown(e){
  e.preventDefault();
  pointerDown = true;
  // short tap -> normal jump; hold -> stronger jump after 150ms
  holdTimeout = setTimeout(()=>{ jump(true); }, 150);
}
function onUp(e){
  e.preventDefault();
  if(holdTimeout) clearTimeout(holdTimeout);
  if(pointerDown){
    // if player was on ground and no hold triggered, do normal jump
    if(player.onGround) jump(false);
  }
  pointerDown = false;
}

canvas.addEventListener('touchstart', onDown, {passive:false});
canvas.addEventListener('touchend', onUp, {passive:false});
canvas.addEventListener('mousedown', onDown);
canvas.addEventListener('mouseup', onUp);
window.addEventListener('keydown', (e)=>{ if(e.code==='Space') jump(); });

document.getElementById('restart').addEventListener('click', ()=>{ reset(); });

/* Helpful: if page hidden, pause */
document.addEventListener('visibilitychange', ()=>{
  if(document.hidden){ running = false; document.getElementById('msg').textContent='Paused'; }
  else { if(!running) document.getElementById('msg').textContent='Tap to jump • Hold to boost'; running = true; requestAnimationFrame(loop); }
});
