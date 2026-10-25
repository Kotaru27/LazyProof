/* LazyProof v0.2 — bounded, deterministic word-level mismatch excerpts.
   Plain token data only. All HTML escaping occurs in the view layer. */
(function(P){'use strict';
function tokens(s){return String(s??'').trim().match(/\S+/gu)||[];}
function wordOperations(qre,xml){
 const a=tokens(qre), b=tokens(xml), m=a.length,n=b.length;
 // A pathological questionnaire must never hang the browser. Large inputs use an
 // exact common prefix/suffix and expose the entire unresolved middle as changes.
 if(m*n>150000){
  let prefix=0;while(prefix<Math.min(m,n)&&a[prefix]===b[prefix])prefix++;
  let suffix=0;while(suffix<m-prefix&&suffix<n-prefix&&a[m-1-suffix]===b[n-1-suffix])suffix++;
  const out=[];
  for(let i=0;i<prefix;i++)out.push({kind:'same',text:a[i]});
  for(let i=prefix;i<m-suffix;i++)out.push({kind:'qre',text:a[i]});
  for(let j=prefix;j<n-suffix;j++)out.push({kind:'xml',text:b[j]});
  for(let i=m-suffix;i<m;i++)out.push({kind:'same',text:a[i]});
  return out;
 }
 const dp=Array.from({length:m+1},()=>new Uint16Array(n+1));
 for(let i=m-1;i>=0;i--)for(let j=n-1;j>=0;j--)
  dp[i][j]=a[i]===b[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
 const out=[];let i=0,j=0;
 while(i<m||j<n){
  if(i<m&&j<n&&a[i]===b[j]){out.push({kind:'same',text:a[i]});i++;j++;}
  else if(i<m&&(j===n||dp[i+1][j]>=dp[i][j+1])){out.push({kind:'qre',text:a[i++]});}
  else{out.push({kind:'xml',text:b[j++]});}
 }
 return out;
}
function diffSnippets(qre,xml,context=3){
 const ops=wordOperations(qre,xml),changed=[];
 for(let i=0;i<ops.length;i++)if(ops[i].kind!=='same')changed.push(i);
 if(!changed.length)return [];
 const clusters=[];let start=changed[0],last=start;
 for(const index of changed.slice(1)){
  if(index-last>7){clusters.push([start,last]);start=index;}
  last=index;
 }
 clusters.push([start,last]);
 return clusters.map(([first,end])=>{
  const lo=Math.max(0,first-context),hi=Math.min(ops.length,end+context+1),region=ops.slice(lo,hi);
  const side=which=>region.filter(t=>t.kind==='same'||t.kind===which).map(t=>({text:t.text,changed:t.kind!=='same'}));
  return {qre:side('qre'),xml:side('xml'),leading:lo>0,trailing:hi<ops.length};
 });
}
function plainSide(parts){return parts.map(t=>t.text).join(' ');}
function plainExcerpt(h,side){return (h.leading?'… ':'')+(plainSide(h[side])||'[absent]')+(h.trailing?' …':'');}
P.diffSnippets=diffSnippets;P.plainExcerpt=plainExcerpt;P.wordOperations=wordOperations;
})(window.LazyProof=window.LazyProof||{});