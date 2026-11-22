(() => {
"use strict";
const $ = (selector) => document.querySelector(selector);
const money = (n) => new Intl.NumberFormat("nb-NO",{style:"currency",currency:"NOK",maximumFractionDigits:2}).format(n);
const el = (tag,attrs={},children=[]) => {
  const n=document.createElement(tag);
  for(const [key,value] of Object.entries(attrs)){
    if(key==="class") n.className=value;
    else if(key==="text") n.textContent=value;
    else n.setAttribute(key,String(value));
  }
  for(const child of children) n.append(typeof child==="string"?document.createTextNode(child):child);
  return n;
};
const extLink=(url,label,cssClass="")=>el("a",{href:url,target:"_blank",rel:"noopener noreferrer",class:cssClass,text:label});
const requestedWeek=new URLSearchParams(location.search).get("week");

async function load() {
  try {
    const indexResponse=await fetch("./data/weeks/index.json",{cache:"no-store"});
    if(!indexResponse.ok) throw new Error("Kunne ikke lese ukearkiv");
    const index=await indexResponse.json();
    const id=index.weeks.some(w=>w.id===requestedWeek)?requestedWeek:index.latest;
    $("#archive-links").replaceChildren(...index.weeks.map(w=>{
      const a=el("a",{href:"?week="+encodeURIComponent(w.id),text:w.title+" · "+w.period});
      if(w.id===id) a.setAttribute("aria-current","page");
      return a;
    }));
    const response=await fetch("./data/weeks/"+encodeURIComponent(id)+".json",{cache:"no-store"});
    if(!response.ok) throw new Error("Kunne ikke lese matplanen");
    render(await response.json());
  } catch(err) {
    console.error(err);
    $("#meal-list").textContent="Kunne ikke hente matplanen. Prøv igjen senere.";
  }
}

function render(w) {
  $("#week-title").textContent=w.title;
  $("#period").textContent=w.period;
  $("#archive-toggle").firstChild.textContent=w.title+" ";
  document.title=w.title+" – Matplan";
  const sum=w.shopping.flatMap(g=>g.items).reduce((total,item)=>total+Number(item[1]),0);
  $("#budget-actual").textContent=money(sum);
  $("#budget-target").textContent=money(w.target);
  $("#budget-progress").style.width=Math.min(sum/w.target*100,100)+"%";
  $("#budget-note").textContent="Estimerte priser for én person · "+money(w.monthlyWorkLunch)+" / mnd til jobblunsj";

  const meals=w.meals.map((m,i)=>{
    const btn=el("button",{type:"button",class:"meal-trigger","aria-expanded":"false","aria-controls":"recipe-"+i},[
      el("span",{class:"meal-day",text:m.day}),
      el("span",{class:"meal-main"},[
        el("span",{class:"meal-name",text:m.name}),
        el("span",{class:"meal-minutes",text:m.minutes+" min"})
      ]),
      el("span",{class:"meal-arrow","aria-hidden":"true",text:"+"})
    ]);
    const ingredients=el("ul",{},m.ingredients.map(t=>el("li",{text:t})));
    const steps=el("ol",{},m.steps.map(t=>el("li",{text:t})));
    const recipe=el("div",{class:"recipe",id:"recipe-"+i,hidden:""},[
      el("span",{class:"recipe-summary",text:m.servings+" porsjon"}),
      el("h3",{text:"Ingredienser"}),ingredients,
      el("h3",{text:"Slik gjør du"}),steps
    ]);
    btn.addEventListener("click",()=>{
      const open=btn.getAttribute("aria-expanded")!=="true";
      btn.setAttribute("aria-expanded",String(open));
      recipe.hidden=!open;
    });
    return el("article",{class:"meal-card"},[btn,recipe]);
  });
  $("#meal-list").replaceChildren(...meals);
  renderShopping(w);
  $("#prep-steps").replaceChildren(...w.mealPrep.map(step=>el("li",{},[
    el("div",{},[el("h3",{text:step.title}),el("p",{text:step.detail})])
  ])));
  $("#storage-note").textContent=w.storage;
  $("#offer-summary").textContent=w.offerSummary;
  $("#offer-list").replaceChildren(...w.deals.map(deal=>el("article",{class:"offer"},[
    el("div",{},[
      el("div",{class:"offer-store",text:deal.store}),
      el("h3",{class:"offer-name",text:deal.name}),
      el("div",{class:"offer-size",text:deal.quantity})
    ]),
    el("div",{},[
      el("div",{class:"offer-price",text:money(deal.price)}),
      el("div",{class:"offer-meta",text:deal.unitPrice})
    ]),
    el("p",{class:"offer-note",text:deal.note+" · "+deal.valid}),
    extLink(deal.url,"Se tilbud ↗","offer-link")
  ])));
  $("#flyer-links").replaceChildren(...w.flyers.map(f=>extLink(f.url,f.store+" ↗")));
  $("#offer-disclaimer").textContent=w.disclaimer;
  $("#other-meals-list").replaceChildren(...w.otherMeals.map(m=>el("article",{class:"other-meals-card"},[
    el("h3",{text:m.name}),el("p",{text:m.detail})
  ])));
}

function renderShopping(w) {
  const storageKey="matplan-shopping-"+w.id;
  let checked={};
  try{checked=JSON.parse(localStorage.getItem(storageKey)||"{}")}catch(_){}
  const all=w.shopping.flatMap((g,gi)=>g.items.map((item,ii)=>({key:gi+"-"+ii,item})));
  const updateCount=()=>{
    const count=all.filter(({key})=>!!checked[key]).length;
    $("#shopping-count").textContent=count+" av "+all.length+" varer";
    $("#shopping-total").textContent=money(all.filter(({key})=>!checked[key]).reduce((sum,{item})=>sum+item[1],0))+" igjen";
    $("#shopping-progress").style.width=(all.length?count/all.length*100:0)+"%";
  };
  $("#shopping-groups").replaceChildren(...w.shopping.map((g,gi)=>{
    const sum=g.items.reduce((total,item)=>total+item[1],0);
    const section=el("section",{class:"shopping-group"},[
      el("div",{class:"shopping-group-head"},[
        el("span",{text:g.category}),el("span",{text:money(sum)})
      ])
    ]);
    g.items.forEach((item,ii)=>{
      const key=gi+"-"+ii;
      const input=el("input",{type:"checkbox",id:"check-"+key});
      input.checked=!!checked[key];
      const name=el("span",{class:"item-name",text:item[0]});
      if(item[2]) name.append(el("span",{class:"check-deal",text:"Tilbud"}));
      const row=el("label",{class:"shopping-item"+(input.checked?" checked":""),for:"check-"+key},[
        input,name,el("span",{class:"item-price",text:money(item[1])})
      ]);
      input.addEventListener("change",()=>{
        checked[key]=input.checked;
        row.classList.toggle("checked",input.checked);
        try{localStorage.setItem(storageKey,JSON.stringify(checked))}catch(_){}
        updateCount();
      });
      section.append(row);
    });
    return section;
  }));
  $("#pantry-note").textContent=w.pantry;
  $("#reset-shopping").addEventListener("click",()=>{
    checked={};
    try{localStorage.removeItem(storageKey)}catch(_){}
    document.querySelectorAll(".shopping-item").forEach(row=>{
      row.querySelector("input").checked=false;
      row.classList.remove("checked");
    });
    updateCount();
  });
  updateCount();
}
const toggle=$("#archive-toggle");
toggle.addEventListener("click",()=>{
  const menu=$("#archive-menu");
  menu.hidden=!menu.hidden;
  toggle.setAttribute("aria-expanded",String(!menu.hidden));
});
document.addEventListener("click",event=>{
  if(!event.target.closest(".header-actions")){
    $("#archive-menu").hidden=true;
    toggle.setAttribute("aria-expanded","false");
  }
});
document.addEventListener("keydown",event=>{
  if(event.key==="Escape"){
    $("#archive-menu").hidden=true;
    toggle.setAttribute("aria-expanded","false");
  }
});
load();
})();