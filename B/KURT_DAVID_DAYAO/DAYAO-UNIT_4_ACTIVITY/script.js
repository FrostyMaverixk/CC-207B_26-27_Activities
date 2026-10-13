const works = [
  {n:"Tide bowl set",c:"Tableware",s:"bowl",g:"#7fa79d",size:"Set of 4, 15 cm wide",price:"$96",fire:"Cone 10 reduction",note:"Celadon pools darker where the wall meets the foot."},
  {n:"Ash vase No. 3",c:"Vases",s:"vase",g:"#8c8f84",size:"32 cm tall",price:"$140",fire:"Wood ash glaze",note:"Edition of 12. Each one runs differently on the shoulder."},
  {n:"Morning mugs",c:"Tableware",s:"mug",g:"#c0883f",size:"350 ml",price:"$34 each",fire:"Iron saturate",note:"Wide handle that fits two fingers and a thumb."},
  {n:"Harbor dinner service",c:"Commissions",s:"plate",g:"#4d6f86",size:"120 plates, 3 sizes",price:"Commissioned",fire:"Satin blue",note:"Made for a 40-seat restaurant over 9 weeks."},
  {n:"Moon jar",c:"Vases",s:"vase",g:"#d8d3c3",size:"28 cm tall",price:"$180",fire:"Matte white",note:"Thrown in two halves and joined while soft."},
  {n:"Noodle bowls",c:"Tableware",s:"bowl",g:"#3d4a52",size:"Set of 2, 19 cm wide",price:"$62",fire:"Slate black",note:"Deep enough for 500 ml of broth."},
  {n:"Tasting plates",c:"Commissions",s:"plate",g:"#9bb59a",size:"60 plates, 22 cm",price:"Commissioned",fire:"Pale green",note:"Rim lowered by 4 mm so the chef could plate to the edge."},
  {n:"Bud vases",c:"Vases",s:"vase",g:"#b4695a",size:"Set of 3, 10 to 16 cm",price:"$58",fire:"Copper red",note:"Sized for single stems from a market stall."}
];
const grid = document.getElementById("grid");
works.forEach((w,i)=>{
  const b = document.createElement("button");
  b.className="item"; b.dataset.cat=w.c; b.dataset.i=i;
  b.innerHTML = `<div class="stage"><div class="pot ${w.s}" style="--g:${w.g}"></div></div><h3>${w.n}</h3><span>${w.c}</span>`;
  grid.appendChild(b);
});
document.querySelectorAll(".filters button").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll(".filters button").forEach(x=>x.setAttribute("aria-pressed",x===btn));
    grid.querySelectorAll(".item").forEach(el=>{
      el.hidden = btn.dataset.f!=="all" && el.dataset.cat!==btn.dataset.f;
    });
  });
});
const dlg = document.getElementById("dlg");
grid.addEventListener("click",e=>{
  const el = e.target.closest(".item"); if(!el) return;
  const w = works[el.dataset.i];
  document.getElementById("d-title").textContent = w.n;
  document.getElementById("d-cat").textContent = w.c;
  document.getElementById("d-list").innerHTML = `<dt>Size</dt><dd>${w.size}</dd><dt>Price</dt><dd>${w.price}</dd><dt>Finish</dt><dd>${w.fire}</dd>`;
  document.getElementById("d-note").textContent = w.note;
  dlg.showModal();
});
document.getElementById("close").onclick = ()=>dlg.close();
dlg.addEventListener("click",e=>{ if(e.target===dlg) dlg.close(); });
document.getElementById("copy").onclick = async ()=>{
  const s = document.getElementById("status");
  try{ await navigator.clipboard.writeText("studio@linaokafor.example"); s.textContent="Copied."; }
  catch(err){ s.textContent="Copy failed. Use studio@linaokafor.example"; }
};
