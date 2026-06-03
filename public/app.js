'use strict';
/* TaskSKA SPA — vanilla JS. */
const API = {
  async call(method, path, body) {
    const res = await fetch('/api' + path, {
      method, headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin', body: body ? JSON.stringify(body) : undefined,
    });
    const txt = await res.text(); let data = null;
    try { data = txt ? JSON.parse(txt) : null; } catch { data = txt; }
    if (!res.ok) throw new Error((data && data.message) ? data.message : ('Request failed (' + res.status + ')'));
    return data;
  },
  get(p) { return this.call('GET', p); },
  post(p, b) { return this.call('POST', p, b); },
  put(p, b) { return this.call('PUT', p, b); },
  del(p) { return this.call('DELETE', p); },
};
const esc = (s) => (s == null ? '' : String(s)).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (id) => document.getElementById(id);
const toast = (m) => { const r = $('toastRoot'); const t = document.createElement('div'); t.className = 'toast'; t.textContent = m; r.appendChild(t); setTimeout(() => t.remove(), 3000); };
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
const initials = (n) => (n || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
const STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED'];
const STATUS_LABEL = { NOT_STARTED: 'To do', IN_PROGRESS: 'In progress', BLOCKED: 'Blocked', COMPLETED: 'Done', OVERDUE: 'Overdue' };

const App = {
  me: null, page: 'dashboard',
  async boot() {
    try { this.me = await API.get('/auth/me'); this.render(); }
    catch { Auth.render(); }
  },
  start(user) { this.me = user; this.page = 'dashboard'; this.render(); this.pollUnread(); },
  async logout() { try { await API.post('/auth/logout'); } catch {} this.me = null; Auth.mode = 'login'; Auth.render(); },
  isManager() { return this.me.role === 'TASKMASTER' || this.me.role === 'ADMIN'; },
  nav() {
    const items = [
      ['dashboard', '▦', 'Dashboard'],
      ['board', '☰', 'My Board'],
      ['created', '✎', 'Created by me'],
      ['open', '\u{1F50D}', 'Open Pool'],
      ['workload', '\u{1F4CA}', 'Workload'],
      ['connections', '\u{1F517}', 'Connections'],
      ['requests', '\u{1F4E5}', 'Requests'],
      ['templates', '\u{1F4CB}', 'Templates'],
    ];
    if (this.me.role === 'ADMIN') items.push(['admin', '⚙', 'Admin']);
    return `<div class="nav">${items.map(([k, ic, l]) =>
      `<a class="${this.page === k ? 'on' : ''}" onclick="App.go('${k}')"><span class="ic">${ic}</span>${l}</a>`).join('')}</div>`;
  },
  render() {
    $('root').innerHTML = `
    <div class="app">
      <aside class="side">
        <div class="brand"><span class="mk">&#10003;</span> TaskSKA</div>
        ${this.nav()}
        <div class="sp"></div>
        <div class="me">
          <div style="color:#fff;font-weight:600">${esc(this.me.fullName)}</div>
          <div style="color:#8fa3cf;font-size:12px">${this.me.role}</div>
        </div>
      </aside>
      <main>
        <div class="topbar">
          <div class="search"><span class="mag">&#9906;</span>
            <input id="globalSearch" class="input" placeholder="Search tasks by code, title…" onkeydown="if(event.key==='Enter')App.search()">
          </div>
          <button class="bell" onclick="App.toggleNotif()">&#128276;<span id="bellDot" class="dot hidden">0</span></button>
          <div class="avatar" onclick="App.toggleMenu()">${initials(this.me.fullName)}</div>
        </div>
        <div class="content" id="content"></div>
      </main>
    </div>`;
    this.go(this.page);
    this.pollUnread();
  },
  go(page) {
    this.page = page;
    document.querySelectorAll('.nav a').forEach(a => a.classList.remove('on'));
    const map = { dashboard: Views.dashboard, board: Views.board, created: Views.created, open: Views.openPool,
      workload: Views.workload, connections: Views.connections, requests: Views.requests,
      templates: Views.templates, admin: Admin.overview, search: Views.search, settings: Views.settings };
    this.render2(page);
    (map[page] || Views.dashboard).call(page === 'admin' ? Admin : Views);
  },
  render2(page) {
    document.querySelectorAll('.nav a').forEach(a => { if (a.getAttribute('onclick').includes("'" + page + "'")) a.classList.add('on'); });
  },
  async search() { const q = $('globalSearch').value.trim(); if (!q) return; window.__q = q; this.go('search'); },
  toggleMenu() {
    if ($('userMenu')) { $('userMenu').remove(); return; }
    const m = document.createElement('div'); m.id = 'userMenu'; m.className = 'menu';
    m.innerHTML = `<a onclick="App.go('settings');App.toggleMenu()">Profile &amp; settings</a>
      <a onclick="App.logout()">Sign out</a>`;
    document.querySelector('main').appendChild(m);
  },
  async toggleNotif() {
    if ($('notifPop')) { $('notifPop').remove(); return; }
    const list = await API.get('/notifications');
    const p = document.createElement('div'); p.id = 'notifPop'; p.className = 'notif-pop';
    p.innerHTML = `<div style="display:flex;justify-content:space-between;padding:12px 15px;border-bottom:1px solid var(--line)">
        <b>Notifications</b><a onclick="App.markAllRead()">Mark all read</a></div>
      ${list.length ? list.map(n => `<div class="ni ${n.read ? '' : 'unread'}">${esc(n.message)}
        <div class="muted" style="font-size:11px;margin-top:3px">${fmtDate(n.createdAt)} ${n.relatedTaskCode ? '· ' + n.relatedTaskCode : ''}</div></div>`).join('')
        : '<div class="empty">No notifications</div>'}`;
    document.querySelector('main').appendChild(p);
  },
  async markAllRead() { await API.post('/notifications/read-all'); if ($('notifPop')) $('notifPop').remove(); this.pollUnread(); },
  async pollUnread() {
    try { const { count } = await API.get('/notifications/unread-count');
      const d = $('bellDot'); if (!d) return; if (count > 0) { d.textContent = count; d.classList.remove('hidden'); } else d.classList.add('hidden'); } catch {}
  },
};
const C = () => $('content');
const loading = () => C().innerHTML = '<div class="empty"><div class="big">&#8987;</div>Loading…</div>';
const errBox = (e) => `<div class="alert err">${esc(e.message)}</div>`;

/* ===================== AUTH ===================== */
const Auth = {
  mode: 'login',
  render() {
    $('root').innerHTML = `<div class="auth-wrap"><div class="auth-card">
      <div class="brand"><span class="mk" style="background:var(--blue);color:#fff">&#10003;</span> TaskSKA</div>
      <div class="seg">
        <button class="${this.mode === 'login' ? 'on' : ''}" onclick="Auth.set('login')">Sign in</button>
        <button class="${this.mode === 'register' ? 'on' : ''}" onclick="Auth.set('register')">Create account</button>
      </div>
      <div id="authBody"></div>
    </div></div>`;
    this.body();
  },
  set(m) { this.mode = m; this.render(); },
  body() {
    $('authBody').innerHTML = this.mode === 'login' ? this.loginForm() : this.registerForm();
  },
  loginForm() {
    return `<div id="aAlert" class="alert err hidden"></div>
      <div class="field"><label>Email</label><input id="l_email" class="input" type="email" placeholder="you@company.com"></div>
      <div class="field"><label>Password</label><input id="l_pass" class="input" type="password" placeholder="••••••••" onkeydown="if(event.key==='Enter')Auth.login()"></div>
      <button class="btn block" onclick="Auth.login()">Sign in</button>
      <div class="hint" style="margin-top:14px">Try a demo account:</div>
      <div class="demo-row">
        <button onclick="Auth.demo('maya@taskska.app')">Taskmaster</button>
        <button onclick="Auth.demo('leo@taskska.app')">Tasker</button>
        <button onclick="Auth.demo('sam@taskska.app')">Auditor</button>
        <button onclick="Auth.demo('admin@taskska.app','Admin@123')">Admin</button>
      </div>`;
  },
  registerForm() {
    return `<div id="aAlert" class="alert err hidden"></div>
      <div class="field"><label>Full name</label><input id="r_name" class="input" placeholder="Jane Doe"></div>
      <div class="field"><label>Email</label><input id="r_email" class="input" type="email"></div>
      <div class="field"><label>Password</label><input id="r_pass" class="input" type="password" placeholder="At least 8 characters"></div>
      <div class="row">
        <div class="field"><label>Role</label><select id="r_role"><option value="TASKMASTER">Taskmaster</option><option value="TASKER">Tasker</option></select></div>
        <div class="field"><label>Weekly capacity (h)</label><input id="r_cap" class="input" type="number" value="40"></div>
      </div>
      <div class="field"><label>Job title</label><input id="r_job" class="input" placeholder="e.g. Engineer"></div>
      <div class="field"><label>Skills</label><input id="r_skills" class="input" placeholder="React, Node.js, SQL (comma separated)"></div>
      <button class="btn block" onclick="Auth.register()">Create account</button>`;
  },
  alert(m) { const a = $('aAlert'); a.textContent = m; a.classList.remove('hidden'); },
  demo(email, pass) { $('l_email').value = email; $('l_pass').value = pass || 'Sample@123'; this.login(); },
  async login() {
    try {
      const r = await API.post('/auth/login', { email: $('l_email').value.trim(), password: $('l_pass').value });
      if (r.mfaRequired) return this.mfaPrompt(r.email);
      App.start(r.user);
    } catch (e) { this.alert(e.message); }
  },
  mfaPrompt(email) {
    $('authBody').innerHTML = `<div id="aAlert" class="alert err hidden"></div>
      <p class="muted">A 6-digit code was sent. Demo code: <b>123456</b>.</p>
      <div class="field"><label>Verification code</label><input id="m_code" class="input" placeholder="123456"></div>
      <button class="btn block" onclick="Auth.verifyOtp('${esc(email)}')">Verify</button>`;
  },
  async verifyOtp(email) {
    try { const r = await API.post('/auth/verify-otp', { email, code: $('m_code').value.trim() }); App.start(r.user); }
    catch (e) { this.alert(e.message); }
  },
  async register() {
    try {
      const r = await API.post('/auth/register', {
        fullName: $('r_name').value.trim(), email: $('r_email').value.trim(), password: $('r_pass').value,
        role: $('r_role').value, weeklyCapacityHours: parseInt($('r_cap').value) || 40,
        jobTitle: $('r_job').value.trim(),
        skills: $('r_skills').value.split(',').map(s => s.trim()).filter(Boolean),
      });
      App.start(r.user);
    } catch (e) { this.alert(e.message); }
  },
};

/* ===================== VIEWS ===================== */
const Views = {
  async dashboard() {
    loading();
    try {
      const [mine, wl] = await Promise.all([API.get('/tasks'), API.get('/workload/me')]);
      const overdue = mine.filter(t => t.status === 'OVERDUE').length;
      const done = mine.filter(t => t.status === 'COMPLETED').length;
      const active = mine.filter(t => t.status !== 'COMPLETED').length;
      C().innerHTML = `
      <div class="page-h"><h1>Welcome back, ${esc(App.me.fullName.split(' ')[0])}</h1><div class="grow"></div>
        ${App.me.role !== 'AUDITOR' ? '<button class="btn" onclick="Modal.taskForm()">+ New task</button>' : ''}</div>
      <div class="stat-grid">
        <div class="stat"><div class="ic">&#128202;</div><div class="n">${wl.percent}%</div><div class="l">My workload · <span class="lvl ${wl.level}">${wl.level}</span></div></div>
        <div class="stat"><div class="ic">&#9776;</div><div class="n">${active}</div><div class="l">Active tasks</div></div>
        <div class="stat"><div class="ic">&#9989;</div><div class="n">${done}</div><div class="l">Completed</div></div>
        <div class="stat"><div class="ic">&#9888;</div><div class="n">${overdue}</div><div class="l">Overdue</div></div>
      </div>
      <div class="card pad">
        <div class="section-h"><h2>My tasks</h2><div class="grow"></div><a onclick="App.go('board')">Open board →</a></div>
        ${mine.length ? mine.slice(0, 6).map(t => Views.taskRow(t)).join('') : '<div class="empty">No tasks yet. Create one to get started.</div>'}
      </div>`;
    } catch (e) { C().innerHTML = errBox(e); }
  },
  taskRow(t) {
    return `<div class="lc" style="display:flex;align-items:center;gap:12px;cursor:pointer" onclick="Modal.detail('${t.taskCode}')">
      <div style="flex:1"><span class="code">${t.taskCode}</span> · <b>${esc(t.title)}</b>
        <div class="meta" style="margin-top:6px"><span class="pill ${t.priority}">${t.priority}</span>
          <span class="pill ${t.status}">${STATUS_LABEL[t.status] || t.status}</span>
          ${t.deadline ? `<span class="muted" style="font-size:12px">due ${fmtDate(t.deadline)}</span>` : ''}
          ${t.assigneeName ? `<span class="muted" style="font-size:12px">· ${esc(t.assigneeName)}</span>` : ''}</div></div>
      <div style="width:120px"><div class="prog"><i style="width:${t.progress}%"></i></div><div class="muted" style="font-size:11px;margin-top:3px">${t.progress}%</div></div>
    </div>`;
  },
  async board() {
    loading();
    try {
      const mine = await API.get('/tasks');
      window.__board = mine;
      C().innerHTML = `
      <div class="page-h"><h1>My Board</h1><div class="grow"></div>
        ${App.me.role !== 'AUDITOR' ? '<button class="btn" onclick="Modal.taskForm()">+ New task</button>' : ''}</div>
      <div class="board">${STATUSES.map(s => Views.boardCol(s, mine)).join('')}</div>
      <p class="muted" style="margin-top:14px;font-size:13px">Drag a card between columns to change its status. Click a card to open it.</p>`;
    } catch (e) { C().innerHTML = errBox(e); }
  },
  boardCol(status, tasks) {
    const list = tasks.filter(t => t.status === status || (status === 'NOT_STARTED' && t.status === 'OVERDUE'));
    return `<div class="col" data-status="${status}" ondragover="event.preventDefault();this.classList.add('drop')" ondragleave="this.classList.remove('drop')" ondrop="Views.drop(event,'${status}')">
      <h3>${STATUS_LABEL[status]}<span>${list.length}</span></h3>
      ${list.map(t => `<div class="tcard" draggable="true" ondragstart="event.dataTransfer.setData('code','${t.taskCode}')" onclick="Modal.detail('${t.taskCode}')">
        <div class="code">${t.taskCode}</div><div class="tt">${esc(t.title)}</div>
        <div class="meta"><span class="pill ${t.priority}">${t.priority}</span>
          ${t.status === 'OVERDUE' ? '<span class="pill OVERDUE">Overdue</span>' : ''}
          ${t.deadline ? `<span class="muted" style="font-size:11px">${fmtDate(t.deadline)}</span>` : ''}</div>
        <div class="prog"><i style="width:${t.progress}%"></i></div>
      </div>`).join('')}
    </div>`;
  },
  async drop(ev, status) {
    ev.preventDefault();
    document.querySelectorAll('.col').forEach(c => c.classList.remove('drop'));
    const code = ev.dataTransfer.getData('code'); if (!code) return;
    try { await API.post('/tasks/' + code + '/status', { status }); toast(code + ' → ' + STATUS_LABEL[status]); this.board(); App.pollUnread(); }
    catch (e) { toast(e.message); }
  },
  async created() {
    loading();
    try {
      const list = await API.get('/tasks/created');
      C().innerHTML = `<div class="page-h"><h1>Created by me</h1><div class="grow"></div>
        ${App.me.role !== 'AUDITOR' ? '<button class="btn" onclick="Modal.taskForm()">+ New task</button>' : ''}</div>
        <div class="card pad">${list.length ? list.map(t => Views.taskRow(t)).join('') : '<div class="empty">You haven\'t created any tasks.</div>'}</div>`;
    } catch (e) { C().innerHTML = errBox(e); }
  },
  async openPool() {
    loading();
    try {
      const list = await API.get('/tasks/open');
      C().innerHTML = `<div class="page-h"><h1>Open Task Pool</h1><div class="grow"></div>
        ${App.me.role !== 'AUDITOR' ? '<button class="btn ghost" onclick="Modal.taskForm(true)">+ Post open task</button>' : ''}</div>
      <div class="card pad">${list.length ? list.map(t => `<div class="lc" style="display:flex;align-items:center;gap:12px">
        <div style="flex:1"><span class="code">${t.taskCode}</span> · <b>${esc(t.title)}</b>
          <div class="muted" style="font-size:13px;margin-top:3px">${esc(t.description || '')}</div>
          <div class="meta" style="margin-top:6px"><span class="pill ${t.priority}">${t.priority}</span>
            ${(t.requiredSkills || []).map(s => `<span class="chip">${esc(s)}</span>`).join('')}
            <span class="muted" style="font-size:12px">${t.estimatedHours}h${t.deadline ? ' · due ' + fmtDate(t.deadline) : ''}</span></div></div>
        ${App.me.role !== 'AUDITOR' && t.creatorId !== App.me.id ? (t.viewerRequested
          ? '<span class="muted">Requested ✓</span>'
          : `<button class="btn sm" onclick="Modal.requestTask('${t.taskCode}')">Request</button>`) : ''}
      </div>`).join('') : '<div class="empty"><div class="big">&#128229;</div>No open tasks right now.</div>'}</div>`;
    } catch (e) { C().innerHTML = errBox(e); }
  },
  async workload() {
    loading();
    try {
      const isMgr = App.isManager();
      window.__wlScope = window.__wlScope || (isMgr ? 'all' : '');
      const team = await API.get('/workload/team' + (window.__wlScope === 'all' ? '?scope=all' : ''));
      const scopeSel = isMgr ? `<select id="wlScope" onchange="Views.setScope(this.value)" style="width:auto">
        <option value="all"${window.__wlScope === 'all' ? ' selected' : ''}>All taskers</option>
        <option value=""${window.__wlScope === '' ? ' selected' : ''}>My connections</option></select>` : '';
      C().innerHTML = `<div class="page-h"><h1>Team Workload</h1><div class="grow"></div>${scopeSel}</div>
        <div class="card pad">${team.map(w => {
          const col = w.percent > 80 ? 'var(--high)' : w.percent > 50 ? 'var(--med)' : 'var(--low)';
          return `<div class="wl-row"><div class="who"><b>${esc(w.name)}${w.userId === App.me.id ? ' (you)' : ''}</b><small>${esc(w.jobTitle || '')}</small></div>
            <div class="wl-bar"><i style="width:${w.percent}%;background:${col}"></i></div>
            <div style="width:54px;text-align:right;font-weight:700">${w.percent}%</div>
            <div style="width:90px;text-align:right" class="muted">${w.activeTasks} active</div>
            <span class="lvl ${w.level}">${w.level}</span></div>`;
        }).join('')}</div>
        <p class="muted" style="margin-top:14px;font-size:13px">Workload = committed remaining hours vs weekly capacity, weighted up for imminent/overdue tasks and calibrated by each person's historical actuals. Low ≤50% · Medium 51–80% · High &gt;80%.</p>`;
    } catch (e) { C().innerHTML = errBox(e); }
  },
  setScope(v) { window.__wlScope = v; this.workload(); },
  async search() {
    loading();
    const q = window.__q || '';
    try {
      const list = await API.get('/tasks/search?' + new URLSearchParams({ q }));
      C().innerHTML = `<div class="page-h"><h1>Search: "${esc(q)}"</h1></div>
        <div class="card pad">${list.length ? list.map(t => Views.taskRow(t)).join('') : '<div class="empty">No matches.</div>'}</div>`;
    } catch (e) { C().innerHTML = errBox(e); }
  },
};

/* connections / requests / templates / settings */
Object.assign(Views, {
  async connections() {
    loading();
    try {
      const list = await API.get('/connections');
      const cur = list.filter(c => c.direction === 'CURRENT');
      const inc = list.filter(c => c.direction === 'INCOMING');
      const out = list.filter(c => c.direction === 'OUTGOING');
      C().innerHTML = `<div class="page-h"><h1>Connections</h1><div class="grow"></div>
        ${App.me.role !== 'AUDITOR' ? '<button class="btn" onclick="Modal.connect()">+ Add connection</button>' : ''}</div>
      ${inc.length ? `<div class="card pad" style="margin-bottom:14px"><div class="section-h"><h2>Pending requests</h2></div>
        ${inc.map(c => `<div class="wl-row"><div class="who"><b>${esc(c.name)}</b><small>${esc(c.email || '')}</small></div><div class="grow"></div>
          <button class="btn sm" onclick="Views.respond(${c.id},true)">Accept</button>
          <button class="btn sm danger" onclick="Views.respond(${c.id},false)">Decline</button></div>`).join('')}</div>` : ''}
      <div class="card pad"><div class="section-h"><h2>Your network (${cur.length})</h2></div>
        ${cur.length ? cur.map(c => `<div class="wl-row"><div class="who"><b>${esc(c.name)}</b><small>${esc(c.jobTitle || c.email || '')}</small></div>
          ${c.workloadPercent != null ? `<span class="lvl ${c.workloadPercent > 80 ? 'HIGH' : c.workloadPercent > 50 ? 'MEDIUM' : 'LOW'}">${c.workloadPercent}% load</span>` : ''}
          <div class="grow"></div><button class="btn sm danger" onclick="Views.removeConn(${c.id})">Remove</button></div>`).join('')
          : '<div class="empty">No connections yet. Add teammates by email to assign tasks and see their workload.</div>'}</div>
      ${out.length ? `<div class="card pad" style="margin-top:14px"><div class="section-h"><h2>Sent (awaiting reply)</h2></div>
        ${out.map(c => `<div class="wl-row"><div class="who"><b>${esc(c.name)}</b></div><div class="grow"></div><span class="muted">Pending</span></div>`).join('')}</div>` : ''}`;
    } catch (e) { C().innerHTML = errBox(e); }
  },
  async respond(id, accept) { try { await API.post('/connections/' + id + '/respond', { accept }); toast(accept ? 'Connected' : 'Declined'); this.connections(); } catch (e) { toast(e.message); } },
  async removeConn(id) { if (!confirm('Remove this connection?')) return; try { await API.del('/connections/' + id); this.connections(); } catch (e) { toast(e.message); } },

  async requests() {
    loading();
    try {
      const r = await API.get('/requests');
      C().innerHTML = `<div class="page-h"><h1>Assignment Requests</h1></div>
      <div class="card pad" style="margin-bottom:14px"><div class="section-h"><h2>Incoming — taskers want your open tasks (${r.incoming.length})</h2></div>
        ${r.incoming.length ? r.incoming.map(x => `<div class="lc">
          <div style="display:flex;gap:10px;align-items:center"><b>${esc(x.taskerName)}</b>
            ${x.skillMatchPercent != null ? `<span class="lvl ${x.skillMatchPercent >= 67 ? 'LOW' : x.skillMatchPercent >= 34 ? 'MEDIUM' : 'HIGH'}">${x.skillMatchPercent}% skill match</span>` : ''}
            <span class="muted">· ${x.taskerWorkloadPercent}% load</span><div class="grow"></div>
            <span class="code">${x.taskCode}</span></div>
          <div class="muted" style="margin:6px 0">wants: <b>${esc(x.taskTitle)}</b></div>
          ${x.comment ? `<div style="font-size:13px">“${esc(x.comment)}”</div>` : ''}
          <div style="display:flex;gap:8px;margin-top:10px"><button class="btn sm" onclick="Views.decide(${x.id},'approve')">Approve &amp; assign</button>
            <button class="btn sm danger" onclick="Views.decide(${x.id},'decline')">Decline</button></div></div>`).join('')
          : '<div class="empty">No incoming requests.</div>'}</div>
      <div class="card pad"><div class="section-h"><h2>My requests (${r.mine.length})</h2></div>
        ${r.mine.length ? r.mine.map(x => `<div class="wl-row"><div style="flex:1"><b>${esc(x.taskTitle)}</b> <span class="code">${x.taskCode}</span></div>
          <span class="pill ${x.status === 'APPROVED' ? 'COMPLETED' : x.status === 'DECLINED' ? 'OVERDUE' : 'IN_PROGRESS'}">${x.status}</span></div>`).join('')
          : '<div class="empty">You haven\'t requested any open tasks.</div>'}</div>`;
    } catch (e) { C().innerHTML = errBox(e); }
  },
  async decide(id, action) { try { await API.post('/requests/' + id + '/' + action); toast(action === 'approve' ? 'Approved & assigned' : 'Declined'); this.requests(); } catch (e) { toast(e.message); } },

  async templates() {
    loading();
    try {
      const list = await API.get('/templates');
      window.__templates = list;
      C().innerHTML = `<div class="page-h"><h1>Task Templates</h1><div class="grow"></div>
        ${App.me.role !== 'AUDITOR' ? '<button class="btn" onclick="Modal.templateForm()">+ New template</button>' : ''}</div>
      <div class="card pad">${list.length ? list.map(t => `<div class="lc" style="display:flex;align-items:center;gap:12px">
        <div style="flex:1"><b>${esc(t.name)}</b><div class="muted" style="font-size:13px">${esc(t.title)} · ${t.estimatedHours}h · due +${t.deadlineOffsetDays}d${t.defaultAssigneeName ? ' · ' + esc(t.defaultAssigneeName) : ''}</div></div>
        <button class="btn sm" onclick="Views.useTemplate(${t.id})">Use</button>
        <button class="btn sm ghost" onclick="Modal.templateForm(${t.id})">Edit</button>
        <button class="btn sm danger" onclick="Views.delTemplate(${t.id})">✕</button></div>`).join('')
        : '<div class="empty">No templates. Create one to spin up recurring tasks in a click.</div>'}</div>`;
    } catch (e) { C().innerHTML = errBox(e); }
  },
  async useTemplate(id) { try { const t = await API.post('/templates/' + id + '/instantiate'); toast('Created ' + t.taskCode); App.go('board'); } catch (e) { toast(e.message); } },
  async delTemplate(id) { if (!confirm('Delete template?')) return; try { await API.del('/templates/' + id); this.templates(); } catch (e) { toast(e.message); } },

  async settings() {
    loading();
    try {
      const me = await API.get('/profile');
      C().innerHTML = `<div class="page-h"><h1>Profile &amp; settings</h1></div>
      <div class="card pad" style="margin-bottom:14px"><div class="section-h"><h2>Profile</h2></div>
        <div class="row"><div class="field"><label>Full name</label><input id="p_name" class="input" value="${esc(me.fullName)}"></div>
          <div class="field"><label>Job title</label><input id="p_job" class="input" value="${esc(me.jobTitle || '')}"></div></div>
        <div class="row"><div class="field"><label>Availability</label><select id="p_avail"><option ${me.availability === 'Full-time' ? 'selected' : ''}>Full-time</option><option ${me.availability === 'Part-time' ? 'selected' : ''}>Part-time</option></select></div>
          <div class="field"><label>Weekly capacity (h)</label><input id="p_cap" class="input" type="number" value="${me.weeklyCapacityHours}"></div></div>
        <div class="field"><label>Skills</label><input id="p_skills" class="input" value="${esc((me.skills || []).join(', '))}"></div>
        <button class="btn" onclick="Views.saveProfile()">Save profile</button></div>
      <div class="card pad" style="margin-bottom:14px"><div class="section-h"><h2>Security</h2></div>
        <label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="p_mfa" ${me.mfaEnabled ? 'checked' : ''} onchange="Views.toggleMfa(this.checked)" style="width:18px;height:18px"> Require a verification code at sign-in (MFA)</label>
        <div class="row" style="margin-top:14px"><div class="field"><label>Current password</label><input id="p_cur" class="input" type="password"></div>
          <div class="field"><label>New password</label><input id="p_new" class="input" type="password"></div></div>
        <button class="btn ghost" onclick="Views.changePw()">Change password</button></div>
      <div class="card pad"><div class="section-h"><h2>Notifications</h2></div>
        ${[['notifyAssignment', 'Task assignments'], ['notifyStatus', 'Status updates on my tasks'], ['notifyDeadline', 'Deadline reminders'], ['notifyConnection', 'Connection requests']].map(([k, l]) =>
          `<label style="display:flex;gap:8px;align-items:center;padding:5px 0"><input type="checkbox" id="n_${k}" ${me[k] ? 'checked' : ''} style="width:18px;height:18px"> ${l}</label>`).join('')}
        <button class="btn ghost" style="margin-top:8px" onclick="Views.saveNotif()">Save preferences</button></div>`;
    } catch (e) { C().innerHTML = errBox(e); }
  },
  async saveProfile() {
    try { const me = await API.put('/profile', { fullName: $('p_name').value.trim(), jobTitle: $('p_job').value.trim(),
        availability: $('p_avail').value, weeklyCapacityHours: parseInt($('p_cap').value) || 40,
        skills: $('p_skills').value.split(',').map(s => s.trim()).filter(Boolean) });
      App.me.fullName = me.fullName; toast('Profile saved'); App.render(); App.go('settings'); } catch (e) { toast(e.message); }
  },
  async toggleMfa(enabled) { try { const r = await API.post('/auth/mfa', { enabled }); toast(r.message); } catch (e) { toast(e.message); } },
  async changePw() { try { const r = await API.post('/profile/password', { current: $('p_cur').value, next: $('p_new').value }); toast(r.message); $('p_cur').value = ''; $('p_new').value = ''; } catch (e) { toast(e.message); } },
  async saveNotif() {
    const b = {}; ['notifyAssignment', 'notifyStatus', 'notifyDeadline', 'notifyConnection'].forEach(k => b[k] = $('n_' + k).checked);
    try { await API.put('/profile/notifications', b); toast('Preferences updated'); } catch (e) { toast(e.message); }
  },
});

/* ===================== MODALS ===================== */
const Modal = {
  shell(title, inner) {
    $('modalRoot').innerHTML = `<div class="overlay" onclick="if(event.target===this)Modal.close()">
      <div class="modal"><div class="modal-h"><h2>${title}</h2><button class="x" onclick="Modal.close()">&times;</button></div>
        <div class="modal-b">${inner}</div></div></div>`;
  },
  close() { $('modalRoot').innerHTML = ''; },
  alert(m) { const a = $('mAlert'); if (a) { a.textContent = m; a.classList.remove('hidden'); } },

  async taskForm(openDefault) {
    let conns = [];
    try { conns = await API.get('/connections'); } catch {}
    const opts = conns.filter(c => c.direction === 'CURRENT').map(c => `<option value="${c.otherUserId}">${esc(c.name)}</option>`).join('');
    const open = openDefault === true;
    this.shell(open ? 'Post an open task' : 'Create task', `
      <div id="mAlert" class="alert err hidden"></div>
      <div class="field"><label>Title *</label><input id="t_title" class="input" placeholder="What needs doing?"></div>
      <div class="field"><label>Description</label><textarea id="t_desc" rows="2" placeholder="Add detail…"></textarea></div>
      <div class="field"><label>Requirements</label><textarea id="t_req" rows="2" placeholder="Acceptance criteria, deliverables…"></textarea></div>
      <div class="row">
        <div class="field"><label>Deadline</label><input id="t_deadline" class="input" type="date"></div>
        <div class="field"><label>Estimated hours</label><input id="t_hours" class="input" type="number" value="4" min="0.5" step="0.5"></div>
      </div>
      <div class="row">
        <div class="field"><label>Priority</label><select id="t_priority"><option>LOW</option><option selected>MEDIUM</option><option>HIGH</option><option>URGENT</option></select></div>
        <div class="field"><label>Required skills</label><input id="t_skills" class="input" placeholder="React, SQL"></div>
      </div>
      <div class="field"><label style="display:flex;gap:8px;align-items:center;cursor:pointer">
        <input type="checkbox" id="t_open" ${open ? 'checked' : ''} onchange="document.getElementById('t_assignRow').style.display=this.checked?'none':''" style="width:18px;height:18px"> Open for requests (unassigned; taskers can claim)</label></div>
      <div class="field" id="t_assignRow" style="${open ? 'display:none' : ''}"><label>Assign to</label>
        <select id="t_assignee"><option value="">Myself</option>${opts}<option value="__auto">⚡ Auto-assign (lowest workload)</option></select></div>
      <div class="field"><label>Subtasks (comma separated)</label><input id="t_subs" class="input" placeholder="Design, Build, Test"></div>
      <div class="field"><label>Depends on (task codes)</label><input id="t_deps" class="input" placeholder="TSK-000003, TSK-000004"></div>
      <button class="btn block" onclick="Modal.createTask()">Create task</button>`);
  },
  async createTask() {
    try {
      const isOpen = $('t_open').checked;
      const a = isOpen ? '' : $('t_assignee').value;
      const t = await API.post('/tasks', {
        title: $('t_title').value.trim(), description: $('t_desc').value.trim(), requirements: $('t_req').value.trim(),
        priority: $('t_priority').value, requiredSkills: $('t_skills').value.split(',').map(s => s.trim()).filter(Boolean),
        isOpen, deadline: $('t_deadline').value || null, estimatedHours: parseFloat($('t_hours').value) || 4,
        autoAssign: a === '__auto', assigneeId: (a && a !== '__auto') ? parseInt(a) : null,
        subtasks: $('t_subs').value.split(',').map(s => s.trim()).filter(Boolean),
        dependencyCodes: $('t_deps').value.split(',').map(s => s.trim()).filter(Boolean),
      });
      this.close(); toast('Created ' + t.taskCode); App.go(App.page === 'open' ? 'open' : 'board');
    } catch (e) { this.alert(e.message); }
  },

  async detail(code) {
    try {
      const t = await API.get('/tasks/' + code);
      const canEdit = t.canEdit && App.me.role !== 'AUDITOR';
      const statusBtns = canEdit ? ['NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED'].map(s =>
        `<button class="btn sm ${t.status === s ? '' : 'ghost'}" onclick="Modal.setStatus('${code}','${s}')">${STATUS_LABEL[s]}</button>`).join(' ') : '';
      this.shell(`${t.taskCode}`, `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          <span class="pill ${t.priority}">${t.priority}</span><span class="pill ${t.status}">${STATUS_LABEL[t.status] || t.status}</span>
          ${t.isOpen ? '<span class="chip">Open pool</span>' : ''}</div>
        <h2 style="margin:4px 0">${esc(t.title)}</h2>
        <p class="muted">${esc(t.description || 'No description.')}</p>
        ${t.requirements ? `<div class="field"><label>Requirements</label><div style="font-size:13px">${esc(t.requirements)}</div></div>` : ''}
        <div class="row" style="margin:10px 0">
          <div><label class="muted" style="font-size:12px">Assignee</label><div>${esc(t.assigneeName || 'Unassigned')}</div></div>
          <div><label class="muted" style="font-size:12px">Creator</label><div>${esc(t.creatorName || '')}</div></div>
          <div><label class="muted" style="font-size:12px">Deadline</label><div>${t.deadline ? fmtDate(t.deadline) : '—'}</div></div>
          <div><label class="muted" style="font-size:12px">Est.</label><div>${t.estimatedHours}h</div></div>
        </div>
        ${(t.requiredSkills || []).length ? `<div class="chips" style="margin-bottom:8px">${t.requiredSkills.map(s => `<span class="chip">${esc(s)}</span>`).join('')}</div>` : ''}
        ${t.dependencyCodes.length ? `<div class="field"><label>Depends on</label><div>${t.dependencyCodes.map(c => `<span class="chip">${c}</span>`).join(' ')} ${t.blockedByDependency ? '<span class="pill BLOCKED">blocked</span>' : '<span class="pill COMPLETED">clear</span>'}</div></div>` : ''}
        <div class="field"><label>Progress — ${t.progress}%</label><div class="prog"><i style="width:${t.progress}%"></i></div>
          ${canEdit ? `<input type="range" min="0" max="100" step="5" value="${t.progress}" oninput="this.nextElementSibling.textContent=this.value+'%'" onchange="Modal.setProgress('${code}',this.value)" style="width:100%;margin-top:8px"><span class="muted"></span>` : ''}</div>
        <div class="field"><label>Subtasks</label>${t.subtasks.length ? t.subtasks.map(s =>
          `<label style="display:flex;gap:8px;align-items:center;padding:4px 0"><input type="checkbox" ${s.done ? 'checked' : ''} ${canEdit ? '' : 'disabled'} onchange="Modal.toggleSub('${code}',${s.id})" style="width:17px;height:17px"> <span style="${s.done ? 'text-decoration:line-through;color:var(--muted)' : ''}">${esc(s.title)}</span></label>`).join('') : '<div class="muted">None</div>'}</div>
        ${canEdit ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0">${statusBtns}</div>` : ''}
        <div style="display:flex;gap:8px;margin-top:12px">
          ${canEdit ? `<button class="btn ghost" onclick="Modal.editTask('${code}')">Edit</button>` : ''}
          ${canEdit && (App.me.role === 'ADMIN' || t.creatorId === App.me.id) ? `<button class="btn danger" onclick="Modal.delTask('${code}')">Delete</button>` : ''}
        </div>`);
    } catch (e) { this.shell('Task', errBox(e)); }
  },
  async setStatus(code, s) { try { await API.post('/tasks/' + code + '/status', { status: s }); this.detail(code); App.pollUnread(); if (App.page === 'board') Views.board(); } catch (e) { toast(e.message); } },
  async setProgress(code, v) { try { await API.post('/tasks/' + code + '/progress', { progress: parseInt(v) }); this.detail(code); } catch (e) { toast(e.message); } },
  async toggleSub(code, id) { try { await API.post('/tasks/' + code + '/subtasks/' + id + '/toggle'); this.detail(code); } catch (e) { toast(e.message); } },
  async delTask(code) { if (!confirm('Delete ' + code + '?')) return; try { await API.del('/tasks/' + code); this.close(); toast('Deleted'); App.go(App.page); } catch (e) { toast(e.message); } },

  async editTask(code) {
    const t = await API.get('/tasks/' + code);
    this.shell('Edit ' + code, `<div id="mAlert" class="alert err hidden"></div>
      <div class="field"><label>Title</label><input id="e_title" class="input" value="${esc(t.title)}"></div>
      <div class="field"><label>Description</label><textarea id="e_desc" rows="2">${esc(t.description || '')}</textarea></div>
      <div class="row"><div class="field"><label>Priority</label><select id="e_priority">${['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map(p => `<option ${t.priority === p ? 'selected' : ''}>${p}</option>`).join('')}</select></div>
        <div class="field"><label>Deadline</label><input id="e_deadline" class="input" type="date" value="${t.deadline ? t.deadline.slice(0, 10) : ''}"></div>
        <div class="field"><label>Est. hours</label><input id="e_hours" class="input" type="number" value="${t.estimatedHours}" step="0.5"></div></div>
      <button class="btn block" onclick="Modal.saveEdit('${code}')">Save</button>`);
  },
  async saveEdit(code) {
    try { await API.put('/tasks/' + code, { title: $('e_title').value.trim(), description: $('e_desc').value.trim(),
        priority: $('e_priority').value, deadline: $('e_deadline').value || null, estimatedHours: parseFloat($('e_hours').value) || 4 });
      toast('Saved'); this.detail(code); if (App.page === 'board') Views.board(); } catch (e) { this.alert(e.message); }
  },
  requestTask(code) {
    this.shell('Request this task', `<div id="mAlert" class="alert err hidden"></div>
      <p class="muted">Tell the owner why you're a good fit — relevant skills, availability, context.</p>
      <div class="field"><label>Your note</label><textarea id="rq" rows="4" placeholder="e.g. I've shipped 3 similar features and have capacity this week."></textarea></div>
      <button class="btn block" onclick="Modal.sendRequest('${code}')">Send request</button>`);
  },
  async sendRequest(code) { try { await API.post('/tasks/' + code + '/request', { comment: $('rq').value.trim() }); this.close(); toast('Request sent'); Views.openPool(); } catch (e) { this.alert(e.message); } },
  connect() {
    this.shell('Add connection', `<div id="mAlert" class="alert err hidden"></div>
      <p class="muted">Send a connection request by email. Once accepted you can assign each other tasks and see workloads.</p>
      <div class="field"><label>Email</label><input id="c_email" class="input" type="email" placeholder="teammate@company.com"></div>
      <button class="btn block" onclick="Modal.sendConnect()">Send request</button>`);
  },
  async sendConnect() { try { await API.post('/connections', { email: $('c_email').value.trim() }); this.close(); toast('Request sent'); Views.connections(); } catch (e) { this.alert(e.message); } },
  async templateForm(id) {
    const t = (window.__templates || []).find(x => x.id === id) || { name: '', title: '', description: '', estimatedHours: 4, deadlineOffsetDays: 7 };
    this.shell(id ? 'Edit template' : 'New template', `<div id="mAlert" class="alert err hidden"></div>
      <div class="field"><label>Template name *</label><input id="tp_name" class="input" value="${esc(t.name)}" placeholder="e.g. Weekly report"></div>
      <div class="field"><label>Task title *</label><input id="tp_title" class="input" value="${esc(t.title)}"></div>
      <div class="field"><label>Description</label><textarea id="tp_desc" rows="2">${esc(t.description || '')}</textarea></div>
      <div class="row"><div class="field"><label>Est. hours</label><input id="tp_hours" class="input" type="number" value="${t.estimatedHours}" step="0.5"></div>
        <div class="field"><label>Deadline offset (days)</label><input id="tp_off" class="input" type="number" value="${t.deadlineOffsetDays}"></div></div>
      <button class="btn block" onclick="Modal.saveTemplate(${id || 'null'})">${id ? 'Save' : 'Create'}</button>`);
  },
  async saveTemplate(id) {
    const b = { name: $('tp_name').value.trim(), title: $('tp_title').value.trim(), description: $('tp_desc').value.trim(),
      estimatedHours: parseFloat($('tp_hours').value) || 4, deadlineOffsetDays: parseInt($('tp_off').value) || 7 };
    try { if (id) await API.put('/templates/' + id, b); else await API.post('/templates', b); this.close(); toast('Saved'); Views.templates(); } catch (e) { this.alert(e.message); }
  },
};

/* ===================== ADMIN ===================== */
const Admin = {
  overview() { this.tab = this.tab || 'stats'; this.render(); },
  async render() {
    loading();
    try {
      const tab = this.tab || 'stats';
      const tabs = ['stats', 'users', 'tasks', 'requests'].map(t =>
        `<button class="btn sm ${tab === t ? '' : 'ghost'}" onclick="Admin.go('${t}')">${t[0].toUpperCase() + t.slice(1)}</button>`).join(' ');
      let body = '';
      if (tab === 'stats') {
        const s = await API.get('/admin/stats'); const sb = s.tasksByStatus || {};
        body = `<div class="stat-grid">
          <div class="stat"><div class="ic">&#128101;</div><div class="n">${s.totalUsers}</div><div class="l">Users</div></div>
          <div class="stat"><div class="ic">&#9776;</div><div class="n">${s.totalTasks}</div><div class="l">Tasks</div></div>
          <div class="stat"><div class="ic">&#9989;</div><div class="n">${s.completionRate}%</div><div class="l">Completion rate</div></div>
          <div class="stat"><div class="ic">&#9888;</div><div class="n">${s.overdueTasks}</div><div class="l">Overdue</div></div></div>
        <div class="card pad" style="margin-bottom:14px"><div class="section-h"><h2>Tasks by status</h2></div>
          ${Object.keys(sb).map(k => `<div class="wl-row"><span class="pill ${k}">${STATUS_LABEL[k] || k}</span><div class="wl-bar"><i style="width:${Math.round(sb[k] / s.totalTasks * 100)}%;background:var(--blue)"></i></div><b style="width:30px;text-align:right">${sb[k]}</b></div>`).join('')}</div>
        <div class="card pad"><div class="section-h"><h2>Team workload</h2></div>
          ${s.teamWorkload.map(w => { const c = w.percent > 80 ? 'var(--high)' : w.percent > 50 ? 'var(--med)' : 'var(--low)';
            return `<div class="wl-row"><div class="who"><b>${esc(w.name)}</b></div><div class="wl-bar"><i style="width:${w.percent}%;background:${c}"></i></div><b style="width:46px;text-align:right">${w.percent}%</b><span class="lvl ${w.level}">${w.level}</span></div>`; }).join('')}</div>`;
      } else if (tab === 'users') {
        const u = await API.get('/admin/users');
        body = `<div class="card pad"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Load</th><th>Status</th><th></th></tr></thead><tbody>
          ${u.map(x => `<tr><td><b>${esc(x.fullName)}</b></td><td class="muted">${esc(x.email)}</td>
            <td><select onchange="Admin.setRole(${x.id},this.value)" style="width:auto;padding:5px">${['TASKMASTER', 'TASKER', 'AUDITOR', 'ADMIN'].map(r => `<option ${x.role === r ? 'selected' : ''}>${r}</option>`).join('')}</select></td>
            <td><span class="lvl ${x.workloadPercent > 80 ? 'HIGH' : x.workloadPercent > 50 ? 'MEDIUM' : 'LOW'}">${x.workloadPercent}%</span></td>
            <td>${x.enabled ? '<span class="pill COMPLETED">Active</span>' : '<span class="pill OVERDUE">Disabled</span>'}</td>
            <td><button class="btn sm ghost" onclick="Admin.toggle(${x.id},${!x.enabled})">${x.enabled ? 'Disable' : 'Enable'}</button>
              <button class="btn sm danger" onclick="Admin.delUser(${x.id})">✕</button></td></tr>`).join('')}</tbody></table></div>`;
      } else if (tab === 'tasks') {
        const t = await API.get('/admin/tasks');
        body = `<div class="card pad"><table><thead><tr><th>Code</th><th>Title</th><th>Status</th><th>Priority</th><th>Assignee</th><th></th></tr></thead><tbody>
          ${t.map(x => `<tr><td class="code">${x.taskCode}</td><td><b>${esc(x.title)}</b></td><td><span class="pill ${x.status}">${STATUS_LABEL[x.status] || x.status}</span></td>
            <td><span class="pill ${x.priority}">${x.priority}</span></td><td>${esc(x.assigneeName || '—')}</td>
            <td><button class="btn sm ghost" onclick="Modal.detail('${x.taskCode}')">Open</button>
              <button class="btn sm danger" onclick="Admin.delTask('${x.taskCode}')">✕</button></td></tr>`).join('')}</tbody></table></div>`;
      } else if (tab === 'requests') {
        const r = await API.get('/admin/requests');
        body = `<div class="card pad">${r.length ? `<table><thead><tr><th>Tasker</th><th>Task</th><th>Match</th><th>Status</th></tr></thead><tbody>
          ${r.map(x => `<tr><td><b>${esc(x.taskerName)}</b></td><td>${esc(x.taskTitle || '')} <span class="code">${x.taskCode || ''}</span></td>
            <td>${x.skillMatchPercent != null ? x.skillMatchPercent + '%' : '—'}</td><td><span class="pill ${x.status === 'APPROVED' ? 'COMPLETED' : x.status === 'DECLINED' ? 'OVERDUE' : 'IN_PROGRESS'}">${x.status}</span></td></tr>`).join('')}</tbody></table>` : '<div class="empty">No requests.</div>'}</div>`;
      }
      C().innerHTML = `<div class="page-h"><h1>Admin portal</h1><div class="grow"></div>
        <button class="btn ghost" onclick="Admin.seedDemo()">↻ Load demo data</button>
        <button class="btn" onclick="Admin.newTask()">+ New task</button></div>
        <div style="display:flex;gap:8px;margin-bottom:16px">${tabs}</div>${body}`;
    } catch (e) { C().innerHTML = errBox(e); }
  },
  go(tab) { this.tab = tab; this.render(); },
  async setRole(id, role) { try { await API.post('/admin/users/' + id + '/role', { role }); toast('Role updated'); } catch (e) { toast(e.message); this.render(); } },
  async toggle(id, enable) { try { await API.post('/admin/users/' + id + '/' + (enable ? 'enable' : 'disable')); toast(enable ? 'Enabled' : 'Disabled'); this.render(); } catch (e) { toast(e.message); } },
  async delUser(id) { if (!confirm('Delete this user and their tasks?')) return; try { await API.del('/admin/users/' + id); this.render(); } catch (e) { toast(e.message); } },
  async delTask(code) { if (!confirm('Delete ' + code + '?')) return; try { await API.del('/admin/tasks/' + code); this.render(); } catch (e) { toast(e.message); } },
  async newTask() { Modal.taskForm(); },
  async seedDemo() { if (!confirm('Load/refresh demo data?')) return; try { const r = await API.post('/admin/seed-demo'); toast(r.message); this.render(); } catch (e) { toast(e.message); } },
};

/* ===================== BOOT ===================== */
document.addEventListener('click', (e) => {
  if (!e.target.closest('.avatar') && $('userMenu') && !e.target.closest('#userMenu')) $('userMenu').remove();
  if (!e.target.closest('.bell') && $('notifPop') && !e.target.closest('#notifPop')) $('notifPop').remove();
});
App.boot();
