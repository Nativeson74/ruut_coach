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
function showScreen(id,btn){document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));document.getElementById(id).classList.add("active");document.querySelectorAll("nav button").forEach(b=>b.classList.remove("active"));btn.classList.add("active");renderAll()}
function renderAll(){renderToday();renderWorkout();renderDashboard();renderPlan();renderJournal();renderRecover()}
function pill(t){return`<span class="pill ${t}">${t==="bodyweight"?"strength":t}</span>`}
function renderToday(){
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
function renderWorkout(){const x=currentWorkout();document.getElementById("workout").innerHTML=`<section class="card workout-mode"><div><p class="muted small">Guided session</p><div class="cue">${x.title}</div></div><div class="timer" id="timerDisplay">--:--</div><div class="progress-bar"><div id="workoutProgress" class="progress-fill"></div></div><p id="workoutMessage" class="muted">Tap start and keep this screen open during workouts.</p><div class="pill-row" style="justify-content:center"><span class="pill"><span id="awakeDot" class="dot"></span> <span id="awakeText">Screen awake not active</span></span></div><button onclick="startWorkout()">Start Today's Workout</button><button class="secondary" onclick="skipCurrent()">Skip Current Step</button><button id="pauseButton" class="secondary" onclick="togglePause()">Pause</button></section>`}
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
function startWorkout(){ workoutAbort=false; skipCurrentTimer=false; workoutPaused=false; if(settings.adaptive) openReadiness(); else beginWorkout("normal");}
function openReadiness(){showModal(`<h2>Readiness Check</h2><p class="muted" style="margin:10px 0 18px">How are you feeling right now?</p><button onclick="hideModal();beginWorkout('great')">Great</button><div style="height:8px"></div><button class="secondary" onclick="hideModal();beginWorkout('normal')">Good / Normal</button><div style="height:8px"></div><button class="gold" onclick="hideModal();beginWorkout('tired')">Tired or Sore</button><div style="height:8px"></div><button class="danger" onclick="hideModal();beginWorkout('back')">Back Tight</button>`)}
async function beginWorkout(readiness){
 stopWorkout(false); workoutAbort=false; skipCurrentTimer=false; workoutPaused=false; const x=currentWorkout();document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));document.getElementById("workout").classList.add("active");document.querySelectorAll("nav button").forEach(b=>b.classList.remove("active"));document.querySelectorAll("nav button")[1].classList.add("active");renderWorkout();requestWakeLock();
 if(readiness==="back"){await cue("Back is tight. Switch to easy walking and mobility today.");setCue("Walk Only");setTimer("EASY");setWorkoutMessage("Back tight fallback: easy walk and mobility. Do not force the plan.");return}
 if(x.type==="run")startRun(x,readiness);else if(x.type==="bodyweight")startStrength(x,readiness);else startRest(x)
}
function startRest(x){setWorkoutMessage("Rest day. Light walking only.");setCue("Rest Day");setTimer("REST");cue("Today is a rest day. Light walking only.")}
async function startRun(x,readiness){
 let total=x.total*60;if(readiness==="tired")total=Math.round(total*.8);
 let remaining=total,half=Math.floor(total/2),halfSpoken=false;setCue("Warmup");setWorkoutMessage("Warm up first. This keeps you moving longer.");if(settings.warmup)await warmup();
 await cue(phrase("start"));await countdown();
 while(remaining>0 && !workoutAbort){await runSegment("Run",x.runSeconds,remaining,total); if(workoutAbort) return;remaining-=x.runSeconds;if(!halfSpoken&&settings.routeMode==="outback"&&remaining<=half){halfSpoken=true;showHalfway()}if(remaining<=0)break;await runSegment("Walk",x.walkSeconds,remaining,total); if(workoutAbort) return; remaining-=x.walkSeconds;if(!halfSpoken&&settings.routeMode==="outback"&&remaining<=half){halfSpoken=true;showHalfway()}}
 if(settings.cooldown)await cooldown(); if(workoutAbort) return; finishWorkout()
}
async function runSegment(label,seconds,remaining,total){setCue(label.toUpperCase());setWorkoutMessage(label==="Run"?"Stay controlled. Smooth is fast.":"Recover. Keep moving.");await cue(label==="Run"?phrase("run"):phrase("walk"));await timer(seconds,remaining,total)}
function showHalfway(){setCue("TURN BACK");setWorkoutMessage("Halfway point. Turn back now.");cue(phrase("half"))}
async function startStrength(x,readiness){
 setCue("Warmup"); if(settings.warmup) await warmup(); if(workoutAbort) return; let rounds=x.rounds;if(readiness==="tired")rounds=Math.max(1,rounds-1);
 speak(`Starting bodyweight workout. ${rounds} rounds.`);await sleep(800);
 for(let r=1;r<=rounds && !workoutAbort;r++){setCue(`Round ${r}`);speak(template(phrase("round"),{n:r,t:rounds}));for(const e of x.exercises){if(workoutAbort) return; setCue(e.name);if(e.mode==="timed"){setWorkoutMessage(`${e.name}. ${e.seconds} seconds.`);await cue(template(phrase("timed"),{name:e.name,seconds:e.seconds}));await timer(e.seconds,e.seconds,e.seconds); if(workoutAbort) return; await cue(`${e.name} complete.`)}else{setTimer("DONE?");setWorkoutMessage(`${e.name}. ${e.reps}. Tap Done when finished.`);await cue(template(phrase("rep"),{name:e.name,reps:e.reps}));await waitForDone(e.name,e.reps); if(workoutAbort) return;}}}
 if(settings.cooldown) await cooldown(); if(workoutAbort) return; finishWorkout()
}
async function warmup(){await cue("Warmup. March in place. Then loosen the hips and ankles. Tap skip current step if you want to move ahead.");setTimer("2:00");setWorkoutMessage("Warmup: march, leg swings, calf raises, easy movement. Tap Skip Current Step to move ahead.");await timer(120,120,120)}
async function cooldown(){await cue("Cooldown. Walk easy and bring your breathing down. Tap skip current step if you are done.");setCue("Cooldown");setWorkoutMessage("Cooldown: easy walk, calves, hips, hamstrings. Tap Skip Current Step to finish.");await timer(180,180,180)}
async function finishWorkout(){setCue("Complete");setTimer("DONE");setWorkoutMessage("Workout complete. Good work.");await cue(phrase("finish"));markComplete(false);releaseWakeLock();showModal(`<h2>Workout Complete</h2><p class="muted" style="margin:10px 0 18px">${currentWorkout().day} — ${currentWorkout().title}</p><button onclick="hideModal();openJournalEntry()">Reflect</button><div style="height:8px"></div><button onclick="hideModal();nextDay()">Move to Next Day</button><div style="height:8px"></div><button class="secondary" onclick="hideModal()">Stay Here</button>`)}
function waitForDone(name,reps){return new Promise(resolve=>{showModal(`<h2>${name}</h2><p class="muted" style="margin:10px 0 18px">${reps}</p><button onclick="resolveDone()">Done</button>`);window.resolveDone=()=>{hideModal();resolve()}})}
async function countdown(){setTimer("3");await cue("Starting in 3.");await sleep(300);setTimer("2");await cue("2.");await sleep(300);setTimer("1");await cue("1.");await sleep(300);setTimer("GO");await cue("Go.");await sleep(250)}
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

function togglePause(){
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

function skipCurrent(){
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

function renderRecover(){
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
  const phraseKey=isRun?"transitionRun":isWalk?"transitionWalk":"strengthNext";
  const phraseText=v91Template(v91Pick(phraseKey),{name:label||"next"});
  setCue(isRun?"Run Next":isWalk?"Walk Next":"Next");
  setWorkoutMessage(phraseText);
  await cue(phraseText);
  for(let n=5;n>=1;n--){
    if(workoutAbort || skipCurrentTimer) return;
    setTimer("0:0"+n);
    if(n<=3) await cue(String(n));
    await timer(1, n, 5);
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

  const route=routeModeDescription(settings.routeMode);
  await cue(`${route.title} mode. ${route.tip}`);
  if(isSaturdayLongRun(x)) await cue("Long run day. First third easy. Middle third steady. Final third proud.");

  await cue(v91Pick("runStart"));
  await countdown();

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
  const detail=isRun?"Prepare to move.":isWalk?"Recover with control.":`Next movement: ${label}`;
  v93FlashCue(title,detail);

  for(let n=5;n>=1;n--){
    if(workoutAbort || skipCurrentTimer) return;
    setTimer(String(n));
    const td=document.getElementById("timerDisplay");
    if(td){
      td.classList.add("v93-countdown");
    }
    if(n<=3){
      try{
        if(navigator.vibrate) navigator.vibrate(80);
      }catch(e){}
      await cue(String(n));
    }
    await new Promise(r=>setTimeout(r,1000));
  }

  const td=document.getElementById("timerDisplay");
  if(td){
    td.classList.remove("v93-countdown");
  }
};

const runSegmentV93Base = runSegmentV91;
runSegmentV91 = async function(label,seconds,remaining,total){
  const isRun=label==="Run";
  await transitionCountdownV91(isRun?"run":"walk",label);
  if(workoutAbort) return;

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
  return timer(seconds,remaining,total);
};

const waitForDoneV93Base = waitForDone;
waitForDone = function(name,reps){
  v93FlashCue(name.toUpperCase(),`${reps} reps. Quality over speed.`);
  return waitForDoneV93Base(name,reps);
};

renderAll();
