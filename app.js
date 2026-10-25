(function(P){'use strict';
const $=id=>document.getElementById(id);
let qFile=null,xFile=null,qre=null,cf=null,result=null,manual={},chosen=null,visibleLimit=70;
const labels={match:'Source match',mismatch:'Difference',review:'Needs review',unmapped:'Unmapped'};
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function setInput(type,file){
 if(!file)return;
 const isQ=type==='qre'; const allowed=isQ?/\.docx$/i:/\.(xml|zip)$/i;
 if(!allowed.test(file.name)){showError(`Unsupported ${type.toUpperCase()} format. ${isQ?'Select .docx':'Select .xml or .zip'}.`);return;}
 if(file.size>35*1024*1024){showError('Files must be smaller than 35 MB.');return;}
 if(isQ)qFile=file;else xFile=file;
 $(type+'-status').textContent=file.name;
 $(type+'-size').textContent=(file.size/1024/1024).toFixed(2)+' MB';
 $(type+'-drop').classList.add('has-file');$('analyze').disabled=!(qFile&&xFile);$('error').hidden=true;
}
function setupDrop(type){
 const d=$(type+'-drop');const input=$(type+'-file');
 input.addEventListener('change',e=>setInput(type,e.target.files?.[0]));
 d.addEventListener('keydown',e=>{if(e.target===d&&(e.key==='Enter'||e.key===' ')){e.preventDefault();input.click();}});
 ['dragenter','dragover'].forEach(evt=>d.addEventListener(evt,e=>{e.preventDefault();d.classList.add('dragover');}));
 ['dragleave','drop'].forEach(evt=>d.addEventListener(evt,e=>{e.preventDefault();d.classList.remove('dragover');if(evt==='drop')setInput(type,e.dataTransfer?.files?.[0]);}));
}
function showError(message){$('error').textContent=message;$('error').hidden=false;}
async function run(){
 const btn=$('analyze');btn.disabled=true;btn.textContent='Analyzing files…';$('error').hidden=true;
 await new Promise(resolve=>setTimeout(resolve,32));
 try{
  // Parse in series to avoid unnecessary peak memory usage on large documents.
  qre=await P.parseQRE(qFile);cf=await P.parseSurvey(xFile,$('language').value);
  if(!qre.questions.length)throw Error('No recognizable QIDs were extracted from this Word QRE. Review document layout before using results.');
  if(!cf.questions.length)throw Error('No questions were found in the Confirmit routing tree.');
  manual={};result=P.compare(qre,cf,manual);chosen=null;visibleLimit=70;
  $('setup').hidden=true;$('results').hidden=false;renderResults();window.scrollTo({top:0,behavior:'instant'});
 }catch(e){showError(e.message||String(e));console.error(e);}
 finally{btn.disabled=!(qFile&&xFile);btn.innerHTML='Analyze study <span aria-hidden="true">↗</span>';}
}
function rerun(){const key=chosen;result=P.compare(qre,cf,manual);renderResults(key);}
function renderResults(selected=chosen){
 const s=result.summary;
 $('project-name').textContent=(cf.project||cf.projectId||'Confirmit survey')+' · '+cf.selectedLanguage+' · '+qre.documentName;
 $('stat-qre').textContent=s.qre;$('stat-matches').textContent=s.matches;$('stat-mismatch').textContent=s.mismatches;$('stat-review').textContent=s.review+s.unmapped;
 $('coverage-note').textContent=`${s.mapped}/${s.qre} recognized QRE questions linked to XML nodes. ${s.review+s.unmapped} need human review or mapping. Source-only results: no routing, rendered formatting, or respondent experience was tested. Word extraction found ${qre.blocks} content blocks and ${qre.contentControls} content controls.`;
 $('extra-count').textContent=s.extras+' unmatched';
 $('extras').replaceChildren();
 for(const extra of result.sourceExtra.slice(0,240)){
  const p=document.createElement('span');p.className='extra-pill';p.textContent=`${extra.qid||'(no QID)'} · ${extra.title||extra.type}`;$('extras').append(p);
 }
 if(s.extras>240){const p=document.createElement('span');p.textContent=`+ ${s.extras-240} more not shown`;p.className='extra-pill';$('extras').append(p);}
 chosen=selected||result.rows[0]?.key||null;
 renderList();renderDetail();
}
function filteredRows(){const filter=$('status-filter').value;const q=$('search').value.trim().toLocaleLowerCase();return result.rows.filter(r=>(filter==='all'||r.verdict===filter)&&(!q||[r.q.qid,r.q.title,r.q.text,r.cf?.qid,r.cf?.title,r.cf?.text].some(x=>(x||'').toLocaleLowerCase().includes(q))));}
function renderList(){
 const rows=filteredRows();$('visible-count').textContent=`${rows.length} questions`;
 const holder=$('question-list');holder.replaceChildren();
 for(const r of rows.slice(0,visibleLimit)){
  const b=document.createElement('button');b.type='button';b.className='question-row'+(r.key===chosen?' selected':'');
  b.setAttribute('aria-selected',String(r.key===chosen));
  b.innerHTML=`<div class="question-titleline"><strong>${escape(r.q.qid)}</strong><span class="status ${r.verdict}">${labels[r.verdict]}</span></div><div class="question-short">${escape(r.q.title||r.q.text||'(untitled)')}</div><div class="question-meta">${escape(r.cf?.qid||'No confirmed mapping')} · ${escape(r.reason.replace(/-/g,' '))}</div>`;
  b.addEventListener('click',()=>{chosen=r.key;renderList();renderDetail();});holder.append(b);
 }
 if(!rows.length){const p=document.createElement('div');p.className='notfound';p.textContent='No questions meet these filters.';holder.append(p);}
 $('load-more').hidden=rows.length<=visibleLimit;
}
function safeParagraph(s){return escape(s||'—').replace(/\n/g,'<br>');}
function answerHTML(list,miss=[],type='qre'){
 if(!list.length)return '<div class="muted" style="font-size:12px">Not extracted</div>';
 const ms=miss.map(x=>P.normalize(x).toLowerCase());
 return '<ul class="answers">'+list.slice(0,80).map(o=>{
  const label=typeof o==='string'?o:o.text;const code=typeof o==='string'?'':o.code;
  const unmatched=ms.includes(P.cleanOption(label).toLowerCase());
  return `<li class="${unmatched?'answer-diff':''}">${code?`<code>${escape(code)}</code>`:''}${escape(label||'[Image/empty option]')}</li>`;
 }).join('')+ (list.length>80?'<li>Additional options not displayed in preview</li>':'')+'</ul>';
}
function diffHtml(left,right){
 const a=String(left||'').trim().split(/\s+/).filter(Boolean),b=String(right||'').trim().split(/\s+/).filter(Boolean);
 if(a.length>230||b.length>230)return [safeParagraph(left),safeParagraph(right)];
 const m=a.length,n=b.length,dp=Array.from({length:m+1},()=>new Uint16Array(n+1));
 for(let i=m-1;i>=0;i--)for(let j=n-1;j>=0;j--)dp[i][j]=(a[i]===b[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]));
 const keepA=new Set(),keepB=new Set();let i=0,j=0;
 while(i<m&&j<n){if(a[i]===b[j]){keepA.add(i);keepB.add(j);i++;j++;}else if(dp[i+1][j]>=dp[i][j+1])i++;else j++;}
 function format(tokens,keep){return tokens.map((w,k)=>keep.has(k)?escape(w):'<mark class="diff">'+escape(w)+'</mark>').join(' ');}
 return [format(a,keepA),format(b,keepB)];
}
function renderDetail(){
 const r=result.rows.find(x=>x.key===chosen);const host=$('detail');host.className='';
 if(!r){host.innerHTML='<div class="detail-empty"><h3>No question selected</h3></div>';return;}
 const c=r.cf,q=r.q,miss=r.issues.find(x=>x.type==='answers');
 const differ=Boolean(r.issues.find(x=>x.type==='text'));const colored=differ?diffHtml(q.text,c?.text):[safeParagraph(q.text),safeParagraph(c?.text)];
 let html=`<div class="detail-head"><div><div class="detail-kicker">QUESTION REVIEW</div><h3>${escape(q.qid)}</h3><div class="detail-subtitle">${escape(q.title||'No QRE title extracted')}</div></div><span class="status large ${r.verdict}">${labels[r.verdict]}</span></div>`;
 html+=`<div class="map-info"><span class="meta-pill">Mapping: ${escape(r.reason.replace(/-/g,' '))}</span><span class="meta-pill">CF: ${escape(c?.qid||'Unmapped')}</span>${c?`<span class="meta-pill">${escape(c.type)}</span>`:''}</div>`;
 html+='<div class="compare-grid">';
 html+=`<div class="compare-card"><div class="panel-title">WORD QRE</div><div class="compare-question">${colored[0]}</div>${q.additional?.length?`<div class="panel-section">Additional text / instructions (unclassified)</div><div class="muted" style="font-size:12px;white-space:pre-wrap">${safeParagraph(q.additional.slice(0,5).join('\n'))}</div>`:''}<div class="panel-section">Extracted answer options (${q.options.length})</div>${answerHTML(q.options,miss?.missing||[])}</div>`;
 html+=`<div class="compare-card cf"><div class="panel-title">CONFIRMIT XML</div><div class="compare-question">${colored[1]}</div>${c?.instruction?`<div class="panel-section">Programmed instruction</div><div class="muted" style="font-size:12px">${safeParagraph(c.instruction)}</div>`:''}<div class="panel-section">Resolved answer options (${c?.options.length||0})</div>${answerHTML(c?.options||[],miss?.extra||[],'cf')}</div>`;
 html+='</div><div class="detail-section-heading">FINDINGS & UNCERTAINTIES</div>';
 if(!r.issues.length)html+='<div class="notice info"><b>No source-text discrepancies detected</b>Matching text does not prove the survey renders or routes correctly.</div>';
 else for(const i of r.issues){html+=`<div class="notice ${i.level}"><b>${escape(i.level.toUpperCase())} · ${escape(i.type.replaceAll('-',' '))}</b>${escape(i.message)}${(i.missing?.length)?`<small>Missing from XML: ${escape(i.missing.slice(0,12).join(' · '))}</small>`:''}${(i.extra?.length)?`<small>Extra in XML: ${escape(i.extra.slice(0,12).join(' · '))}</small>`:''}</div>`;}
 html+='<div class="map-editor"><label for="manual-select">Manually choose the corresponding CF question</label><select id="manual-select"><option value="">Automatic mapping / unresolved</option>';
 for(const candidate of cf.questions.filter(x=>x.qid)){html+=`<option value="${escape(candidate.entityId)}" ${manual[r.key]===candidate.entityId?'selected':''}>${escape(candidate.qid+' — '+candidate.title)}</option>`;}
 html+='</select><p class="map-help">Manual mapping updates this report locally; it does not change the QRE or Confirmit XML. Inspect text differences before accepting a pairing.</p></div>';
 host.innerHTML=html;
 $('manual-select').addEventListener('change',e=>{if(e.target.value)manual[r.key]=e.target.value;else delete manual[r.key];rerun();});
}
function csvCell(v){let s=String(v??'').replace(/\r?\n/g,' ');if(/^[\s]*[=+@\-\t]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
function downloadCSV(){if(!result)return;
 const head=['QRE QID','QRE title','CF QID','CF title','Status','Mapping method','QRE question','CF question','QRE answers','CF answers','Issues'];
 const rows=result.rows.map(r=>[r.q.qid,r.q.title,r.cf?.qid||'',r.cf?.title||'',r.verdict,r.reason,r.q.text,r.cf?.text||'',r.q.options.join(' | '),(r.cf?.options||[]).map(o=>o.text).join(' | '),r.issues.map(i=>i.type+': '+i.message).join(' | ')]);
 const csv='\uFEFF'+[head,...rows].map(r=>r.map(csvCell).join(',')).join('\r\n');
 const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='lazyproof-survey-qa-report.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);
}
setupDrop('qre');setupDrop('xml');$('analyze').addEventListener('click',run);
$('change-files').addEventListener('click',()=>{$('results').hidden=true;$('setup').hidden=false;$('error').hidden=true;window.scrollTo(0,0);});
$('export-csv').addEventListener('click',downloadCSV);
$('search').addEventListener('input',()=>{visibleLimit=70;renderList();});$('status-filter').addEventListener('change',()=>{visibleLimit=70;renderList();});
$('load-more').addEventListener('click',()=>{visibleLimit+=70;renderList();});
window.LazyProofApp={testLoad:async(q,x,lang='9')=>{qre=await P.parseQRE(q);cf=await P.parseSurvey(x,lang);manual={};result=P.compare(qre,cf);renderResults();return {qre,cf,result};},getState:()=>({qre,cf,result})};
})(window.LazyProof=window.LazyProof||{});