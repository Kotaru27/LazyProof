'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.resolve(__dirname,'..');global.window={};
for(const f of ['parsers.js','matching.js'])vm.runInThisContext(fs.readFileSync(path.join(root,f),'utf8'),{filename:f});
const P=window.LazyProof;
const b=(text,index,num=false,style='',fullyStruck=false)=>({text,index,num,style,fullyStruck});
const q=(qid,text='Choose a color.',title='Color',options=[],blockIndex=1,other={})=>({qid,text,title,options,blockIndex,...other});
const c=(qid,text='Choose a color.',title='Color',options=[],type='Single',other={})=>({qid,text,title,options:options.map((s,i)=>({text:s,code:String(i+1)})),entityId:qid+'_entity',type,hidden:false,missingRequested:false,...other});
const comparison=(qre,cf)=>P.compare({questions:qre},{questions:cf});
const tests=[
['Numeric suffix identity collision',()=>{const r=comparison([q('cq1000_1')],[c('cq1000')]);assert.notEqual(r.rows[0].verdict,'match');}],
['Unverified empty choice lists',()=>{const r=comparison([q('q1','Choose.', 'Choice [SA]')],[c('q1','Choose.','Choice',[],'Single')]);assert.equal(r.rows[0].verdict,'review');const open=comparison([q('q2','Enter a word','Free text')],[c('q2','Enter a word','Free text',[],'Open')]);assert.equal(open.rows[0].verdict,'match');}],
['Two unnumbered options',()=>{const r=P.splitQre([b('Product interest [SA]',1),b('cq103. Please select one.',2),b('Bitte wählen Sie eine Antwort.',3),b('Ja',4),b('Nein',5)]);assert.deepEqual(r.questions[0].options,['Ja','Nein']);}],
['Duplicate option rows preserved',()=>{const r=P.splitQre([b('Choice [MA]',1),b('cq104. Choose options.',2),b('Yes',3,true),b('Yes',4,true),b('No',5,true)]);assert.equal(r.questions[0].options.length,3);}],
['Respondent Please use instruction',()=>{const r=P.splitQre([b('Code [OE]',1),b('cq105. Enter your code.',2),b('Please use four digits.',3)]);assert.match(r.questions[0].text,/Please use four digits/i);}],
['Conflicting titles reused QID',()=>{const r=comparison([q('q6','Choose a color.','Favorite color')],[c('q6','Choose a color.','Occupation',[],'Open')]);assert.equal(r.rows[0].verdict,'review');assert(r.rows[0].issues.some(x=>x.type==='identity-conflict'));}],
['Additional question visible for review',()=>{const r=comparison([q('q7','Question one?','Q one')],[c('q7','Question one?','Q one',[],'Open'),c('q8','Unexpected respondent question?','New Question',[],'Open')]);assert(r.actionableExtras?.some(x=>x.qid==='q8'));assert(!r.actionableExtras?.some(x=>x.qid==='q7'));}],
['Word struck words not compared',()=>{const r=P.splitQre([b('Main [OE]',1),b('cq109. Enter title.',2),b('Obsolete instruction',3,false,'',true)]);assert(!r.questions[0].text.includes('Obsolete'));}],
['Image alt is not stripped before DOM parsing',()=>{assert(!fs.readFileSync(path.join(root,'parsers.js'),'utf8').includes('(?:img|iframe'));}],
['Numeric alternative ID A1',()=>{const r=P.splitQre([b('Intro [OE]',1),b('A1. What is your name?',2)]);assert.equal(r.questions[0].qid,'A1');}],
['Letter-only qGender and QGENDER IDs',()=>{const r=P.splitQre([b('Gender [SA]',1),b('qGENDER. Select your gender.',2),b('Gender [SA]',3),b('QGENDER. Select gender.',4)]);assert.deepEqual(r.questions.map(q=>q.qid),['qGENDER','QGENDER']);}],
['QRE strikethrough requires manual review',()=>{const r=comparison([q('q12','Current text','Caption',[],1,{struckContent:true})],[c('q12','Current text','Caption',[],'Open')]);assert.equal(r.rows[0].verdict,'review');}],
['Unconfirmed canonical identity cannot be a definitive mismatch',()=>{const r=comparison([q('cq1200_x','Alpha text','Occupation')],[c('cq1200','Beta text','Apprenticeship',[],'Open')]);assert.equal(r.rows[0].verdict,'review');}],
['Programming QUALITY label is not a question',()=>{const r=P.splitQre([b('Status [OE]',1),b('q20. Explain status.',2),b('QUALITY: Bad OE check',3),b('Please use meaningful wording.',4)]);assert.deepEqual(r.questions.map(x=>x.qid),['q20']);assert(!r.questions[0].text.includes('QUALITY'));}],
['Numbered answer code is not a section heading',()=>{const r=P.splitQre([b('Brands [MA]',1),b('q22. Select brands.',2),b('Brand A',3,true),b('999. None of these',4),b('IF Respondent selected none > screen-out',5),b('Next item [OE]',6,false,'Heading2'),b('q23. Explain.',7)]);assert.deepEqual(r.questions[0].options,['Brand A','None of these']);}],
['Non-template heading from Word paragraph style',()=>{const r=P.splitQre([b('First heading [OE]',1),b('q10. First question?',2),b('Media habits',3,false,'Heading2'),b('q11. Second question?',4)]);assert.equal(r.questions[1].title,'Media habits');}],
];
// Hand-made struck run test for issue 8 above uses a flag fixture intentionally;
// a real Word OOXML-level test is independently run in browser.
const end=Number(process.env.STAGE||tests.length);let count=0;
for(let i=0;i<Math.min(end,tests.length);i++){const [name,fn]=tests[i];try{fn();count++;process.stdout.write(`PASS ${i+1} ${name}\n`);}catch(e){process.stderr.write(`FAIL ${i+1} ${name}: ${e.stack}\n`);process.exitCode=1;break;}}
if(!process.exitCode)console.log(`PASSED ${count}/${Math.min(end,tests.length)} cases`);
