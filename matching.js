/* LazyProof · conservative, auditable mapping + comparison. No probabilistic match is ever auto-approved. */
(function(P){'use strict';
const esc=(s)=>String(s??'');
function normalizeText(s){return P.normalize(s).replace(/\s+([.,!?;:])/g,'$1').toLocaleLowerCase();}
function exact(a,b){return normalizeText(a)===normalizeText(b);}
// Confirmit authoring separates visible Question Text from visible Instructions.
// Both belong to the respondent-facing copy, but are retained as distinct source fields.
function respondentText(cf){return [cf?.text,cf?.instruction].filter(s=>String(s||'').trim()).join('\n').trim();}
function hasDynamic(s){return /\^[^\^\n]+\^/.test(String(s||''));}
// Resolve only a simple f('field') placeholder to selected-language source
// question definitions. NEVER evaluate Confirmit expressions or scripts.
function dynamicReferences(s){
 return [...String(s||'').matchAll(/\^f\(\s*(['"])([A-Za-z][A-Za-z0-9_]*)\1\s*\)\^/g)].map(m=>m[2]);
}
function knownVariantSource(q,cf,survey){
 const referenced=dynamicReferences(respondentText(cf));
 for(const ref of referenced){
  const sources=survey.questions.filter(x=>x.qid.toLocaleLowerCase()===ref.toLocaleLowerCase());
  if(sources.length!==1)continue;
  const options=sources[0].options.filter(o=>o.text&&!o.missingRequested);
  if(options.some(o=>exact(q.text,o.text)))return sources[0].qid;
 }
 return null;
}
function codeClean(s){return String(s||'').toLowerCase().replace(/^([coh])q/,'q').replace(/_x$/,'').replace(/_y$/,'');}
function cleanOption(s){if(/^\[\s*open answer\s*\]$/i.test(String(s||'').trim()))return P.normalize(s);return P.normalize(String(s||'').replace(/:\s*open\s+end\s*(?:\(anchor\))?\s*$/i,':').replace(/^\s*\d{1,4}\.\s*/,'').replace(/\s*\[(?:screenout|screen-out|anchor|exlusive(?:\. anchor)?|exclusive(?:, anchor)?|ko|if alone[^\]]*|open answer|open text)\]\s*/ig,'').replace(/\s*\(\s*(?:naturall?\s+fallout|exclusive|anchor|exlusive)(?:[,. ]+(?:anchor|exclusive))?\s*\)\s*$/ig,'')).replace(/\s+/g,' ').trim();}
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
 let qText=q.text||'';const cfText=respondentText(cf);
 // Compare complete respondent-facing copy, including the XML's separate Instructions.
 const qt=normalizeText(qText), ct=normalizeText(cfText);
 const dynamicCopy=hasDynamic(cfText)||hasDynamic(qText);
 const validText=Boolean(qt && qt===ct); // Never silently accept extra programmed wording after the QRE sentence.
 if(!qt)issues.push({type:'unparsed-text',level:'review',message:'QRE question wording was not extracted.'});
 else if(!ct)issues.push({type:'empty-text',level:cf.missingRequested?'review':'mismatch',message:cf.missingRequested?'This question has no entry for the selected XML language; no other language was used.':'Programmed question text is empty in the selected language.'});
 else if(!validText)issues.push(dynamicCopy?
  {type:'dynamic-text',level:'review',message:'Programmed wording contains a variable expression. Static text differs, but the rendered value cannot be confirmed from XML alone.'}:
  {type:'text',level:'mismatch',message:'Question wording differs.'});
 // Do not declare an option missing merely because its selected-language label is absent.
 const unlocalizedAnswers=cf.options.filter(o=>o.missingRequested&&!o.text&&!o.image).length;
 const ans=bagDifference(q.options||[],cf.options||[]);
 if(unlocalizedAnswers)issues.push({type:'answer-locale',level:'review',message:`${unlocalizedAnswers} answer label(s) have no selected-language entry. Answer comparison is incomplete; other languages were not consulted.`});
 if(ans.referenceCount>0&&!unlocalizedAnswers&&!cf.missingRequested){
  if(!ans.actualCount)issues.push({type:'answers',level:'review',message:`QRE contains ${ans.referenceCount} candidate answers, but no comparable CF answers were extracted.`});
  else if(ans.missing.length||(ans.extra.length&&!q.partialOptions)){
   // Grid and loop answers may be flattened differently: classify for review to avoid a false definitive mismatch.
   const grid=cf.type==='Grid';
   const dynamicOptions=cf.options.some(o=>hasDynamic(o.text));
   const provisional=grid||dynamicOptions||q.partialOptions;
   issues.push({type:'answers',level:provisional?'review':'mismatch',message:provisional?'Answer comparison is inconclusive for grid rows, variable expressions, or abbreviated lists.':'Answer options differ.',missing:ans.missing,extra:q.partialOptions?[]:ans.extra});
  }
 }
 if(q.partialOptions)issues.push({type:'abbreviated-list',level:'review',message:'QRE answer list uses an ellipsis; extra XML answers cannot be reliably classified.'});
 if(cf.missingRequested&&!issues.some(i=>i.type==='empty-text'))issues.push({type:'locale',level:'review',message:'Selected language has no question entry in XML. No other language was used.'});
 if(cf.hidden)issues.push({type:'hidden',level:'review',message:'This XML node is hidden or excluded from layout; respondent visibility is not verified.'});
 if(cf.options.some(o=>o.unresolvedRef))issues.push({type:'references',level:'review',message:'An answer list reference could not be resolved.'});
 if(cf.type==='Grid')issues.push({type:'grid',level:'review',message:'Grid rows/scales may not correspond one-to-one with QRE answer lines; inspect manually.'});
 if(dynamicCopy||cf.options.some(o=>hasDynamic(o.text)))issues.push({type:'piping',level:'review',message:'Survey contains variable text; actual substitutions need a respondent-path check.'});
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
   if(countQ.get(q.qid.toLowerCase())>1){
    // Repeated QIDs can represent legitimate questionnaire alternatives for
    // a single dynamic Confirmit question (e.g. seen vs heard ad wording).
    // Permit that mapping ONLY if each QRE variant appears as selected-language
    // answer text in the same referenced source variable.
    const variants=qre.questions.filter(x=>x.qid.toLocaleLowerCase()===q.qid.toLocaleLowerCase());
    const idCandidates=ids.get(q.qid.toLowerCase())||canonical.get(P.canonicalId(q.qid))||[];
    const eligible=idCandidates.length===1 &&
      variants.every(v=>knownVariantSource(v,idCandidates[0],cf)) &&
      variants.every(v=>exact(JSON.stringify(v.options),JSON.stringify(q.options)));
    if(!eligible){out.push({q,cf:null,verdict:'review',reason:'duplicate-qre',issues:[{level:'review',type:'duplicate',message:'QID occurs more than once in the QRE. No single dynamic-source mapping was confirmed; review the variants.'}],candidates:[],key});continue;}
   }
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
  const source=knownVariantSource(q,match,cf);
  const duplicateVariants=countQ.get(q.qid.toLowerCase())>1;
  if(duplicateVariants && source){
   // Don't present a false wording mismatch: the QRE variant is present in
   // the referenced XML source. Keep a review because runtime selection and
   // routing cannot be proved from the definition alone.
   r.issues=r.issues.filter(i=>!['dynamic-text','piping'].includes(i.type));
   r.issues.push({type:'dynamic-source',level:'review',source,message:`This QRE wording is present in XML variable ${source} for the selected language. Runtime selection still needs verification.`});
   r.verdict=r.issues.some(i=>i.level==='mismatch')?'mismatch':'review';
  }
  out.push({...r,q,cf:match,reason,candidates:[],key});
 }
 const mappedByEntity=new Map();
 for(const row of out){if(!row.cf||row.cf.type==='Grid')continue;const prior=mappedByEntity.get(row.cf.entityId)||[];prior.push(row);mappedByEntity.set(row.cf.entityId,prior);}
 for(const group of mappedByEntity.values())if(group.length>1){
  const alternatives=group.every(row=>row.issues.some(i=>i.type==='dynamic-source')) &&
    group.every(row=>row.q.qid.toLocaleLowerCase()===group[0].q.qid.toLocaleLowerCase());
  if(alternatives){group.forEach((row,index)=>{row.variantNumber=index+1;row.variantTotal=group.length;});continue;}
  for(const row of group){row.issues.push({type:'duplicate-mapping',level:'review',message:'This CF node is mapped to multiple QRE questions. Confirm the correct pairing.'});if(row.verdict==='match')row.verdict='review';}
 }
 const sourceExtra=cf.questions.filter(x=>!used.has(x.entityId)&&!x.hidden);
 const summary={qre:qre.questions.length,cf:cf.questions.length,mapped:out.filter(x=>x.cf).length,matches:out.filter(x=>x.verdict==='match').length,mismatches:out.filter(x=>x.verdict==='mismatch').length,review:out.filter(x=>x.verdict==='review').length,unmapped:out.filter(x=>x.verdict==='unmapped').length,extras:sourceExtra.length};
 return {rows:out,sourceExtra,summary,created:new Date().toISOString()};
}
P.compare=compare;P.titleKey=titleKey;P.cleanOption=cleanOption;P.classify=classify;P.respondentText=respondentText;
})(window.LazyProof=window.LazyProof||{});