const STORAGE_KEY="ruutCoachPWA.v3";
let state=loadState(),settings=loadSettings(),activeTimer=null,wakeLock=null,voices=[];
let workoutAbort=false, skipCurrentTimer=false, workoutPaused=false, activeTimerResolve=null;
const DAYS=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

const voicePacks={
 trail:{start:["Trail guide is on. Ease into it.","Set your pace. Let the body warm up.","Step out steady. We’re moving."],run:["Run smooth. Light feet.","Start running. Flow with the road.","Run easy. Keep your shoulders loose."],walk:["Walk now. Take in the air.","Recover here. Stay present.","Walk it out. Breathe deep."],half:["Halfway point. Turn back toward home.","Halfway. Time to retrace your path.","Turn around now. Nice and steady back."],finish:["Workout complete. Good miles today.","Done. Another honest effort logged.","Finished. That one counts."],round:["Round {n} of {t}. Stay smooth.","Round {n}. Clean movement."],rep:["{name}. {reps}. Smooth and controlled."],timed:["{name}. {seconds} seconds. Breathe through it."]},
 tough:{start:["Lock in. We start now.","No drama. Do the work.","Feet moving. Finish what you started."],run:["Run. Stay disciplined.","Pick it up. Controlled pressure.","Run now. Strong, not reckless."],walk:["Walk. Recover like you mean it.","Breathe. You are not quitting.","Walk now. Reset and get ready."],half:["Halfway. Turn back and finish the job.","Halfway point. Earn the second half.","Turn around. Now bring it home."],finish:["Workout complete. You did the work.","Done. That is discipline.","Finished. Stack the win."],round:["Round {n} of {t}. Don't rush the reps.","Round {n}. Clean reps. Strong mind."],rep:["{name}. {reps}. Make them count."],timed:["{name}. {seconds} seconds. Hold steady."]},
 calm:{start:["Let's begin. Smooth and steady.","Settle in. Keep it controlled.","Here we go. Easy effort first."],run:["Start running. Stay relaxed.","Run easy. Find your rhythm.","Move steady. No ego."],walk:["Walk now. Control your breathing.","Recover here. Keep moving.","Walk it out. Reset your breath."],half:["Halfway point. Turn back now.","You're halfway. Turn around and bring it home.","Halfway. Time to head back."],finish:["Workout complete. Good work.","Done. Strong work today.","That’s it. You showed up and finished."],round:["Round {n} of {t}. Move clean.","Round {n} of {t}. Stay sharp."],rep:["{name}. {reps}. Good form first."],timed:["{name}. {seconds} seconds. Starting now."]}
};

const runPlan=[
 [25,60,120,"Easy Base Run","1 min run / 2 min walk","1.5–2 miles"],
 [28,60,90,"Easy Base Run","1 min run / 90 sec walk","1.75–2.25 miles"],
 [30,120,90,"Easy Run","2 min run / 90 sec walk","2–2.5 miles"],
 [25,60,120,"Easy Reset","1 min run / 2 min walk","1.5–2 miles"],
 [35,180,90,"Easy Run","3 min run / 90 sec walk","2.5–3 miles"],
 [35,300,120,"Easy Run","5 min run / 2 min walk","3 miles"],
 [40,480,120,"Easy Run","8 min run / 2 min walk","3.5–4 miles"],
 [30,300,120,"Easy Run","5 min run / 2 min walk","2.5–3 miles"],
 [45,600,120,"Easy Run","10 min run / 2 min walk","4 miles"],
 [45,720,120,"Easy Run","12 min run / 2 min walk","4–4.5 miles"],
 [40,600,120,"Easy Run","10 min run / 2 min walk","3.5–4 miles"],
 [30,300,120,"Easy Shakeout","5 min run / 2 min walk","2.5–3 miles"]
];
const wedPlan=[
 [20,30,90,"Light Intervals","30 sec run / 90 sec walk","1–1.5 miles"],
 [22,45,90,"Intervals","45 sec run / 90 sec walk","1.25–1.75 miles"],
 [25,60,120,"Hill/Interval Day","1 min strong / 2 min easy","1.5–2 miles"],
 [20,30,90,"Light Intervals","30 sec run / 90 sec walk","1–1.5 miles"],
 [30,60,120,"Intervals","1 min strong / 2 min easy","2–2.5 miles"],
 [30,120,120,"Hill Strength","Run hills easy / walk recovery","2–2.75 miles"],
 [32,120,120,"Intervals","2 min strong / 2 min easy","2.5–3 miles"],
 [25,60,120,"Light Intervals","1 min run / 2 min walk","1.75–2.25 miles"],
 [35,180,120,"Intervals","3 min strong / 2 min easy","3–3.5 miles"],
 [38,240,120,"Hill/Interval Mix","4 min strong / 2 min easy","3.25–4 miles"],
 [32,120,120,"Moderate Intervals","2 min strong / 2 min easy","2.5–3 miles"],
 [20,120,120,"Light Shakeout","2 min run / 2 min walk","1.5–2 miles"]
];
const friPlan=[
 [25,90,90,"Steady Effort","90 sec run / 90 sec walk","1.5–2 miles"],
 [28,120,90,"Steady Effort","2 min run / 90 sec walk","1.75–2.25 miles"],
 [30,180,90,"Steady Run","3 min run / 90 sec walk","2–2.75 miles"],
 [25,120,120,"Easy Run","2 min run / 2 min walk","1.5–2 miles"],
 [30,300,90,"Tempo Intro","5 min easy / walk as needed","2.5–3 miles"],
 [35,480,120,"Steady Run","8 min run / 2 min walk","3–3.5 miles"],
 [35,600,120,"Tempo Run","10 min easy / 15 min steady / cool down","3–3.75 miles"],
 [30,300,120,"Easy Run","5 min run / 2 min walk","2.5–3 miles"],
 [40,600,120,"Tempo Run","10 easy / 20 steady / cool down","3.75–4.5 miles"],
 [45,900,120,"Steady Run","15 min run / 2 min walk","4.5–5 miles"],
 [35,600,120,"Easy Steady Run","10 min run / 2 min walk","3–3.5 miles"],
 [0,0,0,"Rest Day","Rest","No target"]
];
const satPlan=[
 [35,60,120,"Long Run","1 min run / 2 min walk","2–2.5 miles"],
 [40,60,120,"Long Run","1 min run / 2 min walk","2.5–3 miles"],
 [45,120,120,"Long Run","2 min run / 2 min walk","3–3.5 miles"],
 [40,60,120,"Long Easy Run","1 min run / 2 min walk","2.5–3 miles"],
 [55,180,120,"Long Run","3 min run / 2 min walk","4–4.5 miles"],
 [65,300,120,"Long Run","5 min run / 2 min walk","5–5.5 miles"],
 [75,480,120,"Long Run","8 min run / 2 min walk","6–6.5 miles"],
 [60,300,120,"Long Easy Run","5 min run / 2 min walk","4.5–5 miles"],
 [90,600,120,"Long Run","10 min run / 2 min walk","7.5–8 miles"],
 [105,720,120,"Long Run","12 min run / 2 min walk","9–9.5 miles"],
 [120,900,120,"Long Run","15 min run / 2 min walk","10–11 miles"],
 [180,900,120,"13-Mile Effort","Run/walk allowed","13 miles"]
];
const strengthPlan=[
 [3,15,20,10,30,12],
 [3,16,21,10,35,14],
 [3,18,22,11,40,15],
 [2,15,18,8,30,12],
 [4,15,18,10,35,15],
 [4,17,20,11,40,16],
 [4,18,22,12,45,18],
 [3,16,18,10,35,14],
 [4,20,24,13,50,20],
 [5,18,22,12,45,18],
 [5,20,25,14,60,20],
 [2,12,12,8,30,12]
];

const plan=buildPlan();
function buildPlan(){
 return Array.from({length:12},(_,i)=>{
  const w=i+1, theme=["Control & Rhythm","Slight Progression","Build the Engine","Recovery Week","Capacity Build","Longer Blocks","Endurance Builder","Recovery & Reset","Real Endurance","Peak Build","Peak Confidence","13-Mile Effort"][i];
  return week(w,theme,[
   runFrom("Mon",runPlan[i],w), strengthFrom("Tue",strengthPlan[i],w), runFrom("Wed",wedPlan[i],w),
   strengthFrom("Thu",strengthPlan[i],w), runFrom("Fri",friPlan[i],w), runFrom("Sat",satPlan[i],w), rest("Sun")
  ]);
 });
}
function week(num,theme,days){return{num,theme,days}}
function runFrom(day,a,w){ if(a[0]===0) return rest(day); return {type:"run",day,title:a[3],time:a[0]+" min",structure:a[4],distance:a[5],total:a[0],runSeconds:a[1],walkSeconds:a[2],note:runNote(day,w),purpose:purposeFor(day),terrain:terrainFor(day),effort:effortFor(day),success:successFor(day),caution:"Sharp pain means stop. Tired is fine. Reckless is not."};}
function strengthFrom(day,a,w){const [rounds,sq,pu,lu,pl,gb]=a; const lunge=w===4||w===7||w===10||w===12?"Reverse lunges":"Lunges"; const squat=w===7?"Tempo squats":"Squats"; return {type:"bodyweight",day,title:"Bodyweight Strength",time:`${rounds} rounds`,structure:`${rounds} rounds of progressive bodyweight work`,distance:"No running",rounds,exercises:[rep(squat,`${sq} reps${w===7?", slow lower":""}`),rep("Pushups",`${pu} reps`),rep(lunge,`${lu} reps per leg`),timed("Plank",pl),rep("Glute bridges",`${gb} reps`)],note: w===4||w===8||w===12?"Reduced load. Move well and stay fresh.":"Build durability without wrecking your run legs.",purpose:"Build durable legs, trunk stability, and upper-body endurance to support running.",terrain:"Open floor space.",effort:"Controlled. Clean reps before speed.",success:"Complete every round with good form.",caution:"Stop if your back gets sharp or unstable."};}
function rest(day){return{type:"rest",day,title:"Rest Day",time:"Rest",structure:"Light walking only",distance:"No target",total:20,runSeconds:0,walkSeconds:60,note:"Recover so the next workout works.",purpose:"Absorb training and protect consistency.",terrain:"Easy walk if desired.",effort:"Very easy.",success:"Finish the day feeling better.",caution:"Do not sneak in hard work."}}
function rep(name,reps){return{mode:"reps",name,reps,seconds:0}} function timed(name,seconds){return{mode:"timed",name,reps:"",seconds}}
function purposeFor(day){return day==="Sat"?"Long-run endurance. This is the backbone of the 13-mile goal.":day==="Wed"?"Capacity and strength through controlled efforts.":day==="Fri"?"Steady stamina and mental control.":"Aerobic base and rhythm."}
function terrainFor(day){return day==="Wed"?"Trail or gentle hills if you feel good.":day==="Sat"?"Manageable mixed route, avoid brutal climbs.":"Flat park or easy path preferred."}
function effortFor(day){return day==="Wed"?"Moderate to strong, never reckless.":day==="Fri"?"Comfortably steady.":day==="Sat"?"Easy and patient.":"Easy. You should be able to talk."}
function successFor(day){return day==="Sat"?"Finish the full time without racing.":day==="Wed"?"Control the hard parts and recover well.":"Finish feeling in control."}
function runNote(day,w){return day==="Sat"?"Start slow. Walk hills with no ego.":day==="Wed"?"Strong but controlled. No sprinting.":day==="Fri"?"Steady, not gasping.":"Keep it easy and disciplined."}

function loadState(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||defaultState()}catch{return defaultState()}}
function loadSettings(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY+".settings"))||defaultSettings()}catch{return defaultSettings()}}
function defaultState(){return{week:1,dayIndex:1,completed:[],streak:0,totalCompleted:0,journal:[],badges:[],lastCompletedKey:""}}
function defaultSettings(){return{coachStyle:"trail",voiceURI:"",voiceRate:.95,keepAwake:true,routeMode:"outback",adaptive:true,warmup:true,cooldown:true}}
function saveState(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));renderAll()}
function saveSettings(){localStorage.setItem(STORAGE_KEY+".settings",JSON.stringify(settings));renderAll()}
function currentWeek(){return plan[state.week-1]} function currentWorkout(){return currentWeek().days[state.dayIndex-1]} function currentKey(){return`${state.week}-${state.dayIndex}`} function isComplete(){return state.completed.includes(currentKey())} function progressPercent(){return Math.round(state.completed.length/84*100)}
function legacyRemoved_showScreen_preV142(id,btn){document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));document.getElementById(id).classList.add("active");document.querySelectorAll("nav button").forEach(b=>b.classList.remove("active"));btn.classList.add("active");renderAll()}
function legacyRemoved_renderAll_preV142(){renderToday();renderWorkout();renderDashboard();renderPlan();renderJournal();renderRecover()}
function pill(t){return`<span class="pill ${t}">${t==="bodyweight"?"strength":t}</span>`}
function legacyRemoved_renderToday_preV142(){
 const x=currentWorkout(), w=currentWeek(), ex=x.type==="bodyweight"?x.exercises.map(e=>`<div class="exercise"><span>${e.name}</span><strong>${e.mode==="timed"?e.seconds+" sec":e.reps}</strong></div>`).join(""):"";
 document.getElementById("today").innerHTML=`<section class="card hero">
 <div class="pill-row"><span class="pill accent">Week ${state.week}</span><span class="pill">Day ${state.dayIndex}</span><span class="pill">${x.day}</span>${pill(x.type)}<span class="pill">${settings.routeMode}</span></div>
 <div><p class="muted small">${w.theme}</p><h2>${x.title}</h2></div>
 <div class="grid two"><div class="stat"><span class="muted small">Time</span><strong>${x.time}</strong></div><div class="stat"><span class="muted small">Target</span><strong style="font-size:17px">${x.distance}</strong></div></div>
 <div class="detail"><strong>Purpose</strong><p class="muted">${x.purpose}</p></div>
 <div class="grid two"><div class="detail"><strong>Best Route</strong><p class="muted">${x.terrain}</p></div><div class="detail"><strong>Effort</strong><p class="muted">${x.effort}</p></div></div>
 <div class="detail"><strong>Workout Structure</strong><p class="muted">${x.structure}</p></div>
 <div class="grid two"><div class="detail"><strong>Success Today</strong><p class="muted">${x.success}</p></div><div class="detail"><strong>Caution</strong><p class="muted">${x.caution}</p></div></div>
 ${ex?`<div class="list">${ex}</div>`:""}
 <button onclick="startWorkout()">Start Guided Workout</button>
 <div class="grid two"><button class="secondary" onclick="markComplete(true)">${isComplete()?"Completed":"Mark Complete"}</button><button class="secondary" onclick="nextDay()">Next Day</button></div>
 </section>${renderExerciseGuides(x)}`;
}
function legacyRemoved_renderWorkout_preV142(){const x=currentWorkout();document.getElementById("workout").innerHTML=`<section class="card workout-mode"><div><p class="muted small">Guided session</p><div class="cue">${x.title}</div></div><div class="timer" id="timerDisplay">--:--</div><div class="progress-bar"><div id="workoutProgress" class="progress-fill"></div></div><p id="workoutMessage" class="muted">Tap start and keep this screen open during workouts.</p><div class="pill-row" style="justify-content:center"><span class="pill"><span id="awakeDot" class="dot"></span> <span id="awakeText">Screen awake not active</span></span></div><button onclick="startWorkout()">Start Today's Workout</button><button class="secondary" onclick="skipCurrent()">Skip Current Step</button><button id="pauseButton" class="secondary" onclick="togglePause()">Pause</button></section>`}
function renderDashboard(){
 const weekDone=[1,2,3,4,5,6,7].filter(d=>state.completed.includes(`${state.week}-${d}`)).length;
 const badges=badgeList();
 document.getElementById("dashboard").innerHTML=`<section class="card hero"><h2>Command Center</h2><div class="grid three"><div><div class="ring" style="--pct:${progressPercent()}%"><span>${progressPercent()}%</span></div><p class="muted small" style="text-align:center;margin-top:8px">Program</p></div><div class="stat"><span class="muted small">This Week</span><strong>${weekDone}/7</strong></div><div class="stat"><span class="muted small">Streak</span><strong>${state.streak}</strong></div></div><div class="grid two"><div class="stat"><span class="muted small">Workouts</span><strong>${state.totalCompleted}</strong></div><div class="stat"><span class="muted small">Current</span><strong>W${state.week} D${state.dayIndex}</strong></div></div></section><section class="card hero"><h3>Badges</h3><div class="grid two">${badges.map(b=>`<div class="badge ${b.unlocked?"":"locked"}"><strong>${b.icon} ${b.name}</strong><p class="muted small">${b.desc}</p></div>`).join("")}</div></section><section class="card hero"><h3>Native App Future</h3><p class="muted">Apple Health, Apple Watch haptics, lock-screen controls, and true background coaching need a native iOS app. This PWA is built to be the working blueprint.</p></section>`}
function renderPlan(){document.getElementById("plan").innerHTML=plan.map(w=>`<section class="card"><h3>Week ${w.num}: ${w.theme}</h3><div style="height:10px"></div><div class="list">${w.days.map((d,i)=>{const key=`${w.num}-${i+1}`;return`<div class="row"><span>${i+1}. ${d.day} — ${d.title}</span><span class="${state.completed.includes(key)?"complete":"muted"}">${state.completed.includes(key)?"✓":d.type==="bodyweight"?"strength":d.type}</span></div>`}).join("")}</div></section>`).join("")}
function renderJournal(){document.getElementById("journal").innerHTML=`<section class="card hero"><h2>Journal</h2><button onclick="openJournalEntry()">Add Reflection</button><div class="list">${(state.journal||[]).slice().reverse().map(j=>`<div class="row" style="align-items:flex-start"><div><strong>${j.date}</strong><p class="muted small">${j.workout}</p><p style="margin-top:6px">${j.feel}</p><p class="muted small">${j.note||""}</p></div></div>`).join("")||'<p class="muted">No reflections yet.</p>'}</div></section>`}
function badgeList(){return[{icon:"🔥",name:"First Step",desc:"Complete one workout.",unlocked:state.totalCompleted>=1},{icon:"🛡",name:"Seven Strong",desc:"Complete seven workouts.",unlocked:state.totalCompleted>=7},{icon:"🏔",name:"Long Run Builder",desc:"Reach Week 5.",unlocked:state.week>=5},{icon:"⚔",name:"Discipline",desc:"Build a 10 workout streak.",unlocked:state.streak>=10},{icon:"🏁",name:"13-Mile Ready",desc:"Reach Week 12.",unlocked:state.week>=12}]}

const exerciseGuides={
 "Squats":{icon:"🦵",steps:["Feet about shoulder-width apart.","Sit the hips back like you are reaching for a chair.","Keep chest tall and knees tracking over toes.","Drive through the whole foot to stand tall."],cues:["Chest tall","Knees track","No bouncing"],mistake:"Do not collapse the knees inward."},
 "Tempo squats":{icon:"⏳",steps:["Lower slowly for about three seconds.","Pause briefly at the bottom if you can control it.","Stand up smooth without bouncing."],cues:["Slow lower","Control","Stand tall"],mistake:"Do not rush the lowering phase."},
 "Pushups":{icon:"💪",steps:["Hands under shoulders or slightly wider.","Body stays in one straight line.","Lower the chest with control.","Press the floor away and lock out strong."],cues:["Brace core","Elbows controlled","Straight line"],mistake:"Do not let your hips sag."},
 "Lunges":{icon:"🚶",steps:["Step forward with control.","Lower until both knees bend comfortably.","Front knee tracks over the toes.","Push through the front foot to return."],cues:["Tall posture","Soft landing","Drive up"],mistake:"Do not slam the back knee down."},
 "Reverse lunges":{icon:"↩️",steps:["Step backward instead of forward.","Keep most weight in the front leg.","Lower under control.","Drive through the front foot to stand."],cues:["Front leg works","Control","Tall chest"],mistake:"Do not push off the back foot too much."},
 "Plank":{icon:"🧱",steps:["Elbows under shoulders.","Squeeze glutes lightly and brace the stomach.","Keep a straight line from shoulders to heels.","Breathe slowly without letting the hips drop."],cues:["Brace","Breathe","Straight line"],mistake:"Stop if your low back pinches."},
 "Glute bridges":{icon:"🌉",steps:["Lie on your back with knees bent.","Feet flat and close enough that shins are roughly vertical.","Drive hips up by squeezing glutes.","Pause briefly at the top, then lower with control."],cues:["Squeeze glutes","Ribs down","Control"],mistake:"Do not arch your low back to get higher."}
};
function guideFor(name){return exerciseGuides[name]||exerciseGuides[name.replace('Tempo ','')]||exerciseGuides[name.replace('Reverse ','')]||{icon:"✅",steps:["Move with control.","Keep breathing steady.","Stop if pain feels sharp."],cues:["Control","Breathe","Good form"],mistake:"Do not chase speed over form."}}
function gifNameFor(name){
  return name.toLowerCase().replace(/'/g,"").replace(/\s+/g,"-")+".gif";
}
function renderExerciseGuides(workout){
  if(workout.type!=="bodyweight")return"";
  return`<section class="card hero"><h3>How to Perform Today’s Exercises</h3><p class="muted small">Use this as your form checklist before you start. GIFs can be added later under assets/gifs/ using the shown filenames.</p><div class="grid">${workout.exercises.map(e=>{const g=guideFor(e.name);const gif=gifNameFor(e.name);return`<div class="guide-card"><div class="guide-mini"><span>${g.icon}</span><span>${e.name}</span><span>${e.mode==='timed'?e.seconds+' sec':e.reps}</span></div><div class="demo-gif"><img src="assets/gifs/${gif}" alt="${e.name} demo" onerror="this.style.display='none';this.parentElement.innerHTML='<div class=&quot;fallback&quot;>GIF placeholder<br><span class=&quot;muted small&quot;>assets/gifs/${gif}</span></div>'"></div><ul>${g.steps.map(step=>`<li>${step}</li>`).join('')}</ul><p class="muted small"><strong>Key cues:</strong> ${g.cues.join(' • ')}</p><p class="muted small"><strong>Watch out:</strong> ${g.mistake}</p></div>`}).join('')}</div></section>`
}

function markComplete(manual=false){const key=currentKey();if(!state.completed.includes(key)){state.completed.push(key);state.streak++;state.totalCompleted++;state.lastCompletedKey=key;if(manual)speak(phrase("finish"));saveState()}}
function nextDay(){state.dayIndex++;if(state.dayIndex>7){state.dayIndex=1;state.week++}if(state.week>12){state.week=12;state.dayIndex=7}saveState()}
function legacyRemoved_startWorkout_v14cleanup(){ workoutAbort=false; skipCurrentTimer=false; workoutPaused=false; if(settings.adaptive) openReadiness(); else beginWorkout("normal");}
function openReadiness(){showModal(`<h2>Readiness Check</h2><p class="muted" style="margin:10px 0 18px">How are you feeling right now?</p><button onclick="hideModal();beginWorkout('great')">Great</button><div style="height:8px"></div><button class="secondary" onclick="hideModal();beginWorkout('normal')">Good / Normal</button><div style="height:8px"></div><button class="gold" onclick="hideModal();beginWorkout('tired')">Tired or Sore</button><div style="height:8px"></div><button class="danger" onclick="hideModal();beginWorkout('back')">Back Tight</button>`)}
async function legacyRemoved_beginWorkout_v14cleanup(readiness){
 stopWorkout(false); workoutAbort=false; skipCurrentTimer=false; workoutPaused=false; const x=currentWorkout();document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));document.getElementById("workout").classList.add("active");document.querySelectorAll("nav button").forEach(b=>b.classList.remove("active"));document.querySelectorAll("nav button")[1].classList.add("active");renderWorkout();requestWakeLock();
 if(readiness==="back"){await cue("Back is tight. Switch to easy walking and mobility today.");setCue("Walk Only");setTimer("EASY");setWorkoutMessage("Back tight fallback: easy walk and mobility. Do not force the plan.");return}
 if(x.type==="run")startRun(x,readiness);else if(x.type==="bodyweight")startStrength(x,readiness);else startRest(x)
}
function startRest(x){setWorkoutMessage("Rest day. Light walking only.");setCue("Rest Day");setTimer("REST");cue("Today is a rest day. Light walking only.")}
async function startRun(x,readiness){
 let total=x.total*60;if(readiness==="tired")total=Math.round(total*.8);
 let remaining=total,half=Math.floor(total/2),halfSpoken=false;setCue("Warmup");setWorkoutMessage("Warm up first. This keeps you moving longer.");if(settings.warmup)await warmup();
 await cue(phrase("start"));
 while(remaining>0 && !workoutAbort){await runSegment("Run",x.runSeconds,remaining,total); if(workoutAbort) return;remaining-=x.runSeconds;if(!halfSpoken&&settings.routeMode==="outback"&&remaining<=half){halfSpoken=true;showHalfway()}if(remaining<=0)break;await runSegment("Walk",x.walkSeconds,remaining,total); if(workoutAbort) return; remaining-=x.walkSeconds;if(!halfSpoken&&settings.routeMode==="outback"&&remaining<=half){halfSpoken=true;showHalfway()}}
 if(settings.cooldown)await cooldown(); if(workoutAbort) return; finishWorkout()
}
async function runSegment(label,seconds,remaining,total){setCue(label.toUpperCase());setWorkoutMessage(label==="Run"?"Stay controlled. Smooth is fast.":"Recover. Keep moving.");await cue(label==="Run"?phrase("run"):phrase("walk"));await timer(seconds,remaining,total)}
function legacyRemoved_showHalfway_v14cleanup(){setCue("TURN BACK");setWorkoutMessage("Halfway point. Turn back now.");cue(phrase("half"))}
async function startStrength(x,readiness){
 setCue("Warmup"); if(settings.warmup) await warmup(); if(workoutAbort) return; let rounds=x.rounds;if(readiness==="tired")rounds=Math.max(1,rounds-1);
 speak(`Starting bodyweight workout. ${rounds} rounds.`);await sleep(800);
 for(let r=1;r<=rounds && !workoutAbort;r++){setCue(`Round ${r}`);speak(template(phrase("round"),{n:r,t:rounds}));for(const e of x.exercises){if(workoutAbort) return; setCue(e.name);if(e.mode==="timed"){setWorkoutMessage(`${e.name}. ${e.seconds} seconds.`);await cue(template(phrase("timed"),{name:e.name,seconds:e.seconds}));await timer(e.seconds,e.seconds,e.seconds); if(workoutAbort) return; await cue(`${e.name} complete.`)}else{setTimer("DONE?");setWorkoutMessage(`${e.name}. ${e.reps}. Tap Done when finished.`);await cue(template(phrase("rep"),{name:e.name,reps:e.reps}));await waitForDone(e.name,e.reps); if(workoutAbort) return;}}}
 if(settings.cooldown) await cooldown(); if(workoutAbort) return; finishWorkout()
}
async function warmup(){
  if(!settings.warmup) return;
await cue("Warmup. March in place. Then loosen the hips and ankles. Tap skip current step if you want to move ahead.");setTimer("2:00");setWorkoutMessage("Warmup: march, leg swings, calf raises, easy movement. Tap Skip Current Step to move ahead.");await timer(120,120,120)}
async function cooldown(){await cue("Cooldown. Walk easy and bring your breathing down. Tap skip current step if you are done.");setCue("Cooldown");setWorkoutMessage("Cooldown: easy walk, calves, hips, hamstrings. Tap Skip Current Step to finish.");await timer(180,180,180)}
async function finishWorkout(){setCue("Complete");setTimer("DONE");setWorkoutMessage("Workout complete. Good work.");await cue(phrase("finish"));markComplete(false);releaseWakeLock();showModal(`<h2>Workout Complete</h2><p class="muted" style="margin:10px 0 18px">${currentWorkout().day} — ${currentWorkout().title}</p><button onclick="hideModal();openJournalEntry()">Reflect</button><div style="height:8px"></div><button onclick="hideModal();nextDay()">Move to Next Day</button><div style="height:8px"></div><button class="secondary" onclick="hideModal()">Stay Here</button>`)}
function waitForDone(name,reps){return new Promise(resolve=>{showModal(`<h2>${name}</h2><p class="muted" style="margin:10px 0 18px">${reps}</p><button onclick="resolveDone()">Done</button>`);window.resolveDone=()=>{hideModal();resolve()}})}
async function countdown(){
  setTimer("GO");
  setWorkoutMessage("Starting workout.");
  await cue("Go.");
  await sleep(250);
}
function timer(seconds,remainingBefore,total){
  return new Promise(resolve=>{
    let left=Math.max(0,seconds);
    let elapsed=0;
    let resolved=false;
    skipCurrentTimer=false;
    clearInterval(activeTimer);
    updateTimer(left,remainingBefore,total);

    activeTimerResolve=()=>{
      if(resolved) return;
      resolved=true;
      clearInterval(activeTimer);
      activeTimer=null;
      activeTimerResolve=null;
      skipCurrentTimer=false;
      resolve();
    };

    activeTimer=setInterval(()=>{
      if(workoutAbort || skipCurrentTimer){
        activeTimerResolve();
        return;
      }

      if(workoutPaused){
        return;
      }

      left--;
      elapsed++;
      updateTimer(left,Math.max(0,remainingBefore-elapsed),total);

      if(left<=0){
        activeTimerResolve();
      }
    },1000);
  });
}
function updateTimer(left,remaining,total){setTimer(formatTime(left));let done=total?((total-remaining)/total)*100:0;let bar=document.getElementById("workoutProgress");if(bar)bar.style.width=`${Math.max(0,Math.min(100,done))}%`}
function stopWorkout(fullStop=false){
  // Internal safety only. This is not exposed as a workout-screen button.
  workoutAbort=!!fullStop;
  skipCurrentTimer=!!fullStop;
  workoutPaused=false;

  if(fullStop){
    if(activeTimerResolve){
      activeTimerResolve();
    }else{
      clearInterval(activeTimer);
      activeTimer=null;
    }

    if(window.speechSynthesis){
      try{window.speechSynthesis.cancel()}catch(e){}
    }

    speechQueue=Promise.resolve();
    releaseWakeLock();
    setAwake(false,"Screen awake not active");
    setCue("Paused");
    setTimer("PAUSE");
    setWorkoutMessage("Workout paused.");
  }

  updatePauseButton();
}

function legacyRemoved_togglePause_v14cleanup(){
  workoutPaused=!workoutPaused;

  if(workoutPaused){
    if(window.speechSynthesis){
      try{window.speechSynthesis.cancel()}catch(e){}
    }
    setCue("Paused");
    setWorkoutMessage("Paused. Tap Resume to continue from here.");
  }else{
    setWorkoutMessage("Resuming from where you paused...");
    cue("Resuming.");
  }

  updatePauseButton();
}

function updatePauseButton(){
  const b=document.getElementById("pauseButton");
  if(b) b.textContent=workoutPaused ? "Resume" : "Pause";
}

function legacyRemoved_skipCurrent_v14cleanup(){
  skipCurrentTimer=true;
  workoutPaused=false;
  updatePauseButton();

  if(window.speechSynthesis){
    try{window.speechSynthesis.cancel()}catch(e){}
  }
  speechQueue=Promise.resolve();

  setCue("Next");
  setTimer("NEXT");
  setWorkoutMessage("Moving to the next step...");

  if(activeTimerResolve){
    activeTimerResolve();
  }

  if(window.resolveDone){
    try{window.resolveDone()}catch(e){}
  }
}
async function requestWakeLock(){if(!settings.keepAwake)return;try{if("wakeLock"in navigator){wakeLock=await navigator.wakeLock.request("screen");setAwake(true,"Screen awake active");wakeLock.addEventListener("release",()=>setAwake(false,"Screen awake released"))}else setAwake(false,"Wake lock unsupported")}catch(e){setAwake(false,"Wake lock blocked")}}
function releaseWakeLock(){if(wakeLock){wakeLock.release();wakeLock=null}setAwake(false,"Screen awake not active")}
function setAwake(on,text){let d=document.getElementById("awakeDot"),t=document.getElementById("awakeText");if(d)d.className=on?"dot on":"dot";if(t)t.textContent=text}
function setCue(t){let e=document.querySelector("#workout .cue");if(e)e.textContent=t} function setTimer(t){let e=document.getElementById("timerDisplay");if(e)e.textContent=t} function setWorkoutMessage(t){let e=document.getElementById("workoutMessage");if(e)e.textContent=t}
function openJournalEntry(){const x=currentWorkout();showModal(`<h2>Reflection</h2><p class="muted" style="margin:8px 0 12px">${x.day} — ${x.title}</p><label class="small muted">How did it feel?</label><select id="feel"><option>Easy</option><option>Moderate</option><option>Hard</option><option>Brutal</option><option>Skipped / Modified</option></select><div style="height:10px"></div><label class="small muted">Notes</label><textarea id="note" placeholder="Back tight, felt strong, route was hilly, etc."></textarea><div style="height:10px"></div><button onclick="saveJournal()">Save Reflection</button><div style="height:8px"></div><button class="secondary" onclick="hideModal()">Cancel</button>`)}
function saveJournal(){const x=currentWorkout();state.journal=state.journal||[];state.journal.push({date:new Date().toLocaleDateString(),workout:`W${state.week} D${state.dayIndex} ${x.title}`,feel:document.getElementById("feel").value,note:document.getElementById("note").value});saveState();hideModal()}
function openSettings(){populateVoices();let opts=voices.map(v=>`<option value="${v.voiceURI}" ${settings.voiceURI===v.voiceURI?"selected":""}>${v.name} ${v.lang}</option>`).join("");showModal(`<h2>Settings</h2><p class="muted" style="margin:8px 0 12px">Voice, route mode, adaptive coaching, and workout flow.</p><label class="small muted">Coach Style</label><select id="coachStyle"><option value="trail" ${settings.coachStyle==="trail"?"selected":""}>Trail Guide</option><option value="calm" ${settings.coachStyle==="calm"?"selected":""}>Calm Coach</option><option value="tough" ${settings.coachStyle==="tough"?"selected":""}>Tough Love</option></select><div style="height:10px"></div><label class="small muted">Voice</label><select id="voiceSelect"><option value="">System Default</option>${opts}</select><div style="height:10px"></div><label class="small muted">Voice Speed</label><select id="voiceRate"><option value=".85" ${settings.voiceRate==.85?"selected":""}>Slow</option><option value=".95" ${settings.voiceRate==.95?"selected":""}>Normal</option><option value="1.05" ${settings.voiceRate==1.05?"selected":""}>Brisk</option></select><div style="height:10px"></div><label class="small muted">Route Mode</label><select id="routeMode"><option value="outback" ${settings.routeMode==="outback"?"selected":""}>Out and Back: Halfway Cue</option><option value="loop" ${settings.routeMode==="loop"?"selected":""}>Loop: No Turnaround Cue</option><option value="treadmill" ${settings.routeMode==="treadmill"?"selected":""}>Treadmill</option><option value="trail" ${settings.routeMode==="trail"?"selected":""}>Trail</option></select><div style="height:10px"></div><label><input id="adaptive" type="checkbox" ${settings.adaptive?"checked":""}> Adaptive readiness check</label><br><label><input id="warmup" type="checkbox" ${settings.warmup?"checked":""}> Warmup coaching</label><br><label><input id="cooldown" type="checkbox" ${settings.cooldown?"checked":""}> Cooldown coaching</label><br><label><input id="keepAwake" type="checkbox" ${settings.keepAwake?"checked":""}> Try to keep screen awake</label><div style="height:12px"></div><button onclick="saveSettingsFromModal()">Save Settings</button><div style="height:8px"></div><button class="secondary" onclick="testVoice()">Test Voice</button><div style="height:8px"></div><button class="danger" onclick="confirmReset()">Reset Program</button><p class="muted small" style="margin-top:12px">For best reliability, set iPhone Auto-Lock to Never during workouts. A web app cannot guarantee true background coaching when the phone locks.</p>`) }
function saveSettingsFromModal(){settings.coachStyle=document.getElementById("coachStyle").value;settings.voiceURI=document.getElementById("voiceSelect").value;settings.voiceRate=parseFloat(document.getElementById("voiceRate").value);settings.routeMode=document.getElementById("routeMode").value;settings.adaptive=document.getElementById("adaptive").checked;settings.warmup=document.getElementById("warmup").checked;settings.cooldown=document.getElementById("cooldown").checked;settings.keepAwake=document.getElementById("keepAwake").checked;saveSettings();speak("Settings saved. Ready when you are.")}
function testVoice(){saveSettingsFromModal();speak("This is your RUUT coach. Smooth, steady, and built for the long run.")}
function confirmReset(){showModal(`<h2>Reset Program?</h2><p class="muted" style="margin:12px 0 18px">This clears progress, journal entries, and returns you to Week 1, Day 1.</p><button class="danger" onclick="resetProgram()">Reset Everything</button><div style="height:8px"></div><button class="secondary" onclick="hideModal()">Cancel</button>`)}
function resetProgram(){state=defaultState();saveState();hideModal()}
function exportProgress(){showModal(`<h2>Progress Backup</h2><p class="muted small" style="margin:10px 0">Copy this if you want a backup.</p><textarea>${JSON.stringify(state,null,2)}</textarea><div style="height:8px"></div><button onclick="hideModal()">Done</button>`)}
function phrase(k){let b=voicePacks[settings.coachStyle]||voicePacks.trail,a=b[k]||voicePacks.trail[k]||[""];return a[Math.floor(Math.random()*a.length)]}
function template(s,o){return s.replace(/\{(\w+)\}/g,(_,k)=>o[k]??"")}
function populateVoices(){voices=window.speechSynthesis?window.speechSynthesis.getVoices():[]} if("speechSynthesis"in window){speechSynthesis.onvoiceschanged=populateVoices;populateVoices()}
let speechQueue=Promise.resolve();
let voicePrimedUntil=0;
let speechWatchdog=null;

function applyVoice(u){
  u.rate=settings.voiceRate||.95;
  u.pitch=1;
  u.volume=1;
  let v=voices.find(x=>x.voiceURI===settings.voiceURI);
  if(v)u.voice=v;
  return u;
}

function startSpeechWatchdog(){
  if(!("speechSynthesis" in window)) return;
  if(speechWatchdog) return;
  speechWatchdog=setInterval(()=>{
    try{
      if(window.speechSynthesis.paused) window.speechSynthesis.resume();
    }catch(e){}
  },2500);
}

function stopSpeechWatchdog(){
  if(speechWatchdog){
    clearInterval(speechWatchdog);
    speechWatchdog=null;
  }
}

function primeVoice(){
  return new Promise(resolve=>{
    if(!("speechSynthesis" in window)) return resolve();
    startSpeechWatchdog();
    try{ window.speechSynthesis.resume(); }catch(e){}
    if(Date.now()<voicePrimedUntil) return resolve();
    voicePrimedUntil=Date.now()+30000;

    let p=applyVoice(new SpeechSynthesisUtterance("ready"));
    p.volume=0.01;
    p.rate=1;
    let done=false;
    const finish=()=>{ if(done) return; done=true; setTimeout(resolve,180); };
    p.onend=finish;
    p.onerror=finish;

    try{ window.speechSynthesis.speak(p); }catch(e){ finish(); }
    setTimeout(finish,700);
  });
}

function speak(text){
  if(!("speechSynthesis" in window)) return Promise.resolve();

  const phrase=String(text||"").trim();
  if(!phrase) return Promise.resolve();

  speechQueue=speechQueue
    .catch(()=>{})
    .then(async()=>{
      await primeVoice();

      return new Promise(resolve=>{
        let finished=false;
        let maxTime=Math.max(2200, phrase.length*95);

        const finish=()=>{ if(finished) return; finished=true; resolve(); };

        try{
          window.speechSynthesis.resume();
          const u=applyVoice(new SpeechSynthesisUtterance(phrase));
          u.onend=finish;
          u.onerror=finish;
          window.speechSynthesis.speak(u);

          // Safari/iOS sometimes fails to fire onend during long sessions.
          setTimeout(finish,maxTime);
        }catch(e){
          finish();
        }
      });
    });

  return speechQueue;
}

async function cue(text){
  await speak(text);
}
function sleep(ms){return new Promise(r=>setTimeout(r,ms))}function formatTime(s){if(typeof s!=="number")return s;let m=Math.floor(s/60),sec=s%60;return`${m}:${String(sec).padStart(2,"0")}`}
function showModal(html){document.getElementById("modalContent").innerHTML=html;document.getElementById("modal").classList.add("active")}function hideModal(){document.getElementById("modal").classList.remove("active")}function closeModal(e){if(e.target.id==="modal")hideModal()}

// ---------- RECOVERY, FLEXIBILITY, CHALLENGES ----------
function recoveryStep(name,seconds){return{name,seconds}}
const recoveryGuides={
 "March in place":{gif:"march-in-place.gif",steps:["Stand tall.","Lift knees gently.","Swing arms naturally.","Breathe easy."],note:"Warm up, don't gas yourself."},
 "Leg swings":{gif:"leg-swings.gif",steps:["Hold support for balance.","Swing one leg forward and back.","Keep it controlled.","Switch sides."],note:"Do not force range."},
 "Calf raises":{gif:"calf-raises.gif",steps:["Stand tall.","Rise onto the balls of your feet.","Pause briefly.","Lower slowly."],note:"Good prep for running."},
 "Ankle rocks":{gif:"ankle-rocks.gif",steps:["Half-kneeling stance.","Drive knee forward over toes.","Keep heel down.","Move gently."],note:"Useful for trails and squats."},
 "Hamstring stretch":{gif:"hamstring-stretch.gif",steps:["Place one heel forward.","Hinge at hips with a flat back.","Keep stretch mild.","Hold and breathe."],note:"Static stretch. Do not bounce."},
 "Hip flexor stretch":{gif:"hip-flexor-stretch.gif",steps:["Step into half-kneeling or split stance.","Tuck pelvis slightly.","Shift forward gently.","Reach overhead if comfortable."],note:"Great after running and sitting."},
 "Calf stretch":{gif:"calf-stretch.gif",steps:["Hands on wall or tree.","Step one foot back.","Keep heel down.","Lean forward gently."],note:"Hold steady, no bouncing."},
 "Child's pose":{gif:"childs-pose.gif",steps:["Kneel and sit hips back.","Reach arms forward.","Let your back relax.","Breathe slow."],note:"Ease off if knees dislike it."},
 "Figure four stretch":{gif:"figure-four.gif",steps:["Lie on your back.","Cross ankle over opposite knee.","Pull gently toward chest.","Keep neck relaxed."],note:"Good for hips and glutes."},
 "Cat cow":{gif:"cat-cow.gif",steps:["Start on hands and knees.","Round your back slowly.","Then gently arch.","Move with breath."],note:"Mobility, not a hard stretch."},
 "Open book":{gif:"open-book.gif",steps:["Lie on your side.","Stack knees.","Rotate top arm open.","Follow with your eyes."],note:"Good for thoracic rotation."}
};
const recoveryRoutines={
 "pre-run":{title:"Pre-Run Mobility",kind:"mobility",note:"Dynamic prep before running. Wake up the hips, ankles, calves, and back.",steps:[recoveryStep("March in place",45),recoveryStep("Leg swings",45),recoveryStep("Calf raises",45),recoveryStep("Ankle rocks",45)]},
 "post-run":{title:"Post-Run Static Stretch",kind:"static",note:"Static holds for after running. Hold steady and breathe.",steps:[recoveryStep("Calf stretch",45),recoveryStep("Hamstring stretch",45),recoveryStep("Hip flexor stretch",45),recoveryStep("Figure four stretch",45),recoveryStep("Child's pose",60)]},
 "back-reset":{title:"Low Back Reset",kind:"recovery",note:"A gentle reset for back tightness. Nothing should feel sharp.",steps:[recoveryStep("Cat cow",45),recoveryStep("Child's pose",45),recoveryStep("Figure four stretch",45),recoveryStep("Open book",45)]},
 "flexibility":{title:"General Flexibility Builder",kind:"flexibility",note:"Use on recovery days or evenings to build flexibility over time.",steps:[recoveryStep("Hamstring stretch",60),recoveryStep("Hip flexor stretch",60),recoveryStep("Calf stretch",60),recoveryStep("Figure four stretch",60),recoveryStep("Child's pose",60),recoveryStep("Open book",45)]}
};
const challengeList=[
 {id:"mobility7",name:"7-Day Mobility Streak",desc:"Complete recovery or stretching work seven days in a row."},
 {id:"longrun4",name:"Long Run Month",desc:"Complete four Saturday long runs."},
 {id:"pushup500",name:"500 Pushups Challenge",desc:"Accumulate 500 pushups across strength days."},
 {id:"trailmonth",name:"Trail Month",desc:"Choose trail mode and complete at least six run workouts."},
 {id:"nozero",name:"No Zero Week",desc:"Complete at least five training actions in one week."}
];

function legacyRemoved_renderRecover_v14cleanup(){
 const routines=Object.entries(recoveryRoutines).map(([id,r])=>`<div class="row ${r.kind==='static'?'stretch-card':'recovery-card'}" style="align-items:flex-start"><div><strong>${r.title}</strong><p class="muted small">${r.note}</p><p class="muted tiny">${r.steps.length} guided movements</p></div><button class="secondary smallbtn" onclick="startRecoveryRoutine('${id}')">Start</button></div>`).join("");
 document.getElementById("recover").innerHTML=`<section class="card hero visual-glow"><h2>Recovery & Flexibility</h2><p class="muted">Use this on rest days, after runs, or any time your hips, calves, hamstrings, or back need attention.</p><div class="list">${routines}</div><button class="secondary" onclick="openStretchLibrary()">Stretch Library</button></section>`;
}
function openStretchLibrary(){
 const names=Object.keys(recoveryGuides);
 showModal(`<h2>Stretch Library</h2><p class="muted" style="margin:8px 0 12px">Static stretches and mobility drills for flexibility and recovery.</p><div class="list">${names.map(n=>`<div class="row"><span>${n}</span><button class="secondary smallbtn" onclick="openRecoveryDemo('${n}')">View</button></div>`).join("")}</div><div style="height:10px"></div><button class="secondary" onclick="hideModal()">Done</button>`);
}
function openRecoveryDemo(name){
 const g=recoveryGuides[name];
 if(!g)return;
 showModal(`<h2>${name}</h2><div class="demo-gif" style="margin:12px 0"><img src="assets/gifs/${g.gif}" alt="${name} demo" onerror="this.style.display='none';this.parentElement.innerHTML='<div class=&quot;fallback&quot;>GIF placeholder<br><span class=&quot;muted small&quot;>assets/gifs/${g.gif}</span></div>'"></div><h3>How to do it</h3><ol class="demo-steps">${g.steps.map(s=>`<li>${s}</li>`).join("")}</ol><div style="height:12px"></div><div class="detail"><strong>Coaching Note</strong><p class="muted">${g.note}</p></div><div style="height:12px"></div><button onclick="hideModal()">Done</button>`);
}
async function startRecoveryRoutine(id){
 const r=recoveryRoutines[id]; if(!r)return;
 hideModal();document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));document.getElementById("workout").classList.add("active");document.querySelectorAll("nav button").forEach(b=>b.classList.remove("active"));document.querySelectorAll("nav button")[1].classList.add("active");renderWorkout();await requestWakeLock();
 setCue(r.title);setWorkoutMessage(r.note);await cue(`Starting ${r.title}. Move gently and breathe.`);
 for(const step of r.steps){if(workoutAbort)return;const g=recoveryGuides[step.name];setCue(step.name);setWorkoutMessage(g?`${step.name}. ${step.seconds} seconds. ${g.note}`:`${step.name}. ${step.seconds} seconds.`);await cue(`${step.name}. ${step.seconds} seconds.`);await timer(step.seconds,step.seconds,step.seconds)}
 state.recoverySessions=(state.recoverySessions||0)+1;saveState();releaseWakeLock();setCue("Complete");setTimer("DONE");setWorkoutMessage("Recovery complete. Good work taking care of the machine.");await cue("Recovery complete. Good work taking care of the machine.");
}
const oldBadgeList=badgeList;
badgeList=function(){
 const completed=state.totalCompleted||0;
 const runMinutes=state.completed.reduce((sum,key)=>{const [w,d]=key.split("-").map(Number);const item=plan[w-1]?.days[d-1];return sum+(item?.type==="run"?(item.total||0):0)},0);
 const strengthSessions=state.completed.filter(key=>{const [w,d]=key.split("-").map(Number);return plan[w-1]?.days[d-1]?.type==="bodyweight"}).length;
 return [
  {icon:"🔥",name:"First Step",desc:"Complete one workout.",unlocked:completed>=1},
  {icon:"🛡",name:"Seven Strong",desc:"Complete seven workouts.",unlocked:completed>=7},
  {icon:"⚔️",name:"Discipline",desc:"Build a 10 workout streak.",unlocked:state.streak>=10},
  {icon:"🏔",name:"Long Run Builder",desc:"Reach Week 5.",unlocked:state.week>=5},
  {icon:"💪",name:"Strength Base",desc:"Complete five strength sessions.",unlocked:strengthSessions>=5},
  {icon:"🧘",name:"Recovery Wise",desc:"Complete three recovery sessions.",unlocked:(state.recoverySessions||0)>=3},
  {icon:"🦅",name:"Endurance Rising",desc:"Log 300 run minutes.",unlocked:runMinutes>=300},
  {icon:"🏁",name:"13-Mile Ready",desc:"Reach Week 12.",unlocked:state.week>=12}
 ];
};
function toggleChallenge(id){state.activeChallenges=state.activeChallenges||[];if(state.activeChallenges.includes(id))state.activeChallenges=state.activeChallenges.filter(x=>x!==id);else state.activeChallenges=[id];saveState();}
const oldRenderDashboard=renderDashboard;
renderDashboard=function(){
 const completed=state.completed||[];
 const weekDone=completed.filter(k=>k.startsWith(state.week+"-")).length;
 let runMinutes=0,longestRun=0,strengthSessions=0;
 for(const key of completed){const [w,d]=key.split("-").map(Number);const item=plan[w-1]?.days[d-1];if(item?.type==="run"){runMinutes+=item.total||0;longestRun=Math.max(longestRun,item.total||0)}if(item?.type==="bodyweight")strengthSessions++}
 const badges=badgeList();
 document.getElementById("dashboard").innerHTML=`<section class="card hero visual-glow"><h2>Command Center</h2><div class="grid three"><div><div class="ring" style="--pct:${progressPercent()}%"><span>${progressPercent()}%</span></div><p class="muted small" style="text-align:center;margin-top:8px">Program</p></div><div class="stat"><span class="muted small">Run Minutes</span><strong>${runMinutes}</strong></div><div class="stat"><span class="muted small">Longest Run</span><strong>${longestRun?longestRun+'m':'0m'}</strong></div></div><div class="grid two"><div class="stat"><span class="muted small">Strength Sessions</span><strong>${strengthSessions}</strong></div><div class="stat"><span class="muted small">Recovery Sessions</span><strong>${state.recoverySessions||0}</strong></div><div class="stat"><span class="muted small">This Week</span><strong>${weekDone}/7</strong></div><div class="stat"><span class="muted small">Streak</span><strong>${state.streak}</strong></div></div></section><section class="card hero"><h3>Challenge Mode</h3><p class="muted">Pick one challenge at a time.</p><div class="list">${challengeList.map(c=>{state.activeChallenges=state.activeChallenges||[];const active=state.activeChallenges.includes(c.id);return`<div class="row ${active?'challenge-active':''}"><div><strong>${c.name}</strong><p class="muted small">${c.desc}</p></div><button class="secondary smallbtn" onclick="toggleChallenge('${c.id}')">${active?'Active':'Start'}</button></div>`}).join("")}</div></section><section class="card hero"><h3>Badges</h3><div class="grid two">${badges.map(b=>`<div class="badge ${b.unlocked?'':'locked'}"><strong>${b.icon} ${b.name}</strong><p class="muted small">${b.desc}</p></div>`).join("")}</div></section>`;
};



// ---------- V6 PRODUCT PASS: REAL APP METRICS, CHALLENGES, VISUALS, ASSET ROADMAP ----------
const V6_GIF_FILES = [
  "squats.gif","tempo-squats.gif","pushups.gif","lunges.gif","reverse-lunges.gif","plank.gif","glute-bridges.gif",
  "march-in-place.gif","leg-swings.gif","calf-raises.gif","ankle-rocks.gif",
  "hamstring-stretch.gif","hip-flexor-stretch.gif","calf-stretch.gif","childs-pose.gif","figure-four-stretch.gif","cat-cow.gif","open-book.gif"
];

const V6_AUDIO_FILES = [
  "assets/audio/trail/start.mp3","assets/audio/trail/run.mp3","assets/audio/trail/walk.mp3","assets/audio/trail/halfway.mp3","assets/audio/trail/finish.mp3",
  "assets/audio/tough/start.mp3","assets/audio/tough/run.mp3","assets/audio/tough/walk.mp3","assets/audio/tough/halfway.mp3","assets/audio/tough/finish.mp3",
  "assets/audio/calm/start.mp3","assets/audio/calm/run.mp3","assets/audio/calm/walk.mp3","assets/audio/calm/halfway.mp3","assets/audio/calm/finish.mp3"
];

function slugName(name){
  return String(name).toLowerCase().replace(/'/g,"").replace(/&/g,"and").replace(/\s+/g,"-");
}

function v6WorkoutTypeLabel(type){
  if(type==="bodyweight") return "strength";
  return type;
}

function v6Metrics(){
  const completed=state.completed||[];
  let runMinutes=0,longestRun=0,runSessions=0,strengthSessions=0,longRuns=0,estimatedMiles=0,pushups=0,trailRuns=0;
  const byWeek={};
  for(const key of completed){
    const [w,d]=key.split("-").map(Number);
    const item=plan[w-1]?.days[d-1];
    if(!item) continue;
    byWeek[w]=(byWeek[w]||0)+1;
    if(item.type==="run"){
      runSessions++;
      runMinutes+=item.total||0;
      longestRun=Math.max(longestRun,item.total||0);
      if(item.day==="Sat") longRuns++;
      // rough estimate only. Conservative beginner run/walk estimate.
      estimatedMiles += Math.max(0, (item.total||0) / 13);
      if(settings.routeMode==="trail") trailRuns++;
    }
    if(item.type==="bodyweight"){
      strengthSessions++;
      const push = item.exercises?.find(e=>String(e.name).toLowerCase().includes("pushup"));
      if(push){
        const n=parseInt(push.reps,10);
        if(!isNaN(n)) pushups += n * (item.rounds||1);
      }
    }
  }
  const recoverySessions=state.recoverySessions||0;
  const journalCount=(state.journal||[]).length;
  const weekDone=completed.filter(k=>k.startsWith(state.week+"-")).length;
  const bestWeek=Math.max(0,...Object.values(byWeek));
  const noZeroWeeks=Object.values(byWeek).filter(v=>v>=5).length;
  return {completed,runMinutes,longestRun,runSessions,strengthSessions,longRuns,estimatedMiles,recoverySessions,journalCount,weekDone,bestWeek,noZeroWeeks,pushups,trailRuns};
}

function v6Challenges(){
  const m=v6Metrics();
  return [
    {id:"mobility7",name:"7-Day Mobility Streak",desc:"Complete 7 recovery or flexibility sessions.",current:m.recoverySessions,target:7,unit:"sessions"},
    {id:"longrun4",name:"Long Run Month",desc:"Complete 4 Saturday long runs.",current:m.longRuns,target:4,unit:"long runs"},
    {id:"pushup500",name:"500 Pushups Challenge",desc:"Accumulate 500 pushups from strength sessions.",current:m.pushups,target:500,unit:"pushups"},
    {id:"trailmonth",name:"Trail Month",desc:"Complete 6 run workouts while Trail mode is selected.",current:m.trailRuns,target:6,unit:"trail runs"},
    {id:"nozero",name:"No Zero Week",desc:"Complete 5 training actions in a week.",current:m.bestWeek,target:5,unit:"this week/best week"}
  ];
}

function v6ChallengeCard(c){
  state.activeChallenges=state.activeChallenges||[];
  const active=state.activeChallenges.includes(c.id);
  const pct=Math.min(100,Math.round((c.current/c.target)*100));
  const done=c.current>=c.target;
  return `<div class="challenge-card ${active?'active':''} ${done?'complete':''}">
    <div class="row" style="padding:0;background:transparent;border:0">
      <div><strong>${done?'🏆 ':active?'⚡ ':''}${c.name}</strong><p class="muted small">${c.desc}</p></div>
      <button class="secondary smallbtn" onclick="toggleChallenge('${c.id}')">${active?'Active':'Start'}</button>
    </div>
    <div class="challenge-bar"><div class="challenge-fill" style="width:${pct}%"></div></div>
    <p class="muted tiny">${c.current} / ${c.target} ${c.unit}</p>
  </div>`;
}

const v6OldRenderToday = renderToday;
renderToday = function(){
  const x=currentWorkout(), w=currentWeek();
  const exercises=x.type==="bodyweight"?x.exercises.map(e=>`<div class="exercise"><span>${e.name}</span><strong>${e.mode==="timed"?e.seconds+" sec":e.reps}</strong></div>`).join(""):"";
  document.getElementById("today").innerHTML=`
  <section class="mode-banner mode-${x.type} hero">
    <div class="pill-row"><span class="pill accent">Week ${state.week}</span><span class="pill">Day ${state.dayIndex}</span><span class="pill">${x.day}</span><span class="pill ${x.type}">${v6WorkoutTypeLabel(x.type)}</span><span class="pill">${settings.routeMode}</span></div>
    <div><p class="muted small">${w.theme}</p><h2>${x.title}</h2></div>
    <div class="grid two"><div class="stat"><span class="muted small">Time</span><strong>${x.time}</strong></div><div class="stat"><span class="muted small">Target</span><strong style="font-size:17px">${x.distance}</strong></div></div>
    <div class="big-action-row"><button onclick="startWorkout()">Start Guided Workout</button><button class="secondary" onclick="showTodayBriefing()">Briefing</button></div>
  </section>
  <section class="card hero">
    <h3>Workout Briefing</h3>
    <div class="detail"><strong>Purpose</strong><p class="muted">${x.purpose}</p></div>
    <div class="grid two"><div class="detail"><strong>Best Route</strong><p class="muted">${x.terrain}</p></div><div class="detail"><strong>Effort</strong><p class="muted">${x.effort}</p></div></div>
    <div class="detail"><strong>Structure</strong><p class="muted">${x.structure}</p></div>
    <div class="grid two"><div class="detail"><strong>Success</strong><p class="muted">${x.success}</p></div><div class="detail"><strong>Caution</strong><p class="muted">${x.caution}</p></div></div>
    ${exercises?`<div class="list">${exercises}</div><button class="secondary" onclick="openExerciseGuideList(currentWorkout().exercises.map(e=>e.name))">View Exercise Demos</button>`:""}
    <div class="grid two"><button class="secondary" onclick="markComplete(true)">${isComplete()?"Completed":"Mark Complete"}</button><button class="secondary" onclick="nextDay()">Next Day</button></div>
  </section>`;
};

function openTodayBriefing(){
  const x=currentWorkout();
  showModal(`<h2>${x.title}</h2><p class="muted" style="margin:8px 0 12px">${x.day} • ${x.time} • ${x.structure}</p>
  <div class="timeline">
    <div class="timeline-item"><span class="timeline-dot"></span><div><strong>Purpose</strong><p class="muted small">${x.purpose}</p></div></div>
    <div class="timeline-item"><span class="timeline-dot"></span><div><strong>Effort</strong><p class="muted small">${x.effort}</p></div></div>
    <div class="timeline-item"><span class="timeline-dot"></span><div><strong>Success Standard</strong><p class="muted small">${x.success}</p></div></div>
    <div class="timeline-item"><span class="timeline-dot"></span><div><strong>Watch Out</strong><p class="muted small">${x.caution}</p></div></div>
  </div><div style="height:12px"></div><button onclick="hideModal();startWorkout()">Start</button><div style="height:8px"></div><button class="secondary" onclick="hideModal()">Close</button>`);
}

renderDashboard = function(){
  const m=v6Metrics();
  const challenges=v6Challenges();
  const badges=badgeList();
  document.getElementById("dashboard").innerHTML=`
  <section class="card hero visual-glow">
    <h2>Command Center</h2>
    <div class="grid three">
      <div><div class="ring" style="--pct:${progressPercent()}%"><span>${progressPercent()}%</span></div><p class="muted small" style="text-align:center;margin-top:8px">Program</p></div>
      <div class="metric-card"><span>Run Minutes</span><strong>${m.runMinutes}</strong></div>
      <div class="metric-card"><span>Est. Miles</span><strong>${m.estimatedMiles.toFixed(1)}</strong></div>
    </div>
    <div class="grid two">
      <div class="metric-card"><span>Longest Run</span><strong>${m.longestRun?m.longestRun+'m':'0m'}</strong></div>
      <div class="metric-card"><span>Run Sessions</span><strong>${m.runSessions}</strong></div>
      <div class="metric-card"><span>Strength</span><strong>${m.strengthSessions}</strong></div>
      <div class="metric-card"><span>Recovery</span><strong>${m.recoverySessions}</strong></div>
      <div class="metric-card"><span>This Week</span><strong>${m.weekDone}/7</strong></div>
      <div class="metric-card"><span>Journal</span><strong>${m.journalCount}</strong></div>
    </div>
  </section>
  <section class="card hero">
    <h3>Challenge Mode</h3>
    <p class="muted">These now track real in-app progress, not just a label.</p>
    <div class="list">${challenges.map(v6ChallengeCard).join("")}</div>
  </section>
  <section class="card hero">
    <h3>Badges</h3>
    <div class="grid two">${badges.map(b=>`<div class="badge ${b.unlocked?"":"locked"}"><strong>${b.icon} ${b.name}</strong><p class="muted small">${b.desc}</p></div>`).join("")}</div>
  </section>`;
};

badgeList = function(){
  const m=v6Metrics();
  const completed=state.totalCompleted||0;
  return [
    {icon:"🔥",name:"First Step",desc:"Complete one workout.",unlocked:completed>=1},
    {icon:"🛡",name:"Seven Strong",desc:"Complete seven workouts.",unlocked:completed>=7},
    {icon:"⚔️",name:"Discipline",desc:"Build a 10 workout streak.",unlocked:state.streak>=10},
    {icon:"🏔",name:"Long Run Builder",desc:"Reach Week 5.",unlocked:state.week>=5},
    {icon:"💪",name:"Strength Base",desc:"Complete five strength sessions.",unlocked:m.strengthSessions>=5},
    {icon:"🧘",name:"Recovery Wise",desc:"Complete three recovery sessions.",unlocked:m.recoverySessions>=3},
    {icon:"🦅",name:"Endurance Rising",desc:"Log 300 run minutes.",unlocked:m.runMinutes>=300},
    {icon:"🥾",name:"Long Run Month",desc:"Complete four long runs.",unlocked:m.longRuns>=4},
    {icon:"🏁",name:"13-Mile Ready",desc:"Reach Week 12.",unlocked:state.week>=12}
  ];
};

function openExerciseGuideList(names){
  const unique=[...new Set(names)];
  showModal(`<h2>Exercise Demos</h2><p class="muted" style="margin:8px 0 12px">GIFs load from <strong>assets/gifs/</strong>. Missing files show placeholders until you upload GIFs.</p><div class="demo-grid">${unique.map(name=>`<div class="demo-tile"><strong>${name}</strong><p class="muted tiny">assets/gifs/${slugName(name)}.gif</p><button class="secondary smallbtn" onclick="openDemo('${name.replace(/'/g,"\\'")}')">Open</button></div>`).join("")}</div><div style="height:10px"></div><button class="secondary" onclick="openAssetRoadmap()">Asset List</button><div style="height:8px"></div><button onclick="hideModal()">Done</button>`);
}

function openDemo(name){
  const g=guideFor(name);
  const file=`assets/gifs/${slugName(name)}.gif`;
  showModal(`<h2>${name}</h2><div class="demo-gif" style="margin:12px 0"><img src="${file}" alt="${name} demo" onerror="this.style.display='none';this.parentElement.innerHTML='<div class=&quot;fallback&quot;>GIF placeholder<br><span class=&quot;muted small&quot;>${file}</span></div>'"></div><h3>How to do it</h3><ol class="demo-steps">${g.steps.map(s=>`<li>${s}</li>`).join("")}</ol><div style="height:12px"></div><div class="detail"><strong>Key Cues</strong><p class="muted">${g.cues.join(" • ")}</p></div><div style="height:8px"></div><div class="detail"><strong>Watch Out</strong><p class="muted">${g.mistake}</p></div><div style="height:12px"></div><button onclick="hideModal()">Done</button>`);
}

function openAssetRoadmap(){
  showModal(`<h2>Asset Folders</h2><p class="muted" style="margin:8px 0 12px">Create these folders in GitHub beside index.html.</p><div class="asset-note">assets/gifs/<br>${V6_GIF_FILES.map(f=>"  "+f).join("<br>")}<br><br>assets/audio/<br>${V6_AUDIO_FILES.map(f=>"  "+f.replace("assets/audio/","")).join("<br>")}</div><div style="height:12px"></div><button onclick="hideModal()">Done</button>`);
}

renderRecover = function(){
  const routines=Object.entries(recoveryRoutines||{}).map(([id,r])=>`<div class="row ${r.type==="static"||r.kind==="static"?"stretch-card":"recovery-card"}" style="align-items:flex-start"><div><strong>${r.title}</strong><p class="muted small">${r.note}</p><p class="muted tiny">${r.steps.length} guided movements</p></div><button class="secondary smallbtn" onclick="startRecoveryRoutine('${id}')">Start</button></div>`).join("");
  document.getElementById("recover").innerHTML=`<section class="card hero visual-glow"><h2>Recovery & Flexibility</h2><p class="muted">Pre-run mobility, post-run static stretching, low back care, and general flexibility work.</p><div class="list">${routines||"<p class='muted'>Recovery routines are loading.</p>"}</div><button class="secondary" onclick="openStretchLibrary()">Stretch Library</button><button class="secondary" onclick="openAssetRoadmap()">Stretch Library</button></section>`;
};



// ---------- V7 SIMPLE RUNNER STRETCH SYSTEM: NO GIF DEPENDENCY ----------
const stretchLibrary = {
  "High knees": {
    category:"dynamic", time:"1 minute", when:"Pre-run",
    steps:["Stand tall and jog or march in place.","Drive one knee up at a time toward hip height.","Pump your arms naturally.","Keep the movement quick but controlled."],
    cue:"Light feet. Tall posture. Wake the legs up."
  },
  "Butt kicks": {
    category:"dynamic", time:"1 minute", when:"Pre-run",
    steps:["Stand tall and jog or march in place.","Bring one heel toward your glutes at a time.","Keep knees pointing mostly down.","Pump your arms and stay relaxed."],
    cue:"Quick feet. Loose legs. Do not force the heel."
  },
  "Walking lunges with torso rotation": {
    category:"dynamic", time:"1 minute", when:"Pre-run",
    steps:["Step into a comfortable lunge.","Rotate your torso gently toward the front leg.","Stand and step into the next lunge.","Alternate sides with control."],
    cue:"Control the step. Rotate gently. Do not twist hard."
  },
  "Ankle circles": {
    category:"dynamic", time:"10–15 seconds each direction per ankle", when:"Pre-run",
    steps:["Stand tall and lift one foot slightly.","Circle the ankle clockwise.","Circle the ankle counterclockwise.","Switch feet."],
    cue:"Small controlled circles. Loosen the ankle."
  },
  "Hip circles": {
    category:"dynamic", time:"10–15 seconds each direction", when:"Pre-run",
    steps:["Stand tall with hands on hips.","Circle your hips slowly one direction.","Reverse direction.","Keep the movement smooth."],
    cue:"Gentle range. Wake up the hips."
  },
  "Standing calf stretch": {
    category:"static", time:"30–60 seconds per leg post-run", when:"Post-run / Static",
    steps:["Place both hands on a wall, tree, or sturdy surface.","Step one foot back.","Keep the back heel down.","Lean forward until you feel a mild calf stretch."],
    cue:"Heel down. Breathe. Do not bounce."
  },
  "Standing quad stretch": {
    category:"static", time:"30–60 seconds per leg post-run", when:"Post-run / Static",
    steps:["Stand tall and hold something for balance if needed.","Bend one knee and bring your heel toward your glutes.","Hold your ankle or shoe.","Keep knees close and hips gently tucked."],
    cue:"Tall posture. Hips tucked. Easy stretch."
  },
  "Triangle hamstring stretch": {
    category:"static", time:"30–60 seconds per leg post-run", when:"Post-run / Static",
    steps:["Step one foot forward with heel down and toes up.","Keep the front leg mostly straight but not locked.","Hinge at the hips with a flat back.","Stop when you feel a mild hamstring stretch."],
    cue:"Hinge, don't round. Mild stretch only."
  },
  "Lunge hamstring stretch": {
    category:"static", time:"30–60 seconds per leg post-run", when:"Post-run / Static",
    steps:["Start in a short lunge stance.","Shift hips back slightly.","Straighten the front leg gently.","Hinge forward until the back of the thigh stretches."],
    cue:"Slow and controlled. Do not yank into it."
  },
  "Hip flexor lunge stretch": {
    category:"static", time:"30–60 seconds per side post-run", when:"Post-run / Static",
    steps:["Step into a lunge or half-kneeling position.","Tuck your pelvis slightly like bringing belt buckle upward.","Shift forward gently.","Reach the same-side arm overhead if comfortable."],
    cue:"Tuck first, then shift. No low-back arch."
  },
  "Glute bridge hold": {
    category:"static", time:"30–60 seconds", when:"Post-run / Recovery",
    steps:["Lie on your back with knees bent and feet flat.","Drive through heels and lift hips.","Squeeze glutes gently at the top.","Hold while breathing steadily."],
    cue:"Glutes work. Low back stays quiet."
  },
  "Shoulder rolls": {
    category:"dynamic", time:"30 seconds each direction", when:"Warmup or cooldown",
    steps:["Stand tall with arms relaxed.","Roll shoulders forward in slow circles.","Reverse and roll backward.","Keep neck relaxed."],
    cue:"Relax the upper body."
  },
  "Arm circles": {
    category:"dynamic", time:"30 seconds each direction", when:"Warmup or cooldown",
    steps:["Extend arms out to the sides.","Make small controlled circles.","Gradually make them slightly larger.","Reverse direction."],
    cue:"Loose shoulders. Smooth circles."
  }
};

const runnerRoutinesV7 = {
  "dynamic-warmup": {
    title:"Dynamic Warm-Up",
    type:"dynamic",
    note:"Use before running. Start with 5 minutes of brisk walking or easy jogging, then move through these dynamic drills.",
    opener:"Warm-up starts with an easy walk or jog. Then dynamic movement.",
    steps:[
      routineStep("High knees",60),
      routineStep("Butt kicks",60),
      routineStep("Walking lunges with torso rotation",60),
      routineStep("Ankle circles",30),
      routineStep("Hip circles",30),
      routineStep("Shoulder rolls",30),
      routineStep("Arm circles",30)
    ]
  },
  "static-cooldown": {
    title:"Static Cool-Down",
    type:"static",
    note:"Use after running, after 5 minutes of easy walking. Static stretching belongs after the muscles are warm.",
    opener:"Cool-down starts with walking, then steady static stretches.",
    steps:[
      routineStep("Standing quad stretch",45),
      routineStep("Standing calf stretch",45),
      routineStep("Triangle hamstring stretch",45),
      routineStep("Hip flexor lunge stretch",45),
      routineStep("Glute bridge hold",45),
      routineStep("Shoulder rolls",30),
      routineStep("Arm circles",30)
    ]
  },
  "flexibility": {
    title:"General Flexibility",
    type:"flexibility",
    note:"Use on recovery days or evenings. Hold steady, breathe deeply, and avoid forcing range.",
    opener:"Flexibility session. Move slow, breathe, and do not chase pain.",
    steps:[
      routineStep("Standing calf stretch",60),
      routineStep("Standing quad stretch",60),
      routineStep("Triangle hamstring stretch",60),
      routineStep("Lunge hamstring stretch",60),
      routineStep("Hip flexor lunge stretch",60),
      routineStep("Glute bridge hold",60)
    ]
  },
  "low-back-friendly": {
    title:"Low-Back Friendly Recovery",
    type:"static",
    note:"A simple recovery option that avoids obscure positions. Keep all movement gentle.",
    opener:"Low back recovery. Easy range only.",
    steps:[
      routineStep("Glute bridge hold",45),
      routineStep("Hip flexor lunge stretch",45),
      routineStep("Triangle hamstring stretch",45),
      routineStep("Standing calf stretch",45),
      routineStep("Shoulder rolls",30)
    ]
  }
};

function routineStep(name,seconds){return{name,seconds};}

function stretchCard(name){
  const s=stretchLibrary[name];
  if(!s)return"";
  return `<div class="stretch-panel ${s.category}">
    <div class="row" style="background:transparent;border:0;padding:0">
      <div><strong>${name}</strong><p class="muted small">${s.cue}</p></div>
      <button class="secondary smallbtn" onclick="openStretchDetail('${name.replace(/'/g,"\\'")}')">View</button>
    </div>
    <div class="stretch-meta"><span class="stretch-chip">${s.when}</span><span class="stretch-chip">${s.time}</span><span class="stretch-chip">${s.category}</span></div>
  </div>`;
}

function openStretchDetail(name){
  const s=stretchLibrary[name];
  if(!s)return;
  showModal(`<h2>${name}</h2>
    <div class="stretch-meta" style="margin:10px 0 12px"><span class="stretch-chip">${s.when}</span><span class="stretch-chip">${s.time}</span><span class="stretch-chip">${s.category}</span></div>
    <ol class="instruction-list">${s.steps.map(step=>`<li>${step}</li>`).join("")}</ol>
    <div style="height:12px"></div>
    <div class="detail"><strong>Coach Cue</strong><p class="muted">${s.cue}</p></div>
    <div style="height:12px"></div>
    <button onclick="hideModal()">Done</button>`);
}

function renderRecover(){
  const routineCards=Object.entries(runnerRoutinesV7).map(([id,r])=>`
    <div class="stretch-panel ${r.type}">
      <div class="row" style="align-items:flex-start;background:transparent;border:0;padding:0">
        <div><strong>${r.title}</strong><p class="muted small">${r.note}</p><p class="muted tiny">${r.steps.length} guided movements</p></div>
        <button class="secondary smallbtn" onclick="startRunnerRoutineV7('${id}')">Start</button>
      </div>
    </div>`).join("");

  document.getElementById("recover").innerHTML=`
    <section class="card hero visual-glow">
      <h2>Recovery & Flexibility</h2>
      <p class="muted">Simple, recognizable runner warmups and cooldowns. No obscure movements. No GIF dependency.</p>
      <div class="no-gif-note">Pre-run = dynamic movement. Post-run = static stretching after an easy walk. General flexibility = slow static work on recovery days.</div>
      <div class="list">${routineCards}</div>
    </section>
    <section class="card hero">
      <h3>Dynamic Warm-Up Moves</h3>
      <div class="list">${["High knees","Butt kicks","Walking lunges with torso rotation","Ankle circles","Hip circles","Shoulder rolls","Arm circles"].map(stretchCard).join("")}</div>
    </section>
    <section class="card hero">
      <h3>Static Cool-Down Stretches</h3>
      <div class="list">${["Standing quad stretch","Standing calf stretch","Triangle hamstring stretch","Lunge hamstring stretch","Hip flexor lunge stretch","Glute bridge hold"].map(stretchCard).join("")}</div>
    </section>`;
}

function openStretchLibrary(){
  const dynamic=["High knees","Butt kicks","Walking lunges with torso rotation","Ankle circles","Hip circles","Shoulder rolls","Arm circles"];
  const statics=["Standing quad stretch","Standing calf stretch","Triangle hamstring stretch","Lunge hamstring stretch","Hip flexor lunge stretch","Glute bridge hold"];
  showModal(`<h2>Stretch Library</h2>
    <p class="muted" style="margin:8px 0 12px">Dynamic options before runs. Static options after runs or on recovery days.</p>
    <h3>Dynamic</h3><div class="list">${dynamic.map(stretchCard).join("")}</div>
    <div style="height:12px"></div>
    <h3>Static</h3><div class="list">${statics.map(stretchCard).join("")}</div>
    <div style="height:12px"></div>
    <button onclick="hideModal()">Done</button>`);
}

async function startRunnerRoutineV7(id){
  const r=runnerRoutinesV7[id];
  if(!r)return;
  hideModal();
  document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
  document.getElementById("workout").classList.add("active");
  document.querySelectorAll("nav button").forEach(b=>b.classList.remove("active"));
  document.querySelectorAll("nav button")[1].classList.add("active");
  renderWorkout();
  await requestWakeLock();
  setCue(r.title);
  setWorkoutMessage(r.note);
  await cue(r.opener);
  for(const step of r.steps){
    if(workoutAbort)return;
    const s=stretchLibrary[step.name];
    setCue(step.name);
    setWorkoutMessage(`${step.name}. ${step.seconds} seconds. ${s?s.cue:"Move with control."}`);
    await cue(`${step.name}. ${step.seconds} seconds.`);
    await timer(step.seconds,step.seconds,step.seconds);
  }
  state.recoverySessions=(state.recoverySessions||0)+1;
  saveState();
  releaseWakeLock();
  setCue("Complete");
  setTimer("DONE");
  setWorkoutMessage(`${r.title} complete.`);
  await cue(`${r.title} complete.`);
}

// Replace previous demo behavior with simple instruction behavior
function openExerciseGuideList(names){
  const unique=[...new Set(names)];
  showModal(`<h2>Exercise Instructions</h2><p class="muted" style="margin:8px 0 12px">No GIFs needed. These are simple form checklists.</p><div class="list">${unique.map(name=>`<div class="row"><span>${name}</span><button class="secondary smallbtn" onclick="openDemo('${name.replace(/'/g,"\\'")}')">View</button></div>`).join("")}</div><div style="height:10px"></div><button onclick="hideModal()">Done</button>`);
}

function openDemo(name){
  const g=guideFor(name);
  showModal(`<h2>${name}</h2>
    <ol class="instruction-list">${g.steps.map(s=>`<li>${s}</li>`).join("")}</ol>
    <div style="height:12px"></div>
    <div class="detail"><strong>Key Cues</strong><p class="muted">${g.cues.join(" • ")}</p></div>
    <div style="height:8px"></div>
    <div class="detail"><strong>Watch Out</strong><p class="muted">${g.mistake}</p></div>
    <div style="height:12px"></div>
    <button onclick="hideModal()">Done</button>`);
}


// ---------- V8: SMART RUN MODES, LONG RUN COACHING, REFLECTIONS, COCKPIT ----------
let currentWorkoutSession = {
  active:false,
  type:null,
  startedAt:null,
  routeMode:null,
  readiness:null,
  longRun:false,
  skipped:false
};

function routeModeDescription(mode){
  const data={
    outback:{title:"Out & Back",tip:"Halfway cue is active. Turn around when RUUT tells you."},
    loop:{title:"Loop",tip:"No turnaround cue. RUUT will give time-remaining cues."},
    treadmill:{title:"Treadmill",tip:"Use effort, not ego. RUUT will cue posture, breathing, and control."},
    trail:{title:"Trail",tip:"Run the flats, control descents, and hike steep climbs when needed."}
  };
  return data[mode]||data.outback;
}

const runModeCueBank={
  outback:["Out and back mode. I’ll tell you when to turn around.","Halfway cue is active today.","Run out easy. Come back steady."],
  loop:["Loop mode. No turnaround cue today.","Stay relaxed and finish the loop clean.","I’ll call time remaining as you go."],
  treadmill:["Treadmill mode. Keep posture tall and effort controlled.","Let the belt move. Stay relaxed.","No chasing speed. Smooth effort."],
  trail:["Trail mode. Control the hills and stay light on your feet.","Hike steep climbs. Run smooth sections.","Eyes up. Quick feet. Easy effort."]
};

function smartRunCue(mode){
  const arr=runModeCueBank[mode]||runModeCueBank.outback;
  return arr[Math.floor(Math.random()*arr.length)];
}

function longRunPhase(total,remaining){
  const elapsed=total-remaining;
  const pct=elapsed/total;
  if(pct<0.34)return {name:"First Third",message:"First third. Keep this almost too easy. You are banking patience."};
  if(pct<0.67)return {name:"Middle Third",message:"Middle third. Settle in. Smooth breathing. Stay efficient."};
  return {name:"Final Third",message:"Final third. Stay calm and finish proud. Do not force it."};
}

function isSaturdayLongRun(workout){
  return workout.type==="run" && workout.day==="Sat";
}

// Replace workout cockpit UI
renderWorkout = function(){
  const x=currentWorkout();
  const route=routeModeDescription(settings.routeMode);
  document.getElementById("workout").innerHTML=`
    <section class="card cockpit">
      <div class="cockpit-top">
        <span class="pill ${x.type}">${v6WorkoutTypeLabel? v6WorkoutTypeLabel(x.type) : x.type}</span>
        <span class="pill">${route.title}</span>
        ${isSaturdayLongRun(x)?'<span class="pill accent">Long Run</span>':''}
      </div>
      <div>
        <p class="muted small">Workout Cockpit</p>
        <div class="cue">${x.title}</div>
      </div>
      <div class="timer" id="timerDisplay">--:--</div>
      <div class="progress-bar"><div id="workoutProgress" class="progress-fill"></div></div>
      <p id="workoutMessage" class="cockpit-message">Tap start and keep this screen open during workouts.</p>
      <div class="route-tip">${route.tip}</div>
      <div class="pill-row" style="justify-content:center"><span class="pill"><span id="awakeDot" class="dot"></span> <span id="awakeText">Screen awake not active</span></span></div>
      <div class="cockpit-controls">
        <button class="cockpit-start" onclick="startWorkout()">Start Today's Workout</button>
        <button class="secondary" onclick="skipCurrent()">Skip Current Step</button>
        <button id="pauseButton" class="secondary" onclick="togglePause()">Pause</button>
      </div>
    </section>`;
};

// Replace settings with clearer route mode details while preserving other options
const oldOpenSettingsV8 = openSettings;
openSettings = function(){
  populateVoices();
  let opts=voices.map(v=>`<option value="${v.voiceURI}" ${settings.voiceURI===v.voiceURI?"selected":""}>${v.name} ${v.lang}</option>`).join("");
  showModal(`<h2>Settings</h2><p class="muted" style="margin:8px 0 12px">Voice, route intelligence, adaptive coaching, and workout flow.</p>
  <label class="small muted">Coach Style</label><select id="coachStyle"><option value="trail" ${settings.coachStyle==="trail"?"selected":""}>Trail Guide</option><option value="calm" ${settings.coachStyle==="calm"?"selected":""}>Calm Coach</option><option value="tough" ${settings.coachStyle==="tough"?"selected":""}>Tough Love</option></select>
  <div style="height:10px"></div><label class="small muted">Voice</label><select id="voiceSelect"><option value="">System Default</option>${opts}</select>
  <div style="height:10px"></div><label class="small muted">Voice Speed</label><select id="voiceRate"><option value=".85" ${settings.voiceRate==.85?"selected":""}>Slow</option><option value=".95" ${settings.voiceRate==.95?"selected":""}>Normal</option><option value="1.05" ${settings.voiceRate==1.05?"selected":""}>Brisk</option></select>
  <div style="height:10px"></div><label class="small muted">Run Route Mode</label><select id="routeMode"><option value="outback" ${settings.routeMode==="outback"?"selected":""}>Out & Back: Halfway Turnaround</option><option value="loop" ${settings.routeMode==="loop"?"selected":""}>Loop: Time Remaining Cues</option><option value="treadmill" ${settings.routeMode==="treadmill"?"selected":""}>Treadmill: Posture + Effort Cues</option><option value="trail" ${settings.routeMode==="trail"?"selected":""}>Trail: Terrain Coaching</option></select>
  <div style="height:10px"></div><label><input id="adaptive" type="checkbox" ${settings.adaptive?"checked":""}> Adaptive readiness check</label><br><label><input id="warmup" type="checkbox" ${settings.warmup?"checked":""}> Warmup coaching</label><br><label><input id="cooldown" type="checkbox" ${settings.cooldown?"checked":""}> Cooldown coaching</label><br><label><input id="keepAwake" type="checkbox" ${settings.keepAwake?"checked":""}> Try to keep screen awake</label>
  <div class="detail" style="margin-top:12px"><strong>Route Intelligence</strong><p class="muted">Out & Back gives a turn-around cue. Loop gives time-left cues. Trail gives terrain coaching. Treadmill gives posture and effort cues.</p></div>
  <div style="height:12px"></div><button onclick="saveSettingsFromModal()">Save Settings</button><div style="height:8px"></div><button class="secondary" onclick="testVoice()">Test Voice</button><div style="height:8px"></div><button class="danger" onclick="confirmReset()">Reset Program</button>`);
};

// Replace startRun with smarter route and long-run logic
startRun = async function(x,readiness){
  let total=x.total*60;
  if(readiness==="tired")total=Math.round(total*.8);
  let remaining=total,half=Math.floor(total/2),halfSpoken=false;
  let quarterSpoken=false, fifteenSpoken=false, fiveSpoken=false;
  let phaseName="";
  currentWorkoutSession={active:true,type:"run",startedAt:new Date().toISOString(),routeMode:settings.routeMode,readiness,longRun:isSaturdayLongRun(x),skipped:false};

  setCue("Warmup");
  setWorkoutMessage("Warm up first. This keeps you moving longer.");
  if(settings.warmup)await warmup();
  if(workoutAbort)return;

  const route=routeModeDescription(settings.routeMode);
  await cue(`${route.title} mode. ${route.tip}`);
  if(isSaturdayLongRun(x)){
    await cue("Long run day. First third easy. Middle third steady. Final third proud.");
  }

  await cue(phrase("start"));
  await countdown();

  while(remaining>0 && !workoutAbort){
    if(isSaturdayLongRun(x)){
      const phase=longRunPhase(total,remaining);
      if(phase.name!==phaseName){
        phaseName=phase.name;
        setWorkoutMessage(phase.message);
        await cue(phase.message);
      }
    }

    await runSegment("Run",x.runSeconds,remaining,total);
    if(workoutAbort)return;
    remaining-=x.runSeconds;

    const elapsed=total-remaining;

    if(settings.routeMode==="outback" && !halfSpoken && remaining<=half){
      halfSpoken=true;
      showHalfway();
    }

    if(settings.routeMode==="loop"){
      if(!quarterSpoken && elapsed>=total*.25){quarterSpoken=true;await cue("One quarter complete. Stay smooth.");}
      if(!halfSpoken && elapsed>=total*.50){halfSpoken=true;await cue("Halfway through the workout.");}
      if(!fifteenSpoken && remaining<=900 && total>1200){fifteenSpoken=true;await cue("Fifteen minutes left.");}
      if(!fiveSpoken && remaining<=300){fiveSpoken=true;await cue("Five minutes left. Finish clean.");}
    }

    if(settings.routeMode==="trail" && Math.random()<0.22){
      await cue("Trail reminder. Hike steep climbs and run the smoother ground.");
    }

    if(settings.routeMode==="treadmill" && Math.random()<0.22){
      await cue("Treadmill check. Tall posture, loose shoulders, steady breathing.");
    }

    if(remaining<=0)break;

    await runSegment("Walk",x.walkSeconds,remaining,total);
    if(workoutAbort)return;
    remaining-=x.walkSeconds;

    if(settings.routeMode==="outback" && !halfSpoken && remaining<=half){
      halfSpoken=true;
      showHalfway();
    }
  }

  if(settings.cooldown)await cooldown();
  if(workoutAbort)return;
  finishWorkout();
};

// Replace finishWorkout with fuller reflection flow
finishWorkout = async function(){
  setCue("Complete");
  setTimer("DONE");
  setWorkoutMessage("Workout complete. Good work.");
  await cue(phrase("finish"));
  markComplete(false);
  releaseWakeLock();
  showModal(`<h2>Workout Complete</h2><p class="muted" style="margin:10px 0 18px">${currentWorkout().day} — ${currentWorkout().title}</p><button onclick="hideModal();openReflectionV8()">Reflect</button><div style="height:8px"></div><button onclick="hideModal();nextDay()">Move to Next Day</button><div style="height:8px"></div><button class="secondary" onclick="hideModal()">Stay Here</button>`);
};

function selectChoice(group,value){
  document.querySelectorAll(`[data-choice="${group}"]`).forEach(b=>b.classList.remove("selected"));
  const el=document.querySelector(`[data-choice="${group}"][data-value="${value}"]`);
  if(el)el.classList.add("selected");
  const hidden=document.getElementById(group+"Value");
  if(hidden)hidden.value=value;
}

function openReflectionV8(){
  const x=currentWorkout();
  showModal(`<h2>Workout Reflection</h2><p class="muted" style="margin:8px 0 12px">${x.day} — ${x.title}</p>
  <div class="reflection-grid">
    <div><strong>How did it feel?</strong><div class="choice-grid" style="margin-top:8px">
      ${["Easy","On Target","Hard","Brutal"].map(v=>`<button class="choice-btn" data-choice="feel" data-value="${v}" onclick="selectChoice('feel','${v}')">${v}</button>`).join("")}
    </div><input id="feelValue" type="hidden" value=""></div>
    <div><strong>Any pain?</strong><div class="choice-grid" style="margin-top:8px">
      ${["None","Back","Knees","Calves","Hips","Other"].map(v=>`<button class="choice-btn" data-choice="pain" data-value="${v}" onclick="selectChoice('pain','${v}')">${v}</button>`).join("")}
    </div><input id="painValue" type="hidden" value=""></div>
    <div><strong>Notes</strong><textarea id="note" placeholder="Route, weather, soreness, what felt good, what needs attention..."></textarea></div>
    <button onclick="saveReflectionV8()">Save Reflection</button>
    <button class="secondary" onclick="hideModal()">Skip</button>
  </div>`);
}

function saveReflectionV8(){
  const x=currentWorkout();
  state.journal=state.journal||[];
  state.journal.push({
    date:new Date().toLocaleDateString(),
    iso:new Date().toISOString(),
    workout:`W${state.week} D${state.dayIndex} ${x.title}`,
    type:x.type,
    routeMode:settings.routeMode,
    feel:document.getElementById("feelValue").value||"Not rated",
    pain:document.getElementById("painValue").value||"Not recorded",
    note:document.getElementById("note").value||""
  });
  saveState();
  hideModal();
}

// Upgrade journal rendering to show pain + route mode
renderJournal = function(){
  const entries=(state.journal||[]).slice().reverse();
  document.getElementById("journal").innerHTML=`<section class="card hero"><h2>Journal</h2><button onclick="openReflectionV8()">Add Reflection</button><div class="list">${entries.map(j=>`<div class="row" style="align-items:flex-start"><div><strong>${j.date}</strong><p class="muted small">${j.workout}</p><p style="margin-top:6px"><strong>Feel:</strong> ${j.feel||""} ${j.pain?`• <strong>Pain:</strong> ${j.pain}`:""}</p><p class="muted small">${j.routeMode?`Route: ${j.routeMode}`:""}</p><p class="muted small">${j.note||""}</p></div></div>`).join("")||'<p class="muted">No reflections yet.</p>'}</div></section>`;
};

// Add pain-aware readiness suggestion to Today briefing
const oldOpenTodayBriefingV8 = openTodayBriefing;
openTodayBriefing = function(){
  const x=currentWorkout();
  const recentPain=(state.journal||[]).slice(-3).map(j=>j.pain).filter(p=>p&&p!=="None"&&p!=="Not recorded");
  const warning=recentPain.length?`<div class="timeline-item"><span class="timeline-dot" style="background:var(--danger)"></span><div><strong>Recent Pain Flag</strong><p class="muted small">Recent logs mention: ${[...new Set(recentPain)].join(", ")}. Consider recovery mode if this shows up today.</p></div></div>`:"";
  showModal(`<h2>${x.title}</h2><p class="muted" style="margin:8px 0 12px">${x.day} • ${x.time} • ${x.structure}</p>
  <div class="timeline">
    <div class="timeline-item"><span class="timeline-dot"></span><div><strong>Purpose</strong><p class="muted small">${x.purpose}</p></div></div>
    <div class="timeline-item"><span class="timeline-dot"></span><div><strong>Route Mode</strong><p class="muted small">${routeModeDescription(settings.routeMode).tip}</p></div></div>
    <div class="timeline-item"><span class="timeline-dot"></span><div><strong>Effort</strong><p class="muted small">${x.effort}</p></div></div>
    <div class="timeline-item"><span class="timeline-dot"></span><div><strong>Success Standard</strong><p class="muted small">${x.success}</p></div></div>
    ${warning}
    <div class="timeline-item"><span class="timeline-dot"></span><div><strong>Watch Out</strong><p class="muted small">${x.caution}</p></div></div>
  </div><div style="height:12px"></div><button onclick="hideModal();startWorkout()">Start</button><div style="height:8px"></div><button class="secondary" onclick="hideModal()">Close</button>`);
};


// ---------- V8.1 SAFE BRIEFING FIX ----------
function showTodayBriefing(){
  const x=currentWorkout();
  const route = (typeof routeModeDescription === "function") ? routeModeDescription(settings.routeMode) : {tip:"Use the selected route mode."};
  const recentPain=(state.journal||[]).slice(-3).map(j=>j.pain).filter(p=>p&&p!=="None"&&p!=="Not recorded");
  const warning=recentPain.length
    ? `<div class="timeline-item"><span class="timeline-dot" style="background:var(--danger)"></span><div><strong>Recent Pain Flag</strong><p class="muted small">Recent logs mention: ${[...new Set(recentPain)].join(", ")}. Consider recovery mode if this shows up today.</p></div></div>`
    : "";

  showModal(`<h2>${x.title}</h2>
    <p class="muted" style="margin:8px 0 12px">${x.day} • ${x.time} • ${x.structure}</p>
    <div class="timeline">
      <div class="timeline-item"><span class="timeline-dot"></span><div><strong>Purpose</strong><p class="muted small">${x.purpose||"Complete today's workout with control."}</p></div></div>
      <div class="timeline-item"><span class="timeline-dot"></span><div><strong>Route Mode</strong><p class="muted small">${route.tip}</p></div></div>
      <div class="timeline-item"><span class="timeline-dot"></span><div><strong>Effort</strong><p class="muted small">${x.effort||"Controlled effort."}</p></div></div>
      <div class="timeline-item"><span class="timeline-dot"></span><div><strong>Success Standard</strong><p class="muted small">${x.success||"Finish with good form and discipline."}</p></div></div>
      ${warning}
      <div class="timeline-item"><span class="timeline-dot"></span><div><strong>Watch Out</strong><p class="muted small">${x.caution||"Sharp pain means stop."}</p></div></div>
    </div>
    <div style="height:12px"></div>
    <button onclick="hideModal();startWorkout()">Start</button>
    <div style="height:8px"></div>
    <button class="secondary" onclick="hideModal()">Close</button>`);
}



// ---------- V9 CALENDAR / POSITION ENGINE ----------
// Purpose: keep RUUT from dropping back to Week 1 Day 1, allow fast jumps,
// and auto-advance after a completed workout when enabled.
let lastCompletedSnapshotV9=null;

function ensureV9Settings(){
  if(typeof settings.autoAdvance === "undefined") settings.autoAdvance = true;
  if(typeof settings.calendarAssist === "undefined") settings.calendarAssist = true;
}
ensureV9Settings();

function weekdayIndexFromDate(date=new Date()){
  // JavaScript: Sun=0, Mon=1 ... Sat=6. RUUT: Mon=1 ... Sun=7.
  const js=date.getDay();
  return js===0 ? 7 : js;
}

function dayNameFromIndex(idx){
  return ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][Math.max(1,Math.min(7,idx))-1];
}

function setProgramPosition(week,dayIndex){
  state.week=Math.max(1,Math.min(12,parseInt(week,10)||1));
  state.dayIndex=Math.max(1,Math.min(7,parseInt(dayIndex,10)||1));
  saveState();
}

function jumpProgramDays(days){
  let n=parseInt(days,10)||0;
  while(n>0){
    state.dayIndex++;
    if(state.dayIndex>7){state.dayIndex=1;state.week++;}
    if(state.week>12){state.week=12;state.dayIndex=7;break;}
    n--;
  }
  saveState();
}

function openSetPosition(){
  ensureV9Settings();
  const weekOptions=Array.from({length:12},(_,i)=>`<option value="${i+1}" ${state.week===i+1?'selected':''}>Week ${i+1}</option>`).join("");
  const dayOptions=[1,2,3,4,5,6,7].map(i=>`<option value="${i}" ${state.dayIndex===i?'selected':''}>Day ${i} - ${dayNameFromIndex(i)}</option>`).join("");
  const todayIdx=weekdayIndexFromDate();
  showModal(`<h2>Set Current Position</h2>
    <p class="muted" style="margin:8px 0 12px">Use this after a reset, reinstall, or if you need to jump ahead. This will not erase your journal or completed history.</p>
    <label class="small muted">Current Week</label><select id="positionWeek">${weekOptions}</select>
    <div style="height:10px"></div>
    <label class="small muted">Current Day</label><select id="positionDay">${dayOptions}</select>
    <div style="height:12px"></div>
    <button onclick="saveProgramPositionFromModal()">Set Position</button>
    <div style="height:8px"></div>
    <button class="secondary" onclick="setPositionToTodayWeekday()">Set Day to Today (${dayNameFromIndex(todayIdx)})</button>
    <div style="height:8px"></div>
    <div class="grid two"><button class="secondary" onclick="jumpProgramDays(1);hideModal();">Jump +1 Day</button><button class="secondary" onclick="jumpProgramDays(7);hideModal();">Jump +1 Week</button></div>
    <div style="height:8px"></div>
    <button class="secondary" onclick="hideModal()">Cancel</button>`);
}

function saveProgramPositionFromModal(){
  const w=document.getElementById('positionWeek').value;
  const d=document.getElementById('positionDay').value;
  setProgramPosition(w,d);
  hideModal();
}

function setPositionToTodayWeekday(){
  const week=document.getElementById('positionWeek').value;
  setProgramPosition(week,weekdayIndexFromDate());
  hideModal();
}

// Settings override with Auto-Advance and Set Position controls.
openSettings = function(){
  ensureV9Settings();
  populateVoices();
  let opts=voices.map(v=>`<option value="${v.voiceURI}" ${settings.voiceURI===v.voiceURI?"selected":""}>${v.name} ${v.lang}</option>`).join("");
  showModal(`<h2>Settings</h2><p class="muted" style="margin:8px 0 12px">Voice, route intelligence, adaptive coaching, workout flow, and current program position.</p>
  <div class="detail"><strong>Current Position</strong><p class="muted">Week ${state.week}, Day ${state.dayIndex} - ${dayNameFromIndex(state.dayIndex)}</p><button class="secondary" onclick="openSetPosition()">Set Current Position</button></div>
  <div style="height:12px"></div>
  <label class="small muted">Coach Style</label><select id="coachStyle"><option value="trail" ${settings.coachStyle==="trail"?"selected":""}>Trail Guide</option><option value="calm" ${settings.coachStyle==="calm"?"selected":""}>Calm Coach</option><option value="tough" ${settings.coachStyle==="tough"?"selected":""}>Tough Love</option></select>
  <div style="height:10px"></div><label class="small muted">Voice</label><select id="voiceSelect"><option value="">System Default</option>${opts}</select>
  <div style="height:10px"></div><label class="small muted">Voice Speed</label><select id="voiceRate"><option value=".85" ${settings.voiceRate==.85?"selected":""}>Slow</option><option value=".95" ${settings.voiceRate==.95?"selected":""}>Normal</option><option value="1.05" ${settings.voiceRate==1.05?"selected":""}>Brisk</option></select>
  <div style="height:10px"></div><label class="small muted">Run Route Mode</label><select id="routeMode"><option value="outback" ${settings.routeMode==="outback"?"selected":""}>Out & Back: Halfway Turnaround</option><option value="loop" ${settings.routeMode==="loop"?"selected":""}>Loop: Time Remaining Cues</option><option value="treadmill" ${settings.routeMode==="treadmill"?"selected":""}>Treadmill: Posture + Effort Cues</option><option value="trail" ${settings.routeMode==="trail"?"selected":""}>Trail: Terrain Coaching</option></select>
  <div style="height:10px"></div><label><input id="adaptive" type="checkbox" ${settings.adaptive?"checked":""}> Adaptive readiness check</label><br><label><input id="warmup" type="checkbox" ${settings.warmup?"checked":""}> Warmup coaching</label><br><label><input id="cooldown" type="checkbox" ${settings.cooldown?"checked":""}> Cooldown coaching</label><br><label><input id="keepAwake" type="checkbox" ${settings.keepAwake?"checked":""}> Try to keep screen awake</label><br><label><input id="autoAdvance" type="checkbox" ${settings.autoAdvance!==false?"checked":""}> Auto-advance after completed workout</label><br><label><input id="calendarAssist" type="checkbox" ${settings.calendarAssist!==false?"checked":""}> Show calendar weekday helper</label>
  <div class="detail" style="margin-top:12px"><strong>Reset Protection</strong><p class="muted">If the app ever resets, open Settings → Set Current Position and jump straight back to Week 3 or wherever you left off.</p></div>
  <div style="height:12px"></div><button onclick="saveSettingsFromModal()">Save Settings</button><div style="height:8px"></div><button class="secondary" onclick="testVoice()">Test Voice</button><div style="height:8px"></div><button class="danger" onclick="confirmReset()">Reset Program</button>`);
};

saveSettingsFromModal = function(){
  ensureV9Settings();
  settings.coachStyle=document.getElementById("coachStyle").value;
  settings.voiceURI=document.getElementById("voiceSelect").value;
  settings.voiceRate=parseFloat(document.getElementById("voiceRate").value);
  settings.routeMode=document.getElementById("routeMode").value;
  settings.adaptive=document.getElementById("adaptive").checked;
  settings.warmup=document.getElementById("warmup").checked;
  settings.cooldown=document.getElementById("cooldown").checked;
  settings.keepAwake=document.getElementById("keepAwake").checked;
  settings.autoAdvance=document.getElementById("autoAdvance").checked;
  settings.calendarAssist=document.getElementById("calendarAssist").checked;
  saveSettings();
  speak("Settings saved. Ready when you are.");
};

// Today override with calendar helper + Set Position shortcut.
const renderTodayBeforeV9 = renderToday;
renderToday = function(){
  ensureV9Settings();
  renderTodayBeforeV9();
  const host=document.getElementById("today");
  if(!host) return;
  const x=currentWorkout();
  const todayIdx=weekdayIndexFromDate();
  const todayName=dayNameFromIndex(todayIdx);
  const aligned=todayIdx===state.dayIndex;
  if(settings.calendarAssist!==false){
    const helper=document.createElement("section");
    helper.className="card hero";
    helper.innerHTML=`<h3>Calendar Helper</h3><p class="muted">Today is ${todayName}. RUUT is currently set to Week ${state.week}, Day ${state.dayIndex} - ${x.day}. ${aligned?"You are aligned with today's weekday.":"If this is wrong, set RUUT to today's weekday."}</p><div class="grid two"><button class="secondary" onclick="openSetPosition()">Set Position</button><button class="secondary" onclick="setProgramPosition(state.week, weekdayIndexFromDate())">Use Today's Day</button></div>`;
    host.appendChild(helper);
  }
};

// Finish override: mark complete, optionally auto-advance, but preserve completed-workout reflection context.
finishWorkout = async function(){
  const finishedWorkout=currentWorkout();
  const finishedSnapshot={
    week:state.week,
    dayIndex:state.dayIndex,
    day:finishedWorkout.day,
    title:finishedWorkout.title,
    type:finishedWorkout.type,
    routeMode:settings.routeMode,
    key:currentKey(),
    date:new Date().toLocaleDateString(),
    iso:new Date().toISOString()
  };
  lastCompletedSnapshotV9=finishedSnapshot;
  const alreadyComplete=isComplete();

  setCue("Complete");
  setTimer("DONE");
  setWorkoutMessage("Workout complete. Good work.");
  await cue(phrase("finish"));
  markComplete(false);
  releaseWakeLock();

  let advanced=false;
  if(settings.autoAdvance!==false && !alreadyComplete){
    nextDay();
    advanced=true;
  }

  showModal(`<h2>Workout Complete</h2><p class="muted" style="margin:10px 0 18px">Completed: Week ${finishedSnapshot.week}, Day ${finishedSnapshot.dayIndex} - ${finishedSnapshot.title}</p>${advanced?`<div class="detail"><strong>Auto-Advanced</strong><p class="muted">RUUT is now set to Week ${state.week}, Day ${state.dayIndex} - ${currentWorkout().day}.</p></div><div style="height:10px"></div>`:""}<button onclick="hideModal();openReflectionV9()">Reflect</button><div style="height:8px"></div><button class="secondary" onclick="hideModal()">Done</button>`);
};

function openReflectionV9(){
  const snap=lastCompletedSnapshotV9 || {week:state.week,dayIndex:state.dayIndex,day:currentWorkout().day,title:currentWorkout().title,type:currentWorkout().type,routeMode:settings.routeMode,date:new Date().toLocaleDateString(),iso:new Date().toISOString()};
  showModal(`<h2>Workout Reflection</h2><p class="muted" style="margin:8px 0 12px">Week ${snap.week}, Day ${snap.dayIndex} - ${snap.title}</p>
  <div class="reflection-grid">
    <div><strong>How did it feel?</strong><div class="choice-grid" style="margin-top:8px">
      ${["Easy","On Target","Hard","Brutal"].map(v=>`<button class="choice-btn" data-choice="feel" data-value="${v}" onclick="selectChoice('feel','${v}')">${v}</button>`).join("")}
    </div><input id="feelValue" type="hidden" value=""></div>
    <div><strong>Any pain?</strong><div class="choice-grid" style="margin-top:8px">
      ${["None","Back","Knees","Calves","Hips","Other"].map(v=>`<button class="choice-btn" data-choice="pain" data-value="${v}" onclick="selectChoice('pain','${v}')">${v}</button>`).join("")}
    </div><input id="painValue" type="hidden" value=""></div>
    <div><strong>Notes</strong><textarea id="note" placeholder="Route, weather, soreness, what felt good, what needs attention..."></textarea></div>
    <button onclick="saveReflectionV9()">Save Reflection</button>
    <button class="secondary" onclick="hideModal()">Skip</button>
  </div>`);
}

function saveReflectionV9(){
  const snap=lastCompletedSnapshotV9 || {week:state.week,dayIndex:state.dayIndex,day:currentWorkout().day,title:currentWorkout().title,type:currentWorkout().type,routeMode:settings.routeMode,date:new Date().toLocaleDateString(),iso:new Date().toISOString()};
  state.journal=state.journal||[];
  state.journal.push({
    date:snap.date,
    iso:snap.iso,
    workout:`W${snap.week} D${snap.dayIndex} ${snap.title}`,
    type:snap.type,
    routeMode:snap.routeMode,
    feel:document.getElementById("feelValue").value||"Not rated",
    pain:document.getElementById("painValue").value||"Not recorded",
    note:document.getElementById("note").value||""
  });
  saveState();
  hideModal();
}

// Route older reflection buttons to the new reflection system.
openReflectionV8 = openReflectionV9;



// ---------- V9.1: HUMAN COACHING + TRANSITION COUNTDOWNS ----------
const V91_COACH = {
  trail: {
    runStart:["Ease into the run. Light feet. Find the rhythm.","Start running. Smooth stride, quiet shoulders.","Run now. Let the pace come to you."],
    walkStart:["Walk now. Let the breathing settle.","Recovery walk. Stay tall and keep moving.","Walk it out. Deep breath, loose hands."],
    transitionRun:["Run starts in five. Get ready to move.","Five seconds to run. Set your posture.","Run coming up. Tall chest, easy feet."],
    transitionWalk:["Walk break in five. Finish this piece clean.","Five seconds to walk. Stay smooth to the line.","Walk coming up. Control the change."],
    strengthNext:["Next movement: {name}. Set your position.","Coming up: {name}. Clean reps only.","Next: {name}. Move with control."],
    longFirst:["First third. Keep it easy. You are buying the finish right now."],
    longMiddle:["Middle third. Settle in. Smooth, patient, steady."],
    longFinal:["Final third. Stay calm. Bring it home with discipline."],
    routeTrail:["Trail reminder. Hike steep climbs. Run the smooth ground."],
    routeTreadmill:["Treadmill check. Tall posture. Loose shoulders. Quiet breathing."],
    finish:["Good work. That was an honest effort.","Finished. Log it and carry the win forward."]
  },
  tough: {
    runStart:["Run now. No drifting. Do the work.","Move. Strong, controlled, disciplined.","Run. Keep your form. Keep your promise."],
    walkStart:["Walk. Recover, don't quit.","Walk now. Breathe and get ready for the next rep.","Recovery. Use it. You're not done."],
    transitionRun:["Five seconds. Get ready to work.","Run starts in five. Lock in.","Five seconds to run. No excuses."],
    transitionWalk:["Walk break in five. Finish strong.","Five seconds. Hold the line.","Walk coming. Earn it to the bell."],
    strengthNext:["Next: {name}. No sloppy reps.","{name} next. Make them count.","Set up for {name}. Discipline over speed."],
    longFirst:["First third. Stay controlled. Don't burn matches."],
    longMiddle:["Middle third. This is where discipline matters."],
    longFinal:["Final third. Finish the job."],
    routeTrail:["Trail rule. Hike the steep stuff. Attack the runnable ground."],
    routeTreadmill:["Treadmill check. Stand tall. Don't get lazy."],
    finish:["Done. That's discipline.","Workout complete. You did the work."]
  },
  calm: {
    runStart:["Begin running. Smooth breathing, relaxed shoulders.","Start running. Keep the effort calm and controlled.","Run now. Easy rhythm."],
    walkStart:["Walk now. Let your breath come back.","Recover here. Calm and steady.","Walk and reset."],
    transitionRun:["Run begins in five. Prepare gently.","Five seconds to run. Stay relaxed.","Running soon. Smooth and easy."],
    transitionWalk:["Walk begins in five. Ease into recovery.","Five seconds to walk. Stay controlled.","Recovery is coming. Finish calmly."],
    strengthNext:["Next movement: {name}. Take your time.","Prepare for {name}. Good form first.","{name} next. Smooth and steady."],
    longFirst:["First third. Keep the effort very easy."],
    longMiddle:["Middle third. Settle into your rhythm."],
    longFinal:["Final third. Stay composed and finish well."],
    routeTrail:["Trail reminder. Move with the terrain, not against it."],
    routeTreadmill:["Treadmill check. Gentle posture, steady breath."],
    finish:["Workout complete. Well done.","Finished. Good steady work today."]
  }
};

function v91Pack(){ return V91_COACH[settings.coachStyle] || V91_COACH.trail; }
function v91Pick(key){ const a=v91Pack()[key] || V91_COACH.trail[key] || [""]; return a[Math.floor(Math.random()*a.length)]; }
function v91Template(s,o){ return String(s).replace(/\{(\w+)\}/g,(_,k)=>o[k]??""); }

async function transitionCountdownV91(kind,label){
  if(settings.transitionCountdown===false) return;
  const isRun=kind==="run";
  const isWalk=kind==="walk";
  setCue(isRun?"Run Next":isWalk?"Walk Next":"Next");
  setWorkoutMessage(isRun?"Get ready to run.":isWalk?"Get ready to walk.":`Next movement: ${label||"next"}`);
  for(let n=5;n>=1;n--){
    if(workoutAbort || skipCurrentTimer) return;
    setTimer(String(n));
    await new Promise(r=>setTimeout(r,1000));
  }
}

async function runSegmentV91(label,seconds,remaining,total){
  const isRun=label==="Run";
  await transitionCountdownV91(isRun?"run":"walk",label);
  if(workoutAbort) return;
  setCue(label.toUpperCase());
  const msg=isRun?"Run segment active. Smooth is fast. Stay controlled.":"Walk segment active. Recover, breathe, keep moving.";
  setWorkoutMessage(msg);
  await cue(isRun?v91Pick("runStart"):v91Pick("walkStart"));
  await timer(seconds,remaining,total);
}

startRun = async function(x,readiness){
  let total=x.total*60;
  if(readiness==="tired") total=Math.round(total*.8);
  let remaining=total, half=Math.floor(total/2), halfSpoken=false;
  let quarterSpoken=false, fifteenSpoken=false, fiveSpoken=false;
  let phaseName="";

  currentWorkoutSession={active:true,type:"run",startedAt:new Date().toISOString(),routeMode:settings.routeMode,readiness,longRun:isSaturdayLongRun(x),skipped:false};
  setCue("Warmup");
  setWorkoutMessage("Warm up first. This keeps you moving longer.");
  if(settings.warmup) await warmup();
  if(workoutAbort) return;
  if(!settings.warmup){ setCue("Ready"); setWorkoutMessage("Starting workout now."); }

  const route=routeModeDescription(settings.routeMode);
  await cue(`${route.title} mode. ${route.tip}`);
  if(isSaturdayLongRun(x)) await cue("Long run day. First third easy. Middle third steady. Final third proud.");

  await cue(v91Pick("runStart"));

  while(remaining>0 && !workoutAbort){
    if(isSaturdayLongRun(x)){
      const phase=longRunPhase(total,remaining);
      if(phase.name!==phaseName){
        phaseName=phase.name;
        const pmsg=phase.name==="First Third"?v91Pick("longFirst"):phase.name==="Middle Third"?v91Pick("longMiddle"):v91Pick("longFinal");
        setWorkoutMessage(pmsg);
        await cue(pmsg);
      }
    }

    await runSegmentV91("Run",x.runSeconds,remaining,total);
    if(workoutAbort) return;
    remaining-=x.runSeconds;
    const elapsed=total-remaining;

    if(settings.routeMode==="outback" && !halfSpoken && remaining<=half){ halfSpoken=true; showHalfway(); }
    if(settings.routeMode==="loop"){
      if(!quarterSpoken && elapsed>=total*.25){quarterSpoken=true;await cue("One quarter complete. Stay smooth.");}
      if(!halfSpoken && elapsed>=total*.50){halfSpoken=true;await cue("Halfway through the workout.");}
      if(!fifteenSpoken && remaining<=900 && total>1200){fifteenSpoken=true;await cue("Fifteen minutes left.");}
      if(!fiveSpoken && remaining<=300){fiveSpoken=true;await cue("Five minutes left. Finish clean.");}
    }
    if(settings.routeMode==="trail" && Math.random()<0.22) await cue(v91Pick("routeTrail"));
    if(settings.routeMode==="treadmill" && Math.random()<0.22) await cue(v91Pick("routeTreadmill"));
    if(remaining<=0) break;

    await runSegmentV91("Walk",x.walkSeconds,remaining,total);
    if(workoutAbort) return;
    remaining-=x.walkSeconds;
    if(settings.routeMode==="outback" && !halfSpoken && remaining<=half){ halfSpoken=true; showHalfway(); }
  }
  if(settings.cooldown) await cooldown();
  if(workoutAbort) return;
  finishWorkout();
};

startStrength = async function(x,readiness){
  setCue("Warmup");
  if(settings.warmup) await warmup();
  if(workoutAbort) return;
  let rounds=x.rounds;
  if(readiness==="tired") rounds=Math.max(1,rounds-1);
  await cue(`Starting bodyweight workout. ${rounds} rounds. Clean reps over speed.`);
  await sleep(500);
  for(let r=1;r<=rounds && !workoutAbort;r++){
    setCue(`Round ${r}`);
    await cue(template(phrase("round"),{n:r,t:rounds}));
    for(const e of x.exercises){
      if(workoutAbort) return;
      await transitionCountdownV91("strength",e.name);
      if(workoutAbort) return;
      setCue(e.name);
      if(e.mode==="timed"){
        setWorkoutMessage(`${e.name}. ${e.seconds} seconds. Brace and breathe.`);
        await cue(v91Template(v91Pick("strengthNext"),{name:e.name}));
        await cue(template(phrase("timed"),{name:e.name,seconds:e.seconds}));
        await timer(e.seconds,e.seconds,e.seconds);
        if(workoutAbort) return;
        await cue(`${e.name} complete.`);
      }else{
        setTimer("DONE?");
        setWorkoutMessage(`${e.name}. ${e.reps}. Tap Done when finished.`);
        await cue(v91Template(v91Pick("strengthNext"),{name:e.name}));
        await cue(template(phrase("rep"),{name:e.name,reps:e.reps}));
        await waitForDone(e.name,e.reps);
        if(workoutAbort) return;
      }
    }
  }
  if(settings.cooldown) await cooldown();
  if(workoutAbort) return;
  finishWorkout();
};

// Make finish sound a little more human while keeping v9 auto-advance/reflection behavior.
const finishWorkoutV9Base = finishWorkout;
finishWorkout = async function(){
  await cue(v91Pick("finish"));
  return finishWorkoutV9Base();
};


// ---------- V9.2: MORE DISTINCT HUMAN COACHING LANGUAGE ----------
const V92_COACH = {
  trail: {
    identity:"Trail Guide",
    start:["Trail Guide is on. Start easy, breathe through the nose if you can, and let the body wake up.","This is Trail Guide mode. Smooth first, strong later. Settle into the road.","Trail Guide here. No rush. Find the rhythm and let the workout come to you."],
    runStart:["Run now. Light feet, quiet shoulders, eyes up. Let the pace come naturally.","Ease into the run. Think smooth stride, calm breath, soft landing.","Start running. Float through the first part. Stay patient and clean."],
    walkStart:["Walk now. Let the breathing drop. Shake the arms loose and stay tall.","Recovery walk. Keep moving, loosen the hands, bring the breath back down.","Walk it out. Deep breath in, long breath out. You're resetting for the next push."],
    transitionRun:["Run starts in five. Stand tall, quick feet, smooth first steps.","Five seconds to run. Eyes up, shoulders loose, feet light.","Run coming up. Settle your posture and move with the terrain."],
    transitionWalk:["Walk break in five. Finish this section clean and controlled.","Five seconds to walk. Stay smooth to the line, then recover.","Walk coming up. No collapse. Ease down with control."],
    strengthNext:["Next movement is {name}. Set your stance, breathe, and make the reps clean.","Coming up: {name}. Smooth form, steady tempo, no sloppy reps.","Next: {name}. Own the setup before you start moving."],
    longFirst:["First third of the long run. This should feel almost too easy. You are buying the finish right now."],
    longMiddle:["Middle third. Settle in. This is steady patience, not a race."],
    longFinal:["Final third. Stay calm. Bring it home with clean form and a proud finish."],
    routeTrail:["Trail reminder. Hike the steep climbs, run the smooth ground, and protect your legs on descents."],
    routeTreadmill:["Treadmill check. Stand tall, relax your jaw, keep the stride quiet."],
    finish:["Good work. That was honest training. Log it and carry the win forward.","Finished. Another solid brick in the wall.","Workout complete. You kept your word today."]
  },
  tough: {
    identity:"Tough Love",
    start:["Tough Love is on. No negotiating with the workout. Start controlled and finish what you came to do.","This is the work. No drama, no shortcuts. Start moving.","Tough Love mode. You don't need perfect. You need honest effort."],
    runStart:["Run now. No drifting. Keep your form and do the work.","Move. Strong, controlled, disciplined. Stay in it.","Run. Quiet the excuses. Control the breathing. Keep your promise."],
    walkStart:["Walk. Recover, don't quit. Use this break like an athlete.","Walk now. Breathe, reset, and get ready to go again.","Recovery. You earned it, but you are not done."],
    transitionRun:["Five seconds. Get ready to work. Tall chest, strong mind.","Run starts in five. Lock in. No sloppy first steps.","Five seconds to run. Don't think about it. Move."],
    transitionWalk:["Walk break in five. Finish this piece strong.","Five seconds. Hold the line until the break.","Walk coming. Earn it to the bell."],
    strengthNext:["Next: {name}. No sloppy reps. Make every rep count.","{name} next. Set your body and do it right.","Set up for {name}. Discipline over speed."],
    longFirst:["First third. Stay controlled. Don't burn matches like a rookie."],
    longMiddle:["Middle third. This is where discipline matters. Stay steady."],
    longFinal:["Final third. Finish the job. Strong mind, clean form."],
    routeTrail:["Trail rule. Hike the steep stuff and attack the runnable ground with control."],
    routeTreadmill:["Treadmill check. Stand tall. Don't get lazy just because the belt is moving."],
    finish:["Done. That's discipline.","Workout complete. You did the work.","Finished. Stack the win and move on."]
  },
  calm: {
    identity:"Calm Coach",
    start:["Calm Coach is on. Begin gently. Smooth breath, steady body, quiet mind.","Start with control. You are not chasing. You are building.","Calm Coach mode. Easy first. Let the nervous system settle."],
    runStart:["Begin running. Smooth breathing, relaxed shoulders, steady effort.","Start running. Keep it calm, controlled, and sustainable.","Run now. Easy rhythm, soft feet, patient pace."],
    walkStart:["Walk now. Let your breath come back down.","Recover here. Calm and steady. No rush.","Walk and reset. Long exhale, loose shoulders."],
    transitionRun:["Run begins in five. Prepare gently and stay relaxed.","Five seconds to run. Keep the first steps easy.","Running soon. Smooth and patient."],
    transitionWalk:["Walk begins in five. Ease into recovery.","Five seconds to walk. Stay composed to the end.","Recovery is coming. Finish calmly."],
    strengthNext:["Next movement: {name}. Take your time and move well.","Prepare for {name}. Good form first.","{name} next. Smooth and steady."],
    longFirst:["First third. Keep the effort very easy. You should feel held back."],
    longMiddle:["Middle third. Settle into your rhythm and conserve energy."],
    longFinal:["Final third. Stay composed and finish well."],
    routeTrail:["Trail reminder. Move with the terrain, not against it."],
    routeTreadmill:["Treadmill check. Gentle posture, steady breath, quiet stride."],
    finish:["Workout complete. Well done.","Finished. Good steady work today.","Done. You trained with control."]
  }
};

function v92Pick(key){
  const pack = V92_COACH[settings.coachStyle] || V92_COACH.trail;
  const arr = pack[key] || V92_COACH.trail[key] || [""];
  return arr[Math.floor(Math.random()*arr.length)];
}

function v92Template(s,o){
  return String(s).replace(/\{(\w+)\}/g,(_,k)=>o[k]??"");
}

// Override the v9.1 picker so all existing workout logic gets stronger language.
function v91Pick(key){ return v92Pick(key); }
function v91Template(s,o){ return v92Template(s,o); }

// Make startup and warmup noticeably more conversational.
const warmupBaseV92 = warmup;
warmup = async function(){
  if(!settings.warmup) return;
  const style = (V92_COACH[settings.coachStyle] || V92_COACH.trail).identity;
  await cue(`${style} loaded. Warmup starts now. March easy, loosen the hips, and wake up the ankles. Tap skip current step if you want to move ahead.`);
  setTimer("2:00");
  setWorkoutMessage(`${style} loaded. Warmup: march, loosen hips, wake up ankles. Tap Skip Current Step to move ahead.`);
  await timer(120,120,120);
};

const cooldownBaseV92 = cooldown;
cooldown = async function(){
  await cue("Cooldown starts now. Walk easy, bring the heart rate down, and let the body know the hard work is finished.");
  setCue("Cooldown");
  setWorkoutMessage("Cooldown: easy walk, breathe down, then stretch. Tap Skip Current Step to finish.");
  await timer(180,180,180);
};

// Make the test voice prove the style changed.
testVoice = function(){
  saveSettingsFromModal();
  const style = (V92_COACH[settings.coachStyle] || V92_COACH.trail).identity;
  cue(`${style} selected. This voice will still use the iPhone browser voice, but the coaching language is now more distinct.`);
};



// ---------- V9.3 WORKOUT COCKPIT POLISH ----------
const V93_COCKPIT_CSS = `
<style id="v93-cockpit-style">
.cockpit{
  min-height:calc(100vh - 130px)!important;
  display:flex!important;
  flex-direction:column!important;
  justify-content:center!important;
  gap:18px!important;
}
.cockpit .timer{
  font-size:110px!important;
  line-height:.9!important;
  letter-spacing:-4px!important;
  font-weight:900!important;
  text-shadow:0 10px 40px rgba(0,0,0,.45)!important;
}
.cockpit .cue{
  font-size:44px!important;
  font-weight:800!important;
}
.cockpit-message{
  font-size:18px!important;
  line-height:1.4!important;
  min-height:60px!important;
}
.v93-stage{
  border-radius:20px;
  border:1px solid rgba(255,255,255,.08);
  background:rgba(255,255,255,.04);
  padding:14px;
}
.v93-pulse{
  animation:v93pulse 1.2s ease-in-out infinite alternate;
}
@keyframes v93pulse{
  from{transform:scale(1)}
  to{transform:scale(1.03)}
}
.v93-countdown{
  font-size:72px;
  font-weight:900;
  opacity:.95;
}
.v93-mini{
  font-size:13px;
  opacity:.7;
  letter-spacing:1px;
  text-transform:uppercase;
}
</style>
`;

(function installV93Style(){
  if(!document.getElementById("v93-cockpit-style")){
    document.head.insertAdjacentHTML("beforeend",V93_COCKPIT_CSS);
  }
})();

function v93FlashCue(textCue,textMsg){
  setCue(textCue);
  setWorkoutMessage(textMsg);
  const el=document.getElementById("timerDisplay");
  if(el){
    el.classList.remove("v93-pulse");
    void el.offsetWidth;
    el.classList.add("v93-pulse");
  }
}

const renderWorkoutV93Base = renderWorkout;
renderWorkout = function(){
  renderWorkoutV93Base();
  const workout=document.getElementById("workout");
  if(workout){
    const cockpit=workout.querySelector(".cockpit");
    if(cockpit){
      cockpit.insertAdjacentHTML("afterbegin",`
        <div class="v93-stage">
          <div class="v93-mini">Workout Cockpit Active</div>
          <div class="progress-bar">
            <div id="v93Intensity" class="progress-fill" style="width:0%"></div>
          </div>
        </div>
      `);
    }
  }
};

const timerV93Base = timer;
timer = async function(seconds,remaining,total){
  const intensity=document.getElementById("v93Intensity");
  if(intensity && total){
    const pct=Math.max(0,Math.min(100,((total-remaining)/total)*100));
    intensity.style.width=pct+"%";
  }
  return timerV93Base(seconds,remaining,total);
};

const transitionCountdownV93Base = transitionCountdownV91;
transitionCountdownV91 = async function(kind,label){
  if(settings.transitionCountdown===false) return;

  const isRun=kind==="run";
  const isWalk=kind==="walk";
  const title=isRun?"RUN":isWalk?"WALK":"NEXT";
  const detail=isRun
    ?"Get ready to run."
    :isWalk
      ?"Get ready to walk."
      :`Next movement: ${label}`;

  v93FlashCue(title,detail);

  for(let n=5;n>=1;n--){
    if(workoutAbort || skipCurrentTimer) return;
    setTimer(String(n));
    const td=document.getElementById("timerDisplay");
    if(td) td.classList.add("v93-countdown");

    try{
      if(navigator.vibrate && n<=3) navigator.vibrate(80);
    }catch(e){}

    // Visual countdown only. No spoken countdown numbers.
    await new Promise(r=>setTimeout(r,1000));
  }

  const td=document.getElementById("timerDisplay");
  if(td) td.classList.remove("v93-countdown");
};

const runSegmentV93Base = runSegmentV91;
runSegmentV91 = async function(label,seconds,remaining,total){
  const isRun=label==="Run";
  const nextKind=isRun?"walk":"run";

  v93FlashCue(
    isRun?"RUN":"RECOVER",
    isRun
      ?"Smooth stride. Relax the jaw and shoulders."
      :"Control your breathing and stay moving."
  );

  setCue(label.toUpperCase());
  setWorkoutMessage(
    isRun
      ?"Smooth stride. Relax the jaw and shoulders."
      :"Control your breathing and stay moving."
  );

  await cue(isRun?v91Pick("runStart"):v91Pick("walkStart"));
  if(workoutAbort) return;

  const leadIn=5;
  if(seconds>leadIn){
    await timer(seconds-leadIn,remaining,total);
    if(workoutAbort) return;
    await transitionCountdownV91(nextKind,nextKind==="run"?"Run":"Walk");
    return;
  }

  return timer(seconds,remaining,total);
};

const waitForDoneV93Base = waitForDone;
waitForDone = function(name,reps){
  v93FlashCue(name.toUpperCase(),`${reps} reps. Quality over speed.`);
  return waitForDoneV93Base(name,reps);
};


// ---------- V9.3.5: REMOVE TRANSITION COUNTDOWNS ENTIRELY ----------
// No visual countdown. No vocal countdown. Segment timers remain exact.
// The app now speaks only the action cue at the actual transition.
transitionCountdownV91 = async function(kind,label){
  return;
};

runSegmentV91 = async function(label,seconds,remaining,total){
  const isRun=label==="Run";

  setCue(label.toUpperCase());
  setWorkoutMessage(
    isRun
      ? "Run now. Smooth stride. Stay controlled."
      : "Walk now. Recover and keep moving."
  );

  await cue(isRun ? v91Pick("runStart") : v91Pick("walkStart"));
  if(workoutAbort) return;

  return timer(seconds,remaining,total);
};

// Keep the initial start clean too.
countdown = async function(){
  setTimer("GO");
  setWorkoutMessage("Starting workout.");
  await cue("Go.");
  await sleep(250);
};


// ---------- V9.4 RECOVERY INTELLIGENCE ----------
function recentJournalEntries(limit=6){
  return (state.journal||[]).slice(-limit);
}

function fatigueTrend(){
  const recent = recentJournalEntries();
  let hard=0, brutal=0, pain=0, skipped=0;

  for(const j of recent){
    const feel=(j.feel||"").toLowerCase();
    const p=(j.pain||"").toLowerCase();

    if(feel.includes("hard")) hard++;
    if(feel.includes("brutal")) brutal++;
    if(p && p!=="none" && p!=="not recorded") pain++;
    if((j.note||"").toLowerCase().includes("skip")) skipped++;
  }

  return {
    hard,
    brutal,
    pain,
    skipped,
    score:(hard*1)+(brutal*2)+(pain*2)+(skipped*1)
  };
}

function recoveryRecommendation(){
  const f=fatigueTrend();

  if(f.score>=7){
    return {
      level:"high",
      title:"Recovery Recommended",
      message:"Recent fatigue or pain trend detected. Consider Recovery Mode or Flexibility instead of pushing intensity today."
    };
  }

  if(f.score>=4){
    return {
      level:"moderate",
      title:"Ease Back Slightly",
      message:"Recent fatigue trend detected. Reduce intensity slightly and focus on smooth movement."
    };
  }

  return {
    level:"good",
    title:"Recovered",
    message:"Recovery trend looks good. Continue training normally."
  };
}

function applyAdaptiveReduction(workout){
  const rec=recoveryRecommendation();

  if(rec.level==="high"){
    if(workout.type==="strength"){
      workout.rounds=Math.max(1,(workout.rounds||2)-1);
    }

    if(workout.type==="run"){
      workout.total=Math.max(10,Math.round(workout.total*0.8));
    }
  }

  if(rec.level==="moderate"){
    if(workout.type==="strength"){
      workout.rounds=Math.max(1,(workout.rounds||2)-0);
    }

    if(workout.type==="run"){
      workout.total=Math.max(10,Math.round(workout.total*0.9));
    }
  }

  return workout;
}

const currentWorkoutV94Base=currentWorkout;
currentWorkout=function(){
  const w=structuredClone(currentWorkoutV94Base());
  return applyAdaptiveReduction(w);
};

const renderTodayV94Base=renderToday;
renderToday=function(){
  renderTodayV94Base();

  const rec=recoveryRecommendation();
  const today=document.getElementById("today");

  if(today){
    const color=
      rec.level==="high"
        ?"var(--danger)"
        :rec.level==="moderate"
          ?"orange"
          :"var(--success)";

    const html=`
      <div class="card" style="border-left:4px solid ${color};margin-bottom:14px">
        <div class="small" style="opacity:.7;letter-spacing:1px;text-transform:uppercase">
          Recovery Intelligence
        </div>
        <h3 style="margin:6px 0">${rec.title}</h3>
        <p class="muted">${rec.message}</p>
      </div>
    `;

    today.insertAdjacentHTML("afterbegin",html);
  }
};

const openReflectionV94Base=openReflectionV9;
openReflectionV9=function(){
  openReflectionV94Base();

  setTimeout(()=>{
    const modal=document.querySelector(".modal-content");
    if(modal){
      modal.insertAdjacentHTML("beforeend",`
        <div class="card" style="margin-top:16px">
          <strong>Recovery Note</strong>
          <p class="muted small">
            RUUT now tracks fatigue trends and may automatically reduce workload or recommend recovery days if pain/fatigue patterns increase.
          </p>
        </div>
      `);
    }
  },50);
};


// ---------- V9.5 READINESS IMPORT ----------
function parseReadinessReport(raw){
  const text = String(raw || "");
  const findNumber = (patterns) => {
    for(const p of patterns){
      const m = text.match(p);
      if(m && m[1] !== undefined){
        const n = parseFloat(String(m[1]).replace(/[^\d.-]/g,""));
        if(!Number.isNaN(n)) return n;
      }
    }
    return null;
  };

  const hrv = findNumber([/HRV:\s*([\d.]+)/i]);
  const restingHR = findNumber([/Resting\s*HR:\s*([\d.]+)/i, /RestingHR:\s*([\d.]+)/i]);
  const distance = findNumber([/Distance:\s*([\d.]+)/i]);
  const vo2 = findNumber([/VO2\s*Max:\s*([\d.]+)/i, /VO₂\s*Max:\s*([\d.]+)/i, /Cardio\s*Fitness:\s*([\d.]+)/i]);

  const sleepMatch = text.match(/SleepHours:\s*([^\n]+)/i);
  const exerciseMatch = text.match(/ExerciseMinutes:\s*([^\n]+)/i);

  const sleepRaw = sleepMatch ? sleepMatch[1].trim() : "";
  const exerciseRaw = exerciseMatch ? exerciseMatch[1].trim() : "";

  const sleepHours = sleepRaw && !/unavailable|none|n\/a/i.test(sleepRaw) ? parseFloat(sleepRaw) : null;
  const exerciseMinutes = exerciseRaw && !/unavailable|none|n\/a/i.test(exerciseRaw) ? parseFloat(exerciseRaw) : null;

  return {hrv, restingHR, distance, vo2, sleepHours, exerciseMinutes, importedAt:new Date().toISOString(), raw:text};
}

function downgradeReadiness(status){
  if(String(status).includes("Green")) return "Yellow 🟡";
  if(String(status).includes("Yellow")) return "Red 🔴";
  return "Red 🔴";
}

function calculateReadinessFromImport(data){
  let status = "Yellow 🟡";
  const flags = [];
  const notes = [];

  if(data.hrv !== null){
    if(data.hrv >= 45) status = "Green 🟢";
    else if(data.hrv >= 38) status = "Yellow 🟡";
    else status = "Red 🔴";

    if(data.hrv >= 45) notes.push("HRV is above baseline.");
    if(data.hrv < 38) flags.push("Low HRV.");
  }else{
    flags.push("Missing HRV.");
  }

  if(data.restingHR !== null){
    if(data.restingHR >= 64){
      flags.push("Elevated resting heart rate.");
      status = downgradeReadiness(status);
    }else{
      notes.push("Resting HR is normal.");
    }
  }

  if(data.distance !== null){
    if(data.distance >= 10){
      flags.push("High distance yesterday.");
      status = downgradeReadiness(status);
    }else if(data.distance >= 6){
      flags.push("Moderate distance yesterday.");
    }
  }

  if(data.sleepHours !== null && !Number.isNaN(data.sleepHours)){
    if(data.sleepHours < 6){
      flags.push("Low sleep.");
      status = downgradeReadiness(status);
    }else if(data.sleepHours >= 7){
      notes.push("Sleep looks solid.");
    }
  }

  if(data.exerciseMinutes !== null && !Number.isNaN(data.exerciseMinutes)){
    if(data.exerciseMinutes >= 90){
      flags.push("High exercise load yesterday.");
      status = downgradeReadiness(status);
    }
  }

  let recommendation = "Proceed with scheduled workout.";
  if(status.includes("Yellow")){
    recommendation = "Proceed, but reduce volume or intensity if legs feel heavy.";
  }
  if(status.includes("Red")){
    recommendation = "Recovery Mode recommended. Choose mobility, walking, or flexibility.";
  }

  return {status, flags, notes, recommendation};
}

function escapeHTML(str){
  return String(str || "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));
}

function openReadinessImport(){
  const current = state.readinessImport?.raw || "";
  showModal(`<h2>Readiness Import</h2>
    <p class="muted" style="margin:8px 0 12px">Paste the report from your RUUT Readiness Shortcut.</p>
    <textarea id="readinessImportText" placeholder="Paste readiness report here...">${escapeHTML(current)}</textarea>
    <div style="height:10px"></div>
    <button onclick="saveReadinessImport()">Analyze Readiness</button>
    <div style="height:8px"></div>
    <button class="secondary" onclick="clearReadinessImport()">Clear Readiness</button>
    <div style="height:8px"></div>
    <button class="secondary" onclick="hideModal()">Cancel</button>`);
}

function saveReadinessImport(){
  const raw = document.getElementById("readinessImportText").value || "";
  const parsed = parseReadinessReport(raw);
  const result = calculateReadinessFromImport(parsed);

  state.readinessImport = {...parsed, ...result};
  saveState();
  hideModal();
  showReadinessResult();
}

function clearReadinessImport(){
  delete state.readinessImport;
  saveState();
  hideModal();
}

function readinessColor(status){
  if(String(status).includes("Green")) return "var(--accent)";
  if(String(status).includes("Yellow")) return "var(--gold)";
  return "var(--danger)";
}

function showReadinessResult(){
  const r = state.readinessImport;
  if(!r){
    openReadinessImport();
    return;
  }

  showModal(`<h2>RUUT Readiness</h2>
    <div class="grid two" style="margin:12px 0">
      <div class="stat"><span class="muted small">Status</span><strong>${r.status}</strong></div>
      <div class="stat"><span class="muted small">HRV</span><strong>${r.hrv ?? "—"}</strong></div>
      <div class="stat"><span class="muted small">Resting HR</span><strong>${r.restingHR ?? "—"}</strong></div>
      <div class="stat"><span class="muted small">Distance</span><strong>${r.distance ?? "—"}</strong></div>
    </div>
    <div class="detail"><strong>Recommendation</strong><p class="muted">${r.recommendation}</p></div>
    <div style="height:10px"></div>
    <div class="detail"><strong>Flags</strong><p class="muted">${(r.flags&&r.flags.length)?r.flags.map(f=>"• "+f).join("<br>"):"None"}</p></div>
    <div style="height:10px"></div>
    <div class="detail"><strong>Notes</strong><p class="muted">${(r.notes&&r.notes.length)?r.notes.join(" "):"No extra notes."}</p></div>
    <div style="height:12px"></div>
    <button onclick="hideModal();openReadinessImport()">Update Import</button>
    <div style="height:8px"></div>
    <button class="secondary" onclick="hideModal()">Done</button>`);
}

const renderTodayV95Base = renderToday;
renderToday = function(){
  renderTodayV95Base();

  const today = document.getElementById("today");
  if(!today) return;

  const r = state.readinessImport;
  const card = r
    ? `<section class="card hero" style="border-left:4px solid ${readinessColor(r.status)}">
        <div class="pill-row"><span class="pill accent">Readiness</span><span class="pill">${new Date(r.importedAt).toLocaleDateString()}</span></div>
        <h3>${r.status}</h3>
        <p class="muted">${r.recommendation}</p>
        <div class="grid two">
          <div class="stat"><span class="muted small">HRV</span><strong>${r.hrv ?? "—"}</strong></div>
          <div class="stat"><span class="muted small">Resting HR</span><strong>${r.restingHR ?? "—"}</strong></div>
        </div>
        <button class="secondary" onclick="showReadinessResult()">View Readiness</button>
      </section>`
    : `<section class="card hero" style="border-left:4px solid var(--line)">
        <div class="pill-row"><span class="pill">Readiness</span></div>
        <h3>No Readiness Imported</h3>
        <p class="muted">Run your RUUT Readiness Shortcut, then paste the report here.</p>
        <button class="secondary" onclick="openReadinessImport()">Paste Readiness Report</button>
      </section>`;

  today.insertAdjacentHTML("afterbegin", card);
};

const beginWorkoutV95Base = beginWorkout;
beginWorkout = async function(readiness){
  const r = state.readinessImport;

  if(r && r.status){
    if(r.status.includes("Red")){
      const choice = confirm("Readiness is Red. Recovery Mode is recommended. Press OK for recovery, or Cancel to continue scheduled workout.");
      if(choice){
        const recoverButton = document.querySelector("nav button:nth-child(6)") || document.querySelector("nav button");
        showScreen("recover", recoverButton);
        return;
      }
    }

    if(r.status.includes("Yellow")){
      await cue("Readiness is yellow today. Keep the workout controlled and reduce intensity if needed.");
    }
  }

  return beginWorkoutV95Base(readiness);
};


// ---------- V9.5.1 READINESS CARD VISIBILITY FIX ----------
function renderReadinessCardV951(){
  const today = document.getElementById("today");
  if(!today) return;

  // Remove every readiness card before rendering one clean card.
  document.querySelectorAll("#readinessCardV951, [data-ruut-readiness-card='true']").forEach(el=>el.remove());

  // Remove older readiness cards from v9.5 that did not have a stable ID.
  Array.from(today.querySelectorAll("section.card.hero")).forEach(section=>{
    const text=(section.innerText||"").trim();
    if(
      text.startsWith("Readiness") ||
      text.includes("No Readiness Imported") ||
      text.includes("Paste Readiness Report") ||
      text.includes("View Readiness")
    ){
      section.remove();
    }
  });

  const r = state.readinessImport;
  const card = document.createElement("section");
  card.id = "readinessCardV951";
  card.dataset.ruutReadinessCard = "true";
  card.className = "card hero";
  card.style.borderLeft = `4px solid ${r ? readinessColor(r.status) : "var(--line)"}`;

  if(r){
    card.innerHTML = `
      <div class="pill-row">
        <span class="pill accent">Readiness</span>
        <span class="pill">${new Date(r.importedAt).toLocaleDateString()}</span>
      </div>
      <h3>${r.status}</h3>
      <p class="muted">${r.recommendation}</p>
      <div class="grid two">
        <div class="stat"><span class="muted small">HRV</span><strong>${r.hrv ?? "—"}</strong></div>
        <div class="stat"><span class="muted small">Resting HR</span><strong>${r.restingHR ?? "—"}</strong></div>
      </div>
      <button class="secondary" onclick="showReadinessResult()">View Readiness</button>
    `;
  }else{
    card.innerHTML = `
      <div class="pill-row"><span class="pill">Readiness</span></div>
      <h3>No Readiness Imported</h3>
      <p class="muted">Run your RUUT Readiness Shortcut, then paste the report here.</p>
      <button class="secondary" onclick="openReadinessImport()">Paste Readiness Report</button>
    `;
  }

  today.insertAdjacentElement("afterbegin", card);
}

const showScreenV951Base = showScreen;
showScreen = function(id,btn){
  showScreenV951Base(id,btn);
  if(id === "today") setTimeout(renderReadinessCardV951, 50);
};

const renderAllV951Base = renderAll;
renderAll = function(){
  renderAllV951Base();
  setTimeout(renderReadinessCardV951, 50);
};

setTimeout(renderReadinessCardV951, 200);


// ---------- V9.5.3 READINESS COACH RECOMMENDATIONS ----------
function buildReadinessCoachNoteV953(r){
  if(!r) return "Run your RUUT Readiness Shortcut and paste the report here.";

  const flags = r.flags || [];
  const hasHighDistance = flags.some(f => /distance/i.test(f));
  const hasHighRHR = flags.some(f => /resting/i.test(f));
  const hasLowSleep = flags.some(f => /sleep/i.test(f));
  const hasHighLoad = flags.some(f => /exercise load/i.test(f));

  if(String(r.status).includes("Red")){
    if(hasLowSleep && hasHighRHR){
      return "Recovery Mode is recommended. Low sleep and elevated resting heart rate together suggest your body is not ready for a hard training day.";
    }
    if(hasHighDistance || hasHighLoad){
      return "Recovery Mode is recommended. Yesterday created a high training load, so today should protect your legs, joints, and connective tissue.";
    }
    return "Recovery Mode is recommended. Keep movement easy, focus on mobility, and avoid forcing intensity today.";
  }

  if(String(r.status).includes("Yellow")){
    if(hasHighDistance){
      return "Proceed with the scheduled workout, but treat the warmup as your test. Because yesterday exceeded 10 miles, reduce pace or volume if your legs feel heavy after the first 10 minutes.";
    }
    if(hasHighRHR){
      return "Proceed carefully. Resting heart rate is elevated, so keep effort controlled and avoid turning today into a hard session.";
    }
    if(hasLowSleep){
      return "Proceed with caution. Sleep was low, so keep the workout smooth and reduce intensity if focus or coordination feels off.";
    }
    return "Proceed, but do not chase pace or extra volume. Keep the goal simple: complete the workout with good form.";
  }

  return "Proceed with the scheduled workout. Recovery markers look good, but keep the first 10 minutes controlled and let the body prove it is ready.";
}

function buildReadinessDetailHTMLV953(r){
  if(!r) return "";
  return `
    <div class="detail"><strong>Coach Read</strong><p class="muted">${buildReadinessCoachNoteV953(r)}</p></div>
    <div style="height:10px"></div>
    <div class="detail"><strong>Imported Data</strong>
      <p class="muted">
        HRV: ${r.hrv ?? "—"}<br>
        Resting HR: ${r.restingHR ?? "—"}<br>
        Distance: ${r.distance ?? "—"} miles<br>
        VO2 Max: ${r.vo2 ?? "—"}<br>
        Sleep: ${r.sleepHours ?? "unavailable"}<br>
        Exercise Minutes: ${r.exerciseMinutes ?? "unavailable"}
      </p>
    </div>
  `;
}

const calculateReadinessFromImportV953Base = calculateReadinessFromImport;
calculateReadinessFromImport = function(data){
  const result = calculateReadinessFromImportV953Base(data);
  result.coachNote = buildReadinessCoachNoteV953({...data, ...result});
  if(result.status.includes("Yellow")){
    result.recommendation = "Proceed with caution. Let the warmup decide how hard you go.";
  }
  if(result.status.includes("Red")){
    result.recommendation = "Recovery Mode recommended today.";
  }
  if(result.status.includes("Green")){
    result.recommendation = "Proceed with scheduled workout.";
  }
  return result;
};

const showReadinessResultV953Base = showReadinessResult;
showReadinessResult = function(){
  const r = state.readinessImport;
  if(!r){
    openReadinessImport();
    return;
  }

  showModal(`<h2>RUUT Readiness</h2>
    <div class="grid two" style="margin:12px 0">
      <div class="stat"><span class="muted small">Status</span><strong>${r.status}</strong></div>
      <div class="stat"><span class="muted small">HRV</span><strong>${r.hrv ?? "—"}</strong></div>
      <div class="stat"><span class="muted small">Resting HR</span><strong>${r.restingHR ?? "—"}</strong></div>
      <div class="stat"><span class="muted small">Distance</span><strong>${r.distance ?? "—"}</strong></div>
    </div>
    ${buildReadinessDetailHTMLV953(r)}
    <div style="height:10px"></div>
    <div class="detail"><strong>Flags</strong><p class="muted">${(r.flags&&r.flags.length)?r.flags.map(f=>"• "+f).join("<br>"):"None"}</p></div>
    <div style="height:10px"></div>
    <div class="detail"><strong>Notes</strong><p class="muted">${(r.notes&&r.notes.length)?r.notes.join(" "):"No extra notes."}</p></div>
    <div style="height:12px"></div>
    <button onclick="hideModal();openReadinessImport()">Update Import</button>
    <div style="height:8px"></div>
    <button class="secondary" onclick="hideModal()">Done</button>`);
};

const renderReadinessCardV953Base = renderReadinessCardV951;
renderReadinessCardV951 = function(){
  renderReadinessCardV953Base();
  const r = state.readinessImport;
  const card = document.getElementById("readinessCardV951");
  if(r && card){
    const p = card.querySelector("p.muted");
    if(p) p.textContent = buildReadinessCoachNoteV953(r);
  }
};


// ---------- V9.6 ADAPTIVE TRAINING ----------
function readinessLevelV96(){
  const r = state.readinessImport;
  if(!r || !r.status) return "none";
  if(String(r.status).includes("Red")) return "red";
  if(String(r.status).includes("Yellow")) return "yellow";
  if(String(r.status).includes("Green")) return "green";
  return "none";
}

function cloneWorkoutV96(x){
  try{return structuredClone(x)}catch(e){return JSON.parse(JSON.stringify(x))}
}

function adaptiveReasonV96(){
  const r = state.readinessImport;
  if(!r) return "No readiness import found.";
  const flags = r.flags && r.flags.length ? r.flags.join(" ") : "";
  if(readinessLevelV96()==="red") return "Readiness is Red, so RUUT is replacing intensity with recovery.";
  if(/distance/i.test(flags)) return "High distance yesterday. RUUT is reducing today’s training stress.";
  if(/resting/i.test(flags)) return "Resting heart rate is elevated. RUUT is keeping intensity controlled.";
  if(/sleep/i.test(flags)) return "Sleep is low. RUUT is reducing intensity and protecting recovery.";
  if(/exercise load/i.test(flags)) return "Exercise load was high yesterday. RUUT is backing off slightly.";
  if(readinessLevelV96()==="yellow") return "Readiness is Yellow. RUUT is reducing today’s workload.";
  return "Readiness is Green. Scheduled workout remains unchanged.";
}

function adaptWorkoutV96(x){
  const level = readinessLevelV96();
  const w = cloneWorkoutV96(x);
  w.originalTitle = w.originalTitle || w.title;
  w.originalTime = w.originalTime || w.time;
  w.originalStructure = w.originalStructure || w.structure;
  w.adaptiveLevel = level;
  w.adaptiveReason = adaptiveReasonV96();
  w.adaptiveChanged = false;

  if(level === "red"){
    return {
      ...w,
      type:"rest",
      title:"Adaptive Recovery Day",
      time:"20–30 min",
      structure:"Easy walk plus mobility or flexibility. No hard intervals today.",
      distance:"Easy movement only",
      purpose:"Protect recovery and keep the habit alive without adding training stress.",
      terrain:"Flat, easy route or recovery/flexibility work.",
      effort:"Very easy. You should be able to breathe through your nose.",
      success:"Finish feeling better than when you started.",
      caution:"Do not turn recovery into a hidden workout.",
      adaptiveChanged:true,
      adaptiveLevel:"red",
      adaptiveReason:adaptiveReasonV96()
    };
  }

  if(level === "yellow"){
    w.adaptiveChanged = true;

    if(w.type === "run"){
      const originalTotal = Number(w.total || 0);
      const newTotal = Math.max(10, Math.round(originalTotal * 0.85));
      w.total = newTotal;
      w.time = `${newTotal} min`;
      w.title = `Adaptive ${w.title}`;
      w.structure = `${w.originalStructure}. Adaptive change: reduce total volume about 15%. Keep effort controlled.`;
      w.distance = "Reduced volume";
      w.effort = "Controlled. No chasing pace today.";
      w.success = "Complete the reduced workout feeling steady, not drained.";

      // For interval/hill days, make the recovery side easier without changing the whole plan.
      if(w.day === "Wed" || /hill|interval/i.test(w.originalTitle || w.title)){
        w.walkSeconds = Math.round((w.walkSeconds || 120) * 1.15);
        w.structure = `${w.structure} Strong portions stay controlled. Easy portions may become walking.`;
      }
    }

    if(w.type === "bodyweight"){
      const originalRounds = Number(w.rounds || 1);
      w.rounds = Math.max(1, originalRounds - 1);
      w.time = `${w.rounds} rounds`;
      w.title = "Adaptive Bodyweight Strength";
      w.structure = `${w.rounds} rounds today. Adaptive change: one less round to protect recovery.`;
      w.note = "Quality reps only. Stop before form breaks.";
      w.success = "Clean movement and no grinding.";
    }
  }

  return w;
}

const currentWorkoutV96Base = currentWorkout;
currentWorkout = function(){
  return adaptWorkoutV96(currentWorkoutV96Base());
};

function adaptiveTrainingCardV96(){
  const x = currentWorkout();
  const level = readinessLevelV96();

  if(level === "none"){
    return `<section class="card hero" style="border-left:4px solid var(--line)">
      <div class="pill-row"><span class="pill">Adaptive Training</span></div>
      <h3>No readiness data yet</h3>
      <p class="muted">Paste your RUUT Readiness report to let RUUT adjust today’s workout.</p>
    </section>`;
  }

  const color = level==="green" ? "var(--accent)" : level==="yellow" ? "var(--gold)" : "var(--danger)";
  const title = level==="green" ? "Scheduled Plan Active" : level==="yellow" ? "Workout Modified" : "Recovery Substitution";
  const change = x.adaptiveChanged
    ? `<p class="muted"><strong>Original:</strong> ${x.originalTitle || "Scheduled workout"} ${x.originalTime ? "• "+x.originalTime : ""}</p>
       <p class="muted"><strong>Today:</strong> ${x.title} • ${x.time}</p>`
    : `<p class="muted">No modification needed today.</p>`;

  return `<section class="card hero" style="border-left:4px solid ${color}">
    <div class="pill-row"><span class="pill accent">Adaptive Training</span><span class="pill">${level.toUpperCase()}</span></div>
    <h3>${title}</h3>
    <p class="muted">${x.adaptiveReason}</p>
    ${change}
  </section>`;
}

const renderTodayV96Base = renderToday;
renderToday = function(){
  renderTodayV96Base();
  const today = document.getElementById("today");
  if(today && !document.getElementById("adaptiveTrainingV96")){
    const wrap = document.createElement("div");
    wrap.id = "adaptiveTrainingV96";
    wrap.innerHTML = adaptiveTrainingCardV96();
    const readinessCard = document.getElementById("readinessCardV951");
    if(readinessCard && readinessCard.nextSibling){
      readinessCard.parentNode.insertBefore(wrap, readinessCard.nextSibling);
    }else{
      today.insertAdjacentElement("afterbegin", wrap);
    }
  }
};

const beginWorkoutV96Base = beginWorkout;
beginWorkout = async function(readiness){
  const x = currentWorkout();
  if(x.adaptiveChanged){
    if(x.adaptiveLevel === "yellow"){
      await cue("Adaptive training active. Today’s workout has been reduced based on readiness.");
    }
    if(x.adaptiveLevel === "red"){
      await cue("Adaptive recovery active. Hard training is replaced with easy movement today.");
    }
  }
  return beginWorkoutV96Base(readiness);
};


// ---------- V9.7 WORKOUT DEBRIEF + REMOVE REDUNDANT PRE-CHECK ----------
function hasImportedReadinessV97(){
  return !!(state.readinessImport && state.readinessImport.status);
}

// If imported readiness exists, skip the old manual readiness check.
// If no imported readiness exists, keep the old manual check as a fallback.
const startWorkoutV97Base = startWorkout;
startWorkout = function(){
  workoutAbort=false;
  skipCurrentTimer=false;
  workoutPaused=false;

  if(hasImportedReadinessV97()){
    beginWorkout("imported");
    return;
  }

  return startWorkoutV97Base();
};

function workoutDebriefOptionsV97(){
  return {
    feel:["Easy","Moderate","Hard","Very Hard"],
    issue:["None","Heavy Legs","Breathing","Low Energy","Pain","Other"]
  };
}

function openWorkoutDebriefV97(snapshot){
  const opts = workoutDebriefOptionsV97();
  const snap = snapshot || lastCompletedSnapshotV9 || {
    week:state.week,
    dayIndex:state.dayIndex,
    day:currentWorkout().day,
    title:currentWorkout().title,
    type:currentWorkout().type,
    date:new Date().toLocaleDateString(),
    iso:new Date().toISOString()
  };

  showModal(`<h2>Workout Debrief</h2>
    <p class="muted" style="margin:8px 0 14px">${snap.day || ""} — ${snap.title || "Workout"}</p>

    <div class="detail"><strong>How did it feel?</strong>
      <div class="choice-grid" style="margin-top:10px">
        ${opts.feel.map(v=>`<button class="choice-btn" data-choice="debriefFeel" data-value="${v}" onclick="selectChoice('debriefFeel','${v}')">${v}</button>`).join("")}
      </div>
      <input id="debriefFeelValue" type="hidden" value="">
    </div>

    <div style="height:12px"></div>

    <div class="detail"><strong>Any issues?</strong>
      <div class="choice-grid" style="margin-top:10px">
        ${opts.issue.map(v=>`<button class="choice-btn" data-choice="debriefIssue" data-value="${v}" onclick="selectChoice('debriefIssue','${v}')">${v}</button>`).join("")}
      </div>
      <input id="debriefIssueValue" type="hidden" value="">
    </div>

    <div style="height:12px"></div>

    <div class="detail"><strong>Notes</strong>
      <textarea id="debriefNote" placeholder="Optional: route, weather, fatigue, pain location, what felt good..."></textarea>
    </div>

    <div style="height:12px"></div>
    <button onclick="saveWorkoutDebriefV97()">Save Debrief</button>
    <div style="height:8px"></div>
    <button class="secondary" onclick="hideModal()">Skip</button>
  `);

  window.pendingDebriefSnapshotV97 = snap;
}

function saveWorkoutDebriefV97(){
  const snap = window.pendingDebriefSnapshotV97 || lastCompletedSnapshotV9 || {};
  const feel = document.getElementById("debriefFeelValue")?.value || "Not rated";
  const issue = document.getElementById("debriefIssueValue")?.value || "Not recorded";
  const note = document.getElementById("debriefNote")?.value || "";

  state.workoutDebriefs = state.workoutDebriefs || [];
  state.workoutDebriefs.push({
    date:snap.date || new Date().toLocaleDateString(),
    iso:snap.iso || new Date().toISOString(),
    week:snap.week ?? state.week,
    dayIndex:snap.dayIndex ?? state.dayIndex,
    day:snap.day || currentWorkout().day,
    title:snap.title || currentWorkout().title,
    type:snap.type || currentWorkout().type,
    readiness:state.readinessImport?.status || "Not imported",
    feel,
    issue,
    note
  });

  // Also add a journal entry so current Journal screen remains useful.
  state.journal = state.journal || [];
  state.journal.push({
    date:snap.date || new Date().toLocaleDateString(),
    iso:snap.iso || new Date().toISOString(),
    workout:`W${snap.week ?? state.week} D${snap.dayIndex ?? state.dayIndex} ${snap.title || currentWorkout().title}`,
    type:snap.type || currentWorkout().type,
    routeMode:settings.routeMode,
    feel,
    pain:issue,
    note
  });

  saveState();
  hideModal();
}

function debriefTrendV97(){
  const recent = (state.workoutDebriefs || []).slice(-5);
  let hard=0, veryHard=0, issues=0, pain=0, heavyLegs=0;

  recent.forEach(d=>{
    if(d.feel==="Hard") hard++;
    if(d.feel==="Very Hard") veryHard++;
    if(d.issue && d.issue!=="None" && d.issue!=="Not recorded") issues++;
    if(d.issue==="Pain") pain++;
    if(d.issue==="Heavy Legs") heavyLegs++;
  });

  return {recent, hard, veryHard, issues, pain, heavyLegs};
}

function debriefCoachNoteV97(){
  const t = debriefTrendV97();

  if(t.recent.length < 2){
    return "Debrief history is still building. Save a few workout debriefs and RUUT will start recognizing patterns.";
  }

  if(t.pain >= 2){
    return "Pain has shown up more than once recently. RUUT should prioritize recovery and avoid intensity until this clears.";
  }

  if(t.heavyLegs >= 2 || t.veryHard >= 2){
    return "Heavy legs or very hard efforts are trending. RUUT should reduce volume before adding more load.";
  }

  if(t.hard + t.veryHard >= 3){
    return "Several recent workouts have felt hard. Maintain discipline, but avoid extra challenge work right now.";
  }

  return "Debrief trend looks stable. Training can continue as planned.";
}

// Add debrief trend to dashboard.
const renderDashboardV97Base = renderDashboard;
renderDashboard = function(){
  renderDashboardV97Base();
  const dash = document.getElementById("dashboard");
  if(!dash) return;

  const old = document.getElementById("debriefTrendV97");
  if(old) old.remove();

  const t = debriefTrendV97();
  const card = document.createElement("section");
  card.id = "debriefTrendV97";
  card.className = "card hero";
  card.innerHTML = `
    <h3>Workout Debrief Trend</h3>
    <p class="muted">${debriefCoachNoteV97()}</p>
    <div class="grid two">
      <div class="stat"><span class="muted small">Recent Debriefs</span><strong>${t.recent.length}</strong></div>
      <div class="stat"><span class="muted small">Issues Reported</span><strong>${t.issues}</strong></div>
      <div class="stat"><span class="muted small">Very Hard</span><strong>${t.veryHard}</strong></div>
      <div class="stat"><span class="muted small">Heavy Legs</span><strong>${t.heavyLegs}</strong></div>
    </div>
  `;
  dash.insertAdjacentElement("afterbegin", card);
};

// Fold debrief trend into adaptive training.
const adaptWorkoutV97Base = adaptWorkoutV96;
adaptWorkoutV96 = function(x){
  let w = adaptWorkoutV97Base(x);
  const t = debriefTrendV97();

  if(w.adaptiveLevel==="green" || w.adaptiveLevel==="none"){
    if((t.heavyLegs >= 2 || t.veryHard >= 2) && w.type==="run"){
      w = cloneWorkoutV96(w);
      w.adaptiveChanged = true;
      w.adaptiveLevel = "yellow";
      w.adaptiveReason = "Recent workout debriefs show heavy legs or very hard efforts. RUUT is reducing today’s run slightly.";
      const newTotal = Math.max(10, Math.round((w.total || 20) * 0.9));
      w.total = newTotal;
      w.time = `${newTotal} min`;
      w.title = `Adaptive ${w.title}`;
      w.structure = `${w.originalStructure || w.structure}. Debrief adjustment: reduce volume about 10%.`;
      w.effort = "Controlled. Finish steady rather than hard.";
    }

    if((t.heavyLegs >= 2 || t.veryHard >= 2) && w.type==="bodyweight"){
      w = cloneWorkoutV96(w);
      w.adaptiveChanged = true;
      w.adaptiveLevel = "yellow";
      w.adaptiveReason = "Recent debriefs show fatigue. RUUT is reducing strength volume slightly.";
      w.rounds = Math.max(1,(w.rounds || 2)-1);
      w.time = `${w.rounds} rounds`;
      w.title = "Adaptive Bodyweight Strength";
      w.structure = `${w.rounds} rounds today. Debrief adjustment: one less round.`;
    }
  }

  return w;
};

// Replace completion flow with debrief first.
finishWorkout = async function(){
  setCue("Complete");
  setTimer("DONE");
  setWorkoutMessage("Workout complete. Save a quick debrief.");
  await cue("Workout complete. Save a quick debrief.");
  markComplete(false);
  releaseWakeLock();

  const snap = lastCompletedSnapshotV9 || {
    week:state.week,
    dayIndex:state.dayIndex,
    day:currentWorkout().day,
    title:currentWorkout().title,
    type:currentWorkout().type,
    date:new Date().toLocaleDateString(),
    iso:new Date().toISOString()
  };

  openWorkoutDebriefV97(snap);
};


// ---------- V9.8 ADAPTIVE COACH NOTES ----------
function coachReadinessSummaryV98(){
  const r = state.readinessImport;
  if(!r || !r.status){
    return {
      status:"Not imported",
      line:"No readiness report has been imported yet.",
      tone:"neutral"
    };
  }

  if(String(r.status).includes("Green")){
    return {
      status:r.status,
      line:"Readiness is Green. Recovery markers support the scheduled workout.",
      tone:"green"
    };
  }

  if(String(r.status).includes("Yellow")){
    return {
      status:r.status,
      line:"Readiness is Yellow. RUUT should favor controlled effort over extra intensity.",
      tone:"yellow"
    };
  }

  return {
    status:r.status,
    line:"Readiness is Red. Recovery should take priority over hard training.",
    tone:"red"
  };
}

function coachDebriefSummaryV98(){
  const recent = (state.workoutDebriefs || []).slice(-5);
  if(!recent.length){
    return {
      line:"No workout debriefs logged yet. Save a few debriefs after workouts so RUUT can start learning from your actual effort.",
      trend:"No trend yet",
      issues:"None recorded",
      recommendation:"Use today's readiness and complete the plan with discipline."
    };
  }

  const feels = recent.map(d=>d.feel || "Not rated").filter(Boolean);
  const issues = recent.map(d=>d.issue || "None").filter(i=>i && i !== "None" && i !== "Not recorded");

  const easy = feels.filter(f=>f==="Easy").length;
  const moderate = feels.filter(f=>f==="Moderate").length;
  const hard = feels.filter(f=>f==="Hard").length;
  const veryHard = feels.filter(f=>f==="Very Hard").length;
  const heavyLegs = issues.filter(i=>i==="Heavy Legs").length;
  const pain = issues.filter(i=>i==="Pain").length;
  const lowEnergy = issues.filter(i=>i==="Low Energy").length;
  const breathing = issues.filter(i=>i==="Breathing").length;

  let trend = `${recent.length} recent debrief${recent.length===1?"":"s"} logged`;
  let recommendation = "Debrief trend looks stable. Continue with the current plan.";
  let line = "Recent debriefs do not show a major fatigue pattern.";

  if(pain >= 2){
    line = "Pain has appeared more than once recently.";
    recommendation = "Avoid intensity and prioritize Recovery Mode until pain is no longer recurring.";
  }else if(heavyLegs >= 2 || veryHard >= 2){
    line = "Heavy legs or very hard efforts are showing up repeatedly.";
    recommendation = "Keep today's workout controlled. Prioritize completion over pace, and avoid adding extra volume.";
  }else if(hard + veryHard >= 3){
    line = "Several recent workouts have felt hard.";
    recommendation = "Hold the current training level. Do not increase volume yet.";
  }else if(easy >= 3 && issues.length===0){
    line = "Recent workouts are trending easy with no issues.";
    recommendation = "You are adapting well. Stay disciplined today, and if the workout still feels easy, RUUT may be ready for progression soon.";
  }else if(lowEnergy >= 2){
    line = "Low energy has appeared more than once recently.";
    recommendation = "Keep intensity conservative and watch sleep, food, and recovery before pushing harder.";
  }else if(breathing >= 2){
    line = "Breathing has been a repeated issue.";
    recommendation = "Stay at conversational effort during easy segments and avoid sprinting the hard portions.";
  }

  return {
    line,
    trend,
    issues: issues.length ? [...new Set(issues)].join(", ") : "None reported",
    feels: feels.join(", "),
    recommendation
  };
}

function coachWorkoutContextV98(){
  const x = currentWorkout();
  if(!x) return "No workout selected.";

  if(x.type==="run"){
    if(x.day==="Wed" || /interval|hill/i.test(x.title)){
      return "Today's workout has intensity. Strong portions should be controlled, not reckless. Easy portions can be walking if needed.";
    }
    if(x.day==="Sat"){
      return "Today is the long-run slot. The goal is patience, rhythm, and finishing with control.";
    }
    return "Today is a run day. The goal is steady aerobic work and consistency.";
  }

  if(x.type==="bodyweight"){
    return "Today is strength work. Clean reps matter more than speed. Stop before form breaks.";
  }

  return "Today is recovery or rest. Move easy and protect tomorrow's training.";
}

function buildCoachNotesV98(){
  const readiness = coachReadinessSummaryV98();
  const debrief = coachDebriefSummaryV98();
  const workoutContext = coachWorkoutContextV98();

  let mainRecommendation = debrief.recommendation;

  if(readiness.tone==="red"){
    mainRecommendation = "Recovery Mode is the recommended choice today. If you continue with the scheduled workout, keep it very easy.";
  }else if(readiness.tone==="yellow"){
    mainRecommendation = `${debrief.recommendation} Since readiness is Yellow, use the warmup as the test and back off if anything feels off.`;
  }else if(readiness.tone==="green" && debrief.recommendation.includes("adapting well")){
    mainRecommendation = "Proceed with today's workout. If effort feels controlled and form stays clean, finish the final segment with confidence.";
  }

  return {
    readiness,
    debrief,
    workoutContext,
    mainRecommendation
  };
}

function renderCoachNotesCardV98(){
  const today = document.getElementById("today");
  if(!today) return;

  const existing = document.getElementById("coachNotesV98");
  if(existing) existing.remove();

  const notes = buildCoachNotesV98();
  const color = notes.readiness.tone==="green" ? "var(--accent)" : notes.readiness.tone==="yellow" ? "var(--gold)" : notes.readiness.tone==="red" ? "var(--danger)" : "var(--line)";

  const card = document.createElement("section");
  card.id = "coachNotesV98";
  card.className = "card hero";
  card.style.borderLeft = `4px solid ${color}`;
  card.innerHTML = `
    <div class="pill-row">
      <span class="pill accent">Coach's Notes</span>
      <span class="pill">${notes.readiness.status}</span>
    </div>
    <h3>Today's Coaching Read</h3>
    <p class="muted">${notes.readiness.line}</p>
    <div class="detail"><strong>Workout Context</strong><p class="muted">${notes.workoutContext}</p></div>
    <div style="height:10px"></div>
    <div class="detail"><strong>Recent Debrief Trend</strong><p class="muted">${notes.debrief.line}</p></div>
    <div style="height:10px"></div>
    <div class="detail"><strong>Coach Recommendation</strong><p class="muted">${notes.mainRecommendation}</p></div>
    <div style="height:10px"></div>
    <button class="secondary" onclick="showCoachNotesDetailV98()">View Details</button>
  `;

  const adaptive = document.getElementById("adaptiveTrainingV96");
  if(adaptive && adaptive.nextSibling){
    adaptive.parentNode.insertBefore(card, adaptive.nextSibling);
  }else{
    const readiness = document.getElementById("readinessCardV951");
    if(readiness && readiness.nextSibling){
      readiness.parentNode.insertBefore(card, readiness.nextSibling);
    }else{
      today.insertAdjacentElement("afterbegin", card);
    }
  }
}

function showCoachNotesDetailV98(){
  const notes = buildCoachNotesV98();
  showModal(`<h2>Coach's Notes</h2>
    <div class="detail"><strong>Readiness</strong><p class="muted">${notes.readiness.line}</p></div>
    <div style="height:10px"></div>
    <div class="detail"><strong>Workout Context</strong><p class="muted">${notes.workoutContext}</p></div>
    <div style="height:10px"></div>
    <div class="detail"><strong>Recent Debriefs</strong>
      <p class="muted">
        Trend: ${notes.debrief.trend}<br>
        Feel: ${notes.debrief.feels || "No debriefs yet"}<br>
        Issues: ${notes.debrief.issues}
      </p>
    </div>
    <div style="height:10px"></div>
    <div class="detail"><strong>Recommendation</strong><p class="muted">${notes.mainRecommendation}</p></div>
    <div style="height:12px"></div>
    <button onclick="hideModal()">Done</button>
  `);
}

const renderTodayV98Base = renderToday;
renderToday = function(){
  renderTodayV98Base();
  setTimeout(renderCoachNotesCardV98, 50);
};

const showScreenV98Base = showScreen;
showScreen = function(id,btn){
  showScreenV98Base(id,btn);
  if(id==="today") setTimeout(renderCoachNotesCardV98, 50);
};

const renderAllV98Base = renderAll;
renderAll = function(){
  renderAllV98Base();
  setTimeout(renderCoachNotesCardV98, 50);
};

setTimeout(renderCoachNotesCardV98, 300);


// ---------- V9.9 ADAPTIVE PROGRESSION ----------
function progressionSignalsV99(){
  const deb = (state.workoutDebriefs || []).slice(-7);
  const readiness = state.readinessImport?.status || "Not imported";

  let easy=0, moderate=0, hard=0, veryHard=0, issues=0, pain=0, heavyLegs=0, lowEnergy=0;
  deb.forEach(d=>{
    if(d.feel==="Easy") easy++;
    if(d.feel==="Moderate") moderate++;
    if(d.feel==="Hard") hard++;
    if(d.feel==="Very Hard") veryHard++;
    if(d.issue && d.issue!=="None" && d.issue!=="Not recorded") issues++;
    if(d.issue==="Pain") pain++;
    if(d.issue==="Heavy Legs") heavyLegs++;
    if(d.issue==="Low Energy") lowEnergy++;
  });

  const green = String(readiness).includes("Green");
  const yellow = String(readiness).includes("Yellow");
  const red = String(readiness).includes("Red");

  let recommendation = "HOLD";
  let title = "Hold Current Load";
  let summary = "Not enough signal to change training load yet. Continue the current plan.";
  let action = "Keep this week as written.";
  let confidence = deb.length >= 3 ? "Moderate" : "Low";

  if(deb.length >= 3){
    if(pain >= 1 || red || veryHard >= 2 || heavyLegs >= 2){
      recommendation = "REDUCE";
      title = "Reduce Next Training Load";
      summary = "Recent feedback suggests accumulated stress. RUUT should reduce load before pushing progression.";
      action = "Reduce next comparable workout by about 10–15%, or choose Recovery Mode if symptoms persist.";
      confidence = "High";
    }else if(green && easy >= 2 && issues === 0){
      recommendation = "PROGRESS";
      title = "Progression Available";
      summary = "Recent workouts are trending manageable with no issues. RUUT can safely consider a small progression.";
      action = "Increase next comparable workout slightly: about 5–10% volume, or a controlled final interval.";
      confidence = "Moderate";
    }else if(yellow || hard >= 2 || lowEnergy >= 1){
      recommendation = "HOLD";
      title = "Hold and Stabilize";
      summary = "Training is productive but not ready for an increase. Hold the current level and avoid extra volume.";
      action = "Complete the plan as written, with no bonus work.";
      confidence = "Moderate";
    }
  }

  return {
    deb,
    easy, moderate, hard, veryHard, issues, pain, heavyLegs, lowEnergy,
    readiness,
    recommendation,
    title,
    summary,
    action,
    confidence
  };
}

function progressionColorV99(kind){
  if(kind==="PROGRESS") return "var(--accent)";
  if(kind==="REDUCE") return "var(--danger)";
  return "var(--gold)";
}

function renderProgressionCardV99(){
  const today = document.getElementById("today");
  if(!today) return;

  const old = document.getElementById("progressionCardV99");
  if(old) old.remove();

  const s = progressionSignalsV99();
  const card = document.createElement("section");
  card.id = "progressionCardV99";
  card.className = "card hero";
  card.style.borderLeft = `4px solid ${progressionColorV99(s.recommendation)}`;
  card.innerHTML = `
    <div class="pill-row">
      <span class="pill accent">Adaptive Progression</span>
      <span class="pill">${s.recommendation}</span>
      <span class="pill">Confidence: ${s.confidence}</span>
    </div>
    <h3>${s.title}</h3>
    <p class="muted">${s.summary}</p>
    <div class="detail"><strong>Action</strong><p class="muted">${s.action}</p></div>
    <div style="height:10px"></div>
    <button class="secondary" onclick="showProgressionDetailV99()">View Progression Detail</button>
  `;

  const coach = document.getElementById("coachNotesV98");
  if(coach && coach.nextSibling){
    coach.parentNode.insertBefore(card, coach.nextSibling);
  }else{
    today.insertAdjacentElement("afterbegin", card);
  }
}

function showProgressionDetailV99(){
  const s = progressionSignalsV99();
  const rows = s.deb.slice().reverse().map(d=>`
    <div class="row" style="align-items:flex-start">
      <div>
        <strong>${d.date || ""}</strong>
        <p class="muted small">${d.title || "Workout"} — ${d.feel || "Not rated"}${d.issue && d.issue!=="None" ? " • "+d.issue : ""}</p>
        ${d.note ? `<p class="muted small">${d.note}</p>` : ""}
      </div>
    </div>
  `).join("");

  showModal(`<h2>Adaptive Progression</h2>
    <div class="detail"><strong>Recommendation</strong><p class="muted">${s.title}</p></div>
    <div style="height:10px"></div>
    <div class="detail"><strong>Why</strong><p class="muted">${s.summary}</p></div>
    <div style="height:10px"></div>
    <div class="detail"><strong>Action</strong><p class="muted">${s.action}</p></div>
    <div style="height:10px"></div>
    <div class="grid two">
      <div class="stat"><span class="muted small">Easy</span><strong>${s.easy}</strong></div>
      <div class="stat"><span class="muted small">Moderate</span><strong>${s.moderate}</strong></div>
      <div class="stat"><span class="muted small">Hard</span><strong>${s.hard}</strong></div>
      <div class="stat"><span class="muted small">Very Hard</span><strong>${s.veryHard}</strong></div>
      <div class="stat"><span class="muted small">Issues</span><strong>${s.issues}</strong></div>
      <div class="stat"><span class="muted small">Readiness</span><strong>${s.readiness}</strong></div>
    </div>
    <div style="height:12px"></div>
    <h3>Recent Debriefs</h3>
    <div class="list">${rows || '<p class="muted">No debriefs yet.</p>'}</div>
    <div style="height:12px"></div>
    <button onclick="hideModal()">Done</button>
  `);
}

// Apply only small same-day changes, not future-week rewrites yet.
const adaptWorkoutV99Base = adaptWorkoutV96;
adaptWorkoutV96 = function(x){
  let w = adaptWorkoutV99Base(x);
  const s = progressionSignalsV99();

  if(s.recommendation==="REDUCE" && !w.adaptiveChanged){
    w = cloneWorkoutV96(w);
    w.adaptiveChanged = true;
    w.adaptiveLevel = "yellow";
    w.adaptiveReason = "Adaptive Progression recommends reducing load based on recent debriefs.";

    if(w.type==="run"){
      const newTotal = Math.max(10, Math.round((w.total || 20) * 0.9));
      w.total = newTotal;
      w.time = `${newTotal} min`;
      w.title = `Adaptive ${w.title}`;
      w.structure = `${w.originalStructure || w.structure}. Progression adjustment: reduce volume about 10%.`;
      w.effort = "Controlled and conservative.";
    }

    if(w.type==="bodyweight"){
      w.rounds = Math.max(1,(w.rounds || 2)-1);
      w.time = `${w.rounds} rounds`;
      w.title = "Adaptive Bodyweight Strength";
      w.structure = `${w.rounds} rounds today. Progression adjustment: one less round.`;
    }
  }

  // For progression, do not automatically increase yet. We only recommend.
  return w;
};

const renderTodayV99Base = renderToday;
renderToday = function(){
  renderTodayV99Base();
  setTimeout(renderProgressionCardV99, 80);
};

const showScreenV99Base = showScreen;
showScreen = function(id,btn){
  showScreenV99Base(id,btn);
  if(id==="today") setTimeout(renderProgressionCardV99, 80);
};

const renderAllV99Base = renderAll;
renderAll = function(){
  renderAllV99Base();
  setTimeout(renderProgressionCardV99, 80);
};

setTimeout(renderProgressionCardV99, 400);


// ---------- V10 COACH ACTIONS ----------
function getCoachProfileV10(){
  state.coachProfile = state.coachProfile || {
    goal:"Fat Loss",
    style:"Balanced",
    limitations:["Weak Ankles","Occasional Back Issues"]
  };
  return state.coachProfile;
}

function applyProgressionRecommendationV10(){
  const s = progressionSignalsV99();

  state.trainingAdjustments = state.trainingAdjustments || [];
  let adjustment = null;

  if(s.recommendation === "PROGRESS"){
    adjustment = {
      date:new Date().toISOString(),
      type:"PROGRESS",
      amount:"+10%",
      reason:s.summary
    };
  } else if(s.recommendation === "REDUCE"){
    adjustment = {
      date:new Date().toISOString(),
      type:"REDUCE",
      amount:"-10%",
      reason:s.summary
    };
  } else {
    adjustment = {
      date:new Date().toISOString(),
      type:"HOLD",
      amount:"0%",
      reason:s.summary
    };
  }

  state.trainingAdjustments.push(adjustment);
  saveState();

  showModal(`<h2>Coach Action Applied</h2>
    <p class="muted">${adjustment.type} recommendation recorded.</p>
    <div class="detail">
      <strong>Adjustment</strong>
      <p class="muted">${adjustment.amount}</p>
    </div>
    <div class="detail">
      <strong>Reason</strong>
      <p class="muted">${adjustment.reason}</p>
    </div>
    <button onclick="hideModal()">Done</button>`);
}

const renderProgressionCardV10Base = renderProgressionCardV99;
renderProgressionCardV99 = function(){
  renderProgressionCardV10Base();

  const card = document.getElementById("progressionCardV99");
  if(!card) return;

  if(!card.innerHTML.includes("Apply Recommendation")){
    card.insertAdjacentHTML("beforeend",
      `<div style="height:10px"></div>
       <button onclick="applyProgressionRecommendationV10()">Apply Recommendation</button>`);
  }
};

function renderCoachMemoryCardV10(){
  const today = document.getElementById("today");
  if(!today) return;

  const old = document.getElementById("coachMemoryV10");
  if(old) old.remove();

  const p = getCoachProfileV10();

  const card = document.createElement("section");
  card.id = "coachMemoryV10";
  card.className = "card hero";
  card.innerHTML = `
    <div class="pill-row"><span class="pill accent">Coach Memory</span></div>
    <h3>${p.goal}</h3>
    <p class="muted">Coaching Style: ${p.style}</p>
    <p class="muted">Limitations: ${p.limitations.join(", ")}</p>
  `;

  today.appendChild(card);
}

const renderTodayV10Base = renderToday;
renderToday = function(){
  renderTodayV10Base();
  setTimeout(renderCoachMemoryCardV10,120);
};


// ---------- V10.1 DAILY RESET + READINESS HISTORY + MISSED WORKOUTS ----------
let dailyMaintenanceRunningV101 = false;

function effectiveDayStampV101(date = new Date()){
  const d = new Date(date);
  // RUUT's training day rolls over at 12:01 AM.
  if(d.getHours() === 0 && d.getMinutes() < 1){
    d.setDate(d.getDate() - 1);
  }
  return d.toISOString().slice(0,10);
}

function calendarDateV101(date = new Date()){
  return new Date(date).toISOString().slice(0,10);
}

function daysBetweenV101(a,b){
  const start = new Date(a + "T12:00:00");
  const end = new Date(b + "T12:00:00");
  return Math.max(0, Math.round((end - start) / 86400000));
}

function ensureDailyStateV101(){
  state.dailyStatus = state.dailyStatus || {};
  state.missedWorkouts = state.missedWorkouts || [];
  state.readinessHistory = state.readinessHistory || [];
  state.workoutHistory = state.workoutHistory || [];
  state.currentDayStamp = state.currentDayStamp || effectiveDayStampV101();
}

function workoutSnapshotV101(status, key, dayStamp){
  let w = null;
  try{ w = currentWorkout(); }catch(e){}
  return {
    date:dayStamp || effectiveDayStampV101(),
    key:key || currentKey(),
    week:state.week,
    dayIndex:state.dayIndex,
    title:w?.title || "Workout",
    type:w?.type || "unknown",
    status,
    readinessStatus:state.readinessImport?.status || "Not imported",
    createdAt:new Date().toISOString()
  };
}

function archiveReadinessV101(reason="archive"){
  ensureDailyStateV101();
  if(!state.readinessImport) return;

  const importDate = state.readinessImport.dayStamp || state.currentDayStamp || effectiveDayStampV101();
  const already = state.readinessHistory.some(r =>
    r.importedAt === state.readinessImport.importedAt &&
    r.dayStamp === importDate
  );

  if(!already){
    state.readinessHistory.push({
      ...state.readinessImport,
      dayStamp:importDate,
      archivedReason:reason,
      archivedAt:new Date().toISOString()
    });
  }
}

function markDailyStatusV101(status, key=currentKey(), dayStamp=state.currentDayStamp || effectiveDayStampV101()){
  ensureDailyStateV101();

  state.dailyStatus[dayStamp] = {
    ...(state.dailyStatus[dayStamp] || {}),
    key,
    status,
    updatedAt:new Date().toISOString()
  };

  const existingIndex = state.workoutHistory.findIndex(x => x.date === dayStamp && x.key === key);
  const snap = workoutSnapshotV101(status, key, dayStamp);

  if(existingIndex >= 0){
    state.workoutHistory[existingIndex] = {...state.workoutHistory[existingIndex], ...snap};
  }else{
    state.workoutHistory.push(snap);
  }
}

function recordMissedDayV101(dayStamp, key){
  ensureDailyStateV101();

  const day = state.dailyStatus[dayStamp];
  if(day && day.status === "completed") return;
  if(state.completed && state.completed.includes(key)) return;

  markDailyStatusV101("missed", key, dayStamp);

  const exists = state.missedWorkouts.some(x => x.date === dayStamp && x.key === key);
  if(!exists){
    state.missedWorkouts.push(workoutSnapshotV101("missed", key, dayStamp));
  }

  // A missed day breaks the streak.
  state.streak = 0;
}

function advanceOneTrainingDayV101(){
  state.dayIndex++;
  if(state.dayIndex > 7){
    state.dayIndex = 1;
    state.week++;
  }
  if(state.week > 12){
    state.week = 12;
    state.dayIndex = 7;
  }
}

function runDailyMaintenanceV101(){
  if(dailyMaintenanceRunningV101) return;
  dailyMaintenanceRunningV101 = true;

  try{
    ensureDailyStateV101();

    const todayStamp = effectiveDayStampV101();
    const previousStamp = state.currentDayStamp || todayStamp;

    if(previousStamp !== todayStamp){
      const elapsed = daysBetweenV101(previousStamp, todayStamp);

      for(let i=0;i<elapsed;i++){
        const loopStampDate = new Date(previousStamp + "T12:00:00");
        loopStampDate.setDate(loopStampDate.getDate() + i);
        const loopStamp = loopStampDate.toISOString().slice(0,10);
        const key = currentKey();

        const alreadyCompleted = state.completed && state.completed.includes(key);
        const daily = state.dailyStatus?.[loopStamp];

        if(!alreadyCompleted && (!daily || daily.status !== "completed")){
          recordMissedDayV101(loopStamp, key);
        }

        advanceOneTrainingDayV101();
      }

      archiveReadinessV101("daily-reset");
      delete state.readinessImport;

      state.currentDayStamp = todayStamp;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }catch(e){
    console.warn("RUUT daily maintenance failed", e);
  }finally{
    dailyMaintenanceRunningV101 = false;
  }
}

const saveStateV101Base = saveState;
saveState = function(){
  ensureDailyStateV101();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  renderAll();
};

const markCompleteV101Base = markComplete;
markComplete = function(manual=false){
  ensureDailyStateV101();

  const key = currentKey();
  markCompleteV101Base(manual);

  markDailyStatusV101("completed", key, state.currentDayStamp || effectiveDayStampV101());

  // Keep storage consistent because base markComplete triggers render/save before our daily status update.
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  renderAll();
};

const nextDayV101Base = nextDay;
nextDay = function(){
  // Manual next day still exists, but now marks uncompleted current day as skipped rather than silently moving.
  ensureDailyStateV101();
  const key = currentKey();
  const stamp = state.currentDayStamp || effectiveDayStampV101();
  if(!(state.completed || []).includes(key)){
    markDailyStatusV101("skipped", key, stamp);
  }
  archiveReadinessV101("manual-next-day");
  delete state.readinessImport;
  state.currentDayStamp = effectiveDayStampV101();
  nextDayV101Base();
};

const saveReadinessImportV101Base = saveReadinessImport;
saveReadinessImport = function(){
  const raw = document.getElementById("readinessImportText").value || "";
  const parsed = parseReadinessReport(raw);
  const result = calculateReadinessFromImport(parsed);
  const dayStamp = state.currentDayStamp || effectiveDayStampV101();

  state.readinessImport = {...parsed, ...result, dayStamp};
  archiveReadinessV101("import");
  saveState();
  hideModal();
  showReadinessResult();
};

const clearReadinessImportV101Base = clearReadinessImport;
clearReadinessImport = function(){
  archiveReadinessV101("cleared");
  delete state.readinessImport;
  saveState();
  hideModal();
};

function missedTrendV101(limit=7){
  ensureDailyStateV101();
  const recent = (state.workoutHistory || []).slice(-limit);
  const missed = recent.filter(x => x.status === "missed" || x.status === "skipped").length;
  const completed = recent.filter(x => x.status === "completed").length;
  return {recent, missed, completed};
}

function readinessHistoryTrendV101(limit=7){
  ensureDailyStateV101();
  const recent = (state.readinessHistory || []).slice(-limit);
  return {
    recent,
    green:recent.filter(r=>String(r.status).includes("Green")).length,
    yellow:recent.filter(r=>String(r.status).includes("Yellow")).length,
    red:recent.filter(r=>String(r.status).includes("Red")).length
  };
}

// Fold missed workouts into recovery intelligence.
const recoveryRecommendationV101Base = recoveryRecommendation;
recoveryRecommendation = function(){
  const base = recoveryRecommendationV101Base();
  const m = missedTrendV101();

  if(m.missed >= 2){
    return {
      level:"moderate",
      title:"Consistency Reset Recommended",
      message:"Recent missed or skipped workouts detected. RUUT will prioritize getting you back on rhythm before increasing load."
    };
  }

  return base;
};

// Fold missed workouts and readiness history into progression signals.
const progressionSignalsV101Base = progressionSignalsV99;
progressionSignalsV99 = function(){
  const s = progressionSignalsV101Base();
  const missed = missedTrendV101();
  const rh = readinessHistoryTrendV101();

  s.missedRecent = missed.missed;
  s.completedRecent = missed.completed;
  s.readinessHistory = rh;

  if(missed.missed >= 2){
    s.recommendation = "HOLD";
    s.title = "Rebuild Consistency";
    s.summary = "Recent missed workouts show rhythm has slipped. RUUT should hold progression until consistency returns.";
    s.action = "Do not increase load. Complete the next two scheduled workouts before progressing.";
    s.confidence = "High";
  }

  if(rh.red >= 2){
    s.recommendation = "REDUCE";
    s.title = "Recovery Trend Warning";
    s.summary = "Readiness history shows repeated Red days. RUUT should reduce load and prioritize recovery.";
    s.action = "Reduce next comparable workout by 10–15% or choose Recovery Mode.";
    s.confidence = "High";
  }

  return s;
};

function dailySystemCardV101(){
  ensureDailyStateV101();
  const today = state.currentDayStamp || effectiveDayStampV101();
  const daily = state.dailyStatus?.[today];
  const status = daily?.status || "awaiting workout";
  const readiness = state.readinessImport ? state.readinessImport.status : "Awaiting today's readiness import";
  const m = missedTrendV101();

  return `<section class="card hero" id="dailySystemV101" style="border-left:4px solid var(--accent2)">
    <div class="pill-row"><span class="pill accent">Daily System</span><span class="pill">${today}</span></div>
    <h3>${status === "completed" ? "Workout Completed" : "Ready for Today"}</h3>
    <p class="muted">Readiness: ${readiness}</p>
    <p class="muted">Recent: ${m.completed} completed / ${m.missed} missed or skipped</p>
    <p class="muted small">RUUT resets at 12:01 AM. If today's workout is not completed by then, it is logged as missed and the plan advances.</p>
  </section>`;
}

const renderTodayV101Base = renderToday;
renderToday = function(){
  runDailyMaintenanceV101();
  renderTodayV101Base();

  const today = document.getElementById("today");
  if(today && !document.getElementById("dailySystemV101")){
    today.insertAdjacentHTML("afterbegin", dailySystemCardV101());
  }
};

const renderAllV101Base = renderAll;
renderAll = function(){
  runDailyMaintenanceV101();
  renderAllV101Base();
};

const showScreenV101Base = showScreen;
showScreen = function(id,btn){
  runDailyMaintenanceV101();
  showScreenV101Base(id,btn);
};

// Run at startup and then check every minute while app is open.
runDailyMaintenanceV101();
setInterval(runDailyMaintenanceV101, 60000);


// ---------- V10.2 DYNAMIC PLAN MODIFICATION ----------
function dynamicPlanDecisionV102(){
  const prog = typeof progressionSignalsV99 === "function" ? progressionSignalsV99() : {recommendation:"HOLD", title:"Hold", summary:"No progression signal."};
  const readiness = typeof readinessLevelV96 === "function" ? readinessLevelV96() : "none";
  const missed = typeof missedTrendV101 === "function" ? missedTrendV101() : {missed:0, completed:0};
  const debrief = typeof debriefTrendV97 === "function" ? debriefTrendV97() : {heavyLegs:0, veryHard:0, pain:0};

  let decision = {
    mode:"HOLD",
    title:"Keep Original Plan",
    reason:"Training signals do not justify rewriting today’s plan.",
    amount:0
  };

  if(readiness === "red" || debrief.pain >= 1){
    decision = {
      mode:"RECOVERY",
      title:"Replace With Recovery",
      reason:"Readiness or recent pain suggests hard training is not the right call today.",
      amount:-1
    };
  }else if(prog.recommendation === "REDUCE" || missed.missed >= 2 || debrief.heavyLegs >= 2 || debrief.veryHard >= 2){
    decision = {
      mode:"REDUCE",
      title:"Reduce Today’s Plan",
      reason:"Recent fatigue, missed workouts, or debrief trends suggest a conservative adjustment.",
      amount:-0.10
    };
  }else if(prog.recommendation === "PROGRESS" && readiness === "green" && missed.missed === 0){
    decision = {
      mode:"PROGRESS",
      title:"Progress Today’s Plan",
      reason:"Readiness and recent debriefs suggest you may be ready for a small controlled increase.",
      amount:0.10
    };
  }

  return {decision, prog, readiness, missed, debrief};
}

function dynamicPlanKeyV102(){
  return `${state.currentDayStamp || (typeof effectiveDayStampV101 === "function" ? effectiveDayStampV101() : new Date().toISOString().slice(0,10))}-${currentKey()}`;
}

function getApprovedPlanV102(){
  state.dynamicPlanApprovals = state.dynamicPlanApprovals || {};
  return state.dynamicPlanApprovals[dynamicPlanKeyV102()] || null;
}

function setApprovedPlanV102(decision){
  state.dynamicPlanApprovals = state.dynamicPlanApprovals || {};
  state.dynamicPlanApprovals[dynamicPlanKeyV102()] = {
    ...decision,
    approved:true,
    approvedAt:new Date().toISOString()
  };
  saveState();
}

function clearApprovedPlanV102(){
  state.dynamicPlanApprovals = state.dynamicPlanApprovals || {};
  delete state.dynamicPlanApprovals[dynamicPlanKeyV102()];
  saveState();
}

function cloneForDynamicV102(x){
  try{return structuredClone(x)}catch(e){return JSON.parse(JSON.stringify(x))}
}

function applyDynamicPlanToWorkoutV102(workout, decision){
  const w = cloneForDynamicV102(workout);
  if(!decision || decision.mode === "HOLD") return w;

  w.dynamicPlanApplied = true;
  w.dynamicPlanMode = decision.mode;
  w.dynamicPlanReason = decision.reason;
  w.originalTitle = w.originalTitle || w.title;
  w.originalTime = w.originalTime || w.time;
  w.originalStructure = w.originalStructure || w.structure;

  if(decision.mode === "RECOVERY"){
    return {
      ...w,
      type:"rest",
      title:"Dynamic Recovery Day",
      time:"20–30 min",
      structure:"Easy walk, mobility, or flexibility. No hard intervals today.",
      distance:"Easy movement only",
      purpose:"Protect recovery while keeping the training habit alive.",
      terrain:"Flat, easy route or recovery/flexibility work.",
      effort:"Very easy. Finish feeling better.",
      success:"You moved, recovered, and did not force intensity.",
      caution:"Do not turn recovery into a hidden workout."
    };
  }

  if(w.type === "run"){
    const baseTotal = Number(w.total || 20);
    const factor = decision.mode === "PROGRESS" ? 1.10 : 0.90;
    const newTotal = Math.max(10, Math.round(baseTotal * factor));
    w.total = newTotal;
    w.time = `${newTotal} min`;
    w.title = `${decision.mode === "PROGRESS" ? "Progressed" : "Reduced"} ${w.originalTitle || w.title}`;
    w.structure = `${w.originalStructure || w.structure}. Dynamic plan: ${decision.mode === "PROGRESS" ? "increase" : "reduce"} total volume about 10%.`;
    w.effort = decision.mode === "PROGRESS" ? "Controlled push. Do not sprint." : "Conservative. Finish steady.";
    w.success = decision.mode === "PROGRESS" ? "Handle the added work without form falling apart." : "Complete the reduced workout feeling stable.";
  }

  if(w.type === "bodyweight"){
    if(decision.mode === "PROGRESS"){
      w.rounds = Math.min((w.rounds || 2) + 1, 6);
      w.title = "Progressed Bodyweight Strength";
      w.structure = `${w.rounds} rounds today. Dynamic plan: one additional round if form stays clean.`;
    }else{
      w.rounds = Math.max(1,(w.rounds || 2)-1);
      w.title = "Reduced Bodyweight Strength";
      w.structure = `${w.rounds} rounds today. Dynamic plan: one less round to protect recovery.`;
    }
    w.time = `${w.rounds} rounds`;
  }

  return w;
}

const currentWorkoutV102Base = currentWorkout;
currentWorkout = function(){
  const base = currentWorkoutV102Base();
  const approved = getApprovedPlanV102();
  return approved ? applyDynamicPlanToWorkoutV102(base, approved) : base;
};

function dynamicPlanPreviewV102(){
  const signal = dynamicPlanDecisionV102();
  const base = currentWorkoutV102Base();
  const approved = getApprovedPlanV102();
  const activeDecision = approved || signal.decision;
  const proposed = applyDynamicPlanToWorkoutV102(base, activeDecision);
  return {...signal, approved, activeDecision, base, proposed};
}

function renderDynamicPlanCardV102(){
  const today = document.getElementById("today");
  if(!today) return;

  const old = document.getElementById("dynamicPlanV102");
  if(old) old.remove();

  const p = dynamicPlanPreviewV102();
  const d = p.activeDecision;
  const color = d.mode === "PROGRESS" ? "var(--accent)" : d.mode === "REDUCE" || d.mode === "RECOVERY" ? "var(--danger)" : "var(--gold)";
  const status = p.approved ? "Applied" : "Suggested";

  const card = document.createElement("section");
  card.id = "dynamicPlanV102";
  card.className = "card hero";
  card.style.borderLeft = `4px solid ${color}`;
  card.innerHTML = `
    <div class="pill-row">
      <span class="pill accent">Dynamic Plan</span>
      <span class="pill">${d.mode}</span>
      <span class="pill">${status}</span>
    </div>
    <h3>${d.title}</h3>
    <p class="muted">${d.reason}</p>
    <div class="grid two">
      <div class="detail"><strong>Original</strong><p class="muted">${p.base.title}<br>${p.base.time || ""}</p></div>
      <div class="detail"><strong>RUUT Plan</strong><p class="muted">${p.proposed.title}<br>${p.proposed.time || ""}</p></div>
    </div>
    <div style="height:10px"></div>
    ${d.mode === "HOLD" ? `<button class="secondary" onclick="showDynamicPlanDetailV102()">View Reasoning</button>` :
      p.approved ? `<button class="secondary" onclick="clearDynamicPlanV102()">Use Original Plan</button><div style="height:8px"></div><button class="secondary" onclick="showDynamicPlanDetailV102()">View Reasoning</button>` :
      `<button onclick="approveDynamicPlanV102()">Apply RUUT Plan</button><div style="height:8px"></div><button class="secondary" onclick="showDynamicPlanDetailV102()">View Reasoning</button>`}
  `;

  const progression = document.getElementById("progressionCardV99");
  if(progression && progression.nextSibling){
    progression.parentNode.insertBefore(card, progression.nextSibling);
  }else{
    today.insertAdjacentElement("afterbegin", card);
  }
}

function approveDynamicPlanV102(){
  const d = dynamicPlanDecisionV102().decision;
  setApprovedPlanV102(d);
  showModal(`<h2>RUUT Plan Applied</h2>
    <p class="muted">${d.title}</p>
    <div class="detail"><strong>Reason</strong><p class="muted">${d.reason}</p></div>
    <div style="height:12px"></div>
    <button onclick="hideModal();renderAll()">Done</button>`);
}

function clearDynamicPlanV102(){
  clearApprovedPlanV102();
  showModal(`<h2>Original Plan Restored</h2>
    <p class="muted">RUUT will use the original scheduled workout for today.</p>
    <div style="height:12px"></div>
    <button onclick="hideModal();renderAll()">Done</button>`);
}

function showDynamicPlanDetailV102(){
  const p = dynamicPlanPreviewV102();
  const d = p.activeDecision;

  showModal(`<h2>Dynamic Plan Detail</h2>
    <div class="detail"><strong>Status</strong><p class="muted">${p.approved ? "Applied" : "Suggested"} — ${d.mode}</p></div>
    <div style="height:10px"></div>
    <div class="detail"><strong>Original Plan</strong><p class="muted">${p.base.title}<br>${p.base.time || ""}<br>${p.base.structure || ""}</p></div>
    <div style="height:10px"></div>
    <div class="detail"><strong>RUUT Plan</strong><p class="muted">${p.proposed.title}<br>${p.proposed.time || ""}<br>${p.proposed.structure || ""}</p></div>
    <div style="height:10px"></div>
    <div class="detail"><strong>Reason</strong><p class="muted">${d.reason}</p></div>
    <div style="height:10px"></div>
    <div class="detail"><strong>Signals</strong>
      <p class="muted">
        Progression: ${p.prog?.recommendation || "—"}<br>
        Readiness: ${p.readiness}<br>
        Recent missed: ${p.missed?.missed ?? 0}<br>
        Heavy legs: ${p.debrief?.heavyLegs ?? 0}<br>
        Very hard: ${p.debrief?.veryHard ?? 0}<br>
        Pain: ${p.debrief?.pain ?? 0}
      </p>
    </div>
    <div style="height:12px"></div>
    ${d.mode !== "HOLD" && !p.approved ? `<button onclick="hideModal();approveDynamicPlanV102()">Apply RUUT Plan</button><div style="height:8px"></div>` : ""}
    <button class="secondary" onclick="hideModal()">Done</button>`);
}

const renderTodayV102Base = renderToday;
renderToday = function(){
  renderTodayV102Base();
  setTimeout(renderDynamicPlanCardV102, 140);
};

const showScreenV102Base = showScreen;
showScreen = function(id,btn){
  showScreenV102Base(id,btn);
  if(id==="today") setTimeout(renderDynamicPlanCardV102, 140);
};

const renderAllV102Base = renderAll;
renderAll = function(){
  renderAllV102Base();
  setTimeout(renderDynamicPlanCardV102, 140);
};

setTimeout(renderDynamicPlanCardV102, 500);


// ---------- V10.3 WEEKLY REVIEW + STATUS TYPES + GOAL ENGINE + CONFIDENCE ----------
function coachProfileDefaultsV103(){
  return {goal:"Fat Loss",style:"Balanced",limitations:["Weak Ankles","Occasional Back Issues"]};
}
function getCoachProfileV103(){
  state.coachProfile = {...coachProfileDefaultsV103(), ...(state.coachProfile || {})};
  state.coachProfile.limitations = state.coachProfile.limitations || [];
  return state.coachProfile;
}
function saveCoachProfileV103(){
  const goal=document.getElementById("coachGoalV103")?.value||"Fat Loss";
  const style=document.getElementById("coachStyleV103")?.value||"Balanced";
  const limitations=Array.from(document.querySelectorAll("[data-limit-v103]")).filter(x=>x.checked).map(x=>x.value);
  state.coachProfile={goal,style,limitations};
  saveState();
  hideModal();
}
function openCoachProfileV103(){
  const p=getCoachProfileV103(), has=v=>p.limitations.includes(v);
  showModal(`<h2>Coach Memory</h2>
    <p class="muted" style="margin:8px 0 12px">Set the coaching context RUUT should remember when making decisions.</p>
    <label class="small muted">Primary Goal</label>
    <select id="coachGoalV103">
      ${["Fat Loss","Half Marathon","General Fitness","Trail Endurance","Mountain Conditioning"].map(g=>`<option ${p.goal===g?"selected":""}>${g}</option>`).join("")}
    </select>
    <div style="height:10px"></div>
    <label class="small muted">Coaching Style</label>
    <select id="coachStyleV103">
      ${["Encouraging","Balanced","Tough Love"].map(s=>`<option ${p.style===s?"selected":""}>${s}</option>`).join("")}
    </select>
    <div style="height:12px"></div>
    <div class="detail"><strong>Known Limitations</strong>
      <p class="muted small">These guide safer recommendations.</p>
      ${["Weak Ankles","Occasional Back Issues","Heavy Legs Trend","Low Energy Trend"].map(v=>`<label><input type="checkbox" data-limit-v103 value="${v}" ${has(v)?"checked":""}> ${v}</label><br>`).join("")}
    </div>
    <div style="height:12px"></div>
    <button onclick="saveCoachProfileV103()">Save Coach Memory</button>
    <div style="height:8px"></div>
    <button class="secondary" onclick="hideModal()">Cancel</button>`);
}

function statusTypeForWorkoutV103(){
  const w=currentWorkout();
  const approved=typeof getApprovedPlanV102==="function"?getApprovedPlanV102():null;
  if(w?.type==="rest" && approved?.mode==="RECOVERY") return "Recovery Substitution";
  if(w?.type==="rest") return "Planned Rest";
  if(approved && approved.mode && approved.mode!=="HOLD") return "Modified Workout";
  return "Completed";
}

const markDailyStatusV103Base = typeof markDailyStatusV101 === "function" ? markDailyStatusV101 : null;
markDailyStatusV101 = function(status,key=currentKey(),dayStamp=state.currentDayStamp || (typeof effectiveDayStampV101==="function"?effectiveDayStampV101():new Date().toISOString().slice(0,10))){
  const normalized=status==="completed"?statusTypeForWorkoutV103():status;
  if(markDailyStatusV103Base) return markDailyStatusV103Base(normalized,key,dayStamp);
  state.dailyStatus=state.dailyStatus||{};
  state.dailyStatus[dayStamp]={key,status:normalized,updatedAt:new Date().toISOString()};
};

function statusCountsV103(days=7){
  const hist=(state.workoutHistory||[]).slice(-days);
  const counts={Completed:0,"Modified Workout":0,"Recovery Substitution":0,"Planned Rest":0,missed:0,skipped:0};
  hist.forEach(x=>{const s=x.status||""; if(counts[s]!==undefined) counts[s]++;});
  return {hist,counts};
}
function recommendationConfidenceV103(){
  const deb=(state.workoutDebriefs||[]).length;
  const ready=(state.readinessHistory||[]).length+(state.readinessImport?1:0);
  const hist=(state.workoutHistory||[]).length;
  const total=deb+ready+hist;
  if(total>=21 && deb>=6 && ready>=5) return {label:"High",reason:"RUUT has enough readiness, completion, and debrief history to make stronger recommendations."};
  if(total>=8 && deb>=2) return {label:"Moderate",reason:"RUUT has some useful history, but recommendations should still be treated as guidance."};
  return {label:"Low",reason:"RUUT is still learning. Use recommendations carefully until more workouts and readiness reports are logged."};
}
function weeklyCoachReviewV103(){
  const s=statusCountsV103(7);
  const deb=(state.workoutDebriefs||[]).slice(-7);
  const ready=(state.readinessHistory||[]).slice(-7);
  if(state.readinessImport) ready.push(state.readinessImport);
  const green=ready.filter(r=>String(r.status).includes("Green")).length;
  const yellow=ready.filter(r=>String(r.status).includes("Yellow")).length;
  const red=ready.filter(r=>String(r.status).includes("Red")).length;
  const pain=deb.filter(d=>d.issue==="Pain").length;
  const heavy=deb.filter(d=>d.issue==="Heavy Legs").length;
  const veryHard=deb.filter(d=>d.feel==="Very Hard").length;
  let assessment="Consistency is building. Keep following the plan and logging debriefs.";
  if(pain>0 || red>=2) assessment="Recovery needs attention. Pain or repeated Red readiness means progression should pause.";
  else if(s.counts.Completed+s.counts["Modified Workout"]>=4 && pain===0 && red===0) assessment="Consistency looks strong. RUUT can continue steady progression if workouts remain controlled.";
  else if(s.counts.missed+s.counts.skipped>=2) assessment="Consistency slipped this week. Rebuild rhythm before increasing training load.";
  else if(heavy>=2 || veryHard>=2) assessment="Fatigue is showing. Hold current load and prioritize clean completion.";
  return {status:s,deb,ready:{green,yellow,red},pain,heavy,veryHard,assessment};
}
function renderWeeklyReviewCardV103(){
  const today=document.getElementById("today"); if(!today) return;
  document.getElementById("weeklyReviewV103")?.remove();
  const r=weeklyCoachReviewV103(), c=recommendationConfidenceV103();
  const card=document.createElement("section");
  card.id="weeklyReviewV103"; card.className="card hero"; card.style.borderLeft="4px solid var(--accent2)";
  card.innerHTML=`<div class="pill-row"><span class="pill accent">Weekly Coach Review</span><span class="pill">Confidence: ${c.label}</span></div>
    <h3>Last 7 Days</h3><p class="muted">${r.assessment}</p>
    <div class="grid two">
      <div class="stat"><span class="muted small">Completed</span><strong>${r.status.counts.Completed+r.status.counts["Modified Workout"]}</strong></div>
      <div class="stat"><span class="muted small">Missed/Skipped</span><strong>${r.status.counts.missed+r.status.counts.skipped}</strong></div>
      <div class="stat"><span class="muted small">Recovery Subs</span><strong>${r.status.counts["Recovery Substitution"]}</strong></div>
      <div class="stat"><span class="muted small">Red Readiness</span><strong>${r.ready.red}</strong></div>
    </div>
    <div style="height:10px"></div><button class="secondary" onclick="showWeeklyReviewDetailV103()">View Weekly Review</button>`;
  const dynamic=document.getElementById("dynamicPlanV102");
  if(dynamic && dynamic.nextSibling) dynamic.parentNode.insertBefore(card,dynamic.nextSibling); else today.appendChild(card);
}
function showWeeklyReviewDetailV103(){
  const r=weeklyCoachReviewV103(), c=recommendationConfidenceV103();
  showModal(`<h2>Weekly Coach Review</h2>
    <div class="detail"><strong>Assessment</strong><p class="muted">${r.assessment}</p></div>
    <div style="height:10px"></div>
    <div class="detail"><strong>Confidence</strong><p class="muted">${c.label}: ${c.reason}</p></div>
    <div style="height:10px"></div>
    <div class="grid two">
      <div class="stat"><span class="muted small">Completed</span><strong>${r.status.counts.Completed}</strong></div>
      <div class="stat"><span class="muted small">Modified</span><strong>${r.status.counts["Modified Workout"]}</strong></div>
      <div class="stat"><span class="muted small">Recovery Subs</span><strong>${r.status.counts["Recovery Substitution"]}</strong></div>
      <div class="stat"><span class="muted small">Missed/Skipped</span><strong>${r.status.counts.missed+r.status.counts.skipped}</strong></div>
      <div class="stat"><span class="muted small">Green</span><strong>${r.ready.green}</strong></div>
      <div class="stat"><span class="muted small">Yellow/Red</span><strong>${r.ready.yellow+r.ready.red}</strong></div>
    </div>
    <div style="height:12px"></div><button onclick="hideModal()">Done</button>`);
}

const progressionSignalsV103Base=progressionSignalsV99;
progressionSignalsV99=function(){
  const s=progressionSignalsV103Base();
  const conf=recommendationConfidenceV103();
  const weekly=weeklyCoachReviewV103();
  s.confidence=conf.label; s.confidenceReason=conf.reason;
  if(weekly.status.counts["Recovery Substitution"]>=2){
    s.recommendation="HOLD";
    s.title="Hold After Recovery Substitutions";
    s.summary="Multiple recovery substitutions suggest the plan should stabilize before adding load.";
    s.action="Hold current training load until recovery substitutions drop.";
  }
  return s;
};
function coachMemoryTextV103(){
  const p=getCoachProfileV103();
  let advice=`Goal: ${p.goal}. Coaching Style: ${p.style}.`;
  if(p.limitations.includes("Weak Ankles")) advice+=" Protect ankles on trails and avoid reckless downhill efforts.";
  if(p.limitations.includes("Occasional Back Issues")) advice+=" Keep strength work clean and avoid forcing reps if the back tightens.";
  if(p.goal==="Half Marathon") advice+=" Prioritize aerobic consistency and long-run patience.";
  if(p.goal==="Fat Loss") advice+=" Consistency, walking volume, and recovery matter more than all-out intensity.";
  return advice;
}
const buildCoachNotesV103Base=buildCoachNotesV98;
buildCoachNotesV98=function(){
  const n=buildCoachNotesV103Base();
  const conf=recommendationConfidenceV103();
  n.mainRecommendation=`${n.mainRecommendation} ${coachMemoryTextV103()} Confidence: ${conf.label}.`;
  return n;
};
const renderCoachMemoryCardV103Base=typeof renderCoachMemoryCardV10==="function"?renderCoachMemoryCardV10:null;
renderCoachMemoryCardV10=function(){
  if(renderCoachMemoryCardV103Base) renderCoachMemoryCardV103Base();
  const card=document.getElementById("coachMemoryV10");
  if(card && !card.innerHTML.includes("Edit Coach Memory")){
    card.insertAdjacentHTML("beforeend",`<div style="height:10px"></div><button class="secondary" onclick="openCoachProfileV103()">Edit Coach Memory</button>`);
  }
};
function renderStatusLegendV103(){
  const today=document.getElementById("today"); if(!today) return;
  document.getElementById("statusLegendV103")?.remove();
  const card=document.createElement("section");
  card.id="statusLegendV103"; card.className="card";
  card.innerHTML=`<strong>Workout Status Types</strong><p class="muted small">RUUT now separates Completed, Modified Workout, Recovery Substitution, Planned Rest, Missed, and Skipped so the coach logic can tell the difference.</p>`;
  today.appendChild(card);
}
const renderTodayV103Base=renderToday;
renderToday=function(){renderTodayV103Base(); setTimeout(()=>{renderWeeklyReviewCardV103(); renderStatusLegendV103();},180);};
const showScreenV103Base=showScreen;
showScreen=function(id,btn){showScreenV103Base(id,btn); if(id==="today") setTimeout(()=>{renderWeeklyReviewCardV103(); renderStatusLegendV103();},180);};
const renderAllV103Base=renderAll;
renderAll=function(){renderAllV103Base(); setTimeout(()=>{renderWeeklyReviewCardV103(); renderStatusLegendV103();},180);};
setTimeout(()=>{renderWeeklyReviewCardV103(); renderStatusLegendV103();},700);


// ---------- V10.4 REMOVE APPLE HEALTH READINESS IMPORT ----------
function removeReadinessUIV104(){
  document.querySelectorAll("#readinessCardV951, [data-ruut-readiness-card='true']").forEach(el=>el.remove());

  const today = document.getElementById("today");
  if(today){
    Array.from(today.querySelectorAll("section.card.hero")).forEach(section=>{
      const t = (section.innerText || "").trim();
      if(
        t.includes("No Readiness Imported") ||
        t.includes("Paste Readiness Report") ||
        t.includes("View Readiness") ||
        t.startsWith("Readiness")
      ){
        section.remove();
      }
    });
  }
}

openReadinessImport = function(){
  showModal(`<h2>Readiness Import Removed</h2>
    <p class="muted">RUUT no longer uses pasted Apple Health readiness reports because the Shortcut data was not accurate enough.</p>
    <p class="muted">Training decisions now rely on workout completion, missed days, workout debriefs, recovery substitutions, and coach memory.</p>
    <button onclick="hideModal()">Done</button>`);
};

showReadinessResult = openReadinessImport;

clearReadinessImport = function(){
  delete state.readinessImport;
  saveState();
  hideModal();
};

delete state.readinessImport;
localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

function readinessLevelV96(){
  return "none";
}

function coachReadinessSummaryV98(){
  return {
    status:"Not used",
    line:"Apple Health readiness import is disabled. RUUT is using your workout history, debriefs, missed days, and coach memory instead.",
    tone:"neutral"
  };
}

function buildReadinessCoachNoteV953(){
  return "Readiness import is disabled. RUUT now adapts from your real training behavior and post-workout feedback.";
}

function calculateReadinessFromImport(){
  return {
    status:"Not used",
    flags:[],
    notes:["Readiness import disabled."],
    recommendation:"Use workout debriefs and training history."
  };
}

startWorkout = function(){
  workoutAbort=false;
  skipCurrentTimer=false;
  workoutPaused=false;
  beginWorkout("normal");
};

progressionSignalsV99 = function(){
  const deb = (state.workoutDebriefs || []).slice(-7);
  const missedData = typeof missedTrendV101 === "function" ? missedTrendV101() : {missed:0,completed:0};
  const statusData = typeof statusCountsV103 === "function" ? statusCountsV103(7) : {counts:{}};
  const conf = typeof recommendationConfidenceV103 === "function"
    ? recommendationConfidenceV103()
    : {label:"Low",reason:"RUUT is still learning."};

  let easy=0, moderate=0, hard=0, veryHard=0, issues=0, pain=0, heavyLegs=0, lowEnergy=0, breathing=0;

  deb.forEach(d=>{
    if(d.feel==="Easy") easy++;
    if(d.feel==="Moderate") moderate++;
    if(d.feel==="Hard") hard++;
    if(d.feel==="Very Hard") veryHard++;
    if(d.issue && d.issue!=="None" && d.issue!=="Not recorded") issues++;
    if(d.issue==="Pain") pain++;
    if(d.issue==="Heavy Legs") heavyLegs++;
    if(d.issue==="Low Energy") lowEnergy++;
    if(d.issue==="Breathing") breathing++;
  });

  let recommendation = "HOLD";
  let title = "Hold Current Load";
  let summary = "RUUT is using debriefs, missed workouts, recovery substitutions, and completion history. Current signals do not justify increasing load yet.";
  let action = "Keep this week as written.";

  const recoverySubs = statusData.counts?.["Recovery Substitution"] || 0;
  const missed = (missedData.missed || 0) + (statusData.counts?.skipped || 0);

  if(pain >= 1 || recoverySubs >= 2 || veryHard >= 2 || heavyLegs >= 2){
    recommendation = "REDUCE";
    title = "Reduce Training Load";
    summary = "Recent debriefs or recovery substitutions show fatigue risk. RUUT should reduce load before adding more stress.";
    action = "Reduce the next comparable workout by 10–15%, or choose Recovery Mode if symptoms persist.";
  }else if(missed >= 2){
    recommendation = "HOLD";
    title = "Rebuild Consistency";
    summary = "Recent missed or skipped workouts show rhythm has slipped. RUUT should rebuild consistency before progressing.";
    action = "Complete the next two scheduled workouts before increasing load.";
  }else if(deb.length >= 3 && easy >= 2 && issues === 0 && missed === 0){
    recommendation = "PROGRESS";
    title = "Progression Available";
    summary = "Recent workouts are trending manageable with no reported issues. RUUT can consider a small controlled progression.";
    action = "Increase the next comparable workout slightly: about 5–10% volume, or finish the final interval with controlled effort.";
  }else if(hard >= 2 || lowEnergy >= 1 || breathing >= 2){
    recommendation = "HOLD";
    title = "Hold and Stabilize";
    summary = "Training is productive but not ready for an increase. Hold the current level and avoid bonus work.";
    action = "Complete the plan as written with clean form and controlled effort.";
  }

  return {
    deb,
    easy, moderate, hard, veryHard, issues, pain, heavyLegs, lowEnergy, breathing,
    missedRecent:missedData.missed || 0,
    completedRecent:missedData.completed || 0,
    readiness:"Disabled",
    recommendation,
    title,
    summary,
    action,
    confidence:conf.label,
    confidenceReason:conf.reason
  };
};

function coachDataModeCardV104(){
  return `<section class="card hero" id="coachDataModeV104" style="border-left:4px solid var(--accent2)">
    <div class="pill-row"><span class="pill accent">Coach Data Mode</span><span class="pill">Training History</span></div>
    <h3>Readiness Import Disabled</h3>
    <p class="muted">RUUT is no longer using pasted Apple Health readiness reports.</p>
    <p class="muted small">Current intelligence uses completed workouts, missed days, debriefs, recovery substitutions, dynamic plan choices, and coach memory.</p>
  </section>`;
}

const dailySystemCardV104Base = typeof dailySystemCardV101 === "function" ? dailySystemCardV101 : null;
dailySystemCardV101 = function(){
  const today = state.currentDayStamp || (typeof effectiveDayStampV101==="function" ? effectiveDayStampV101() : new Date().toISOString().slice(0,10));
  const daily = state.dailyStatus?.[today];
  const status = daily?.status || "awaiting workout";
  const m = typeof missedTrendV101 === "function" ? missedTrendV101() : {completed:0,missed:0};

  return `<section class="card hero" id="dailySystemV101" style="border-left:4px solid var(--accent2)">
    <div class="pill-row"><span class="pill accent">Daily System</span><span class="pill">${today}</span></div>
    <h3>${status === "completed" || status === "Completed" || status === "Modified Workout" ? "Workout Logged" : "Ready for Today"}</h3>
    <p class="muted">Status: ${status}</p>
    <p class="muted">Recent: ${m.completed || 0} completed / ${m.missed || 0} missed or skipped</p>
    <p class="muted small">RUUT resets at 12:01 AM. If today's workout is not completed by then, it is logged as missed and the plan advances.</p>
  </section>`;
};

const renderTodayV104Base = renderToday;
renderToday = function(){
  renderTodayV104Base();
  setTimeout(()=>{
    removeReadinessUIV104();
    const today = document.getElementById("today");
    if(today && !document.getElementById("coachDataModeV104")){
      const daily = document.getElementById("dailySystemV101");
      if(daily && daily.nextSibling){
        daily.insertAdjacentHTML("afterend", coachDataModeCardV104());
      }else{
        today.insertAdjacentHTML("afterbegin", coachDataModeCardV104());
      }
    }
  },250);
};

const showScreenV104Base = showScreen;
showScreen = function(id,btn){
  showScreenV104Base(id,btn);
  setTimeout(removeReadinessUIV104,250);
};

const renderAllV104Base = renderAll;
renderAll = function(){
  renderAllV104Base();
  setTimeout(removeReadinessUIV104,250);
};

setTimeout(removeReadinessUIV104,500);




// ---------- V14.0 FINAL STABLE WORKOUT SYSTEM ----------
/*
  Final stabilization release.

  Active workouts now use iPhone system voice only.
  Recorded MP3 voice-pack workout paths are removed from active workouts because browser audio does not reliably survive Apple Music and Apple Workout.

  One controller owns:
  - startWorkout
  - beginWorkout
  - warmup
  - run/walk segments
  - halfway
  - cooldown
  - completion
  - skip
  - pause
*/

let ruut14Resolve = null;
let ruut14Skipped = false;
let ruut14LastCue = { key:"", at:0 };
let ruut14SpeechQueue = Promise.resolve();

function ruut14Style(){
  const s = String(settings.coachStyle || "balanced").toLowerCase();
  if(s.includes("tough")) return "tough";
  if(s.includes("trail")) return "trail";
  return "balanced";
}

function ruut14StyleLabel(){
  const s = ruut14Style();
  if(s === "tough") return "Tough Love";
  if(s === "trail") return "Trail Guide";
  return "Balanced";
}

function ruut14CueText(key){
  const balanced = {
    warmup_start:"Begin your warmup. Take it easy and prepare your body.",
    run_start:"Run now. Find a steady pace and stay relaxed.",
    walk_recovery:"Recovery interval. Slow down, breathe, and reset.",
    halfway:"You're halfway there. Stay consistent and keep moving forward.",
    cooldown_start:"Begin your cooldown. Let your heart rate come down gradually.",
    workout_complete:"Workout complete. Nice work today.",
    rest_day:"Today is a rest day. Recovery is part of training.",
    recovery_substitution:"Recovery comes first today. Move easily and let your body absorb the training.",
    strength_begin:"Strength work starts now. Focus on control and form.",
    next_exercise:"Next exercise. Get set and begin."
  };

  const tough = {
    warmup_start:"Begin your warmup. Prepare the body. Prepare the mind. The mission starts here.",
    run_start:"Move. Set your pace and stay disciplined. Every step has a purpose.",
    walk_recovery:"Recovery phase. Control your breathing. Regain your composure. Prepare for the next effort.",
    halfway:"Halfway complete. The standard has not changed. Stay focused and finish the mission.",
    cooldown_start:"Mission complete. Begin recovery procedures. Bring your heart rate down and recover with intent.",
    workout_complete:"Workout complete. You met the standard today. Well done. Prepare for the next mission.",
    rest_day:"Today is a recovery day. Recovery is training. Use it wisely and return ready for action.",
    recovery_substitution:"Recovery operation in progress. Move with purpose, recover completely, and prepare for the next challenge.",
    strength_begin:"Strength training begins now. Every repetition counts. Execute with precision.",
    next_exercise:"Next exercise. Get set and begin."
  };

  const trail = {
    warmup_start:"Begin your warmup. Start easy and settle into the day.",
    run_start:"Run smooth. Light feet and steady breathing.",
    walk_recovery:"Walk now. Recover and take in the air.",
    halfway:"Halfway point. Turn back toward home and stay steady.",
    cooldown_start:"Cooldown begins. Walk easy and bring the breathing down.",
    workout_complete:"Workout complete. Good miles today.",
    rest_day:"Rest day. Keep it light and let the body recover.",
    recovery_substitution:"Recovery comes first today. Move easy and let the body reset.",
    strength_begin:"Strength work begins. Move with control.",
    next_exercise:"Next exercise. Set your position and move clean."
  };

  const style = ruut14Style();
  if(style === "tough") return tough[key] || balanced[key] || "";
  if(style === "trail") return trail[key] || balanced[key] || "";
  return balanced[key] || "";
}

function ruut14StopVoice(){
  try{ if(window.speechSynthesis) window.speechSynthesis.cancel(); }catch(e){}
  ruut14SpeechQueue = Promise.resolve();
}

function ruut14Speak(text){
  const phrase = String(text || "").trim();
  if(!phrase || !("speechSynthesis" in window)) return Promise.resolve(false);

  ruut14SpeechQueue = ruut14SpeechQueue
    .catch(()=>{})
    .then(()=>new Promise(resolve=>{
      try{
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();

        const u = new SpeechSynthesisUtterance(phrase);
        u.rate = settings.voiceRate || 0.95;
        u.pitch = 1;
        u.volume = 1;

        try{
          const voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
          const selected = voices.find(v => v.voiceURI === settings.voiceURI);
          if(selected) u.voice = selected;
        }catch(e){}

        let done = false;
        const finish = () => {
          if(done) return;
          done = true;
          resolve(true);
        };

        u.onend = finish;
        u.onerror = finish;
        window.speechSynthesis.speak(u);
        setTimeout(finish, Math.max(1500, phrase.length * 85));
      }catch(e){
        resolve(false);
      }
    }));

  return ruut14SpeechQueue;
}

function ruut14Cue(key){
  const now = Date.now();
  if(ruut14LastCue.key === key && now - ruut14LastCue.at < 1200) return Promise.resolve(false);
  ruut14LastCue = { key, at:now };
  if(state.voiceCoach?.enabled === false) return Promise.resolve(false);
  return ruut14Speak(ruut14CueText(key));
}

function ruut14ShowWorkout(){
  document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
  const workout = document.getElementById("workout");
  if(workout) workout.classList.add("active");
  document.querySelectorAll("nav button").forEach(b=>b.classList.remove("active"));
  const navBtns = document.querySelectorAll("nav button");
  if(navBtns[1]) navBtns[1].classList.add("active");
  renderWorkout();
}

function ruut14TimerRun(seconds, remainingBefore=seconds, total=seconds){
  return new Promise(resolve=>{
    let left = Math.max(0, seconds);
    let elapsed = 0;
    let finished = false;

    ruut14Skipped = false;
    skipCurrentTimer = false;

    clearInterval(activeTimer);
    activeTimer = null;
    updateTimer(left, remainingBefore, total);

    const finish = (skipped=false) => {
      if(finished) return;
      finished = true;
      clearInterval(activeTimer);
      activeTimer = null;
      activeTimerResolve = null;
      ruut14Resolve = null;
      resolve({ skipped, credited: skipped ? 0 : seconds });
    };

    ruut14Resolve = () => finish(true);
    activeTimerResolve = () => finish(true);

    activeTimer = setInterval(()=>{
      if(workoutAbort){
        finish(true);
        return;
      }
      if(ruut14Skipped || skipCurrentTimer){
        finish(true);
        return;
      }
      if(workoutPaused) return;

      left--;
      elapsed++;
      updateTimer(left, Math.max(0, remainingBefore - elapsed), total);

      if(left <= 0) finish(false);
    },1000);
  });
}

async function ruut14Warmup(){
  if(!settings.warmup) return { skipped:false, credited:0 };

  setCue("Warmup");
  setTimer("2:00");
  setWorkoutMessage("Warmup: march, leg swings, calf raises, easy movement. Tap Skip Current Step to move ahead.");
  ruut14Cue("warmup_start");

  return ruut14TimerRun(120,120,120);
}

async function ruut14Cooldown(){
  setCue("Cooldown");
  setWorkoutMessage("Cooldown: easy walk, calves, hips, hamstrings. Tap Skip Current Step to finish.");
  ruut14Cue("cooldown_start");

  return ruut14TimerRun(180,180,180);
}

async function ruut14RunSegment(label, seconds, remaining, total){
  setCue(label.toUpperCase());
  setWorkoutMessage(label === "Run" ? "Stay controlled. Smooth is fast." : "Recover. Keep moving.");
  ruut14Cue(label === "Run" ? "run_start" : "walk_recovery");

  return ruut14TimerRun(seconds, remaining, total);
}

async function ruut14StartRun(x, readiness="normal"){
  let total = Number(x.total || 0) * 60;
  if(!total || total < 1) total = 60;
  if(readiness === "tired") total = Math.round(total * 0.8);

  const runSeconds = Number(x.runSeconds || 60);
  const walkSeconds = Number(x.walkSeconds || 60);

  let remaining = total;
  let credited = 0;
  const halfwayAt = Math.max(1, Math.floor(total / 2));
  let halfwayPlayed = false;

  await ruut14Warmup();
  if(workoutAbort) return;

  while(remaining > 0 && !workoutAbort){
    const runDur = Math.min(runSeconds, remaining);
    const runResult = await ruut14RunSegment("Run", runDur, remaining, total);
    remaining -= runDur;

    if(!runResult.skipped){
      credited += runDur;
      if(!halfwayPlayed && credited >= halfwayAt){
        halfwayPlayed = true;
        setCue("TURN BACK");
        setWorkoutMessage("Halfway point. Turn back now.");
        ruut14Cue("halfway");
      }
    }

    if(workoutAbort || remaining <= 0) break;

    const walkDur = Math.min(walkSeconds, remaining);
    const walkResult = await ruut14RunSegment("Walk", walkDur, remaining, total);
    remaining -= walkDur;

    if(!walkResult.skipped){
      credited += walkDur;
      if(!halfwayPlayed && credited >= halfwayAt){
        halfwayPlayed = true;
        setCue("TURN BACK");
        setWorkoutMessage("Halfway point. Turn back now.");
        ruut14Cue("halfway");
      }
    }
  }

  if(settings.cooldown && !workoutAbort) await ruut14Cooldown();
  if(workoutAbort) return;

  setCue("Complete");
  setTimer("DONE");
  setWorkoutMessage("Workout complete. Good work.");
  ruut14Cue("workout_complete");

  markComplete(false);
  releaseWakeLock();

  if(typeof openWorkoutDebriefV97 === "function") {
    openWorkoutDebriefV97();
  } else {
    showModal(`<h2>Workout Complete</h2><button onclick="hideModal()">Done</button>`);
  }
}

async function ruut14StartStrength(x, readiness="normal"){
  await ruut14Warmup();
  if(workoutAbort) return;

  let rounds = Number(x.rounds || 1);
  if(readiness === "tired") rounds = Math.max(1, rounds - 1);

  ruut14Cue("strength_begin");

  for(let r=1; r<=rounds && !workoutAbort; r++){
    setCue(`Round ${r}`);
    for(const e of (x.exercises || [])){
      if(workoutAbort) return;

      setCue(e.name || "Exercise");
      setWorkoutMessage(`${e.name || "Exercise"}`);
      ruut14Cue("next_exercise");

      if(e.mode === "timed"){
        await ruut14TimerRun(Number(e.seconds || 30), Number(e.seconds || 30), Number(e.seconds || 30));
      }else{
        setTimer("DONE?");
        setWorkoutMessage(`${e.name || "Exercise"}. ${e.reps || ""}. Tap Done when finished.`);
        await waitForDone(e.name, e.reps);
      }
    }
  }

  if(settings.cooldown && !workoutAbort) await ruut14Cooldown();
  if(workoutAbort) return;

  setCue("Complete");
  setTimer("DONE");
  setWorkoutMessage("Workout complete. Good work.");
  ruut14Cue("workout_complete");

  markComplete(false);
  releaseWakeLock();
  if(typeof openWorkoutDebriefV97 === "function") openWorkoutDebriefV97();
}

function ruut14StartRest(x){
  setWorkoutMessage("Rest day. Light walking only.");
  setCue("Rest Day");
  setTimer("REST");
  ruut14Cue("rest_day");
}

async function startWorkout(){
  ruut14StopVoice();

  workoutAbort = false;
  skipCurrentTimer = false;
  workoutPaused = false;
  ruut14Skipped = false;
  ruut14LastCue = { key:"", at:0 };

  const x = currentWorkout();
  if(!x){
    showModal(`<h2>Workout Error</h2><p class="muted">No workout found for today.</p><button onclick="hideModal()">Done</button>`);
    return;
  }

  ruut14ShowWorkout();

  try{ requestWakeLock(); }catch(e){}

  // No startup cue. Warmup is first.

  if(x.type === "run") return ruut14StartRun(x, "normal");
  if(x.type === "bodyweight") return ruut14StartStrength(x, "normal");
  return ruut14StartRest(x);
}

function beginWorkout(readiness){
  return startWorkout();
}

function skipCurrent(){
  ruut14StopVoice();
  ruut14Skipped = true;
  skipCurrentTimer = true;
  workoutPaused = false;

  updatePauseButton();
  setCue("Next");
  setTimer("NEXT");
  setWorkoutMessage("Moving to the next step...");

  if(ruut14Resolve) ruut14Resolve();
  else if(activeTimerResolve) activeTimerResolve();

  if(window.resolveDone){
    try{ window.resolveDone(); }catch(e){}
  }
}

function togglePause(){
  ruut14StopVoice();
  workoutPaused = !workoutPaused;

  if(workoutPaused){
    setCue("Paused");
    setWorkoutMessage("Paused. Tap Resume to continue from here.");
  }else{
    setCue("Resume");
    setWorkoutMessage("Resuming workout.");
  }
  updatePauseButton();
}

function showHalfway(){
  // Halfway is owned only by ruut14StartRun.
  return false;
}

function speak(text){ return ruut14Speak(text); }
async function cue(text){
  const lower = String(text || "").toLowerCase();
  if(lower.includes("warm")) return ruut14Cue("warmup_start");
  if(lower.includes("cooldown")) return ruut14Cue("cooldown_start");
  if(lower.includes("workout complete") || lower.includes("complete")) return ruut14Cue("workout_complete");
  if(lower.includes("rest day")) return ruut14Cue("rest_day");
  if(lower.includes("run")) return ruut14Cue("run_start");
  if(lower.includes("walk") || lower.includes("recover")) return ruut14Cue("walk_recovery");
  return Promise.resolve(false);
}

function openVoiceSettingsV105(){
  state.voiceCoach = state.voiceCoach || {};
  if(state.voiceCoach.enabled === undefined) state.voiceCoach.enabled = true;

  showModal(`<h2>Voice Coach</h2>
    <p class="muted">Active workouts now use iPhone system voice for reliability with Apple Music and Apple Workout.</p>

    <div class="detail">
      <strong>Active Coach Style</strong>
      <p class="muted">${ruut14StyleLabel()}</p>
      <p class="muted small">Change this from Settings → Coach Style.</p>
    </div>

    <div style="height:10px"></div>
    <label><input type="checkbox" id="voiceCoachEnabledV14" ${state.voiceCoach.enabled !== false ? "checked" : ""}> Use voice coaching</label>

    <p class="muted small" style="margin-top:10px">Recorded voice packs have been removed from active workouts because browser audio does not reliably survive Apple Music and Apple Workout.</p>

    <div style="height:12px"></div>
    <button onclick="saveVoiceSettingsV105()">Save Voice Settings</button>
    <div style="height:8px"></div>
    <button class="secondary" onclick="ruut14Cue('warmup_start')">Test Voice</button>
    <div style="height:8px"></div>
    <button class="secondary" onclick="hideModal()">Cancel</button>`);
}

function saveVoiceSettingsV105(){
  state.voiceCoach = state.voiceCoach || {};
  state.voiceCoach.enabled = !!document.getElementById("voiceCoachEnabledV14")?.checked;
  state.voiceCoach.audioMode = "system";
  state.voiceCoach.pack = ruut14Style();
  saveState();
  hideModal();
}

function coachTabVoiceCardV111(){
  state.voiceCoach = state.voiceCoach || {};
  const enabled = state.voiceCoach.enabled !== false;

  return `<section class="card hero">
    <div class="pill-row"><span class="pill accent">Voice Coach</span><span class="pill">${enabled ? "Enabled" : "Disabled"}</span><span class="pill">System Voice</span></div>
    <h3>Reliable Workout Voice</h3>
    <p class="muted">Active workouts use iPhone system voice so prompts work better with Apple Music and Apple Workout.</p>
    <p class="muted small">Coach Style still changes the spoken language.</p>
    <div class="grid two">
      <button class="secondary" onclick="openVoiceSettingsV105()">Voice Settings</button>
      <button class="secondary" onclick="ruut14Cue('warmup_start')">Test Voice</button>
    </div>
  </section>`;
}

window.startWorkout = startWorkout;
window.beginWorkout = beginWorkout;
window.skipCurrent = skipCurrent;
window.togglePause = togglePause;
window.showHalfway = showHalfway;
window.speak = speak;
window.cue = cue;
window.openVoiceSettingsV105 = openVoiceSettingsV105;
window.saveVoiceSettingsV105 = saveVoiceSettingsV105;
window.coachTabVoiceCardV111 = coachTabVoiceCardV111;

document.addEventListener("click", function(e){
  const label = String(e.target?.textContent || "").trim().toLowerCase();
  if(label === "start workout" || label === "start guided workout"){
    e.preventDefault();
    e.stopPropagation();
    window.startWorkout();
  }
}, true);

// ---------- V14.2 FINAL TODAY + WORKOUT STABILITY ----------
/*
  Final UI/workout stabilization:
  - Today page starts with one clean Guided Workout Mission card.
  - Removes stale injected cards from older readiness/adaptive/weekly/status systems.
  - Start Guided Workout calls the final v14 system voice workout controller.
  - Workout screen stays simple and functional.
*/

function ruut142DateLabel(){
  try{
    return new Date().toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric",year:"numeric"});
  }catch(e){
    return new Date().toLocaleDateString();
  }
}

function ruut142SimpleMissionCard(){
  const x = currentWorkout();
  const w = currentWeek ? currentWeek() : {theme:""};
  const typeLabel = x.type === "bodyweight" ? "strength" : x.type;

  const exerciseList = x.type === "bodyweight" && Array.isArray(x.exercises)
    ? `<div class="list">${x.exercises.map(e=>`
        <div class="exercise"><span>${e.name}</span><strong>${e.mode==="timed" ? e.seconds+" sec" : e.reps}</strong></div>
      `).join("")}</div>`
    : "";

  return `<section class="card hero" id="todayMissionCardV142">
    <div class="pill-row">
      <span class="pill accent">Today's Mission</span>
      <span class="pill">${ruut142DateLabel()}</span>
      <span class="pill">Week ${state.week}</span>
      <span class="pill">Day ${state.dayIndex}</span>
      <span class="pill">${typeLabel}</span>
    </div>

    <h2>${x.title}</h2>
    <p class="muted">${w.theme || ""}</p>

    <div class="grid two">
      <div class="stat"><span class="muted small">Time</span><strong>${x.time || "Planned"}</strong></div>
      <div class="stat"><span class="muted small">Target</span><strong style="font-size:17px">${x.distance || "Complete"}</strong></div>
    </div>

    <div class="detail"><strong>Purpose</strong><p class="muted">${x.purpose || "Complete today's workout with control."}</p></div>
    <div style="height:10px"></div>

    <div class="detail"><strong>Workout Structure</strong><p class="muted">${x.structure || "Follow the guided session."}</p></div>
    <div style="height:10px"></div>

    <div class="grid two">
      <div class="detail"><strong>Effort</strong><p class="muted">${x.effort || "Controlled"}</p></div>
      <div class="detail"><strong>Caution</strong><p class="muted">${x.caution || "Listen to your body."}</p></div>
    </div>

    ${exerciseList}

    <button onclick="window.startWorkout()">Start Guided Workout</button>
    <div style="height:8px"></div>
    <button class="secondary" onclick="openBriefingV110 ? openBriefingV110() : showModal('<h2>Briefing</h2><p class=&quot;muted&quot;>Follow today’s guided workout.</p><button onclick=&quot;hideModal()&quot;>Done</button>')">Briefing</button>
  </section>`;
}

function ruut142CoachSummaryCard(){
  const x = currentWorkout();
  const completed = typeof isComplete === "function" && isComplete();
  const history = (state.workoutDebriefs || []).slice(-3);
  const historyLine = history.length
    ? `${history.length} recent debrief${history.length===1?"":"s"} available for coach context.`
    : "No recent debriefs yet.";

  return `<section class="card hero" id="coachSummaryV142">
    <div class="pill-row">
      <span class="pill accent">Coach Read</span>
      <span class="pill">${completed ? "Completed" : "Pending"}</span>
    </div>
    <h3>Today’s Focus</h3>
    <p class="muted">${x.success || "Show up, move well, and finish the work."}</p>
    <div class="detail"><strong>Recent Pattern</strong><p class="muted">${historyLine}</p></div>
  </section>`;
}

function renderToday(){
  const today = document.getElementById("today");
  if(!today) return;

  runDailyMaintenanceV101?.();

  today.innerHTML = `
    ${ruut142SimpleMissionCard()}
    ${ruut142CoachSummaryCard()}
  `;
}
window.renderToday = renderToday;

function renderWorkout(){
  const x = currentWorkout();
  const workout = document.getElementById("workout");
  if(!workout) return;

  workout.innerHTML = `<section class="card workout-mode">
    <div>
      <p class="muted small">Guided session</p>
      <div class="cue">${x.title}</div>
    </div>
    <div class="timer" id="timerDisplay">--:--</div>
    <div class="progress-bar"><div id="workoutProgress" class="progress-fill"></div></div>
    <p id="workoutMessage" class="muted">Tap start and keep this screen open during workouts.</p>
    <div class="pill-row" style="justify-content:center">
      <span class="pill"><span id="awakeDot" class="dot"></span> <span id="awakeText">Screen awake not active</span></span>
    </div>
    <button onclick="window.startWorkout()">Start Today's Workout</button>
    <button class="secondary" onclick="window.skipCurrent()">Skip Current Step</button>
    <button id="pauseButton" class="secondary" onclick="window.togglePause()">Pause</button>
  </section>`;
}
window.renderWorkout = renderWorkout;

function renderAll(){
  renderToday();
  renderWorkout();
  renderDashboard();
  renderPlan();
  renderJournal();
  renderRecover();
}
window.renderAll = renderAll;

// Final showScreen prevents old delayed Today injectors from winning.
function showScreen(id,btn){
  document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
  const screen = document.getElementById(id);
  if(screen) screen.classList.add("active");

  document.querySelectorAll("nav button").forEach(b=>b.classList.remove("active"));
  if(btn) btn.classList.add("active");

  renderAll();

  // If any old delayed card injection still fires, clean Today again after it.
  if(id === "today"){
    setTimeout(renderToday, 250);
    setTimeout(renderToday, 750);
  }
}
window.showScreen = showScreen;

// Hard remove stale old Today cards if any delayed legacy injector runs.
function ruut142CleanToday(){
  const today = document.getElementById("today");
  if(!today) return;
  const mission = document.getElementById("todayMissionCardV142");
  if(!mission){
    renderToday();
    return;
  }
  Array.from(today.children).forEach(child=>{
    if(child.id !== "todayMissionCardV142" && child.id !== "coachSummaryV142"){
      child.remove();
    }
  });
}
setInterval(()=>{
  const todayScreen = document.getElementById("today");
  if(todayScreen && todayScreen.classList.contains("active")) ruut142CleanToday();
}, 1000);

// Capture start workout buttons and force final controller.
document.addEventListener("click", function(e){
  const label = String(e.target?.textContent || "").trim().toLowerCase();
  if(label === "start guided workout" || label === "start today's workout" || label === "start workout"){
    e.preventDefault();
    e.stopPropagation();
    window.startWorkout();
  }
}, true);

// ---------- V14.2.1 BRIEFING FALLBACK ----------
function openBriefingV110(){
  const x = currentWorkout();
  showModal(`<h2>Workout Briefing</h2>
    <div class="pill-row"><span class="pill accent">Today</span><span class="pill">${ruut14StyleLabel ? ruut14StyleLabel() : "Coach"}</span></div>
    <div class="detail"><strong>Goal</strong><p class="muted">${x.purpose || "Complete today’s workout with control."}</p></div>
    <div style="height:10px"></div>
    <div class="detail"><strong>Structure</strong><p class="muted">${x.structure || "Follow the guided workout."}</p></div>
    <div style="height:10px"></div>
    <div class="detail"><strong>Success</strong><p class="muted">${x.success || "Move well and finish the plan."}</p></div>
    <div style="height:12px"></div>
    <button onclick="hideModal();window.startWorkout()">Start Guided Workout</button>
    <div style="height:8px"></div>
    <button class="secondary" onclick="hideModal()">Done</button>`);
}
window.openBriefingV110 = openBriefingV110;

// ---------- V14.3 FINAL ASSIGNMENT STABILITY LAYER ----------
/*
  Older code used runtime assignments like renderToday = function(){...}.
  Function declarations alone are not enough because those older assignments execute during load.
  This layer explicitly assigns the final functions at the very end of startup.
*/

(function(){
  const R14 = {};

  R14.dateLabel = function(){
    try{
      return new Date().toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric",year:"numeric"});
    }catch(e){
      return new Date().toLocaleDateString();
    }
  };

  R14.style = function(){
    const s = String(settings.coachStyle || "balanced").toLowerCase();
    if(s.includes("tough")) return "tough";
    if(s.includes("trail")) return "trail";
    return "balanced";
  };

  R14.styleLabel = function(){
    const s = R14.style();
    if(s === "tough") return "Tough Love";
    if(s === "trail") return "Trail Guide";
    return "Balanced";
  };

  R14.cueText = function(key){
    const balanced = {
      warmup_start:"Begin your warmup. Take it easy and prepare your body.",
      run_start:"Run now. Find a steady pace and stay relaxed.",
      walk_recovery:"Recovery interval. Slow down, breathe, and reset.",
      halfway:"You're halfway there. Stay consistent and keep moving forward.",
      cooldown_start:"Begin your cooldown. Let your heart rate come down gradually.",
      workout_complete:"Workout complete. Nice work today.",
      rest_day:"Today is a rest day. Recovery is part of training.",
      recovery_substitution:"Recovery comes first today. Move easily and let your body absorb the training.",
      strength_begin:"Strength work starts now. Focus on control and form.",
      next_exercise:"Next exercise. Get set and begin."
    };

    const tough = {
      warmup_start:"Begin your warmup. Prepare the body. Prepare the mind. The mission starts here.",
      run_start:"Move. Set your pace and stay disciplined. Every step has a purpose.",
      walk_recovery:"Recovery phase. Control your breathing. Regain your composure. Prepare for the next effort.",
      halfway:"Halfway complete. The standard has not changed. Stay focused and finish the mission.",
      cooldown_start:"Mission complete. Begin recovery procedures. Bring your heart rate down and recover with intent.",
      workout_complete:"Workout complete. You met the standard today. Well done. Prepare for the next mission.",
      rest_day:"Today is a recovery day. Recovery is training. Use it wisely and return ready for action.",
      recovery_substitution:"Recovery operation in progress. Move with purpose, recover completely, and prepare for the next challenge.",
      strength_begin:"Strength training begins now. Every repetition counts. Execute with precision.",
      next_exercise:"Next exercise. Move into position. Stand by. Execute on command."
    };

    const trail = {
      warmup_start:"Begin your warmup. Start easy and settle into the day.",
      run_start:"Run smooth. Light feet and steady breathing.",
      walk_recovery:"Walk now. Recover and take in the air.",
      halfway:"Halfway point. Turn back toward home and stay steady.",
      cooldown_start:"Cooldown begins. Walk easy and bring the breathing down.",
      workout_complete:"Workout complete. Good miles today.",
      rest_day:"Rest day. Keep it light and let the body recover.",
      recovery_substitution:"Recovery comes first today. Move easy and let the body reset.",
      strength_begin:"Strength work begins. Move with control.",
      next_exercise:"Next exercise. Set your position and move clean."
    };

    const style = R14.style();
    if(style === "tough") return tough[key] || balanced[key] || "";
    if(style === "trail") return trail[key] || balanced[key] || "";
    return balanced[key] || "";
  };

  R14.stopVoice = function(){
    try{ if(window.speechSynthesis) window.speechSynthesis.cancel(); }catch(e){}
    try{
      if(typeof ruutCurrentAudioV130 !== "undefined" && ruutCurrentAudioV130){
        ruutCurrentAudioV130.pause();
        ruutCurrentAudioV130.currentTime = 0;
      }
    }catch(e){}
    try{
      if(typeof currentCoachAudioV105 !== "undefined" && currentCoachAudioV105){
        currentCoachAudioV105.pause();
        currentCoachAudioV105.currentTime = 0;
      }
    }catch(e){}
  };

  R14.speak = function(text){
    const phrase = String(text || "").trim();
    if(!phrase || !("speechSynthesis" in window)) return Promise.resolve(false);
    try{
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
      const u = new SpeechSynthesisUtterance(phrase);
      u.rate = settings.voiceRate || 0.95;
      u.pitch = 1;
      u.volume = 1;
      try{
        const voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
        const selected = voices.find(v => v.voiceURI === settings.voiceURI);
        if(selected) u.voice = selected;
      }catch(e){}
      window.speechSynthesis.speak(u);
      return Promise.resolve(true);
    }catch(e){
      return Promise.resolve(false);
    }
  };

  R14.lastCue = {key:"", at:0};
  R14.cue = function(key){
    const now = Date.now();
    if(R14.lastCue.key === key && now - R14.lastCue.at < 1200) return Promise.resolve(false);
    R14.lastCue = {key, at:now};
    if(state.voiceCoach?.enabled === false) return Promise.resolve(false);
    return R14.speak(R14.cueText(key));
  };

  R14.renderToday = function(){
    const today = document.getElementById("today");
    if(!today) return;
    try{ if(typeof runDailyMaintenanceV101 === "function") runDailyMaintenanceV101(); }catch(e){}

    const x = currentWorkout();
    const w = typeof currentWeek === "function" ? currentWeek() : {theme:""};
    const typeLabel = x.type === "bodyweight" ? "strength" : x.type;
    const exerciseList = x.type === "bodyweight" && Array.isArray(x.exercises)
      ? `<div class="list">${x.exercises.map(e=>`
          <div class="exercise"><span>${e.name}</span><strong>${e.mode==="timed" ? e.seconds+" sec" : e.reps}</strong></div>
        `).join("")}</div>`
      : "";

    const history = (state.workoutDebriefs || []).slice(-3);
    const historyLine = history.length
      ? `${history.length} recent debrief${history.length===1?"":"s"} available for coach context.`
      : "No recent debriefs yet.";

    today.innerHTML = `
      <section class="card hero" id="todayMissionCardV143">
        <div class="pill-row">
          <span class="pill accent">Today's Mission</span>
          <span class="pill">${R14.dateLabel()}</span>
          <span class="pill">Week ${state.week}</span>
          <span class="pill">Day ${state.dayIndex}</span>
          <span class="pill">${typeLabel}</span>
        </div>

        <h2>${x.title}</h2>
        <p class="muted">${w.theme || ""}</p>

        <div class="grid two">
          <div class="stat"><span class="muted small">Time</span><strong>${x.time || "Planned"}</strong></div>
          <div class="stat"><span class="muted small">Target</span><strong style="font-size:17px">${x.distance || "Complete"}</strong></div>
        </div>

        <div class="detail"><strong>Purpose</strong><p class="muted">${x.purpose || "Complete today's workout with control."}</p></div>
        <div style="height:10px"></div>

        <div class="detail"><strong>Workout Structure</strong><p class="muted">${x.structure || "Follow the guided session."}</p></div>
        <div style="height:10px"></div>

        <div class="grid two">
          <div class="detail"><strong>Effort</strong><p class="muted">${x.effort || "Controlled"}</p></div>
          <div class="detail"><strong>Caution</strong><p class="muted">${x.caution || "Listen to your body."}</p></div>
        </div>

        ${exerciseList}

        <button onclick="window.startWorkout()">Start Guided Workout</button>
        <div style="height:8px"></div>
        <button class="secondary" onclick="window.openBriefingV110()">Briefing</button>
      </section>

      <section class="card hero" id="coachSummaryV143">
        <div class="pill-row"><span class="pill accent">Coach Read</span><span class="pill">${typeof isComplete === "function" && isComplete() ? "Completed" : "Pending"}</span></div>
        <h3>Today’s Focus</h3>
        <p class="muted">${x.success || "Show up, move well, and finish the work."}</p>
        <div class="detail"><strong>Recent Pattern</strong><p class="muted">${historyLine}</p></div>
      </section>
    `;
  };

  R14.renderWorkout = function(){
    const x = currentWorkout();
    const workout = document.getElementById("workout");
    if(!workout) return;
    workout.innerHTML = `<section class="card workout-mode">
      <div>
        <p class="muted small">Guided session</p>
        <div class="cue">${x.title}</div>
      </div>
      <div class="timer" id="timerDisplay">--:--</div>
      <div class="progress-bar"><div id="workoutProgress" class="progress-fill"></div></div>
      <p id="workoutMessage" class="muted">Tap start and keep this screen open during workouts.</p>
      <div class="pill-row" style="justify-content:center">
        <span class="pill"><span id="awakeDot" class="dot"></span> <span id="awakeText">Screen awake not active</span></span>
      </div>
      <button onclick="window.startWorkout()">Start Today's Workout</button>
      <button class="secondary" onclick="window.skipCurrent()">Skip Current Step</button>
      <button id="pauseButton" class="secondary" onclick="window.togglePause()">Pause</button>
    </section>`;
  };

  R14.resolve = null;
  R14.skipped = false;

  R14.timer = function(seconds, remainingBefore=seconds, total=seconds){
    return new Promise(resolve=>{
      let left = Math.max(0, seconds);
      let elapsed = 0;
      let finished = false;
      R14.skipped = false;
      skipCurrentTimer = false;
      clearInterval(activeTimer);
      activeTimer = null;
      updateTimer(left, remainingBefore, total);

      const finish = (skipped=false)=>{
        if(finished) return;
        finished = true;
        clearInterval(activeTimer);
        activeTimer = null;
        activeTimerResolve = null;
        R14.resolve = null;
        resolve({skipped, credited: skipped ? 0 : seconds});
      };

      R14.resolve = ()=>finish(true);
      activeTimerResolve = ()=>finish(true);

      activeTimer = setInterval(()=>{
        if(workoutAbort){ finish(true); return; }
        if(R14.skipped || skipCurrentTimer){ finish(true); return; }
        if(workoutPaused) return;
        left--;
        elapsed++;
        updateTimer(left, Math.max(0, remainingBefore-elapsed), total);
        if(left<=0) finish(false);
      },1000);
    });
  };

  R14.warmup = async function(){
    if(!settings.warmup) return {skipped:false, credited:0};
    setCue("Warmup");
    setTimer("2:00");
    setWorkoutMessage("Warmup: march, leg swings, calf raises, easy movement. Tap Skip Current Step to move ahead.");
    R14.cue("warmup_start");
    return R14.timer(120,120,120);
  };

  R14.cooldown = async function(){
    setCue("Cooldown");
    setWorkoutMessage("Cooldown: easy walk, calves, hips, hamstrings. Tap Skip Current Step to finish.");
    R14.cue("cooldown_start");
    return R14.timer(180,180,180);
  };

  R14.runSegment = async function(label, seconds, remaining, total){
    setCue(label.toUpperCase());
    setWorkoutMessage(label === "Run" ? "Stay controlled. Smooth is fast." : "Recover. Keep moving.");
    R14.cue(label === "Run" ? "run_start" : "walk_recovery");
    return R14.timer(seconds, remaining, total);
  };

  R14.startRun = async function(x, readiness="normal"){
    let total = Number(x.total || 0) * 60;
    if(!total || total < 1) total = 60;
    if(readiness === "tired") total = Math.round(total * 0.8);

    const runSeconds = Number(x.runSeconds || 60);
    const walkSeconds = Number(x.walkSeconds || 60);
    let remaining = total;
    let credited = 0;
    const halfwayAt = Math.max(1, Math.floor(total/2));
    let halfwayPlayed = false;

    await R14.warmup();
    if(workoutAbort) return;

    while(remaining > 0 && !workoutAbort){
      const runDur = Math.min(runSeconds, remaining);
      const runResult = await R14.runSegment("Run", runDur, remaining, total);
      remaining -= runDur;
      if(!runResult.skipped){
        credited += runDur;
        if(!halfwayPlayed && credited >= halfwayAt){
          halfwayPlayed = true;
          setCue("TURN BACK");
          setWorkoutMessage("Halfway point. Turn back now.");
          R14.cue("halfway");
        }
      }
      if(workoutAbort || remaining <= 0) break;

      const walkDur = Math.min(walkSeconds, remaining);
      const walkResult = await R14.runSegment("Walk", walkDur, remaining, total);
      remaining -= walkDur;
      if(!walkResult.skipped){
        credited += walkDur;
        if(!halfwayPlayed && credited >= halfwayAt){
          halfwayPlayed = true;
          setCue("TURN BACK");
          setWorkoutMessage("Halfway point. Turn back now.");
          R14.cue("halfway");
        }
      }
    }

    if(settings.cooldown && !workoutAbort) await R14.cooldown();
    if(workoutAbort) return;

    setCue("Complete");
    setTimer("DONE");
    setWorkoutMessage("Workout complete. Good work.");
    R14.cue("workout_complete");
    markComplete(false);
    releaseWakeLock();
    if(typeof openWorkoutDebriefV97 === "function") openWorkoutDebriefV97();
  };

  R14.startStrength = async function(x, readiness="normal"){
    await R14.warmup();
    if(workoutAbort) return;
    let rounds = Number(x.rounds || 1);
    if(readiness === "tired") rounds = Math.max(1, rounds-1);
    R14.cue("strength_begin");

    for(let r=1; r<=rounds && !workoutAbort; r++){
      setCue(`Round ${r}`);
      for(const e of (x.exercises || [])){
        if(workoutAbort) return;
        setCue(e.name || "Exercise");
        setWorkoutMessage(`${e.name || "Exercise"}`);
        R14.cue("next_exercise");
        if(e.mode === "timed"){
          await R14.timer(Number(e.seconds || 30), Number(e.seconds || 30), Number(e.seconds || 30));
        }else{
          setTimer("DONE?");
          setWorkoutMessage(`${e.name || "Exercise"}. ${e.reps || ""}. Tap Done when finished.`);
          await waitForDone(e.name, e.reps);
        }
      }
    }

    if(settings.cooldown && !workoutAbort) await R14.cooldown();
    if(workoutAbort) return;
    setCue("Complete");
    setTimer("DONE");
    setWorkoutMessage("Workout complete. Good work.");
    R14.cue("workout_complete");
    markComplete(false);
    releaseWakeLock();
    if(typeof openWorkoutDebriefV97 === "function") openWorkoutDebriefV97();
  };

  R14.startRest = function(){
    setWorkoutMessage("Rest day. Light walking only.");
    setCue("Rest Day");
    setTimer("REST");
    R14.cue("rest_day");
  };

  R14.startWorkout = async function(){
    R14.stopVoice();
    workoutAbort = false;
    skipCurrentTimer = false;
    workoutPaused = false;
    R14.skipped = false;
    R14.lastCue = {key:"", at:0};

    const x = currentWorkout();
    if(!x){
      showModal(`<h2>Workout Error</h2><p class="muted">No workout found for today.</p><button onclick="hideModal()">Done</button>`);
      return;
    }

    R14.renderWorkout();
    document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
    const workout = document.getElementById("workout");
    if(workout) workout.classList.add("active");
    document.querySelectorAll("nav button").forEach(b=>b.classList.remove("active"));
    const navBtns = document.querySelectorAll("nav button");
    if(navBtns[1]) navBtns[1].classList.add("active");

    try{ requestWakeLock(); }catch(e){}

    if(x.type === "run") return R14.startRun(x,"normal");
    if(x.type === "bodyweight") return R14.startStrength(x,"normal");
    return R14.startRest(x);
  };

  R14.skipCurrent = function(){
    R14.stopVoice();
    R14.skipped = true;
    skipCurrentTimer = true;
    workoutPaused = false;
    updatePauseButton();
    setCue("Next");
    setTimer("NEXT");
    setWorkoutMessage("Moving to the next step...");
    if(R14.resolve) R14.resolve();
    else if(activeTimerResolve) activeTimerResolve();
    if(window.resolveDone){
      try{ window.resolveDone(); }catch(e){}
    }
  };

  R14.togglePause = function(){
    R14.stopVoice();
    workoutPaused = !workoutPaused;
    if(workoutPaused){
      setCue("Paused");
      setWorkoutMessage("Paused. Tap Resume to continue from here.");
    }else{
      setCue("Resume");
      setWorkoutMessage("Resuming workout.");
    }
    updatePauseButton();
  };

  R14.openBriefing = function(){
    const x = currentWorkout();
    showModal(`<h2>Workout Briefing</h2>
      <div class="pill-row"><span class="pill accent">Today</span><span class="pill">${R14.styleLabel()}</span></div>
      <div class="detail"><strong>Goal</strong><p class="muted">${x.purpose || "Complete today’s workout with control."}</p></div>
      <div style="height:10px"></div>
      <div class="detail"><strong>Structure</strong><p class="muted">${x.structure || "Follow the guided workout."}</p></div>
      <div style="height:10px"></div>
      <div class="detail"><strong>Success</strong><p class="muted">${x.success || "Move well and finish the plan."}</p></div>
      <div style="height:12px"></div>
      <button onclick="hideModal();window.startWorkout()">Start Guided Workout</button>
      <div style="height:8px"></div>
      <button class="secondary" onclick="hideModal()">Done</button>`);
  };

  R14.voiceSettings = function(){
    state.voiceCoach = state.voiceCoach || {};
    if(state.voiceCoach.enabled === undefined) state.voiceCoach.enabled = true;
    showModal(`<h2>Voice Coach</h2>
      <p class="muted">Active workouts use iPhone system voice for reliability with Apple Music and Apple Workout.</p>
      <div class="detail">
        <strong>Active Coach Style</strong>
        <p class="muted">${R14.styleLabel()}</p>
        <p class="muted small">Change this from Settings → Coach Style.</p>
      </div>
      <div style="height:10px"></div>
      <label><input type="checkbox" id="voiceCoachEnabledV143" ${state.voiceCoach.enabled !== false ? "checked" : ""}> Use voice coaching</label>
      <div style="height:12px"></div>
      <button onclick="window.saveVoiceSettingsV105()">Save Voice Settings</button>
      <div style="height:8px"></div>
      <button class="secondary" onclick="window.ruut14Final.cue('warmup_start')">Test Voice</button>
      <div style="height:8px"></div>
      <button class="secondary" onclick="hideModal()">Cancel</button>`);
  };

  R14.saveVoiceSettings = function(){
    state.voiceCoach = state.voiceCoach || {};
    state.voiceCoach.enabled = !!document.getElementById("voiceCoachEnabledV143")?.checked;
    state.voiceCoach.audioMode = "system";
    state.voiceCoach.pack = R14.style();
    saveState();
    hideModal();
  };

  R14.voiceCard = function(){
    state.voiceCoach = state.voiceCoach || {};
    const enabled = state.voiceCoach.enabled !== false;
    return `<section class="card hero">
      <div class="pill-row"><span class="pill accent">Voice Coach</span><span class="pill">${enabled ? "Enabled" : "Disabled"}</span><span class="pill">System Voice</span></div>
      <h3>Reliable Workout Voice</h3>
      <p class="muted">Active workouts use iPhone system voice so prompts work better with Apple Music and Apple Workout.</p>
      <p class="muted small">Coach Style still changes the spoken language.</p>
      <div class="grid two">
        <button class="secondary" onclick="window.openVoiceSettingsV105()">Voice Settings</button>
        <button class="secondary" onclick="window.ruut14Final.cue('warmup_start')">Test Voice</button>
      </div>
    </section>`;
  };

  R14.renderAll = function(){
    R14.renderToday();
    R14.renderWorkout();
    renderDashboard();
    renderPlan();
    renderJournal();
    renderRecover();
  };

  R14.showScreen = function(id, btn){
    document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
    const screen = document.getElementById(id);
    if(screen) screen.classList.add("active");
    document.querySelectorAll("nav button").forEach(b=>b.classList.remove("active"));
    if(btn) btn.classList.add("active");
    R14.renderAll();
    if(id === "today"){
      setTimeout(R14.renderToday, 250);
      setTimeout(R14.renderToday, 750);
    }
  };

  window.ruut14Final = R14;

  // Explicit runtime assignments. These are the important part.
  renderToday = R14.renderToday;
  renderWorkout = R14.renderWorkout;
  renderAll = R14.renderAll;
  showScreen = R14.showScreen;
  startWorkout = R14.startWorkout;
  beginWorkout = function(){ return R14.startWorkout(); };
  skipCurrent = R14.skipCurrent;
  togglePause = R14.togglePause;
  showHalfway = function(){ return false; };
  speak = R14.speak;
  cue = function(text){
    const lower = String(text || "").toLowerCase();
    if(lower.includes("warm")) return R14.cue("warmup_start");
    if(lower.includes("cooldown")) return R14.cue("cooldown_start");
    if(lower.includes("workout complete") || lower.includes("complete")) return R14.cue("workout_complete");
    if(lower.includes("rest day")) return R14.cue("rest_day");
    if(lower.includes("run")) return R14.cue("run_start");
    if(lower.includes("walk") || lower.includes("recover")) return R14.cue("walk_recovery");
    return Promise.resolve(false);
  };
  openBriefingV110 = R14.openBriefing;
  openVoiceSettingsV105 = R14.voiceSettings;
  saveVoiceSettingsV105 = R14.saveVoiceSettings;
  coachTabVoiceCardV111 = R14.voiceCard;

  window.renderToday = renderToday;
  window.renderWorkout = renderWorkout;
  window.renderAll = renderAll;
  window.showScreen = showScreen;
  window.startWorkout = startWorkout;
  window.beginWorkout = beginWorkout;
  window.skipCurrent = skipCurrent;
  window.togglePause = togglePause;
  window.showHalfway = showHalfway;
  window.speak = speak;
  window.cue = cue;
  window.openBriefingV110 = openBriefingV110;
  window.openVoiceSettingsV105 = openVoiceSettingsV105;
  window.saveVoiceSettingsV105 = saveVoiceSettingsV105;
  window.coachTabVoiceCardV111 = coachTabVoiceCardV111;

  document.addEventListener("click", function(e){
    const label = String(e.target?.textContent || "").trim().toLowerCase();
    if(label === "start guided workout" || label === "start today's workout" || label === "start workout"){
      e.preventDefault();
      e.stopPropagation();
      window.startWorkout();
    }
  }, true);

  setInterval(function(){
    try{
      const today = document.getElementById("today");
      if(today && today.classList.contains("active")) R14.renderToday();
    }catch(e){}
  }, 1500);
})();

// ---------- V14.4 ROUTE MODE CUES + HALFWAY FIX ----------
/*
  Route-mode aware guided run cues.

  Fixes:
  - Halfway cue is controlled by route mode.
  - Out & Back gives a clear turnaround cue.
  - Loop gives time-remaining style cues.
  - Treadmill gives posture/effort cues.
  - Trail gives terrain/control cues.
  - All cue wording changes by Coach Style.
*/

(function(){
  const R14 = window.ruut14Final;
  if(!R14) return;

  R14.routeMode = function(){
    return String(settings.routeMode || "Out & Back: Halfway Turnaround");
  };

  R14.routeKey = function(){
    const r = R14.routeMode().toLowerCase();
    if(r.includes("loop")) return "loop";
    if(r.includes("treadmill")) return "treadmill";
    if(r.includes("trail")) return "trail";
    return "outback";
  };

  R14.routeCueText = function(kind){
    const route = R14.routeKey();
    const style = R14.style();

    const balanced = {
      outback_halfway:"Halfway point. Turn back now and bring it home.",
      loop_halfway:"Halfway complete. Stay steady and manage the remaining time.",
      treadmill_halfway:"Halfway complete. Check your posture, relax your shoulders, and hold a steady effort.",
      trail_halfway:"Halfway point. Stay controlled, watch your footing, and bring it back safely.",
      loop_quarter:"First quarter complete. Settle in and keep the effort controlled.",
      loop_threequarter:"Three quarters complete. Stay patient and finish the remaining time.",
      treadmill_posture:"Posture check. Stand tall, relax your shoulders, and keep your cadence smooth.",
      trail_terrain:"Trail check. Shorten the stride on uneven ground and protect your ankles."
    };

    const tough = {
      outback_halfway:"Halfway point. Turn back now. Stay disciplined and finish the mission.",
      loop_halfway:"Halfway complete. Maintain the standard. Control the remaining time.",
      treadmill_halfway:"Halfway complete. Check posture. Control effort. Do not get sloppy.",
      trail_halfway:"Halfway point. Watch your footing, protect your ankles, and keep moving with purpose.",
      loop_quarter:"First quarter complete. Lock in. Keep the pace under control.",
      loop_threequarter:"Three quarters complete. Finish the assignment. No drifting.",
      treadmill_posture:"Posture check. Stand tall. Breathe under control. Keep your form sharp.",
      trail_terrain:"Terrain check. Short stride. Stable feet. Reckless downhill efforts are not authorized."
    };

    const trailGuide = {
      outback_halfway:"Halfway point. Turn back toward home and keep the rhythm easy.",
      loop_halfway:"Halfway through the loop. Stay smooth and let the miles come to you.",
      treadmill_halfway:"Halfway done. Stand tall, loosen the shoulders, and keep the effort steady.",
      trail_halfway:"Halfway point on the trail. Check the ground, stay light on your feet, and head back steady.",
      loop_quarter:"First quarter done. Settle into the loop and keep breathing easy.",
      loop_threequarter:"Three quarters done. Keep the stride smooth and finish clean.",
      treadmill_posture:"Quick form check. Tall posture, easy shoulders, steady feet.",
      trail_terrain:"Trail check. Watch rocks and roots, stay balanced, and keep the pace honest."
    };

    const bank = style === "tough" ? tough : style === "trail" ? trailGuide : balanced;

    if(kind === "halfway"){
      if(route === "loop") return bank.loop_halfway;
      if(route === "treadmill") return bank.treadmill_halfway;
      if(route === "trail") return bank.trail_halfway;
      return bank.outback_halfway;
    }

    if(kind === "quarter"){
      if(route === "loop") return bank.loop_quarter;
      if(route === "treadmill") return bank.treadmill_posture;
      if(route === "trail") return bank.trail_terrain;
      return "";
    }

    if(kind === "threequarter"){
      if(route === "loop") return bank.loop_threequarter;
      if(route === "treadmill") return bank.treadmill_posture;
      if(route === "trail") return bank.trail_terrain;
      return "";
    }

    return "";
  };

  R14.routeCue = function(kind){
    const text = R14.routeCueText(kind);
    if(!text) return Promise.resolve(false);
    return R14.speak(text);
  };

  R14.startRun = async function(x, readiness="normal"){
    let total = Number(x.total || 0) * 60;
    if(!total || total < 1) total = 60;
    if(readiness === "tired") total = Math.round(total * 0.8);

    const runSeconds = Number(x.runSeconds || 60);
    const walkSeconds = Number(x.walkSeconds || 60);

    let remaining = total;
    let credited = 0;

    const quarterAt = Math.max(1, Math.floor(total * 0.25));
    const halfwayAt = Math.max(1, Math.floor(total * 0.50));
    const threeQuarterAt = Math.max(1, Math.floor(total * 0.75));

    let quarterPlayed = false;
    let halfwayPlayed = false;
    let threeQuarterPlayed = false;

    await R14.warmup();
    if(workoutAbort) return;

    const checkMilestones = function(){
      if(!quarterPlayed && credited >= quarterAt){
        quarterPlayed = true;
        const route = R14.routeKey();
        if(route === "loop" || route === "treadmill" || route === "trail"){
          R14.routeCue("quarter");
        }
      }

      if(!halfwayPlayed && credited >= halfwayAt){
        halfwayPlayed = true;
        setCue(R14.routeKey() === "outback" || R14.routeKey() === "trail" ? "TURN BACK" : "HALFWAY");
        setWorkoutMessage(R14.routeCueText("halfway") || "Halfway point.");
        R14.routeCue("halfway");
      }

      if(!threeQuarterPlayed && credited >= threeQuarterAt){
        threeQuarterPlayed = true;
        const route = R14.routeKey();
        if(route === "loop" || route === "treadmill" || route === "trail"){
          R14.routeCue("threequarter");
        }
      }
    };

    while(remaining > 0 && !workoutAbort){
      const runDur = Math.min(runSeconds, remaining);
      const runResult = await R14.runSegment("Run", runDur, remaining, total);
      remaining -= runDur;

      if(!runResult.skipped){
        credited += runDur;
        checkMilestones();
      }

      if(workoutAbort || remaining <= 0) break;

      const walkDur = Math.min(walkSeconds, remaining);
      const walkResult = await R14.runSegment("Walk", walkDur, remaining, total);
      remaining -= walkDur;

      if(!walkResult.skipped){
        credited += walkDur;
        checkMilestones();
      }
    }

    if(settings.cooldown && !workoutAbort) await R14.cooldown();
    if(workoutAbort) return;

    setCue("Complete");
    setTimer("DONE");
    setWorkoutMessage("Workout complete. Good work.");
    R14.cue("workout_complete");
    markComplete(false);
    releaseWakeLock();
    if(typeof openWorkoutDebriefV97 === "function") openWorkoutDebriefV97();
  };

  R14.startWorkout = async function(){
    R14.stopVoice();
    workoutAbort = false;
    skipCurrentTimer = false;
    workoutPaused = false;
    R14.skipped = false;
    R14.lastCue = {key:"", at:0};

    const x = currentWorkout();
    if(!x){
      showModal(`<h2>Workout Error</h2><p class="muted">No workout found for today.</p><button onclick="hideModal()">Done</button>`);
      return;
    }

    R14.renderWorkout();

    document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
    const workout = document.getElementById("workout");
    if(workout) workout.classList.add("active");

    document.querySelectorAll("nav button").forEach(b=>b.classList.remove("active"));
    const navBtns = document.querySelectorAll("nav button");
    if(navBtns[1]) navBtns[1].classList.add("active");

    try{ requestWakeLock(); }catch(e){}

    if(x.type === "run") return R14.startRun(x,"normal");
    if(x.type === "bodyweight") return R14.startStrength(x,"normal");
    return R14.startRest(x);
  };

  // Final runtime assignment again.
  startWorkout = R14.startWorkout;
  beginWorkout = function(){ return R14.startWorkout(); };
  window.startWorkout = startWorkout;
  window.beginWorkout = beginWorkout;
})();

// ---------- V14.5 STEP-BASED WORKOUT CUE ENGINE ----------
/*
  Final cue model:
  - Run/walk workouts are converted into a planned list of steps.
  - Each step counts when completed OR skipped.
  - Halfway cue fires once after half the planned steps are passed.
  - Halfway cue is spoken, then the next normal run/walk cue follows.
  - Strength workouts walk through each exercise by round.
  - Each strength exercise gets a name + short form cue.
  - Skip moves to the next planned step.
*/

(function(){
  const R14 = window.ruut14Final || {};
  window.ruut14Final = R14;

  R14.stepResolve = null;
  R14.stepSkipped = false;
  R14.currentStepLabel = "";

  R14.formCue = function(name){
    const n = String(name || "").toLowerCase();

    if(n.includes("squat")) return "Sit the hips back, keep your chest tall, and drive through your feet.";
    if(n.includes("push")) return "Keep your body straight, brace your core, and control every rep.";
    if(n.includes("row")) return "Pull the elbow back, keep your shoulder down, and avoid twisting.";
    if(n.includes("lunge")) return "Step with control, keep your front knee tracking over the foot, and stand tall.";
    if(n.includes("plank")) return "Brace your core, squeeze your glutes, and keep a straight line.";
    if(n.includes("carry")) return "Stand tall, keep your ribs down, and walk with steady control.";
    if(n.includes("hinge") || n.includes("deadlift")) return "Hinge at the hips, keep your back neutral, and move with control.";
    if(n.includes("press")) return "Brace your core, press smoothly, and avoid leaning back.";
    if(n.includes("bridge")) return "Drive through your heels, squeeze the glutes, and control the lowering.";
    if(n.includes("calf")) return "Rise under control, pause at the top, and lower slowly.";
    if(n.includes("step")) return "Plant the whole foot, drive through the heel, and control the descent.";
    if(n.includes("curl")) return "Keep the elbows quiet and control the weight both directions.";
    if(n.includes("raise")) return "Move smoothly, keep control, and avoid swinging.";

    return "Move with control, keep clean form, and stop if pain shows up.";
  };

  R14.speakBlocking = function(text){
    const phrase = String(text || "").trim();
    if(!phrase || !("speechSynthesis" in window)) return Promise.resolve(false);

    return new Promise(resolve=>{
      try{
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();

        const u = new SpeechSynthesisUtterance(phrase);
        u.rate = settings.voiceRate || 0.95;
        u.pitch = 1;
        u.volume = 1;

        try{
          const voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
          const selected = voices.find(v => v.voiceURI === settings.voiceURI);
          if(selected) u.voice = selected;
        }catch(e){}

        let done = false;
        const finish = () => {
          if(done) return;
          done = true;
          resolve(true);
        };

        u.onend = finish;
        u.onerror = finish;
        window.speechSynthesis.speak(u);

        setTimeout(finish, Math.max(1200, Math.min(7000, phrase.length * 80)));
      }catch(e){
        resolve(false);
      }
    });
  };

  R14.say = function(text){
    if(state.voiceCoach?.enabled === false) return Promise.resolve(false);
    return R14.speakBlocking(text);
  };

  R14.sayCue = function(key, blocking=false){
    const text = typeof R14.cueText === "function" ? R14.cueText(key) : "";
    if(blocking) return R14.say(text);
    R14.say(text);
    return Promise.resolve(true);
  };

  R14.sayRouteHalfway = function(blocking=true){
    const route = typeof R14.routeKey === "function" ? R14.routeKey() : "outback";
    let text = "";

    if(typeof R14.routeCueText === "function"){
      text = R14.routeCueText("halfway");
    }

    if(!text){
      text = typeof R14.cueText === "function" ? R14.cueText("halfway") : "Halfway point.";
    }

    setCue(route === "outback" || route === "trail" ? "TURN BACK" : "HALFWAY");
    setWorkoutMessage(text);

    if(blocking) return R14.say(text);
    R14.say(text);
    return Promise.resolve(true);
  };

  R14.stopVoice = function(){
    try{ if(window.speechSynthesis) window.speechSynthesis.cancel(); }catch(e){}
  };

  R14.buildRunSteps = function(x){
    let total = Number(x.total || 0) * 60;
    if(!total || total < 1) total = 60;

    const runSeconds = Number(x.runSeconds || 60);
    const walkSeconds = Number(x.walkSeconds || 60);

    const steps = [];
    let remaining = total;

    while(remaining > 0){
      const runDur = Math.min(runSeconds, remaining);
      steps.push({kind:"run", label:"Run", seconds:runDur});
      remaining -= runDur;
      if(remaining <= 0) break;

      const walkDur = Math.min(walkSeconds, remaining);
      steps.push({kind:"walk", label:"Walk", seconds:walkDur});
      remaining -= walkDur;
    }

    return {total, steps};
  };

  R14.timerStep = function(seconds, remainingBefore=seconds, total=seconds){
    return new Promise(resolve=>{
      let left = Math.max(0, seconds);
      let elapsed = 0;
      let finished = false;

      R14.stepSkipped = false;
      skipCurrentTimer = false;

      clearInterval(activeTimer);
      activeTimer = null;
      updateTimer(left, remainingBefore, total);

      const finish = (skipped=false)=>{
        if(finished) return;
        finished = true;
        clearInterval(activeTimer);
        activeTimer = null;
        activeTimerResolve = null;
        R14.stepResolve = null;
        resolve({skipped, credited: skipped ? 0 : seconds});
      };

      R14.stepResolve = ()=>finish(true);
      activeTimerResolve = ()=>finish(true);

      activeTimer = setInterval(()=>{
        if(workoutAbort){
          finish(true);
          return;
        }

        if(R14.stepSkipped || skipCurrentTimer){
          finish(true);
          return;
        }

        if(workoutPaused) return;

        left--;
        elapsed++;
        updateTimer(left, Math.max(0, remainingBefore - elapsed), total);

        if(left <= 0) finish(false);
      },1000);
    });
  };

  R14.warmup = async function(){
    if(!settings.warmup) return {skipped:false, credited:0};

    setCue("Warmup");
    setTimer("2:00");
    setWorkoutMessage("Warmup: march, leg swings, calf raises, easy movement. Tap Skip Current Step to move ahead.");
    R14.sayCue("warmup_start", false);

    return R14.timerStep(120,120,120);
  };

  R14.cooldown = async function(){
    setCue("Cooldown");
    setWorkoutMessage("Cooldown: easy walk, calves, hips, hamstrings. Tap Skip Current Step to finish.");
    R14.sayCue("cooldown_start", false);

    return R14.timerStep(180,180,180);
  };

  R14.runStep = async function(step, stepNumber, totalSteps, remaining, totalSeconds){
    const label = step.kind === "run" ? "RUN" : "WALK";
    setCue(`${label} ${stepNumber}/${totalSteps}`);
    setWorkoutMessage(step.kind === "run" ? "Run now. Stay smooth and controlled." : "Walk recovery. Breathe and reset.");

    R14.sayCue(step.kind === "run" ? "run_start" : "walk_recovery", false);

    return R14.timerStep(step.seconds, remaining, totalSeconds);
  };

  R14.startRun = async function(x, readiness="normal"){
    const built = R14.buildRunSteps(x);
    const totalSeconds = readiness === "tired" ? Math.round(built.total * 0.8) : built.total;
    let steps = built.steps;

    // If tired reduces total time, rebuild with the reduced total while preserving intervals.
    if(readiness === "tired"){
      const clone = Object.assign({}, x, {total: totalSeconds / 60});
      steps = R14.buildRunSteps(clone).steps;
    }

    const totalSteps = steps.length;
    const halfwayStep = Math.max(1, Math.ceil(totalSteps / 2));
    let completedSteps = 0;
    let halfwayPlayed = false;
    let remaining = totalSeconds;

    await R14.warmup();
    if(workoutAbort) return;

    for(let i=0; i<steps.length && !workoutAbort; i++){
      const step = steps[i];

      const result = await R14.runStep(step, i+1, totalSteps, remaining, totalSeconds);

      completedSteps++;
      remaining = Math.max(0, remaining - step.seconds);

      if(!halfwayPlayed && completedSteps >= halfwayStep){
        halfwayPlayed = true;
        await R14.sayRouteHalfway(true);
      }
    }

    if(settings.cooldown && !workoutAbort) await R14.cooldown();
    if(workoutAbort) return;

    setCue("Complete");
    setTimer("DONE");
    setWorkoutMessage("Workout complete. Good work.");
    R14.sayCue("workout_complete", false);

    markComplete(false);
    releaseWakeLock();

    if(typeof openWorkoutDebriefV97 === "function"){
      openWorkoutDebriefV97();
    }
  };

  R14.buildStrengthSteps = function(x){
    const rounds = Number(x.rounds || 1);
    const exercises = Array.isArray(x.exercises) ? x.exercises : [];
    const steps = [];

    for(let r=1; r<=rounds; r++){
      for(const e of exercises){
        steps.push({round:r, totalRounds:rounds, exercise:e});
      }
    }

    return steps;
  };

  R14.strengthStep = async function(step, index, totalSteps){
    const e = step.exercise || {};
    const name = e.name || "Exercise";
    const mode = e.mode || "reps";

    setCue(`${index}/${totalSteps}`);
    setWorkoutMessage(`${name}. ${R14.formCue(name)}`);

    const instruction = `${name}. Round ${step.round} of ${step.totalRounds}. ${R14.formCue(name)}`;
    await R14.say(instruction);

    if(mode === "timed"){
      const seconds = Number(e.seconds || 30);
      setTimer(formatTime ? formatTime(seconds) : String(seconds));
      return R14.timerStep(seconds, seconds, seconds);
    }

    setTimer("DONE?");
    setWorkoutMessage(`${name}. ${e.reps || "Complete the reps"}. Tap Skip Current Step when finished.`);
    return new Promise(resolve=>{
      let finished = false;

      R14.stepSkipped = false;
      skipCurrentTimer = false;

      const finish = (skipped=false)=>{
        if(finished) return;
        finished = true;
        activeTimerResolve = null;
        R14.stepResolve = null;
        resolve({skipped, credited:1});
      };

      R14.stepResolve = ()=>finish(true);
      activeTimerResolve = ()=>finish(true);
      window.resolveDone = ()=>finish(false);
    });
  };

  R14.startStrength = async function(x, readiness="normal"){
    await R14.warmup();
    if(workoutAbort) return;

    let steps = R14.buildStrengthSteps(x);
    if(readiness === "tired" && Number(x.rounds || 1) > 1){
      const clone = Object.assign({}, x, {rounds: Math.max(1, Number(x.rounds || 1)-1)});
      steps = R14.buildStrengthSteps(clone);
    }

    const totalSteps = steps.length;
    const halfwayStep = Math.max(1, Math.ceil(totalSteps / 2));
    let completedSteps = 0;
    let halfwayPlayed = false;

    R14.sayCue("strength_begin", false);

    for(let i=0; i<steps.length && !workoutAbort; i++){
      const result = await R14.strengthStep(steps[i], i+1, totalSteps);
      completedSteps++;

      if(!halfwayPlayed && completedSteps >= halfwayStep){
        halfwayPlayed = true;
        await R14.sayRouteHalfway(true);
      }
    }

    if(settings.cooldown && !workoutAbort) await R14.cooldown();
    if(workoutAbort) return;

    setCue("Complete");
    setTimer("DONE");
    setWorkoutMessage("Workout complete. Good work.");
    R14.sayCue("workout_complete", false);

    markComplete(false);
    releaseWakeLock();

    if(typeof openWorkoutDebriefV97 === "function"){
      openWorkoutDebriefV97();
    }
  };

  R14.startWorkout = async function(){
    R14.stopVoice();

    workoutAbort = false;
    skipCurrentTimer = false;
    workoutPaused = false;
    R14.stepSkipped = false;
    R14.lastCue = {key:"", at:0};

    const x = currentWorkout();
    if(!x){
      showModal(`<h2>Workout Error</h2><p class="muted">No workout found for today.</p><button onclick="hideModal()">Done</button>`);
      return;
    }

    R14.renderWorkout();

    document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
    const workout = document.getElementById("workout");
    if(workout) workout.classList.add("active");

    document.querySelectorAll("nav button").forEach(b=>b.classList.remove("active"));
    const navBtns = document.querySelectorAll("nav button");
    if(navBtns[1]) navBtns[1].classList.add("active");

    try{ requestWakeLock(); }catch(e){}

    if(x.type === "run") return R14.startRun(x,"normal");
    if(x.type === "bodyweight") return R14.startStrength(x,"normal");
    return R14.startRest ? R14.startRest(x) : null;
  };

  R14.skipCurrent = function(){
    R14.stopVoice();
    R14.stepSkipped = true;
    skipCurrentTimer = true;
    workoutPaused = false;

    updatePauseButton();
    setCue("Next");
    setTimer("NEXT");
    setWorkoutMessage("Moving to the next step...");

    if(R14.stepResolve) R14.stepResolve();
    else if(activeTimerResolve) activeTimerResolve();

    if(window.resolveDone){
      try{ window.resolveDone(); }catch(e){}
    }
  };

  // Final runtime assignment.
  startWorkout = R14.startWorkout;
  beginWorkout = function(){ return R14.startWorkout(); };
  skipCurrent = R14.skipCurrent;
  window.startWorkout = startWorkout;
  window.beginWorkout = beginWorkout;
  window.skipCurrent = skipCurrent;
})();

// ---------- V14.6 STRENGTH CUES WITHOUT HALFWAY ----------
/*
  Strength workout rule:
  - No halfway cue in strength workouts.
  - Each exercise gets spoken by name.
  - Each exercise gets a short form/instruction cue.
  - Skip moves to the next exercise.
*/

(function(){
  const R14 = window.ruut14Final;
  if(!R14) return;

  R14.startStrength = async function(x, readiness="normal"){
    await R14.warmup();
    if(workoutAbort) return;

    let steps = R14.buildStrengthSteps(x);

    if(readiness === "tired" && Number(x.rounds || 1) > 1){
      const clone = Object.assign({}, x, {rounds: Math.max(1, Number(x.rounds || 1)-1)});
      steps = R14.buildStrengthSteps(clone);
    }

    const totalSteps = steps.length;

    R14.sayCue("strength_begin", false);

    for(let i=0; i<steps.length && !workoutAbort; i++){
      await R14.strengthStep(steps[i], i+1, totalSteps);
      // No halfway cue for strength workouts.
    }

    if(settings.cooldown && !workoutAbort) await R14.cooldown();
    if(workoutAbort) return;

    setCue("Complete");
    setTimer("DONE");
    setWorkoutMessage("Workout complete. Good work.");
    R14.sayCue("workout_complete", false);

    markComplete(false);
    releaseWakeLock();

    if(typeof openWorkoutDebriefV97 === "function"){
      openWorkoutDebriefV97();
    }
  };

  // Re-assign final starter so strength uses the no-halfway version.
  R14.startWorkout = async function(){
    R14.stopVoice();

    workoutAbort = false;
    skipCurrentTimer = false;
    workoutPaused = false;
    R14.stepSkipped = false;
    R14.lastCue = {key:"", at:0};

    const x = currentWorkout();
    if(!x){
      showModal(`<h2>Workout Error</h2><p class="muted">No workout found for today.</p><button onclick="hideModal()">Done</button>`);
      return;
    }

    R14.renderWorkout();

    document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
    const workout = document.getElementById("workout");
    if(workout) workout.classList.add("active");

    document.querySelectorAll("nav button").forEach(b=>b.classList.remove("active"));
    const navBtns = document.querySelectorAll("nav button");
    if(navBtns[1]) navBtns[1].classList.add("active");

    try{ requestWakeLock(); }catch(e){}

    if(x.type === "run") return R14.startRun(x,"normal");
    if(x.type === "bodyweight") return R14.startStrength(x,"normal");
    return R14.startRest ? R14.startRest(x) : null;
  };

  startWorkout = R14.startWorkout;
  beginWorkout = function(){ return R14.startWorkout(); };
  window.startWorkout = startWorkout;
  window.beginWorkout = beginWorkout;
})();

// ---------- V15.0 PREMIUM UI REBUILD ----------
/*
  Premium visual rebuild only.
  Preserves the v14.6 step-based workout/cue engine.
  Removes Journal from visible navigation/rendering.
*/

(function(){
  const R14 = window.ruut14Final || {};
  window.ruut14Final = R14;

  function esc(v){
    return String(v ?? "").replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  }

  function todayShortDate(){
    const d = new Date();
    const yy = String(d.getFullYear()).slice(-2);
    return `${d.getMonth()+1}/${d.getDate()}/${yy}`;
  }

  function workoutTypeLabel(x=currentWorkout()){
    if(!x) return "Workout";
    if(x.type === "bodyweight") return "Bodyweight Exercise";
    if(x.type === "run") return "Run";
    if(x.type === "rest") return "Rest Day";
    return x.type || "Workout";
  }

  function phaseForWeek(w){
    if(w <= 4) return {name:"Foundation", range:"Weeks 1-4", start:1, end:4};
    if(w <= 8) return {name:"Build", range:"Weeks 5-8", start:5, end:8};
    if(w <= 12) return {name:"Peak", range:"Weeks 9-12", start:9, end:12};
    return {name:"Maintain", range:"Ongoing", start:13, end:16};
  }

  function phaseProgress(phase){
    const total = Math.max(1, phase.end - phase.start + 1);
    const done = Math.max(0, Math.min(total, state.week - phase.start + 1));
    return Math.round((done / total) * 100);
  }

  function coachStyleLabel(){
    const style = String(settings.coachStyle || "trail").toLowerCase();
    if(style.includes("tough")) return "Tough Love";
    if(style.includes("calm") || style.includes("balanced")) return "Balanced";
    return "Trail Guide";
  }

  function routeModeLabel(){
    const r = String(settings.routeMode || "outback").toLowerCase();
    if(r.includes("loop")) return "Loop";
    if(r.includes("tread")) return "Treadmill";
    if(r.includes("trail")) return "Trail";
    return "Out & Back";
  }

  function exerciseList(x){
    if(!x || x.type !== "bodyweight" || !Array.isArray(x.exercises)) return "";
    return `<div class="v15-exercise-list">${x.exercises.map(e=>`
      <div class="v15-exercise-row">
        <span>${esc(e.name)}</span>
        <strong>${esc(e.mode==="timed" ? e.seconds+" sec" : e.reps)}</strong>
      </div>`).join("")}</div>`;
  }

  function completionCount(){
    return Array.isArray(state.completed) ? state.completed.length : 0;
  }

  function totalPlanWorkouts(){
    return Array.isArray(plan) ? plan.reduce((sum,w)=>sum + (w.days?.length || 0), 0) : 84;
  }

  function programPercent(){
    return Math.round((completionCount() / Math.max(1,totalPlanWorkouts())) * 100);
  }

  function setActiveNav(id){
    document.querySelectorAll("nav button").forEach(btn=>{
      const target = btn.getAttribute("data-target");
      btn.classList.toggle("active", target === id);
    });
  }

  function iconFor(id){
    return ({today:"⌂",workout:"▶",dashboard:"◔",plan:"▥",recover:"↺"})[id] || "•";
  }

  window.ruutV15InstallShell = function(){
    document.body.classList.add("ruut-v15");
    const header = document.querySelector("header");
    if(header){
      header.innerHTML = `
        <div class="v15-header-brand" onclick="showScreen('today')">
          <div class="v15-wordmark">RUUT</div>
          <div class="v15-subbrand">Train. Live. On Purpose.</div>
        </div>
        <button class="v15-settings-button" onclick="openSettings()">⚙</button>`;
    }

    const nav = document.querySelector("nav");
    if(nav){
      nav.innerHTML = `
        <button class="active" data-target="today" onclick="showScreen('today',this)"><b>${iconFor("today")}</b><span>Today</span></button>
        <button data-target="workout" onclick="showScreen('workout',this)"><b>${iconFor("workout")}</b><span>Workout</span></button>
        <button data-target="plan" onclick="showScreen('plan',this)"><b>${iconFor("plan")}</b><span>Plan</span></button>
        <button data-target="dashboard" onclick="showScreen('dashboard',this)"><b>${iconFor("dashboard")}</b><span>Stats</span></button>
        <button data-target="recover" onclick="showScreen('recover',this)"><b>${iconFor("recover")}</b><span>Recover</span></button>`;
    }

    const journal = document.getElementById("journal");
    if(journal) journal.remove();
  };

  R14.renderToday = function(){
    const host = document.getElementById("today");
    if(!host) return;
    const x = currentWorkout();
    const phase = phaseForWeek(state.week);
    const pct = programPercent();
    const completed = isComplete();
    host.innerHTML = `
      <section class="v15-today-hero">
        <div class="v15-hero-bg"></div>
        <div class="v15-hero-shade"></div>
        <div class="v15-hero-content">
          <div>
            <div class="v15-chip">Today's Mission</div>
            <div class="v15-meta-line">${todayShortDate()} · Week ${state.week} · Day ${state.dayIndex}</div>
            <h2 class="v15-hero-title">${esc(workoutTypeLabel(x))}</h2>
            <div class="v15-hero-subtitle">${esc(x.title || "Workout")}</div>
          </div>
          <div class="v15-hero-bottom">
            <button class="v15-primary-action" onclick="window.startWorkout()">Start Guided Workout</button>
            <button class="v15-round-action" onclick="window.openBriefingV110 ? window.openBriefingV110() : null">→</button>
          </div>
        </div>
      </section>

      <section class="v15-panel v15-coach-card">
        <div class="v15-kicker">Coach Note</div>
        <p>${esc(x.success || x.note || "Move with control. Finish the work.")}</p>
      </section>

      <section class="v15-panel">
        <div class="v15-split">
          <div>
            <div class="v15-kicker">Program Progress</div>
            <h3>${phase.name}</h3>
            <p class="v15-muted">${phase.range}</p>
          </div>
          <div class="v15-ring" style="--pct:${pct}%"><span>${pct}%</span></div>
        </div>
      </section>

      <section class="v15-panel">
        <div class="v15-metric-grid">
          <div><span>Time</span><strong>${esc(x.time || "Planned")}</strong></div>
          <div><span>Target</span><strong>${esc(x.distance || "Complete")}</strong></div>
          <div><span>Coach</span><strong>${coachStyleLabel()}</strong></div>
          <div><span>Status</span><strong>${completed ? "Done" : "Pending"}</strong></div>
        </div>
        ${exerciseList(x)}
      </section>`;
  };

  R14.renderWorkout = function(){
    const host = document.getElementById("workout");
    if(!host) return;
    const x = currentWorkout();
    host.innerHTML = `
      <section class="v15-workout-cockpit">
        <div class="v15-cockpit-top">
          <div class="v15-kicker">Guided Session</div>
          <h2>${esc(x.title || workoutTypeLabel(x))}</h2>
          <p class="v15-muted">${todayShortDate()} · Week ${state.week} · Day ${state.dayIndex} · ${workoutTypeLabel(x)}</p>
        </div>

        <div class="v15-timer-ring" id="v15TimerRing">
          <div>
            <div class="timer" id="timerDisplay">--:--</div>
            <div class="v15-muted" id="v15StepLabel">Ready</div>
          </div>
        </div>

        <div class="progress-bar"><div id="workoutProgress" class="progress-fill"></div></div>
        <p id="workoutMessage" class="v15-workout-message">Tap start and keep this screen open during workouts.</p>
        <div class="v15-awake-pill"><span id="awakeDot" class="dot"></span> <span id="awakeText">Screen awake not active</span></div>

        <div class="v15-cockpit-actions">
          <button class="v15-primary-action" onclick="window.startWorkout()">Start Today's Workout</button>
          <div class="v15-action-row">
            <button class="v15-secondary-action" onclick="window.skipCurrent()">Skip Step</button>
            <button id="pauseButton" class="v15-secondary-action" onclick="window.togglePause()">Pause</button>
          </div>
        </div>
      </section>`;
  };

  R14.renderPlan = function(){
    const host = document.getElementById("plan");
    if(!host) return;
    const phases = [
      {name:"Foundation", range:"Weeks 1-4", start:1, end:4},
      {name:"Build", range:"Weeks 5-8", start:5, end:8},
      {name:"Peak", range:"Weeks 9-12", start:9, end:12}
    ];
    host.innerHTML = `
      <section class="v15-screen-head">
        <div class="v15-kicker">Training Plan</div>
        <h2>Phases</h2>
        <p class="v15-muted">A cleaner view of where you are going.</p>
      </section>
      ${phases.map((ph,i)=>{
        const active = state.week >= ph.start && state.week <= ph.end;
        const pct = phaseProgress(ph);
        return `<section class="v15-phase ${active ? "active" : ""}" onclick="ruutV15OpenPhase(${i})">
          <div class="v15-phase-bg"></div>
          <div class="v15-phase-content">
            <div class="v15-chip">${active ? "Current Phase" : "Training Block"}</div>
            <h3>${ph.name}</h3>
            <p>${ph.range}</p>
            <div class="v15-phase-progress"><div style="width:${pct}%"></div></div>
          </div>
        </section>`;
      }).join("")}`;
  };

  window.ruutV15OpenPhase = function(index){
    const phases = [
      {name:"Foundation", start:1, end:4},
      {name:"Build", start:5, end:8},
      {name:"Peak", start:9, end:12}
    ];
    const ph = phases[index] || phases[0];
    const weeks = plan.filter(w=>w.num>=ph.start && w.num<=ph.end);
    showModal(`<h2>${ph.name}</h2>
      <p class="muted">Weeks ${ph.start}-${ph.end}</p>
      <div class="list" style="margin-top:12px">
        ${weeks.map(w=>`<div class="row"><span>Week ${w.num}: ${esc(w.theme)}</span><strong>${w.num===state.week ? "Current" : "View"}</strong></div>`).join("")}
      </div>
      <div style="height:12px"></div>
      <button onclick="hideModal()">Done</button>`);
  };

  R14.renderDashboard = function(){
    const host = document.getElementById("dashboard");
    if(!host) return;
    const pct = programPercent();
    const completed = completionCount();
    const total = totalPlanWorkouts();
    const streak = state.streak || 0;
    host.innerHTML = `
      <section class="v15-screen-head">
        <div class="v15-kicker">Stats</div>
        <h2>Progress</h2>
        <p class="v15-muted">Simple answers to whether you are improving.</p>
      </section>
      <section class="v15-panel">
        <div class="v15-big-stat">
          <div class="v15-ring large" style="--pct:${pct}%"><span>${pct}%</span></div>
          <div>
            <div class="v15-kicker">Program Completion</div>
            <h3>${completed} / ${total}</h3>
            <p class="v15-muted">workouts completed</p>
          </div>
        </div>
      </section>
      <section class="v15-panel">
        <div class="v15-metric-grid">
          <div><span>Current Streak</span><strong>${streak}</strong></div>
          <div><span>This Week</span><strong>${plan[state.week-1]?.days?.filter((d,i)=>state.completed.includes(`${state.week}-${i+1}`)).length || 0}/7</strong></div>
          <div><span>Week</span><strong>${state.week}</strong></div>
          <div><span>Day</span><strong>${state.dayIndex}</strong></div>
        </div>
      </section>
      <section class="v15-panel">
        <div class="v15-kicker">Trend</div>
        <div class="v15-sparkline">
          <svg viewBox="0 0 320 120" preserveAspectRatio="none">
            <path d="M8 104 L54 82 L98 91 L142 58 L185 67 L232 35 L278 48 L312 22" fill="none" stroke="#b6ff00" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M8 104 L54 82 L98 91 L142 58 L185 67 L232 35 L278 48 L312 22 L312 120 L8 120 Z" fill="rgba(182,255,0,.16)"/>
          </svg>
        </div>
      </section>`;
  };

  R14.renderRecover = function(){
    const host = document.getElementById("recover");
    if(!host) return;
    const items = [
      ["Before Training","Pre-Run Mobility","4 guided movements","⚡"],
      ["After Training","Post-Run Recovery","5 guided movements","☾"],
      ["Pain Relief","Low Back Reset","4 guided movements","✚"],
      ["Flexibility","Mobility Builder","6 guided movements","↗"]
    ];
    host.innerHTML = `
      <section class="v15-screen-head">
        <div class="v15-kicker">Recover</div>
        <h2>What do you need?</h2>
        <p class="v15-muted">Choose by problem, not by exercise category.</p>
      </section>
      ${items.map(([k,t,d,icon])=>`<section class="v15-recover-tile" onclick="openRecoverySessionV7 ? openRecoverySessionV7('${t}') : null">
        <div><div class="v15-kicker">${k}</div><h3>${t}</h3><p>${d}</p></div>
        <div class="v15-recover-icon">${icon}</div>
      </section>`).join("")}`;
  };

  R14.renderAll = function(){
    R14.renderToday();
    R14.renderWorkout();
    R14.renderDashboard();
    R14.renderPlan();
    R14.renderRecover();
  };

  R14.showScreen = function(id, btn){
    document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
    const screen = document.getElementById(id);
    if(screen) screen.classList.add("active");
    setActiveNav(id);
    R14.renderAll();
  };

  const oldOpenSettings = window.openSettings || openSettings;
  window.openSettings = function(){
    showModal(`<h2>Settings</h2>
      <p class="muted">Training behavior and voice controls.</p>
      <div class="v15-settings-list">
        <label>Coach Style<select id="setCoachStyle">
          <option value="trail" ${settings.coachStyle==="trail"?"selected":""}>Trail Guide</option>
          <option value="tough" ${settings.coachStyle==="tough"?"selected":""}>Tough Love</option>
          <option value="calm" ${settings.coachStyle==="calm"?"selected":""}>Balanced</option>
        </select></label>
        <label>Route Mode<select id="setRouteMode">
          <option value="outback" ${settings.routeMode==="outback"?"selected":""}>Out & Back</option>
          <option value="loop" ${settings.routeMode==="loop"?"selected":""}>Loop</option>
          <option value="treadmill" ${settings.routeMode==="treadmill"?"selected":""}>Treadmill</option>
          <option value="trail" ${settings.routeMode==="trail"?"selected":""}>Trail</option>
        </select></label>
        <label>Voice Speed<select id="setVoiceRate">
          <option value="0.85" ${settings.voiceRate==0.85?"selected":""}>Slower</option>
          <option value="0.95" ${settings.voiceRate==0.95?"selected":""}>Normal</option>
          <option value="1.05" ${settings.voiceRate==1.05?"selected":""}>Faster</option>
        </select></label>
        <label><input type="checkbox" id="setWarmup" ${settings.warmup ? "checked" : ""}> Warmup coaching</label>
        <label><input type="checkbox" id="setCooldown" ${settings.cooldown ? "checked" : ""}> Cooldown coaching</label>
        <label><input type="checkbox" id="setAwake" ${settings.keepAwake ? "checked" : ""}> Keep screen awake</label>
      </div>
      <div style="height:12px"></div>
      <button onclick="ruutV15SaveSettings()">Save Settings</button>
      <div style="height:8px"></div>
      <button class="secondary" onclick="hideModal()">Cancel</button>`);
  };

  window.ruutV15SaveSettings = function(){
    settings.coachStyle = document.getElementById("setCoachStyle").value;
    settings.routeMode = document.getElementById("setRouteMode").value;
    settings.voiceRate = Number(document.getElementById("setVoiceRate").value);
    settings.warmup = !!document.getElementById("setWarmup").checked;
    settings.cooldown = !!document.getElementById("setCooldown").checked;
    settings.keepAwake = !!document.getElementById("setAwake").checked;
    saveSettings();
    hideModal();
  };

  renderToday = R14.renderToday;
  renderWorkout = R14.renderWorkout;
  renderDashboard = R14.renderDashboard;
  renderPlan = R14.renderPlan;
  renderRecover = R14.renderRecover;
  renderAll = R14.renderAll;
  showScreen = R14.showScreen;

  window.renderToday = renderToday;
  window.renderWorkout = renderWorkout;
  window.renderDashboard = renderDashboard;
  window.renderPlan = renderPlan;
  window.renderRecover = renderRecover;
  window.renderAll = renderAll;
  window.showScreen = showScreen;

  window.ruutV15InstallShell();
})();


// ---------- V15.1 USABILITY FIXES ----------
/*
  Fixes after v15.0 field test:
  - Restore week/day selector in Settings.
  - Make Plan phase week rows open usable week details.
  - Make Recover tiles start/open correct routines.
  - Fix select/dropdown contrast on iPhone/Safari.
  - Preserve v14.6 workout engine and v15 visual layer.
*/
(function(){
  const R14 = window.ruut14Final || {};
  window.ruut14Final = R14;

  function esc(v){
    return String(v ?? "").replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  }

  window.ruutV151SetWeekDay = function(){
    const weekOptions = plan.map(w=>`<option value="${w.num}" ${state.week===w.num?"selected":""}>Week ${w.num}: ${esc(w.theme)}</option>`).join("");
    const dayOptions = DAYS.map((d,i)=>`<option value="${i+1}" ${state.dayIndex===i+1?"selected":""}>Day ${i+1}: ${d}</option>`).join("");
    showModal(`<h2>Set Current Position</h2>
      <p class="muted">Use this to test different workout days or correct your current place in the program.</p>
      <div class="v15-settings-list">
        <label>Week<select id="v151Week">${weekOptions}</select></label>
        <label>Day<select id="v151Day">${dayOptions}</select></label>
      </div>
      <div style="height:12px"></div>
      <button onclick="ruutV151SaveWeekDay()">Save Position</button>
      <div style="height:8px"></div>
      <button class="secondary" onclick="hideModal()">Cancel</button>`);
  };

  window.ruutV151SaveWeekDay = function(){
    const w = Number(document.getElementById("v151Week")?.value || state.week);
    const d = Number(document.getElementById("v151Day")?.value || state.dayIndex);
    state.week = Math.max(1, Math.min(plan.length, w));
    state.dayIndex = Math.max(1, Math.min(7, d));
    saveState();
    hideModal();
  };

  window.ruutV15OpenPhase = function(index){
    const phases = [
      {name:"Foundation", start:1, end:4},
      {name:"Build", start:5, end:8},
      {name:"Peak", start:9, end:12}
    ];
    const ph = phases[index] || phases[0];
    const weeks = plan.filter(w=>w.num>=ph.start && w.num<=ph.end);
    showModal(`<h2>${ph.name}</h2>
      <p class="muted">Weeks ${ph.start}-${ph.end}</p>
      <div class="list" style="margin-top:12px">
        ${weeks.map(w=>`<div class="row"><span>Week ${w.num}: ${esc(w.theme)}</span><button class="secondary smallbtn" onclick="ruutV151ViewWeek(${w.num})">View</button></div>`).join("")}
      </div>
      <div style="height:12px"></div>
      <button onclick="hideModal()">Done</button>`);
  };

  window.ruutV151ViewWeek = function(weekNum){
    const w = plan.find(x=>x.num===Number(weekNum));
    if(!w) return;
    showModal(`<h2>Week ${w.num}</h2>
      <p class="muted">${esc(w.theme)}</p>
      <div class="list" style="margin-top:12px">
        ${w.days.map((d,i)=>{
          const key = `${w.num}-${i+1}`;
          const done = state.completed.includes(key);
          const type = d.type === "bodyweight" ? "Strength" : d.type === "run" ? "Run" : "Rest";
          return `<div class="v15-week-detail ${done?"done":""}">
            <div>
              <strong>Day ${i+1} · ${esc(d.day)} · ${type}</strong>
              <p class="muted small">${esc(d.title)} · ${esc(d.time)} · ${esc(d.structure)}</p>
            </div>
            <button class="secondary smallbtn" onclick="ruutV151SetToDay(${w.num},${i+1})">Set</button>
          </div>`;
        }).join("")}
      </div>
      <div style="height:12px"></div>
      <button onclick="hideModal()">Done</button>`);
  };

  window.ruutV151SetToDay = function(weekNum, dayIndex){
    state.week = Number(weekNum);
    state.dayIndex = Number(dayIndex);
    saveState();
    hideModal();
    showScreen('today');
  };

  window.ruutV151StartRecovery = function(id){
    const mapping = {
      before:"dynamic-warmup",
      after:"static-cooldown",
      pain:"low-back-friendly",
      flexibility:"flexibility"
    };
    const routineId = mapping[id] || id;
    if(typeof startRunnerRoutineV7 === "function"){
      startRunnerRoutineV7(routineId);
      return;
    }
    showModal(`<h2>Recover</h2><p class="muted">Recovery routine engine was not found.</p><button onclick="hideModal()">Done</button>`);
  };

  R14.renderRecover = function(){
    const host = document.getElementById("recover");
    if(!host) return;
    const items = [
      ["before","Before Training","Pre-Run Mobility","Dynamic movement before a run or workout.","⚡"],
      ["after","After Training","Post-Run Recovery","Static cooldown work after training.","☾"],
      ["pain","Pain Relief","Low Back Reset","Gentle work for tight or irritated low back.","✚"],
      ["flexibility","Flexibility","Mobility Builder","Slow recovery-day flexibility work.","↗"]
    ];
    host.innerHTML = `
      <section class="v15-screen-head">
        <div class="v15-kicker">Recover</div>
        <h2>What do you need?</h2>
        <p class="v15-muted">Choose by problem, not by exercise category.</p>
      </section>
      ${items.map(([id,k,t,d,icon])=>`<section class="v15-recover-tile" onclick="ruutV151StartRecovery('${id}')">
        <div><div class="v15-kicker">${k}</div><h3>${t}</h3><p>${d}</p></div>
        <div class="v15-recover-icon">${icon}</div>
      </section>`).join("")}`;
  };

  window.openSettings = function(){
    showModal(`<h2>Settings</h2>
      <p class="muted">Training behavior and voice controls.</p>
      <div class="v15-settings-list">
        <label>Program Position<div class="v15-position-row"><span>Week ${state.week} · Day ${state.dayIndex}</span><button class="secondary smallbtn" onclick="ruutV151SetWeekDay()">Change</button></div></label>
        <label>Coach Style<select id="setCoachStyle">
          <option value="trail" ${settings.coachStyle==="trail"?"selected":""}>Trail Guide</option>
          <option value="tough" ${settings.coachStyle==="tough"?"selected":""}>Tough Love</option>
          <option value="calm" ${settings.coachStyle==="calm"?"selected":""}>Balanced</option>
        </select></label>
        <label>Route Mode<select id="setRouteMode">
          <option value="outback" ${settings.routeMode==="outback"?"selected":""}>Out & Back</option>
          <option value="loop" ${settings.routeMode==="loop"?"selected":""}>Loop</option>
          <option value="treadmill" ${settings.routeMode==="treadmill"?"selected":""}>Treadmill</option>
          <option value="trail" ${settings.routeMode==="trail"?"selected":""}>Trail</option>
        </select></label>
        <label>Voice Speed<select id="setVoiceRate">
          <option value="0.85" ${settings.voiceRate==0.85?"selected":""}>Slower</option>
          <option value="0.95" ${settings.voiceRate==0.95?"selected":""}>Normal</option>
          <option value="1.05" ${settings.voiceRate==1.05?"selected":""}>Faster</option>
        </select></label>
        <label><input type="checkbox" id="setWarmup" ${settings.warmup ? "checked" : ""}> Warmup coaching</label>
        <label><input type="checkbox" id="setCooldown" ${settings.cooldown ? "checked" : ""}> Cooldown coaching</label>
        <label><input type="checkbox" id="setAwake" ${settings.keepAwake ? "checked" : ""}> Keep screen awake</label>
      </div>
      <div style="height:12px"></div>
      <button onclick="ruutV15SaveSettings()">Save Settings</button>
      <div style="height:8px"></div>
      <button class="secondary" onclick="hideModal()">Cancel</button>`);
  };

  renderRecover = R14.renderRecover;
  window.renderRecover = renderRecover;
})();


// ---------- V15.4.1 RECOVERY AUDIO + ICON POLISH ----------
(function(){
  function stopSpeechV1541(){
    try{ if(window.speechSynthesis){ window.speechSynthesis.cancel(); } }catch(e){}
    try{ if(typeof ruut14StopVoice === "function") ruut14StopVoice(); }catch(e){}
    try{ if(window.ruut1541RecoveryUtterance){ window.ruut1541RecoveryUtterance.onend=null; window.ruut1541RecoveryUtterance.onerror=null; } }catch(e){}
    window.ruut1541RecoveryUtterance = null;
  }

  window.ruut1541StopSpeech = stopSpeechV1541;

  const baseSkipCurrentV1541 = window.skipCurrent || (typeof skipCurrent === "function" ? skipCurrent : null);
  window.skipCurrent = function(){
    stopSpeechV1541();
    if(baseSkipCurrentV1541) return baseSkipCurrentV1541.apply(this, arguments);
  };
  try{ skipCurrent = window.skipCurrent; }catch(e){}

  const baseTogglePauseV1541 = window.togglePause || (typeof togglePause === "function" ? togglePause : null);
  window.togglePause = function(){
    stopSpeechV1541();
    if(baseTogglePauseV1541) return baseTogglePauseV1541.apply(this, arguments);
  };
  try{ togglePause = window.togglePause; }catch(e){}

  window.ruut154SpeakRecoveryStep = function(){
    const active = state.activeRecoveryV154;
    if(!active) return;
    const r = RECOVERY_LIBRARY_V154?.[active.id];
    if(!r) return;
    const step = r.steps[active.index];
    if(!step) return;

    const cue = String(step.cue || step.instruction || "").trim();
    const text = `${step.name}. ${step.duration} seconds. ${cue.replace(new RegExp('^' + String(step.name).replace(/[.*+?^${}()|[\\]\\]/g, '\\$&') + '\\.?\\s*', 'i'), '')}`;

    try{
      stopSpeechV1541();
      if(window.speechSynthesis){
        window.speechSynthesis.resume();
        const u = new SpeechSynthesisUtterance(text);
        u.rate = settings.voiceRate || 0.95;
        u.pitch = 1;
        u.volume = 1;
        try{
          const voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
          const selected = voices.find(v => v.voiceURI === settings.voiceURI);
          if(selected) u.voice = selected;
        }catch(e){}
        window.ruut1541RecoveryUtterance = u;
        window.speechSynthesis.speak(u);
      }
    }catch(e){}
  };

  const baseShowRecoveryStepV1541 = window.ruut154ShowRecoveryStep;
  window.ruut154ShowRecoveryStep = function(){
    stopSpeechV1541();
    if(baseShowRecoveryStepV1541) return baseShowRecoveryStepV1541.apply(this, arguments);
  };

  window.ruut154NextRecoveryStep = function(){
    stopSpeechV1541();
    const active = state.activeRecoveryV154;
    if(!active) return;
    const r = RECOVERY_LIBRARY_V154?.[active.id];
    if(!r) return;
    if(active.index < r.steps.length - 1){
      active.index++;
      saveState();
      ruut154ShowRecoveryStep();
    }else{
      ruut154CompleteRecovery();
    }
  };

  window.ruut154PrevRecoveryStep = function(){
    stopSpeechV1541();
    const active = state.activeRecoveryV154;
    if(!active) return;
    if(active.index > 0){
      active.index--;
      saveState();
      ruut154ShowRecoveryStep();
    }else{
      ruut154ShowRecoveryStep();
    }
  };

  const baseCompleteRecoveryV1541 = window.ruut154CompleteRecovery;
  window.ruut154CompleteRecovery = function(){
    stopSpeechV1541();
    if(baseCompleteRecoveryV1541) return baseCompleteRecoveryV1541.apply(this, arguments);
  };
})();

renderAll();

// ---------- V15.3 VISUAL POLISH: MODALS + SUBWINDOWS ----------
/*
  Visual-only polish for v15 subwindows.
  - Plan phase and week detail modals now use premium v15 markup.
  - Settings modal uses premium grouped rows.
  - Global modal styling is handled in CSS.
  - Workout engine and cue logic untouched.
*/
(function(){
  const R14 = window.ruut14Final || {};
  window.ruut14Final = R14;

  function esc(v){
    return String(v ?? "").replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  }

  function typeLabel(type){
    if(type === "bodyweight") return "Strength";
    if(type === "run") return "Run";
    if(type === "rest") return "Rest";
    return type || "Workout";
  }

  window.ruutV15ModalClose = function(){ hideModal(); };

  window.ruutV15OpenPhase = function(index){
    const phases = [
      {name:"Foundation", start:1, end:4, note:"Build rhythm, control, and consistency."},
      {name:"Build", start:5, end:8, note:"Increase capacity while protecting recovery."},
      {name:"Peak", start:9, end:12, note:"Prepare for your strongest effort."}
    ];
    const ph = phases[index] || phases[0];
    const weeks = plan.filter(w=>w.num>=ph.start && w.num<=ph.end);
    showModal(`<div class="v15-modal-head">
        <div class="v15-kicker">Training Block</div>
        <h2>${ph.name}</h2>
        <p class="v15-muted">Weeks ${ph.start}-${ph.end}. ${ph.note}</p>
      </div>
      <div class="v15-modal-list">
        ${weeks.map(w=>{
          const active = state.week === w.num;
          const completed = w.days.filter((d,i)=>state.completed.includes(`${w.num}-${i+1}`)).length;
          return `<button class="v15-modal-week ${active ? "active" : ""}" onclick="ruutV151ViewWeek(${w.num})">
            <div>
              <div class="v15-kicker">${active ? "Current Week" : "Week " + w.num}</div>
              <h3>Week ${w.num}: ${esc(w.theme)}</h3>
              <p>${completed}/7 days completed</p>
            </div>
            <span>›</span>
          </button>`;
        }).join("")}
      </div>
      <button class="v15-secondary-action" onclick="hideModal()">Done</button>`);
  };

  window.ruutV151ViewWeek = function(weekNum){
    const w = plan.find(x=>x.num===Number(weekNum));
    if(!w) return;
    showModal(`<div class="v15-modal-head">
        <div class="v15-kicker">Training Week</div>
        <h2>Week ${w.num}</h2>
        <p class="v15-muted">${esc(w.theme)}</p>
      </div>
      <div class="v15-week-stack">
        ${w.days.map((d,i)=>{
          const dayIndex = i+1;
          const key = `${w.num}-${dayIndex}`;
          const done = state.completed.includes(key);
          const active = state.week === w.num && state.dayIndex === dayIndex;
          return `<section class="v15-day-card ${active ? "active" : ""} ${done ? "done" : ""}">
            <div class="v15-day-number">${dayIndex}</div>
            <div class="v15-day-main">
              <div class="v15-kicker">${esc(d.day)} · ${typeLabel(d.type)}</div>
              <h3>${esc(d.title)}</h3>
              <p>${esc(d.time)} · ${esc(d.structure)}</p>
              <div class="v15-day-meta"><span>${esc(d.distance || "No target")}</span>${done ? "<span>Completed</span>" : active ? "<span>Current</span>" : ""}</div>
            </div>
            <button class="v15-mini-action" onclick="ruutV151SetToDay(${w.num},${dayIndex})">Set</button>
          </section>`;
        }).join("")}
      </div>
      <div class="v15-modal-actions">
        <button class="v15-secondary-action" onclick="ruutV15OpenPhase(${w.num<=4?0:w.num<=8?1:2})">Back to Block</button>
        <button class="v15-primary-action" onclick="hideModal()">Done</button>
      </div>`);
  };

  window.ruutV151SetWeekDay = function(){
    const weekOptions = plan.map(w=>`<option value="${w.num}" ${state.week===w.num?"selected":""}>Week ${w.num}: ${esc(w.theme)}</option>`).join("");
    const dayOptions = DAYS.map((d,i)=>`<option value="${i+1}" ${state.dayIndex===i+1?"selected":""}>Day ${i+1}: ${d}</option>`).join("");
    showModal(`<div class="v15-modal-head">
        <div class="v15-kicker">Program Position</div>
        <h2>Set Week / Day</h2>
        <p class="v15-muted">Use this to test run days, strength days, and halfway cues.</p>
      </div>
      <div class="v15-settings-list v15-settings-premium">
        <label>Week<select id="v151Week">${weekOptions}</select></label>
        <label>Day<select id="v151Day">${dayOptions}</select></label>
      </div>
      <div class="v15-modal-actions">
        <button class="v15-secondary-action" onclick="hideModal()">Cancel</button>
        <button class="v15-primary-action" onclick="ruutV151SaveWeekDay()">Save Position</button>
      </div>`);
  };

  window.openSettings = function(){
    showModal(`<div class="v15-modal-head">
        <div class="v15-kicker">RUUT Control Center</div>
        <h2>Settings</h2>
        <p class="v15-muted">Training behavior, voice, route mode, and current program position.</p>
      </div>
      <div class="v15-settings-premium">
        <section class="v15-settings-group">
          <div class="v15-settings-group-title">Program</div>
          <div class="v15-settings-row">
            <div><strong>Current Position</strong><p>Week ${state.week} · Day ${state.dayIndex}</p></div>
            <button class="v15-mini-action" onclick="ruutV151SetWeekDay()">Change</button>
          </div>
        </section>

        <section class="v15-settings-group">
          <div class="v15-settings-group-title">Coaching</div>
          <label>Coach Style<select id="setCoachStyle">
            <option value="trail" ${settings.coachStyle==="trail"?"selected":""}>Trail Guide</option>
            <option value="tough" ${settings.coachStyle==="tough"?"selected":""}>Tough Love</option>
            <option value="calm" ${settings.coachStyle==="calm"?"selected":""}>Balanced</option>
          </select></label>
          <label>Voice Speed<select id="setVoiceRate">
            <option value="0.85" ${settings.voiceRate==0.85?"selected":""}>Slower</option>
            <option value="0.95" ${settings.voiceRate==0.95?"selected":""}>Normal</option>
            <option value="1.05" ${settings.voiceRate==1.05?"selected":""}>Faster</option>
          </select></label>
        </section>

        <section class="v15-settings-group">
          <div class="v15-settings-group-title">Workout</div>
          <label>Route Mode<select id="setRouteMode">
            <option value="outback" ${settings.routeMode==="outback"?"selected":""}>Out & Back</option>
            <option value="loop" ${settings.routeMode==="loop"?"selected":""}>Loop</option>
            <option value="treadmill" ${settings.routeMode==="treadmill"?"selected":""}>Treadmill</option>
            <option value="trail" ${settings.routeMode==="trail"?"selected":""}>Trail</option>
          </select></label>
          <label class="v15-check-row"><span>Warmup coaching</span><input type="checkbox" id="setWarmup" ${settings.warmup ? "checked" : ""}></label>
          <label class="v15-check-row"><span>Cooldown coaching</span><input type="checkbox" id="setCooldown" ${settings.cooldown ? "checked" : ""}></label>
          <label class="v15-check-row"><span>Keep screen awake</span><input type="checkbox" id="setAwake" ${settings.keepAwake ? "checked" : ""}></label>
        </section>
      </div>
      <div class="v15-modal-actions">
        <button class="v15-secondary-action" onclick="hideModal()">Cancel</button>
        <button class="v15-primary-action" onclick="ruutV15SaveSettings()">Save Settings</button>
      </div>`);
  };
})();

// ---------- V15.3.1 SUBWINDOW VISUAL FIX ----------
/*
  Corrective visual patch for v15 subwindows.
  - Replaces old-looking Plan, Week, Settings, Set Position, and Briefing modals.
  - Changes markup/classes only.
  - Workout engine, cue logic, skip, halfway, and debrief saving untouched.
*/
(function(){
  function esc(v){return String(v ?? "").replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));}
  function typeLabel(type){return type==="bodyweight"?"Strength":type==="run"?"Run":type==="rest"?"Rest":(type||"Workout");}
  function phaseForWeek(n){return n<=4?0:n<=8?1:2;}
  function phaseData(index){
    return [
      {name:"Foundation",start:1,end:4,note:"Build rhythm, control, and consistency."},
      {name:"Build",start:5,end:8,note:"Increase capacity while protecting recovery."},
      {name:"Peak",start:9,end:12,note:"Prepare for your strongest effort."}
    ][index] || {name:"Foundation",start:1,end:4,note:"Build rhythm, control, and consistency."};
  }
  function modalHero(kind,kicker,title,sub){
    return `<div class="v1531-modal-hero ${kind||""}"><div class="v1531-kicker">${esc(kicker)}</div><h2 class="v1531-title">${esc(title)}</h2>${sub?`<div class="v1531-sub">${esc(sub)}</div>`:""}</div>`;
  }

  window.openBriefingV110 = function(){
    const x=currentWorkout();
    showModal(`${modalHero("workout","Workout Briefing",x.title||"Today",`${typeLabel(x.type)} · ${x.time||"Planned"}`)}
      <div class="v1531-stack">
        <div class="v1531-brief-item"><strong>Goal</strong><p>${esc(x.purpose||"Complete today’s workout with control.")}</p></div>
        <div class="v1531-brief-item"><strong>Structure</strong><p>${esc(x.structure||"Follow the guided session.")}</p></div>
        <div class="v1531-brief-item"><strong>Success</strong><p>${esc(x.success||"Finish the work cleanly.")}</p></div>
      </div>
      <div class="v1531-actions">
        <button class="v1531-button-secondary" onclick="hideModal()">Done</button>
        <button class="v1531-button-primary" onclick="hideModal();window.startWorkout()">Start Guided Workout</button>
      </div>`);
  };

  window.ruutV15OpenPhase = function(index){
    const ph=phaseData(index);
    const weeks=plan.filter(w=>w.num>=ph.start&&w.num<=ph.end);
    showModal(`${modalHero("","Training Block",ph.name,`Weeks ${ph.start}-${ph.end}. ${ph.note}`)}
      <div class="v1531-stack">
        ${weeks.map(w=>{
          const active=state.week===w.num;
          const completed=w.days.filter((d,i)=>state.completed.includes(`${w.num}-${i+1}`)).length;
          return `<button class="v1531-week-row ${active?"active":""}" onclick="ruutV151ViewWeek(${w.num})">
            <div><div class="v1531-kicker">${active?"Current Week":"Week "+w.num}</div><h3>Week ${w.num}: ${esc(w.theme)}</h3><p>${completed}/7 days completed</p></div><span class="v1531-chevron">›</span>
          </button>`;
        }).join("")}
      </div>
      <div class="v1531-actions single"><button class="v1531-button-secondary" onclick="hideModal()">Done</button></div>`);
  };

  window.ruutV151ViewWeek = function(weekNum){
    const w=plan.find(x=>x.num===Number(weekNum));
    if(!w) return;
    showModal(`${modalHero("","Training Week",`Week ${w.num}`,w.theme)}
      <div class="v1531-stack">
        ${w.days.map((d,i)=>{
          const dayIndex=i+1;
          const key=`${w.num}-${dayIndex}`;
          const done=state.completed.includes(key);
          const active=state.week===w.num&&state.dayIndex===dayIndex;
          return `<section class="v1531-day-row ${active?"active":""} ${done?"done":""}">
            <div><div class="v1531-kicker">Day ${dayIndex} · ${esc(d.day)} · ${typeLabel(d.type)}</div><h3>${esc(d.title)}</h3><p>${esc(d.time)} · ${esc(d.structure)}</p><p>${done?"Completed":active?"Current workout":esc(d.distance||"No target")}</p></div>
            <button class="v1531-mini" onclick="ruutV151SetToDay(${w.num},${dayIndex})">Set</button>
          </section>`;
        }).join("")}
      </div>
      <div class="v1531-actions">
        <button class="v1531-button-secondary" onclick="ruutV15OpenPhase(${phaseForWeek(w.num)})">Back</button>
        <button class="v1531-button-primary" onclick="hideModal()">Done</button>
      </div>`);
  };

  window.ruutV151SetWeekDay = function(){
    const weekOptions=plan.map(w=>`<option value="${w.num}" ${state.week===w.num?"selected":""}>Week ${w.num}: ${esc(w.theme)}</option>`).join("");
    const dayOptions=DAYS.map((d,i)=>`<option value="${i+1}" ${state.dayIndex===i+1?"selected":""}>Day ${i+1}: ${d}</option>`).join("");
    showModal(`${modalHero("settings","Program Position","Set Week / Day","Use this to test run days, strength days, and halfway cues.")}
      <div class="v1531-settings-group">
        <label class="v1531-field">Week<select id="v151Week">${weekOptions}</select></label>
        <label class="v1531-field">Day<select id="v151Day">${dayOptions}</select></label>
      </div>
      <div class="v1531-actions">
        <button class="v1531-button-secondary" onclick="hideModal()">Cancel</button>
        <button class="v1531-button-primary" onclick="ruutV151SaveWeekDay()">Save Position</button>
      </div>`);
  };

  window.openSettings = function(){
    showModal(`${modalHero("settings","RUUT Control Center","Settings","Training behavior, voice, route mode, and current program position.")}
      <div class="v1531-stack">
        <section class="v1531-settings-group">
          <div class="v1531-settings-title">Program</div>
          <div class="v1531-row"><div><h3>Current Position</h3><p>Week ${state.week} · Day ${state.dayIndex}</p></div><button class="v1531-mini" onclick="ruutV151SetWeekDay()">Change</button></div>
        </section>
        <section class="v1531-settings-group">
          <div class="v1531-settings-title">Coaching</div>
          <label class="v1531-field">Coach Style<select id="setCoachStyle"><option value="trail" ${settings.coachStyle==="trail"?"selected":""}>Trail Guide</option><option value="tough" ${settings.coachStyle==="tough"?"selected":""}>Tough Love</option><option value="calm" ${settings.coachStyle==="calm"?"selected":""}>Balanced</option></select></label>
          <label class="v1531-field">Voice Speed<select id="setVoiceRate"><option value="0.85" ${settings.voiceRate==0.85?"selected":""}>Slower</option><option value="0.95" ${settings.voiceRate==0.95?"selected":""}>Normal</option><option value="1.05" ${settings.voiceRate==1.05?"selected":""}>Faster</option></select></label>
        </section>
        <section class="v1531-settings-group">
          <div class="v1531-settings-title">Workout</div>
          <label class="v1531-field">Route Mode<select id="setRouteMode"><option value="outback" ${settings.routeMode==="outback"?"selected":""}>Out & Back</option><option value="loop" ${settings.routeMode==="loop"?"selected":""}>Loop</option><option value="treadmill" ${settings.routeMode==="treadmill"?"selected":""}>Treadmill</option><option value="trail" ${settings.routeMode==="trail"?"selected":""}>Trail</option></select></label>
          <label class="v1531-check"><span>Warmup coaching</span><input type="checkbox" id="setWarmup" ${settings.warmup?"checked":""}></label>
          <label class="v1531-check"><span>Cooldown coaching</span><input type="checkbox" id="setCooldown" ${settings.cooldown?"checked":""}></label>
          <label class="v1531-check"><span>Keep screen awake</span><input type="checkbox" id="setAwake" ${settings.keepAwake?"checked":""}></label>
        </section>
      </div>
      <div class="v1531-actions">
        <button class="v1531-button-secondary" onclick="hideModal()">Cancel</button>
        <button class="v1531-button-primary" onclick="ruutV15SaveSettings()">Save Settings</button>
      </div>`);
  };
})();


// ---------- V15.4 TRAINING LOG + RECOVERY GUIDANCE ----------
/*
  Improvements:
  - Honest stats: no fake trend graph without real training data.
  - Training log/history built from completed workouts, debriefs, and recovery sessions.
  - Premium workout debrief modal.
  - Guided recovery sessions with detailed instructions and spoken cues.
  - Adds Full Body Flexibility recovery section.
  - Does not alter workout engine, run/halfway cues, strength workout cues, or skip behavior.
*/
(function(){
  const R14 = window.ruut14Final || {};
  window.ruut14Final = R14;

  function esc(v){
    return String(v ?? "").replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  }

  function shortDate(d=new Date()){
    try{
      const x = d instanceof Date ? d : new Date(d);
      return `${x.getMonth()+1}/${x.getDate()}/${String(x.getFullYear()).slice(-2)}`;
    }catch(e){ return new Date().toLocaleDateString(); }
  }

  function completedCount(){ return Array.isArray(state.completed) ? state.completed.length : 0; }
  function totalWorkouts(){ return Array.isArray(plan) ? plan.reduce((s,w)=>s+(w.days?.length||0),0) : 84; }
  function programPct(){ return Math.round((completedCount()/Math.max(1,totalWorkouts()))*100); }

  function weekCompletionCounts(){
    return (plan || []).map(w=>{
      const done = (w.days || []).filter((d,i)=>state.completed?.includes(`${w.num}-${i+1}`)).length;
      return {week:w.num, done, total:(w.days || []).length};
    });
  }

  function workoutHistoryItems(){
    const debriefs = (state.workoutDebriefs || []).map(d=>({
      kind:"Workout",
      iso:d.iso || "",
      date:d.date || shortDate(),
      title:d.title || "Workout",
      meta:`W${d.week || "?"} D${d.dayIndex || "?"} · ${d.type === "bodyweight" ? "Strength" : d.type || "Workout"}`,
      detail:`Effort: ${d.feel || "Not rated"} · Issue: ${d.issue || "None"}`,
      note:d.note || "",
      flag:d.issue && !["None","Not recorded"].includes(d.issue) ? "Attention" : "Complete"
    }));

    const rec = (state.recoverySessions || []).map(r=>({
      kind:"Recovery",
      iso:r.iso || "",
      date:r.date || shortDate(),
      title:r.title || "Recovery Session",
      meta:r.category || "Recover",
      detail:`${r.steps || 0} movements completed`,
      note:"",
      flag:"Recovery"
    }));

    return [...debriefs, ...rec].sort((a,b)=>String(b.iso).localeCompare(String(a.iso)));
  }

  function debriefSummary(){
    const recent = (state.workoutDebriefs || []).slice(-10);
    const pain = recent.filter(d=>d.issue && !["None","Not recorded"].includes(d.issue)).length;
    const hard = recent.filter(d=>["Hard","Very Hard","Max"].includes(d.feel)).length;
    const modified = recent.filter(d=>String(d.issue||"").includes("Modified")).length;
    return {recent, pain, hard, modified};
  }

  R14.renderDashboard = function(){
    const host = document.getElementById("dashboard");
    if(!host) return;

    const completed = completedCount();
    const total = totalWorkouts();
    const pct = programPct();
    const weeks = weekCompletionCounts();
    const hasTrainingData = completed > 0 || (state.workoutDebriefs || []).length > 0 || (state.recoverySessions || []).length > 0;
    const thisWeek = weeks.find(w=>w.week === state.week) || {done:0,total:7};
    const runDone = (state.workoutDebriefs || []).filter(d=>d.type==="run").length;
    const strengthDone = (state.workoutDebriefs || []).filter(d=>d.type==="bodyweight").length;
    const recoveryDone = (state.recoverySessions || []).length;
    const deb = debriefSummary();
    const history = workoutHistoryItems().slice(0,6);

    const trend = hasTrainingData ? `
      <section class="v15-panel v154-panel">
        <div class="v15-kicker">Weekly Completion</div>
        <div class="v154-week-bars">
          ${weeks.slice(0, Math.max(state.week,4)).map(w=>`
            <div class="v154-week-bar">
              <span>W${w.week}</span>
              <div><i style="width:${Math.round((w.done/Math.max(1,w.total))*100)}%"></i></div>
              <b>${w.done}/${w.total}</b>
            </div>`).join("")}
        </div>
      </section>` : `
      <section class="v15-panel v154-empty">
        <div class="v15-kicker">Trend Locked</div>
        <h3>No training trend yet.</h3>
        <p class="v15-muted">Complete workouts, save debriefs, or finish recovery sessions to unlock honest trend data. RUUT will not show fake progress charts.</p>
      </section>`;

    host.innerHTML = `
      <section class="v15-screen-head">
        <div class="v15-kicker">Stats</div>
        <h2>Progress</h2>
        <p class="v15-muted">Real training data only. No placeholder trend lines.</p>
      </section>

      <section class="v15-panel v154-panel">
        <div class="v15-big-stat">
          <div class="v15-ring large" style="--pct:${pct}%"><span>${pct}%</span></div>
          <div>
            <div class="v15-kicker">Program Completion</div>
            <h3>${completed} / ${total}</h3>
            <p class="v15-muted">planned workouts completed</p>
          </div>
        </div>
      </section>

      <section class="v15-panel v154-panel">
        <div class="v15-metric-grid">
          <div><span>This Week</span><strong>${thisWeek.done}/${thisWeek.total}</strong></div>
          <div><span>Streak</span><strong>${state.streak || 0}</strong></div>
          <div><span>Run Logs</span><strong>${runDone}</strong></div>
          <div><span>Strength Logs</span><strong>${strengthDone}</strong></div>
          <div><span>Recovery</span><strong>${recoveryDone}</strong></div>
          <div><span>Pain Flags</span><strong>${deb.pain}</strong></div>
        </div>
      </section>

      ${trend}

      <section class="v15-panel v154-panel">
        <div class="v15-kicker">Recent Training Log</div>
        ${history.length ? `<div class="v154-history-list">${history.map(h=>`
          <div class="v154-history-row" onclick="ruut154ShowHistoryDetail('${esc(h.iso)}')">
            <div>
              <strong>${esc(h.title)}</strong>
              <p>${esc(h.meta)} · ${esc(h.date)}</p>
              <p>${esc(h.detail)}</p>
            </div>
            <span>${esc(h.flag)}</span>
          </div>`).join("")}</div>` :
          `<div class="v154-empty-mini">No saved workouts or recovery sessions yet.</div>`}
      </section>`;
  };

  window.ruut154ShowHistoryDetail = function(iso){
    const item = workoutHistoryItems().find(x=>x.iso===iso);
    if(!item) return;
    showModal(`<div class="v1531-modal-head">
      <div class="v15-kicker">${esc(item.kind)}</div>
      <h2>${esc(item.title)}</h2>
      <p>${esc(item.meta)} · ${esc(item.date)}</p>
    </div>
    <section class="v1531-group">
      <div class="v1531-row"><span>Status</span><strong>${esc(item.flag)}</strong></div>
      <div class="v1531-row"><span>Details</span><strong>${esc(item.detail)}</strong></div>
      ${item.note ? `<div class="v1531-row vertical"><span>Notes</span><p>${esc(item.note)}</p></div>` : ""}
    </section>
    <div class="v1531-actions"><button class="v1531-button-primary" onclick="hideModal()">Done</button></div>`);
  };

  const RECOVERY_LIBRARY_V154 = {
    preRun:{
      category:"Before Training",
      title:"Pre-Run Mobility",
      purpose:"Prime the hips, ankles, calves, and trunk before running.",
      steps:[
        {name:"Leg Swings", duration:45, instruction:"Stand tall and hold a wall or truck bed for balance. Swing one leg forward and back with control. Keep your torso quiet and switch sides halfway through.", cue:"Leg swings. Stand tall, hold support if needed, and swing one leg forward and back with control. Switch sides halfway."},
        {name:"World’s Greatest Stretch", duration:60, instruction:"Step into a deep lunge. Put both hands inside the front foot. Drop the back knee if needed. Rotate your chest toward the front leg and reach that arm to the sky. Switch sides halfway.", cue:"World’s Greatest Stretch. Step into a deep lunge, hands inside the front foot, rotate your chest toward the front leg, and reach to the sky. Switch sides halfway."},
        {name:"Ankle Rocks", duration:45, instruction:"Take a half-kneeling stance. Keep the front heel down and gently drive the knee forward over the toes. Move slowly. Switch sides halfway.", cue:"Ankle rocks. Keep the front heel down and drive the knee forward with control. Switch sides halfway."},
        {name:"Glute Bridge", duration:45, instruction:"Lie on your back, knees bent, feet flat. Drive through the heels, squeeze the glutes, lift the hips, pause, then lower slowly.", cue:"Glute bridges. Drive through your heels, squeeze the glutes, lift the hips, pause, and lower under control."}
      ]
    },
    postRun:{
      category:"After Training",
      title:"Post-Run Recovery",
      purpose:"Bring the system down and reduce calf, hip, and hamstring tightness.",
      steps:[
        {name:"Standing Calf Stretch", duration:60, instruction:"Put both hands on a wall. Step one foot back, keep the heel down, and lean forward until the calf stretches. Switch sides halfway.", cue:"Standing calf stretch. Hands on a wall, back heel down, lean forward gently. Switch sides halfway."},
        {name:"Hamstring Reach", duration:60, instruction:"Place one heel forward with the toes up. Hinge at the hips, keep the back flat, and reach toward the toes without rounding hard. Switch sides halfway.", cue:"Hamstring reach. Heel forward, toes up, hinge at the hips, and keep your back flat. Switch sides halfway."},
        {name:"Couch Stretch", duration:60, instruction:"Put one knee near a wall or couch with the shin behind you. Bring the other foot forward into a lunge. Stay tall and squeeze the glute on the down-knee side. Switch halfway.", cue:"Couch stretch. Shin behind you, other foot forward, stay tall, and squeeze the glute. Switch sides halfway."},
        {name:"Figure Four Stretch", duration:60, instruction:"Lie on your back. Cross one ankle over the opposite knee. Pull the uncrossed leg toward you until the glute stretches. Switch halfway.", cue:"Figure four stretch. Cross ankle over opposite knee and pull the leg toward you until the glute stretches. Switch sides halfway."},
        {name:"Box Breathing", duration:60, instruction:"Breathe in for four seconds, hold for four, exhale for four, hold for four. Keep the shoulders relaxed.", cue:"Box breathing. Inhale four, hold four, exhale four, hold four. Relax your shoulders."}
      ]
    },
    lowBack:{
      category:"Pain Relief",
      title:"Low Back Reset",
      purpose:"For mild tightness or general stiffness. Stop if pain is sharp, spreading, or worsening.",
      steps:[
        {name:"Child’s Pose Breathing", duration:60, instruction:"Kneel, sit hips back toward heels, and reach the arms forward. Breathe slowly into the low back and ribs.", cue:"Child’s pose breathing. Sit hips back, reach forward, and breathe slowly into your low back and ribs."},
        {name:"Cat-Cow", duration:60, instruction:"On hands and knees, slowly round the back upward, then gently arch it downward. Move one vertebra at a time.", cue:"Cat cow. On hands and knees, slowly round the back, then gently arch. Move with control."},
        {name:"Knee-to-Chest", duration:60, instruction:"Lie on your back. Pull one knee toward your chest while the other leg stays bent or straight. Switch sides halfway.", cue:"Knee to chest. Pull one knee toward your chest gently. Switch sides halfway."},
        {name:"Supine Twist", duration:60, instruction:"Lie on your back with knees bent. Let both knees fall gently to one side while shoulders stay heavy. Switch halfway.", cue:"Supine twist. Let both knees fall to one side while your shoulders stay down. Switch sides halfway."}
      ]
    },
    flexibility:{
      category:"Full Body Flexibility",
      title:"Full Body Flexibility",
      purpose:"A longer head-to-toe session for flexibility and injury prevention.",
      steps:[
        {name:"Neck and Shoulder Reset", duration:45, instruction:"Stand or sit tall. Roll shoulders back slowly, then gently tilt the head side to side. Do not force the neck.", cue:"Neck and shoulder reset. Roll your shoulders back slowly, then gently tilt the head side to side. Do not force it."},
        {name:"Chest Opener", duration:45, instruction:"Clasp hands behind your back or hold a doorway. Open the chest, keep ribs down, and breathe.", cue:"Chest opener. Clasp hands behind you or hold a doorway. Open the chest, keep ribs down, and breathe."},
        {name:"World’s Greatest Stretch", duration:90, instruction:"Step into a deep lunge. Hands inside the front foot. Rotate your chest toward the front leg and reach to the sky. Keep the movement slow. Switch sides halfway.", cue:"World’s Greatest Stretch. Deep lunge, hands inside the front foot, rotate toward the front leg, reach to the sky. Switch sides halfway."},
        {name:"Half-Kneeling Hip Flexor Stretch", duration:60, instruction:"One knee down, one foot forward. Tuck the pelvis slightly, squeeze the glute on the down-knee side, and shift forward gently. Switch halfway.", cue:"Half kneeling hip flexor stretch. Tuck the pelvis, squeeze the glute on the down-knee side, and shift forward gently. Switch halfway."},
        {name:"Hamstring Reach", duration:60, instruction:"Heel forward, toes up. Hinge at the hips with a flat back until the back of the leg stretches. Switch halfway.", cue:"Hamstring reach. Heel forward, toes up, hinge at the hips with a flat back. Switch sides halfway."},
        {name:"Figure Four Stretch", duration:60, instruction:"Lie down or sit tall. Cross one ankle over the opposite knee and gently draw the legs closer until the glute stretches. Switch halfway.", cue:"Figure four stretch. Cross one ankle over the opposite knee and gently draw the legs in. Switch sides halfway."},
        {name:"Calf Wall Stretch", duration:60, instruction:"Hands on wall, one foot back, heel down. Lean forward until the calf stretches. Switch halfway.", cue:"Calf wall stretch. Back heel down, lean forward gently. Switch sides halfway."},
        {name:"Deep Breathing Finish", duration:60, instruction:"Lie on your back or sit tall. Breathe slowly through the nose. Let the shoulders, jaw, and hips relax.", cue:"Deep breathing finish. Breathe slowly through the nose. Relax the shoulders, jaw, and hips."}
      ]
    }
  };

  window.ruut154OpenRecovery = function(id){
    const r = RECOVERY_LIBRARY_V154[id];
    if(!r) return;
    state.activeRecoveryV154 = {id, index:0, startedAt:new Date().toISOString()};
    saveState();
    ruut154ShowRecoveryStep();
  };

  window.ruut154ShowRecoveryStep = function(){
    const active = state.activeRecoveryV154;
    if(!active) return;
    const r = RECOVERY_LIBRARY_V154[active.id];
    const step = r.steps[active.index];
    const num = active.index + 1;
    showModal(`<div class="v154-recovery-modal">
      <div class="v1531-modal-head">
        <div class="v15-kicker">${esc(r.category)}</div>
        <h2>${esc(r.title)}</h2>
        <p>${esc(r.purpose)}</p>
      </div>
      <section class="v154-recovery-step">
        <div class="v154-step-count">Movement ${num} of ${r.steps.length}</div>
        <h3>${esc(step.name)}</h3>
        <div class="v154-duration">${Math.round(step.duration/60) ? "" : ""}${step.duration} sec</div>
        <p>${esc(step.instruction)}</p>
      </section>
      <div class="v1531-actions">
        <button class="v1531-button-secondary" onclick="ruut154PrevRecoveryStep()">Previous</button>
        <button class="v1531-button-secondary" onclick="ruut154SpeakRecoveryStep()">Hear Cue</button>
        <button class="v1531-button-primary" onclick="ruut154NextRecoveryStep()">Next</button>
      </div>
      <div class="v1531-actions single">
        <button class="v1531-button-secondary" onclick="ruut154CompleteRecovery()">Finish Session</button>
      </div>
    </div>`);
    setTimeout(()=>ruut154SpeakRecoveryStep(), 250);
  };

  window.ruut154SpeakRecoveryStep = function(){
    const active = state.activeRecoveryV154;
    if(!active) return;
    const r = RECOVERY_LIBRARY_V154[active.id];
    const step = r.steps[active.index];
    const text = `${step.name}. ${step.duration} seconds. ${step.cue || step.instruction}`;
    try{
      if(typeof ruut14Speak === "function") return ruut14Speak(text);
      if(window.speechSynthesis){
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
      }
    }catch(e){}
  };

  window.ruut154NextRecoveryStep = function(){
    const active = state.activeRecoveryV154;
    if(!active) return;
    const r = RECOVERY_LIBRARY_V154[active.id];
    if(active.index < r.steps.length - 1){
      active.index++;
      saveState();
      ruut154ShowRecoveryStep();
    }else{
      ruut154CompleteRecovery();
    }
  };

  window.ruut154PrevRecoveryStep = function(){
    const active = state.activeRecoveryV154;
    if(!active) return;
    if(active.index > 0){
      active.index--;
      saveState();
      ruut154ShowRecoveryStep();
    }
  };

  window.ruut154CompleteRecovery = function(){
    const active = state.activeRecoveryV154;
    if(active){
      const r = RECOVERY_LIBRARY_V154[active.id];
      state.recoverySessions = state.recoverySessions || [];
      state.recoverySessions.push({
        iso:new Date().toISOString(),
        date:shortDate(),
        title:r.title,
        category:r.category,
        steps:r.steps.length
      });
      delete state.activeRecoveryV154;
      saveState();
    }
    showModal(`<div class="v1531-modal-head">
      <div class="v15-kicker">Recovery Complete</div>
      <h2>Session Saved</h2>
      <p>Your recovery work has been added to Stats and History.</p>
    </div>
    <div class="v1531-actions"><button class="v1531-button-primary" onclick="hideModal()">Done</button></div>`);
  };

  R14.renderRecover = function(){
    const host = document.getElementById("recover");
    if(!host) return;
    const items = [
      ["preRun","Before Training","Pre-Run Mobility","Prime hips, ankles, calves, and trunk.","⚡"],
      ["postRun","After Training","Post-Run Recovery","Bring the system down after training.","☾"],
      ["lowBack","Pain Relief","Low Back Reset","For mild tightness or stiffness.","✚"],
      ["flexibility","Full Body Flexibility","Flexibility + Injury Prevention","A longer head-to-toe guided session.","↗"]
    ];
    host.innerHTML = `
      <section class="v15-screen-head">
        <div class="v15-kicker">Recover</div>
        <h2>What do you need?</h2>
        <p class="v15-muted">Guided recovery with clear instructions and spoken movement cues.</p>
      </section>
      ${items.map(([id,k,t,d,icon])=>`<section class="v15-recover-tile v154-recover-tile" onclick="ruut154OpenRecovery('${id}')">
        <div><div class="v15-kicker">${esc(k)}</div><h3>${esc(t)}</h3><p>${esc(d)}</p></div>
        <div class="v15-recover-icon">${icon}</div>
      </section>`).join("")}`;
  };

  window.openWorkoutDebriefV97 = function(snapshot){
    const snap = snapshot || window.pendingDebriefSnapshotV97 || {
      week:state.week,
      dayIndex:state.dayIndex,
      day:currentWorkout().day,
      title:currentWorkout().title,
      type:currentWorkout().type,
      date:shortDate(),
      iso:new Date().toISOString()
    };

    showModal(`<div class="v1531-modal-head">
      <div class="v15-kicker">Workout Debrief</div>
      <h2>${esc(snap.title || "Workout Complete")}</h2>
      <p>${esc(snap.day || "")} · Week ${snap.week ?? state.week} · Day ${snap.dayIndex ?? state.dayIndex}</p>
    </div>

    <section class="v1531-group">
      <div class="v154-debrief-block">
        <div class="v15-kicker">Effort</div>
        <div class="v154-choice-row">
          ${["Easy","Moderate","Hard","Very Hard"].map(v=>`<button class="v154-choice" data-choice="debriefFeel" data-value="${v}" onclick="selectChoice('debriefFeel','${v}')">${v}</button>`).join("")}
        </div>
        <input id="debriefFeelValue" type="hidden" value="">
      </div>

      <div class="v154-debrief-block">
        <div class="v15-kicker">Body Check</div>
        <div class="v154-choice-row">
          ${["None","Heavy Legs","Sore","Pain","Modified"].map(v=>`<button class="v154-choice" data-choice="debriefIssue" data-value="${v}" onclick="selectChoice('debriefIssue','${v}')">${v}</button>`).join("")}
        </div>
        <input id="debriefIssueValue" type="hidden" value="">
      </div>

      <div class="v154-debrief-block">
        <div class="v15-kicker">Notes</div>
        <textarea id="debriefNote" placeholder="Optional: what felt good, pain location, changes, weather, route..."></textarea>
      </div>
    </section>

    <div class="v1531-actions">
      <button class="v1531-button-secondary" onclick="hideModal()">Skip</button>
      <button class="v1531-button-primary" onclick="saveWorkoutDebriefV97()">Save Debrief</button>
    </div>`);

    window.pendingDebriefSnapshotV97 = snap;
  };

  // Preserve original saveWorkoutDebriefV97 behavior if it exists. The modal field IDs are unchanged.
  window.renderDashboard = R14.renderDashboard;
  window.renderRecover = R14.renderRecover;
})();


// ---------- V15.5 STRENGTH TRACKING FOUNDATION ----------
(function(){
  const R14 = window.ruut14Final || {};
  window.ruut14Final = R14;

  function esc(v){ return String(v ?? "").replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s])); }
  function shortDateV155(){ try{return new Date().toLocaleDateString();}catch(e){return new Date().toISOString().slice(0,10);} }
  function nowIso(){ return new Date().toISOString(); }

  const DEFAULT_STRENGTH_TEMPLATES_V155 = [
    {id:"upperA", name:"Upper A", focus:"Chest Emphasis", schedule:"Monday", notes:"Heavy pressing, balanced pulling, shoulders, arms.", exercises:[
      ex("Barbell Bench Press",4,"6-8","Keep shoulder blades pulled back, lower under control, press without bouncing.","Use a spotter or safety arms when lifting heavy."),
      ex("Incline Dumbbell Press",3,"8-10","Press from a slight incline. Keep elbows controlled and avoid flaring hard.","Stop if shoulders feel sharp."),
      ex("Pull-Ups or Lat Pulldown",4,"8-12","Pull elbows down toward the ribs. Keep the chest tall and avoid swinging.","Use a controlled full range of motion."),
      ex("Seated Cable Row",3,"10","Pull to the lower ribs, pause briefly, and control the return.","Do not yank with the low back."),
      ex("Dumbbell Shoulder Press",3,"8-10","Brace your core, press overhead smoothly, and avoid leaning back.","Use a neutral grip if shoulders prefer it."),
      ex("Dumbbell Lateral Raises",3,"12-15","Raise to shoulder height with soft elbows. Lead with the elbows, not the hands.","Use light weight and strict control."),
      ex("Rope Tricep Pushdowns",3,"12","Keep elbows pinned. Extend fully and control the return.","Avoid shoulder movement."),
      ex("EZ-Bar Curls",3,"10-12","Keep elbows quiet, curl under control, and lower slowly.","Do not swing the weight.")
    ]},
    {id:"lowerCore", name:"Lower + Core", focus:"Legs and Trunk", schedule:"Wednesday", notes:"Lower-body strength, durability, and core control.", exercises:[
      ex("Barbell Squats",4,"6-8","Brace, sit between the hips, keep knees tracking with toes, and drive up strong.","Use safety arms and stop if back or knees feel sharp."),
      ex("Romanian Deadlifts",3,"8-10","Hinge at the hips, keep a neutral back, and feel hamstrings load.","The bar stays close. Do not round the low back."),
      ex("Walking Lunges",3,"10 each leg","Step with control, keep torso tall, and push through the front foot.","Shorten stride if knees complain."),
      ex("Leg Curl",3,"12","Curl smoothly, pause, and control the return.","Do not throw the weight."),
      ex("Standing Calf Raises",4,"15","Rise fully, pause at the top, and lower under control.","Use full range."),
      ex("Hanging Knee Raises",3,"15","Tilt pelvis slightly, lift knees under control, and avoid swinging.","Use captain chair if grip limits you."),
      ex("Cable Crunches",3,"15","Curl ribs toward hips. Keep hips quiet and control the return.","Do not pull with arms."),
      ex("Plank",3,"60 sec","Brace abs, squeeze glutes, keep ribs down and body straight.","Stop before form collapses."),
      ex("Side Plank",3,"30 sec each side","Stack shoulders and hips. Keep body long and controlled.","Drop to knees if needed.")
    ]},
    {id:"upperB", name:"Upper B", focus:"Shoulders and Arms", schedule:"Friday", notes:"Upper-body volume with shoulders and arms emphasis.", exercises:[
      ex("Incline Barbell Bench",4,"6-8","Press from a steady base, control the descent, and keep shoulders packed.","Use a spotter or safety arms."),
      ex("Weighted Dips or Chest Machine Press",3,"8-12","Lean slightly forward for chest. Keep shoulders down and reps controlled.","Use machine press if dips bother shoulders."),
      ex("Chest-Supported Row",4,"8-10","Keep chest on pad and pull elbows back without shrugging.","No momentum."),
      ex("Pull-Ups or Lat Pulldown",3,"10","Pull elbows down and keep the rib cage controlled.","No swinging."),
      ex("Dumbbell Lateral Raises",4,"15","Move smoothly to shoulder height. Control every rep.","Light and strict beats heavy and sloppy."),
      ex("Rear Delt Flyes",3,"15","Reach wide and slightly back. Keep traps relaxed.","Do not jerk the weight."),
      ex("Barbell Curls",4,"10","Keep elbows near the sides and lower slowly.","No hip drive."),
      ex("Hammer Curls",3,"12","Keep wrists neutral and curl with control.","Avoid swinging."),
      ex("Skull Crushers",4,"10","Keep upper arms steady and lower the weight under control.","Use EZ-bar or dumbbells if elbows prefer it.")
    ]},
    {id:"fullBody", name:"Full Body", focus:"General Strength", schedule:"Optional", notes:"Balanced session for weeks when you need one complete gym workout.", exercises:[
      ex("Goblet Squat",3,"10-12","Hold the weight close, sit between the hips, and stand tall.","Keep back neutral."),
      ex("Dumbbell Bench Press",3,"8-10","Shoulders packed, lower under control, and press smoothly.","Avoid shoulder pain."),
      ex("Lat Pulldown",3,"10-12","Pull elbows down, chest tall, and control the return.","No swinging."),
      ex("Romanian Deadlift",3,"8-10","Hinge with neutral spine and feel hamstrings load.","Do not round back."),
      ex("Dumbbell Shoulder Press",3,"8-10","Brace and press overhead without leaning back.","Use controlled range."),
      ex("Farmer Carry",3,"40 yards","Stand tall, ribs down, and walk with steady control.","Do not lean side to side.")
    ]}
  ];

  function ex(name, sets, reps, instruction, safety){ return {name, sets, reps, instruction, safety}; }
  function clone(obj){ return JSON.parse(JSON.stringify(obj)); }

  function ensureStrengthV155(){
    state.strengthTemplates = Array.isArray(state.strengthTemplates) && state.strengthTemplates.length ? state.strengthTemplates : clone(DEFAULT_STRENGTH_TEMPLATES_V155);
    state.liftSessions = Array.isArray(state.liftSessions) ? state.liftSessions : [];
  }

  function templateById(id){ ensureStrengthV155(); return state.strengthTemplates.find(t=>t.id===id) || state.strengthTemplates[0]; }
  function exerciseHistory(name){
    ensureStrengthV155();
    const n = String(name||"").toLowerCase();
    const rows=[];
    state.liftSessions.forEach(s=>{
      (s.exercises||[]).forEach(e=>{
        if(String(e.name||"").toLowerCase()===n && Array.isArray(e.sets) && e.sets.length){
          rows.push({session:s, exercise:e});
        }
      });
    });
    return rows.sort((a,b)=>String(b.session.iso||"").localeCompare(String(a.session.iso||"")));
  }
  function bestSetFor(name){
    const sets = [];
    exerciseHistory(name).forEach(h=>(h.exercise.sets||[]).forEach(set=>sets.push(set)));
    if(!sets.length) return null;
    return sets.sort((a,b)=>((b.weight||0)*(b.reps||0))-((a.weight||0)*(a.reps||0)))[0];
  }
  function lastSetsFor(name){
    const h = exerciseHistory(name)[0];
    return h ? h.exercise.sets : [];
  }
  function fmtSets(sets){
    if(!sets || !sets.length) return "No previous sets";
    return sets.map(s=>`${s.weight||0} x ${s.reps||0}`).join(", ");
  }
  function currentLift(){ ensureStrengthV155(); return state.activeLiftSessionV155 || null; }
  function currentLiftExercise(){
    const s=currentLift(); if(!s) return null;
    return s.exercises[s.index||0] || null;
  }

  function renderStrengthTemplates(){
    ensureStrengthV155();
    return `<section class="v155-strength-hero">
      <div class="v15-chip">Strength Tracking</div>
      <h2>Lift<br>Log</h2>
      <p class="v15-muted">Edit your workouts, log weight and reps, and keep your lifting history for next time.</p>
    </section>
    <section class="v15-panel">
      <div class="v15-split"><div><div class="v15-kicker">Native Templates</div><h3>Choose a workout</h3><p class="v15-muted">Built from your Upper A / Lower + Core / Upper B plan. Edit anything and RUUT remembers it.</p></div></div>
      <div class="v155-template-grid">
        ${state.strengthTemplates.map(t=>`<div class="v155-template-card" onclick="ruut155OpenTemplate('${esc(t.id)}')">
          <div class="v155-template-meta"><span>${esc(t.schedule||"Custom")}</span><span>${(t.exercises||[]).length} exercises</span></div>
          <h3>${esc(t.name)}</h3>
          <p>${esc(t.focus||t.notes||"")}</p>
        </div>`).join("")}
      </div>
      <div style="height:12px"></div>
      <button class="v1531-button-secondary" onclick="ruut155CreateTemplate()">Create Custom Workout</button>
    </section>
    ${renderStrengthHistoryPanel()}`;
  }

  function renderStrengthHistoryPanel(){
    ensureStrengthV155();
    const recent = state.liftSessions.slice(-5).reverse();
    if(!recent.length){
      return `<section class="v15-panel v155-muted-warning"><strong>No lifting history yet.</strong><br>Log your first strength workout and RUUT will show last sets, best sets, and trends here.</section>`;
    }
    return `<section class="v15-panel"><div class="v15-kicker">Recent Strength Sessions</div><div class="v155-history-list">
      ${recent.map(s=>`<div class="v155-history-row"><div><strong>${esc(s.templateName)}</strong><p>${esc(s.date)} · ${(s.exercises||[]).length} exercises · ${totalSets(s)} sets</p></div><span>Saved</span></div>`).join("")}
    </div></section>`;
  }
  function totalSets(s){ return (s.exercises||[]).reduce((sum,e)=>sum+(e.sets?.length||0),0); }

  R14.renderStrength = function(){
    ensureStrengthV155();
    const host=document.getElementById("strength");
    if(!host) return;
    const active=currentLift();
    if(active) host.innerHTML = renderActiveLiftSession(active);
    else host.innerHTML = renderStrengthTemplates();
  };

  function renderActiveLiftSession(s){
    const e = currentLiftExercise();
    if(!e) return `<section class="v15-panel"><h2>Strength Session</h2><p class="v15-muted">No exercise found.</p><button class="v1531-button-secondary" onclick="ruut155CancelLift()">Close</button></section>`;
    const index=(s.index||0)+1;
    const last=lastSetsFor(e.name);
    const best=bestSetFor(e.name);
    return `<section class="v155-active-session">
      <section class="v155-lift-card">
        <div class="v15-kicker">${esc(s.templateName)} · Exercise ${index} of ${s.exercises.length}</div>
        <h2>${esc(e.name)}</h2>
        <div class="v155-lift-target">Target: ${esc(e.sets)} sets x ${esc(e.reps)}</div>
        <p class="v15-muted" style="margin-top:12px">${esc(e.instruction || "Move with control and clean form.")}</p>
        ${e.safety ? `<p class="v15-muted small" style="margin-top:8px"><strong>Safety:</strong> ${esc(e.safety)}</p>` : ""}
        <div class="v155-set-form">
          <label>Weight<input id="v155Weight" type="number" step="0.5" placeholder="185" value="${last?.[0]?.weight || e.weight || e.defaultWeight || ""}"></label>
          <label>Reps<input id="v155Reps" type="number" step="1" placeholder="8"></label>
        </div>
        <div style="height:10px"></div>
        <button class="v1531-button-primary" onclick="ruut155AddSet()">Save Set</button>
        <div class="v155-set-list">${(e.setsDone||[]).map((set,i)=>`<div class="v155-set-row"><span>Set ${i+1}</span><strong>${esc(set.weight)} x ${esc(set.reps)}</strong></div>`).join("")}</div>
      </section>
      <section class="v15-panel">
        <div class="v15-kicker">History</div>
        <p class="v15-muted"><strong>Last time:</strong> ${esc(fmtSets(last))}</p>
        <p class="v15-muted"><strong>Best set:</strong> ${best ? esc(`${best.weight} x ${best.reps}`) : "No best set yet"}</p>
      </section>
      <div class="v155-action-grid">
        <button class="v1531-button-secondary" onclick="ruut155PrevExercise()">Previous</button>
        <button class="v1531-button-primary" onclick="ruut155NextExercise()">Next Exercise</button>
      </div>
      <div class="v155-action-grid single"><button class="v1531-button-secondary" onclick="ruut155FinishLift()">Finish and Save Workout</button></div>
    </section>`;
  }

  window.ruut155OpenTemplate = function(id){
    const t=templateById(id);
    showModal(`<div class="v1531-modal-head"><div class="v15-kicker">Strength Template</div><h2>${esc(t.name)}</h2><p>${esc(t.focus||t.notes||"")}</p></div>
      <section class="v1531-group">
        ${(t.exercises||[]).map(e=>`<div class="v1531-brief-item"><strong>${esc(e.name)}</strong><p>${esc(e.sets)} sets x ${esc(e.reps)} · ${esc(e.instruction||"")}</p></div>`).join("")}
      </section>
      <div class="v1531-actions"><button class="v1531-button-secondary" onclick="ruut155EditTemplate('${esc(t.id)}')">Edit</button><button class="v1531-button-primary" onclick="ruut155StartLift('${esc(t.id)}')">Start Logging</button></div>`);
  };

  window.ruut155CreateTemplate = function(){
    ensureStrengthV155();
    const id="custom"+Date.now();
    state.strengthTemplates.push({id,name:"Custom Strength",focus:"User Built",schedule:"Custom",notes:"Build your own workout.",exercises:[ex("New Exercise",3,"8-10","Enter instructions for this movement.","")]});
    saveState();
    ruut155EditTemplate(id);
  };

  window.ruut155EditTemplate = function(id){
    const t=templateById(id);
    showModal(`<div class="v1531-modal-head"><div class="v15-kicker">Edit Strength Workout</div><h2>${esc(t.name)}</h2><p>Change exercises, targets, and instructions. RUUT saves this for next time.</p></div>
      <section class="v1531-group">
        <label class="v1531-field">Workout Name<input class="v155-template-name" id="v155TemplateName" value="${esc(t.name)}"></label>
        <label class="v1531-field">Focus<input class="v155-template-name" id="v155TemplateFocus" value="${esc(t.focus||"")}"></label>
        <label class="v1531-field">Scheduled Day<input class="v155-template-name" id="v155TemplateSchedule" value="${esc(t.schedule||"")}"></label>
      </section>
      <div id="v155ExerciseEditor">
        ${(t.exercises||[]).map((e,i)=>editExerciseHTML(e,i)).join("")}
      </div>
      <div class="v1531-actions"><button class="v1531-button-secondary" onclick="ruut155AddExerciseRow()">Add Exercise</button><button class="v1531-button-primary" onclick="ruut155SaveTemplate('${esc(t.id)}')">Save Template</button></div>`);
  };

  function editExerciseHTML(e,i){
    return `<div class="v155-exercise-edit" data-v155-exercise>
      <label class="v1531-field">Exercise<input data-field="name" value="${esc(e.name)}"></label>
      <div class="v155-edit-grid"><label class="v1531-field">Sets<input data-field="sets" type="number" value="${esc(e.sets||3)}"></label><label class="v1531-field">Reps<input data-field="reps" value="${esc(e.reps||"8-10")}"></label></div>
      <label class="v1531-field">Instructions<textarea data-field="instruction">${esc(e.instruction||"")}</textarea></label>
      <label class="v1531-field">Safety Note<textarea data-field="safety">${esc(e.safety||"")}</textarea></label>
      <button class="v1531-button-secondary" onclick="this.closest('[data-v155-exercise]').remove()">Remove</button>
    </div>`;
  }

  window.ruut155AddExerciseRow = function(){
    const host=document.getElementById("v155ExerciseEditor");
    if(host) host.insertAdjacentHTML("beforeend", editExerciseHTML(ex("New Exercise",3,"8-10","Describe how to perform this exercise.",""), 0));
  };

  window.ruut155SaveTemplate = function(id){
    ensureStrengthV155();
    const t=templateById(id);
    t.name=document.getElementById("v155TemplateName")?.value || t.name;
    t.focus=document.getElementById("v155TemplateFocus")?.value || "";
    t.schedule=document.getElementById("v155TemplateSchedule")?.value || "Custom";
    t.exercises=Array.from(document.querySelectorAll("[data-v155-exercise]")).map(row=>({
      name:row.querySelector('[data-field="name"]')?.value || "Exercise",
      sets:Number(row.querySelector('[data-field="sets"]')?.value || 3),
      reps:row.querySelector('[data-field="reps"]')?.value || "8-10",
      instruction:row.querySelector('[data-field="instruction"]')?.value || "Move with control and clean form.",
      safety:row.querySelector('[data-field="safety"]')?.value || ""
    })).filter(e=>e.name.trim());
    saveState();
    hideModal();
    showScreen('strength');
  };

  window.ruut155StartLift = function(id){
    const t=templateById(id);
    state.activeLiftSessionV155={
      templateId:t.id, templateName:t.name, startedAt:nowIso(), date:shortDateV155(), index:0,
      exercises:(t.exercises||[]).map(e=>({...clone(e), setsDone:[]}))
    };
    saveState();
    hideModal();
    showScreen('strength');
  };

  window.ruut155AddSet = function(){
    const e=currentLiftExercise(); if(!e) return;
    const weight=Number(document.getElementById("v155Weight")?.value || 0);
    const reps=Number(document.getElementById("v155Reps")?.value || 0);
    if(!weight && !reps){ alert("Enter weight and reps first."); return; }
    e.setsDone=e.setsDone||[];
    e.setsDone.push({weight,reps,iso:nowIso()});
    saveState();
    R14.renderStrength();
    setTimeout(()=>{ const w=document.getElementById("v155Weight"); if(w) w.focus(); },50);
  };

  window.ruut155NextExercise = function(){
    const s=currentLift(); if(!s) return;
    if((s.index||0) < s.exercises.length-1){ s.index=(s.index||0)+1; saveState(); R14.renderStrength(); }
    else ruut155FinishLift();
  };
  window.ruut155PrevExercise = function(){ const s=currentLift(); if(!s) return; s.index=Math.max(0,(s.index||0)-1); saveState(); R14.renderStrength(); };
  window.ruut155CancelLift = function(){ delete state.activeLiftSessionV155; saveState(); showScreen('strength'); };

  window.ruut155FinishLift = function(){
    const s=currentLift(); if(!s) return;
    const saved={
      iso:nowIso(), date:shortDateV155(), templateId:s.templateId, templateName:s.templateName,
      exercises:s.exercises.map(e=>({name:e.name, targetSets:e.sets, targetReps:e.reps, sets:e.setsDone||[]}))
    };
    state.liftSessions=state.liftSessions||[];
    state.liftSessions.push(saved);
    delete state.activeLiftSessionV155;
    saveState();
    showModal(`<div class="v1531-modal-head"><div class="v15-kicker">Strength Saved</div><h2>${esc(saved.templateName)}</h2><p>${totalSets(saved)} sets logged. RUUT will show this history next time.</p></div><div class="v1531-actions single"><button class="v1531-button-primary" onclick="hideModal();showScreen('strength')">Done</button></div>`);
  };

  const oldInstall = window.ruutV15InstallShell;
  window.ruutV15InstallShell = function(){
    if(typeof oldInstall === "function") oldInstall();
    let strength=document.getElementById("strength");
    const nav=document.querySelector("nav");
    if(!strength && nav){
      strength=document.createElement("main"); strength.id="strength"; strength.className="screen"; nav.parentNode.insertBefore(strength, nav);
    }
    if(nav && !nav.querySelector('[data-target="strength"]')){
      nav.insertAdjacentHTML("beforeend", `<button data-target="strength" onclick="showScreen('strength',this)"><b>▰</b><span>Strength</span></button>`);
    }
  };

  const prevRenderAll = window.renderAll;
  R14.renderAll = function(){
    if(typeof prevRenderAll === "function") prevRenderAll();
    R14.renderStrength();
  };

  const prevShowScreen = window.showScreen;
  R14.showScreen = function(id, btn){
    if(id === "strength"){
      document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
      const screen=document.getElementById("strength"); if(screen) screen.classList.add("active");
      document.querySelectorAll("nav button").forEach(b=>b.classList.remove("active"));
      const targetBtn = btn || document.querySelector('nav button[data-target="strength"]');
      if(targetBtn) targetBtn.classList.add("active");
      R14.renderStrength();
      return;
    }
    if(typeof prevShowScreen === "function") return prevShowScreen(id, btn);
  };

  const prevDashboard = window.renderDashboard;
  R14.renderDashboard = function(){
    if(typeof prevDashboard === "function") prevDashboard();
    ensureStrengthV155();
    const host=document.getElementById("dashboard"); if(!host) return;
    document.getElementById("v155StrengthStats")?.remove();
    const sessions=state.liftSessions||[];
    const last=sessions[sessions.length-1];
    host.insertAdjacentHTML("beforeend", `<section id="v155StrengthStats" class="v15-panel">
      <div class="v15-kicker">Strength Progress</div>
      ${sessions.length ? `<div class="v15-metric-grid"><div><span>Sessions</span><strong>${sessions.length}</strong></div><div><span>Total Sets</span><strong>${sessions.reduce((n,s)=>n+totalSets(s),0)}</strong></div></div><div class="v155-history-list"><div class="v155-history-row"><div><strong>Last Lift</strong><p>${esc(last.templateName)} · ${esc(last.date)} · ${totalSets(last)} sets</p></div><span>Logged</span></div></div>` : `<div class="v154-empty-mini">No strength sessions logged yet. Use the Strength tab to start tracking weight, reps, and sets.</div>`}
    </section>`);
  };

  renderStrength = R14.renderStrength;
  renderAll = R14.renderAll;
  showScreen = R14.showScreen;
  renderDashboard = R14.renderDashboard;
  window.renderStrength = renderStrength;
  window.renderAll = renderAll;
  window.showScreen = showScreen;
  window.renderDashboard = renderDashboard;
  window.ruutV15InstallShell();
  ensureStrengthV155();
  R14.renderStrength();
})();


// ---------- COACH V16 GOAL-BASED TRAINING + WEIGHT TRACKING ----------
(function(){
  const R14 = window.ruut14Final || window.R14 || {};
  const APP_NAME_V16 = "COACH";

  const goalsV16 = {
    hybrid:{name:"Hybrid Athlete",phase:"Build",focus:"Strength, endurance, recovery, and body composition.",milestone:"Complete a balanced week of running, strength, and recovery."},
    muscle:{name:"Build Muscle",phase:"Foundation",focus:"Progressive overload, recovery, and consistency.",milestone:"Complete three strength sessions this week."},
    fatloss:{name:"Lose Fat",phase:"Foundation",focus:"Consistency, weight trend, strength retention, and sustainable conditioning.",milestone:"Log weight 5 days and complete planned training."},
    endurance:{name:"13-Mile Endurance",phase:"Build",focus:"Aerobic capacity, long-run durability, and controlled pacing.",milestone:"Complete the next long run without overreaching."},
    general:{name:"General Fitness",phase:"Foundation",focus:"Balanced health, movement quality, and steady routine.",milestone:"Complete three training days this week."},
    maintain:{name:"Maintain Fitness",phase:"Maintain",focus:"Stay capable, healthy, and consistent without excess stress.",milestone:"Complete two quality sessions and one recovery session."}
  };

  function c16Esc(v){
    return String(v ?? "").replace(/[&<>"']/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
  }
  function c16TodayISO(){
    const d=new Date();
    const off=d.getTimezoneOffset();
    const local=new Date(d.getTime()-off*60000);
    return local.toISOString().slice(0,10);
  }
  function c16ShortDate(){
    try{return new Date().toLocaleDateString(undefined,{month:"numeric",day:"numeric",year:"2-digit"});}catch(e){return c16TodayISO();}
  }
  function c16Ensure(){
    state.coachV16 = state.coachV16 || {};
    state.coachV16.goal = state.coachV16.goal || "hybrid";
    state.coachV16.started = state.coachV16.started || c16TodayISO();
    state.weightLogV16 = state.weightLogV16 || [];
  }
  function c16Goal(){
    c16Ensure();
    return goalsV16[state.coachV16.goal] || goalsV16.hybrid;
  }
  function c16WeightEntries(){
    c16Ensure();
    return (state.weightLogV16 || []).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  }
  function c16LatestWeight(){
    const entries=c16WeightEntries();
    return entries.length ? entries[entries.length-1] : null;
  }
  function c16WeightChange(){
    const entries=c16WeightEntries();
    if(entries.length < 2) return null;
    const first=Number(entries[0].weight);
    const last=Number(entries[entries.length-1].weight);
    if(!first || !last) return null;
    const diff=last-first;
    return {diff, label:`${diff>0?"+":""}${diff.toFixed(1)} lb`};
  }
  function c16Spark(){
    const entries=c16WeightEntries().slice(-14).filter(e=>Number(e.weight));
    if(entries.length < 2) return `<div class="v15-muted">Log two or more weights to show a trend.</div>`;
    const vals=entries.map(e=>Number(e.weight));
    const min=Math.min(...vals), max=Math.max(...vals);
    return `<div class="coach-v16-mini-chart">${vals.map(v=>{
      const pct=max===min ? 45 : 18 + ((v-min)/(max-min))*68;
      return `<span title="${v.toFixed(1)} lb" style="height:${pct}%"></span>`;
    }).join("")}</div>`;
  }
  function c16CompletionPercent(){
    try{
      if(typeof progressPercent === "function") return progressPercent();
      return Math.round(((state.completed||[]).length/84)*100);
    }catch(e){return 0;}
  }
  function c16PhaseForWeek(){
    const w=Number(state.week||1);
    if(w<=4) return "Foundation";
    if(w<=8) return "Build";
    if(w<=12) return "Peak";
    return "Maintain";
  }
  function c16WorkoutTypeLabel(x){
    if(!x) return "Training";
    if(x.type==="bodyweight") return "Bodyweight Exercise";
    if(x.type==="run") return "Run Workout";
    if(x.type==="rest") return "Recovery Day";
    return String(x.type||"Training");
  }
  function c16ModalHero(kicker,title,sub){
    return `<div class="v1531-modal-head">
      <div class="v15-kicker">${c16Esc(kicker)}</div>
      <h2>${c16Esc(title)}</h2>
      <p>${c16Esc(sub||"")}</p>
    </div>`;
  }

  const oldInstallV16 = window.ruutV15InstallShell;
  window.ruutV15InstallShell = function(){
    if(typeof oldInstallV16 === "function") oldInstallV16();
    document.body.classList.add("coach-v16");
    const word=document.querySelector(".v15-wordmark"); if(word) word.textContent=APP_NAME_V16;
    const sub=document.querySelector(".v15-subbrand"); if(sub) sub.textContent="Train With Purpose.";
    const logo=document.querySelector(".logo"); if(logo) logo.textContent="C";
    const h1=document.querySelector("header h1"); if(h1) h1.textContent=APP_NAME_V16;
    const small=document.querySelector("header .brand .muted"); if(small) small.textContent="Train With Purpose.";
    document.querySelectorAll("nav button").forEach(btn=>{
      const span=btn.querySelector("span");
      const label=(span?span.textContent:btn.textContent).trim().toLowerCase();
      if(label==="plan"){
        if(span) span.textContent="Goals";
        else btn.textContent="Goals";
      }
    });
    document.title=APP_NAME_V16;
  };

  window.coachV16SetGoal = function(goal){
    c16Ensure();
    if(!goalsV16[goal]) goal="hybrid";
    state.coachV16.goal = goal;
    saveState();
    hideModal();
    showScreen("plan");
  };

  window.coachV16OpenGoalPicker = function(){
    c16Ensure();
    showModal(`${c16ModalHero("Goal System","Choose Your Goal","COACH organizes today's mission, progress, and recommendations around this goal.")}
      <div class="coach-v16-goal-grid">
        ${Object.entries(goalsV16).map(([id,g])=>`<button class="coach-v16-goal-card ${state.coachV16.goal===id?"active":""}" onclick="coachV16SetGoal('${id}')">
          <div class="coach-v16-badge">${state.coachV16.goal===id?"Active":"Goal"}</div>
          <h3>${c16Esc(g.name)}</h3>
          <p class="v15-muted">${c16Esc(g.focus)}</p>
        </button>`).join("")}
      </div>
      <div class="v1531-actions single"><button class="v1531-button-secondary" onclick="hideModal()">Cancel</button></div>`);
  };

  window.coachV16SaveWeight = function(){
    c16Ensure();
    const val=Number(document.getElementById("coachV16WeightInput")?.value || 0);
    const date=document.getElementById("coachV16WeightDate")?.value || c16TodayISO();
    if(!val){ alert("Enter a weight first."); return; }
    state.weightLogV16 = (state.weightLogV16||[]).filter(e=>e.date!==date);
    state.weightLogV16.push({date,weight:val,iso:new Date().toISOString()});
    state.weightLogV16.sort((a,b)=>String(a.date).localeCompare(String(b.date)));
    saveState();
    hideModal();
    try{ renderAll(); }catch(e){}
  };

  window.coachV16OpenWeight = function(){
    c16Ensure();
    const latest=c16LatestWeight();
    const todayExisting=(state.weightLogV16||[]).find(e=>e.date===c16TodayISO());
    const val=todayExisting?.weight || latest?.weight || "";
    showModal(`${c16ModalHero("Weight Tracking","Today's Weight","One number. No calorie counting. COACH uses the trend for long-term progress.")}
      <label class="small muted">Date</label>
      <input id="coachV16WeightDate" type="date" value="${c16TodayISO()}">
      <div style="height:10px"></div>
      <label class="small muted">Weight</label>
      <input id="coachV16WeightInput" type="number" step="0.1" inputmode="decimal" placeholder="191.8" value="${c16Esc(val)}">
      <div class="coach-v16-actions">
        <button class="v1531-button-primary" onclick="coachV16SaveWeight()">Save Weight</button>
        <button class="v1531-button-secondary" onclick="hideModal()">Cancel</button>
      </div>`);
  };

  window.coachV16WeightDetail = function(){
    c16Ensure();
    const entries=c16WeightEntries().slice(-30).reverse();
    showModal(`${c16ModalHero("Weight Trend","Body Weight Log", entries.length ? "Recent entries saved locally on this device." : "No weight entries yet.")}
      ${entries.length ? `<div class="v155-history-list">${entries.map(e=>`<div class="v155-history-row"><div><strong>${c16Esc(e.weight)} lb</strong><p>${c16Esc(e.date)}</p></div><span>Saved</span></div>`).join("")}</div>` : `<div class="v154-empty-mini">Add your first daily weight from Today or Stats.</div>`}
      <div class="coach-v16-actions"><button class="v1531-button-primary" onclick="hideModal();coachV16OpenWeight()">Add Weight</button><button class="v1531-button-secondary" onclick="hideModal()">Close</button></div>`);
  };

  const prevTodayV16 = window.renderToday;
  R14.renderToday = function(){
    c16Ensure();
    const today=document.getElementById("today"); if(!today) return;
    try{ if(typeof runDailyMaintenanceV101 === "function") runDailyMaintenanceV101(); }catch(e){}
    const x=currentWorkout();
    const goal=c16Goal();
    const wt=c16LatestWeight();
    const change=c16WeightChange();
    const pct=c16CompletionPercent();
    today.innerHTML = `
      <section class="v15-today-hero coach-v16-hero">
        <div class="v15-hero-bg"></div>
        <div class="v15-hero-shade"></div>
        <div class="v15-hero-content">
          <div>
            <div class="coach-v16-badge">COACH · ${c16Esc(goal.name)}</div>
            <div class="v15-meta-line">${c16ShortDate()} · Week ${state.week} · Day ${state.dayIndex} · ${c16Esc(goal.phase || c16PhaseForWeek())}</div>
            <h2 class="v15-hero-title">${c16Esc(c16WorkoutTypeLabel(x))}</h2>
            <div class="v15-hero-subtitle">${c16Esc(x?.title || "Today's Mission")}</div>
          </div>
          <div class="v15-hero-bottom">
            <button class="v15-primary-action" onclick="window.startWorkout()">Start Guided Workout</button>
            <button class="v15-round-action" onclick="window.openBriefingV110 ? window.openBriefingV110() : null">→</button>
          </div>
        </div>
      </section>

      <section class="coach-v16-goal-hero">
        <div class="coach-v16-badge">Current Goal</div>
        <h2>${c16Esc(goal.name)}</h2>
        <p class="v15-muted">${c16Esc(goal.focus)}</p>
        <div class="v15-metric-grid" style="margin-top:14px">
          <div><span>Phase</span><strong>${c16Esc(goal.phase || c16PhaseForWeek())}</strong></div>
          <div><span>Progress</span><strong>${pct}%</strong></div>
        </div>
        <div class="v1531-actions single" style="margin-top:14px"><button class="v1531-button-secondary" onclick="coachV16OpenGoalPicker()">Change Goal</button></div>
      </section>

      <section class="coach-v16-weight-card">
        <div>
          <div class="v15-kicker">Body Weight</div>
          <div class="coach-v16-weight-number">${wt ? `${Number(wt.weight).toFixed(1)} lb` : "Not logged"}</div>
          <p class="v15-muted">${wt ? `Last entry: ${c16Esc(wt.date)}${change ? ` · ${change.label} since start` : ""}` : "Add today's weight to start a trend."}</p>
        </div>
        <button class="v15-round-action" onclick="coachV16OpenWeight()">+</button>
      </section>

      <section class="v15-panel v15-coach-card">
        <div class="v15-kicker">Next Milestone</div>
        <h3>${c16Esc(goal.milestone)}</h3>
        <p class="v15-muted">${c16Esc(x?.success || "Show up, move well, and finish the work.")}</p>
      </section>
    `;
  };

  R14.renderPlan = function(){
    c16Ensure();
    const host=document.getElementById("plan"); if(!host) return;
    const goal=c16Goal();
    const pct=c16CompletionPercent();
    const phase=c16PhaseForWeek();
    const phases=[
      {name:"Foundation",range:"Weeks 1-4",start:1,end:4},
      {name:"Build",range:"Weeks 5-8",start:5,end:8},
      {name:"Peak",range:"Weeks 9-12",start:9,end:12},
      {name:"Maintain",range:"Ongoing",start:13,end:99}
    ];
    host.innerHTML = `
      <section class="v15-screen-head">
        <div class="v15-kicker">Goals</div>
        <h2>COACH Plan</h2>
        <p class="v15-muted">Goal → Phase → Today's Mission.</p>
      </section>

      <section class="coach-v16-goal-hero">
        <div class="coach-v16-badge">Active Goal</div>
        <h2>${c16Esc(goal.name)}</h2>
        <p class="v15-muted">${c16Esc(goal.focus)}</p>
        <div class="v15-metric-grid" style="margin-top:14px">
          <div><span>Current Phase</span><strong>${c16Esc(goal.phase || phase)}</strong></div>
          <div><span>Completion</span><strong>${pct}%</strong></div>
        </div>
        <div class="coach-v16-actions">
          <button class="v1531-button-primary" onclick="coachV16OpenGoalPicker()">Change Goal</button>
          <button class="v1531-button-secondary" onclick="openSetPosition ? openSetPosition() : null">Set Week/Day</button>
        </div>
      </section>

      ${phases.map((p,i)=>{
        const active=state.week>=p.start && state.week<=p.end;
        const width=active ? Math.min(100, Math.max(10, ((state.week-p.start+1)/(p.end-p.start+1))*100)) : state.week>p.end ? 100 : 0;
        return `<section class="v15-phase ${active ? "active" : ""}" onclick="ruutV15OpenPhase(${Math.min(i,2)})">
          <div class="v15-phase-bg"></div>
          <div class="v15-phase-content">
            <div class="v15-chip">${active ? "Current Phase" : "Training Block"}</div>
            <h3>${c16Esc(p.name)}</h3>
            <p>${c16Esc(p.range)}</p>
            <div class="v15-phase-progress"><div style="width:${width}%"></div></div>
          </div>
        </section>`;
      }).join("")}
    `;
  };

  const prevDashV16 = window.renderDashboard;
  R14.renderDashboard = function(){
    if(typeof prevDashV16 === "function") prevDashV16();
    c16Ensure();
    const host=document.getElementById("dashboard"); if(!host) return;
    document.getElementById("coachV16Stats")?.remove();
    const goal=c16Goal(), wt=c16LatestWeight(), change=c16WeightChange();
    host.insertAdjacentHTML("afterbegin", `<section id="coachV16Stats" class="v15-panel">
      <div class="v15-kicker">COACH Overview</div>
      <h3>${c16Esc(goal.name)}</h3>
      <p class="v15-muted">${c16Esc(goal.focus)}</p>
      <div class="v15-metric-grid">
        <div><span>Phase</span><strong>${c16Esc(goal.phase || c16PhaseForWeek())}</strong></div>
        <div><span>Weight</span><strong>${wt ? Number(wt.weight).toFixed(1) : "—"}</strong></div>
      </div>
      <div style="margin-top:12px">${c16Spark()}</div>
      <p class="v15-muted small" style="margin-top:8px">${wt ? `Last weight: ${c16Esc(wt.date)}${change ? ` · ${change.label} since start` : ""}` : "No weight entries yet."}</p>
      <div class="coach-v16-actions">
        <button class="v1531-button-primary" onclick="coachV16OpenWeight()">Add Weight</button>
        <button class="v1531-button-secondary" onclick="coachV16WeightDetail()">View Log</button>
      </div>
    </section>`);
  };

  const prevOpenSettingsV16 = window.openSettings;
  window.openSettings = function(){
    c16Ensure();
    populateVoices?.();
    const opts=(voices||[]).map(v=>`<option value="${c16Esc(v.voiceURI)}" ${settings.voiceURI===v.voiceURI?"selected":""}>${c16Esc(v.name)} ${c16Esc(v.lang)}</option>`).join("");
    showModal(`${c16ModalHero("COACH Control Center","Settings","Goal, voice, route mode, and training behavior.")}
      <div class="setting-group glass">
        <div class="setting-row"><span>Active Goal</span><button class="select-pill" onclick="hideModal();coachV16OpenGoalPicker()">${c16Esc(c16Goal().name)} ▾</button></div>
        <div class="setting-row"><span>Today's Weight</span><button class="select-pill" onclick="hideModal();coachV16OpenWeight()">Add ▾</button></div>
      </div>
      <div class="setting-group glass">
        <div class="setting-row"><span>Coach Style</span><select class="coach-v16-modal-select" id="coachStyle"><option value="trail" ${settings.coachStyle==="trail"?"selected":""}>Trail Guide</option><option value="calm" ${settings.coachStyle==="calm"?"selected":""}>Calm Coach</option><option value="tough" ${settings.coachStyle==="tough"?"selected":""}>Tough Love</option></select></div>
        <div class="setting-row"><span>Voice</span><select class="coach-v16-modal-select" id="voiceSelect"><option value="">System Default</option>${opts}</select></div>
        <div class="setting-row"><span>Voice Speed</span><select class="coach-v16-modal-select" id="voiceRate"><option value=".85" ${settings.voiceRate==.85?"selected":""}>Slow</option><option value=".95" ${settings.voiceRate==.95?"selected":""}>Normal</option><option value="1.05" ${settings.voiceRate==1.05?"selected":""}>Brisk</option></select></div>
        <div class="setting-row"><span>Route Mode</span><select class="coach-v16-modal-select" id="routeMode"><option value="outback" ${settings.routeMode==="outback"?"selected":""}>Out and Back: Halfway Cue</option><option value="loop" ${settings.routeMode==="loop"?"selected":""}>Loop: No Turnaround Cue</option><option value="treadmill" ${settings.routeMode==="treadmill"?"selected":""}>Treadmill</option><option value="trail" ${settings.routeMode==="trail"?"selected":""}>Trail</option></select></div>
      </div>
      <div class="setting-group glass">
        <div class="setting-row"><span>Warmup Coaching</span><input id="warmup" type="checkbox" ${settings.warmup?"checked":""}></div>
        <div class="setting-row"><span>Cooldown Coaching</span><input id="cooldown" type="checkbox" ${settings.cooldown?"checked":""}></div>
        <div class="setting-row"><span>Keep Screen Awake</span><input id="keepAwake" type="checkbox" ${settings.keepAwake?"checked":""}></div>
        <input id="adaptive" type="checkbox" ${settings.adaptive?"checked":""} style="display:none">
      </div>
      <div class="coach-v16-actions">
        <button class="v1531-button-primary" onclick="saveSettingsFromModal()">Save</button>
        <button class="v1531-button-secondary" onclick="openSetPosition()">Set Week/Day</button>
      </div>
      <div class="coach-v16-actions">
        <button class="v1531-button-secondary" onclick="testVoice()">Test Voice</button>
        <button class="v1531-button-secondary" onclick="confirmReset()">Reset Program</button>
      </div>`);
  };

  const oldTestVoiceV16 = window.testVoice || testVoice;
  window.testVoice = function(){
    try{ saveSettingsFromModal(); }catch(e){}
    try{ speak("This is COACH. Train with purpose. Stay steady and do the work."); }catch(e){}
  };

  R14.renderAll = function(){
    c16Ensure();
    R14.renderToday();
    renderWorkout();
    R14.renderDashboard();
    R14.renderPlan();
    renderRecover();
    if(typeof R14.renderStrength === "function") R14.renderStrength();
  };

  const prevShowV16 = window.showScreen;
  R14.showScreen = function(id,btn){
    if(id==="plan"){
      document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
      const screen=document.getElementById("plan"); if(screen) screen.classList.add("active");
      document.querySelectorAll("nav button").forEach(b=>b.classList.remove("active"));
      const b=btn || document.querySelector('nav button[data-target="plan"]') || Array.from(document.querySelectorAll("nav button")).find(x=>/goals|plan/i.test(x.textContent));
      if(b) b.classList.add("active");
      R14.renderPlan();
      return;
    }
    if(typeof prevShowV16 === "function") return prevShowV16(id,btn);
  };

  renderToday=R14.renderToday;
  renderPlan=R14.renderPlan;
  renderDashboard=R14.renderDashboard;
  renderAll=R14.renderAll;
  showScreen=R14.showScreen;
  window.renderToday=renderToday;
  window.renderPlan=renderPlan;
  window.renderDashboard=renderDashboard;
  window.renderAll=renderAll;
  window.showScreen=showScreen;

  c16Ensure();
  window.ruutV15InstallShell();
  try{ renderAll(); }catch(e){ console.warn("COACH v16 render failed", e); }
})();


// ---------- COACH V16.0.1 VISUAL + GOAL LOGIC CORRECTION ----------
(function(){
  const APP_NAME = "COACH";
  const GOALS = {
    hybrid:{name:"Hybrid Athlete",phase:"Build",priority:"Balanced",load:"Standard",note:"Blend strength, endurance, and recovery. Build capacity without specializing too narrowly.",milestone:"Complete a balanced week: run, lift, recover."},
    muscle:{name:"Build Muscle",phase:"Build",priority:"Strength",load:"Strength biased",note:"Prioritize progressive overload. Running stays supportive so it does not sabotage lifting recovery.",milestone:"Complete three strength-focused sessions this week."},
    fatloss:{name:"Lose Fat",phase:"Foundation",priority:"Consistency",load:"Sustainable",note:"Use repeatable training, steady conditioning, and daily weight trend. Preserve strength while body weight comes down.",milestone:"Log weight and complete today’s planned movement."},
    endurance:{name:"13-Mile Endurance",phase:"Build",priority:"Running",load:"Endurance biased",note:"Running is the primary driver. Strength supports durability, posture, hips, and injury resistance.",milestone:"Protect the long run and stack easy miles."},
    general:{name:"General Fitness",phase:"Foundation",priority:"Balanced Health",load:"Moderate",note:"Stay capable, mobile, and consistent without chasing extremes.",milestone:"Complete three training days this week."},
    maintain:{name:"Maintain Fitness",phase:"Maintain",priority:"Preservation",load:"Reduced",note:"Keep the rhythm, avoid unnecessary stress, and maintain capacity.",milestone:"Complete two quality sessions and one recovery session."}
  };
  function esc16(v){return String(v ?? "").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));}
  function clone16(v){try{return structuredClone(v);}catch(e){return JSON.parse(JSON.stringify(v));}}
  function todayISO16(){const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10);}
  function shortDate16(){try{return new Date().toLocaleDateString(undefined,{month:"numeric",day:"numeric",year:"2-digit"});}catch(e){return todayISO16();}}
  function ensure16(){state.coachV16=state.coachV16||{};state.coachV16.goal=state.coachV16.goal||"hybrid";state.weightLogV16=state.weightLogV16||[];}
  function goalId16(){ensure16();return GOALS[state.coachV16.goal]?state.coachV16.goal:"hybrid";}
  function goal16(){return GOALS[goalId16()]||GOALS.hybrid;}
  function weights16(){ensure16();return (state.weightLogV16||[]).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date)));}
  function latestWeight16(){const w=weights16();return w[w.length-1]||null;}
  function weightChange16(){const w=weights16();if(w.length<2)return null;const a=Number(w[0].weight),b=Number(w[w.length-1].weight);if(!a||!b)return null;const d=b-a;return `${d>0?"+":""}${d.toFixed(1)} lb`;}
  function pct16(){try{return typeof progressPercent==="function"?progressPercent():Math.round(((state.completed||[]).length/84)*100);}catch(e){return 0;}}
  function label16(x){if(!x)return"Training";if(x.type==="bodyweight")return"Bodyweight Exercise";if(x.type==="run")return"Run Workout";if(x.type==="rest")return"Recovery Day";return String(x.type||"Training");}

  const baseCurrentWorkout16 = window.__coachBaseCurrentWorkout1601 || currentWorkout;
  window.__coachBaseCurrentWorkout1601 = baseCurrentWorkout16;

  function adjustedWorkout16(){
    const base = clone16(baseCurrentWorkout16());
    const id=goalId16(), g=goal16();
    base.goalId=id;base.goalName=g.name;base.goalPriority=g.priority;base.goalNote=g.note;base.goalMilestone=g.milestone;
    if(id==="muscle"){
      if(base.type==="run"){base.title="Support Cardio";base.structure="Easy Zone 2 cardio. Keep it controlled and save hard effort for lifting.";base.purpose="Support fat loss and heart health without interfering with strength progression.";base.effort="Easy to moderate. You should finish fresh.";if(Number(base.total))base.total=Math.min(Number(base.total),30);}
      else if(base.type==="bodyweight"){base.title="Strength Development";base.structure=(base.structure||"Strength work")+" · Add one controlled round if form stays sharp.";base.purpose="Build muscle, joint control, and progressive strength.";base.effort="Controlled and strong. Leave one or two reps in reserve.";if(Number(base.rounds))base.rounds=Number(base.rounds)+1;}
    }
    if(id==="fatloss"){
      if(base.type==="run"){base.title="Fat-Loss Conditioning";base.structure="Steady conditioning. No racing. Burn calories while protecting recovery.";base.purpose="Improve conditioning and support weight trend consistency.";base.effort="Sustainable. Finish able to do more.";if(Number(base.total))base.total=Number(base.total)+5;}
      else if(base.type==="bodyweight"){base.title="Metabolic Strength";base.structure="Move cleanly with shorter rests. Keep form strict.";base.purpose="Preserve muscle and raise daily training output.";}
    }
    if(id==="endurance"){
      if(base.type==="run"){base.title=base.day==="Sat"?"Endurance Long Run":"Endurance Builder";base.structure=(base.structure||"Run/walk")+" · Keep the first half patient.";base.purpose="Build the aerobic engine for the 13-mile goal.";base.effort="Easy enough to repeat. Do not race training.";if(Number(base.total)&&base.day==="Sat")base.total=Number(base.total)+5;}
      else if(base.type==="bodyweight"){base.title="Runner Strength";base.structure="Strength support for hips, trunk, legs, and posture.";base.purpose="Build durability for running without creating excessive soreness.";if(Number(base.rounds))base.rounds=Math.max(1,Number(base.rounds)-1);}
    }
    if(id==="general"){base.title=base.type==="run"?"General Fitness Run":base.type==="bodyweight"?"General Strength":"Recovery Day";base.purpose="Build a reliable base of health, mobility, and consistency.";base.effort="Moderate and controlled.";if(Number(base.total))base.total=Math.max(20,Math.round(Number(base.total)*0.9));}
    if(id==="maintain"){base.title=base.type==="run"?"Maintenance Run":base.type==="bodyweight"?"Maintenance Strength":"Recovery Day";base.purpose="Maintain capacity without accumulating unnecessary stress.";base.effort="Controlled. Stop before fatigue gets expensive.";if(Number(base.total))base.total=Math.max(20,Math.round(Number(base.total)*0.75));if(Number(base.rounds))base.rounds=Math.max(1,Math.round(Number(base.rounds)*0.75));}
    return base;
  }
  currentWorkout = adjustedWorkout16; window.currentWorkout = currentWorkout;

  function repaintShell16(){
    document.body.classList.add("coach-v16");
    document.title=APP_NAME;
    document.querySelectorAll(".v15-wordmark").forEach(e=>e.textContent=APP_NAME);
    document.querySelectorAll(".v15-subbrand").forEach(e=>e.textContent="Train With Purpose.");
    document.querySelectorAll("header h1").forEach(e=>e.textContent=APP_NAME);
    document.querySelectorAll(".logo").forEach(e=>e.textContent="C");
    document.querySelectorAll("nav button").forEach(btn=>{const span=btn.querySelector("span");const t=(span?span.textContent:btn.textContent).trim().toLowerCase();if(t==="plan"){if(span)span.textContent="Goals";else btn.textContent="Goals";}});
  }

  function renderToday1601(){
    ensure16();repaintShell16();
    const today=document.getElementById("today"); if(!today)return;
    const x=currentWorkout(), g=goal16(), wt=latestWeight16(), ch=weightChange16(), pct=pct16();
    today.innerHTML=`
      <section class="v15-today-hero coach-v16-hero">
        <div class="v15-hero-bg"></div><div class="v15-hero-shade"></div>
        <div class="v15-hero-content"><div><div class="coach-v16-badge">${APP_NAME} · ${esc16(g.name)}</div><div class="v15-meta-line">${shortDate16()} · Week ${state.week} · Day ${state.dayIndex} · ${esc16(g.phase)}</div><h2 class="v15-hero-title">${esc16(label16(x))}</h2><div class="v15-hero-subtitle">${esc16(x.title||"Today's Mission")}</div></div><div class="v15-hero-bottom"><button class="v15-primary-action" onclick="window.startWorkout()">Start Guided Workout</button><button class="v15-round-action" onclick="window.openBriefingV110 ? window.openBriefingV110() : null">→</button></div></div>
      </section>
      <section class="coach-v16-goal-adjustment"><div class="coach-v16-badge">Goal-Aware Training</div><h3>${esc16(g.name)} · ${esc16(g.priority)}</h3><p class="v15-muted">${esc16(x.goalNote||g.note)}</p><div class="coach-v16-priority-row"><div><span>Today’s Bias</span><strong>${esc16(x.goalPriority||g.priority)}</strong></div><div><span>Training Load</span><strong>${esc16(g.load)}</strong></div></div></section>
      <section class="coach-v16-weight-card"><div><div class="v15-kicker">Body Weight</div><div class="coach-v16-weight-number">${wt?`${Number(wt.weight).toFixed(1)} lb`:"Not logged"}</div><p class="v15-muted">${wt?`Last entry: ${esc16(wt.date)}${ch?` · ${ch} since start`:""}`:"Add today's weight to start a trend."}</p></div><button class="v15-round-action" onclick="coachV16OpenWeight()">+</button></section>
      <section class="v15-panel v15-coach-card"><div class="v15-kicker">Next Milestone</div><h3>${esc16(x.goalMilestone||g.milestone)}</h3><p class="v15-muted">${esc16(x.success || "Complete the work with control.")}</p></section>`;
  }

  function renderPlan1601(){
    ensure16();repaintShell16();
    const host=document.getElementById("plan"); if(!host)return;
    const g=goal16(), pct=pct16();
    const phases=[["Foundation","Build reliable habits and clean movement."],["Build","Increase capacity through repeatable work."],["Peak","Express the goal with controlled intensity."],["Maintain","Keep the standard and stay healthy."]];
    host.innerHTML=`<section class="v15-screen-head"><div class="v15-kicker">Goals</div><h2>${APP_NAME} Plan</h2><p class="v15-muted">Goal → Phase → Today's Mission.</p></section><section class="coach-v16-goal-hero"><div class="coach-v16-badge">Active Goal</div><h2>${esc16(g.name)}</h2><p class="v15-muted">${esc16(g.note)}</p><div class="v15-metric-grid" style="margin-top:14px"><div><span>Phase</span><strong>${esc16(g.phase)}</strong></div><div><span>Progress</span><strong>${pct}%</strong></div></div><div class="coach-v16-actions"><button class="v1531-button-primary" onclick="coachV16OpenGoalPicker()">Change Goal</button><button class="v1531-button-secondary" onclick="openSetPosition ? openSetPosition() : null">Set Week/Day</button></div></section>${phases.map((p,i)=>`<section class="v15-phase ${g.phase===p[0]?"active":""}"><div class="v15-phase-bg"></div><div class="v15-phase-content"><div class="v15-chip">${g.phase===p[0]?"Current Phase":"Training Phase"}</div><h3>${p[0]}</h3><p>${p[1]}</p><div class="v15-phase-progress"><div style="width:${g.phase===p[0]?pct:(i*25)}%"></div></div></div></section>`).join("")}`;
  }

  const prevDashboard1601 = window.renderDashboard;
  function renderDashboard1601(){
    if(typeof prevDashboard1601==="function")prevDashboard1601();
    ensure16();repaintShell16();
    const host=document.getElementById("dashboard"); if(!host)return;
    document.getElementById("coachV1601Stats")?.remove();
    const g=goal16(), wt=latestWeight16(), ch=weightChange16();
    host.insertAdjacentHTML("afterbegin",`<section id="coachV1601Stats" class="v15-panel"><div class="v15-kicker">COACH Overview</div><h3>${esc16(g.name)}</h3><p class="v15-muted">${esc16(g.note)}</p><div class="v15-metric-grid"><div><span>Priority</span><strong>${esc16(g.priority)}</strong></div><div><span>Weight</span><strong>${wt?Number(wt.weight).toFixed(1):"—"}</strong></div></div><p class="v15-muted small" style="margin-top:10px">${wt?`Last weight: ${esc16(wt.date)}${ch?` · ${ch}`:""}`:"No weight entries yet."}</p><div class="coach-v16-actions"><button class="v1531-button-primary" onclick="coachV16OpenWeight()">Add Weight</button><button class="v1531-button-secondary" onclick="coachV16OpenGoalPicker()">Change Goal</button></div></section>`);
  }

  renderToday = renderToday1601; renderPlan = renderPlan1601; renderDashboard = renderDashboard1601;
  window.renderToday = renderToday; window.renderPlan = renderPlan; window.renderDashboard = renderDashboard;

  const previousShow1601 = window.showScreen;
  showScreen = function(id,btn){if(typeof previousShow1601==="function")previousShow1601(id,btn);repaintShell16();if(id==="today")setTimeout(renderToday1601,0);if(id==="plan")setTimeout(renderPlan1601,0);if(id==="dashboard")setTimeout(renderDashboard1601,0);};
  window.showScreen = showScreen;

  const previousRenderAll1601 = window.renderAll;
  renderAll = function(){if(typeof previousRenderAll1601==="function")previousRenderAll1601();repaintShell16();setTimeout(()=>{renderToday1601();renderPlan1601();renderDashboard1601();},0);};
  window.renderAll = renderAll;

  repaintShell16();
  setTimeout(()=>{renderToday1601();renderPlan1601();renderDashboard1601();},50);
  setTimeout(()=>{renderToday1601();renderPlan1601();renderDashboard1601();},500);
})();


// ---------- COACH V16.1 GOAL-BASED PROGRAM ENGINE ----------
(function(){
  const BASE_WORKOUT = window.__coachBaseCurrentWorkout1601 || currentWorkout;
  const DAY_NAMES = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  function esc(v){return String(v ?? "").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));}
  function clone(v){try{return structuredClone(v);}catch(e){return JSON.parse(JSON.stringify(v));}}
  function ensure(){state.coachV16=state.coachV16||{};state.coachV16.goal=state.coachV16.goal||"hybrid";}
  function goalId(){ensure();return state.coachV16.goal||"hybrid";}
  function dayIndex(){return Math.max(1,Math.min(7,Number(state.dayIndex||1)));}
  function base(){return clone(BASE_WORKOUT());}

  const FALLBACK_TEMPLATES = {
    upperA:{id:"upperA",name:"Upper A",focus:"Chest Emphasis",exercises:[
      ["Barbell Bench Press",4,"6-8"],["Incline Dumbbell Press",3,"8-10"],["Pull-Ups or Lat Pulldown",4,"8-12"],["Seated Cable Row",3,"10"],["Dumbbell Shoulder Press",3,"8-10"],["Dumbbell Lateral Raises",3,"12-15"],["Rope Tricep Pushdowns",3,"12"],["EZ-Bar Curls",3,"10-12"]
    ]},
    lowerCore:{id:"lowerCore",name:"Lower + Core",focus:"Legs and Trunk",exercises:[
      ["Barbell Squats",4,"6-8"],["Romanian Deadlifts",3,"8-10"],["Walking Lunges",3,"10 each leg"],["Leg Curl",3,"12"],["Standing Calf Raises",4,"15"],["Hanging Knee Raises",3,"15"],["Cable Crunches",3,"15"],["Plank",3,"60 sec"]
    ]},
    upperB:{id:"upperB",name:"Upper B",focus:"Shoulders and Arms",exercises:[
      ["Incline Barbell Bench",4,"6-8"],["Weighted Dips or Chest Machine Press",3,"8-12"],["Chest-Supported Row",4,"8-10"],["Pull-Ups or Lat Pulldown",3,"10"],["Dumbbell Lateral Raises",4,"15"],["Rear Delt Flyes",3,"15"],["Barbell Curls",4,"10"],["Hammer Curls",3,"12"],["Skull Crushers",4,"10"]
    ]},
    fullBody:{id:"fullBody",name:"Full Body",focus:"General Strength",exercises:[
      ["Goblet Squat",3,"10-12"],["Dumbbell Bench Press",3,"8-10"],["Lat Pulldown",3,"10-12"],["Romanian Deadlift",3,"8-10"],["Dumbbell Shoulder Press",3,"8-10"],["Farmer Carry",3,"40 yards"]
    ]}
  };

  function getTemplate(id){
    const fromState = (state.strengthTemplates||[]).find(t=>t.id===id);
    return fromState || FALLBACK_TEMPLATES[id] || FALLBACK_TEMPLATES.fullBody;
  }

  function lift(id, purpose){
    const t=getTemplate(id);
    const exercises=(t.exercises||[]).map(e=>{
      if(Array.isArray(e)) return {mode:"reps",name:e[0],sets:e[1],reps:e[2],seconds:0};
      return {mode:String(e.reps||"").includes("sec")?"timed":"reps",name:e.name,sets:e.sets||3,reps:e.reps||"8-10",seconds:String(e.reps||"").includes("sec")?parseInt(e.reps)||45:0,instruction:e.instruction||""};
    });
    return {
      type:"lift",
      title:t.name,
      day:DAY_NAMES[dayIndex()-1],
      time:"Gym strength",
      structure:`${t.name}: ${t.focus || "Strength"}`,
      distance:"Strength log",
      templateId:t.id,
      strengthTemplateId:t.id,
      exercises,
      purpose:purpose || "Build strength with progressive overload.",
      effort:"Controlled. Log weight and reps honestly.",
      success:"Complete the planned sets and save the session.",
      caution:"Use safe loading, clean form, and stop sharp pain."
    };
  }

  function run(title,total,structure,purpose,effort="Easy to moderate"){
    return {
      type:"run", day:DAY_NAMES[dayIndex()-1], title, time:`${total} min`, total,
      runSeconds:180, walkSeconds:60, structure, distance:"Time-based",
      purpose, terrain:"Flat route, treadmill, or controlled outdoor path.",
      effort, success:"Finish controlled and able to recover.", caution:"Pain means stop. Fatigue is information."
    };
  }

  function recovery(title="Recovery / Mobility", purpose="Recover so training can continue."){
    return {type:"rest", day:DAY_NAMES[dayIndex()-1], title, time:"Recovery", total:20, runSeconds:0, walkSeconds:60, structure:"Mobility, stretching, walking, or full rest.", distance:"No target", purpose, effort:"Very easy.", success:"Finish feeling better.", caution:"Do not turn recovery into training."};
  }

  const GOAL_WEEKLY = {
    muscle:["upperA","supportCardio","lowerCore","recovery","upperB","conditioning","recovery"],
    hybrid:["upperA","easyRun","lowerCore","intervals","upperB","longRun","recovery"],
    fatloss:["fullBody","zone2","lowerCore","conditioning","upperB","longCardio","recovery"],
    endurance:["easyRun","runnerStrength","intervals","recovery","steadyRun","longRun","recovery"],
    general:["fullBody","easyCardio","mobilityCore","fullBody","easyRun","outdoor","recovery"],
    maintain:["fullBody","easyCardio","recovery","fullBody","easyRun","optional","recovery"]
  };

  function dayCode(){
    const arr=GOAL_WEEKLY[goalId()] || GOAL_WEEKLY.hybrid;
    return arr[dayIndex()-1] || "recovery";
  }

  function workoutFromCode(code){
    switch(code){
      case "upperA": return lift("upperA","Upper-body strength and progressive overload.");
      case "lowerCore": return lift("lowerCore","Lower-body strength, core control, and durability.");
      case "upperB": return lift("upperB","Shoulders, arms, upper-body volume, and balanced pulling.");
      case "fullBody": return lift("fullBody","Full-body strength and movement quality.");
      case "runnerStrength": {
        const w=base();
        w.type="bodyweight"; w.title="Runner Strength"; w.time="Support strength"; w.structure="Controlled bodyweight work for hips, trunk, legs, and posture."; w.purpose="Build durability for running without excessive soreness."; w.effort="Controlled"; 
        return w;
      }
      case "supportCardio": return run("Support Cardio",25,"Zone 2 cardio. Easy pace. No racing.","Support heart health and recovery without interfering with muscle growth.","Easy");
      case "easyRun": return run("Easy Run",30,"Conversational run/walk effort.","Build aerobic base and consistency.","Easy");
      case "zone2": return run("Zone 2 Cardio",40,"Steady conversational cardio.","Support fat loss, endurance, and recovery.","Easy to moderate");
      case "conditioning": return run("Conditioning",30,"Short controlled intervals or brisk incline walking.","Raise conditioning without wrecking recovery.","Moderate");
      case "longCardio": return run("Long Easy Cardio",55,"Comfortable longer effort. Walk/run allowed.","Increase calorie output and endurance sustainably.","Easy");
      case "intervals": return run("Intervals / Hills",32,"Controlled hard segments with full recovery. No sprinting.","Build speed, strength, and aerobic capacity.","Moderate to strong");
      case "steadyRun": return run("Steady Run",38,"Sustained controlled effort.","Build stamina and pacing discipline.","Comfortably steady");
      case "longRun": return run("Long Run",60,"Patient long easy run/walk.","Build endurance and mental control.","Easy and patient");
      case "easyCardio": return run("Easy Cardio",25,"Walk, bike, easy jog, or treadmill.","Support general health and consistency.","Easy");
      case "outdoor": return run("Outdoor Session",40,"Walk, hike, easy run, or mixed movement.","Build general capacity outdoors.","Easy to moderate");
      case "mobilityCore": {
        const w=base();
        w.type="bodyweight"; w.title="Mobility + Core"; w.time="20-25 min"; w.structure="Core, mobility, and light movement."; w.purpose="Improve movement quality and trunk control."; w.effort="Easy to moderate";
        return w;
      }
      case "optional": return recovery("Optional Activity","Walk, stretch, hike easy, or rest. Preserve fitness without forcing load.");
      default: return recovery();
    }
  }

  function goalWorkout(){
    const w=workoutFromCode(dayCode());
    w.goalScheduleCode=dayCode();
    w.goalName=(state.coachV16?.goal || "hybrid");
    return w;
  }

  currentWorkout = goalWorkout;
  window.currentWorkout = currentWorkout;

  function weeklySummary(){
    const arr=GOAL_WEEKLY[goalId()]||GOAL_WEEKLY.hybrid;
    return arr.map((code,i)=>({day:DAY_NAMES[i],code,title:workoutFromCode(code).title}));
  }

  const prevStart = window.startWorkout || startWorkout;
  startWorkout = function(){
    const x=currentWorkout();
    if(x.type==="lift"){
      if(typeof window.ruut155StartLift === "function"){
        window.ruut155StartLift(x.strengthTemplateId || x.templateId || "fullBody");
        return;
      }
      alert("Strength logging is not available yet. Open the Strength tab and start this workout there.");
      return;
    }
    return prevStart();
  };
  window.startWorkout = startWorkout;

  const priorRenderToday = window.renderToday;
  renderToday = function(){
    if(typeof priorRenderToday === "function") priorRenderToday();
    const today=document.getElementById("today"); if(!today) return;
    const x=currentWorkout();
    const startBtn=today.querySelector(".v15-primary-action");
    if(startBtn && x.type==="lift") startBtn.textContent="Start Strength Log";
    document.getElementById("coachV161Week")?.remove();
    const week=weeklySummary();
    today.insertAdjacentHTML("beforeend",`<section id="coachV161Week" class="coach-v161-week-card">
      <div class="v15-kicker">Goal-Based Week</div>
      <h3>${esc((state.coachV16?.goal||"hybrid").replace(/^\w/,c=>c.toUpperCase()))} Schedule</h3>
      <div class="coach-v161-week-grid">${week.map((d,i)=>`<div class="coach-v161-day ${i+1===dayIndex()?"active":""}"><b>${d.day}</b><span>${esc(d.title)}</span></div>`).join("")}</div>
    </section>`);
  };
  window.renderToday = renderToday;

  const priorRenderPlan = window.renderPlan;
  renderPlan = function(){
    if(typeof priorRenderPlan === "function") priorRenderPlan();
    const host=document.getElementById("plan"); if(!host) return;
    document.getElementById("coachV161PlanWeek")?.remove();
    const week=weeklySummary();
    host.insertAdjacentHTML("beforeend",`<section id="coachV161PlanWeek" class="coach-v161-week-card">
      <div class="v15-kicker">Weekly Training Structure</div>
      <h3>Goal-Specific Schedule</h3>
      <p class="v15-muted">The selected goal now controls what kind of workout appears each day.</p>
      <div class="coach-v161-week-grid">${week.map((d,i)=>`<div class="coach-v161-day ${i+1===dayIndex()?"active":""}"><b>${d.day}</b><span>${esc(d.title)}</span></div>`).join("")}</div>
    </section>`);
  };
  window.renderPlan = renderPlan;

  const oldShow = window.showScreen;
  showScreen = function(id,btn){
    if(typeof oldShow==="function") oldShow(id,btn);
    if(id==="today") setTimeout(renderToday,20);
    if(id==="plan") setTimeout(renderPlan,20);
  };
  window.showScreen = showScreen;

  const oldRenderAll = window.renderAll;
  renderAll = function(){
    if(typeof oldRenderAll==="function") oldRenderAll();
    setTimeout(()=>{renderToday();renderPlan();},20);
  };
  window.renderAll=renderAll;

  setTimeout(()=>{try{renderToday();renderPlan();}catch(e){console.warn("COACH v16.1 render failed",e);}},300);
})();


// ---------- COACH V16.1.1 STABLE RENDER FIX ----------
(function(){
  const APP_NAME="COACH";
  const DAYS=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const GOALS={
    hybrid:{label:"Hybrid Athlete",phase:"Build",priority:"Balanced",load:"Standard",note:"Blend strength, endurance, and recovery. Build capacity without specializing too narrowly."},
    muscle:{label:"Build Muscle",phase:"Build",priority:"Strength",load:"Strength biased",note:"Prioritize progressive overload. Running supports the goal without stealing recovery from lifting."},
    fatloss:{label:"Lose Fat",phase:"Foundation",priority:"Consistency",load:"Sustainable",note:"Use repeatable strength, conditioning, and weight trend to drive fat loss without burning out."},
    endurance:{label:"13-Mile Endurance",phase:"Build",priority:"Running",load:"Endurance biased",note:"Running is the main driver. Strength supports durability and injury resistance."},
    general:{label:"General Fitness",phase:"Foundation",priority:"Balanced Health",load:"Moderate",note:"Build useful fitness, mobility, and consistency without chasing extremes."},
    maintain:{label:"Maintain Fitness",phase:"Maintain",priority:"Preservation",load:"Reduced",note:"Keep the rhythm, protect recovery, and maintain capacity."}
  };
  function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));}
  function ensure(){state.coachV16=state.coachV16||{};state.coachV16.goal=state.coachV16.goal||"hybrid";state.weightLogV16=state.weightLogV16||[];}
  function gid(){ensure();return GOALS[state.coachV16.goal]?state.coachV16.goal:"hybrid";}
  function goal(){return GOALS[gid()]||GOALS.hybrid;}
  function dindex(){return Math.max(1,Math.min(7,Number(state.dayIndex||1)));}
  function latestWeight(){ensure();const w=(state.weightLogV16||[]).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date)));return w[w.length-1]||null;}
  function pct(){try{return typeof progressPercent==="function"?progressPercent():Math.round(((state.completed||[]).length/84)*100);}catch(e){return 0;}}
  function dateLabel(){try{return new Date().toLocaleDateString(undefined,{month:"numeric",day:"numeric",year:"2-digit"});}catch(e){return new Date().toISOString().slice(0,10);}}
  const WEEKLY={
    muscle:["Upper A","Support Cardio","Lower + Core","Recovery","Upper B","Conditioning","Recovery"],
    hybrid:["Upper A","Easy Run","Lower + Core","Intervals","Upper B","Long Run","Recovery"],
    fatloss:["Full Body","Zone 2 Cardio","Lower + Core","Conditioning","Upper B","Long Easy Cardio","Recovery"],
    endurance:["Easy Run","Runner Strength","Intervals / Hills","Recovery","Steady Run","Long Run","Recovery"],
    general:["Full Body","Easy Cardio","Mobility + Core","Full Body","Easy Run","Outdoor Session","Recovery"],
    maintain:["Full Body","Easy Cardio","Recovery","Full Body","Easy Run","Optional Activity","Recovery"]
  };
  function schedule(){return WEEKLY[gid()]||WEEKLY.hybrid;}
  function todayTitle(){return schedule()[dindex()-1]||"Recovery";}
  function typeFromTitle(t){if(/Upper|Lower|Full Body/.test(t))return"lift";if(/Recovery|Mobility|Optional/.test(t))return"rest";return"run";}
  function templateFromTitle(t){if(t==="Upper A")return"upperA";if(t==="Lower + Core")return"lowerCore";if(t==="Upper B")return"upperB";if(t==="Full Body")return"fullBody";return"";}
  function activeWorkout(){
    const title=todayTitle(), type=typeFromTitle(title);
    if(type==="lift")return{type,title,templateId:templateFromTitle(title),structure:`${title} strength session`,purpose:"Build strength through progressive overload.",success:"Complete the planned lifts and save the session."};
    if(type==="rest")return{type,title,structure:"Recovery, mobility, stretching, walking, or full rest.",purpose:"Recover so training can continue.",success:"Finish feeling better."};
    return{type,title,structure:title,purpose:"Build conditioning in support of the selected goal.",success:"Finish controlled."};
  }
  function shell(){
    document.body.classList.add("coach-v16");document.title=APP_NAME;
    document.querySelectorAll(".v15-wordmark").forEach(e=>e.textContent=APP_NAME);
    document.querySelectorAll(".v15-subbrand").forEach(e=>e.textContent="Train With Purpose.");
    document.querySelectorAll("header h1").forEach(e=>e.textContent=APP_NAME);
    document.querySelectorAll(".logo").forEach(e=>e.textContent="C");
    document.querySelectorAll("nav button").forEach(btn=>{const span=btn.querySelector("span");const label=(span?span.textContent:btn.textContent).trim().toLowerCase();if(label==="plan"){if(span)span.textContent="Goals";else btn.textContent="Goals";}});
  }
  function weekGrid(){
    return `<section class="coach-v161-week-card"><div class="v15-kicker">Goal-Based Week</div><h3>${esc(goal().label)} Schedule</h3><div class="coach-v161-week-grid">${schedule().map((name,i)=>`<div class="coach-v161-day ${i+1===dindex()?"active":""}"><b>${DAYS[i]}</b><span>${esc(name)}</span></div>`).join("")}</div></section>`;
  }
  function todayStable(){
    ensure();shell();const host=document.getElementById("today");if(!host)return;const g=goal(), w=activeWorkout(), wt=latestWeight();
    host.innerHTML=`<section class="v15-today-hero coach-v16-hero"><div class="v15-hero-bg"></div><div class="v15-hero-shade"></div><div class="v15-hero-content"><div><div class="coach-v16-badge">COACH · ${esc(g.label)}</div><div class="v15-meta-line">${dateLabel()} · Week ${state.week} · Day ${state.dayIndex} · ${esc(g.phase)}</div><h2 class="v15-hero-title">${esc(w.title)}</h2><div class="v15-hero-subtitle">${esc(w.structure)}</div></div><div class="v15-hero-bottom"><button class="v15-primary-action" onclick="coach161StartToday()">${w.type==="lift"?"Start Strength Log":"Start Guided Workout"}</button><button class="v15-round-action" onclick="window.openBriefingV110 ? window.openBriefingV110() : null">→</button></div></div></section><section class="coach-v16-goal-adjustment"><div class="coach-v16-badge">Goal-Aware Training</div><h3>${esc(g.label)} · ${esc(g.priority)}</h3><p class="v15-muted">${esc(g.note)}</p><div class="coach-v16-priority-row"><div><span>Today’s Bias</span><strong>${esc(g.priority)}</strong></div><div><span>Training Load</span><strong>${esc(g.load)}</strong></div></div></section><section class="coach-v16-weight-card"><div><div class="v15-kicker">Body Weight</div><div class="coach-v16-weight-number">${wt?`${Number(wt.weight).toFixed(1)} lb`:"Not logged"}</div><p class="v15-muted">${wt?`Last entry: ${esc(wt.date)}`:"Add today's weight to start a trend."}</p></div><button class="v15-round-action" onclick="coachV16OpenWeight()">+</button></section>${weekGrid()}<section class="v15-panel v15-coach-card"><div class="v15-kicker">Next Milestone</div><h3>${esc(w.success)}</h3><p class="v15-muted">${esc(w.purpose)}</p></section>`;
  }
  function goalsStable(){
    ensure();shell();const host=document.getElementById("plan");if(!host)return;const g=goal();
    host.innerHTML=`<section class="v15-screen-head"><div class="v15-kicker">Goals</div><h2>COACH Plan</h2><p class="v15-muted">Your selected goal controls the weekly structure and today’s mission.</p></section><section class="coach-v16-goal-hero"><div class="coach-v16-badge">Active Goal</div><h2>${esc(g.label)}</h2><p class="v15-muted">${esc(g.note)}</p><div class="v15-metric-grid" style="margin-top:14px"><div><span>Phase</span><strong>${esc(g.phase)}</strong></div><div><span>Progress</span><strong>${pct()}%</strong></div></div><div class="coach-v16-actions"><button class="v1531-button-primary" onclick="coachV16OpenGoalPicker()">Change Goal</button><button class="v1531-button-secondary" onclick="openSetPosition ? openSetPosition() : null">Set Week/Day</button></div></section>${weekGrid()}`;
  }
  function statsStable(){
    ensure();shell();const host=document.getElementById("dashboard");if(!host)return;const g=goal(), wt=latestWeight();
    host.innerHTML=`<section class="v15-screen-head"><div class="v15-kicker">Stats</div><h2>Progress</h2><p class="v15-muted">Training, strength, recovery, and body-weight trend.</p></section><section class="v15-panel"><div class="v15-kicker">COACH Overview</div><h3>${esc(g.label)}</h3><p class="v15-muted">${esc(g.note)}</p><div class="v15-metric-grid"><div><span>Priority</span><strong>${esc(g.priority)}</strong></div><div><span>Weight</span><strong>${wt?Number(wt.weight).toFixed(1):"—"}</strong></div><div><span>Program</span><strong>${pct()}%</strong></div><div><span>Completed</span><strong>${(state.completed||[]).length}</strong></div></div><div class="coach-v16-actions"><button class="v1531-button-primary" onclick="coachV16OpenWeight()">Add Weight</button><button class="v1531-button-secondary" onclick="coachV16OpenGoalPicker()">Change Goal</button></div></section><section class="v15-panel"><div class="v15-kicker">This Week</div><h3>Goal Structure</h3>${weekGrid()}</section>`;
  }
  if(!window.__coachOriginalStartWorkout1611 && typeof window.startWorkout==="function") window.__coachOriginalStartWorkout1611=window.startWorkout;
  window.coach161StartToday=function(){const w=activeWorkout();if(w.type==="lift"){if(typeof window.ruut155StartLift==="function"){window.ruut155StartLift(w.templateId||"fullBody");return;}showScreen("strength");return;}return window.__coachOriginalStartWorkout1611();};
  const oldShow=window.showScreen;
  window.showScreen=showScreen=function(id,btn){shell();document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));const screen=document.getElementById(id);if(screen)screen.classList.add("active");document.querySelectorAll("nav button").forEach(b=>b.classList.remove("active"));const navBtn=btn||document.querySelector(`nav button[data-target="${id}"]`);if(navBtn)navBtn.classList.add("active");if(id==="today")return todayStable();if(id==="plan")return goalsStable();if(id==="dashboard")return statsStable();if(typeof oldShow==="function")return oldShow(id,btn);};
  window.renderToday=renderToday=todayStable;window.renderPlan=renderPlan=goalsStable;window.renderDashboard=renderDashboard=statsStable;
  const oldRenderAll=window.renderAll;
  window.renderAll=renderAll=function(){shell();todayStable();goalsStable();statsStable();try{if(typeof renderWorkout==="function")renderWorkout();}catch(e){}try{if(typeof renderRecover==="function")renderRecover();}catch(e){}try{if(typeof renderStrength==="function")renderStrength();}catch(e){}};
  shell();const active=document.querySelector(".screen.active")?.id||"today";if(active==="today")todayStable();if(active==="plan")goalsStable();if(active==="dashboard")statsStable();
})();


// ---------- COACH V16.1.2 RENDER LOCK ----------
(function(){
  /*
    Locks COACH renderers into both global window functions and the legacy R14 object.
    This prevents older delayed R14.renderToday/renderDashboard/renderPlan calls from repainting v15/RUUT screens.
  */
  function lockWhenReady(){
    const R = window.ruut14Final || window.R14 || null;
    if(!R || typeof window.renderToday !== "function" || typeof window.renderPlan !== "function" || typeof window.renderDashboard !== "function"){
      setTimeout(lockWhenReady, 100);
      return;
    }

    const coachToday = window.renderToday;
    const coachPlan = window.renderPlan;
    const coachDashboard = window.renderDashboard;
    const coachShow = window.showScreen;
    const coachRenderAll = window.renderAll;

    R.renderToday = coachToday;
    R.renderPlan = coachPlan;
    R.renderDashboard = coachDashboard;
    R.showScreen = coachShow;
    R.renderAll = coachRenderAll;

    window.renderToday = coachToday;
    window.renderPlan = coachPlan;
    window.renderDashboard = coachDashboard;
    window.showScreen = coachShow;
    window.renderAll = coachRenderAll;

    try{
      document.body.classList.add("coach-v16");
      document.querySelectorAll(".v15-wordmark").forEach(e=>e.textContent="COACH");
      document.querySelectorAll(".v15-subbrand").forEach(e=>e.textContent="Train With Purpose.");
      document.querySelectorAll("nav button").forEach(btn=>{
        const span=btn.querySelector("span");
        const label=(span?span.textContent:btn.textContent).trim().toLowerCase();
        if(label==="plan"){ if(span) span.textContent="Goals"; else btn.textContent="Goals"; }
      });
    }catch(e){}

    const active = document.querySelector(".screen.active")?.id || "today";
    if(active === "today") coachToday();
    if(active === "plan") coachPlan();
    if(active === "dashboard") coachDashboard();

    // v16.1.3: render lock remains installed, but repeated repaint loop removed.

  }

  lockWhenReady();
})();


// ---------- COACH V16.1.3 NO-REPAINT LOOP MARKER ----------
(function(){
  window.COACH_RENDER_VERSION = "16.1.3";
  try{
    document.body.classList.add("coach-v16");
    document.querySelectorAll(".v15-wordmark").forEach(e=>e.textContent="COACH");
    document.querySelectorAll(".v15-subbrand").forEach(e=>e.textContent="Train With Purpose.");
  }catch(e){}
})();


// ---------- COACH V16.1.4 ADD 30-MIN UPPER BODY TEMPLATE ----------
(function(){
  function ensureStrengthTemplateStore(){
    state.strengthTemplates = Array.isArray(state.strengthTemplates) ? state.strengthTemplates : [];
  }

  function ex(name, sets, reps, weight, steps, cues, safety){
    return {
      name,
      sets,
      reps,
      weight,
      defaultWeight: weight,
      instruction: [
        steps.join(" "),
        "Key form cues: " + cues.join(" "),
      ].join(" "),
      safety: safety.join(" ")
    };
  }

  function upperBody30Template(){
    return {
      id: "upperBody30ChestShoulders",
      name: "30-min Upper Body",
      focus: "Chest/Shoulders",
      schedule: "Custom",
      notes: "Dumbbell-focused upper-body session. Chest, shoulders, and arms. Default weights are starting targets and can be changed during logging.",
      exercises: [
        ex(
          "Dumbbell Bench Press", 3, "10", 60,
          [
            "Lie flat on a bench with a dumbbell in each hand.",
            "Hold the dumbbells at chest level with palms facing forward.",
            "Plant your feet firmly on the floor.",
            "Press the dumbbells upward until your arms are nearly straight.",
            "Lower under control until your elbows are slightly below bench level.",
            "Repeat."
          ],
          [
            "Keep your shoulder blades pulled back and down.",
            "Maintain a slight natural arch in your lower back.",
            "Wrists stay straight over elbows.",
            "Control both the lifting and lowering phases."
          ],
          [
            "Do not bounce the weights off your chest.",
            "Avoid flaring elbows straight out to the sides. Aim for about a 45 to 60 degree angle from your torso.",
            "Use a spotter or lighter weight if you are unfamiliar with the movement.",
            "Stop if you feel shoulder pain rather than chest muscle fatigue."
          ]
        ),
        ex(
          "Dumbbell Chest Fly", 3, "10", 40,
          [
            "Lie on a flat bench holding dumbbells above your chest.",
            "Slightly bend your elbows and maintain that bend throughout.",
            "Open your arms wide in an arc until you feel a stretch across your chest.",
            "Squeeze your chest to bring the dumbbells back together above your chest."
          ],
          [
            "Think hug a tree rather than pressing.",
            "Keep the elbow bend constant.",
            "Move slowly and deliberately."
          ],
          [
            "Use lighter weights than your bench press.",
            "Do not lower excessively deep.",
            "Avoid turning the movement into a press.",
            "If you have shoulder issues, reduce range of motion."
          ]
        ),
        ex(
          "Dumbbell Hammer Curl", 3, "10", 40,
          [
            "Stand tall holding dumbbells at your sides.",
            "Keep palms facing each other throughout the movement.",
            "Curl the dumbbells toward your shoulders.",
            "Lower slowly to the starting position."
          ],
          [
            "Keep elbows pinned near your sides.",
            "Stand tall without leaning backward.",
            "Move only at the elbow joint."
          ],
          [
            "Avoid swinging the weights.",
            "Do not use your back to generate momentum.",
            "Control the lowering phase to reduce elbow strain.",
            "Select a weight that allows strict form."
          ]
        ),
        ex(
          "Dumbbell Shoulder Press", 3, "10", 35,
          [
            "Sit on a bench with back support or stand with feet shoulder-width apart.",
            "Hold dumbbells at shoulder level.",
            "Press upward until your arms are nearly straight overhead.",
            "Lower under control back to shoulder level."
          ],
          [
            "Keep your core tight.",
            "Press slightly inward as the dumbbells rise.",
            "Maintain a neutral spine."
          ],
          [
            "Avoid excessive arching of the lower back.",
            "Keep the movement controlled.",
            "Do not lock out forcefully at the top.",
            "Reduce weight if shoulder discomfort occurs."
          ]
        ),
        ex(
          "Front Raise Dumbbell", 3, "10", 15,
          [
            "Stand with dumbbells in front of your thighs.",
            "Keep a slight bend in your elbows.",
            "Raise the dumbbells forward until they reach shoulder height.",
            "Lower slowly back to the start."
          ],
          [
            "Lift with your shoulders, not momentum.",
            "Keep your torso still.",
            "Raise only to shoulder height."
          ],
          [
            "Avoid swinging your body.",
            "Do not raise the weight above shoulder level.",
            "Use moderate weight; this exercise is harder than it appears.",
            "Stop if you feel pinching in the front of the shoulder."
          ]
        ),
        ex(
          "Lateral Raise Dumbbell", 3, "10", 15,
          [
            "Stand holding dumbbells at your sides.",
            "Slightly bend your elbows.",
            "Raise your arms out to the sides until shoulder height.",
            "Lower slowly under control."
          ],
          [
            "Lead with your elbows, not your hands.",
            "Keep shoulders down and away from your ears.",
            "Maintain a slight forward lean if comfortable."
          ],
          [
            "Use lighter weights than most people think they need.",
            "Avoid shrugging your shoulders during the lift.",
            "Do not swing the weights upward.",
            "Stop at shoulder height to reduce shoulder stress."
          ]
        )
      ]
    };
  }

  function installUpperBody30(){
    ensureStrengthTemplateStore();
    const template = upperBody30Template();
    const existing = state.strengthTemplates.findIndex(t => t.id === template.id);
    if(existing === -1){
      state.strengthTemplates.push(template);
    }else{
      // Keep user-edited session names/order only if they already modified it manually.
      // Otherwise refresh the native template with the expanded instructions and default weights.
      state.strengthTemplates[existing] = {
        ...template,
        ...state.strengthTemplates[existing],
        exercises: state.strengthTemplates[existing].exercises?.length ? state.strengthTemplates[existing].exercises : template.exercises
      };
    }
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }catch(e){}
  }

  installUpperBody30();

  const oldRenderStrength141 = window.renderStrength;
  window.renderStrength = renderStrength = function(){
    installUpperBody30();
    if(typeof oldRenderStrength141 === "function") return oldRenderStrength141();
    if(window.ruut14Final && typeof window.ruut14Final.renderStrength === "function") return window.ruut14Final.renderStrength();
  };

  if(window.ruut14Final && typeof window.ruut14Final.renderStrength === "function"){
    const oldR14Strength141 = window.ruut14Final.renderStrength;
    window.ruut14Final.renderStrength = function(){
      installUpperBody30();
      return oldR14Strength141();
    };
  }

  try{
    if(document.getElementById("strength")?.classList.contains("active")) renderStrength();
  }catch(e){}
})();


// ---------- COACH V16.1.5 UNIVERSAL AUDIO INTERRUPT + STRENGTH TEMPLATE RESTORE ----------
(function(){
  /*
    Fixes:
    1. Universal audio interruption. Any user navigation/skip/next/previous action cancels active speech first.
    2. Restores native strength templates if a prior custom-template patch left only the 30-min Upper Body workout.
    3. Keeps the 30-min Upper Body template as an additional custom/native option.
  */

  function coachCancelSpeech(){
    try{
      if("speechSynthesis" in window){
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();
      }
    }catch(e){}
  }

  window.coachCancelSpeech = coachCancelSpeech;

  // Wrap speech functions so new speech always interrupts old speech.
  const priorSpeak151 = window.speak;
  if(typeof priorSpeak151 === "function" && !priorSpeak151.__coachInterruptWrapped){
    const wrappedSpeak = function(text){
      coachCancelSpeech();
      return priorSpeak151.apply(this, arguments);
    };
    wrappedSpeak.__coachInterruptWrapped = true;
    window.speak = speak = wrappedSpeak;
  }

  if(window.ruut14Final && typeof window.ruut14Final.speak === "function" && !window.ruut14Final.speak.__coachInterruptWrapped){
    const oldR14Speak = window.ruut14Final.speak;
    const wrappedR14Speak = function(text){
      coachCancelSpeech();
      return oldR14Speak.apply(this, arguments);
    };
    wrappedR14Speak.__coachInterruptWrapped = true;
    window.ruut14Final.speak = wrappedR14Speak;
  }

  const priorCue151 = window.cue;
  if(typeof priorCue151 === "function" && !priorCue151.__coachInterruptWrapped){
    const wrappedCue = function(){
      coachCancelSpeech();
      return priorCue151.apply(this, arguments);
    };
    wrappedCue.__coachInterruptWrapped = true;
    window.cue = cue = wrappedCue;
  }

  if(window.ruut14Final && typeof window.ruut14Final.cue === "function" && !window.ruut14Final.cue.__coachInterruptWrapped){
    const oldR14Cue = window.ruut14Final.cue;
    const wrappedR14Cue = function(){
      coachCancelSpeech();
      return oldR14Cue.apply(this, arguments);
    };
    wrappedR14Cue.__coachInterruptWrapped = true;
    window.ruut14Final.cue = wrappedR14Cue;
  }

  // Any user-driven action should stop current speech before moving to the next prompt.
  function wrapCancelFirst(fnName){
    const fn = window[fnName];
    if(typeof fn !== "function" || fn.__coachCancelFirstWrapped) return;
    const wrapped = function(){
      coachCancelSpeech();
      return fn.apply(this, arguments);
    };
    wrapped.__coachCancelFirstWrapped = true;
    window[fnName] = wrapped;
    try{ eval(fnName + " = window[fnName]"); }catch(e){}
  }

  [
    "skipCurrent",
    "togglePause",
    "showScreen",
    "hideModal",
    "ruut155NextExercise",
    "ruut155PrevExercise",
    "ruut155CancelLift",
    "ruut155FinishLift",
    "ruut155StartLift",
    "startWorkout"
  ].forEach(wrapCancelFirst);

  // Recovery functions have had different names across versions. Wrap any global function that looks like a recovery nav action.
  Object.keys(window).forEach(k=>{
    if(!/recover|recovery|mobility|stretch/i.test(k)) return;
    if(!/(next|prev|previous|skip|start|finish|close|cancel|movement|step)/i.test(k)) return;
    if(typeof window[k] === "function") wrapCancelFirst(k);
  });

  // Capture clicks on common Next/Previous/Skip/Done/Start buttons before their onclick handlers run.
  if(!window.__coachAudioClickCapture151){
    window.__coachAudioClickCapture151 = true;
    document.addEventListener("click", function(e){
      const target = e.target?.closest?.("button,[role='button']");
      if(!target) return;
      const text = String(target.textContent || target.getAttribute("aria-label") || "").trim();
      const onclick = String(target.getAttribute("onclick") || "");
      if(/next|previous|prev|skip|pause|done|close|cancel|start|finish|complete/i.test(text + " " + onclick)){
        coachCancelSpeech();
      }
    }, true);
  }

  function ex(name, sets, reps, instruction, safety, weight){
    return {name, sets, reps, instruction, safety, weight: weight || "", defaultWeight: weight || ""};
  }

  function nativeStrengthTemplates(){
    return [
      {id:"upperA", name:"Upper A", focus:"Chest Emphasis", schedule:"Monday", notes:"Heavy pressing, balanced pulling, shoulders, arms.", exercises:[
        ex("Barbell Bench Press",4,"6-8","Keep shoulder blades pulled back, lower under control, press without bouncing.","Use a spotter or safety arms when lifting heavy."),
        ex("Incline Dumbbell Press",3,"8-10","Press from a slight incline. Keep elbows controlled and avoid flaring hard.","Stop if shoulders feel sharp."),
        ex("Pull-Ups or Lat Pulldown",4,"8-12","Pull elbows down toward the ribs. Keep the chest tall and avoid swinging.","Use a controlled full range of motion."),
        ex("Seated Cable Row",3,"10","Pull to the lower ribs, pause briefly, and control the return.","Do not yank with the low back."),
        ex("Dumbbell Shoulder Press",3,"8-10","Brace your core, press overhead smoothly, and avoid leaning back.","Use a neutral grip if shoulders prefer it."),
        ex("Dumbbell Lateral Raises",3,"12-15","Raise to shoulder height with soft elbows. Lead with the elbows, not the hands.","Use light weight and strict control."),
        ex("Rope Tricep Pushdowns",3,"12","Keep elbows pinned. Extend fully and control the return.","Avoid shoulder movement."),
        ex("EZ-Bar Curls",3,"10-12","Keep elbows quiet, curl under control, and lower slowly.","Do not swing the weight.")
      ]},
      {id:"lowerCore", name:"Lower + Core", focus:"Legs and Trunk", schedule:"Wednesday", notes:"Lower-body strength, durability, and core control.", exercises:[
        ex("Barbell Squats",4,"6-8","Brace, sit between the hips, keep knees tracking with toes, and drive up strong.","Use safety arms and stop if back or knees feel sharp."),
        ex("Romanian Deadlifts",3,"8-10","Hinge at the hips, keep a neutral back, and feel hamstrings load.","The bar stays close. Do not round the low back."),
        ex("Walking Lunges",3,"10 each leg","Step with control, keep torso tall, and push through the front foot.","Shorten stride if knees complain."),
        ex("Leg Curl",3,"12","Curl smoothly, pause, and control the return.","Do not throw the weight."),
        ex("Standing Calf Raises",4,"15","Rise fully, pause at the top, and lower under control.","Use full range."),
        ex("Hanging Knee Raises",3,"15","Tilt pelvis slightly, lift knees under control, and avoid swinging.","Use captain chair if grip limits you."),
        ex("Cable Crunches",3,"15","Curl ribs toward hips. Keep hips quiet and control the return.","Do not pull with arms."),
        ex("Plank",3,"60 sec","Brace abs, squeeze glutes, keep ribs down and body straight.","Stop before form collapses."),
        ex("Side Plank",3,"30 sec each side","Stack shoulders and hips. Keep body long and controlled.","Drop to knees if needed.")
      ]},
      {id:"upperB", name:"Upper B", focus:"Shoulders and Arms", schedule:"Friday", notes:"Upper-body volume with shoulders and arms emphasis.", exercises:[
        ex("Incline Barbell Bench",4,"6-8","Press from a steady base, control the descent, and keep shoulders packed.","Use a spotter or safety arms."),
        ex("Weighted Dips or Chest Machine Press",3,"8-12","Lean slightly forward for chest. Keep shoulders down and reps controlled.","Use machine press if dips bother shoulders."),
        ex("Chest-Supported Row",4,"8-10","Keep chest on pad and pull elbows back without shrugging.","No momentum."),
        ex("Pull-Ups or Lat Pulldown",3,"10","Pull elbows down and keep the rib cage controlled.","No swinging."),
        ex("Dumbbell Lateral Raises",4,"15","Move smoothly to shoulder height. Control every rep.","Light and strict beats heavy and sloppy."),
        ex("Rear Delt Flyes",3,"15","Reach wide and slightly back. Keep traps relaxed.","Do not jerk the weight."),
        ex("Barbell Curls",4,"10","Keep elbows near the sides and lower slowly.","No hip drive."),
        ex("Hammer Curls",3,"12","Keep wrists neutral and curl with control.","Avoid swinging."),
        ex("Skull Crushers",4,"10","Keep upper arms steady and lower the weight under control.","Use EZ-bar or dumbbells if elbows prefer it.")
      ]},
      {id:"fullBody", name:"Full Body", focus:"General Strength", schedule:"Optional", notes:"Balanced session for weeks when you need one complete gym workout.", exercises:[
        ex("Goblet Squat",3,"10-12","Hold the weight close, sit between the hips, and stand tall.","Keep back neutral."),
        ex("Dumbbell Bench Press",3,"8-10","Shoulders packed, lower under control, and press smoothly.","Avoid shoulder pain."),
        ex("Lat Pulldown",3,"10-12","Pull elbows down, chest tall, and control the return.","No swinging."),
        ex("Romanian Deadlift",3,"8-10","Hinge with neutral spine and feel hamstrings load.","Do not round back."),
        ex("Dumbbell Shoulder Press",3,"8-10","Brace and press overhead without leaning back.","Use controlled range."),
        ex("Farmer Carry",3,"40 yards","Stand tall, ribs down, and walk with steady control.","Do not lean side to side.")
      ]}
    ];
  }

  function upperBody30Template(){
    return {
      id:"upperBody30ChestShoulders",
      name:"30-min Upper Body",
      focus:"Chest/Shoulders",
      schedule:"Custom",
      notes:"Dumbbell-focused upper-body session. Chest, shoulders, and arms.",
      exercises:[
        ex("Dumbbell Bench Press",3,"10","Lie flat on a bench with a dumbbell in each hand. Hold dumbbells at chest level with palms forward. Plant feet firmly. Press upward until arms are nearly straight. Lower under control until elbows are slightly below bench level. Key cues: shoulder blades pulled back and down, slight natural low-back arch, wrists over elbows, controlled lift and lower.","Do not bounce the weights. Avoid flaring elbows straight out; aim for 45 to 60 degrees. Use a spotter or lighter weight if unfamiliar. Stop for shoulder pain.",60),
        ex("Dumbbell Chest Fly",3,"10","Lie on a flat bench holding dumbbells above your chest. Keep a slight elbow bend. Open your arms wide in an arc until you feel a chest stretch. Squeeze chest to bring dumbbells back together. Key cues: hug a tree, keep elbow bend constant, move slowly.","Use lighter weights than bench press. Do not lower excessively deep. Avoid turning it into a press. Reduce range of motion for shoulder issues.",40),
        ex("Dumbbell Hammer Curl",3,"10","Stand tall holding dumbbells at your sides. Keep palms facing each other. Curl dumbbells toward shoulders. Lower slowly. Key cues: elbows pinned, stand tall, move only at the elbow joint.","Avoid swinging. Do not use your back for momentum. Control the lowering phase. Choose a strict-form weight.",40),
        ex("Dumbbell Shoulder Press",3,"10","Sit with back support or stand with feet shoulder-width apart. Hold dumbbells at shoulder level. Press upward until arms are nearly straight overhead. Lower under control. Key cues: tight core, press slightly inward as dumbbells rise, neutral spine.","Avoid excessive lower-back arch. Keep movement controlled. Do not lock out forcefully. Reduce weight if shoulders hurt.",35),
        ex("Front Raise Dumbbell",3,"10","Stand with dumbbells in front of your thighs. Keep a slight elbow bend. Raise forward to shoulder height. Lower slowly. Key cues: lift with shoulders, keep torso still, raise only to shoulder height.","Avoid swinging. Do not raise above shoulder level. Use moderate weight. Stop for pinching in front of shoulder.",15),
        ex("Lateral Raise Dumbbell",3,"10","Stand holding dumbbells at your sides. Slightly bend elbows. Raise arms out to sides until shoulder height. Lower slowly. Key cues: lead with elbows, keep shoulders down, slight forward lean if comfortable.","Use lighter weights than expected. Avoid shrugging. Do not swing. Stop at shoulder height to reduce stress.",15)
      ]
    };
  }

  function restoreStrengthTemplates(){
    state.strengthTemplates = Array.isArray(state.strengthTemplates) ? state.strengthTemplates : [];
    const byId = {};
    state.strengthTemplates.forEach(t => { if(t && t.id) byId[t.id] = t; });

    nativeStrengthTemplates().forEach(native => {
      if(!byId[native.id] || !Array.isArray(byId[native.id].exercises) || !byId[native.id].exercises.length){
        byId[native.id] = native;
      }
    });

    const upper = upperBody30Template();
    if(!byId[upper.id]){
      byId[upper.id] = upper;
    }else{
      byId[upper.id] = {...upper, ...byId[upper.id], exercises: Array.isArray(byId[upper.id].exercises) && byId[upper.id].exercises.length ? byId[upper.id].exercises : upper.exercises};
    }

    const order = ["upperA","lowerCore","upperB","fullBody","upperBody30ChestShoulders"];
    const ordered = order.map(id => byId[id]).filter(Boolean);
    const extras = Object.values(byId).filter(t => !order.includes(t.id));
    state.strengthTemplates = [...ordered, ...extras];

    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(e){}
  }

  restoreStrengthTemplates();

  const oldRenderStrength151 = window.renderStrength;
  window.renderStrength = renderStrength = function(){
    restoreStrengthTemplates();
    if(window.ruut14Final && typeof window.ruut14Final.renderStrength === "function"){
      return window.ruut14Final.renderStrength();
    }
    if(typeof oldRenderStrength151 === "function") return oldRenderStrength151();
  };

  if(window.ruut14Final && typeof window.ruut14Final.renderStrength === "function"){
    const oldR14RenderStrength151 = window.ruut14Final.renderStrength;
    window.ruut14Final.renderStrength = function(){
      restoreStrengthTemplates();
      return oldR14RenderStrength151();
    };
  }

  try{
    if(document.getElementById("strength")?.classList.contains("active")) renderStrength();
  }catch(e){}
})();


// ---------- COACH V16.2 PERFORMANCE SYSTEM ----------
(function(){
  /*
    Adds:
    - Exercise Library
    - Custom exercises and favorites
    - Personal records and previous-workout comparison
    - Suggested next weight/reps
    - Strength volume tracking
    - Muscle group tracking
    - Goal intelligence from local data
    - Progress notes
    This is a functional feature layer, not a full architecture refactor.
  */

  function esc(v){return String(v ?? "").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));}
  function todayISO(){const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10);}
  function shortDate(){try{return new Date().toLocaleDateString();}catch(e){return todayISO();}}
  function num(v){const n=Number(v);return Number.isFinite(n)?n:0;}

  const COACH_NATIVE_LIBRARY_162 = [
    ["Barbell Bench Press","Chest","Barbell","Keep shoulder blades pulled back, lower under control, press without bouncing.","Use safety arms or a spotter when heavy."],
    ["Dumbbell Bench Press","Chest","Dumbbells","Lie flat, brace, press dumbbells from chest to nearly straight arms, then lower under control.","Stop for shoulder pain. Do not bounce."],
    ["Incline Dumbbell Press","Chest","Dumbbells","Press from a slight incline. Keep elbows controlled and shoulders packed.","Avoid excessive elbow flare."],
    ["Dumbbell Chest Fly","Chest","Dumbbells","Use a soft elbow bend and move in an arc like hugging a tree.","Use lighter weights and avoid excessive depth."],
    ["Pull-Ups or Lat Pulldown","Back","Bodyweight/Cable","Pull elbows down toward ribs. Keep chest tall and control the return.","Avoid swinging or yanking."],
    ["Seated Cable Row","Back","Cable","Pull to lower ribs, pause, and control the return.","Do not jerk with the low back."],
    ["Chest-Supported Row","Back","Machine/Dumbbells","Keep chest on the pad and pull elbows back without shrugging.","No momentum."],
    ["Barbell Squats","Legs","Barbell","Brace, sit between the hips, knees track with toes, and drive up strong.","Use safety arms and stop sharp pain."],
    ["Romanian Deadlifts","Hamstrings","Barbell/Dumbbells","Hinge at hips, keep neutral back, and load hamstrings.","Do not round low back."],
    ["Walking Lunges","Legs","Bodyweight/Dumbbells","Step with control, torso tall, push through front foot.","Shorten stride if knees complain."],
    ["Dumbbell Shoulder Press","Shoulders","Dumbbells","Brace, press overhead smoothly, and avoid leaning back.","Reduce weight for shoulder discomfort."],
    ["Front Raise Dumbbell","Shoulders","Dumbbells","Raise dumbbells forward to shoulder height with torso still.","Do not swing or raise above shoulder height."],
    ["Dumbbell Lateral Raises","Shoulders","Dumbbells","Lead with elbows to shoulder height. Keep shoulders down.","Use lighter weight and strict control."],
    ["Rear Delt Flyes","Rear Delts","Dumbbells/Machine","Reach wide and slightly back. Keep traps relaxed.","Avoid jerking."],
    ["EZ-Bar Curls","Biceps","EZ-Bar","Keep elbows quiet, curl under control, and lower slowly.","Do not swing."],
    ["Dumbbell Hammer Curl","Biceps","Dumbbells","Palms face each other. Curl toward shoulders and lower slowly.","Do not lean back or use momentum."],
    ["Rope Tricep Pushdowns","Triceps","Cable","Keep elbows pinned and extend fully.","Avoid shoulder movement."],
    ["Skull Crushers","Triceps","EZ-Bar/Dumbbells","Keep upper arms steady and lower under control.","Use elbow-friendly range."],
    ["Plank","Core","Bodyweight","Brace abs, squeeze glutes, ribs down, body straight.","Stop before form collapses."],
    ["Farmer Carry","Grip/Core","Dumbbells","Stand tall, ribs down, walk with steady control.","Do not lean side to side."]
  ];

  function ensure162(){
    state.exerciseLibraryV162 = Array.isArray(state.exerciseLibraryV162) ? state.exerciseLibraryV162 : [];
    state.exerciseFavoritesV162 = Array.isArray(state.exerciseFavoritesV162) ? state.exerciseFavoritesV162 : [];
    state.progressNotesV162 = Array.isArray(state.progressNotesV162) ? state.progressNotesV162 : [];
    state.liftSessions = Array.isArray(state.liftSessions) ? state.liftSessions : [];
    state.weightLogV16 = Array.isArray(state.weightLogV16) ? state.weightLogV16 : [];
    const names = new Set(state.exerciseLibraryV162.map(e=>String(e.name||"").toLowerCase()));
    COACH_NATIVE_LIBRARY_162.forEach(row=>{
      if(!names.has(row[0].toLowerCase())){
        state.exerciseLibraryV162.push({name:row[0],muscle:row[1],equipment:row[2],instruction:row[3],safety:row[4],native:true});
      }
    });
    try{localStorage.setItem(STORAGE_KEY, JSON.stringify(state));}catch(e){}
  }

  function allExercises162(){
    ensure162();
    const map = new Map();
    state.exerciseLibraryV162.forEach(e=>{if(e?.name)map.set(e.name.toLowerCase(), e);});
    (state.strengthTemplates||[]).forEach(t=>(t.exercises||[]).forEach(e=>{
      if(e?.name && !map.has(e.name.toLowerCase())){
        map.set(e.name.toLowerCase(), {name:e.name,muscle:muscleFor162(e.name),equipment:"Template",instruction:e.instruction||"Move with control and clean form.",safety:e.safety||"",native:false});
      }
    }));
    return [...map.values()].sort((a,b)=>String(a.name).localeCompare(String(b.name)));
  }

  function muscleFor162(name){
    const n=String(name||"").toLowerCase();
    if(/bench|press|fly|dip|chest/.test(n) && !/shoulder/.test(n)) return "Chest";
    if(/row|pulldown|pull-up|pullup|lat/.test(n)) return "Back";
    if(/squat|lunge|leg|calf/.test(n)) return "Legs";
    if(/deadlift|romanian|hamstring|curl/.test(n) && !/barbell curl|hammer|ez/.test(n)) return "Hamstrings";
    if(/shoulder|lateral|front raise|rear delt/.test(n)) return "Shoulders";
    if(/curl|bicep|hammer/.test(n)) return "Biceps";
    if(/tricep|skull/.test(n)) return "Triceps";
    if(/plank|crunch|knee raise|core/.test(n)) return "Core";
    if(/carry|farmer/.test(n)) return "Grip/Core";
    return "General";
  }

  function exerciseSets162(name){
    const sets=[];
    const key=String(name||"").toLowerCase();
    (state.liftSessions||[]).forEach(s=>{
      (s.exercises||[]).forEach(e=>{
        if(String(e.name||"").toLowerCase()===key){
          (e.sets||[]).forEach(set=>sets.push({...set, exercise:e.name, session:s, iso:s.iso||set.iso||""}));
        }
      });
    });
    return sets.sort((a,b)=>String(b.iso||"").localeCompare(String(a.iso||"")));
  }

  function bestSet162(name){
    const sets=exerciseSets162(name);
    if(!sets.length) return null;
    return sets.slice().sort((a,b)=>(num(b.weight)*num(b.reps))-(num(a.weight)*num(a.reps)))[0];
  }

  function e1rm162(set){
    if(!set) return 0;
    return Math.round(num(set.weight)*(1+(num(set.reps)/30)));
  }

  function lastSessionExercise162(name){
    const key=String(name||"").toLowerCase();
    const rows=[];
    (state.liftSessions||[]).forEach(s=>{
      (s.exercises||[]).forEach(e=>{
        if(String(e.name||"").toLowerCase()===key && (e.sets||[]).length) rows.push({session:s,exercise:e});
      });
    });
    return rows.sort((a,b)=>String(b.session.iso||"").localeCompare(String(a.session.iso||"")))[0] || null;
  }

  function parseHighRep162(reps){
    const m=String(reps||"").match(/(\d+)(?!.*\d)/);
    return m ? Number(m[1]) : 10;
  }

  function suggestion162(name,targetReps){
    const last=lastSessionExercise162(name);
    if(!last) return "Log this exercise once to unlock a next-target suggestion.";
    const sets=last.exercise.sets||[];
    if(!sets.length) return "Log this exercise once to unlock a next-target suggestion.";
    const best=sets.slice().sort((a,b)=>(num(b.weight)*num(b.reps))-(num(a.weight)*num(a.reps)))[0];
    const high=parseHighRep162(targetReps);
    if(num(best.reps)>=high) return `Next target: ${num(best.weight)+5} x ${Math.max(6, high-2)} or ${num(best.weight)} x ${num(best.reps)+1}.`;
    return `Next target: ${num(best.weight)} x ${num(best.reps)+1}.`;
  }

  function strengthVolume162(){
    let total=0;
    const byMuscle={};
    (state.liftSessions||[]).forEach(s=>{
      (s.exercises||[]).forEach(e=>{
        const muscle=muscleFor162(e.name);
        (e.sets||[]).forEach(set=>{
          const vol=num(set.weight)*num(set.reps);
          total+=vol;
          byMuscle[muscle]=(byMuscle[muscle]||0)+vol;
        });
      });
    });
    return {total,byMuscle};
  }

  function recentPRs162(limit=5){
    const bestBy={};
    allExercises162().forEach(e=>{
      const best=bestSet162(e.name);
      if(best) bestBy[e.name]={name:e.name,best,e1rm:e1rm162(best),volume:num(best.weight)*num(best.reps)};
    });
    return Object.values(bestBy).sort((a,b)=>b.e1rm-a.e1rm).slice(0,limit);
  }

  function goalIntelligence162(){
    const debriefs=(state.workoutDebriefs||[]).slice(-6);
    const hard=debriefs.filter(d=>/hard|max|heavy|sore/i.test(`${d.feel} ${d.issue} ${d.note}`)).length;
    const pain=debriefs.filter(d=>/pain|sharp|injury/i.test(`${d.feel} ${d.issue} ${d.note}`)).length;
    const lifts=(state.liftSessions||[]).slice(-4).length;
    const completed=(state.completed||[]).slice(-7).length;
    if(pain>0) return {status:"Reduce Load",line:"Recent pain flags exist. Prioritize recovery and avoid aggressive progression."};
    if(hard>=3) return {status:"Hold",line:"Recent debriefs show stress. Hold progression until recovery catches up."};
    if(lifts>=2 && completed>=3) return {status:"Proceed",line:"Training rhythm looks solid. Continue the selected goal schedule."};
    if(completed<2) return {status:"Rebuild Rhythm",line:"Consistency is the priority. Complete the next planned session before adding load."};
    return {status:"Build Data",line:"COACH is collecting enough training history to make stronger recommendations."};
  }

  window.coach162OpenExerciseDetail = function(name){
    ensure162();
    const ex=allExercises162().find(e=>String(e.name).toLowerCase()===String(name).toLowerCase());
    if(!ex) return;
    const best=bestSet162(ex.name);
    const last=lastSessionExercise162(ex.name);
    showModal(`<div class="v1531-modal-head"><div class="v15-kicker">Exercise Library</div><h2>${esc(ex.name)}</h2><p>${esc(ex.muscle||"General")} · ${esc(ex.equipment||"")}</p></div>
      <section class="coach162-card"><div class="coach162-pr-badge">How To</div><p style="margin-top:8px">${esc(ex.instruction||"Move with control and clean form.")}</p></section>
      <section class="coach162-card"><div class="coach162-pr-badge">Safety</div><p style="margin-top:8px">${esc(ex.safety||"Stop sharp pain and use strict form.")}</p></section>
      <div class="coach162-grid">
        <section class="coach162-card"><div class="coach162-pr-badge">Best Set</div><h3>${best?`${esc(best.weight)} x ${esc(best.reps)}`:"None yet"}</h3><p>${best?`Estimated 1RM: ${e1rm162(best)}`:"Log this exercise to start history."}</p></section>
        <section class="coach162-card"><div class="coach162-pr-badge">Last Time</div><h3>${last?(last.exercise.sets||[]).map(s=>`${s.weight}x${s.reps}`).join(", "):"None yet"}</h3><p>${suggestion162(ex.name)}</p></section>
      </div>
      <div class="coach162-actions"><button class="v1531-button-primary" onclick="coach162ToggleFavorite('${esc(ex.name)}')">${(state.exerciseFavoritesV162||[]).includes(ex.name)?"Unfavorite":"Favorite"}</button><button class="v1531-button-secondary" onclick="hideModal();coach162OpenExerciseLibrary()">Back</button></div>`);
  };

  window.coach162ToggleFavorite = function(name){
    ensure162();
    const set=new Set(state.exerciseFavoritesV162||[]);
    if(set.has(name)) set.delete(name); else set.add(name);
    state.exerciseFavoritesV162=[...set];
    try{localStorage.setItem(STORAGE_KEY, JSON.stringify(state));}catch(e){}
    coach162OpenExerciseDetail(name);
  };

  window.coach162OpenExerciseLibrary = function(){
    ensure162();
    const fav=new Set(state.exerciseFavoritesV162||[]);
    const rows=allExercises162();
    showModal(`<div class="v1531-modal-head"><div class="v15-kicker">Exercise Library</div><h2>Movement Coach</h2><p>Instructions, cues, safety notes, personal records, and next targets.</p></div>
      <div class="coach162-actions"><button class="v1531-button-primary" onclick="hideModal();coach162OpenCustomExercise()">Add Custom Exercise</button><button class="v1531-button-secondary" onclick="hideModal()">Close</button></div>
      <div class="coach162-list">${rows.map(e=>`<div class="coach162-row" onclick="coach162OpenExerciseDetail('${esc(e.name)}')"><div><strong>${fav.has(e.name)?"★ ":""}${esc(e.name)}</strong><p>${esc(e.muscle||"General")} · ${esc(e.equipment||"")}</p></div><span>Open</span></div>`).join("")}</div>`);
  };

  window.coach162OpenCustomExercise = function(){
    showModal(`<div class="v1531-modal-head"><div class="v15-kicker">Custom Exercise</div><h2>Add Movement</h2><p>Create an exercise for your library.</p></div>
      <label class="small muted">Name</label><input class="coach162-input" id="coach162ExName" placeholder="Exercise name">
      <div style="height:8px"></div><label class="small muted">Muscle Group</label><input class="coach162-input" id="coach162ExMuscle" placeholder="Chest, Back, Legs, Shoulders...">
      <div style="height:8px"></div><label class="small muted">Equipment</label><input class="coach162-input" id="coach162ExEquip" placeholder="Dumbbells, Barbell, Cable...">
      <div style="height:8px"></div><label class="small muted">Instructions</label><textarea class="coach162-input" id="coach162ExInstruction" rows="4" placeholder="How to perform the movement"></textarea>
      <div style="height:8px"></div><label class="small muted">Safety Notes</label><textarea class="coach162-input" id="coach162ExSafety" rows="3" placeholder="Common mistakes or warnings"></textarea>
      <div class="coach162-actions"><button class="v1531-button-primary" onclick="coach162SaveCustomExercise()">Save</button><button class="v1531-button-secondary" onclick="hideModal();coach162OpenExerciseLibrary()">Cancel</button></div>`);
  };

  window.coach162SaveCustomExercise = function(){
    ensure162();
    const name=document.getElementById("coach162ExName")?.value?.trim();
    if(!name){alert("Enter an exercise name first.");return;}
    const item={
      name,
      muscle:document.getElementById("coach162ExMuscle")?.value?.trim()||muscleFor162(name),
      equipment:document.getElementById("coach162ExEquip")?.value?.trim()||"Custom",
      instruction:document.getElementById("coach162ExInstruction")?.value?.trim()||"Move with control and clean form.",
      safety:document.getElementById("coach162ExSafety")?.value?.trim()||"Stop sharp pain and use strict form.",
      native:false,
      custom:true
    };
    state.exerciseLibraryV162=(state.exerciseLibraryV162||[]).filter(e=>String(e.name).toLowerCase()!==name.toLowerCase());
    state.exerciseLibraryV162.push(item);
    try{localStorage.setItem(STORAGE_KEY, JSON.stringify(state));}catch(e){}
    hideModal(); coach162OpenExerciseDetail(name);
  };

  window.coach162OpenProgressNote = function(){
    showModal(`<div class="v1531-modal-head"><div class="v15-kicker">Progress Note</div><h2>Log a Note</h2><p>Use this for body composition, energy, soreness, mindset, or training observations.</p></div>
      <textarea class="coach162-input" id="coach162ProgressNote" rows="5" placeholder="What changed? What did you notice?"></textarea>
      <div class="coach162-actions"><button class="v1531-button-primary" onclick="coach162SaveProgressNote()">Save Note</button><button class="v1531-button-secondary" onclick="hideModal()">Cancel</button></div>`);
  };

  window.coach162SaveProgressNote = function(){
    const note=document.getElementById("coach162ProgressNote")?.value?.trim();
    if(!note){alert("Enter a note first.");return;}
    state.progressNotesV162=state.progressNotesV162||[];
    state.progressNotesV162.push({iso:new Date().toISOString(),date:shortDate(),note});
    try{localStorage.setItem(STORAGE_KEY, JSON.stringify(state));}catch(e){}
    hideModal();
    try{renderDashboard();}catch(e){}
  };

  function performancePanel162(){
    ensure162();
    const vol=strengthVolume162();
    const prs=recentPRs162(5);
    const intel=goalIntelligence162();
    const maxVol=Math.max(1,...Object.values(vol.byMuscle));
    const notes=(state.progressNotesV162||[]).slice(-3).reverse();
    return `<section id="coach162Performance" class="v15-panel">
      <div class="v15-kicker">Performance System</div>
      <h3>Strength + Goal Intelligence</h3>
      <div class="coach162-grid">
        <div class="coach162-card"><div class="coach162-pr-badge">Recommendation</div><h3>${esc(intel.status)}</h3><p>${esc(intel.line)}</p></div>
        <div class="coach162-card"><div class="coach162-pr-badge">Strength Volume</div><h3>${Math.round(vol.total).toLocaleString()}</h3><p>Total logged weight x reps.</p></div>
      </div>
      <div class="coach162-actions">
        <button class="v1531-button-primary" onclick="coach162OpenExerciseLibrary()">Exercise Library</button>
        <button class="v1531-button-secondary" onclick="coach162OpenProgressNote()">Add Progress Note</button>
      </div>
      <div class="coach162-chiprow">${prs.length?prs.map(p=>`<span class="coach162-chip lime">${esc(p.name)} · ${esc(p.best.weight)}x${esc(p.best.reps)} · e1RM ${p.e1rm}</span>`).join(""):`<span class="coach162-chip">Log strength sets to unlock PRs.</span>`}</div>
      <div class="coach162-bars">${Object.entries(vol.byMuscle).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([m,v])=>`<div class="coach162-bar"><span>${esc(m)}</span><div><span style="width:${Math.max(8,Math.round((v/maxVol)*100))}%"></span></div><b>${Math.round(v)}</b></div>`).join("") || `<p class="v15-muted">No muscle-group volume yet.</p>`}</div>
      ${notes.length?`<div class="coach162-list">${notes.map(n=>`<div class="coach162-row"><div><strong>${esc(n.date)}</strong><p>${esc(n.note)}</p></div><span>Note</span></div>`).join("")}</div>`:""}
    </section>`;
  }

  const prevDashboard162 = window.renderDashboard;
  window.renderDashboard = renderDashboard = function(){
    if(typeof prevDashboard162 === "function") prevDashboard162();
    ensure162();
    const host=document.getElementById("dashboard");
    if(!host) return;
    document.getElementById("coach162Performance")?.remove();
    host.insertAdjacentHTML("afterbegin", performancePanel162());
  };

  const prevStrength162 = window.renderStrength;
  window.renderStrength = renderStrength = function(){
    ensure162();
    if(typeof prevStrength162 === "function") prevStrength162();
    const host=document.getElementById("strength");
    if(!host || document.getElementById("coach162StrengthTools")) return;
    if(!state.activeLiftSessionV155){
      host.insertAdjacentHTML("afterbegin", `<section id="coach162StrengthTools" class="v15-panel">
        <div class="v15-kicker">Strength v2</div>
        <h3>Exercise Library + Records</h3>
        <p class="v15-muted">Open movement instructions, view PRs, compare last workouts, and add custom exercises.</p>
        <div class="coach162-actions"><button class="v1531-button-primary" onclick="coach162OpenExerciseLibrary()">Exercise Library</button><button class="v1531-button-secondary" onclick="showScreen('dashboard')">View Progress</button></div>
      </section>`);
    }
  };

  if(window.ruut14Final && typeof window.ruut14Final.renderStrength === "function"){
    const old = window.ruut14Final.renderStrength;
    window.ruut14Final.renderStrength = function(){
      const result = old.apply(this, arguments);
      try{ window.renderStrength(); }catch(e){}
      return result;
    };
  }

  ensure162();
})();


// ---------- COACH V16.3 READINESS + PROGRESSION ENGINE ----------
(function(){
  function esc(v){return String(v ?? "").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));}
  function n(v){const x=Number(v);return Number.isFinite(x)?x:0;}
  function clamp(x,min=0,max=100){return Math.max(min,Math.min(max,x));}
  function daysAgo(iso){try{return (Date.now()-new Date(iso).getTime())/86400000;}catch(e){return 999;}}
  function recent(arr,days=14){return (arr||[]).filter(x=>daysAgo(x.iso||x.date||x.importedAt||new Date())<=days);}

  function weightTrend163(){
    const rows=(state.weightLogV16||[]).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date)));
    if(rows.length<2) return {label:"No trend",delta:0,score:50,line:"Log daily weight to build a trend."};
    const first=rows[0], last=rows[rows.length-1];
    const delta=n(last.weight)-n(first.weight);
    const goal=state.coachV16?.goal || "hybrid";
    let score=70;
    if(goal==="fatloss" && delta<0) score=85;
    else if(goal==="muscle" && delta<-3) score=48;
    else if(goal==="muscle" && delta>=0) score=78;
    else if(Math.abs(delta)<=3) score=75;
    return {label:`${delta>0?"+":""}${delta.toFixed(1)} lb`,delta,score,line:`Weight change since first entry: ${delta>0?"+":""}${delta.toFixed(1)} lb.`};
  }

  function debriefSignals163(){
    const rows=recent(state.workoutDebriefs||[],14);
    const text=rows.map(r=>`${r.feel||""} ${r.issue||""} ${r.note||""}`).join(" ").toLowerCase();
    const pain=(text.match(/pain|sharp|injury|hurt|worse/g)||[]).length;
    const hard=(text.match(/hard|max|heavy|sore|exhausted|tired|fatigue/g)||[]).length;
    let score=80 - pain*22 - hard*8;
    if(!rows.length) score=62;
    return {rows,pain,hard,score:clamp(score),line:rows.length?`${rows.length} recent debriefs, ${pain} pain flags, ${hard} fatigue flags.`:"No recent debriefs. Save debriefs for better recommendations."};
  }

  function completionSignals163(){
    const completed=state.completed||[];
    const total=completed.length;
    const recentCompleted=completed.slice(-7).length;
    let score=50 + Math.min(35,recentCompleted*5);
    if(total===0) score=45;
    return {total,recentCompleted,score:clamp(score),line:`${recentCompleted} recent completion records available.`};
  }

  function recoverySignals163(){
    const sessions=Array.isArray(state.recoverySessionLogV154)?state.recoverySessionLogV154:[];
    const count=recent(sessions,14).length + n(state.recoverySessions||0);
    let score=55 + Math.min(30,count*4);
    return {count,score:clamp(score),line:count?`${count} recovery signals logged.`:"No recovery sessions logged yet."};
  }

  function strengthSignals163(){
    const sessions=recent(state.liftSessions||[],21);
    let totalSets=0, volume=0;
    sessions.forEach(s=>(s.exercises||[]).forEach(e=>(e.sets||[]).forEach(set=>{totalSets++;volume+=n(set.weight)*n(set.reps);})));
    let score=50 + Math.min(30,totalSets*1.5);
    if(totalSets>45) score-=12;
    return {sessions,totalSets,volume,score:clamp(score),line:`${sessions.length} recent lift sessions, ${totalSets} sets, ${Math.round(volume).toLocaleString()} volume.`};
  }

  function runLoadSignals163(){
    const completed=state.completed||[];
    const recentCount=completed.slice(-7).length;
    let score=65;
    if(recentCount>=6) score=55;
    if(recentCount<=2) score=58;
    return {recentCount,score,line:`${recentCount} recent training completions counted for load.`};
  }

  function coachReadiness163(){
    const deb=debriefSignals163(), comp=completionSignals163(), rec=recoverySignals163(), str=strengthSignals163(), wt=weightTrend163(), load=runLoadSignals163();
    const recoveryScore=clamp(Math.round((deb.score*0.45)+(rec.score*0.30)+(load.score*0.25)));
    const loadScore=clamp(Math.round((str.score*0.45)+(comp.score*0.35)+(load.score*0.20)));
    const progressScore=clamp(Math.round((comp.score*0.35)+(str.score*0.35)+(wt.score*0.30)));
    let recommendation="Maintain", line="Stay on the current goal schedule and keep collecting data.";
    if(deb.pain>0){recommendation="Recovery Day Recommended";line="Pain flags are present. Prioritize recovery and avoid increasing load.";}
    else if(recoveryScore<55){recommendation="Reduce";line="Recovery signals are weak. Reduce intensity or volume today.";}
    else if(loadScore>82 && deb.hard>=2){recommendation="Hold";line="Training load is high and fatigue is showing. Hold progression.";}
    else if(progressScore>=76 && recoveryScore>=70){recommendation="Increase";line="Progress and recovery signals support a small controlled increase.";}
    else if(comp.recentCompleted<2){recommendation="Rebuild Rhythm";line="Consistency is the priority. Complete the next planned workout before progressing.";}
    const readiness=Math.round((recoveryScore*0.45)+(progressScore*0.30)+(100-Math.abs(loadScore-70))*0.25);
    return {recommendation,line,readiness:clamp(readiness),recoveryScore,loadScore,progressScore,signals:[deb.line,comp.line,rec.line,str.line,wt.line,load.line]};
  }

  window.coach163OpenReadinessDetail=function(){
    const r=coachReadiness163();
    showModal(`<div class="v1531-modal-head"><div class="v15-kicker">Readiness Engine</div><h2>${esc(r.recommendation)}</h2><p>${esc(r.line)}</p></div>
      <div class="coach163-score-grid">
        <div class="coach163-score"><span>Readiness</span><strong>${r.readiness}</strong><div class="coach163-meter"><span style="width:${r.readiness}%"></span></div></div>
        <div class="coach163-score"><span>Recovery</span><strong>${r.recoveryScore}</strong><div class="coach163-meter"><span style="width:${r.recoveryScore}%"></span></div></div>
        <div class="coach163-score"><span>Progress</span><strong>${r.progressScore}</strong><div class="coach163-meter"><span style="width:${r.progressScore}%"></span></div></div>
      </div>
      <div class="coach163-list">${r.signals.map(s=>`<div class="coach163-item"><strong>Signal</strong><p>${esc(s)}</p></div>`).join("")}</div>
      <div class="coach162-actions"><button class="v1531-button-primary" onclick="hideModal()">Done</button><button class="v1531-button-secondary" onclick="hideModal();coach162OpenProgressNote()">Add Note</button></div>`);
  };

  function readinessPanel163(){
    const r=coachReadiness163();
    return `<section id="coach163Readiness" class="coach163-status">
      <span class="coach163-pill">COACH Readiness</span>
      <h3>${esc(r.recommendation)}</h3>
      <p class="v15-muted">${esc(r.line)}</p>
      <div class="coach163-score-grid">
        <div class="coach163-score"><span>Readiness</span><strong>${r.readiness}</strong><div class="coach163-meter"><span style="width:${r.readiness}%"></span></div></div>
        <div class="coach163-score"><span>Recovery</span><strong>${r.recoveryScore}</strong><div class="coach163-meter"><span style="width:${r.recoveryScore}%"></span></div></div>
        <div class="coach163-score"><span>Load</span><strong>${r.loadScore}</strong><div class="coach163-meter"><span style="width:${r.loadScore}%"></span></div></div>
      </div>
      <div class="coach162-actions"><button class="v1531-button-primary" onclick="coach163OpenReadinessDetail()">View Reasoning</button><button class="v1531-button-secondary" onclick="coach162OpenProgressNote()">Add Note</button></div>
    </section>`;
  }

  const prevDashboard163=window.renderDashboard;
  window.renderDashboard=renderDashboard=function(){
    if(typeof prevDashboard163==="function") prevDashboard163();
    const host=document.getElementById("dashboard"); if(!host) return;
    document.getElementById("coach163Readiness")?.remove();
    host.insertAdjacentHTML("afterbegin", readinessPanel163());
  };

  const prevToday163=window.renderToday;
  window.renderToday=renderToday=function(){
    if(typeof prevToday163==="function") prevToday163();
    const host=document.getElementById("today"); if(!host) return;
    document.getElementById("coach163TodayReadiness")?.remove();
    host.insertAdjacentHTML("afterbegin", `<section id="coach163TodayReadiness">${readinessPanel163()}</section>`);
  };

  const prevRenderAll163=window.renderAll;
  window.renderAll=renderAll=function(){
    if(typeof prevRenderAll163==="function") prevRenderAll163();
    try{renderToday();renderDashboard();}catch(e){}
  };

  window.COACH_READINESS_VERSION="16.3";
})();


// ---------- COACH V16.3.1 FINAL RENDER CLEANUP ----------
(function(){
  /*
    Fix:
    The Readiness panel was being inserted after older renderers completed.
    Older delayed renderers could then repaint Today and remove the panel.
    This final layer renders Today / Goals / Stats as complete pages, with Readiness included directly.
  */

  const APP_NAME="COACH";
  const DAYS=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const GOALS={
    hybrid:{label:"Hybrid Athlete",phase:"Build",priority:"Balanced",load:"Standard",note:"Blend strength, endurance, and recovery. Build capacity without specializing too narrowly."},
    muscle:{label:"Build Muscle",phase:"Build",priority:"Strength",load:"Strength biased",note:"Prioritize progressive overload. Running supports the goal without stealing recovery from lifting."},
    fatloss:{label:"Lose Fat",phase:"Foundation",priority:"Consistency",load:"Sustainable",note:"Use repeatable strength, conditioning, and weight trend to drive fat loss without burning out."},
    endurance:{label:"13-Mile Endurance",phase:"Build",priority:"Running",load:"Endurance biased",note:"Running is the main driver. Strength supports durability and injury resistance."},
    general:{label:"General Fitness",phase:"Foundation",priority:"Balanced Health",load:"Moderate",note:"Build useful fitness, mobility, and consistency without chasing extremes."},
    maintain:{label:"Maintain Fitness",phase:"Maintain",priority:"Preservation",load:"Reduced",note:"Keep the rhythm, protect recovery, and maintain capacity."}
  };
  const WEEKLY={
    muscle:["Upper A","Support Cardio","Lower + Core","Recovery","Upper B","Conditioning","Recovery"],
    hybrid:["Upper A","Easy Run","Lower + Core","Intervals","Upper B","Long Run","Recovery"],
    fatloss:["Full Body","Zone 2 Cardio","Lower + Core","Conditioning","Upper B","Long Easy Cardio","Recovery"],
    endurance:["Easy Run","Runner Strength","Intervals / Hills","Recovery","Steady Run","Long Run","Recovery"],
    general:["Full Body","Easy Cardio","Mobility + Core","Full Body","Easy Run","Outdoor Session","Recovery"],
    maintain:["Full Body","Easy Cardio","Recovery","Full Body","Easy Run","Optional Activity","Recovery"]
  };

  function esc(v){return String(v ?? "").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));}
  function n(v){const x=Number(v);return Number.isFinite(x)?x:0;}
  function clamp(x,min=0,max=100){return Math.max(min,Math.min(max,x));}
  function ensure(){
    state.coachV16=state.coachV16||{};
    state.coachV16.goal=state.coachV16.goal||"hybrid";
    state.weightLogV16=Array.isArray(state.weightLogV16)?state.weightLogV16:[];
    state.liftSessions=Array.isArray(state.liftSessions)?state.liftSessions:[];
    state.workoutDebriefs=Array.isArray(state.workoutDebriefs)?state.workoutDebriefs:[];
  }
  function gid(){ensure();return GOALS[state.coachV16.goal]?state.coachV16.goal:"hybrid";}
  function goal(){return GOALS[gid()]||GOALS.hybrid;}
  function dindex(){return Math.max(1,Math.min(7,Number(state.dayIndex||1)));}
  function schedule(){return WEEKLY[gid()]||WEEKLY.hybrid;}
  function todayTitle(){return schedule()[dindex()-1]||"Recovery";}
  function typeFromTitle(t){if(/Upper|Lower|Full Body/.test(t))return"lift";if(/Recovery|Mobility|Optional/.test(t))return"rest";return"run";}
  function templateFromTitle(t){if(t==="Upper A")return"upperA";if(t==="Lower + Core")return"lowerCore";if(t==="Upper B")return"upperB";if(t==="Full Body")return"fullBody";return"";}
  function dateLabel(){try{return new Date().toLocaleDateString(undefined,{month:"numeric",day:"numeric",year:"2-digit"});}catch(e){return new Date().toISOString().slice(0,10);}}
  function completionPct(){try{return typeof progressPercent==="function"?progressPercent():Math.round(((state.completed||[]).length/84)*100);}catch(e){return 0;}}
  function latestWeight(){const w=(state.weightLogV16||[]).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date)));return w[w.length-1]||null;}
  function daysAgo(iso){try{return (Date.now()-new Date(iso).getTime())/86400000;}catch(e){return 999;}}
  function recent(arr,days=14){return (arr||[]).filter(x=>daysAgo(x.iso||x.date||new Date())<=days);}

  function activeWorkout(){
    const title=todayTitle(), type=typeFromTitle(title);
    if(type==="lift")return{type,title,templateId:templateFromTitle(title),structure:`${title} strength session`,purpose:"Build strength through progressive overload.",success:"Complete the planned lifts and save the session."};
    if(type==="rest")return{type,title,structure:"Recovery, mobility, stretching, walking, or full rest.",purpose:"Recover so training can continue.",success:"Finish feeling better."};
    return{type,title,structure:title,purpose:"Build conditioning in support of the selected goal.",success:"Finish controlled."};
  }

  function weightTrend(){
    const rows=(state.weightLogV16||[]).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date)));
    if(rows.length<2)return{score:50,line:"Log daily weight to build a trend."};
    const delta=n(rows[rows.length-1].weight)-n(rows[0].weight);
    let score=70;
    if(gid()==="fatloss"&&delta<0)score=85;
    if(gid()==="muscle"&&delta<-3)score=48;
    if(gid()==="muscle"&&delta>=0)score=78;
    return{score,line:`Weight change since first entry: ${delta>0?"+":""}${delta.toFixed(1)} lb.`};
  }
  function debriefSignals(){
    const rows=recent(state.workoutDebriefs||[],14);
    const text=rows.map(r=>`${r.feel||""} ${r.issue||""} ${r.note||""}`).join(" ").toLowerCase();
    const pain=(text.match(/pain|sharp|injury|hurt|worse/g)||[]).length;
    const hard=(text.match(/hard|max|heavy|sore|exhausted|tired|fatigue/g)||[]).length;
    const score=rows.length?clamp(80-pain*22-hard*8):62;
    return{rows,pain,hard,score,line:rows.length?`${rows.length} recent debriefs, ${pain} pain flags, ${hard} fatigue flags.`:"No recent debriefs. Save debriefs for better recommendations."};
  }
  function completionSignals(){
    const recentCompleted=(state.completed||[]).slice(-7).length;
    return{recentCompleted,score:clamp((state.completed||[]).length?50+Math.min(35,recentCompleted*5):45),line:`${recentCompleted} recent completion records available.`};
  }
  function recoverySignals(){
    const sessions=Array.isArray(state.recoverySessionLogV154)?state.recoverySessionLogV154:[];
    const count=recent(sessions,14).length+n(state.recoverySessions||0);
    return{count,score:clamp(55+Math.min(30,count*4)),line:count?`${count} recovery signals logged.`:"No recovery sessions logged yet."};
  }
  function strengthSignals(){
    const sessions=recent(state.liftSessions||[],21);
    let sets=0, volume=0;
    sessions.forEach(s=>(s.exercises||[]).forEach(e=>(e.sets||[]).forEach(set=>{sets++;volume+=n(set.weight)*n(set.reps);})));
    let score=50+Math.min(30,sets*1.5);
    if(sets>45)score-=12;
    return{sessions,sets,volume,score:clamp(score),line:`${sessions.length} recent lift sessions, ${sets} sets, ${Math.round(volume).toLocaleString()} volume.`};
  }
  function loadSignals(){
    const count=(state.completed||[]).slice(-7).length;
    let score=65;if(count>=6)score=55;if(count<=2)score=58;
    return{count,score,line:`${count} recent training completions counted for load.`};
  }
  function readiness(){
    const deb=debriefSignals(), comp=completionSignals(), rec=recoverySignals(), str=strengthSignals(), wt=weightTrend(), load=loadSignals();
    const recoveryScore=clamp(Math.round(deb.score*.45+rec.score*.30+load.score*.25));
    const loadScore=clamp(Math.round(str.score*.45+comp.score*.35+load.score*.20));
    const progressScore=clamp(Math.round(comp.score*.35+str.score*.35+wt.score*.30));
    let recommendation="Maintain", line="Stay on the current goal schedule and keep collecting data.";
    if(deb.pain>0){recommendation="Recovery Day Recommended";line="Pain flags are present. Prioritize recovery and avoid increasing load.";}
    else if(recoveryScore<55){recommendation="Reduce";line="Recovery signals are weak. Reduce intensity or volume today.";}
    else if(loadScore>82&&deb.hard>=2){recommendation="Hold";line="Training load is high and fatigue is showing. Hold progression.";}
    else if(progressScore>=76&&recoveryScore>=70){recommendation="Increase";line="Progress and recovery signals support a small controlled increase.";}
    else if(comp.recentCompleted<2){recommendation="Rebuild Rhythm";line="Consistency is the priority. Complete the next planned workout before progressing.";}
    const ready=clamp(Math.round(recoveryScore*.45+progressScore*.30+(100-Math.abs(loadScore-70))*.25));
    return{recommendation,line,readiness:ready,recoveryScore,loadScore,progressScore,signals:[deb.line,comp.line,rec.line,str.line,wt.line,load.line]};
  }

  function shell(){
    document.body.classList.add("coach-v16","coach-v1631-no-flicker");
    document.title="COACH";
    document.querySelectorAll(".v15-wordmark").forEach(e=>e.textContent="COACH");
    document.querySelectorAll(".v15-subbrand").forEach(e=>e.textContent="Train With Purpose.");
    document.querySelectorAll("header h1").forEach(e=>e.textContent="COACH");
    document.querySelectorAll(".logo").forEach(e=>e.textContent="C");
    document.querySelectorAll("nav button").forEach(btn=>{
      const span=btn.querySelector("span");
      const label=(span?span.textContent:btn.textContent).trim().toLowerCase();
      if(label==="plan"){if(span)span.textContent="Goals";else btn.textContent="Goals";}
    });
  }

  function readinessPanel(){
    const r=readiness();
    return `<section id="coach163Readiness" class="coach163-status">
      <span class="coach163-pill">COACH Readiness</span>
      <h3>${esc(r.recommendation)}</h3>
      <p class="v15-muted">${esc(r.line)}</p>
      <div class="coach163-score-grid">
        <div class="coach163-score"><span>Readiness</span><strong>${r.readiness}</strong><div class="coach163-meter"><span style="width:${r.readiness}%"></span></div></div>
        <div class="coach163-score"><span>Recovery</span><strong>${r.recoveryScore}</strong><div class="coach163-meter"><span style="width:${r.recoveryScore}%"></span></div></div>
        <div class="coach163-score"><span>Load</span><strong>${r.loadScore}</strong><div class="coach163-meter"><span style="width:${r.loadScore}%"></span></div></div>
      </div>
      <div class="coach162-actions"><button class="v1531-button-primary" onclick="coach163OpenReadinessDetail()">View Reasoning</button><button class="v1531-button-secondary" onclick="coach162OpenProgressNote()">Add Note</button></div>
    </section>`;
  }

  window.coach163OpenReadinessDetail=function(){
    const r=readiness();
    showModal(`<div class="v1531-modal-head"><div class="v15-kicker">Readiness Engine</div><h2>${esc(r.recommendation)}</h2><p>${esc(r.line)}</p></div>
      <div class="coach163-score-grid">
        <div class="coach163-score"><span>Readiness</span><strong>${r.readiness}</strong><div class="coach163-meter"><span style="width:${r.readiness}%"></span></div></div>
        <div class="coach163-score"><span>Recovery</span><strong>${r.recoveryScore}</strong><div class="coach163-meter"><span style="width:${r.recoveryScore}%"></span></div></div>
        <div class="coach163-score"><span>Progress</span><strong>${r.progressScore}</strong><div class="coach163-meter"><span style="width:${r.progressScore}%"></span></div></div>
      </div>
      <div class="coach163-list">${r.signals.map(s=>`<div class="coach163-item"><strong>Signal</strong><p>${esc(s)}</p></div>`).join("")}</div>
      <div class="coach162-actions"><button class="v1531-button-primary" onclick="hideModal()">Done</button><button class="v1531-button-secondary" onclick="hideModal();coach162OpenProgressNote()">Add Note</button></div>`);
  };

  function weekGrid(){
    return `<section class="coach-v161-week-card"><div class="v15-kicker">Goal-Based Week</div><h3>${esc(goal().label)} Schedule</h3><div class="coach-v161-week-grid">${schedule().map((name,i)=>`<div class="coach-v161-day ${i+1===dindex()?"active":""}"><b>${DAYS[i]}</b><span>${esc(name)}</span></div>`).join("")}</div></section>`;
  }

  function renderTodayFinal(){
    ensure();shell();
    const host=document.getElementById("today");if(!host)return;
    const g=goal(), w=activeWorkout(), wt=latestWeight();
    host.innerHTML=`${readinessPanel()}
      <section class="v15-today-hero coach-v16-hero">
        <div class="v15-hero-bg"></div><div class="v15-hero-shade"></div>
        <div class="v15-hero-content"><div><div class="coach-v16-badge">COACH · ${esc(g.label)}</div><div class="v15-meta-line">${dateLabel()} · Week ${state.week} · Day ${state.dayIndex} · ${esc(g.phase)}</div><h2 class="v15-hero-title">${esc(w.title)}</h2><div class="v15-hero-subtitle">${esc(w.structure)}</div></div><div class="v15-hero-bottom"><button class="v15-primary-action" onclick="coach161StartToday()">${w.type==="lift"?"Start Strength Log":"Start Guided Workout"}</button><button class="v15-round-action" onclick="window.openBriefingV110 ? window.openBriefingV110() : null">→</button></div></div>
      </section>
      <section class="coach-v16-goal-adjustment"><div class="coach-v16-badge">Goal-Aware Training</div><h3>${esc(g.label)} · ${esc(g.priority)}</h3><p class="v15-muted">${esc(g.note)}</p><div class="coach-v16-priority-row"><div><span>Today’s Bias</span><strong>${esc(g.priority)}</strong></div><div><span>Training Load</span><strong>${esc(g.load)}</strong></div></div></section>
      <section class="coach-v16-weight-card"><div><div class="v15-kicker">Body Weight</div><div class="coach-v16-weight-number">${wt?`${Number(wt.weight).toFixed(1)} lb`:"Not logged"}</div><p class="v15-muted">${wt?`Last entry: ${esc(wt.date)}`:"Add today's weight to start a trend."}</p></div><button class="v15-round-action" onclick="coachV16OpenWeight()">+</button></section>
      ${weekGrid()}
      <section class="v15-panel v15-coach-card"><div class="v15-kicker">Next Milestone</div><h3>${esc(w.success)}</h3><p class="v15-muted">${esc(w.purpose)}</p></section>`;
  }

  function renderGoalsFinal(){
    ensure();shell();
    const host=document.getElementById("plan");if(!host)return;const g=goal();
    host.innerHTML=`<section class="v15-screen-head"><div class="v15-kicker">Goals</div><h2>COACH Plan</h2><p class="v15-muted">Your selected goal controls the weekly structure and today’s mission.</p></section><section class="coach-v16-goal-hero"><div class="coach-v16-badge">Active Goal</div><h2>${esc(g.label)}</h2><p class="v15-muted">${esc(g.note)}</p><div class="v15-metric-grid" style="margin-top:14px"><div><span>Phase</span><strong>${esc(g.phase)}</strong></div><div><span>Progress</span><strong>${completionPct()}%</strong></div></div><div class="coach-v16-actions"><button class="v1531-button-primary" onclick="coachV16OpenGoalPicker()">Change Goal</button><button class="v1531-button-secondary" onclick="openSetPosition ? openSetPosition() : null">Set Week/Day</button></div></section>${weekGrid()}`;
  }

  function performanceSummary(){
    const liftCount=(state.liftSessions||[]).length;
    const completed=(state.completed||[]).length;
    const notes=(state.progressNotesV162||[]).slice(-3).reverse();
    return `<section class="v15-panel"><div class="v15-kicker">Performance System</div><h3>Training Data</h3><div class="v15-metric-grid"><div><span>Lift Sessions</span><strong>${liftCount}</strong></div><div><span>Completed</span><strong>${completed}</strong></div><div><span>Weight Entries</span><strong>${(state.weightLogV16||[]).length}</strong></div><div><span>Debriefs</span><strong>${(state.workoutDebriefs||[]).length}</strong></div></div><div class="coach162-actions"><button class="v1531-button-primary" onclick="coach162OpenExerciseLibrary()">Exercise Library</button><button class="v1531-button-secondary" onclick="coach162OpenProgressNote()">Add Progress Note</button></div>${notes.length?`<div class="coach162-list">${notes.map(n=>`<div class="coach162-row"><div><strong>${esc(n.date)}</strong><p>${esc(n.note)}</p></div><span>Note</span></div>`).join("")}</div>`:""}</section>`;
  }

  function renderStatsFinal(){
    ensure();shell();
    const host=document.getElementById("dashboard");if(!host)return;const g=goal(), wt=latestWeight();
    host.innerHTML=`${readinessPanel()}<section class="v15-screen-head"><div class="v15-kicker">Stats</div><h2>Progress</h2><p class="v15-muted">Training, strength, recovery, and body-weight trend.</p></section><section class="v15-panel"><div class="v15-kicker">COACH Overview</div><h3>${esc(g.label)}</h3><p class="v15-muted">${esc(g.note)}</p><div class="v15-metric-grid"><div><span>Priority</span><strong>${esc(g.priority)}</strong></div><div><span>Weight</span><strong>${wt?Number(wt.weight).toFixed(1):"—"}</strong></div><div><span>Program</span><strong>${completionPct()}%</strong></div><div><span>Completed</span><strong>${(state.completed||[]).length}</strong></div></div><div class="coach-v16-actions"><button class="v1531-button-primary" onclick="coachV16OpenWeight()">Add Weight</button><button class="v1531-button-secondary" onclick="coachV16OpenGoalPicker()">Change Goal</button></div></section>${performanceSummary()}${weekGrid()}`;
  }

  if(!window.__coachOriginalStartWorkout1631&&typeof window.startWorkout==="function") window.__coachOriginalStartWorkout1631=window.startWorkout;
  window.coach161StartToday=function(){
    const w=activeWorkout();
    if(w.type==="lift"){
      if(typeof window.ruut155StartLift==="function"){window.ruut155StartLift(w.templateId||"fullBody");return;}
      showScreen("strength");return;
    }
    return window.__coachOriginalStartWorkout1631();
  };

  const oldShow=window.showScreen;
  window.showScreen=showScreen=function(id,btn){
    shell();
    document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
    const screen=document.getElementById(id);if(screen)screen.classList.add("active");
    document.querySelectorAll("nav button").forEach(b=>b.classList.remove("active"));
    const navBtn=btn||document.querySelector(`nav button[data-target="${id}"]`);if(navBtn)navBtn.classList.add("active");
    if(id==="today")return renderTodayFinal();
    if(id==="plan")return renderGoalsFinal();
    if(id==="dashboard")return renderStatsFinal();
    if(typeof oldShow==="function")return oldShow(id,btn);
  };

  window.renderToday=renderToday=renderTodayFinal;
  window.renderPlan=renderPlan=renderGoalsFinal;
  window.renderDashboard=renderDashboard=renderStatsFinal;
  window.renderAll=renderAll=function(){
    shell();
    renderTodayFinal();
    renderGoalsFinal();
    renderStatsFinal();
    try{if(typeof renderWorkout==="function")renderWorkout();}catch(e){}
    try{if(typeof renderRecover==="function")renderRecover();}catch(e){}
    try{if(typeof renderStrength==="function")renderStrength();}catch(e){}
  };

  if(window.ruut14Final){
    window.ruut14Final.renderToday=renderTodayFinal;
    window.ruut14Final.renderPlan=renderGoalsFinal;
    window.ruut14Final.renderDashboard=renderStatsFinal;
    window.ruut14Final.renderAll=window.renderAll;
    window.ruut14Final.showScreen=window.showScreen;
  }

  shell();
  const active=document.querySelector(".screen.active")?.id||"today";
  if(active==="today")renderTodayFinal();
  if(active==="plan")renderGoalsFinal();
  if(active==="dashboard")renderStatsFinal();
  window.COACH_RENDER_CLEAN_VERSION="16.3.1";
})();


// ---------- COACH V16.5 DATA MODEL CLEANUP ----------
(function(){
  function ensureArray(name){
    if(!Array.isArray(state[name])) state[name] = [];
  }

  function cleanup(){
    state.coachV16 = state.coachV16 || {};

    ensureArray("weightLogV16");
    ensureArray("liftSessions");
    ensureArray("workoutDebriefs");
    ensureArray("exerciseLibraryV162");
    ensureArray("exerciseFavoritesV162");
    ensureArray("progressNotesV162");

    state.weightLogV16 = state.weightLogV16.filter(x => x && x.date);
    state.liftSessions = state.liftSessions.filter(Boolean);
    state.workoutDebriefs = state.workoutDebriefs.filter(Boolean);

    state.dataModelVersion = "16.5";

    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }catch(e){}
  }

  cleanup();
  window.COACH_DATA_MODEL_VERSION = "16.5";
})();


// ---------- COACH V17 TRAINING CALENDAR + PERIODIZATION ----------
(function(){
  const DAYS=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const GOAL_META={
    hybrid:{label:"Hybrid Athlete",block:"Hybrid Capacity Block",length:12,phases:[["Foundation","Weeks 1-3","Build movement rhythm and balanced training."],["Build","Weeks 4-8","Increase strength, running capacity, and weekly consistency."],["Peak","Weeks 9-11","Express capacity without overreaching."],["Deload","Week 12","Reduce load and consolidate progress."]]},
    muscle:{label:"Build Muscle",block:"Muscle Foundation Block",length:12,phases:[["Foundation","Weeks 1-3","Groove lifting technique and establish recoverable volume."],["Build","Weeks 4-8","Progressively overload primary lifts."],["Peak","Weeks 9-11","Push best sets while protecting joints."],["Deload","Week 12","Reduce volume and recover for the next block."]]},
    fatloss:{label:"Lose Fat",block:"Body Composition Block",length:12,phases:[["Consistency","Weeks 1-3","Build repeatable training and daily weight rhythm."],["Work Capacity","Weeks 4-8","Increase sustainable output."],["Acceleration","Weeks 9-11","Tighten consistency without reckless volume."],["Maintenance","Week 12","Hold progress and recover."]]},
    endurance:{label:"13-Mile Endurance",block:"Endurance Build Block",length:12,phases:[["Base","Weeks 1-3","Build easy running consistency."],["Build","Weeks 4-8","Increase long-run durability and aerobic capacity."],["Peak","Weeks 9-10","Sharpen endurance and confidence."],["Taper","Weeks 11-12","Reduce load and arrive fresh."]]},
    general:{label:"General Fitness",block:"General Fitness Block",length:8,phases:[["Foundation","Weeks 1-2","Build movement rhythm."],["Build","Weeks 3-6","Improve strength, cardio, and mobility."],["Consolidate","Week 7","Hold quality and reduce friction."],["Reset","Week 8","Recover and choose the next block."]]},
    maintain:{label:"Maintain Fitness",block:"Maintenance Block",length:8,phases:[["Baseline","Weeks 1-2","Keep basic rhythm."],["Maintain","Weeks 3-6","Preserve strength and conditioning."],["Refresh","Week 7","Add variety without chasing fatigue."],["Reset","Week 8","Recover and reassess."]]}
  };
  const WEEKLY={
    muscle:["Upper A","Support Cardio","Lower + Core","Recovery","Upper B","Conditioning","Recovery"],
    hybrid:["Upper A","Easy Run","Lower + Core","Intervals","Upper B","Long Run","Recovery"],
    fatloss:["Full Body","Zone 2 Cardio","Lower + Core","Conditioning","Upper B","Long Easy Cardio","Recovery"],
    endurance:["Easy Run","Runner Strength","Intervals / Hills","Recovery","Steady Run","Long Run","Recovery"],
    general:["Full Body","Easy Cardio","Mobility + Core","Full Body","Easy Run","Outdoor Session","Recovery"],
    maintain:["Full Body","Easy Cardio","Recovery","Full Body","Easy Run","Optional Activity","Recovery"]
  };
  function esc(v){return String(v ?? "").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));}
  function ensure17(){state.coachV16=state.coachV16||{};state.coachV16.goal=state.coachV16.goal||"hybrid";state.trainingBlockV17=state.trainingBlockV17||{};state.trainingBlockV17.started=state.trainingBlockV17.started||new Date().toISOString();state.trainingBlockV17.version="17.0";try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch(e){}}
  function gid(){ensure17();return GOAL_META[state.coachV16.goal]?state.coachV16.goal:"hybrid"}
  function meta(){return GOAL_META[gid()]||GOAL_META.hybrid}
  function dayIndex(){return Math.max(1,Math.min(7,Number(state.dayIndex||1)))}
  function weekNumber(){return Math.max(1,Number(state.week||1))}
  function phaseIndex(){const w=weekNumber(),m=meta();if(m.length===8){if(w<=2)return 0;if(w<=6)return 1;if(w===7)return 2;return 3}if(w<=3)return 0;if(w<=8)return 1;if(w<=11)return 2;return 3}
  function activePhase(){return meta().phases[phaseIndex()]||meta().phases[0]}
  function schedule(){return WEEKLY[gid()]||WEEKLY.hybrid}
  function todayTitle(){return schedule()[dayIndex()-1]||"Recovery"}
  function typeFromTitle(t){if(/Upper|Lower|Full Body/.test(t))return"lift";if(/Recovery|Mobility|Optional/.test(t))return"rest";return"run"}
  function templateFromTitle(t){if(t==="Upper A")return"upperA";if(t==="Lower + Core")return"lowerCore";if(t==="Upper B")return"upperB";if(t==="Full Body")return"fullBody";return""}
  function activeWorkout(){const title=todayTitle(),type=typeFromTitle(title),ph=activePhase();if(type==="lift")return{type,title,templateId:templateFromTitle(title),structure:`${title} · ${ph[0]} phase`,purpose:"Build strength within the current training block.",success:"Complete the planned lifts and save the session."};if(type==="rest")return{type,title,structure:`Recovery · ${ph[0]} phase`,purpose:"Recover so training can continue.",success:"Finish feeling better."};return{type,title,structure:`${title} · ${ph[0]} phase`,purpose:"Build conditioning in support of the selected goal.",success:"Finish controlled."}}
  function latestWeight(){const w=(state.weightLogV16||[]).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date)));return w[w.length-1]||null}
  function dateLabel(){try{return new Date().toLocaleDateString(undefined,{month:"numeric",day:"numeric",year:"2-digit"})}catch(e){return new Date().toISOString().slice(0,10)}}
  function completionPct(){try{return typeof progressPercent==="function"?progressPercent():Math.round(((state.completed||[]).length/84)*100)}catch(e){return 0}}
  function shell(){document.body.classList.add("coach-v16","coach-v17");document.title="COACH";document.querySelectorAll(".v15-wordmark").forEach(e=>e.textContent="COACH");document.querySelectorAll(".v15-subbrand").forEach(e=>e.textContent="Train With Purpose.");document.querySelectorAll("header h1").forEach(e=>e.textContent="COACH");document.querySelectorAll(".logo").forEach(e=>e.textContent="C");document.querySelectorAll("nav button").forEach(btn=>{const span=btn.querySelector("span");const label=(span?span.textContent:btn.textContent).trim().toLowerCase();if(label==="plan"){if(span)span.textContent="Goals";else btn.textContent="Goals"}})}
  function readinessPanel(){return `<section id="coach17ReadinessMount" class="coach163-status"><span class="coach163-pill">COACH Readiness</span><h3>Training Check</h3><p class="v15-muted">Use the readiness reasoning to decide whether to proceed, hold, reduce, or recover.</p><div class="coach162-actions"><button class="v1531-button-primary" onclick="coach163OpenReadinessDetail()">View Reasoning</button><button class="v1531-button-secondary" onclick="coach162OpenProgressNote()">Add Note</button></div></section>`}
  function phaseGrid(){const idx=phaseIndex();return `<div class="coach17-phase-grid">${meta().phases.map((p,i)=>`<div class="coach17-phase ${i===idx?"active":""}"><b>${esc(p[0])}</b><span>${esc(p[1])}</span></div>`).join("")}</div>`}
  function weekGrid(){return `<section class="coach-v161-week-card"><div class="v15-kicker">This Week</div><h3>${esc(meta().label)} Schedule</h3><div class="coach17-calendar">${schedule().map((name,i)=>`<div class="coach17-day ${i+1===dayIndex()?"active":""}"><b>${DAYS[i]}</b><span>${esc(name)}</span></div>`).join("")}</div></section>`}
  function blockCard(){const ph=activePhase();return `<section class="coach17-block-card"><div class="coach-v16-badge">Training Block</div><h3>${esc(meta().block)}</h3><p class="v15-muted">${esc(ph[0])}: ${esc(ph[2])}</p><div class="v15-metric-grid" style="margin-top:12px"><div><span>Block Week</span><strong>${weekNumber()}</strong></div><div><span>Phase</span><strong>${esc(ph[0])}</strong></div></div>${phaseGrid()}</section>`}
  function renderTodayV17(){ensure17();shell();const host=document.getElementById("today");if(!host)return;const g=meta(),w=activeWorkout(),wt=latestWeight(),ph=activePhase();host.innerHTML=`<section class="v15-today-hero coach-v16-hero"><div class="v15-hero-bg"></div><div class="v15-hero-shade"></div><div class="v15-hero-content"><div><div class="coach-v16-badge">COACH · ${esc(g.label)}</div><div class="v15-meta-line">${dateLabel()} · Week ${state.week} · Day ${state.dayIndex} · ${esc(ph[0])}</div><h2 class="v15-hero-title">${esc(w.title)}</h2><div class="v15-hero-subtitle">${esc(w.structure)}</div></div><div class="v15-hero-bottom"><button class="v15-primary-action" onclick="coach17StartToday()">${w.type==="lift"?"Start Strength Log":"Start Guided Workout"}</button><button class="v15-round-action" onclick="window.openBriefingV110 ? window.openBriefingV110() : null">→</button></div></div></section>${readinessPanel()}${blockCard()}<section class="coach-v16-weight-card"><div><div class="v15-kicker">Body Weight</div><div class="coach-v16-weight-number">${wt?`${Number(wt.weight).toFixed(1)} lb`:"Not logged"}</div><p class="v15-muted">${wt?`Last entry: ${esc(wt.date)}`:"Add today's weight to start a trend."}</p></div><button class="v15-round-action" onclick="coachV16OpenWeight()">+</button></section>${weekGrid()}<section class="v15-panel v15-coach-card"><div class="v15-kicker">Next Milestone</div><h3>${esc(w.success)}</h3><p class="v15-muted">${esc(w.purpose)}</p></section>`}
  function renderGoalsV17(){ensure17();shell();const host=document.getElementById("plan");if(!host)return;const g=meta(),ph=activePhase();host.innerHTML=`<section class="v15-screen-head"><div class="v15-kicker">Goals</div><h2>Training Calendar</h2><p class="v15-muted">Goal → Training Block → Phase → Today’s Session.</p></section><section class="coach-v16-goal-hero"><div class="coach-v16-badge">Active Goal</div><h2>${esc(g.label)}</h2><p class="v15-muted">${esc(g.block)} · ${esc(ph[0])}</p><div class="v15-metric-grid" style="margin-top:14px"><div><span>Block Week</span><strong>${weekNumber()}</strong></div><div><span>Progress</span><strong>${completionPct()}%</strong></div></div><div class="coach-v16-actions"><button class="v1531-button-primary" onclick="coachV16OpenGoalPicker()">Change Goal</button><button class="v1531-button-secondary" onclick="openSetPosition ? openSetPosition() : null">Set Week/Day</button></div></section>${blockCard()}${weekGrid()}`}
  function renderStatsV17(){ensure17();shell();const host=document.getElementById("dashboard");if(!host)return;const g=meta(),ph=activePhase(),wt=latestWeight();host.innerHTML=`<section class="v15-screen-head"><div class="v15-kicker">Stats</div><h2>Progress</h2><p class="v15-muted">Training block, readiness, strength, recovery, and body-weight trend.</p></section>${readinessPanel()}<section class="v15-panel"><div class="v15-kicker">Training Block</div><h3>${esc(g.block)}</h3><p class="v15-muted">${esc(ph[0])}: ${esc(ph[2])}</p><div class="v15-metric-grid"><div><span>Phase</span><strong>${esc(ph[0])}</strong></div><div><span>Week</span><strong>${weekNumber()}</strong></div><div><span>Weight</span><strong>${wt?Number(wt.weight).toFixed(1):"—"}</strong></div><div><span>Completed</span><strong>${(state.completed||[]).length}</strong></div></div></section>${weekGrid()}`}
  window.coach17StartToday=function(){const w=activeWorkout();if(w.type==="lift"){if(typeof window.ruut155StartLift==="function"){window.ruut155StartLift(w.templateId||"fullBody");return}showScreen("strength");return}if(window.__coachOriginalStartWorkout1631)return window.__coachOriginalStartWorkout1631();if(window.__coachOriginalStartWorkout1611)return window.__coachOriginalStartWorkout1611();if(typeof startWorkout==="function")return startWorkout()}
  const oldShow=window.showScreen;window.showScreen=showScreen=function(id,btn){shell();document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));const screen=document.getElementById(id);if(screen)screen.classList.add("active");document.querySelectorAll("nav button").forEach(b=>b.classList.remove("active"));const navBtn=btn||document.querySelector(`nav button[data-target="${id}"]`);if(navBtn)navBtn.classList.add("active");if(id==="today")return renderTodayV17();if(id==="plan")return renderGoalsV17();if(id==="dashboard")return renderStatsV17();if(typeof oldShow==="function")return oldShow(id,btn)}
  window.renderToday=renderToday=renderTodayV17;window.renderPlan=renderPlan=renderGoalsV17;window.renderDashboard=renderDashboard=renderStatsV17;window.renderAll=renderAll=function(){shell();renderTodayV17();renderGoalsV17();renderStatsV17();try{if(typeof renderWorkout==="function")renderWorkout()}catch(e){}try{if(typeof renderRecover==="function")renderRecover()}catch(e){}try{if(typeof renderStrength==="function")renderStrength()}catch(e){}}
  if(window.ruut14Final){window.ruut14Final.renderToday=renderTodayV17;window.ruut14Final.renderPlan=renderGoalsV17;window.ruut14Final.renderDashboard=renderStatsV17;window.ruut14Final.renderAll=window.renderAll;window.ruut14Final.showScreen=window.showScreen}
  ensure17();shell();const active=document.querySelector(".screen.active")?.id||"today";if(active==="today")renderTodayV17();if(active==="plan")renderGoalsV17();if(active==="dashboard")renderStatsV17();window.COACH_TRAINING_CALENDAR_VERSION="17.0";
})();


// ---------- COACH v17.1 INTELLIGENCE PACK ----------
(function(){
  state.achievementsV171 = state.achievementsV171 || [];
  state.metricsV171 = state.metricsV171 || {goalWeight:null};

  window.COACH_INTELLIGENCE_PACK_VERSION = "17.1";

  window.coach171Summary = function(){
    return {
      version:"17.1",
      achievements:(state.achievementsV171||[]).length,
      weightEntries:(state.weightLogV16||[]).length,
      liftSessions:(state.liftSessions||[]).length
    };
  };
})();


// ---------- COACH V17.2 PROGRESSIVE OVERLOAD ENGINE ----------
(function(){
  /*
    Adds actual strength progression recommendations from logged lift history.
    Uses:
    - last saved sets
    - best set
    - estimated 1RM
    - target rep range
    - readiness recommendation when available
  */

  function esc(v){return String(v ?? "").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));}
  function n(v){const x=Number(v);return Number.isFinite(x)?x:0;}
  function e1rm(set){return set ? Math.round(n(set.weight)*(1+(n(set.reps)/30))) : 0;}
  function highRepTarget(reps){
    const nums=String(reps||"").match(/\d+/g);
    if(!nums || !nums.length) return 10;
    return Number(nums[nums.length-1]) || 10;
  }
  function lowRepTarget(reps){
    const nums=String(reps||"").match(/\d+/g);
    if(!nums || !nums.length) return 8;
    return Number(nums[0]) || 8;
  }
  function allLiftSessions(){
    return Array.isArray(state.liftSessions) ? state.liftSessions : [];
  }
  function setsForExercise(name){
    const key=String(name||"").toLowerCase();
    const rows=[];
    allLiftSessions().forEach(session=>{
      (session.exercises||[]).forEach(ex=>{
        if(String(ex.name||"").toLowerCase()===key){
          (ex.sets||[]).forEach(set=>rows.push({...set, sessionIso:session.iso||set.iso||"", sessionDate:session.date||""}));
        }
      });
    });
    return rows.sort((a,b)=>String(b.sessionIso||"").localeCompare(String(a.sessionIso||"")));
  }
  function lastWorkoutForExercise(name){
    const key=String(name||"").toLowerCase();
    const rows=[];
    allLiftSessions().forEach(session=>{
      (session.exercises||[]).forEach(ex=>{
        if(String(ex.name||"").toLowerCase()===key && Array.isArray(ex.sets) && ex.sets.length){
          rows.push({session,exercise:ex,sets:ex.sets});
        }
      });
    });
    return rows.sort((a,b)=>String(b.session.iso||"").localeCompare(String(a.session.iso||"")))[0] || null;
  }
  function bestSetForExercise(name){
    const sets=setsForExercise(name);
    if(!sets.length) return null;
    return sets.slice().sort((a,b)=>(n(b.weight)*n(b.reps))-(n(a.weight)*n(a.reps)))[0];
  }
  function recommendForExercise(ex){
    const name=ex?.name || "";
    const targetHigh=highRepTarget(ex?.reps);
    const targetLow=lowRepTarget(ex?.reps);
    const last=lastWorkoutForExercise(name);
    const best=bestSetForExercise(name);

    if(!last){
      const base=ex?.weight || ex?.defaultWeight || "";
      return {
        status:"Build Baseline",
        last:"No previous session",
        best:"No PR yet",
        recommendation:base ? `Start at ${base} lb and complete ${ex.sets||3} sets of ${ex.reps||"8-10"}.` : `Choose a strict-form weight for ${ex.sets||3} sets of ${ex.reps||"8-10"}.`,
        reason:"COACH needs one logged session before making stronger progression calls."
      };
    }

    const sets=last.sets||[];
    const top=sets.slice().sort((a,b)=>(n(b.weight)*n(b.reps))-(n(a.weight)*n(a.reps)))[0];
    const allHitTop=sets.length>=n(ex.sets||3) && sets.every(s=>n(s.reps)>=targetHigh);
    const anyLow=sets.some(s=>n(s.reps)<targetLow);
    let status="Maintain";
    let recommendation=`Repeat ${n(top.weight)} lb and try to add 1 rep on one or more sets.`;
    let reason="You have logged this movement before. Progress by earning reps before adding load.";

    if(allHitTop){
      status="Increase";
      recommendation=`Move to ${n(top.weight)+5} lb and aim for ${targetLow}-${targetHigh} reps.`;
      reason="You hit the top of the target range across the working sets.";
    }else if(anyLow){
      status="Hold";
      recommendation=`Stay at ${n(top.weight)} lb until all sets reach at least ${targetLow} reps.`;
      reason="At least one set is below the bottom of the target range.";
    }else if(n(top.reps)>=targetHigh){
      status="Micro-Progress";
      recommendation=`Try ${n(top.weight)+5} lb for the first set, then return to ${n(top.weight)} lb if form drops.`;
      reason="Your best set reached the top target, but not all sets have earned a full load jump.";
    }

    return {
      status,
      last:sets.map(s=>`${s.weight}x${s.reps}`).join(", "),
      best:best ? `${best.weight}x${best.reps} · e1RM ${e1rm(best)}` : "No PR yet",
      recommendation,
      reason
    };
  }

  function currentStrengthTemplate(){
    try{
      if(state.activeLiftSessionV155) return state.activeLiftSessionV155;
      const title=(typeof todayTitle==="function") ? todayTitle() : "";
      const templateId = title==="Upper A" ? "upperA" : title==="Lower + Core" ? "lowerCore" : title==="Upper B" ? "upperB" : title==="Full Body" ? "fullBody" : "";
      if(templateId && Array.isArray(state.strengthTemplates)){
        return state.strengthTemplates.find(t=>t.id===templateId);
      }
    }catch(e){}
    return null;
  }

  function progressivePanel(template){
    const exercises=(template?.exercises||[]).slice(0,8);
    if(!exercises.length){
      return `<section class="coach172-panel"><span class="coach172-badge">Progressive Overload</span><h3>No Strength Session Active</h3><p class="v15-muted">Start or open a strength workout to see exercise-specific recommendations.</p></section>`;
    }
    return `<section id="coach172ProgressiveOverload" class="coach172-panel">
      <span class="coach172-badge">Progressive Overload</span>
      <h3>${esc(template.templateName || template.name || "Strength Session")}</h3>
      <p class="v15-muted">COACH compares your last logged sets and recommends whether to increase, hold, or earn reps.</p>
      <div class="coach172-list">
        ${exercises.map(ex=>{
          const r=recommendForExercise(ex);
          return `<div class="coach172-row">
            <div>
              <strong>${esc(ex.name)}</strong>
              <p><b>${esc(r.status)}</b> · ${esc(r.recommendation)}</p>
              <p>Last: ${esc(r.last)} · Best: ${esc(r.best)}</p>
              <p>${esc(r.reason)}</p>
            </div>
            <span class="coach172-badge">${esc(ex.sets||3)} x ${esc(ex.reps||"8-10")}</span>
          </div>`;
        }).join("")}
      </div>
    </section>`;
  }

  window.coach172OpenProgressiveOverload = function(){
    const template=currentStrengthTemplate() || {name:"Recent Strength Work",exercises:[]};
    if(!template.exercises?.length && Array.isArray(state.strengthTemplates)){
      template.exercises = state.strengthTemplates.flatMap(t=>t.exercises||[]).slice(0,8);
      template.name = "Exercise Recommendations";
    }
    showModal(`<div class="v1531-modal-head"><div class="v15-kicker">Progressive Overload</div><h2>Next Targets</h2><p>Use these recommendations to progress without guessing.</p></div>${progressivePanel(template)}<div class="coach162-actions"><button class="v1531-button-primary" onclick="hideModal()">Done</button><button class="v1531-button-secondary" onclick="hideModal();showScreen('strength')">Strength</button></div>`);
  };

  const prevRenderStrength172 = window.renderStrength;
  window.renderStrength = renderStrength = function(){
    if(typeof prevRenderStrength172==="function") prevRenderStrength172();
    const host=document.getElementById("strength");
    if(!host || document.getElementById("coach172StrengthPanel")) return;

    const active=state.activeLiftSessionV155;
    const template=active || currentStrengthTemplate();

    host.insertAdjacentHTML("afterbegin", `<section id="coach172StrengthPanel" class="coach172-panel">
      <span class="coach172-badge">Strength Coach</span>
      <h3>Progressive Overload</h3>
      <p class="v15-muted">Recommendations are based on previous sets, best sets, and target rep ranges.</p>
      <div class="coach172-grid">
        <div class="coach172-card"><span>Logged Lift Sessions</span><strong>${(state.liftSessions||[]).length}</strong></div>
        <div class="coach172-card"><span>Available Exercises</span><strong>${Array.isArray(state.exerciseLibraryV162)?state.exerciseLibraryV162.length:"—"}</strong></div>
      </div>
      <div class="coach162-actions">
        <button class="v1531-button-primary" onclick="coach172OpenProgressiveOverload()">View Next Targets</button>
        <button class="v1531-button-secondary" onclick="coach162OpenExerciseLibrary()">Exercise Library</button>
      </div>
    </section>`);
  };

  const prevDashboard172 = window.renderDashboard;
  window.renderDashboard = renderDashboard = function(){
    if(typeof prevDashboard172==="function") prevDashboard172();
    const host=document.getElementById("dashboard");
    if(!host || document.getElementById("coach172DashboardPanel")) return;

    const sessions=state.liftSessions||[];
    const last=sessions.slice(-1)[0];
    const exCount=last ? (last.exercises||[]).length : 0;
    const setCount=last ? (last.exercises||[]).reduce((sum,e)=>sum+(e.sets||[]).length,0) : 0;

    host.insertAdjacentHTML("afterbegin", `<section id="coach172DashboardPanel" class="coach172-panel">
      <span class="coach172-badge">Progression</span>
      <h3>Strength Progression</h3>
      <p class="v15-muted">Use logged history to earn reps, hold load, or increase weight.</p>
      <div class="coach172-grid">
        <div class="coach172-card"><span>Last Session</span><strong>${last?esc(last.templateName||"Strength"):"None"}</strong></div>
        <div class="coach172-card"><span>Last Volume</span><strong>${setCount} sets</strong></div>
      </div>
      <div class="coach162-actions">
        <button class="v1531-button-primary" onclick="coach172OpenProgressiveOverload()">View Next Targets</button>
        <button class="v1531-button-secondary" onclick="showScreen('strength')">Strength</button>
      </div>
    </section>`);
  };

  window.COACH_PROGRESSIVE_OVERLOAD_VERSION="17.2";
})();


// ---------- COACH V17.3 DAILY INTELLIGENCE PACK ----------
(function(){
  state.dailyIntelligenceV173 = state.dailyIntelligenceV173 || {
    version:"17.3",
    goalWeight:null,
    missedWorkouts:[],
    trophies:[]
  };

  // Foundation objects for:
  // Daily rollover
  // Missed workout tracking
  // Body metrics dashboard
  // Readiness intelligence
  // Awards & trophies

  window.COACH_DAILY_INTELLIGENCE_VERSION = "17.3";
})();
