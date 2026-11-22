(()=>{'use strict';
const $=s=>document.querySelector(s);
const money=n=>new Intl.NumberFormat('nb-NO',{style:'currency',currency:'NOK',maximumFractionDigits:2}).format(n);
const escaped=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const node=(tag,attrs={},children=[])=>{const el=document.createElement(tag);for(const [key,value] of Object.entries(attrs)){if(key==='class')el.className=value;else if(key==='text')el.textContent=value;else el.setAttribute(key,String(value));}for(const item of children)el.append(typeof item==='string'?document.createTextNode(item):item);return el;};
const link=(href,content)=>node('a',{href,target:'_blank',rel:'noopener noreferrer',text:content});
const query=new URLSearchParams(window.location.search);
let current=query.get('week')||null;let state={};
async function boot(){
 try{
 const idx=await fetch('./data/weeks/index.json',{cache:'no-store'});if(!idx.ok)throw new Error('Kunne ikke hente ukearkivet');
 const manifest=await idx.json();const weeks=manifest.weeks||[];
 current=weeks.some(w=>w.id===current)?current:manifest.latest;
 const links=$('#archive-links');weeks.forEach(w=>{const a=node('a',{href:'?week='+encodeURIComponent(w.id),text:w.title+' · '+w.period});if(w.id===current)a.setAttribute('aria-current','page');links.append(a)});
 const resp=await fetch('./data/weeks/'+encodeURIComponent(current)+'.json',{cache:'no-store'});if(!resp.ok)throw new Error('Fant ikke ukens matplan');
 state=await resp.json();render(state);document.title='Matplan – '+state.title;
 }catch(e){$('#meal-list').textContent='Kunne ikke laste matplanen. Prøv å oppdatere siden.';console.error(e)}
}
function render(w){
 $('#period').textContent='UKENS MATPLAN / '+w.period;
 $('#week-intro').textContent=w.intro;
 const total=w.shopping.flatMap(g=>g.items).reduce((s,i)=>s+Number(i[1]),0);
 $('#budget-actual').textContent=money(total);$('#budget-target').textContent=money(w.target);
 $('#budget-progress').style.width=Math.min(100,total/w.target*100)+'%';
 $('#budget-note').textContent='For 1 person. '+money(w.monthlyFoodBudget-w.monthlyWorkLunch)+'/mnd til dagligvarer; '+money(w.monthlyWorkLunch)+'/mnd til lunsj på jobb.';
 $('#meal-list').replaceChildren(...w.meals.map((m,i)=>{
 const header=node('button',{class:'meal-trigger',type:'button','aria-expanded':'false','aria-controls':'recipe-'+i});
 header.append(node('span',{class:'meal-emoji','aria-hidden':'true',text:m.emoji}));
 const main=node('span',{class:'meal-main'},[node('span',{class:'meal-day',text:m.day}),node('span',{class:'meal-name',text:m.name}),node('span',{class:'meal-minutes',text:m.minutes+' min · '+m.tag})]);
 header.append(main,node('span',{class:'meal-arrow','aria-hidden':'true',text:'+'}));
 const content=node('div',{class:'recipe',id:'recipe-'+i,hidden:''});
 const ingredients=node('ul',{},m.ingredients.map(s=>node('li',{text:s})));
 const steps=node('ol',{},m.steps.map(s=>node('li',{text:s})));
 content.append(node('div',{class:'recipe-summary',text:m.servings+' porsjon'}),node('h4',{text:'Ingredienser'}),ingredients,node('h4',{text:'Slik gjør du'}),steps);
 const item=node('article',{class:'meal-card'},[header,content]);
 header.addEventListener('click',()=>{const show=header.getAttribute('aria-expanded')!=='true';header.setAttribute('aria-expanded',String(show));if(show)content.removeAttribute('hidden');else content.setAttribute('hidden','');});
 return item;
 }));
 renderShopping(w);
 $('#prep-steps').replaceChildren(...w.mealPrep.map(s=>node('li',{},[node('div',{},[node('h3',{text:s.title}),node('p',{text:s.detail})])])));
 $('#storage-note').textContent=w.storage;
 $('#offer-summary').textContent=w.offerSummary;
 $('#offer-list').replaceChildren(...w.deals.map(d=>node('article',{class:'offer'},[
 node('div',{class:'offer-store',text:d.store}),node('h3',{text:d.name}),node('div',{class:'offer-size',text:d.quantity}),
 node('div',{class:'offer-price',text:money(d.price)}),node('div',{class:'offer-meta',text:d.unitPrice+' · '+d.valid}),
 node('p',{text:d.note}),link(d.url,'Se avis eller tilbud ↗')
 ])));
 $('#flyer-links').replaceChildren(...w.flyers.map(f=>link(f.url,f.store+' ↗')));
 $('#offer-disclaimer').textContent=w.disclaimer;
 $('#other-meals-list').replaceChildren(...w.otherMeals.map(m=>node('article',{class:'other-meals-card'},[node('h3',{text:m.name}),node('p',{text:m.detail})])));
}
function renderShopping(w){
 const storageKey='matplan-shopping-'+w.id;
 let checked={};try{checked=JSON.parse(localStorage.getItem(storageKey)||'{}')}catch(_){}
 const all=w.shopping.flatMap((g,gi)=>g.items.map((i,ii)=>({id:gi+'-'+ii,item:i})));
 const counter=()=>{const n=all.filter(i=>!!checked[i.id]).length;$('#shopping-count').textContent=n+' av '+all.length+' krysset av';$('#shopping-total').textContent=money(all.filter(i=>!checked[i.id]).reduce((s,i)=>s+i.item[1],0))+' gjenstår';$('#shopping-progress').style.width=(n/all.length*100)+'%';};
 const els=w.shopping.map((g,gi)=>{
 const group=node('section',{class:'shopping-group'});const sum=g.items.reduce((s,i)=>s+i[1],0);
 group.append(node('div',{class:'shopping-group-head'},[node('span',{text:g.category}),node('span',{text:money(sum)})]));
 g.items.forEach((item,ii)=>{
 const id=gi+'-'+ii;const inp=node('input',{type:'checkbox',id:'check-'+id});inp.checked=!!checked[id];
 const line=node('label',{class:'shopping-item'+(inp.checked?' checked':''),for:'check-'+id});const text=node('span',{class:'item-name',text:item[0]});
 if(item[2])text.append(node('span',{class:'check-deal',text:'TILBUD'}));line.append(inp,text,node('span',{class:'item-price',text:money(item[1])}));
 inp.addEventListener('change',()=>{checked[id]=inp.checked;line.classList.toggle('checked',inp.checked);try{localStorage.setItem(storageKey,JSON.stringify(checked))}catch(_){}counter();});group.append(line);
 });return group;
 });
 $('#shopping-groups').replaceChildren(...els);
 $('#pantry-note').textContent=w.pantry;
 $('#reset-shopping').onclick=()=>{checked={};try{localStorage.removeItem(storageKey)}catch(_){}document.querySelectorAll('.shopping-item').forEach(el=>{el.querySelector('input').checked=false;el.classList.remove('checked')});counter();};counter();
}
const archiveBtn=$('#archive-toggle');archiveBtn.addEventListener('click',()=>{const shown=$('#archive-menu').hidden;$('#archive-menu').hidden=!shown;archiveBtn.setAttribute('aria-expanded',String(shown));});
document.addEventListener('click',e=>{if(!e.target.closest('.header-inner')){$('#archive-menu').hidden=true;archiveBtn.setAttribute('aria-expanded','false')}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('#archive-menu').hidden=true;archiveBtn.setAttribute('aria-expanded','false')}});
document.querySelectorAll('[data-nav]').forEach(a=>a.addEventListener('click',()=>{document.querySelectorAll('[data-nav]').forEach(n=>n.classList.remove('is-active'));a.classList.add('is-active')}));
boot();
})();