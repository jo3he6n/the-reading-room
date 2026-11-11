const starterBooks = [
  {id:"b1",title:"파반느",author:"박민규",genre:"소설",date:"2026-11-09",rating:5,review:"사랑과 상실, 그리고 서로의 삶에 남긴 흔적을 생각하게 한 이야기. 책장을 덮은 뒤에도 오래 마음에 머물렀다.",quote:"우리는 서로의 삶에 어떤 흔적을 남기며 살아가는 걸까.",quoteSource:"나의 독서 노트",cover:""},
  {id:"b2",title:"노르웨이의 숲",author:"무라카미 하루키",genre:"소설",date:"2026-10-20",rating:4,review:"상실과 기억을 따라가며 청춘의 불완전함을 돌아보게 하는 작품.",quote:"죽음은 삶의 반대편에 있는 것이 아니라 그 일부로 존재한다.",quoteSource:"나의 독서 노트",cover:""},
  {id:"b3",title:"이방인",author:"알베르 카뮈",genre:"인문",date:"2026-09-14",rating:4,review:"당연하다고 여겼던 감정과 사회의 기준을 낯설게 바라보게 했다.",quote:"오늘 엄마가 죽었다. 어쩌면 어제였는지도 모른다.",quoteSource:"첫 문장",cover:""}
];
let books = JSON.parse(localStorage.getItem("readingRoomBooks") || "null") || starterBooks;
let selectedRating = 5;
let activeGenre = "전체";
let quoteIndex = 0;
const $ = id => document.getElementById(id);
const save = () => localStorage.setItem("readingRoomBooks", JSON.stringify(books));
const stars = n => "★".repeat(n) + "☆".repeat(5-n);
const safe = value => String(value || "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const dateLabel = d => d ? new Date(d+"T00:00:00").toLocaleDateString("ko-KR",{year:"numeric",month:"long",day:"numeric"}) : "날짜 미기록";

function render(){
  const visible = books.filter(b => activeGenre==="전체" || b.genre===activeGenre).sort((a,b)=>(b.date||"").localeCompare(a.date||""));
  $("bookGrid").innerHTML = visible.map(b => `
    <article class="book-card">
      <div class="cover-wrap">${b.cover ? `<img src="${safe(b.cover)}" alt="${safe(b.title)} 표지" onerror="this.remove()">` : `<div class="cover-placeholder">${safe(b.title)}</div>`}</div>
      <div class="book-meta"><h3>${safe(b.title)}</h3><p class="author">${safe(b.author||"작자 미상")}</p>
      <div class="rating" aria-label="별점 ${b.rating}점">${stars(Number(b.rating)||0)}</div>
      <div class="book-bottom"><span class="genre-tag">${safe(b.genre)}</span><span class="card-actions"><button data-edit="${safe(b.id)}">수정</button><button data-delete="${safe(b.id)}">삭제</button></span></div></div>
    </article>`).join("");
  $("emptyState").hidden = visible.length>0;
  $("bookCount").textContent=String(books.length).padStart(2,"0");
  $("quoteCount").textContent=String(books.filter(b=>b.quote).length).padStart(2,"0");
  $("yearCount").textContent=new Date().getFullYear();
  const dated=[...books].filter(b=>b.date).sort((a,b)=>b.date.localeCompare(a.date));
  $("journalList").innerHTML=dated.length?dated.map(b=>`<article class="journal-entry"><time class="journal-date">${dateLabel(b.date)}</time><div><h3>${safe(b.title)} <span style="color:#985e43;font-size:12px">${stars(Number(b.rating)||0)}</span></h3><p>${safe(b.review||"독서 기록을 아직 작성하지 않았어요.")}</p></div><span class="journal-genre">${safe(b.genre)}</span></article>`).join(""):`<p class="empty-state">아직 기록된 독서 날짜가 없어요.</p>`;
  renderQuote();
}
function renderQuote(){
  const quotes=books.filter(b=>b.quote);
  if(!quotes.length){$("featuredQuote").textContent="오래 간직하고 싶은 문장을 이곳에 모아보세요."; $("featuredQuoteSource").textContent="— THE READING ROOM";return;}
  quoteIndex=quoteIndex%quotes.length;
  $("featuredQuote").textContent=quotes[quoteIndex].quote;
  $("featuredQuoteSource").textContent="— "+(quotes[quoteIndex].quoteSource||quotes[quoteIndex].title);
}
function openDialog(book){
  $("bookForm").reset(); $("bookId").value=book?.id||""; selectedRating=book?.rating||5;
  $("title").value=book?.title||""; $("author").value=book?.author||""; $("genre").value=book?.genre||"소설";
  $("readDate").value=book?.date||new Date().toISOString().slice(0,10); $("cover").value=book?.cover||"";
  $("review").value=book?.review||""; $("quote").value=book?.quote||""; $("quoteSource").value=book?.quoteSource||"";
  renderStars(); $("bookDialog").showModal();
}
function renderStars(){
  $("starPicker").innerHTML=Array.from({length:5},(_,i)=>`<button type="button" class="${i<selectedRating?"selected":""}" data-star="${i+1}" aria-label="${i+1}점">★</button>`).join("");
}
$("openAdd").onclick=()=>openDialog(); $("openAddTop").onclick=()=>openDialog(); $("closeDialog").onclick=()=>$("bookDialog").close();
$("starPicker").addEventListener("click",e=>{const b=e.target.closest("[data-star]");if(b){selectedRating=Number(b.dataset.star);renderStars();}});
$("filters").addEventListener("click",e=>{const b=e.target.closest("[data-genre]");if(!b)return;activeGenre=b.dataset.genre;document.querySelectorAll(".filter").forEach(x=>x.classList.toggle("active",x===b));render();});
$("bookGrid").addEventListener("click",e=>{
  const edit=e.target.closest("[data-edit]"), del=e.target.closest("[data-delete]");
  if(edit){openDialog(books.find(b=>b.id===edit.dataset.edit));}
  if(del && confirm("이 책의 기록을 삭제할까요?")){books=books.filter(b=>b.id!==del.dataset.delete);save();render();}
});
$("bookForm").addEventListener("submit",e=>{
  e.preventDefault();
  const id=$("bookId").value||("b"+Date.now());
  const item={id,title:$("title").value.trim(),author:$("author").value.trim(),genre:$("genre").value,date:$("readDate").value,rating:selectedRating,cover:$("cover").value.trim(),review:$("review").value.trim(),quote:$("quote").value.trim(),quoteSource:$("quoteSource").value.trim()};
  const idx=books.findIndex(b=>b.id===id); if(idx>=0)books[idx]=item;else books.push(item);
  save(); $("bookDialog").close(); activeGenre="전체"; document.querySelectorAll(".filter").forEach(x=>x.classList.toggle("active",x.dataset.genre==="전체"));render();
});
$("nextQuote").onclick=()=>{quoteIndex++;renderQuote();};
render();