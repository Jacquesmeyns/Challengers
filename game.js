(() => {
  const $ = (s) => document.querySelector(s);
  const screen = $('#screen');

  // HISTORICAL FACTS are sourced from official NASA pages and the Rogers Commission report.
  // GAMEPLAY VALUES are explicitly fictional balancing values created to make the prototype playable.
  const DATA = {
    campaign: 'Space Shuttle Program',
    mission: {
      id: 'STS-51L',
      title: 'CHALLENGER — LAUNCH READINESS',
      year: 1986,
      launchDate: 'January 28, 1986',
      launchSite: 'Launch Complex 39B, Kennedy Space Center, Florida',
      liftoff: '11:38:00 EST',
      crew: [
        ['Francis R. Scobee','Commander'], ['Michael J. Smith','Pilot'],
        ['Ellison S. Onizuka','Mission Specialist'], ['Judith A. Resnik','Mission Specialist'],
        ['Ronald E. McNair','Mission Specialist'], ['Gregory B. Jarvis','Payload Specialist'],
        ['Christa McAuliffe','Payload Specialist']
      ],
      facts: [
        'STS-51L was the 25th Space Shuttle mission and Challenger’s 10th flight.',
        'The mission was planned to deploy TDRS-B, conduct astronomy work related to Halley’s Comet, and carry the Teacher in Space Project.',
        'Launch was delayed by weather and technical issues before the final launch attempt.',
        'The ambient temperature at launch was 36°F (about 2.2°C), the coldest launch temperature to that date.',
        'NASA’s investigation identified failure of an O-ring in the right solid rocket booster, with cold weather as a contributing factor.',
        'The Challenger was lost 73 seconds after liftoff and all seven crew members perished.'
      ]
    },
    // Fictional gameplay layer. These values are not historical NASA budgets or staffing numbers.
    balance: {
      startingBudget: 100,
      startingPersonnel: 12,
      weeks: 5,
      weeklyPersonnelRecovery: 2,
      baseReadiness: 20,
      fullSuccess: { readiness: 85, safety: 80, budgetMin: 15 },
      partialSuccess: { readiness: 65, safety: 60, budgetMin: 0 }
    },
    departments: [
      { id:'Engineering', responsibility:'Solve technical problems and improve mission readiness.', weight:1.15 },
      { id:'Materials', responsibility:'Acquire and verify the components required for the mission.', weight:0.95 },
      { id:'Safety', responsibility:'Conduct inspections, evaluate risks, and improve reliability.', weight:1.35 },
      { id:'Operations', responsibility:'Coordinate personnel, procedures, and launch preparation.', weight:1.0 }
    ],
    specialists: [
      // Names/roles are historical NASA crew facts. Bonuses are fictional gameplay abstractions.
      { name:'Francis R. Scobee', role:'Commander', bonus:'Operations', effect:'+2 Operations progress per week' },
      { name:'Judith A. Resnik', role:'Mission Specialist', bonus:'Engineering', effect:'+2 Engineering progress per week' },
      { name:'Ellison S. Onizuka', role:'Mission Specialist', bonus:'Safety', effect:'+2 Safety progress per week' },
      { name:'Ronald E. McNair', role:'Mission Specialist', bonus:'Materials', effect:'+2 Materials progress per week' },
      { name:'Michael J. Smith', role:'Pilot', bonus:'Operations', effect:'+1 Operations and +1 Safety progress per week' }
    ],
    events: [
      {
        id:'weather-jan25', title:'WEATHER NO-GO', basis:'NASA chronology · January 25',
        text:'Forecast weather is unacceptable for the planned launch window. The historical record shows the launch was delayed.',
        weight:18,
        choices:[
          {label:'DELAY THE LAUNCH', desc:'Preserve safety margin and accept schedule pressure.', effects:{time:-1,safety:+8,operations:+2,budget:-4,tag:'delay'}},
          {label:'PUSH FOR READINESS', desc:'Prioritize schedule and continue preparation.', effects:{safety:-5,operations:+4,budget:-2,tag:'pressure'}}
        ]
      },
      {
        id:'gse', title:'GROUND SUPPORT PROBLEM', basis:'NASA chronology · January 27/28',
        text:'Launch processing equipment and ground-support problems affect the countdown.',
        weight:20,
        choices:[
          {label:'TROUBLESHOOT', desc:'Spend resources to resolve the issue before proceeding.', effects:{engineering:+6,operations:+3,budget:-6,tag:'technical'}},
          {label:'WORK AROUND IT', desc:'Keep the schedule moving with less expenditure.', effects:{operations:+5,safety:-4,budget:-1,tag:'workaround'}}
        ]
      },
      {
        id:'ice', title:'ICE INSPECTION', basis:'NASA chronology · January 28',
        text:'Ice is observed on the launch complex and mobile launch platform. An inspection is required.',
        weight:24,
        choices:[
          {label:'INSPECT & CLEAR', desc:'Use personnel and time for a dedicated ice assessment.', effects:{safety:+8,operations:+2,personnel:-2,budget:-4,tag:'ice-clear'}},
          {label:'ACCEPT THE CONDITION', desc:'Proceed with reduced inspection effort.', effects:{safety:-10,operations:+5,budget:+1,tag:'ice-accept'}}
        ]
      },
      {
        id:'oring', title:'LOW-TEMPERATURE O-RING CONCERN', basis:'NASA Rogers Commission record',
        text:'Engineering information raises concern about the effect of low temperature on the solid rocket motor field-joint seals.',
        weight:26,
        choices:[
          {label:'HOLD FOR ENGINEERING REVIEW', desc:'Prioritize technical review and accept schedule/budget cost.', effects:{engineering:+10,safety:+12,operations:-3,budget:-8,time:-1,tag:'review'}},
          {label:'ACCEPT THE RISK', desc:'Keep the schedule and accept the unresolved risk.', effects:{engineering:-2,safety:-15,operations:+6,budget:+2,tag:'risk'}}
        ]
      },
      {
        id:'communication', title:'ENGINEERING COMMUNICATION', basis:'NASA investigation findings',
        text:'Different groups must communicate technical concerns clearly before a launch decision.',
        weight:12,
        choices:[
          {label:'ESCALATE THE CONCERN', desc:'Create a formal decision checkpoint.', effects:{engineering:+5,safety:+7,operations:-2,budget:-3,tag:'escalate'}},
          {label:'KEEP THE COUNT MOVING', desc:'Reduce coordination overhead.', effects:{operations:+5,safety:-6,tag:'continue'}}
        ]
      }
    ]
  };

  const state = {
    week:1, budget:DATA.balance.startingBudget, personnel:DATA.balance.startingPersonnel,
    selected:null, progress:{Engineering:DATA.balance.baseReadiness,Materials:DATA.balance.baseReadiness,Safety:DATA.balance.baseReadiness,Operations:DATA.balance.baseReadiness},
    history:[], eventUsed:[], tags:[], ended:false
  };

  function stars(){
    const c=$('#stars'),ctx=c.getContext('2d'); let w,h,pts=[];
    const resize=()=>{w=c.width=innerWidth*devicePixelRatio;h=c.height=innerHeight*devicePixelRatio;pts=Array.from({length:Math.min(220,Math.floor(innerWidth/6))},()=>({x:Math.random()*w,y:Math.random()*h,r:Math.random()*1.5+.2,a:Math.random()*.7+.2}))};
    const draw=()=>{ctx.clearRect(0,0,w,h); for(const p of pts){ctx.globalAlpha=p.a;ctx.fillStyle='#fff';ctx.fillRect(p.x,p.y,p.r,p.r)} requestAnimationFrame(draw)};
    resize(); addEventListener('resize',resize); draw();
  }
  stars();

  const fmt = n => Math.round(n);
  function shell(inner, footer=true){
    screen.innerHTML=`<div class="wrap"><header class="brand"><div class="brand-mark"><img class="brand-logo" src="https://media.githubusercontent.com/media/Jacquesmeyns/Challengers/main/Assets/Art/pixel_art_largee.png" alt="CHALLENGERS logo" decoding="async" fetchpriority="high" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="brand-fallback" hidden>CHALLENGERS</span></div><div class="brand-sub">MANAGE THE MISSION<br>CHALLENGE HISTORY · FACE THE CONSEQUENCES</div></header>${inner}${footer?'<div class="footer">NASA SPACE APPS CHALLENGE · TURN-BASED STRATEGY / RESOURCE MANAGEMENT</div>':''}</div>`;
  }

  function home(){
    shell(`<section class="hero"><div class="panel hero-copy"><div class="eyebrow">SPACE MISSION MANAGEMENT</div><h1>MANAGE THE<br>MISSION.<br>FACE THE<br>CONSEQUENCES.</h1><p>Turn-based strategy inspired by real space exploration programs. The historical facts are NASA-sourced; the resource system is a clearly fictional gameplay model.</p><div class="mission-tag">INITIAL PLAYABLE MISSION · STS-51L</div><button class="cta" id="start">ENTER CAMPAIGN</button></div><div class="panel ref-card"><img src="Assets/challenger-reference.png" alt="Challenger reference artwork"><div class="ref-overlay">CHALLENGER · LAUNCH READINESS · 1986</div></div></section>
    <section class="grid three"><div class="card"><h3>HISTORY MEETS STRATEGY</h3><p>Play through a fictionalized decision system anchored to documented NASA events.</p></div><div class="card"><h3>ALTERNATIVE HISTORY</h3><p>Your decisions change the game outcome, while the debrief explains what happened historically.</p></div><div class="card"><h3>RISK &amp; UNCERTAINTY</h3><p>Events are probabilistic, with choices affecting readiness, safety, time and budget.</p></div></section>`);
    $('#start').onclick=campaigns;
  }

  function campaigns(){
    shell(`<div class="panel"><div class="topbar"><div><div class="eyebrow">CAMPAIGN SELECTION</div><h2 class="section-title">HISTORICAL CAMPAIGNS</h2></div><button class="back" id="back">← BACK</button></div><div class="grid"><div class="card active"><div class="campaign-art"><img src="assets/challenger-reference.png" alt="Space Shuttle Challenger pixel-art reference"></div><h3>SPACE SHUTTLE PROGRAM</h3><p>Initial campaign. Engineering, operational, and safety challenges associated with reusable spacecraft.</p><div class="mission-tag">PLAYABLE NOW</div><button class="cta" id="shuttle">SELECT CAMPAIGN</button></div><div class="card locked"><div class="campaign-art"><img src="Assets/apollo11-reference.png" alt="Apollo 11 Saturn V pixel-art reference"></div><h3>APOLLO 11</h3><p>Planned campaign. NASA confirms a July 16, 1969 launch, Saturn V AS-506, lunar landing at the Sea of Tranquility and an 8-day mission.</p><div class="small">CAMPAIGN DATA READY · GAMEPLAY NOT IMPLEMENTED</div></div><div class="card locked campaign-planned"><div class="campaign-signal" aria-hidden="true">A-03</div><h3>ARTEMIS PROGRAM</h3><p>Planned campaign. Campaign framework reserved for future historical scenarios.</p><div class="small">PLANNED</div></div></div></div>`);
    $('#back').onclick=home; $('#shuttle').onclick=missionBrief;
  }

  function missionBrief(){
    shell(`<div class="panel"><div class="topbar"><div><div class="eyebrow">SPACE SHUTTLE PROGRAM · STS-51L</div><h2 class="section-title">CHALLENGER — LAUNCH READINESS</h2></div><button class="back" id="back">← CAMPAIGNS</button></div><div class="hero compact"><div class="panel ref-card"><img src="assets/challenger-reference.png" alt="Challenger mission reference"><div class="ref-overlay">NASA HISTORICAL REFERENCE</div></div><div><div class="mission-tag">JANUARY 28, 1986 · KSC 39B · 11:38 EST</div><p class="muted">Manage launch readiness while balancing four departments. Historical facts are fixed; gameplay choices are a simulation layer.</p><div class="facts">${DATA.mission.facts.map(f=>`<div class="fact">${f}</div>`).join('')}</div><button class="cta" id="configure">SELECT SPECIALIST</button></div></div></div>`);
    $('#back').onclick=campaigns; $('#configure').onclick=specialist;
  }

  function specialist(){
    shell(`<div class="panel"><div class="topbar"><div><div class="eyebrow">STEP 1 · SPECIALIST</div><h2 class="section-title">SELECT A SPECIALIST</h2></div><button class="back" id="back">← MISSION</button></div><p class="muted">The names and roles below are historical NASA crew members. The bonuses are fictional gameplay effects created for this prototype and are not NASA claims.</p><div class="specialist-grid">${DATA.specialists.map((s,i)=>`<button class="specialist-card ${state.selected===i?'selected':''}" data-i="${i}" aria-pressed="${state.selected===i}"><div class="name">${s.name}</div><div class="role">${s.role}</div><div class="ability">GAMEPLAY BONUS · ${s.bonus}</div><div class="small">${s.effect}</div></button>`).join('')}</div><button class="cta" id="continue" ${state.selected===null?'disabled':''}>START MISSION</button></div>`);
    $('#back').onclick=missionBrief;
    document.querySelectorAll('.specialist-card').forEach(b=>b.onclick=()=>{state.selected=+b.dataset.i; specialist();});
    if(state.selected!==null) $('#continue').onclick=startMission;
  }

  function startMission(){
    state.week=1; state.budget=DATA.balance.startingBudget; state.personnel=DATA.balance.startingPersonnel; state.history=[]; state.eventUsed=[]; state.tags=[]; state.ended=false;
    for(const d of DATA.departments) state.progress[d.id]=DATA.balance.baseReadiness;
    dashboard();
  }

  function dashboard(){
    const total = avg(Object.values(state.progress));
    shell(`<div class="panel"><div class="topbar"><div><div class="eyebrow">WEEKLY MISSION DASHBOARD · WEEK ${state.week}/${DATA.balance.weeks}</div><h2 class="section-title">CHALLENGER · LAUNCH READINESS</h2></div><button class="back" id="quit">← EXIT</button></div>
      <div class="stats"><div class="stat"><span>WEEK</span><strong>${state.week}/${DATA.balance.weeks}</strong></div><div class="stat"><span>BUDGET</span><strong>${fmt(state.budget)}</strong></div><div class="stat"><span>PERSONNEL</span><strong>${fmt(state.personnel)}</strong></div><div class="stat"><span>READINESS</span><strong>${fmt(total)}%</strong></div></div>
      <div class="week-track"><span>MISSION TIMELINE</span><div class="week-track-steps">${Array.from({length:DATA.balance.weeks},(_,i)=>`<span class="week-step ${i+1===state.week?'current':i+1<state.week?'passed':''}">${String(i+1).padStart(2,'0')}</span>`).join('')}</div></div>
      <div class="card mission-objective"><span class="objective-mark" aria-hidden="true"></span><div><h3>MISSION OBJECTIVE</h3><p>Prepare launch readiness across Engineering, Materials, Safety, and Operations. Historical facts are NASA-sourced; resource values are gameplay balance.</p></div></div>
      <div class="depts">${DATA.departments.map(d=>`<div class="dept"><div class="dept-head"><span class="dept-name">${d.id.toUpperCase()}</span><span class="dept-value" id="v-${d.id}">${fmt(state.progress[d.id])}%</span></div><div class="bar"><div class="fill" id="f-${d.id}" style="width:${Math.min(100,state.progress[d.id])}%"></div></div><div class="small">${d.responsibility}</div><div class="alloc"><label for="alloc-${d.id}">WEEKLY INVESTMENT <output id="o-${d.id}">0 / 4</output></label><input id="alloc-${d.id}" type="range" min="0" max="4" value="0" data-dept="${d.id}" aria-label="${d.id} weekly investment"><div class="alloc-hint"><span>4 BUDGET · 1 PERSONNEL / POINT</span><strong id="gain-${d.id}">+0% READINESS</strong></div></div></div>`).join('')}</div>
      <div class="allocation-summary" id="allocation-summary"><span>DEPLOYMENT: <strong>0 POINTS</strong></span><span>BUDGET SPEND: <strong>0</strong></span><span>PERSONNEL ASSIGNED: <strong>0</strong></span></div>
      <div class="action-row"><div class="allocation-note">Choose how to distribute this week's resources. Every point adds 2% readiness and costs 4 budget units plus 1 personnel.</div><button class="cta" id="advance">ADVANCE ONE WEEK →</button></div><div id="event" role="region" aria-live="polite" aria-label="Mission event"></div></div>`);
    $('#quit').onclick=campaigns;
    document.querySelectorAll('input[data-dept]').forEach(i=>i.oninput=()=>updateAllocationPreview(i));
    updateAllocationPreview();
    $('#advance').onclick=advanceWeek;
  }

  function avg(a){return a.reduce((x,y)=>x+y,0)/a.length}
  function updateAllocationPreview(changedInput=null){
    const inputs=[...document.querySelectorAll('input[data-dept]')];
    const maxPoints=Math.min(16,Math.floor(Math.max(0,state.budget)/4),Math.max(0,state.personnel));
    let total=inputs.reduce((sum,input)=>sum+Number(input.value),0);
    if(total>maxPoints && changedInput){
      const otherPoints=inputs.filter(input=>input!==changedInput).reduce((sum,input)=>sum+Number(input.value),0);
      changedInput.value=Math.max(0,Math.min(Number(changedInput.value),maxPoints-otherPoints));
      total=inputs.reduce((sum,input)=>sum+Number(input.value),0);
    }
    let spend=0, people=0;
    inputs.forEach(i=>{
      const d=i.dataset.dept, v=Number(i.value);
      spend+=v*4; people+=v;
      $('#v-'+d).textContent=`${fmt(Math.min(100,state.progress[d]+v*2))}%`;
      $('#f-'+d).style.width=`${Math.min(100,state.progress[d]+v*2)}%`;
      $('#o-'+d).textContent=`${v} / 4`;
      $('#gain-'+d).textContent=`+${v*2}% READINESS`;
    });
    const summary=$('#allocation-summary');
    if(summary) summary.innerHTML=`<span>DEPLOYMENT: <strong>${people} POINTS</strong></span><span>BUDGET SPEND: <strong>${spend} / ${state.budget}</strong></span><span>PERSONNEL ASSIGNED: <strong>${people} / ${state.personnel}</strong></span>`;
    const advance=$('#advance');
    if(advance) advance.disabled=false;
  }
  function applyAllocations(){
    let spend=0, people=0;
    document.querySelectorAll('input[data-dept]').forEach(i=>{const d=i.dataset.dept,v=+i.value; spend+=v*4; people+=v; state.progress[d]=Math.min(100,state.progress[d]+v*2);});
    state.budget-=spend; state.personnel-=people;
    return {spend,people};
  }

  function chooseEvent(){
    const pool=DATA.events.filter(e=>!state.eventUsed.includes(e.id));
    if(!pool.length) return null;
    const total=pool.reduce((s,e)=>s+e.weight,0); let r=Math.random()*total;
    for(const e of pool){r-=e.weight;if(r<=0)return e;} return pool[pool.length-1];
  }

  function advanceWeek(){
    const allocation=applyAllocations();
    const spec=DATA.specialists[state.selected];
    state.progress[spec.bonus.split(' ')[0]] += 0; // no-op; specialist effect is applied below explicitly.
    if(spec.bonus==='Engineering') state.progress.Engineering=Math.min(100,state.progress.Engineering+2);
    if(spec.bonus==='Safety') state.progress.Safety=Math.min(100,state.progress.Safety+2);
    if(spec.bonus==='Materials') state.progress.Materials=Math.min(100,state.progress.Materials+2);
    if(spec.bonus==='Operations') state.progress.Operations=Math.min(100,state.progress.Operations+2);
    if(spec.name==='Michael J. Smith'){state.progress.Operations=Math.min(100,state.progress.Operations+1);state.progress.Safety=Math.min(100,state.progress.Safety+1);}

    state.personnel=Math.min(DATA.balance.startingPersonnel,state.personnel+DATA.balance.weeklyPersonnelRecovery);
    state.history.push({week:state.week,allocation});
    const event=chooseEvent();
    if(event){state.eventUsed.push(event.id);showEvent(event);} else {advanceAfterEvent();}
  }

  function showEvent(event){
    $('#event').innerHTML=`<div class="event"><div class="event-kicker">HISTORICAL EVENT BASIS · ${event.basis}</div><h3>${event.title}</h3><p>${event.text}</p><div class="choices">${event.choices.map((c,i)=>`<button class="choice" data-i="${i}"><strong>${c.label}</strong><span>${c.desc}</span></button>`).join('')}</div></div>`;
    document.querySelectorAll('.choice').forEach(b=>b.onclick=()=>resolveEvent(event,+b.dataset.i));
    document.querySelectorAll('.dept input').forEach(i=>i.disabled=true); $('#advance').disabled=true;
  }

  function resolveEvent(event,index){
    const e=event.choices[index].effects;
    for(const k of ['Engineering','Materials','Safety','Operations']) if(e[k]) state.progress[k]=Math.max(0,Math.min(100,state.progress[k]+e[k]));
    if(e.budget) state.budget+=e.budget;
    if(e.personnel) state.personnel=Math.max(0,state.personnel+e.personnel);
    if(e.time) state.week=Math.max(1,state.week+e.time);
    if(e.tag) state.tags.push(e.tag);
    $('#event').innerHTML=`<div class="event resolved"><div class="event-kicker">DECISION RECORDED</div><h3>${event.title}</h3><p>${event.choices[index].desc}</p><div class="effect-line">${effectsText(e)}</div><button class="cta" id="next">CONTINUE</button></div>`;
    $('#next').onclick=advanceAfterEvent;
  }

  function effectsText(e){
    const arr=[]; for(const k of ['Engineering','Materials','Safety','Operations','budget','personnel','time']) if(e[k]) arr.push(`${k} ${e[k]>0?'+':''}${e[k]}`); return arr.join(' · ');
  }

  function advanceAfterEvent(){
    if(state.week>=DATA.balance.weeks){finishMission();return;}
    state.week++;
    dashboard();
  }

  function finishMission(){
    const readiness=avg(Object.values(state.progress));
    let outcome='FAILURE';
    if(readiness>=DATA.balance.fullSuccess.readiness && state.progress.Safety>=DATA.balance.fullSuccess.safety && state.budget>=DATA.balance.fullSuccess.budgetMin) outcome='FULL SUCCESS';
    else if(readiness>=DATA.balance.partialSuccess.readiness && state.progress.Safety>=DATA.balance.partialSuccess.safety && state.budget>=DATA.balance.partialSuccess.budgetMin) outcome='PARTIAL SUCCESS';
    const historical = outcome==='FULL SUCCESS'
      ? 'In the game, your preparation produced a successful outcome. Historically, STS-51L was lost 73 seconds after liftoff. This contrast is intentional: the simulation explores how decisions could change a scenario without rewriting the historical record.'
      : 'Historically, STS-51L was lost 73 seconds after liftoff. NASA’s investigation identified an O-ring failure in the right solid rocket booster, with cold weather as a contributing factor.';
    shell(`<div class="panel"><div class="eyebrow">POST-MISSION ANALYSIS · STS-51L</div><div class="result"><h2>${outcome}</h2><p class="muted">Readiness ${fmt(readiness)}% · Safety ${fmt(state.progress.Safety)}% · Budget ${fmt(state.budget)}</p><div class="report"><div class="card"><h3>MISSION PERFORMANCE</h3><p>Engineering ${fmt(state.progress.Engineering)}% · Materials ${fmt(state.progress.Materials)}% · Safety ${fmt(state.progress.Safety)}% · Operations ${fmt(state.progress.Operations)}%</p></div><div class="card"><h3>DECISION CONSEQUENCES</h3><p>${state.tags.length?`Decisions recorded: ${state.tags.join(', ')}.`:'No special decision tags were recorded.'}</p></div><div class="card"><h3>HISTORICAL CONTEXT</h3><p>${historical}</p></div><div class="card"><h3>NASA FACTS</h3><p>${DATA.mission.facts.slice(2).join(' ')}</p></div></div><div class="history"><strong>HISTORICAL DEBRIEFING</strong><br>NASA records document the launch delays, low temperatures, ice concerns, engineering concerns about the field-joint O-rings, and the eventual loss of Challenger.</div><div class="sources"><a href="https://www.nasa.gov/mission/sts-51l/" target="_blank">NASA · STS-51L</a><a href="https://www.nasa.gov/history/rogersrep/v1ch3.htm" target="_blank">NASA · Rogers Commission · Chapter III</a><a href="https://www.nasa.gov/history/rogersrep/v1ch5.htm" target="_blank">NASA · Rogers Commission · Contributing Cause</a><a href="https://www.nasa.gov/history/rogersrep/v4p39.htm" target="_blank">NASA · Launch Date Chronology</a></div><button class="cta" id="again">RETURN TO CAMPAIGNS</button></div></div>`);
    $('#again').onclick=campaigns;
  }

  home();
})();
