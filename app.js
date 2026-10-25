(function(P){
'use strict';
const $=id=>document.getElementById(id);
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let qFile=null,xFile=null,qre=null,cf=null,result=null;
let manual={},confirmations={},inspected={},chosen=null,visibleLimit=70;
let languageReady=false,languageScan=0,runScan=0,busy=false,lastDetailKey=null;
const labels={match:'Source match',mismatch:'Observed change',review:'Needs review',unmapped:'Unpaired'};
const evidenceLabels={same:'Same',different:'Changed',unverified:'Not verified','not-applicable':'N/A','variable-source-found':'Variant in XML'};
const mappingLabels={corroborated:'Auto-paired','user-confirmed':'Confirmed by you','needs-confirmation':'Check pairing',unmapped:'Unpaired'};
const announce=s=>$('action-status').textContent=s;
function refreshAnalyze(){ $('analyze').disabled=busy||!(qFile&&xFile&&languageReady&&$('language').value); }
function setInput(type,file){
 if(!file||busy)return;
 runScan++;
 const isQ=type==='qre',allowed=isQ?/\.docx$/i:/\.(xml|zip)$/i;
 if(!allowed.test(file.name)||file.size>35*1024*1024){
  if(isQ)qFile=null;
  else{xFile=null;languageReady=false;languageScan++;$('language-block').hidden=true;}
  $(type+'-status').textContent='No valid file selected';
  $(type+'-size').textContent=isQ?'DOCX':'XML / ZIP';
  $(type+'-drop').classList.remove('has-file');refreshAnalyze();
  showError(!allowed.test(file.name)?`Unsupported ${type.toUpperCase()} format. ${isQ?'Select .docx':'Select .xml or .zip'}.`:'Files must be smaller than 35 MB.');return;
 }
 if(isQ)qFile=file;
 else{xFile=file;languageReady=false;$('language-block').hidden=true;}
 $(type+'-status').textContent=file.name;
 $(type+'-size').textContent=(file.size/1024/1024).toFixed(2)+' MB';
 $(type+'-drop').classList.add('has-file');$('error').hidden=true;refreshAnalyze();
 if(!isQ)loadAvailableLanguages(file);
}
async function loadAvailableLanguages(file){
 const scan=++languageScan;$('xml-status').textContent='Reading survey languages…';
 try{
  const profile=await P.inspectSurveyLanguages(file);
  if(scan!==languageScan||xFile!==file)return;
  const picker=$('language');picker.replaceChildren();picker.add(new Option('Select language…',''));
  for(const locale of profile.languages)picker.add(new Option(locale.label,locale.id));
  picker.value='';$('language-block').hidden=false;languageReady=true;
  $('xml-status').textContent=file.name;refreshAnalyze();
 }catch(e){
  if(scan!==languageScan||xFile!==file)return;
  languageReady=false;refreshAnalyze();$('language-block').hidden=true;
  $('xml-status').textContent='Could not read survey XML';showError(e.message||String(e));
 }
}
function setupDrop(type){
 const d=$(type+'-drop'),input=$(type+'-file');
 input.addEventListener('change',e=>setInput(type,e.target.files?.[0]));
 d.addEventListener('keydown',e=>{if(!busy&&e.target===d&&(e.key==='Enter'||e.key===' ')){e.preventDefault();input.click();}});
 ['dragenter','dragover'].forEach(evt=>d.addEventListener(evt,e=>{e.preventDefault();if(!busy)d.classList.add('dragover');}));
 ['dragleave','drop'].forEach(evt=>d.addEventListener(evt,e=>{e.preventDefault();d.classList.remove('dragover');if(evt==='drop')setInput(type,e.dataTransfer?.files?.[0]);}));
}
function showError(message){$('error').textContent=message;$('error').hidden=false;}
function resetSession(){manual={};confirmations={};inspected={};lastDetailKey=null;chosen=null;visibleLimit=70;$('status-filter').value='attention';$('search').value='';}
async function run(){
 if(busy||!qFile||!xFile||!$('language').value)return;
 busy=true;refreshAnalyze();const scan=++runScan;
 const inputQ=qFile,inputX=xFile,language=$('language').value;
 $('analyze').textContent='Comparing all questions…';$('error').hidden=true;
 for(const id of ['qre-file','xml-file','language'])$(id).disabled=true;
 await new Promise(resolve=>setTimeout(resolve,32));
 try{
  const parsedQ=await P.parseQRE(inputQ),parsedCF=await P.parseSurvey(inputX,language);
  if(scan!==runScan)return;
  if(!parsedQ.questions.length)throw Error('No recognizable QIDs were extracted from this Word QRE. Review document layout before using results.');
  if(!parsedCF.questions.length)throw Error('No questions were found in the Confirmit routing tree.');
  qre=parsedQ;cf=parsedCF;resetSession();result=P.compare(qre,cf);
  $('setup').hidden=true;$('results').hidden=false;renderResults();window.scrollTo({top:0,behavior:'instant'});
 }catch(e){showError(e.message||String(e));}
 finally{
  busy=false;for(const id of ['qre-file','xml-file','language'])$(id).disabled=false;
  refreshAnalyze();$('analyze').innerHTML='Compare files <span aria-hidden="true">↗</span>';
 }
}
function rerun(){const key=chosen;result=P.compare(qre,cf,manual,confirmations);renderResults(key);}
function renderResults(selected=chosen){
 const s=result.summary;
 $('project-name').textContent=(cf.project||cf.projectId||'Confirmit survey')+' · XML language '+cf.selectedLanguage+' only';
 $('stat-qre').textContent=s.qre;$('stat-mismatch').textContent=s.observedChanges;
 $('stat-review').textContent=s.reviewOnly;$('stat-unmapped').textContent=s.unpaired;
 $('coverage-note').textContent=`${s.mapped}/${s.qre} QRE entries paired automatically or by you · ${s.matches} source matches · ${s.pairingChecks} pairing checks · ${s.changesNeedMapping} source change(s) need pairing confirmation`;
 renderAdditionalCF();chosen=selected;refreshVisible();
}
function renderAdditionalCF(){
 const extra=result.actionableExtras||[],host=$('additional-cf-list');
 $('additional-cf-review').hidden=!extra.length;$('additional-cf-count').textContent=extra.length+' unpaired respondent-text candidates';host.replaceChildren();
 for(const c of extra.slice(0,150)){
  const row=document.createElement('div');row.className='additional-cf-row';
  const name=document.createElement('strong');name.textContent='CF '+c.qid;
  const excerpt=document.createElement('span');excerpt.textContent=P.respondentText(c)||c.title;
  row.append(name,excerpt);host.append(row);
 }
 if(extra.length>150){const t=document.createElement('p');t.textContent=(extra.length-150)+' more candidates are included in the separate CF rows of the CSV.';host.append(t);}
}
function filteredRows(){
 if(!result)return [];
 const filter=$('status-filter').value,term=$('search').value.trim().toLocaleLowerCase();
 return result.rows.filter(r=>{
  const attention=r.verdict!=='match';
  const included=filter==='all'||(filter==='attention'&&attention)||(filter==='matches'&&!attention)||
   (filter==='changes'&&r.evidence.hasChange)||(filter==='mapping'&&(!r.cf||r.evidence.mapping==='needs-confirmation'))||
   (filter==='review'&&r.cf&&r.verdict==='review'&&!r.evidence.hasChange)||(filter==='unmapped'&&!r.cf)||
   (filter==='pending'&&attention&&!inspected[r.key]);
  const haystack=[r.q.qid,r.q.title,r.q.text,r.cf?.qid,r.cf?.title,P.respondentText(r.cf),...(r.q.options||[]),...(r.cf?.options||[]).map(o=>o.text),...(r.q.unclassifiedLines||[])].join(' ').toLocaleLowerCase();
  return included&&(!term||haystack.includes(term));
 });
}
function refreshVisible(){
 if(!result)return;
 const rows=filteredRows();if(!rows.some(r=>r.key===chosen))chosen=rows[0]?.key||null;
 renderList(rows);renderDetail();
 const attention=result.rows.filter(r=>r.verdict!=='match'),done=attention.filter(r=>inspected[r.key]).length;
 $('review-progress').textContent=`${done}/${attention.length} exceptions marked inspected · ${result.summary.matches} source matches need no individual approval`;
}
function shortFinding(r){
 const types=new Set(r.issues.filter(i=>i.level!=='info').map(i=>i.type));
 if(r.evidence.hasChange)return [r.evidence.text==='different'?'Wording changed':'',r.evidence.answers==='different'?'Answers changed':''].filter(Boolean).join(' · ');
 if(!r.cf)return r.reason==='ambiguous'?'Multiple CF candidates':r.reason==='duplicate-qre'?'Repeated QRE QID':'No unique CF pairing';
 if(types.has('qre-completeness'))return 'Unclassified Word paragraphs';
 if(types.has('qre-numbering'))return 'Check typed answer numbering';
 if(types.has('dynamic-source'))return `Variable source · variant ${r.variantNumber||1}/${r.variantTotal||1}`;
 if(types.has('grid-row')||types.has('grid'))return 'Grid structure needs review';
 if(types.has('dynamic-text')||types.has('piping'))return 'Variable wording needs review';
 if(types.has('empty-text')||types.has('locale')||types.has('answer-locale'))return 'Selected-language copy incomplete';
 return r.verdict==='match'?'Static sources agree':r.issues.find(i=>i.level!=='info')?.message||'Needs inspection';
}
function evidenceMarkup(value,label){return `<span class="evidence ${value==='different'?'changed':value==='same'?'same':'unknown'}"><span>${label}</span>${escape(evidenceLabels[value]||value)}</span>`;}
function renderList(rows=filteredRows()){
 $('visible-count').textContent=`${rows.length} of ${result.rows.length} entries`;
 const holder=$('question-list'),scroll=holder.scrollTop;holder.replaceChildren();
 if(!rows.length){const p=document.createElement('p');p.className='notfound';p.textContent='No entries for this filter. Try All pairings or clear your search.';holder.append(p);}
 else{
  const table=document.createElement('table');table.className='pairing-table';
  table.innerHTML='<caption class="sr-only">QRE and CF pairings with independent source and mapping checks</caption><thead><tr><th scope="col">QRE QID</th><th scope="col">CF QID</th><th scope="col">Source checks</th><th scope="col">Pairing</th></tr></thead>';
  const body=document.createElement('tbody');
  for(const r of rows.slice(0,visibleLimit)){
   const tr=document.createElement('tr');tr.className=(r.key===chosen?'selected ':'')+(inspected[r.key]?'inspected':'');
   tr.innerHTML=`<td><button type="button" class="qid-button" aria-label="Inspect QRE ${escape(r.q.qid)}, CF ${escape(r.cf?.qid||'unpaired')}${r.variantTotal?', variant '+r.variantNumber+' of '+r.variantTotal:''}" ${r.key===chosen?'aria-current="true"':''}>${escape(r.q.qid)}${r.variantTotal?` <small>${r.variantNumber}/${r.variantTotal}</small>`:''}</button><span class="row-finding">${escape(shortFinding(r))}</span>${inspected[r.key]?'<span class="inspected-label">✓ Inspected</span>':''}</td><td><strong class="cf-qid">${escape(r.cf?.qid||'—')}</strong><span class="row-title">${escape(r.cf?(r.cf.title||'No selected-language title'):(r.candidates?.length?r.candidates.length+' candidates':'No pairing'))}</span></td><td>${evidenceMarkup(r.evidence.text,'Text')}${evidenceMarkup(r.evidence.answers,'Answers')}</td><td><span class="pairing-state ${r.evidence.mapping==='needs-confirmation'||!r.cf?'needs-check':''}">${escape(mappingLabels[r.evidence.mapping])}</span></td>`;
   const open=()=>{chosen=r.key;refreshVisible();};tr.querySelector('button').addEventListener('click',open);
   tr.addEventListener('click',e=>{if(!e.target.closest('button'))open();});body.append(tr);
  }
  table.append(body);holder.append(table);
 }
 holder.scrollTop=scroll;$('load-more').hidden=rows.length<=visibleLimit;
}
function fullDiffHtml(parts){return parts.length?parts.map(x=>`<span class="${x.changed?'diff-changed':'diff-match'}">${escape(x.text)}</span>`).join(' '):'<span class="diff-absent">[No extracted text]</span>';}
function textDiffSection(q,c,compare=true){
 const pair=compare?P.fullComparison(q.text,P.respondentText(c)):null;
 return `<section class="diff-section" aria-label="Full question wording comparison"><div class="section-title">Respondent wording <span>${compare?'Green matches · Red differs':'Source passages · comparison not established'}</span></div><div class="diff-pair"><div class="diff-line"><strong>QRE</strong><p>${compare?fullDiffHtml(pair.qre):escape(q.text)||'[No extracted text]'}</p></div><div class="diff-line"><strong>CF</strong><p>${c?(compare?fullDiffHtml(pair.xml):escape(P.respondentText(c))||'[No text in selected language]'):'[No paired question]'}</p></div></div></section>`;
}
function answerDiffSection(r){
 if(!r.q.options?.length&&!r.cf?.options?.length)return '';
 const diff=r.evidence.answers==='different'?r.answers:null;
 const qMissing=(diff?.missing||[]).slice(),cExtra=(diff?.extra||[]).slice();
 function item(text,code,which){
  const copy=which==='qre'?P.cleanOption(text):P.normalize(text),remaining=which==='qre'?qMissing:cExtra;
  const index=remaining.findIndex(x=>P.normalize(x)===P.normalize(copy)),changed=index>=0;
  if(changed)remaining.splice(index,1);
  return `<li ${changed?'class="answer-diff"':''}>${code?`<code>${escape(code)}</code>`:''}${escape(text)||'[No label in selected language]'}</li>`;
 }
 return `<details class="answers-expand" ${diff?'open':''}><summary>Complete answer lists <span>${r.q.options.length} QRE / ${r.cf?.options.length||0} CF</span></summary><p class="map-help">Label comparison ignores answer order and code changes. Red marks unmatched labels only when the lists are comparable.</p><div class="answer-pair"><div><strong>QRE ${escape(r.q.qid)}</strong><ol class="answers">${r.q.options.map(s=>item(s,'','qre')).join('')||'<li>[No options extracted]</li>'}</ol></div><div><strong>CF ${escape(r.cf?.qid||'—')}</strong><ol class="answers">${(r.cf?.options||[]).map(o=>item(o.text,o.code,'cf')).join('')||'<li>[No options extracted]</li>'}</ol></div></div></details>`;
}
function manualCandidates(r,query=''){
 const term=query.trim().toLocaleLowerCase(),title=P.titleKey(r.q.title),qid=P.canonicalId(r.q.qid);
 const words=new Set((r.q.text||'').toLocaleLowerCase().match(/[\p{L}\p{N}]{4,}/gu)||[]);
 const actual=new Set((r.candidates||[]).map(c=>c.entityId));
 return cf.questions.filter(c=>c.qid&&c.entityId).map(c=>{
  const haystack=[c.qid,c.title,P.respondentText(c),c.path,c.entityId].join(' ').toLocaleLowerCase();
  if(term&&!haystack.includes(term))return null;
  let points=actual.has(c.entityId)?300:0;
  if(c.entityId===r.cf?.entityId)points+=200;
  if(c.qid.toLocaleLowerCase()===r.q.qid.toLocaleLowerCase())points+=100;
  if(P.canonicalId(c.qid)===qid)points+=70;
  if(title&&P.titleKey(c.title)===title)points+=60;
  points+=Math.min(32,[...(P.respondentText(c).toLocaleLowerCase().match(/[\p{L}\p{N}]{4,}/gu)||[])].filter(w=>words.has(w)).length*4);
  return {c,points};
 }).filter(Boolean).filter(x=>term||x.points>=16).sort((a,b)=>b.points-a.points||a.c.qid.localeCompare(b.c.qid)).slice(0,20).map(x=>x.c);
}
function renderManualCandidates(r,term=''){
 const holder=$('mapping-candidates');if(!holder)return;holder.replaceChildren();
 const candidates=manualCandidates(r,term);
 if(!candidates.length){const p=document.createElement('p');p.className='map-empty';p.textContent='No candidates. Search a QID, wording, path or entity ID.';holder.append(p);}
 for(const c of candidates){
  const card=document.createElement('div');card.className='candidate'+(c.entityId===r.cf?.entityId?' candidate-current':'');
  const heading=document.createElement('strong');heading.textContent='CF '+c.qid+' · '+(c.title||'No selected-language title');
  const text=document.createElement('p');text.textContent=P.respondentText(c)||'[No text in selected language]';
  const meta=document.createElement('small');meta.textContent=[c.type,c.hidden?'Hidden node':'',c.missingRequested?'Selected language missing':'',c.path||'Root',c.entityId].filter(Boolean).join(' · ');
  const btn=document.createElement('button');btn.type='button';btn.className='small-btn';btn.textContent=c.entityId===r.cf?.entityId?'Current pairing':'Use this pairing';btn.disabled=c.entityId===r.cf?.entityId;
  btn.addEventListener('click',()=>{manual[r.key]=c.entityId;confirmations={};inspected={};rerun();announce('Pairing changed. Recheck the source comparison; previous review marks were cleared.');});
  card.append(heading,text,meta,btn);holder.append(card);
 }
 if(candidates.length===20){const p=document.createElement('p');p.className='map-empty';p.textContent='Showing the first 20 candidates. Refine your search if needed.';holder.append(p);}
}
function canConfirm(r){return r.cf&&r.cf.entityId&&!r.issues.some(i=>['duplicate-mapping','grid-row','ambiguous','duplicate'].includes(i.type));}
function renderDetail(){
 const r=result.rows.find(x=>x.key===chosen),host=$('detail');host.className='';
 if(!r){host.innerHTML='<div class="detail-empty"><h3>No entry selected</h3><p>Choose All pairings to see every automatic comparison.</p></div>';return;}
 if(lastDetailKey!==r.key){host.parentElement.scrollTop=0;lastDetailKey=r.key;}
 const q=r.q,c=r.cf,issues=r.issues.filter(i=>i.level!=='info');
 const top=r.evidence.hasChange?(r.evidence.changeIsProvisional?'Change · check pairing':'Observed change'):labels[r.verdict];
 let html=`<div class="detail-head"><div><div class="qid-pair"><div><span>QRE QID</span><h3>${escape(q.qid)}</h3></div><span class="pair-arrow" aria-hidden="true">→</span><div><span>CF QID</span><h3>${escape(c?.qid||'Unpaired')}</h3></div></div><div class="detail-subtitle">${r.variantTotal?'Variant '+r.variantNumber+' of '+r.variantTotal+' · ':''}${escape(q.title||'Untitled QRE entry')}</div></div><span class="status large ${r.evidence.hasChange?'mismatch':r.verdict}">${escape(top)}</span></div>`;
 html+=`<div class="detail-checks">${evidenceMarkup(r.evidence.text,'Text')}${evidenceMarkup(r.evidence.answers,'Answers')}<span>${escape(mappingLabels[r.evidence.mapping])}</span></div>`;
 if(r.evidence.mapping==='needs-confirmation')html+='<p class="mapping-caution"><strong>Check question identity.</strong> This pairing is provisional. Confirm only when these passages belong to the same question; structural and runtime checks remain separate.</p>';
 if(!c)html+='<p class="mapping-caution">No unique CF pairing is established. Inspect the candidates below; this does not prove the question is missing from the survey.</p>';
 if(c&&canConfirm(r)&&r.evidence.mapping!=='corroborated')html+=`<button type="button" class="small-btn" id="confirm-pairing">${r.userConfirmed?'Undo pairing confirmation':'Confirm this pairing'}</button>`;
 // Every row remains inspectable, including matches, answer-only and mapping reviews.
 html+=textDiffSection(q,c,Boolean(c&&!c.missingRequested&&r.reason!=='grid-parent'&&!['unverified','variable-source-found'].includes(r.evidence.text)));
 if(q.unclassifiedLines?.length)html+=`<section class="unclassified"><strong>QRE paragraphs not included in the wording comparison</strong><p>Check these against the original Word document before accepting this result.</p>${q.unclassifiedLines.map(s=>`<blockquote>${escape(s)}</blockquote>`).join('')}</section>`;
 if(q.numericOptionLines?.length)html+=`<section class="unclassified"><strong>Original numbered QRE answer lines</strong><p>Confirm whether the numeric prefixes are answer codes or visible parts of the labels.</p>${q.numericOptionLines.map(s=>`<blockquote>${escape(s)}</blockquote>`).join('')}</section>`;
 html+=answerDiffSection(r);
 if(issues.length){html+=`<details class="findings-expand"><summary>Verification notes <span>${issues.length}</span></summary><div class="findings-body">${issues.map(i=>`<div class="notice ${escape(i.level)}">${escape(i.message)}</div>`).join('')}</div></details>`;}
 html+=`<details class="map-expand" ${!c?'open':''}><summary>${c?'Change question pairing':'Choose a CF pairing'}</summary><div class="map-editor"><label for="mapping-search">Find the corresponding CF question</label><input id="mapping-search" type="search" placeholder="QID, wording, path or entity ID" autocomplete="off"><p class="map-help">Suggestions are not approvals. Read the candidate text before choosing.</p><div id="mapping-candidates" class="mapping-candidates"></div>${manual[r.key]?'<button class="map-reset" type="button" id="map-reset">Reset to automatic pairing</button>':''}</div></details>`;
 html+=`<div class="review-actions"><button type="button" class="outline-btn" id="mark-inspected" aria-pressed="${Boolean(inspected[r.key])}">${inspected[r.key]?'Undo inspected mark':'Mark inspected'}</button><button type="button" class="outline-btn" id="next-entry">Next exception →</button><small>Inspection does not change the automatic result.</small></div>`;
 host.innerHTML=html;
 $('mapping-search').addEventListener('input',e=>renderManualCandidates(r,e.target.value));
 const map=host.querySelector('.map-expand');map.addEventListener('toggle',()=>{if(map.open)renderManualCandidates(r,$('mapping-search').value);});if(map.open)renderManualCandidates(r);
 $('map-reset')?.addEventListener('click',()=>{delete manual[r.key];confirmations={};inspected={};rerun();announce('Automatic pairing restored. Review marks cleared.');});
 $('confirm-pairing')?.addEventListener('click',()=>{if(r.userConfirmed)delete confirmations[r.key];else confirmations[r.key]=c.entityId;delete inspected[r.key];rerun();announce(r.userConfirmed?'Pairing confirmation removed.':'Pairing confirmed by you. Source checks remain automatic.');});
 $('mark-inspected').addEventListener('click',()=>{if(inspected[r.key])delete inspected[r.key];else inspected[r.key]=true;refreshVisible();$('mark-inspected')?.focus();announce('Inspection mark updated. Automatic evidence unchanged.');});
 $('next-entry').addEventListener('click',()=>{
  const pending=result.rows.filter(x=>x.verdict!=='match'&&!inspected[x.key]);
  const currentIndex=result.rows.findIndex(x=>x.key===r.key),next=pending.find(x=>result.rows.indexOf(x)>currentIndex)||pending.find(x=>x.key!==r.key);
  if(!next){announce('No other uninspected exception.');return;}
  $('status-filter').value='pending';$('search').value='';chosen=next.key;visibleLimit=Math.max(70,pending.indexOf(next)+1);refreshVisible();$('question-list').querySelector('[aria-current="true"]')?.scrollIntoView({block:'nearest',inline:'nearest'});$('mark-inspected').focus({preventScroll:true});
 });
}
function csvCell(v){let s=String(v??'').replace(/\r?\n/g,' ');if(/^[\s]*[=+@\-\t]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
function downloadCSV(){
 if(!result)return;
 const head=['Record type','QRE QID','QRE title','CF QID','CF title','Status','Observed text','Observed answers','Mapping confidence','Human inspection','Review category','XML language','Mapping method','Complete QRE question','Complete CF question','All QRE answers','All CF answers','Unclassified QRE paragraphs','Original numbered QRE answers','QRE options not matched in CF','CF options not matched in QRE','CF entity ID','Findings'];
 const rows=result.rows.map(r=>['QRE pairing',r.q.qid,r.q.title,r.cf?.qid||'',r.cf?.title||'',r.verdict,r.evidence.text,r.evidence.answers,r.evidence.mapping,inspected[r.key]?'inspected':'not inspected',r.evidence.reviewGroup,cf.selectedLanguage,r.reason,r.q.text,P.respondentText(r.cf),(r.q.options||[]).join(' | '),(r.cf?.options||[]).map(o=>o.text||'[No selected-language label]').join(' | '),(r.q.unclassifiedLines||[]).join(' | '),(r.q.numericOptionLines||[]).join(' | '),(r.answers?.missing||[]).join(' | '),(r.answers?.extra||[]).join(' | '),r.cf?.entityId||'',r.issues.filter(i=>i.level!=='info').map(i=>i.type+': '+i.message).join(' | ')]);
 for(const c of result.actionableExtras||[])rows.push(['Unpaired CF candidate','','',c.qid,c.title,'review','unverified','unverified','unmapped','not inspected','CF coverage',cf.selectedLanguage,'none','',P.respondentText(c),'',c.options.map(o=>o.text).join(' | '),'','','','',c.entityId,'Not a confirmed defect; routing and QRE coverage may differ.']);
 const csv='\uFEFF'+[head,...rows].map(row=>row.map(csvCell).join(',')).join('\r\n');
 const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='lazyproof-survey-qa-report.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);
}
setupDrop('qre');setupDrop('xml');
$('language').addEventListener('change',()=>{runScan++;refreshAnalyze();});$('analyze').addEventListener('click',run);
$('change-files').addEventListener('click',()=>{$('results').hidden=true;$('setup').hidden=false;$('error').hidden=true;window.scrollTo(0,0);});
$('export-csv').addEventListener('click',downloadCSV);
$('search').addEventListener('input',()=>{visibleLimit=70;$('question-list').scrollTop=0;refreshVisible();});$('status-filter').addEventListener('change',()=>{visibleLimit=70;$('question-list').scrollTop=0;refreshVisible();});
$('load-more').addEventListener('click',()=>{visibleLimit+=70;renderList();});
window.LazyProofApp={testLoad:async(q,x,lang='auto')=>{qre=await P.parseQRE(q);cf=await P.parseSurvey(x,lang);resetSession();result=P.compare(qre,cf);$('setup').hidden=true;$('results').hidden=false;renderResults();return {qre,cf,result};},getState:()=>({qre,cf,result,manual,confirmations,inspected})};
})(window.LazyProof=window.LazyProof||{});
