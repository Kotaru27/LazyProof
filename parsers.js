/* LazyProof Survey QA · browser-local DOCX and Confirmit survey definition parsers */
(function (P) {
'use strict';
const WORD='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const CHILD_TYPES=new Set(['Single','Multi','Open','Grid','Info','Numeric','Date','Ranking','MultiGrid','SingleGrid','Scale','Boolean','MultiNumeric','MultiOpen']);
const MAX_FILE=35*1024*1024, MAX_XML=40*1024*1024;
function direct(el,name){return Array.from(el?.children||[]).find(e=>e.localName===name)||null;}
function children(el,name){return Array.from(el?.children||[]).filter(e=>e.localName===name);}
function descendants(el,name){return Array.from(el?.getElementsByTagName(name)||[]);}
function txt(el){return (el?.textContent||'').trim();}
function parseXML(str){const d=new DOMParser().parseFromString(str,'application/xml');if(d.getElementsByTagName('parsererror').length)throw Error('Invalid XML. Make sure this is a Confirmit survey definition, not a respondent export.');return d;}
function stripMarkup(s){
 const safe=String(s||'').replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi,'').replace(/<(?:img|iframe|object|embed|audio|video|source|track|link|meta|picture|svg|image|use)\b[^>]*>/gi,'');
 const doc=new DOMParser().parseFromString('<div>'+safe+'</div>','text/html');
 doc.querySelectorAll('script,style,noscript,svg,iframe,template').forEach(n=>n.remove());
 doc.querySelectorAll('br').forEach(n=>n.replaceWith('\n'));
 doc.querySelectorAll('img').forEach(n=>{const a=n.getAttribute('alt')||'';n.replaceWith(document.createTextNode(a?' '+a+' ':' '));});
 doc.querySelectorAll('p,div,li,h1,h2,h3,h4').forEach(n=>n.appendChild(document.createTextNode('\n')));
 return (doc.body?.textContent||'').replace(/\u00a0/g,' ').replace(/[ \t]+/g,' ').replace(/\s*\n\s*/g,'\n').trim();
}
function norm(s){return String(s||'').normalize('NFKC').replace(/\u00a0/g,' ').replace(/[\u2018\u2019]/g,"'").replace(/\s+/g,' ').trim();}
function canonicalId(s){return norm(s).toLowerCase().replace(/^([coh])q/,'q').replace(/(?:_[xy])+(?:_\d+)?$/i,'').replace(/_(\d+)_?[xy]?$/,'');}
async function openZip(file){
 if(!file || file.size>MAX_FILE)throw Error('Choose a ZIP/DOCX file smaller than 35 MB.');
 let z;try{z=await JSZip.loadAsync(file);}catch(e){throw Error('Unable to open ZIP/DOCX: '+e.message);}
 const entries=Object.values(z.files);
 if(entries.length>5000)throw Error('Archive contains too many entries.');
 return z;
}
async function readZipEntry(entry){if(!entry)throw Error('Required XML entry not found.');if(entry._data?.uncompressedSize>MAX_XML)throw Error('ZIP entry is too large to decompress safely.');const raw=await entry.async('uint8array');if(raw.length>MAX_XML)throw Error('Expanded XML exceeds the 40 MB limit.');return new TextDecoder('utf-8').decode(raw);}
function wordP(el){
 const runs=[];let hasStrike=false,hasHighlight=false,hasBold=false,hasItalic=false;
 function visit(node){
  for(const ch of node.children||[]){const n=ch.localName;
   if(n==='del'||n==='delText'||n==='instrText')continue;
   if(n==='t'){runs.push(ch.textContent||'');continue;}
   if(n==='tab'){runs.push('\t');continue;}
   if(n==='br'){runs.push(' ');continue;}
   if(n==='rPr')continue;
   if(n==='r'){
    const pr=direct(ch,'rPr');
    hasStrike ||= Boolean(direct(pr,'strike')||direct(pr,'dstrike'));
    hasHighlight ||= Boolean(direct(pr,'highlight'));
    hasBold ||= Boolean(direct(pr,'b'));
    hasItalic ||= Boolean(direct(pr,'i'));
   }
   visit(ch);
  }
 }
 visit(el);
 const pr=direct(el,'pPr'), style=direct(pr,'pStyle')?.getAttributeNS(WORD,'val')||'';
 const num=direct(pr,'numPr')!==null;
 return {text:norm(runs.join('')),style,num,kind:'paragraph',hasStrike,hasHighlight,hasBold,hasItalic};
}
function parseWordBlocks(doc){
 const body=Array.from(doc.getElementsByTagNameNS(WORD,'body'))[0];
 if(!body)throw Error('No Word document body found.');
 const out=[]; let pIndex=0;
 function walk(container,tableId=''){
  for(const child of Array.from(container.children)){
   const k=child.localName;
   if(k==='p'){
    let b=wordP(child);if(b.text){out.push({...b,index:++pIndex,tableId});}
   }else if(k==='tbl'){
    const tid='table-'+(out.filter(x=>x.kind==='table').length+1)+'-'+(pIndex+1);
    for(const row of children(child,'tr')){
     for(const cell of children(row,'tc'))walk(cell,tid);
    }
   }else if(k==='sdt' || k==='customXml'){
    walk(direct(child,'sdtContent')||child,tableId);
   }
  }
 }
 walk(body);return out;
}
// QRE QID recognition deliberately excludes cross-reference phrases in routing notes.
const QID_RE=/^\s*((?:(?:[coh]?q)[a-z0-9_]*\d[a-z0-9_]*(?:\s+_[a-z0-9]+)*|progrh\d+))\s*(?:\/\s*[A-Za-z]{1,5}[A-Za-z0-9_]*\d[A-Za-z0-9_]*\s*)?[.:]\s*(.*)$/i;
const META_RE=/^(?:note\s+to|routing\s*:|if\s+|only\s+ask|show\s+if|continue\s+only|quality\s*:|soft\s+quota|hard\s+quota|please\s+program|please\s+use|close\s+if|do\s+not|cell\s*\d|\[insert|n\s*=|total\s+n|this\s+is|red\s+herring|answer\s*\d+\s*:|rows\s+[xy]|answers\s+[xy])/i;
const HEADING_RE=/\[\s*(?:SA|MA|OE|Text|Grid|N|Video|Audio|Image|Rating|Dropdown|Single|Multi|Numeric)(?:\b|\s|[-\]])/i;
function isQuestionTitle(s){return Boolean(HEADING_RE.test(s)||(/^[A-Z][^?!]{3,75}$/.test(s)&&/^(?:Gender|Age|Occupation|Aided|Unaided|Non.Rejector|Consideration|Preference|Region|Brand|Open|Creative|Advertising|Ad Awareness|Rating|Feedback|Closing|Red Herring|Plant|Parent|Store|Household|Attitude|Relationship|Celebrity|Social|Type of|B2S|Privacy|Survey introduction|Intro)/i.test(s)));}
function cleanQreText(s){
 // Remove only known bracketed programming annotations; parenthesized respondent text stays intact.
 return norm(s.replace(/\s*Soft quota[^\n]*$/i,'').replace(/\[(?:Screenout|Screen-out|KO|Anchor|Exclusive|Exlusive|if alone[^\]]*|\s*à\s*KO[^\]]*|CLOSE|NOTE TO RM|Single choice|Multiple choice|Randomize(?:d)?|Optional)\]/gi,''));
}
function splitQre(blocks){
 const q=[]; const seen=[];let current=null;let title='';let excluded=0;
 function finish(){
  if(!current)return;
  const content=current.lines;
  const lines=content.filter(x=>x.text&&!META_RE.test(x.text));
  // Identify possible answers only when the QRE actually has an answer-list block.
  const options=[],notes=[];
  for(const b of lines){
   const s=b.text;
   if(b.isOption && s.length<=190 && !/^\d+\.\s*(?:Introduction|Demographic|Creative)/i.test(s)) options.push(cleanQreText(s));
   else notes.push(cleanQreText(s));
  }
  current.partialOptions=options.some(x=>/^(?:\.{2,}|…)$/.test(x));
  current.options=[...new Set(options.filter(x=>x&&!/^(?:\.{2,}|…)$/.test(x)))];
  current.additional=notes.filter(Boolean);
  current.text=cleanQreText([current.stem,...(current.additional.length&&current.additional[0]?.length<180&&!META_RE.test(current.additional[0])&&!current.options.length?[current.additional[0]]:[])].join(' '));
  current.ignoredLines=content.length-lines.length;
  delete current.lines;delete current.stem;
  q.push(current);current=null;
 }
 for(let i=0;i<blocks.length;i++){
  const b=blocks[i],s=b.text;
  if(isQuestionTitle(s) && !QID_RE.test(s)){
   // New headings delimit QRE question even when the following question lacks a coded ID.
   if(current)finish();title=s;continue;
  }
  const m=s.replace(/\s+_/g,'_').match(QID_RE);
  if(m && /^[a-z]/i.test(m[1]) && m[1].length>=3){
   finish();
   const id=m[1].replace(/\s+/g,'');current={qid:id,title:title||'',text:'',options:[],additional:[],lines:[],stem:m[2].trim(),blockIndex:b.index,source:'qre',formatting:{bold:b.hasBold,italic:b.hasItalic,strike:b.hasStrike,highlight:b.hasHighlight}};
   continue;
  }
  if(!current)continue;
  const next=s.match(/^\s*(?:\d{1,4}\.|\d{1,4}\s{2,})(?:\s+)?(.*)$/);
  // Word numbered-list paragraphs often omit the number from w:t; use w:numPr when present.
  const isOption=b.num || (Boolean(next)&& s.length<200);
  if(META_RE.test(s)){excluded++;current.lines.push({...b,isOption:false});continue;}
  current.lines.push({...b,text:(next&&isOption?next[1]:s),isOption});
 }
 finish();return {questions:q,discardedNotes:excluded};
}
async function parseQRE(file){
 if(!file.name.toLowerCase().endsWith('.docx'))throw Error('Please select a .docx Word questionnaire (legacy .doc is not supported).');
 const zip=await openZip(file),d=parseXML(await readZipEntry(zip.file('word/document.xml'))),blocks=parseWordBlocks(d),result=splitQre(blocks);
 const numSDT=d.getElementsByTagNameNS(WORD,'sdt').length;
 return {...result,blocks:blocks.length,contentControls:numSDT,documentName:file.name};
}
// Strict locale isolation: never read text, titles or labels from another language.
// A missing translation is an unresolved coverage gap, NOT a wording mismatch.
function getLangText(parent,language){
 const own=children(parent,'Text').find(x=>x.getAttribute('Language')===language);
 return {text:own?stripMarkup(txt(own)):'',usedLanguage:own?language:'',missingRequested:!own};
}
function getFormTexts(node,language){
 const own=children(direct(node,'FormTexts'),'FormText').find(e=>e.getAttribute('Language')===language);
 function val(name){return own?stripMarkup(txt(direct(own,name))):'';}
 return {title:val('Title'),text:val('Text'),instruction:val('Instruction'),missingRequested:!own,language:own?language:''};
}
function getAnswer(node,language){
 const z=getLangText(direct(node,'Texts'),language);
 // Image metadata is language-neutral; it is not used to borrow text from other locales.
 const media=children(node,'AnswerImageDefault').map(x=>txt(x)).filter(Boolean).join(' ');
 return {code:node.getAttribute('Precode')||'',text:z.text,language:z.usedLanguage,missingRequested:z.missingRequested,image:media||node.getAttribute('DefaultImageUrl')||''};
}
function collectAnswers(root,language,listMap,depth=0){
 const out=[];if(!root||depth>3)return out;
 for(const el of Array.from(root.children)){
  if(el.localName==='Answer'||el.localName==='GridAnswer'||el.localName==='Scale')out.push(getAnswer(el,language));
  if(el.localName==='Predefined'){
   const ref=el.getAttribute('ListSource')||el.getAttribute('ReferencedEntityId');
   if(listMap.has(ref)) out.push(...collectAnswers(listMap.get(ref),language,listMap,depth+1));
   else out.push({code:'',text:'',unresolvedRef:ref});
  }
 }
 return out;
}
// The official ProjectInfo/Languages list is the authoritative list of project
// languages. Numerous other Language attributes belong to embedded template and
// resource translations and MUST NOT become UI choices.
function surveyLanguageInfo(document){
 const root=document.documentElement;
 if(root.localName!=='Project')throw Error('Expected Confirmit Project XML. This does not look like a survey definition.');
 const proj=direct(root,'ProjectInfo'),questionnaire=direct(root,'Questionnaire');
 const routing=direct(direct(questionnaire,'Routing'),'Nodes');
 if(!routing)throw Error('Could not find Questionnaire > Routing > Nodes. Check the export type.');
 const stated=children(direct(proj,'Languages'),'Language').map(txt).filter(x=>/^\d+$/.test(x));
 // Survey declarations take precedence over template and embedded asset languages.
 const found=new Set();
 for(const ft of descendants(routing,'FormText')){
  const id=ft.getAttribute('Language');if(id&&/^\d+$/.test(id))found.add(id);
 }
 const languages=[...new Set(stated.length?stated:[...found])];
 if(!languages.length)throw Error('No survey languages could be identified from this XML.');
 const projectDefault=proj?.getAttribute('DefaultLanguage')||'';
 // The export supplies identifiers, not a trustworthy per-ID language name.
 // Never infer a language from content volume or assume IDs mean German/English.
 const ordered=[...languages].sort((a,b)=>{
  if(a===projectDefault)return -1;if(b===projectDefault)return 1;return Number(a)-Number(b);
 });
 return {languages:ordered.map(id=>({id,name:`Language ${id}`,label:`Language ${id}${id===projectDefault?' · Project default':''}`})),projectDefaultLanguage:projectDefault};
}
function parseCF(document,requestedLang='auto'){
 const root=document.documentElement;
 if(root.localName!=='Project')throw Error('Expected Confirmit Project XML. This does not look like a survey definition.');
 const proj=direct(root,'ProjectInfo');const questionnaire=direct(root,'Questionnaire');
 const routing=direct(direct(questionnaire,'Routing'),'Nodes');
 if(!routing)throw Error('Could not find Questionnaire > Routing > Nodes. Check the export type.');
 const profile=surveyLanguageInfo(document);
 const language=(requestedLang==null||requestedLang==='auto')?profile.projectDefaultLanguage:String(requestedLang);
 // Fail closed rather than silently comparing an XML locale not supported by this survey.
 if(!profile.languages.some(x=>x.id===language))throw Error(`Language ${language} is not listed in this survey definition.`);
 const defaultLanguage=profile.projectDefaultLanguage;
 const predefined=direct(direct(questionnaire,'PredefinedLists'),'Nodes');const listMap=new Map();
 if(predefined)for(const node of Array.from(predefined.children)){if(node.localName==='PredefinedList'){
 const id=node.getAttribute('EntityId');
 const answers=direct(node,'PredefinedListAnswers')||direct(node,'Answers')||direct(node,'GridAnswers');if(id&&answers)listMap.set(id,answers);
 }}
 const questions=[],types={},unresolved=[],duplicates=new Map();
 function visit(node,blockPath=[]){
  for(const ch of Array.from(node.children)){
   if(CHILD_TYPES.has(ch.localName)){
    const name=txt(direct(ch,'Name'));
    const field=getFormTexts(ch,language);
    const category=ch.getAttribute('QuestionCategory')||'';
    const hidden=['Hidden','Background','Panel'].includes(ch.getAttribute('VariableType'))||category.toLowerCase().includes('exclude');
    const answerRoots=Array.from(ch.children).filter(e=>['SingleAnswers','MultiAnswers','OpenAnswers','GridAnswers','Scales','Answers'].includes(e.localName));
    const options=answerRoots.flatMap(e=>collectAnswers(e,language,listMap));
    const p={qid:name,entityId:ch.getAttribute('EntityId')||'',type:ch.localName,title:field.title,text:field.text,instruction:field.instruction,options,language:field.language,missingRequested:field.missingRequested,hidden,path:blockPath.join(' / '),source:'cf'};
    if(!name && !field.text && !field.title)continue;
    questions.push(p);types[ch.localName]=(types[ch.localName]||0)+1;
    if(name){const arr=duplicates.get(name)||[];arr.push(questions.length-1);duplicates.set(name,arr);}
    if(options.some(e=>e.unresolvedRef))unresolved.push(name||p.entityId);
   }else if(ch.localName==='Condition'||ch.localName==='Loop'||ch.localName==='Block'){
    const n=txt(direct(ch,'Name'))||ch.getAttribute('EntityId')||ch.localName;
    visit(ch,[...blockPath,n]);
   }else if(ch.children.length){visit(ch,blockPath);}
  }
 }
 visit(routing);
 return {questions,project:proj?.getAttribute('Name')||'',projectId:proj?.getAttribute('ProjectId')||'',defaultLanguage,selectedLanguage:language,availableLanguages:profile.languages,types,unresolvedRefs:unresolved,duplicates:[...duplicates.entries()].filter(([k,v])=>v.length>1).map(([k,v])=>k),totalLists:listMap.size};
}
let cachedSurvey=null;
async function loadSurveyDocument(file){
 if(cachedSurvey?.file===file)return cachedSurvey.document;
 let xml;
 if(file.name.toLowerCase().endsWith('.xml')){if(file.size>MAX_XML)throw Error('XML exceeds the 40 MB limit.');xml=await file.text();}
 else if(file.name.toLowerCase().endsWith('.zip')){
  const zip=await openZip(file);const paths=Object.keys(zip.files).filter(p=>/\.xml$/i.test(p)&&!zip.files[p].dir);
  if(!paths.length)throw Error('No XML file found inside the survey ZIP.');
  // Reject ambiguous bundles instead of silently picking the wrong definition.
  if(paths.length>1)throw Error('ZIP contains multiple XML files. Export a single survey definition XML.');
  xml=await readZipEntry(zip.file(paths[0]));
 }else throw Error('Please select a Confirmit .xml or .zip survey definition.');
 const document=parseXML(xml);
 cachedSurvey={file,document};
 return document;
}
async function inspectSurveyLanguages(file){return surveyLanguageInfo(await loadSurveyDocument(file));}
async function parseSurvey(file,language='auto'){
 return parseCF(await loadSurveyDocument(file),language);
}
P.parseQRE=parseQRE;P.parseSurvey=parseSurvey;P.inspectSurveyLanguages=inspectSurveyLanguages;P.surveyLanguageInfo=surveyLanguageInfo;P.parseCF=parseCF;P.splitQre=splitQre;P.normalize=norm;P.canonicalId=canonicalId;P.stripMarkup=stripMarkup;P.parseXML=parseXML;
})(window.LazyProof=window.LazyProof||{});