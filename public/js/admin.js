/* ===================================================================
   TaskSKA — Admin Portal SPA
   =================================================================== */
const A = {
  token:null,
  async call(method,path,body){
    const h={'Content-Type':'application/json'};
    if(this.token) h['Authorization']='Bearer '+this.token;
    const res=await fetch('/api'+path,{method,headers:h,body:body?JSON.stringify(body):undefined});
    const txt=await res.text(); let data=null; try{data=txt?JSON.parse(txt):null}catch(e){data=txt}
    if(!res.ok) throw new Error((data&&data.message)?data.message:('Request failed ('+res.status+')'));
    return data;
  },
  get(p){return this.call('GET',p)}, post(p,b){return this.call('POST',p,b)}, del(p){return this.call('DELETE',p)}
};
function esc(s){return (s==null?'':String(s)).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function initials(n){return (n||'?').split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase();}
function toast(m){const r=document.getElementById('toastRoot');const t=document.createElement('div');t.className='toast';t.textContent=m;r.appendChild(t);setTimeout(()=>t.remove(),3000);}

const Admin = {
  page:'overview',
  alert(type,msg){const el=document.getElementById('adminAlert');el.className='alert '+type;el.innerHTML=msg;el.classList.remove('hidden');},

  pendingEmail:null,
  async login(){
    try{
      const email=document.getElementById('a_email').value.trim();
      this.pendingEmail=email;
      const r=await A.post('/auth/admin-login',{email,password:document.getElementById('a_pass').value});
      if(r.token){ A.token=r.token; this.start(); return; }
      if(r.devCode){ // demo console-fallback: auto-complete the MFA step
        const v=await A.post('/auth/verify-otp',{email,code:r.devCode});
        A.token=v.token; this.start(); return;
      }
      // production: a code was emailed — prompt for it
      this.promptOtp();
    }catch(e){ this.alert('err',e.message); }
  },
  promptOtp(){
    document.getElementById('a_email').parentElement.parentElement;
    this.alert('info','A 6-digit code was sent to your email. Enter it below.');
    const card=document.querySelector('#adminAuth .auth-card');
    card.querySelectorAll('.field').forEach(f=>f.classList.add('hidden'));
    if(!document.getElementById('a_otp_field')){
      const div=document.createElement('div');
      div.id='a_otp_field'; div.className='field';
      div.innerHTML='<label>Authentication code</label><input id="a_otp" placeholder="000000" maxlength="6" style="letter-spacing:8px;font-size:20px;text-align:center">';
      card.querySelector('#adminAlert').after(div);
      const btn=card.querySelector('button'); btn.textContent='Verify & sign in';
      btn.setAttribute('onclick','Admin.verifyOtp()');
    }
  },
  async verifyOtp(){
    try{ const v=await A.post('/auth/verify-otp',{email:this.pendingEmail,code:document.getElementById('a_otp').value.trim()});
      A.token=v.token; this.start(); }
    catch(e){ this.alert('err',e.message); }
  },
  logout(){ A.token=null; location.reload(); },

  start(){
    document.getElementById('adminAuth').classList.add('hidden');
    document.getElementById('adminApp').classList.remove('hidden');
    document.getElementById('adminNav').innerHTML=[
      ['overview','&#9632;','Overview'],['users','&#128101;','Users'],['workload','&#128202;','Team workload']
    ].map(i=>`<a href="#" data-p="${i[0]}" onclick="Admin.go('${i[0]}');return false"><span class="ic">${i[1]}</span>${i[2]}</a>`).join('');
    this.go('overview');
  },
  go(p){
    this.page=p;
    document.querySelectorAll('#adminNav a').forEach(a=>a.classList.toggle('active',a.dataset.p===p));
    document.getElementById('adTitle').textContent={overview:'Overview',users:'User Management',workload:'Team Workload'}[p];
    ({overview:this.overview,users:this.users,workload:this.workload})[p].call(this);
  },

  async overview(){
    const el=document.getElementById('adContent'); el.innerHTML='<div class="empty"><div class="big">&#8987;</div>Loading…</div>';
    try{
      const s=await A.get('/admin/stats');
      const sb=s.tasksByStatus||{};
      el.innerHTML=`
        <div class="stat-grid">
          <div class="stat"><div class="ic">&#128101;</div><div class="n">${s.totalUsers}</div><div class="l">Total users</div></div>
          <div class="stat"><div class="ic">&#9776;</div><div class="n">${s.totalTasks}</div><div class="l">Total tasks</div></div>
          <div class="stat"><div class="ic">&#9888;</div><div class="n">${s.overdueTasks}</div><div class="l">Overdue tasks</div></div>
          <div class="stat"><div class="ic">&#9203;</div><div class="n">${s.pendingUsers}</div><div class="l">Unverified users</div></div>
          <div class="stat"><div class="ic">&#128279;</div><div class="n">${s.openConnections}</div><div class="l">Pending connections</div></div>
        </div>
        <div class="cards" style="grid-template-columns:1fr 1fr">
          <div class="card pad"><div class="section-h"><h2>Users by role</h2></div>
            ${this.bar('Taskmasters',s.taskmasters,s.totalUsers)}
            ${this.bar('Taskers',s.taskers,s.totalUsers)}
            ${this.bar('Auditors',s.auditors,s.totalUsers)}
          </div>
          <div class="card pad"><div class="section-h"><h2>Tasks by status</h2></div>
            ${Object.keys(sb).map(k=>`<div class="wl-row"><span class="pill ${k}">${k.replace(/_/g,' ')}</span>
              <div style="flex:1"></div><b>${sb[k]}</b></div>`).join('')}
          </div>
        </div>`;
    }catch(e){ el.innerHTML=`<div class="alert err">${esc(e.message)}</div>`; }
  },
  bar(label,n,total){ const pct=total?Math.round(n/total*100):0;
    return `<div class="wl-row"><div style="width:120px;font-weight:600">${label}</div>
      <div class="wl-bar"><span class="MEDIUM" style="background:var(--blue-500);width:${pct}%"></span></div>
      <div style="width:40px;text-align:right"><b>${n}</b></div></div>`; },

  async users(){
    const el=document.getElementById('adContent'); el.innerHTML='<div class="empty"><div class="big">&#8987;</div>Loading…</div>';
    try{
      const list=await A.get('/admin/users');
      el.innerHTML=`<div class="card"><table>
        <thead><tr><th>User</th><th>Role</th><th>Status</th><th>Active</th><th>Created</th><th></th></tr></thead>
        <tbody>${list.map(v=>{
          const u=v.user; const isAdmin=u.role==='ADMIN';
          return `<tr>
            <td><div style="display:flex;align-items:center;gap:10px"><div class="avatar">${initials(u.fullName)}</div>
              <div><div style="font-weight:600">${esc(u.fullName)}</div><div style="font-size:12px;color:var(--muted)">${esc(u.email)}</div></div></div></td>
            <td>${isAdmin?`<span class="pill IN_PROGRESS">ADMIN</span>`:`<select onchange="Admin.setRole(${u.id},this.value)" style="padding:6px 8px;border:1px solid var(--line);border-radius:8px">
              ${['TASKMASTER','TASKER','AUDITOR'].map(r=>`<option ${u.role===r?'selected':''}>${r}</option>`).join('')}</select>`}</td>
            <td>${u.enabled?'<span class="pill COMPLETED">Active</span>':'<span class="pill OVERDUE">Disabled</span>'}</td>
            <td>${v.activeTasks} / ${v.createdTasks} created</td>
            <td style="font-size:13px;color:var(--muted)">${u.createdAt?new Date(u.createdAt).toLocaleDateString():'—'}</td>
            <td style="text-align:right;white-space:nowrap">${isAdmin?'<span style="color:var(--muted);font-size:12px">protected</span>':`
              <button class="btn sm ghost" onclick="Admin.toggle(${u.id},${!u.enabled})">${u.enabled?'Disable':'Enable'}</button>
              <button class="btn sm danger" onclick="Admin.delUser(${u.id})">Delete</button>`}</td>
          </tr>`;}).join('')}</tbody></table></div>`;
    }catch(e){ el.innerHTML=`<div class="alert err">${esc(e.message)}</div>`; }
  },
  async setRole(id,role){ try{ await A.post('/admin/users/'+id+'/role',{role}); toast('Role updated'); }catch(e){ toast(e.message); this.users(); } },
  async toggle(id,enable){ try{ await A.post('/admin/users/'+id+'/'+(enable?'enable':'disable')); toast(enable?'User enabled':'User disabled'); this.users(); }catch(e){ toast(e.message); } },
  async delUser(id){ if(!confirm('Delete this user and their created tasks? This cannot be undone.'))return;
    try{ await A.del('/admin/users/'+id); toast('User deleted'); this.users(); }catch(e){ toast(e.message); } },

  async workload(){
    const el=document.getElementById('adContent'); el.innerHTML='<div class="empty"><div class="big">&#8987;</div>Loading…</div>';
    try{
      const s=await A.get('/admin/stats'); const team=s.teamWorkload||[];
      el.innerHTML=`<div class="card pad"><div class="section-h"><h2>Organisation workload</h2></div>
        ${team.length?team.map(r=>`<div class="wl-row"><div class="avatar">${initials(r.name)}</div>
          <div style="width:160px"><div style="font-weight:600;font-size:14px">${esc(r.name)}</div>
            <div style="font-size:12px;color:var(--muted)">${r.activeTasks} active &middot; ${r.committedHours}h</div></div>
          <div class="wl-bar"><span class="${r.level}" style="width:${r.percent}%"></span></div>
          <div style="width:96px;text-align:right"><b>${r.percent}%</b> <span class="lvl ${r.level}">${r.level}</span></div></div>`).join('')
          :'<div class="empty">No workforce data yet</div>'}</div>`;
    }catch(e){ el.innerHTML=`<div class="alert err">${esc(e.message)}</div>`; }
  }
};
