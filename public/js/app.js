/* ===================================================================
   TaskSKA — Single Page App (user-facing)
   =================================================================== */
const API = {
  token: null,
  async call(method, path, body){
    const h = {'Content-Type':'application/json'};
    if (this.token) h['Authorization'] = 'Bearer ' + this.token;
    const res = await fetch('/api'+path, {method, headers:h, body: body? JSON.stringify(body): undefined});
    let data = null;
    const txt = await res.text();
    try { data = txt ? JSON.parse(txt) : null; } catch(e){ data = txt; }
    if (!res.ok){
      const msg = (data && data.message) ? data.message : ('Request failed ('+res.status+')');
      throw new Error(msg);
    }
    return data;
  },
  get(p){return this.call('GET',p)},
  post(p,b){return this.call('POST',p,b)},
  put(p,b){return this.call('PUT',p,b)},
  del(p){return this.call('DELETE',p)}
};

function esc(s){return (s==null?'':String(s)).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function initials(name){return (name||'?').split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase();}
function fmtDate(d){ if(!d) return '—'; const dt=new Date(d); return dt.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}); }
function fmtDateTime(d){ if(!d) return '—'; return new Date(d).toLocaleString(undefined,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}); }
function timeAgo(d){ if(!d) return ''; const s=(Date.now()-new Date(d))/1000;
  if(s<60)return 'just now'; if(s<3600)return Math.floor(s/60)+'m ago'; if(s<86400)return Math.floor(s/3600)+'h ago'; return Math.floor(s/86400)+'d ago'; }
function toast(msg){ const r=document.getElementById('toastRoot'); const t=document.createElement('div'); t.className='toast'; t.textContent=msg; r.appendChild(t); setTimeout(()=>t.remove(),3000); }

/* ========================= AUTH ========================= */
const Auth = {
  mode:'login', role:'TASKMASTER', pendingEmail:null,

  render(){
    const c=document.getElementById('authCard');
    if(this.mode==='login') c.innerHTML=this.loginForm();
    else if(this.mode==='register') c.innerHTML=this.registerForm();
    else if(this.mode==='otp') c.innerHTML=this.otpForm();
    else if(this.mode==='forgot') c.innerHTML=this.forgotForm();
    else if(this.mode==='reset') c.innerHTML=this.resetForm();
  },
  switch(m){ this.mode=m; this.render(); },
  alert(type,msg){ const el=document.getElementById('authAlert'); if(el){el.className='alert '+type; el.innerHTML=msg; el.classList.remove('hidden');} },

  loginForm(){return `
    <h2>Welcome back</h2>
    <div class="sub">Sign in to your TaskSKA workspace</div>
    <div class="auth-tabs">
      <button class="active">Sign in</button>
      <button onclick="Auth.switch('register')">Create account</button>
    </div>
    <div id="authAlert" class="alert info hidden"></div>
    <div class="field"><label>Email</label><input id="li_email" type="email" placeholder="you@company.com"></div>
    <div class="field"><label>Password</label><input id="li_pass" type="password" placeholder="••••••••"></div>
    <div style="text-align:right;margin:-6px 0 16px"><a href="#" onclick="Auth.switch('forgot');return false">Forgot password?</a></div>
    <button class="btn block" onclick="Auth.login()">Sign in</button>
    <div class="center-foot">Admin? <a href="/admin">Use the admin portal &rarr;</a></div>`;},

  registerForm(){return `
    <h2>Create your account</h2>
    <div class="sub">Join as a Taskmaster or a Tasker</div>
    <div class="auth-tabs">
      <button onclick="Auth.switch('login')">Sign in</button>
      <button class="active">Create account</button>
    </div>
    <div id="authAlert" class="alert info hidden"></div>
    <div class="role-pick">
      <div class="opt ${this.role==='TASKMASTER'?'active':''}" onclick="Auth.role='TASKMASTER';Auth.render()">
        <b>Taskmaster</b><span>Create &amp; assign tasks, lead delivery</span></div>
      <div class="opt ${this.role==='TASKER'?'active':''}" onclick="Auth.role='TASKER';Auth.render()">
        <b>Tasker</b><span>Execute assigned work, collaborate</span></div>
    </div>
    <div class="field"><label>Full name</label><input id="r_name" placeholder="Jane Doe"></div>
    <div class="field"><label>Email</label><input id="r_email" type="email" placeholder="you@company.com"></div>
    <div class="field"><label>Password</label><input id="r_pass" type="password" placeholder="Min. 8 characters">
      <div class="hint">At least 8 characters.</div></div>
    <div class="field"><label>Job title</label><input id="r_title" placeholder="e.g. Backend Developer"></div>
    <div class="field"><label>Skills</label><input id="r_skills" placeholder="Java, Spring, SQL (comma separated)">
      <div class="hint">Used for smart assignment &amp; team matching.</div></div>
    <div class="row">
      <div class="field"><label>Availability</label><input id="r_avail" placeholder="Mon–Fri, 9am–5pm"></div>
      <div class="field"><label>Weekly capacity (h)</label><input id="r_cap" type="number" value="40" min="1" max="80"></div>
    </div>
    <button class="btn block" onclick="Auth.register()">Create account</button>`;},

  otpForm(){return `
    <h2>Verify it's you</h2>
    <div class="sub">We sent a 6-digit code to <b>${esc(this.pendingEmail)}</b></div>
    <div id="authAlert" class="alert info hidden"></div>
    <div class="field"><label>Authentication code</label>
      <input id="otp_code" placeholder="000000" maxlength="6" style="letter-spacing:8px;font-size:20px;text-align:center"></div>
    <button class="btn block" onclick="Auth.verifyOtp()">Verify &amp; sign in</button>
    <div class="center-foot"><a href="#" onclick="Auth.switch('login');return false">&larr; Back to sign in</a></div>`;},

  forgotForm(){return `
    <h2>Reset your password</h2>
    <div class="sub">Enter your email and we'll send a reset link/token</div>
    <div id="authAlert" class="alert info hidden"></div>
    <div class="field"><label>Email</label><input id="f_email" type="email" placeholder="you@company.com"></div>
    <button class="btn block" onclick="Auth.requestReset()">Send reset token</button>
    <div class="center-foot"><a href="#" onclick="Auth.switch('login');return false">&larr; Back to sign in</a></div>`;},

  resetForm(){return `
    <h2>Set a new password</h2>
    <div class="sub">Paste the token you received and choose a new password</div>
    <div id="authAlert" class="alert info hidden"></div>
    <div class="field"><label>Reset token</label><input id="rs_token" placeholder="Reset token"></div>
    <div class="field"><label>New password</label><input id="rs_pass" type="password" placeholder="Min. 8 characters"></div>
    <button class="btn block" onclick="Auth.confirmReset()">Update password</button>
    <div class="center-foot"><a href="#" onclick="Auth.switch('login');return false">&larr; Back to sign in</a></div>`;},

  async register(){
    try{
      const skills=(document.getElementById('r_skills').value||'').split(',').map(s=>s.trim()).filter(Boolean);
      const r=await API.post('/auth/register',{
        fullName:document.getElementById('r_name').value.trim(),
        email:document.getElementById('r_email').value.trim(),
        password:document.getElementById('r_pass').value,
        role:this.role,
        skills, availability:document.getElementById('r_avail').value.trim(),
        weeklyCapacityHours:parseInt(document.getElementById('r_cap').value)||40,
        jobTitle:document.getElementById('r_title').value.trim()
      });
      // console-fallback returns a verification token so we can auto-verify
      if(r.devCode){
        await API.post('/auth/verify-email',{token:r.devCode});
        this.switch('login');
        this.alert('ok','Account created and verified! Please sign in.');
      } else {
        this.switch('login');
        this.alert('ok','Account created! Check your email to verify, then sign in.');
      }
    }catch(e){ this.alert('err',e.message); }
  },
  async login(){
    try{
      const email=document.getElementById('li_email').value.trim();
      const r=await API.post('/auth/login',{email,password:document.getElementById('li_pass').value});
      this.pendingEmail=email; this.switch('otp');
      if(r.devCode) this.alert('info','Demo mode — your code is <span class="devcode">'+esc(r.devCode)+'</span>');
    }catch(e){ this.alert('err',e.message); }
  },
  async verifyOtp(){
    try{
      const r=await API.post('/auth/verify-otp',{email:this.pendingEmail,code:document.getElementById('otp_code').value.trim()});
      API.token=r.token; App.start(r.user);
    }catch(e){ this.alert('err',e.message); }
  },
  async requestReset(){
    try{
      const r=await API.post('/auth/forgot-password',{email:document.getElementById('f_email').value.trim()});
      this.switch('reset');
      if(r.devCode) this.alert('info','Demo mode — your reset token is <span class="devcode">'+esc(r.devCode)+'</span>');
      else this.alert('ok','If that email exists, a reset token has been sent.');
    }catch(e){ this.alert('err',e.message); }
  },
  async confirmReset(){
    try{
      await API.post('/auth/reset-password',{token:document.getElementById('rs_token').value.trim(),newPassword:document.getElementById('rs_pass').value});
      this.switch('login'); this.alert('ok','Password updated! Please sign in.');
    }catch(e){ this.alert('err',e.message); }
  }
};

/* ========================= APP ========================= */
const App = {
  me:null, page:'dashboard', unread:0,

  start(user){
    this.me=user;
    document.getElementById('authView').classList.add('hidden');
    document.getElementById('appView').classList.remove('hidden');
    document.getElementById('meName').textContent=user.fullName;
    document.getElementById('meRole').textContent=user.role;
    this.buildNav();
    const gs=document.getElementById('globalSearch');
    gs.addEventListener('keydown',e=>{ if(e.key==='Enter'){ this.go('search'); }});
    this.go('dashboard');
    this.pollUnread();
  },
  logout(){ API.token=null; this.me=null; location.reload(); },

  buildNav(){
    const isAuditor=this.me.role==='AUDITOR';
    const items=[
      ['dashboard','&#9632;','Dashboard'],
      ['tasks','&#9776;','My Tasks'],
      ['created','&#10133;','Created by me'],
      ['search','&#128269;','Search'],
      ['SEC','Collaboration'],
      ['connections','&#128279;','Connections'],
      ['workload','&#128202;','Team Workload'],
      ['SEC','Productivity'],
      ['notifications','&#128276;','Notifications'],
      ['templates','&#9783;','Templates'],
      ['SEC','Account'],
      ['settings','&#9881;','Settings'],
      ['about','&#8505;','Project &amp; Sprints']
    ];
    let html='';
    for(const it of items){
      if(it[0]==='SEC'){ html+=`<div class="sec">${it[1]}</div>`; continue; }
      if(isAuditor && it[0]==='created') continue;
      const badge=it[0]==='notifications'?`<span class="badge" id="navBadge" style="display:none"></span>`:'';
      html+=`<a href="#" data-p="${it[0]}" onclick="App.go('${it[0]}');return false"><span class="ic">${it[1]}</span>${it[2]}${badge}</a>`;
    }
    document.getElementById('nav').innerHTML=html;
  },
  setActive(){
    document.querySelectorAll('#nav a').forEach(a=>a.classList.toggle('active',a.dataset.p===this.page));
  },
  go(page){
    this.page=page; this.setActive();
    document.getElementById('sidebar').classList.remove('open');
    const titles={dashboard:'Dashboard',tasks:'My Tasks',created:'Tasks I Created',search:'Search Tasks',
      connections:'Connections',workload:'Team Workload',notifications:'Notifications',templates:'Task Templates',
      settings:'Settings',about:'Project & Sprints'};
    document.getElementById('pageTitle').textContent=titles[page]||'TaskSKA';
    document.getElementById('topSearch').style.display=(page==='search')?'block':'none';
    const fn={dashboard:'Dashboard',tasks:'Tasks',created:'Created',search:'Search',connections:'Connections',
      workload:'Workload',notifications:'Notifications',templates:'Templates',settings:'Settings',about:'About'}[page];
    Views[fn]();
  },

  async pollUnread(){
    try{ const r=await API.get('/notifications/unread-count'); this.unread=r.count||0; this.updateBadge(); }catch(e){}
    setTimeout(()=>this.pollUnread(),20000);
  },
  updateBadge(){ const b=document.getElementById('navBadge'); if(!b)return;
    if(this.unread>0){ b.textContent=this.unread; b.style.display='inline'; } else b.style.display='none'; }
};

/* ========================= VIEWS ========================= */
const C=()=>document.getElementById('content');
const loading=()=>C().innerHTML='<div class="empty"><div class="big">&#8987;</div>Loading…</div>';

const Views={
  async Dashboard(){
    loading();
    try{
      const [mine,wl] = await Promise.all([API.get('/tasks'), API.get('/workload/me')]);
      const counts={NOT_STARTED:0,IN_PROGRESS:0,BLOCKED:0,COMPLETED:0,OVERDUE:0};
      mine.forEach(t=>counts[t.status]=(counts[t.status]||0)+1);
      const active=mine.filter(t=>t.status!=='COMPLETED').length;
      C().innerHTML=`
        <div class="stat-grid">
          <div class="stat"><div class="ic">&#9776;</div><div class="n">${active}</div><div class="l">Active tasks</div></div>
          <div class="stat"><div class="ic">&#9203;</div><div class="n">${counts.IN_PROGRESS}</div><div class="l">In progress</div></div>
          <div class="stat"><div class="ic">&#10003;</div><div class="n">${counts.COMPLETED}</div><div class="l">Completed</div></div>
          <div class="stat"><div class="ic">&#9888;</div><div class="n">${counts.OVERDUE}</div><div class="l">Overdue</div></div>
          <div class="stat"><div class="ic">&#128202;</div><div class="n">${wl.percent}%</div><div class="l">My workload &middot; <span class="lvl ${wl.level}">${wl.level}</span></div></div>
        </div>
        <div class="section-h"><h2>My active tasks</h2><div class="grow"></div>
          ${App.me.role!=='AUDITOR'?'<button class="btn" onclick="Modal.taskForm()">+ New task</button>':''}</div>
        <div class="cards" id="dashCards"></div>`;
      const open=mine.filter(t=>t.status!=='COMPLETED');
      renderTaskCards('dashCards', open.length?open:mine);
    }catch(e){ C().innerHTML=errBox(e); }
  },

  async Tasks(){
    loading();
    try{
      const mine=await API.get('/tasks');
      C().innerHTML=`<div class="section-h"><h2>All my tasks (${mine.length})</h2><div class="grow"></div>
        ${App.me.role!=='AUDITOR'?'<button class="btn" onclick="Modal.taskForm()">+ New task</button>':''}</div>
        <div class="cards" id="taskCards"></div>`;
      renderTaskCards('taskCards', mine);
    }catch(e){ C().innerHTML=errBox(e); }
  },

  async Created(){
    loading();
    try{
      const t=await API.get('/tasks/created');
      C().innerHTML=`<div class="section-h"><h2>Tasks I created (${t.length})</h2><div class="grow"></div>
        <button class="btn" onclick="Modal.taskForm()">+ New task</button></div>
        <div class="cards" id="cCards"></div>`;
      renderTaskCards('cCards', t);
    }catch(e){ C().innerHTML=errBox(e); }
  },

  async Search(){
    C().innerHTML=`
      <div class="card pad" style="margin-bottom:18px">
        <div class="row" style="align-items:flex-end">
          <div class="field" style="margin:0"><label>Keyword</label><input id="sq" placeholder="Code, title or description…"></div>
          <div class="field" style="margin:0;max-width:200px"><label>Status</label>
            <select id="ss"><option value="">Any status</option>
              <option>NOT_STARTED</option><option>IN_PROGRESS</option><option>BLOCKED</option>
              <option>COMPLETED</option><option>OVERDUE</option></select></div>
          <button class="btn" style="flex:none" onclick="Views.runSearch()">Search</button>
        </div></div>
      <div class="cards" id="searchCards"></div>`;
    const gs=document.getElementById('globalSearch');
    if(gs.value){ document.getElementById('sq').value=gs.value; this.runSearch(); }
    document.getElementById('sq').addEventListener('keydown',e=>{if(e.key==='Enter')Views.runSearch();});
  },
  async runSearch(){
    const q=document.getElementById('sq').value.trim();
    const s=document.getElementById('ss').value;
    try{
      const r=await API.get('/tasks/search?'+new URLSearchParams({q,status:s}));
      if(!r.length){ document.getElementById('searchCards').innerHTML=emptyBox('&#128269;','No tasks match your search'); return; }
      renderTaskCards('searchCards', r);
    }catch(e){ document.getElementById('searchCards').innerHTML=errBox(e); }
  },

  async Connections(){
    loading();
    try{
      const list=await API.get('/connections');
      const inc=list.filter(c=>c.direction==='INCOMING');
      const out=list.filter(c=>c.direction==='OUTGOING');
      const cur=list.filter(c=>c.direction==='CURRENT');
      window.__conn={inc,out,cur};
      C().innerHTML=`
        <div class="section-h"><h2>Your network</h2><div class="grow"></div>
          <button class="btn" onclick="Modal.connect()">+ Add connection</button></div>
        <div class="tabs">
          <button class="active" onclick="Views.connTab(this,'cur')">Current (${cur.length})</button>
          <button onclick="Views.connTab(this,'inc')">Incoming (${inc.length})</button>
          <button onclick="Views.connTab(this,'out')">Sent (${out.length})</button>
        </div>
        <div class="card pad" id="connBody"></div>`;
      this.connTab(document.querySelector('.tabs button.active'),'cur');
    }catch(e){ C().innerHTML=errBox(e); }
  },
  connTab(btn,key){
    document.querySelectorAll('.tabs button').forEach(b=>b.classList.remove('active')); btn.classList.add('active');
    const data=window.__conn[key]; const body=document.getElementById('connBody');
    if(!data.length){ body.innerHTML=emptyBox('&#128279;','Nothing here yet'); return; }
    body.innerHTML=data.map(c=>{
      let action='';
      if(key==='inc') action=`<button class="btn sm" onclick="Views.respond(${c.id},true)">Accept</button>
        <button class="btn sm ghost" onclick="Views.respond(${c.id},false)">Decline</button>`;
      else if(key==='out') action=`<span class="pill NOT_STARTED">Pending</span>`;
      else action=c.workloadPercent!=null?`<span class="lvl ${c.workloadPercent>80?'HIGH':c.workloadPercent>50?'MEDIUM':'LOW'}">${c.workloadPercent}% load</span>`:'';
      return `<div class="wl-row">
        <div class="avatar">${initials(c.name)}</div>
        <div style="flex:1"><div style="font-weight:600">${esc(c.name)}</div>
          <div style="font-size:12px;color:var(--muted)">${esc(c.role)} &middot; ${esc(c.email)}</div></div>
        <div style="display:flex;gap:8px;align-items:center">${action}</div></div>`;
    }).join('');
  },
  async respond(id,accept){
    try{ await API.post('/connections/'+id+'/'+(accept?'accept':'decline')); toast(accept?'Connection accepted':'Request declined'); Views.Connections(); }
    catch(e){ toast(e.message); }
  },

  async Workload(){
    loading();
    try{
      const team=await API.get('/workload/team');
      window.__team=team;
      C().innerHTML=`
        <div class="section-h"><h2>Workload distribution</h2><div class="grow"></div>
          <select id="wlFilter" onchange="Views.renderWorkload()" style="padding:8px 12px;border:1px solid var(--line);border-radius:9px">
            <option value="">All levels</option><option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option><option value="HIGH">High</option></select></div>
        <div class="card pad"><div id="wlBody"></div></div>
        <p style="color:var(--muted);font-size:13px;margin-top:14px">Workload is computed from committed remaining hours against weekly capacity, weighted up for tasks that are imminent or overdue. Low &le;50% &middot; Medium 51–80% &middot; High &gt;80%.</p>`;
      this.renderWorkload();
    }catch(e){ C().innerHTML=errBox(e); }
  },
  renderWorkload(){
    const f=document.getElementById('wlFilter').value;
    let rows=window.__team.slice();
    if(f) rows=rows.filter(r=>r.level===f);
    const body=document.getElementById('wlBody');
    if(!rows.length){ body.innerHTML=emptyBox('&#128202;','No one in this band'); return; }
    body.innerHTML=rows.map(r=>`
      <div class="wl-row">
        <div class="avatar">${initials(r.name)}</div>
        <div style="width:150px"><div style="font-weight:600;font-size:14px">${esc(r.name)}${r.userId===App.me.id?' <span style="color:var(--muted);font-weight:400">(you)</span>':''}</div>
          <div style="font-size:12px;color:var(--muted)">${r.activeTasks} active &middot; ${r.committedHours}h</div></div>
        <div class="wl-bar"><span class="${r.level}" style="width:${r.percent}%"></span></div>
        <div style="width:96px;text-align:right"><b>${r.percent}%</b> <span class="lvl ${r.level}">${r.level}</span></div>
      </div>`).join('');
  },

  async Notifications(){
    loading();
    try{
      const list=await API.get('/notifications');
      App.unread=list.filter(n=>!n.read).length; App.updateBadge();
      const iconFor={TASK_ASSIGNED:'&#128203;',STATUS_UPDATE:'&#128260;',CONNECTION_REQUEST:'&#128279;',
        CONNECTION_ACCEPTED:'&#129309;',DEADLINE_OVERDUE:'&#9888;',DEPENDENCY_ACTIVE:'&#9654;'};
      C().innerHTML=`<div class="section-h"><h2>Notifications</h2><div class="grow"></div>
        <button class="btn ghost sm" onclick="Views.markAll()">Mark all read</button></div>
        <div class="card">${ list.length? list.map(n=>`
          <div class="notif ${n.read?'':'unread'}" onclick="Views.openFromNotif('${n.id}','${esc(n.relatedTaskCode||'')}')">
            <div class="ic">${iconFor[n.type]||'&#128276;'}</div>
            <div style="flex:1"><div class="msg">${esc(n.message)}</div>
              <div class="t">${esc((n.type||'').replace(/_/g,' '))} &middot; ${timeAgo(n.createdAt)}</div></div>
          </div>`).join('') : emptyBox('&#128276;','You are all caught up') }</div>`;
    }catch(e){ C().innerHTML=errBox(e); }
  },
  async openFromNotif(id,code){
    try{ await API.post('/notifications/'+id+'/read'); }catch(e){}
    if(code) Modal.taskDetail(code); else Views.Notifications();
  },
  async markAll(){ try{ await API.post('/notifications/read-all'); App.unread=0; App.updateBadge(); Views.Notifications(); }catch(e){} },

  async Templates(){
    loading();
    try{
      const list=await API.get('/templates');
      C().innerHTML=`<div class="section-h"><h2>Task templates (${list.length})</h2><div class="grow"></div>
        ${App.me.role!=='AUDITOR'?'<button class="btn" onclick="Modal.templateForm()">+ New template</button>':''}</div>
        <p style="color:var(--muted);font-size:13px;margin-top:-6px;margin-bottom:18px">Templates let you spin up recurring work in one click — title, description, estimate, default assignee and a relative deadline are pre-filled.</p>
        <div class="cards">${ list.length? list.map(t=>`
          <div class="card pad">
            <div style="font-weight:700">${esc(t.name)}</div>
            <div style="font-size:13px;color:var(--muted);margin:6px 0 12px">${esc(t.title)}</div>
            <div style="font-size:12px;color:var(--muted)">${t.estimatedHours}h &middot; due +${t.deadlineOffsetDays}d${t.defaultAssigneeName?' &middot; '+esc(t.defaultAssigneeName):''}</div>
            <div style="display:flex;gap:8px;margin-top:14px">
              <button class="btn sm" onclick="Views.useTemplate(${t.id})">Use template</button>
              <button class="btn sm danger" onclick="Views.delTemplate(${t.id})">Delete</button></div>
          </div>`).join('') : emptyBox('&#9783;','No templates yet') }</div>`;
    }catch(e){ C().innerHTML=errBox(e); }
  },
  async useTemplate(id){ try{ const t=await API.post('/templates/'+id+'/instantiate'); toast('Task '+t.taskCode+' created'); App.go('tasks'); }catch(e){ toast(e.message); } },
  async delTemplate(id){ if(!confirm('Delete this template?'))return; try{ await API.del('/templates/'+id); Views.Templates(); }catch(e){ toast(e.message); } },

  async Settings(){
    loading();
    try{
      const me=await API.get('/profile/me');
      App.me=me;
      C().innerHTML=`
        <div class="tabs">
          <button class="active" onclick="Views.setTab(this,'prof')">Profile</button>
          <button onclick="Views.setTab(this,'notif')">Notification preferences</button>
        </div>
        <div id="setBody"></div>`;
      this.profilePane(me);
      window.__me=me;
    }catch(e){ C().innerHTML=errBox(e); }
  },
  setTab(btn,key){ document.querySelectorAll('.tabs button').forEach(b=>b.classList.remove('active')); btn.classList.add('active');
    if(key==='prof') this.profilePane(window.__me); else this.notifPane(window.__me); },
  profilePane(me){
    document.getElementById('setBody').innerHTML=`
      <div class="card pad" style="max-width:620px">
        <div class="row"><div class="field"><label>Full name</label><input id="p_name" value="${esc(me.fullName)}"></div>
          <div class="field"><label>Job title</label><input id="p_title" value="${esc(me.jobTitle||'')}"></div></div>
        <div class="field"><label>Email</label><input value="${esc(me.email)}" disabled></div>
        <div class="field"><label>Skills</label><input id="p_skills" value="${esc((me.skills||[]).join(', '))}"></div>
        <div class="row"><div class="field"><label>Availability</label><input id="p_avail" value="${esc(me.availability||'')}"></div>
          <div class="field"><label>Weekly capacity (h)</label><input id="p_cap" type="number" value="${me.weeklyCapacityHours}"></div></div>
        <button class="btn" onclick="Views.saveProfile()">Save changes</button>
      </div>`;
  },
  notifPane(me){
    const row=(id,lbl,desc,val)=>`<div class="wl-row"><div style="flex:1"><div style="font-weight:600">${lbl}</div>
      <div style="font-size:12px;color:var(--muted)">${desc}</div></div>
      <label class="switch"><input type="checkbox" id="${id}" ${val?'checked':''} style="width:20px;height:20px;accent-color:var(--blue-600)"></label></div>`;
    document.getElementById('setBody').innerHTML=`
      <div class="card pad" style="max-width:620px">
        ${row('n_assign','Task assignments','When a task is assigned to you',me.notifyAssignment??true)}
        ${row('n_status','Status updates','When tasks you created change status or go overdue',me.notifyStatus??true)}
        ${row('n_conn','Connections','Connection requests &amp; acceptances',me.notifyConnection??true)}
        ${row('n_email','Email delivery','Also deliver notifications by email',me.notifyEmail??false)}
        <button class="btn" style="margin-top:16px" onclick="Views.savePrefs()">Save preferences</button>
      </div>`;
  },
  async saveProfile(){
    try{
      const skills=(document.getElementById('p_skills').value||'').split(',').map(s=>s.trim()).filter(Boolean);
      const me=await API.put('/profile',{fullName:document.getElementById('p_name').value,jobTitle:document.getElementById('p_title').value,
        skills,availability:document.getElementById('p_avail').value,weeklyCapacityHours:parseInt(document.getElementById('p_cap').value)});
      App.me=me; window.__me=me; document.getElementById('meName').textContent=me.fullName; toast('Profile saved');
    }catch(e){ toast(e.message); }
  },
  async savePrefs(){
    try{
      const me=await API.put('/profile/notifications',{notifyAssignment:document.getElementById('n_assign').checked,
        notifyStatus:document.getElementById('n_status').checked,notifyConnection:document.getElementById('n_conn').checked,
        notifyEmail:document.getElementById('n_email').checked});
      window.__me=me; toast('Preferences updated');
    }catch(e){ toast(e.message); }
  },

  About(){ C().innerHTML=ABOUT_HTML; }
};

/* ---- shared renderers ---- */
function renderTaskCards(id, tasks){
  const el=document.getElementById(id);
  if(!tasks.length){ el.innerHTML=emptyBox('&#9776;','No tasks yet'); return; }
  el.innerHTML=tasks.map(t=>`
    <div class="task-card" onclick="Modal.taskDetail('${esc(t.taskCode)}')">
      <div style="display:flex;align-items:center;gap:8px">
        <span class="code">${esc(t.taskCode)}</span><div style="flex:1"></div>
        <span class="pill ${t.status}">${t.status.replace(/_/g,' ')}</span></div>
      <h3>${esc(t.title)}${t.blockedByDependency?' <span title="Blocked by a dependency">&#128274;</span>':''}</h3>
      ${t.description?`<div class="desc">${esc(t.description)}</div>`:''}
      <div class="progress"><span style="width:${t.progress}%"></span></div>
      <div class="meta">
        <span>${t.progress}%</span>
        ${t.assigneeName?`<span>&middot; <span class="avatar" style="width:20px;height:20px;font-size:9px;display:inline-grid">${initials(t.assigneeName)}</span> ${esc(t.assigneeName)}</span>`:''}
        <div style="flex:1"></div>
        <span>${t.deadline?('&#128197; '+fmtDate(t.deadline)):''}</span>
      </div></div>`).join('');
}
function emptyBox(icon,msg){ return `<div class="empty" style="grid-column:1/-1"><div class="big">${icon}</div>${msg}</div>`; }
function errBox(e){ return `<div class="alert err">${esc(e.message||'Something went wrong')}</div>`; }

/* ========================= MODALS ========================= */
const Modal={
  close(){ document.getElementById('modalRoot').innerHTML=''; },
  shell(title,inner){
    document.getElementById('modalRoot').innerHTML=`
      <div class="modal-bg" onclick="if(event.target===this)Modal.close()">
        <div class="modal"><div class="modal-h"><h2>${title}</h2><button class="x" onclick="Modal.close()">&times;</button></div>
          <div class="modal-b">${inner}</div></div></div>`;
  },

  async taskForm(){
    let conns=[];
    try{ conns=await API.get('/connections'); }catch(e){}
    const accepted=conns.filter(c=>c.direction==='CURRENT');
    const opts=accepted.map(c=>`<option value="${c.otherUserId}">${esc(c.name)}</option>`).join('');
    this.shell('Create task',`
      <div id="mAlert" class="alert err hidden"></div>
      <div class="field"><label>Title *</label><input id="t_title" placeholder="What needs doing?"></div>
      <div class="field"><label>Description</label><textarea id="t_desc" rows="2" placeholder="Add detail…"></textarea></div>
      <div class="row">
        <div class="field"><label>Deadline</label><input id="t_deadline" type="date"></div>
        <div class="field"><label>Estimated hours</label><input id="t_hours" type="number" value="4" min="0.5" step="0.5"></div>
      </div>
      <div class="field"><label>Assign to</label>
        <select id="t_assignee"><option value="">Myself</option>${opts}
          <option value="__auto">&#9889; Auto-assign (lowest workload)</option></select>
        <div class="hint">Auto-assign picks the least-loaded connected teammate.</div></div>
      <div class="field"><label>Subtasks</label><input id="t_subs" placeholder="Comma separated checklist items"></div>
      <div class="field"><label>Depends on (task codes)</label><input id="t_deps" placeholder="TSK-000002, TSK-000003">
        <div class="hint">This task stays blocked until those complete.</div></div>
      <button class="btn block" onclick="Modal.createTask()">Create task</button>`);
  },
  async createTask(){
    try{
      const a=document.getElementById('t_assignee').value;
      const body={ title:document.getElementById('t_title').value.trim(),
        description:document.getElementById('t_desc').value.trim(),
        deadline:document.getElementById('t_deadline').value||null,
        estimatedHours:parseFloat(document.getElementById('t_hours').value)||4,
        autoAssign:a==='__auto', assigneeId:(a&&a!=='__auto')?parseInt(a):null,
        subtasks:(document.getElementById('t_subs').value||'').split(',').map(s=>s.trim()).filter(Boolean),
        dependencyCodes:(document.getElementById('t_deps').value||'').split(',').map(s=>s.trim()).filter(Boolean) };
      const t=await API.post('/tasks',body);
      this.close(); toast('Task '+t.taskCode+' created'); App.go(App.page);
    }catch(e){ const a=document.getElementById('mAlert'); a.textContent=e.message; a.classList.remove('hidden'); }
  },

  async taskDetail(code){
    try{
      const t=await API.get('/tasks/'+code);
      const canEdit=t.canEdit;
      const statusBtns=['NOT_STARTED','IN_PROGRESS','BLOCKED','COMPLETED'].map(s=>
        `<button class="btn sm ${s===t.status?'':'ghost'}" ${canEdit?'':'disabled'} onclick="Modal.setStatus('${code}','${s}')">${s.replace(/_/g,' ')}</button>`).join(' ');
      const subs=t.subtasks.map(s=>`<div class="subtask ${s.done?'done':''}">
        <input type="checkbox" ${s.done?'checked':''} ${canEdit?'':'disabled'} onchange="Modal.toggleSub('${code}',${s.id})">
        <span>${esc(s.title)}</span></div>`).join('');
      this.shell(esc(t.taskCode),`
        ${t.blockedByDependency?'<div class="alert info">&#128274; Blocked — waiting on dependencies to complete.</div>':''}
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
          <span class="pill ${t.status}">${t.status.replace(/_/g,' ')}</span>
          <div style="flex:1"></div>
          ${canEdit?`<button class="btn sm ghost" onclick="Modal.editTask('${code}')">Edit</button>`:''}
          ${canEdit?`<button class="btn sm danger" onclick="Modal.delTask('${code}')">Delete</button>`:''}
        </div>
        <h2 style="margin:4px 0 10px">${esc(t.title)}</h2>
        ${t.description?`<p style="color:var(--muted);margin-top:0">${esc(t.description)}</p>`:''}
        <div class="kv"><span class="k">Creator</span><span>${esc(t.creatorName)}</span></div>
        <div class="kv"><span class="k">Assignee</span><span>${esc(t.assigneeName||'Unassigned')}</span></div>
        <div class="kv"><span class="k">Deadline</span><span>${fmtDateTime(t.deadline)}</span></div>
        <div class="kv"><span class="k">Estimated</span><span>${t.estimatedHours} h</span></div>
        ${t.dependencyCodes&&t.dependencyCodes.length?`<div class="kv"><span class="k">Depends on</span><span>${t.dependencyCodes.map(esc).join(', ')}</span></div>`:''}
        <div style="margin:16px 0 6px;font-weight:600;font-size:13px">Progress — ${t.progress}%</div>
        <div class="progress" style="height:9px"><span style="width:${t.progress}%"></span></div>
        ${canEdit?`<input type="range" min="0" max="100" value="${t.progress}" style="width:100%;margin-top:10px;accent-color:var(--blue-600)" onchange="Modal.setProgress('${code}',this.value)">`:''}
        ${t.subtasks.length?`<div style="margin:18px 0 6px;font-weight:600;font-size:13px">Checklist</div>${subs}`:''}
        <div style="margin-top:18px;font-weight:600;font-size:13px">Update status</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">${statusBtns}</div>`);
    }catch(e){ this.shell('Task',errBox(e)); }
  },
  async setStatus(code,s){ try{ await API.post('/tasks/'+code+'/status',{status:s}); this.taskDetail(code); App.pollUnread(); }catch(e){ toast(e.message); } },
  async setProgress(code,v){ try{ await API.post('/tasks/'+code+'/progress',{progress:parseInt(v)}); this.taskDetail(code); }catch(e){ toast(e.message); } },
  async toggleSub(code,id){ try{ await API.post('/tasks/'+code+'/subtasks/'+id+'/toggle'); this.taskDetail(code); }catch(e){ toast(e.message); } },
  async delTask(code){ if(!confirm('Delete '+code+'?'))return; try{ await API.del('/tasks/'+code); this.close(); toast('Task deleted'); App.go(App.page); }catch(e){ toast(e.message); } },

  async editTask(code){
    const t=await API.get('/tasks/'+code);
    this.shell('Edit '+esc(code),`
      <div id="mAlert" class="alert err hidden"></div>
      <div class="field"><label>Title</label><input id="e_title" value="${esc(t.title)}"></div>
      <div class="field"><label>Description</label><textarea id="e_desc" rows="2">${esc(t.description||'')}</textarea></div>
      <div class="row"><div class="field"><label>Deadline</label><input id="e_deadline" type="date" value="${t.deadline?t.deadline.substring(0,10):''}"></div>
        <div class="field"><label>Estimated hours</label><input id="e_hours" type="number" value="${t.estimatedHours}" step="0.5"></div></div>
      <button class="btn block" onclick="Modal.saveEdit('${code}')">Save</button>`);
  },
  async saveEdit(code){
    try{
      await API.put('/tasks/'+code,{title:document.getElementById('e_title').value.trim(),
        description:document.getElementById('e_desc').value.trim(),deadline:document.getElementById('e_deadline').value||null,
        estimatedHours:parseFloat(document.getElementById('e_hours').value)||4});
      toast('Saved'); this.taskDetail(code); App.go(App.page);
    }catch(e){ const a=document.getElementById('mAlert'); a.textContent=e.message; a.classList.remove('hidden'); }
  },

  connect(){
    this.shell('Add connection',`
      <div id="mAlert" class="alert err hidden"></div>
      <p style="color:var(--muted);margin-top:0">Send a connection request by email. Once accepted you can assign each other tasks and see workloads.</p>
      <div class="field"><label>Email</label><input id="c_email" type="email" placeholder="teammate@company.com"></div>
      <button class="btn block" onclick="Modal.sendConnect()">Send request</button>`);
  },
  async sendConnect(){
    try{ const r=await API.post('/connections',{email:document.getElementById('c_email').value.trim()});
      this.close(); toast(r.message||'Request sent'); App.go('connections'); }
    catch(e){ const a=document.getElementById('mAlert'); a.textContent=e.message; a.classList.remove('hidden'); }
  },

  templateForm(){
    this.shell('New template',`
      <div id="mAlert" class="alert err hidden"></div>
      <div class="field"><label>Template name *</label><input id="tp_name" placeholder="e.g. Weekly status report"></div>
      <div class="field"><label>Task title *</label><input id="tp_title" placeholder="Default task title"></div>
      <div class="field"><label>Description</label><textarea id="tp_desc" rows="2"></textarea></div>
      <div class="row"><div class="field"><label>Estimated hours</label><input id="tp_hours" type="number" value="4" step="0.5"></div>
        <div class="field"><label>Deadline offset (days)</label><input id="tp_off" type="number" value="7"></div></div>
      <button class="btn block" onclick="Modal.createTemplate()">Create template</button>`);
  },
  async createTemplate(){
    try{ await API.post('/templates',{name:document.getElementById('tp_name').value.trim(),
        title:document.getElementById('tp_title').value.trim(),description:document.getElementById('tp_desc').value.trim(),
        estimatedHours:parseFloat(document.getElementById('tp_hours').value)||4,
        deadlineOffsetDays:parseInt(document.getElementById('tp_off').value)||7});
      this.close(); toast('Template created'); App.go('templates'); }
    catch(e){ const a=document.getElementById('mAlert'); a.textContent=e.message; a.classList.remove('hidden'); }
  }
};

/* boot */
Auth.render();
