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

renderAll();
