/* LazyProof · conservative, auditable mapping + comparison. No probabilistic match is ever auto-approved. */
(function(P){'use strict';
const esc=(s)=>String(s??'');
function normalizeText(s){return P.normalize(s).replace(/\s+([.,!?;:])/g,'$1').toLocaleLowerCase();}
function exact(a,b){return normalizeText(a)===normalizeText(b);}
function codeClean(s){return String(s||'').toLowerCase().replace(/^([coh])q/,'q').replace(/_x$/,'').replace(/_y$/,'');}
function cleanOption(s){return P.normalize(String(s||'').replace(/^\s*\d{1,4}\.\s*/,'').replace(/\s*\[(?:screenout|screen-out|anchor|exlusive(?:\. anchor)?|exclusive(?:, anchor)?|ko|if alone[^\]]*)\]\s*/ig,'').replace(/\s*\(\s*(?:naturall?\s+fallout|exclusive|anchor|exlusive)(?:[,. ]+(?:anchor|exclusive))?\s*\)\s*$/ig,'')).replace(/\s+/g,' ').trim();}
function titleKey(s){return P.normalize(s).replace(/\[[^\]]+\]/g,'').replace(/\b(?:randomise|randomize|randomized|answers|sa|ma|oe|text|grid|single choice|multiple choice)\b/gi,'').replace(/[^\p{L}\p{N}]/gu,'').toLowerCase();}
function bagDifference(qreOptions,xmlOptions){
 const left=qreOptions.map(x=>cleanOption(x)).filter(Boolean);
 const right=xmlOptions.filter(o=>o.text).map(x=>cleanOption(x.text)).filter(Boolean);
 const unmatchedRight=right.slice(), missing=[];
 for(const a of left){const idx=unmatchedRight.findIndex(b=>exact(a,b));if(idx<0)missing.push(a);else unmatchedRight.splice(idx,1);}
 return {missing,extra:unmatchedRight,referenceCount:left.length,actualCount:right.length};
}
function classify(q,cf,reason){
 const issues=[];
 if(reason==='grid-parent')return {verdict:'review',issues:[{type:'grid-row',level:'review',message:'QRE item maps to a CF grid parent. Row-level wording cannot be automatically established from this question-level pairing.'}],answers:{missing:[],extra:[],referenceCount:q.options.length,actualCount:cf.options.length}};
 let qText=q.text||'';const cfText=cf.text||'';
 // Text is exact only after whitespace/punctuation normalization. XML may append visible instructions to a text field.
 const qt=normalizeText(qText), ct=normalizeText(cfText);
 const validText=qt && (qt===ct || (ct.startsWith(qt)&& /[.!?\n]/.test(qt.slice(-2))));
 if(!qt)issues.push({type:'unparsed-text',level:'review',message:'QRE question wording was not extracted.'});
 else if(!ct)issues.push({type:'empty-text',level:cf.fallbackText?'review':'mismatch',message:cf.fallbackText?'Programmed text is empty in selected language; another language has text. Display fallback requires review.':'Programmed question text is empty in selected language.'});
 else if(!validText)issues.push({type:'text',level:'mismatch',message:'Question wording differs.'});
 const ans=bagDifference(q.options||[],cf.options||[]);
 if(ans.referenceCount>0){
  if(!ans.actualCount)issues.push({type:'answers',level:'review',message:`QRE contains ${ans.referenceCount} candidate answers, but no comparable CF answers were extracted.`});
  else if(ans.missing.length||(ans.extra.length&&!q.partialOptions)){
   // Grid and loop answers may be flattened differently: classify for review to avoid a false definitive mismatch.
   const grid=cf.type==='Grid';
   issues.push({type:'answers',level:grid?'review':'mismatch',message:`Answer differences: ${ans.missing.length} absent from XML; ${q.partialOptions?'extra answers not fully compared (abbreviated QRE)':ans.extra.length+' extra in XML'}.`,missing:ans.missing,extra:q.partialOptions?[]:ans.extra});
  }
 }
 if(q.partialOptions)issues.push({type:'abbreviated-list',level:'review',message:'QRE answer list uses an ellipsis; extra XML answers cannot be reliably classified.'});
 if(cf.fallbackInstruction)issues.push({type:'locale',level:'review',message:'Selected language has no instruction; another language contains one. Actual display fallback is unverified.'});
 if(cf.missingRequested)issues.push({type:'locale',level:'review',message:'Selected language missing; XML data was taken from another language.'});
 if(cf.hidden)issues.push({type:'hidden',level:'review',message:'This XML node is hidden or excluded from layout; respondent visibility is not verified.'});
 if(cf.options.some(o=>o.unresolvedRef))issues.push({type:'references',level:'review',message:'An answer list reference could not be resolved.'});
 if(cf.type==='Grid')issues.push({type:'grid',level:'review',message:'Grid rows/scales may not correspond one-to-one with QRE answer lines; inspect manually.'});
 if(/\^[^\^\n]+\^/.test(cf.text||''))issues.push({type:'piping',level:'review',message:'Question includes dynamic expressions; rendered text cannot be verified from XML.'});
 if(q.options?.length===0 && cf.options.length>0)issues.push({type:'answers-unparsed',level:'review',message:'XML contains answer options but QRE answer options were not confidently extracted.'});
 if(reason==='title')issues.push({type:'mapping',level:'review',message:'Matched by unique title rather than question identifier. Confirm this mapping.'});
 if(reason==='grid-parent')issues.push({type:'mapping',level:'review',message:'QRE question may be a row of a CF grid; validate row-level mapping before approving.'});
 if(esc(q.qid).toLowerCase()!==esc(cf.qid).toLowerCase())issues.push({type:'qid',level:'info',message:`QIDs differ: ${q.qid} → ${cf.qid}.`});
 const verdict=issues.some(x=>x.level==='mismatch')?'mismatch':issues.some(x=>x.level==='review')?'review':'match';
 return {issues,answers:ans,verdict};
}
function compare(qre,cf,manual={}){
 const out=[], used=new Set(), ids=new Map(), canonical=new Map(), titles=new Map();
 for(const x of cf.questions){
  if(x.qid){const a=ids.get(x.qid.toLowerCase())||[];a.push(x);ids.set(x.qid.toLowerCase(),a);
   const c=P.canonicalId(x.qid);const l=canonical.get(c)||[];l.push(x);canonical.set(c,l);}
  const title=titleKey(x.title);if(title.length>=5){const l=titles.get(title)||[];l.push(x);titles.set(title,l);}
 }
 const countQ=new Map();for(const x of qre.questions){const k=x.qid.toLowerCase();countQ.set(k,(countQ.get(k)||0)+1);}
 for(const q of qre.questions){
  const key=q.qid+'@'+q.blockIndex;
  let candidates=[],reason='',match=null;
  if(manual[key]){candidates=cf.questions.filter(x=>x.entityId===manual[key]);reason='manual';}
  else {
   if(countQ.get(q.qid.toLowerCase())>1){out.push({q,cf:null,verdict:'review',reason:'duplicate-qre',issues:[{level:'review',type:'duplicate',message:'QID occurs more than once in the QRE; resolve mapping manually.'}],candidates:[],key});continue;}
   candidates=ids.get(q.qid.toLowerCase())||[];reason='qid';
   if(!candidates.length){candidates=canonical.get(P.canonicalId(q.qid))||[];reason='canonical-qid';}
   if(!candidates.length){const stem=codeClean(q.qid);candidates=cf.questions.filter(x=>x.type==='Grid' && stem.startsWith(codeClean(x.qid)+'_'));if(candidates.length)reason='grid-parent';}
   if(!candidates.length){const title=titleKey(q.title);candidates=title.length>=5?(titles.get(title)||[]):[];reason='title';}
  }
  // Never silently pair reused XML nodes or multiple ambiguous targets.
  if(candidates.length>1){out.push({q,cf:null,verdict:'review',reason:'ambiguous',issues:[{level:'review',type:'ambiguous',message:`${candidates.length} possible CF nodes; select the correct one manually.`}],candidates:candidates.slice(0,20),key});continue;}
  if(!candidates.length){out.push({q,cf:null,verdict:'unmapped',reason:'none',issues:[{level:'review',type:'missing-map',message:'No unique QID, node-label or title mapping was found. This is not proof that the question is absent.'}],candidates:[],key});continue;}
  match=candidates[0];if(match.type==='Grid' && codeClean(q.qid).startsWith(codeClean(match.qid)+'_'))reason='grid-parent';used.add(match.entityId);
  const r=classify(q,match,reason);
  out.push({...r,q,cf:match,reason,candidates:[],key});
 }
 const mappedByEntity=new Map();
 for(const row of out){if(!row.cf||row.cf.type==='Grid')continue;const prior=mappedByEntity.get(row.cf.entityId)||[];prior.push(row);mappedByEntity.set(row.cf.entityId,prior);}
 for(const group of mappedByEntity.values())if(group.length>1)for(const row of group){row.issues.push({type:'duplicate-mapping',level:'review',message:'This CF node is mapped to multiple QRE questions. Confirm the correct pairing.'});if(row.verdict==='match')row.verdict='review';}
 const sourceExtra=cf.questions.filter(x=>!used.has(x.entityId)&&!x.hidden);
 const summary={qre:qre.questions.length,cf:cf.questions.length,mapped:out.filter(x=>x.cf).length,matches:out.filter(x=>x.verdict==='match').length,mismatches:out.filter(x=>x.verdict==='mismatch').length,review:out.filter(x=>x.verdict==='review').length,unmapped:out.filter(x=>x.verdict==='unmapped').length,extras:sourceExtra.length};
 return {rows:out,sourceExtra,summary,created:new Date().toISOString()};
}
P.compare=compare;P.titleKey=titleKey;P.cleanOption=cleanOption;P.classify=classify;
})(window.LazyProof=window.LazyProof||{});