(function(P){'use strict';
const $=id=>document.getElementById(id);
let qFile=null,xFile=null,qre=null,cf=null,result=null,manual={},chosen=null,visibleLimit=70;
const labels={mismatch:'Difference',review:'Needs review',unmapped:'Unmapped'};
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
 $('stat-qre').textContent=s.qre;$('stat-mismatch').textContent=s.mismatches;$('stat-review').textContent=s.review;$('stat-unmapped').textContent=s.unmapped;
 $('coverage-note').textContent=`${s.mapped}/${s.qre} recognized QRE questions linked to XML nodes. ${s.review+s.unmapped} need human review or mapping. Source-only results: no routing, rendered formatting, or respondent experience was tested. Word extraction found ${qre.blocks} content blocks and ${qre.contentControls} content controls.`;
 chosen=selected;refreshVisible();
}
function filteredRows(){const filter=$('status-filter').value;const q=$('search').value.trim().toLocaleLowerCase();return result.rows.filter(r=>r.verdict!=='match'&&(filter==='all'||r.verdict===filter)&&(!q||[r.q.qid,r.q.title,r.q.text,r.cf?.qid,r.cf?.title,r.cf?.text].some(x=>(x||'').toLocaleLowerCase().includes(q))));}
function refreshVisible(){const rows=filteredRows();if(!rows.some(r=>r.key===chosen))chosen=rows[0]?.key||null;renderList();renderDetail();}
function shortFinding(r){const isText=r.issues.some(i=>i.type==='text'||i.type==='empty-text');if(isText&&r.cf){const s=P.diffSnippets(r.q.text,r.cf.text)[0];if(s)return 'QRE: '+P.plainExcerpt(s,'qre')+'  /  CF: '+P.plainExcerpt(s,'xml');}const a=r.issues.find(i=>i.type==='answers'&&i.level!=='info');return (a||r.issues.find(i=>i.level==='mismatch'||i.level==='review'))?.message||'Requires review';}
function renderList(){
 const rows=filteredRows();$('visible-count').textContent=`${rows.length} findings`;
 const holder=$('question-list');holder.replaceChildren();
 for(const r of rows.slice(0,visibleLimit)){
  const b=document.createElement('button');b.type='button';b.className='question-row'+(r.key===chosen?' selected':'');
  b.setAttribute('aria-selected',String(r.key===chosen));
  b.innerHTML=`<div class="question-titleline"><strong>${escape(r.q.qid)}</strong><span class="status ${r.verdict}">${labels[r.verdict]}</span></div><div class="question-short">${escape(shortFinding(r))}</div><div class="question-meta">${escape(r.cf?.qid||'No confirmed mapping')} · ${escape(r.reason.replace(/-/g,' '))}</div>`;
  b.addEventListener('click',()=>{chosen=r.key;refreshVisible();});holder.append(b);
 }
 if(!rows.length){const p=document.createElement('div');p.className='notfound';p.textContent='No questions meet these filters.';holder.append(p);}
 $('load-more').hidden=rows.length<=visibleLimit;
}
function safeParagraph(s){return escape(s||'—').replace(/\n/g,'<br>');}
function shortDiffHtml(parts,leading,trailing){
 const body=parts.map(x=>`<span class="${x.changed?'diff-changed':'diff-match'}">${escape(x.text)}</span>`).join(' ');
 return `${leading?'<span class="diff-ellipsis">… </span>':''}${body||'<span class="diff-absent">[not present]</span>'}${trailing?'<span class="diff-ellipsis"> …</span>':''}`;
}
function textDiffSection(q,c){
 const hunks=P.diffSnippets(q.text,c?.text);
 if(!hunks.length)return '';
 return `<section class="diff-section"><div class="section-title">Changed question wording <span>${hunks.length} ${hunks.length===1?'difference group':'difference groups'}</span></div>`+
 hunks.map((h,i)=>`<div class="diff-pair"><div class="diff-line"><strong>QRE</strong><p>${shortDiffHtml(h.qre,h.leading,h.trailing)}</p></div><div class="diff-line"><strong>CF</strong><p>${shortDiffHtml(h.xml,h.leading,h.trailing)}</p></div></div>`).join('')+'</section>';
}
function answerDiffSection(r){
 const issue=r.issues.find(i=>i.type==='answers'&&(i.missing?.length||i.extra?.length));
 if(!issue)return '';
 let html='<section class="diff-section"><div class="section-title">Answer option differences</div><div class="answer-changes">';
 if(issue.missing?.length)html+=`<div><div class="answer-change-label">In QRE · Not matched in CF</div>${issue.missing.map(x=>`<div class="answer-chip"><mark class="diff-changed">${escape(x)}</mark></div>`).join('')}</div>`;
 if(issue.extra?.length)html+=`<div><div class="answer-change-label">In CF · Not matched in QRE</div>${issue.extra.map(x=>`<div class="answer-chip"><mark class="diff-changed">${escape(x)}</mark></div>`).join('')}</div>`;
 return html+'</div></section>';
}
function renderDetail(){
 const r=result.rows.find(x=>x.key===chosen);const host=$('detail');host.className='';
 if(!r){host.innerHTML='<div class="detail-empty"><h3>No question selected</h3></div>';return;}
 const c=r.cf,q=r.q;
 const textIssue=r.issues.some(x=>x.type==='text'||x.type==='empty-text');
 let html=`<div class="detail-head"><div><div class="detail-kicker">DISCREPANCY REVIEW</div><h3>${escape(q.qid)}</h3><div class="detail-subtitle">${escape(q.title||'Untitled QRE question')}</div></div><span class="status large ${r.verdict}">${labels[r.verdict]}</span></div>`;
 html+=`<div class="map-info"><span class="meta-pill">Mapping: ${escape(r.reason.replace(/-/g,' '))}</span><span class="meta-pill">CF: ${escape(c?.qid||'Not mapped')}</span></div>`;
 if(textIssue&&c)html+=textDiffSection(q,c);
 html+=answerDiffSection(r);
 html+='<div class="detail-section-heading">FINDINGS & UNCERTAINTIES</div>';
 for(const issue of r.issues.filter(i=>i.level!=='info')){
  html+=`<div class="notice ${escape(issue.level)}"><b>${escape(issue.level.toUpperCase())} · ${escape(issue.type.replaceAll('-',' '))}</b>${escape(issue.message)}</div>`;
 }
 html+='<div class="map-editor"><label for="manual-select">Manually choose the corresponding CF question</label><select id="manual-select"><option value="">Automatic mapping / unresolved</option>';
 for(const candidate of cf.questions.filter(x=>x.qid)){html+=`<option value="${escape(candidate.entityId)}" ${manual[r.key]===candidate.entityId?'selected':''}>${escape(candidate.qid+' — '+candidate.title)}</option>`;}
 html+='</select><p class="map-help">Manual mapping updates this report locally; it does not change the QRE or Confirmit XML. Inspect text differences before accepting a pairing.</p></div>';
 host.innerHTML=html;
 $('manual-select').addEventListener('change',e=>{if(e.target.value)manual[r.key]=e.target.value;else delete manual[r.key];rerun();});
}
function csvCell(v){let s=String(v??'').replace(/\r?\n/g,' ');if(/^[\s]*[=+@\-\t]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
function downloadCSV(){if(!result)return;
 const head=['QRE QID','QRE title','CF QID','CF title','Status','Mapping method','QRE changed excerpt','CF changed excerpt','QRE options not matched in CF','CF options not matched in QRE','Findings'];
 const rows=result.rows.filter(r=>r.verdict!=='match').map(r=>{
  const hasTextIssue=r.issues.some(i=>i.type==='text'||i.type==='empty-text');
  const h=hasTextIssue&&r.cf?P.diffSnippets(r.q.text,r.cf.text):[];
  const a=r.issues.find(i=>i.type==='answers');
  return [r.q.qid,r.q.title,r.cf?.qid||'',r.cf?.title||'',r.verdict,r.reason,h.map(x=>P.plainExcerpt(x,'qre')).join(' | '),h.map(x=>P.plainExcerpt(x,'xml')).join(' | '),(a?.missing||[]).join(' | '),(a?.extra||[]).join(' | '),r.issues.filter(i=>i.level!=='info').map(i=>i.type+': '+i.message).join(' | ')];
 });
 const csv='\uFEFF'+[head,...rows].map(r=>r.map(csvCell).join(',')).join('\r\n');
 const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='lazyproof-survey-qa-report.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);
}
setupDrop('qre');setupDrop('xml');$('analyze').addEventListener('click',run);
$('change-files').addEventListener('click',()=>{$('results').hidden=true;$('setup').hidden=false;$('error').hidden=true;window.scrollTo(0,0);});
$('export-csv').addEventListener('click',downloadCSV);
$('search').addEventListener('input',()=>{visibleLimit=70;refreshVisible();});$('status-filter').addEventListener('change',()=>{visibleLimit=70;refreshVisible();});
$('load-more').addEventListener('click',()=>{visibleLimit+=70;renderList();});
window.LazyProofApp={testLoad:async(q,x,lang='9')=>{qre=await P.parseQRE(q);cf=await P.parseSurvey(x,lang);manual={};result=P.compare(qre,cf);renderResults();return {qre,cf,result};},getState:()=>({qre,cf,result})};
})(window.LazyProof=window.LazyProof||{});