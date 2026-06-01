/* Project narrative — faithful to the MIT651 Capstone report, research, proposal and 4 retrospectives (Team T3). */
const ABOUT_HTML = `
<div class="doc">
  <span class="sprint tag">Capstone Project &middot; Team T3</span>
  <h2 style="margin-top:6px">TaskSKA — an intelligent Task Management System</h2>
  <p>TaskSKA is a production-grade task management platform built to rival JIRA and Monday.com while
  solving the problem they leave open: <b>uneven workload distribution</b>. Research into existing tools
  showed teams routinely overloading a few members while others stay idle, because most TMS products
  track <i>what</i> work exists but not <i>who has the capacity</i> to take it. TaskSKA's novel
  <b>urgency-weighted workload estimator</b> sits at the centre of the product and powers smart,
  capacity-aware assignment.</p>

  <h3>Research &amp; proposal</h3>
  <p>The proposal scoped a web-based system with secure multi-factor authentication, role-based access
  (Taskmaster, Tasker, Auditor, Admin), task creation and tracking, peer connections for collaboration,
  and an analytics layer for workload. Two user types self-register — <b>Taskmasters</b> who create and
  assign work, and <b>Taskers</b> who execute it — each providing skills, availability and weekly
  capacity at sign-up so the system can match and balance work intelligently. A pre-built
  <b>Admin</b> account governs the platform from a separate portal.</p>

  <h2>Delivery across five sprints</h2>

  <div class="sprint"><span class="tag">Sprint 1 &middot; Foundation &amp; Security &middot; 7 stories</span>
    <p>Account registration, secure login, password reset, MFA setup, secure logout, Taskmaster role
    assignment, and admin login — the identity foundation for everything that follows.</p>
    <div class="story"><span class="id">TMS-18</span><span>Register an account (public user)</span></div>
    <div class="story"><span class="id">TMS-19</span><span>Log in securely with credentials</span></div>
    <div class="story"><span class="id">TMS-20</span><span>Reset password securely</span></div>
    <div class="story"><span class="id">TMS-42</span><span>Set up Multi-Factor Authentication</span></div>
    <div class="story"><span class="id">TMS-41</span><span>Securely log out / end session</span></div>
    <div class="story"><span class="id">TMS-44</span><span>Be assigned as Taskmaster for created tasks</span></div>
    <div class="story"><span class="id">TMS-43</span><span>Admin login &amp; platform management</span></div>
  </div>

  <div class="sprint"><span class="tag">Sprint 2 &middot; Core Task Management &middot; 5 stories</span>
    <p>Task creation with title/description/deadline, assignment to self or connected users, unique task
    ID generation, listing by deadline, and status updates.</p>
    <div class="story"><span class="id">TMS-21</span><span>Create tasks with title, description &amp; deadline</span></div>
    <div class="story"><span class="id">TMS-22</span><span>Assign tasks to self or connected users</span></div>
    <div class="story"><span class="id">TMS-23</span><span>Auto-generate a unique task ID (TSK-xxxxxx)</span></div>
    <div class="story"><span class="id">TMS-24</span><span>View tasks ordered by deadline</span></div>
    <div class="story"><span class="id">TMS-25</span><span>Update task status as work progresses</span></div>
  </div>

  <div class="sprint"><span class="tag">Sprint 3 &middot; Collaboration &amp; Discovery &middot; 5 stories</span>
    <p>Connection management between users, task search across multiple fields, and detailed task views.</p>
    <div class="story"><span class="id">TMS-27</span><span>Request a connection with another user</span></div>
    <div class="story"><span class="id">TMS-28</span><span>Accept / decline connection requests</span></div>
    <div class="story"><span class="id">TMS-29</span><span>View all current connections</span></div>
    <div class="story"><span class="id">TMS-30</span><span>Search tasks by ID, title, description or deadline</span></div>
    <div class="story"><span class="id">TMS-31</span><span>View full task details</span></div>
  </div>

  <div class="sprint"><span class="tag">Sprint 4 &middot; Intelligence &amp; Automation &middot; 7 stories</span>
    <p>The differentiating sprint: workload estimation, the notification system, recurring-task templates,
    workload-based auto-assignment, deadline-driven status automation, and task dependencies.</p>
    <div class="story"><span class="id">TMS-33</span><span>View workload percentage of each connection</span></div>
    <div class="story"><span class="id">TMS-35</span><span>Notification when assigned a new task</span></div>
    <div class="story"><span class="id">TMS-36</span><span>Notification when created tasks change status</span></div>
    <div class="story"><span class="id">TMS-37</span><span>Notification when connection requests arrive</span></div>
    <div class="story"><span class="id">TMS-38</span><span>Customise notification preferences</span></div>
    <div class="story"><span class="id">TMS-39</span><span>Create task templates for recurring work</span></div>
    <div class="story"><span class="id">TMS-40</span><span>Auto-assign tasks based on workload distribution</span></div>
    <div class="story"><span class="id">TMS-41b</span><span>Automated status updates based on deadlines</span></div>
    <div class="story"><span class="id">TMS-42b</span><span>Task dependencies enforce correct order</span></div>
  </div>

  <div class="sprint"><span class="tag">Sprint 5 &middot; Validation &amp; Deployment</span>
    <p>System integration testing, user-acceptance testing, performance &amp; security testing, full
    documentation, and deployment to production — delivered here as a Spring Boot application with a
    MySQL database, an admin console, the read-only Auditor role, and Hostinger deployment guides.</p>
  </div>

  <h2>Retrospectives</h2>
  <p>Each sprint closed with a team retrospective. The actions agreed in one sprint were carried into the next.</p>

  <h3>Retrospective 1 — Sprint 1 (08 Aug 2025)</h3>
  <div class="retro-grid">
    <div class="retro-box good"><h4>What went well</h4><ul>
      <li>All 7 user stories completed and marked Done in Jira before deadline.</li>
      <li>Core user-management features landed smoothly as a foundation.</li>
      <li>Clear role ownership avoided duplicated work; Jira gave real-time transparency.</li>
      <li>Concise 15-minute demo; confident Q&amp;A; early peer review caught defects.</li></ul></div>
    <div class="retro-box bad"><h4>What didn't go well</h4><ul>
      <li>Vague acceptance criteria early on caused misunderstandings.</li>
      <li>Integration bottlenecks when merging code close to the demo.</li>
      <li>Testing bunched at sprint end; limited automation meant heavy manual checks.</li>
      <li>Key-person dependency on MFA &amp; admin areas created risk.</li></ul></div>
  </div>
  <p style="font-size:13px;color:var(--muted)"><b>Actions &rarr; Sprint 2:</b> refine user stories, increase test coverage, weekly knowledge-sharing, set up CI/CD, add a mid-sprint review.</p>

  <h3>Retrospective 2 — Sprint 2 (03 Sep 2025)</h3>
  <div class="retro-grid">
    <div class="retro-box good"><h4>What went well</h4><ul>
      <li>All 5 stories Done on time; core task features delivered.</li>
      <li>Refined stories removed ambiguity; testing spread across the sprint.</li>
      <li>Mid-sprint review and CI/CD pipeline reduced last-minute conflicts.</li>
      <li>Knowledge-sharing sessions lowered dependency risk.</li></ul></div>
    <div class="retro-box bad"><h4>What didn't go well</h4><ul>
      <li>UI/UX testing still limited — edge cases found in rehearsal.</li>
      <li>Estimation challenges; assignment logic took longer than planned.</li>
      <li>Occasional Jira documentation gaps; CI/CD still one-person heavy.</li></ul></div>
  </div>
  <p style="font-size:13px;color:var(--muted)"><b>Actions &rarr; Sprint 3:</b> strengthen UI/UX testing, improve estimation with historical data, daily Jira updates, rotate CI/CD ownership, documentation discipline.</p>

  <h3>Retrospective 3 — Sprint 3 (08 Apr 2026)</h3>
  <div class="retro-grid">
    <div class="retro-box good"><h4>What went well</h4><ul>
      <li>All Sprint 3 stories completed within timeline; clear ownership.</li>
      <li>Strong frontend/backend coordination; stable demo integration.</li>
      <li>Jira board kept current; features tested beforehand.</li></ul></div>
    <div class="retro-box bad"><h4>What didn't go well</h4><ul>
      <li>Some requirements unclear, causing rework; testing delayed to the end.</li>
      <li>Integration took longer than expected; workload uneven across members.</li>
      <li>Dependencies between tasks weren't identified early.</li></ul></div>
  </div>
  <p style="font-size:13px;color:var(--muted)"><b>Actions &rarr; Sprint 4:</b> detailed planning &amp; task breakdown, mid-sprint testing checkpoints, incremental integration, rebalance workload during stand-ups.</p>

  <h3>Retrospective 4 — Sprint 4 (06 May 2026)</h3>
  <div class="retro-grid">
    <div class="retro-box good"><h4>What went well</h4><ul>
      <li>All 7 automation stories Done and demonstrated on the live system.</li>
      <li>Workload percentages, real-time notifications and templates verified in the demo.</li>
      <li>Auto-assignment and dependency ordering worked end-to-end.</li></ul></div>
    <div class="retro-box bad"><h4>What didn't go well</h4><ul>
      <li>Advanced automation logic concentrated effort on fewer members.</li>
      <li>Some features needed multiple revisions before completion.</li></ul></div>
  </div>
  <p style="font-size:13px;color:var(--muted)"><b>Carried into Sprint 5:</b> system integration &amp; UAT, performance and security testing, documentation, and production deployment.</p>

  <h2>How TaskSKA improves on JIRA &amp; Monday.com</h2>
  <p>Beyond parity features (tasks, statuses, search, collaboration, notifications), TaskSKA adds a
  capacity-aware core: a transparent workload score per person, one-click auto-assignment to the
  least-loaded teammate, dependency gating that blocks out-of-order work, deadline automation that
  flags overdue tasks on its own, and MFA-secured role-based access — delivered as a self-hostable
  Spring Boot + MySQL application you fully own.</p>

  <p style="color:var(--muted);font-size:13px;margin-top:24px">Team T3 — Aniketh Raman Nair (s20240073),
  Kanchan Chaulagain (s20240102), Swapandeep Singh (s20240344), Syed Ahmed Mohiuddin Quadri (s20250015).</p>
</div>`;
