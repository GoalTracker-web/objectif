// Dashboard d'objectifs - stockage local
const STORAGE_KEY = 'dashboard_goals_v1';
let goals = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

const goalsList = document.getElementById('goalsList');
const doneList = document.getElementById('doneList');
const addForm = document.getElementById('addForm');
const modeSelect = document.getElementById('mode');
const countFields = document.getElementById('countFields');
const summaryEl = document.getElementById('summary');
const statsCard = document.getElementById('statsCard');

function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(goals)); render(); }
function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }

function render(){
  // stats
  const total = goals.length;
  const doneCount = goals.filter(g => g.done).length;
  const progressSum = goals.reduce((s,g)=> s + (g.mode==='count' ? (g.current/g.target || 0) : (g.done?1:0)), 0);
  const overall = total ? Math.round((progressSum/total)*100) : 0;
  summaryEl.innerHTML = `${total} objectifs • ${doneCount} accomplis • progression globale ${overall}%`;

  // goals list
  goalsList.innerHTML = '';
  const active = goals.filter(g => !g.archived).sort((a,b)=> (a.deadline||'').localeCompare(b.deadline||''));
  active.forEach(g => {
    const el = document.createElement('div'); el.className='goal';
    const row = document.createElement('div'); row.className='goal-row';
    const left = document.createElement('div');
    left.innerHTML = `<div class="title">${escapeHtml(g.title)}</div>
      <div class="meta">${g.mode==='count' ? (g.current + ' / ' + g.target) : (g.done ? 'Terminé' : 'Non fait')} ${g.deadline ? '• ' + g.deadline : ''}</div>`;
    row.appendChild(left);
    const actions = document.createElement('div');
    // mode-specific controls
    if(g.mode==='bool'){
      const cb = document.createElement('input'); cb.type='checkbox'; cb.checked = !!g.done;
      cb.addEventListener('change', ()=>{ g.done = cb.checked; save(); });
      actions.appendChild(cb);
    } else {
      const inc = document.createElement('button'); inc.className='small'; inc.textContent = '+1';
      inc.addEventListener('click', ()=>{ g.current = (g.current||0) + 1; if(g.current>=g.target) g.done=true; save(); });
      actions.appendChild(inc);
    }
    const edit = document.createElement('button'); edit.className='icon-btn'; edit.textContent='✎';
    edit.addEventListener('click', ()=>{ editGoal(g.id); });
    const del = document.createElement('button'); del.className='icon-btn'; del.textContent='🗑';
    del.addEventListener('click', ()=>{ if(confirm('Supprimer cet objectif ?')){ goals = goals.filter(x=>x.id!==g.id); save(); } });
    actions.appendChild(edit); actions.appendChild(del);
    row.appendChild(actions);
    el.appendChild(row);

    if(g.mode==='count'){
      const p = document.createElement('div'); p.className='progress';
      const perc = Math.min(100, Math.round((g.current/g.target)*100) || 0);
      p.innerHTML = `<i style="width:${perc}%"></i>`;
      el.appendChild(p);
    }
    goalsList.appendChild(el);
  });

  // done list
  doneList.innerHTML = '';
  goals.filter(g=>g.done && !g.archived).forEach(g=>{
    const li = document.createElement('li'); li.className='doneItem';
    li.innerHTML = `<span>${escapeHtml(g.title)} ${g.mode==='count' ? `(${g.current}/${g.target})` : ''}</span>`;
    const a = document.createElement('button'); a.textContent='Archiver'; a.className='small';
    a.addEventListener('click', ()=>{ g.archived = true; save(); });
    li.appendChild(a);
    doneList.appendChild(li);
  });

  // stats card
  statsCard.innerHTML = `<div><strong>Total</strong>: ${total}</div><div><strong>Accomplis</strong>: ${doneCount}</div><div><strong>Global</strong>: ${overall}%</div>`;
}

function editGoal(id){
  const g = goals.find(x=>x.id===id);
  const newTitle = prompt('Modifier le titre', g.title);
  if(newTitle===null) return;
  g.title = newTitle.trim() || g.title;
  if(g.mode==='count'){
    const ncur = prompt('Valeur actuelle', g.current||0);
    const nt = prompt('Valeur cible', g.target||1);
    g.current = Number(ncur) || 0; g.target = Number(nt) || g.target;
    if(g.current>=g.target) g.done = true;
  }
  save();
}

function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }

addForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  const title = document.getElementById('title').value.trim();
  const mode = document.getElementById('mode').value;
  const deadline = document.getElementById('deadline').value || '';
  const current = Number(document.getElementById('current')?.value || 0);
  const target = Number(document.getElementById('target')?.value || 0);
  const g = { id: uid(), title, mode, deadline, archived:false, done:false };
  if(mode==='count'){ g.current = current; g.target = target || 1; if(g.current>=g.target) g.done=true; }
  goals.push(g);
  save();
  addForm.reset();
  document.getElementById('current').value = ''; document.getElementById('target').value = '';
});

modeSelect.addEventListener('change', ()=>{
  countFields.style.display = modeSelect.value==='count' ? 'flex' : 'none';
});

document.getElementById('clearAll').addEventListener('click', ()=>{
  if(confirm('Supprimer tous les objectifs ?')){ goals=[]; save(); }
});

render(); // initial render
