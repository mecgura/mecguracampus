/* MecguraCampusOS — shared shell + demo data engine (offline) */
(function(){
"use strict";
var LS_KEY = "mc_db_v1";

var NAV = [
  {grp:"Main"},
  {href:"admin.html", label:"Super Dashboard", ico:"📊", page:"dashboard"},
  {href:"onboarding.html", label:"New School Setup", ico:"🚀", page:"onboarding", isNew:true},
  {grp:"Schools"},
  {href:"schools.html", label:"All Schools", ico:"🏫", page:"schools"},
  {href:"students.html", label:"Students", ico:"🎓", page:"students"},
  {href:"staff.html", label:"Staff & Payroll", ico:"👨‍🏫", page:"staff"},
  {grp:"Operations"},
  {href:"fees.html", label:"Fees + AI Predictor", ico:"💰", page:"fees", isNew:true},
  {href:"attendance.html", label:"Attendance", ico:"📋", page:"attendance"},
  {href:"exams.html", label:"Exams & Report Card", ico:"🏆", page:"exams"},
  {href:"transport.html", label:"Transport GPS", ico:"🚌", page:"transport"},
  {grp:"Growth"},
  {href:"messages.html", label:"WhatsApp Center", ico:"💬", page:"messages", isNew:true},
  {href:"reports.html", label:"Reports & AI Insights", ico:"📈", page:"reports"},
  {href:"billing.html", label:"Plans & Billing", ico:"💳", page:"billing"},
  {href:"settings.html", label:"Settings", ico:"⚙️", page:"settings"},
];

function seed(){
  return {
    schools:[
      {id:"sch1", name:"Guru Nanak Public School", city:"Ludhiana", students:1240, plan:"Annual — Rs. 24,999", status:"Paid", trial:0, due:0, since:"2024"},
      {id:"sch2", name:"Akal Academy", city:"Amritsar", students:860, plan:"Annual — Rs. 24,999", status:"Due", trial:0, due:182000, since:"2025"},
      {id:"sch3", name:"City Montessori", city:"Jalandhar", students:320, plan:"Trial", status:"Trial", trial:6, due:0, since:"2026"},
      {id:"sch4", name:"Dashmesh Model School", city:"Patiala", students:540, plan:"Monthly — Rs. 2,499", status:"Paid", trial:0, due:0, since:"2025"}
    ],
    students:[
      {id:"st1", name:"Arshdeep Singh", cls:"10-A", school:"sch1", fee:4500, due:4500, phone:"98140-11223", att:92},
      {id:"st2", name:"Simran Kaur", cls:"10-A", school:"sch1", fee:4500, due:0, phone:"98150-33445", att:96},
      {id:"st3", name:"Gurpreet Singh", cls:"8-B", school:"sch1", fee:3800, due:7600, phone:"98720-55667", att:71},
      {id:"st4", name:"Navjot Kaur", cls:"5-A", school:"sch2", fee:3200, due:3200, phone:"98155-77889", att:88},
      {id:"st5", name:"Harman Singh", cls:"9-C", school:"sch2", fee:4000, due:12000, phone:"98880-99001", att:64},
      {id:"st6", name:"Jasleen Kaur", cls:"3-B", school:"sch3", fee:2800, due:0, phone:"98140-22334", att:98},
      {id:"st7", name:"Manpreet Singh", cls:"12-Sci", school:"sch4", fee:5200, due:5200, phone:"98765-44332", att:84},
      {id:"st8", name:"Kirandeep Kaur", cls:"7-A", school:"sch4", fee:3500, due:0, phone:"98152-66778", att:91}
    ],
    staff:[
      {id:"t1", name:"Harjeet Kaur", role:"Principal", school:"sch1", salary:55000, status:"Paid"},
      {id:"t2", name:"Rajesh Kumar", role:"Mathematics Teacher", school:"sch1", salary:32000, status:"Paid"},
      {id:"t3", name:"Amandeep Singh", role:"Accountant", school:"sch2", salary:28000, status:"Pending"},
      {id:"t4", name:"Pooja Sharma", role:"English Teacher", school:"sch2", salary:26000, status:"Pending"},
      {id:"t5", name:"Balwinder Singh", role:"Driver", school:"sch1", salary:18000, status:"Paid"}
    ],
    buses:[
      {id:"b1", no:"PB-10-4521", route:"Model Town to School", kids:42, status:"Live", pos:20},
      {id:"b2", no:"PB-10-7834", route:"Civil Lines to School", kids:38, status:"Live", pos:55},
      {id:"b3", no:"PB-02-1190", route:"Cantt to School", kids:35, status:"Offline", pos:80},
      {id:"b4", no:"PB-10-9021", route:"Railway Road to School", kids:29, status:"Live", pos:35}
    ],
    fees:[
      {id:"f1", student:"Simran Kaur", school:"Guru Nanak Public School", amt:4500, date:"2026-09-02", mode:"UPI"},
      {id:"f2", student:"Jasleen Kaur", school:"City Montessori", amt:2800, date:"2026-09-03", mode:"Cash"},
      {id:"f3", student:"Kirandeep Kaur", school:"Dashmesh Model School", amt:3500, date:"2026-09-05", mode:"Online"},
      {id:"f4", student:"Navjot Kaur", school:"Akal Academy", amt:3200, date:"2026-09-06", mode:"UPI"}
    ],
    msgs:[
      {id:"m1", to:"Gurpreet Singh (Parent)", tpl:"Fee Reminder", lang:"Punjabi", date:"2026-09-07", status:"Delivered"},
      {id:"m2", to:"Class 10-A Parents (86)", tpl:"Result Published", lang:"English", date:"2026-09-06", status:"Delivered"},
      {id:"m3", to:"Harman Singh (Parent)", tpl:"Low Attendance Alert", lang:"Hindi", date:"2026-09-05", status:"Read"}
    ],
    onboard:{ step:2, school:"City Montessori", done:["Account created","Plan selected (Trial)","12 classes added"] }
  };
}

function load(){
  try{ var d = JSON.parse(localStorage.getItem(LS_KEY)); if(d && d.schools) return d; }catch(e){}
  var d = seed(); save(d); return d;
}
function save(d){ try{ localStorage.setItem(LS_KEY, JSON.stringify(d)); }catch(e){} }

var DB = load();
function uid(p){ return (p||"x") + Math.random().toString(36).slice(2,7); }
function inr(n){ n = Number(n)||0; if(n>=100000) return "Rs. "+(n/100000).toFixed(1)+"L"; return "Rs. "+n.toLocaleString("en-IN"); }
function esc(s){ return String(s==null?"":s).replace(/[&<>"]/g, function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];}); }
function toast(msg){ var t=document.getElementById("toast"); if(!t){t=document.createElement("div");t.id="toast";document.body.appendChild(t);} t.textContent=msg; t.style.display="block"; clearTimeout(t._h); t._h=setTimeout(function(){t.style.display="none";},2600); }
function schoolName(id){ var s=DB.schools.find(function(x){return x.id===id;}); return s?s.name:id; }
function riskOf(st){
  var score = 0;
  if(st.due >= 10000) score += 45; else if(st.due >= 5000) score += 30; else if(st.due > 0) score += 15;
  if(st.att < 70) score += 30; else if(st.att < 85) score += 12;
  return Math.min(98, score + 8);
}
function riskBar(s){ var c = s>65?"#ef4444":(s>35?"#f59e0b":"#10b981"); return '<div class="risk"><i style="width:'+s+'%;background:'+c+'"></i></div>'; }

/* SVG charts */
function bars(el, data, color){
  var max = Math.max.apply(null, data.map(function(d){return d.v;}).concat([1]));
  var h = data.map(function(d){
    var pct = Math.round(d.v/max*100);
    return '<div style="flex:1;text-align:center"><div style="height:120px;display:flex;align-items:flex-end;justify-content:center"><div style="width:70%;height:'+pct+'%;background:'+(color||"#78ce57")+';border-radius:7px 7px 0 0"></div></div><div class="small" style="margin-top:6px">'+esc(d.k)+'<br><b>'+esc(d.t||d.v)+'</b></div></div>';
  }).join("");
  el.innerHTML = '<div style="display:flex;gap:8px;align-items:flex-end">'+h+'</div>';
}
function donut(el, pct, label){
  var c = 2*Math.PI*34, off = c*(1-pct/100);
  el.innerHTML = '<div class="ring"><svg width="86" height="86" viewBox="0 0 86 86"><circle cx="43" cy="43" r="34" fill="none" stroke="#e5ece5" stroke-width="10"/><circle cx="43" cy="43" r="34" fill="none" stroke="#78ce57" stroke-width="10" stroke-linecap="round" stroke-dasharray="'+c+'" stroke-dashoffset="'+off+'" transform="rotate(-90 43 43)"/><text x="43" y="49" text-anchor="middle" font-size="17" font-weight="800" fill="#0C160D">'+pct+'%</text></svg><div><b>'+esc(label||"")+'</b><div class="small">Last 30 days</div></div></div>';
}

function renderChrome(page){
  var side = document.getElementById("mc-side"), top = document.getElementById("mc-top");
  if(side){
    var h = '<a class="mc-brand" href="admin.html"><span class="mc-mark">M</span><span><b>MecguraCampus</b><small>Super Admin</small></span></a><div class="mc-nav">';
    NAV.forEach(function(n){
      if(n.grp){ h += '<div class="grp">'+n.grp+'</div>'; return; }
      h += '<a href="'+n.href+'" class="'+(n.page===page?"on":"")+'"><span class="ico">'+n.ico+'</span>'+n.label+(n.isNew?'<span class="mc-new">NEW</span>':"")+'</a>';
    });
    h += '</div><div class="mc-side-foot"><a href="index.html">← View Website</a></div>';
    side.innerHTML = h;
  }
  if(top && !top.dataset.done){
    top.dataset.done = "1";
    var q = document.createElement("div"); q.className = "mc-actions";
    var sel = document.createElement("select");
    sel.innerHTML = '<option>English</option><option>Punjabi</option><option>Hindi</option>';
    sel.style.cssText = "padding:9px 12px;border:1px solid #DFE8DF;border-radius:10px;font-size:13px;background:#fff";
    sel.value = localStorage.getItem("mc_lang") || "English";
    sel.onchange = function(){ localStorage.setItem("mc_lang", sel.value); toast("Language preference saved: " + sel.value + ". WhatsApp templates ready."); };
    q.appendChild(sel); top.appendChild(q);
  }
}
function openModal(id){ document.getElementById(id).classList.add("open"); }
function closeModal(id){ document.getElementById(id).classList.remove("open"); }

document.addEventListener("DOMContentLoaded", function(){
  renderChrome(document.body.dataset.page || "");
});

window.MC = { DB:DB, save:function(){save(DB);}, uid:uid, inr:inr, esc:esc, toast:toast,
  schoolName:schoolName, riskOf:riskOf, riskBar:riskBar, bars:bars, donut:donut,
  openModal:openModal, closeModal:closeModal, reload:function(){ DB = load(); } };
})();
