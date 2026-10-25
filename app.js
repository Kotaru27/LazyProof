(function(P){'use strict';
const $=id=>document.getElementById(id);
let qFile=null,xFile=null,qre=null,cf=null,result=null,manual={},chosen=null,visibleLimit=70,languageReady=false,languageScan=0,languageInfo=null;
const labels={mismatch:'Difference',review:'Review',unmapped:'Unmapped'};
function refreshAnalyze(){ $('analyze').disabled=!(qFile&&xFile&&languageReady&&$('language').value); }
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function setInput(type,file){
 if(!file)return;
 const isQ=type==='qre'; const allowed=isQ?/\.docx$/i:/\.(xml|zip)$/i;
 if(!allowed.test(file.name)||file.size>35*1024*1024){
  // Do not keep a previously accepted file active when the user tries to replace it.
  if(isQ){qFile=null;}else{xFile=null;languageReady=false;languageInfo=null;languageScan++;$('language-block').hidden=true;}
  $(type+'-status').textContent='No valid file selected';$(type+'-drop').classList.remove('has-file');
  refreshAnalyze();
  showError(!allowed.test(file.name)?`Unsupported ${type.toUpperCase()} format. ${isQ?'Select .docx':'Select .xml or .zip'}.`:'Files must be smaller than 35 MB.');return;
 }
 if(isQ)qFile=file;else {xFile=file;languageReady=false;languageInfo=null;$('language-block').hidden=true;} 
 $(type+'-status').textContent=file.name;
 $(type+'-size').textContent=(file.size/1024/1024).toFixed(2)+' MB';
 $(type+'-drop').classList.add('has-file');refreshAnalyze();$('error').hidden=true;
 if(!isQ)loadAvailableLanguages(file);
}
async function loadAvailableLanguages(file){
 const scan=++languageScan;
 $('xml-status').textContent='Reading survey languages…';
 try{
  const profile=await P.inspectSurveyLanguages(file);
  if(scan!==languageScan||xFile!==file)return; // Discard stale upload results.
  languageInfo=profile;
  const picker=$('language'),options=profile.languages;
  picker.replaceChildren();
  picker.add(new Option('Select language…',''));
  for(const locale of options)picker.add(new Option(locale.label,locale.id));
  picker.value=''; // User must explicitly decide; never infer from counts or locale IDs.
  $('language-block').hidden=false;
  languageReady=true;
  $('xml-status').textContent=file.name;
  refreshAnalyze();
 }catch(e){
  if(scan!==languageScan||xFile!==file)return;
  languageReady=false;refreshAnalyze();$('language-block').hidden=true;
  $('xml-status').textContent='Could not read survey XML';showError(e.message||String(e));
 }
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
  manual={};result=P.compare(qre,cf,manual);chosen=null;visibleLimit=70;$('status-filter').value='mismatch';$('search').value='';
  $('setup').hidden=true;$('results').hidden=false;renderResults();window.scrollTo({top:0,behavior:'instant'});
 }catch(e){showError(e.message||String(e));console.error(e);}
 finally{refreshAnalyze();btn.innerHTML='Compare files <span aria-hidden="true">↗</span>';}
}
function rerun(){const key=chosen;result=P.compare(qre,cf,manual);renderResults(key);}
function renderResults(selected=chosen){
 const s=result.summary;
 $('project-name').textContent=(cf.project||cf.projectId||'Confirmit survey')+' · '+(cf.availableLanguages.find(l=>l.id===cf.selectedLanguage)?.name||'Language '+cf.selectedLanguage)+' only';
 $('stat-qre').textContent=s.qre;$('stat-mismatch').textContent=s.mismatches;$('stat-review').textContent=s.review;$('stat-unmapped').textContent=s.unmapped;
 $('coverage-note').textContent=`${s.mapped}/${s.qre} mapped · XML language ${cf.selectedLanguage} · ${s.matches} matches hidden`; 
 chosen=selected;refreshVisible();
}
function filteredRows(){const filter=$('status-filter').value;const q=$('search').value.trim().toLocaleLowerCase();return result.rows.filter(r=>r.verdict!=='match'&&(filter==='all'||r.verdict===filter)&&(!q||[r.q.qid,r.q.title,r.q.text,r.cf?.qid,r.cf?.title,P.respondentText(r.cf)].some(x=>(x||'').toLocaleLowerCase().includes(q))));}
function refreshVisible(){const rows=filteredRows();if(!rows.some(r=>r.key===chosen))chosen=rows[0]?.key||null;renderList();renderDetail();}
function shortFinding(r){const types=r.issues.filter(i=>i.level!=='info').map(i=>i.type);if(types.includes('text'))return 'Question wording changed';if(types.includes('dynamic-text'))return 'Variable wording needs review';if(types.includes('answers'))return 'Answer options differ';if(types.includes('empty-text')||types.includes('locale'))return 'Selected-language text unavailable';if(types.includes('answer-locale'))return 'Answer translation incomplete';if(types.includes('grid-row')||types.includes('grid'))return 'Grid needs manual review';if(types.includes('missing-map'))return 'No confirmed XML match';return r.issues.find(i=>i.level!=='info')?.message||'Needs inspection';}
function renderList(){
 const rows=filteredRows();$('visible-count').textContent=`${rows.length} items`;
 const holder=$('question-list');holder.replaceChildren();
 for(const r of rows.slice(0,visibleLimit)){
  const b=document.createElement('button');b.type='button';b.className='question-row'+(r.key===chosen?' selected':'');
  b.setAttribute('aria-selected',String(r.key===chosen));
  b.innerHTML=`<div class="question-titleline"><strong>${escape(r.q.qid)}</strong><span class="status ${r.verdict}">${labels[r.verdict]}</span></div><div class="question-short">${escape(shortFinding(r))}</div><div class="question-meta">${escape(r.q.title||'Question')} <span>· ${escape(r.cf?.qid||'Not mapped')}</span></div>`;
  b.addEventListener('click',()=>{chosen=r.key;refreshVisible();});holder.append(b);
 }
 if(!rows.length){const p=document.createElement('div');p.className='notfound';p.textContent=$('status-filter').value==='mismatch'?'No wording or answer differences found in this view. Check “Needs review” for unresolved comparisons.':'No findings for this filter.';holder.append(p);}
 $('load-more').hidden=rows.length<=visibleLimit;
}
function fullDiffHtml(parts){
 return parts.length?parts.map(x=>`<span class="${x.changed?'diff-changed':'diff-match'}">${escape(x.text)}</span>`).join(' '):'<span class="diff-absent">[No text in selected language]</span>';
}
function textDiffSection(q,c){
 // Each side is complete. Colour only reflects word/token alignment.
 const pair=P.fullComparison(q.text,P.respondentText(c));
 return `<section class="diff-section" aria-label="Full question wording comparison"><div class="section-title">Respondent wording <span>Text + instructions · Green matches / Red differs</span></div>`+
 `<div class="diff-pair"><div class="diff-line"><strong>QRE</strong><p>${fullDiffHtml(pair.qre)}</p></div>`+
 `<div class="diff-line"><strong>CF</strong><p>${fullDiffHtml(pair.xml)}</p></div></div></section>`;
}
function answerDiffSection(r){
 const issue=r.issues.find(i=>i.type==='answers'&&(i.missing?.length||i.extra?.length));
 if(!issue)return '';
 let html='<section class="diff-section"><div class="section-title">Answer option differences</div><div class="answer-changes">';
 if(issue.missing?.length)html+=`<div><div class="answer-change-label">In QRE · Not matched in CF</div>${issue.missing.map(x=>`<div class="answer-chip"><mark class="diff-changed">${escape(x)}</mark></div>`).join('')}</div>`;
 if(issue.extra?.length)html+=`<div><div class="answer-change-label">In CF · Not matched in QRE</div>${issue.extra.map(x=>`<div class="answer-chip"><mark class="diff-changed">${escape(x)}</mark></div>`).join('')}</div>`;
 return html+'</div></section>';
}
function manualCandidates(q,query=''){
 const term=query.trim().toLocaleLowerCase();
 const title=P.titleKey(q.title),qid=P.canonicalId(q.qid);
 const norm=s=>String(s||'').toLocaleLowerCase();
 const tokenSet=new Set(norm(q.text).match(/[\p{L}\p{N}]{4,}/gu)||[]);
 return cf.questions.filter(c=>c.qid&&c.entityId&&(c.text||c.title||c.instruction)&&!c.hidden).map(c=>{
  if(term&&!`${c.qid} ${c.title}`.toLocaleLowerCase().includes(term))return null;
  let points=0;
  if(norm(c.qid)===norm(q.qid))points+=100;
  if(P.canonicalId(c.qid)===qid)points+=70;
  if(title&&P.titleKey(c.title)===title)points+=60;
  const words=norm(c.text).match(/[\p{L}\p{N}]{4,}/gu)||[];
  points+=Math.min(32,words.filter(w=>tokenSet.has(w)).length*4);
  return {c,points};
 }).filter(Boolean).filter(x=>term||x.points>=16).sort((a,b)=>b.points-a.points||a.c.qid.localeCompare(b.c.qid)).slice(0,8).map(x=>x.c);
}
function renderManualCandidates(r,term=''){
 const holder=$('mapping-candidates');if(!holder)return;holder.replaceChildren();
 const existing=r.cf;
 const cs=manualCandidates(r.q,term);
 if(!cs.length){const empty=document.createElement('p');empty.className='map-empty';empty.textContent='No relevant questions. Try a QID or title.';holder.append(empty);}
 for(const candidate of cs){
  const btn=document.createElement('button');btn.type='button';btn.className='candidate'+(candidate.entityId===(manual[r.key]||existing?.entityId)?' candidate-current':'');
  const head=document.createElement('strong');head.textContent=candidate.qid;
  const description=document.createElement('span');description.textContent=candidate.title||candidate.text.slice(0,110)||'Untitled question';
  btn.append(head,description);btn.addEventListener('click',()=>{manual[r.key]=candidate.entityId;rerun();});holder.append(btn);
 }
}
function renderDetail(){
 const r=result.rows.find(x=>x.key===chosen);const host=$('detail');host.className='';
 if(!r){host.innerHTML='<div class="detail-empty"><h3>No finding selected</h3><p>Choose a different filter to review other items.</p></div>';return;}
 const c=r.cf,q=r.q;
 const issues=r.issues.filter(x=>x.level!=='info');
 const textIssue=issues.some(x=>x.type==='text'||x.type==='empty-text'||x.type==='dynamic-text');
 let html=`<div class="detail-head"><div><h3>${escape(q.qid)}</h3><div class="detail-subtitle">${escape(q.title||'Question')} ${c?`· CF ${escape(c.qid)}`:''}</div></div><span class="status large ${r.verdict}">${labels[r.verdict]}</span></div>`;
 if(textIssue&&c&&!c.missingRequested)html+=textDiffSection(q,c);
 html+=answerDiffSection(r);
 // A review without text deltas must explain the actual limitation upfront.
 if(!textIssue&&!issues.some(i=>i.type==='answers'&&(i.missing?.length||i.extra?.length))){
  const primary=issues.find(x=>x.level==='review')||issues[0];
  if(primary)html+=`<p class="inline-finding"><strong>${escape(shortFinding(r))}</strong><span>${escape(primary.message)}</span></p>`;
 }
 const remaining=issues.filter(i=>!(i.type==='text'||i.type==='answers'||i.type==='empty-text'||i.type==='dynamic-text'));
 if(remaining.length>1||(remaining.length===1&&(textIssue||issues.some(x=>x.type==='answers')))){
  html+=`<details class="findings-expand"><summary>Other verification notes <span>${remaining.length}</span></summary><div class="findings-body">`;
  for(const issue of remaining)html+=`<div class="notice ${escape(issue.level)}">${escape(issue.message)}</div>`;
  html+='</div></details>';
 }
 html+='<details class="map-expand"><summary>Correct question mapping</summary><div class="map-editor"><label for="mapping-search">Find the corresponding CF question</label><input id="mapping-search" type="search" placeholder="Search QID or question title" autocomplete="off"><div id="mapping-candidates" class="mapping-candidates"></div><button class="map-reset" type="button" id="map-reset">Reset to automatic mapping</button></div></details>';
 host.innerHTML=html;
 const search=$('mapping-search');search.addEventListener('input',()=>renderManualCandidates(r,search.value));
 $('map-reset').addEventListener('click',()=>{delete manual[r.key];rerun();});
 host.querySelector('.map-expand').addEventListener('toggle',e=>{if(e.target.open)renderManualCandidates(r,search.value);});
}
function csvCell(v){let s=String(v??'').replace(/\r?\n/g,' ');if(/^[\s]*[=+@\-\t]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
function downloadCSV(){if(!result)return;
 const head=['QRE QID','QRE title','CF QID','CF title','Status','XML language','Mapping method','Complete QRE question','Complete CF question','QRE options not matched in CF','CF options not matched in QRE','Findings'];
 const rows=result.rows.filter(r=>r.verdict!=='match').map(r=>{
  const hasTextIssue=r.issues.some(i=>i.type==='text'||i.type==='empty-text'||i.type==='dynamic-text');
  const showText=hasTextIssue&&r.cf&&!r.cf.missingRequested;
  const a=r.issues.find(i=>i.type==='answers');
  return [r.q.qid,r.q.title,r.cf?.qid||'',r.cf?.title||'',r.verdict,cf.selectedLanguage,r.reason,showText?r.q.text:'',showText?P.respondentText(r.cf):'',(a?.missing||[]).join(' | '),(a?.extra||[]).join(' | '),r.issues.filter(i=>i.level!=='info').map(i=>i.type+': '+i.message).join(' | ')];
 });
 const csv='\uFEFF'+[head,...rows].map(r=>r.map(csvCell).join(',')).join('\r\n');
 const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='lazyproof-survey-qa-report.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);
}
setupDrop('qre');setupDrop('xml');$('language').addEventListener('change',refreshAnalyze);$('analyze').addEventListener('click',run);
$('change-files').addEventListener('click',()=>{$('results').hidden=true;$('setup').hidden=false;$('error').hidden=true;window.scrollTo(0,0);});
$('export-csv').addEventListener('click',downloadCSV);
$('search').addEventListener('input',()=>{visibleLimit=70;refreshVisible();});$('status-filter').addEventListener('change',()=>{visibleLimit=70;refreshVisible();});
$('load-more').addEventListener('click',()=>{visibleLimit+=70;renderList();});
window.LazyProofApp={testLoad:async(q,x,lang='auto')=>{qre=await P.parseQRE(q);cf=await P.parseSurvey(x,lang);manual={};result=P.compare(qre,cf);renderResults();return {qre,cf,result};},getState:()=>({qre,cf,result})};
})(window.LazyProof=window.LazyProof||{});