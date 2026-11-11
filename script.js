const starterBooks = [
  {id:"b1",title:"파반느",author:"박민규",genre:"소설",date:"2026-11-09",rating:5,review:"사랑과 상실, 그리고 서로의 삶에 남긴 흔적을 생각하게 한 이야기.",quotes:[{text:"우리는 서로의 삶에 어떤 흔적을 남기며 살아가는 걸까.",source:"나의 독서 노트"}],cover:""},
  {id:"b2",title:"노르웨이의 숲",author:"무라카미 하루키",genre:"소설",date:"2026-10-20",rating:4,review:"상실과 기억을 따라가며 청춘의 불완전함을 돌아보게 하는 작품.",quotes:[{text:"기억은 사람을 조용히 다른 곳으로 데려간다.",source:"나의 독서 노트"}],cover:""},
  {id:"b3",title:"이방인",author:"알베르 카뮈",genre:"인문",date:"2026-09-14",rating:4,review:"당연하다고 여겼던 감정과 사회의 기준을 낯설게 바라보게 했다.",quotes:[{text:"오늘 엄마가 죽었다. 어쩌면 어제였는지도 모른다.",source:"첫 문장"}],cover:""}
];
const $ = id => document.getElementById(id);
const safe = value => String(value || "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let books = JSON.parse(localStorage.getItem("readingRoomBooks") || "null") || starterBooks;
books = books.map(b=>({...b,readingDates:Array.isArray(b.readingDates)?b.readingDates:(b.date?[b.date]:[]),quotes:Array.isArray(b.quotes)?b.quotes:(b.quote?[{text:b.quote,source:b.quoteSource||""}]:[])}));
let selectedRating=5, activeGenre="전체", calendarCursor=new Date(new Date().getFullYear(),new Date().getMonth(),1), selectedCalendarDate="", editingReadingDates=[];
const save=()=>localStorage.setItem("readingRoomBooks",JSON.stringify(books));
const stars=n=>"★".repeat(n)+"☆".repeat(5-n);
const dateLabel=d=>d?new Date(d+"T00:00:00").toLocaleDateString("ko-KR",{year:"numeric",month:"long",day:"numeric"}):"날짜 미기록";
const readingDatesOf=b=>Array.isArray(b.readingDates)?b.readingDates:(b.date?[b.date]:[]);
const coverMarkup=b=>b.cover?`<img src="${safe(b.cover)}" alt="${safe(b.title)} 표지" onerror="this.style.display='none'">`:`<div class="cover-placeholder">${safe(b.title)}</div>`;

function render(){
  const visible=books.filter(b=>activeGenre==="전체"||b.genre===activeGenre).sort((a,b)=>(b.date||"").localeCompare(a.date||""));
  $("bookGrid").innerHTML=visible.map(b=>`<article class="book-card"><div class="cover-wrap">${coverMarkup(b)}</div><div class="book-meta"><h3>${safe(b.title)}</h3><p class="author">${safe(b.author||"작자 미상")}</p><div class="rating">${stars(Number(b.rating)||0)}</div><div class="book-bottom"><span class="genre-tag">${safe(b.genre)}</span><span class="card-actions"><button data-edit="${safe(b.id)}">수정</button><button data-delete="${safe(b.id)}">삭제</button></span></div></div></article>`).join("");
  $("emptyState").hidden=visible.length>0;
  $("bookCount").textContent=String(books.length).padStart(2,"0");
  $("quoteCount").textContent=String(books.reduce((n,b)=>n+b.quotes.length,0)).padStart(2,"0");
  $("yearCount").textContent=new Date().getFullYear();
  renderCalendar();renderJournal();
}
function renderCalendar(){
  const y=calendarCursor.getFullYear(),m=calendarCursor.getMonth(),dated=books.filter(b=>readingDatesOf(b).length);
  $("calendarMonthLabel").textContent=`${y}년 ${m+1}월`;
  const yearEntries=dated.flatMap(b=>readingDatesOf(b).filter(d=>Number(d.slice(0,4))===y).map(d=>({book:b,date:d})));
  $("calendarYearTotal").textContent=new Set(yearEntries.map(x=>x.book.id)).size;
  $("calendarDayTotal").textContent=new Set(yearEntries.map(x=>x.date)).size;
  $("calendarMonthTotal").textContent=new Set(yearEntries.map(x=>x.date.slice(0,7))).size;
  const first=new Date(y,m,1),last=new Date(y,m+1,0),start=first.getDay(),count=Math.ceil((start+last.getDate())/7)*7;
  const now=new Date(),today=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
  let out="";
  for(let i=0;i<count;i++){
    const d=new Date(y,m,1-start+i),key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    const list=dated.filter(b=>readingDatesOf(b).includes(key));
    const covers=list.slice(0,3).map(b=>b.cover?`<img class="calendar-cover" src="${safe(b.cover)}" alt="${safe(b.title)} 표지" title="${safe(b.title)}">`:`<span class="calendar-cover-fallback" title="${safe(b.title)}">${safe(b.title.slice(0,4))}</span>`).join("");
    out+=`<button class="calendar-day ${d.getMonth()!==m?"muted":""} ${key===selectedCalendarDate?"selected":""} ${key===today?"today":""}" data-date="${key}"><span class="day-number">${d.getDate()}</span><span class="calendar-covers">${covers}${list.length>3?`<span class="more-cover">+${list.length-3}</span>`:""}</span></button>`;
  }
  $("calendarGrid").innerHTML=out;renderSelectedDay();
}
function renderSelectedDay(){
  if(!selectedCalendarDate){$("selectedDayLabel").textContent="날짜를 선택해 주세요";$("selectedDayBooks").innerHTML='<p class="day-empty">달력에서 날짜를 선택하면 그날 읽은 책의 표지가 표시됩니다.</p>';return;}
  const [y,m,d]=selectedCalendarDate.split("-"),list=books.filter(b=>readingDatesOf(b).includes(selectedCalendarDate));
  $("selectedDayLabel").textContent=`${y}년 ${Number(m)}월 ${Number(d)}일`;
  $("selectedDayBooks").innerHTML=list.length?list.map(b=>`<article class="day-book">${b.cover?`<img src="${safe(b.cover)}" alt="${safe(b.title)} 표지">`:`<div class="day-cover-fallback">${safe(b.title)}</div>`}<p>${safe(b.title)}</p></article>`).join(""):'<p class="day-empty">이날 기록된 책이 없어요. 책을 추가할 때 읽은 날짜를 지정해 주세요.</p>';
}
function renderJournal(){
  const groups={};books.forEach(b=>readingDatesOf(b).forEach(date=>(groups[date]??=[]).push(b)));
  const dates=Object.keys(groups).sort((a,b)=>b.localeCompare(a));
  $("journalList").innerHTML=dates.length?dates.map(date=>`<article class="journal-entry"><time class="journal-date">${dateLabel(date)}</time><div><h3>${groups[date].length}권의 독서 기록</h3><p>${groups[date].map(b=>safe(b.title)).join(" · ")}</p><div class="journal-books">${groups[date].map(b=>b.cover?`<img class="journal-mini-cover" src="${safe(b.cover)}" alt="${safe(b.title)} 표지">`:`<span class="journal-mini-fallback">${safe(b.title)}</span>`).join("")}</div></div></article>`).join(""):'<p class="empty-state">아직 독서 기록이 없어요.</p>';
}
function renderStars(){$("starPicker").innerHTML=Array.from({length:5},(_,i)=>`<button type="button" class="${i<selectedRating?"selected":""}" data-star="${i+1}" aria-label="${i+1}점">★</button>`).join("");}
function renderQuoteInputs(quotes=[]){
  $("quoteInputs").innerHTML="";
  const rows=quotes.length?quotes:[{text:"",source:""}];
  rows.forEach(q=>addQuoteInput(q.text,q.source));
}
function renderReadingDates(){
  $("readingDateList").innerHTML=editingReadingDates.length?editingReadingDates.map(date=>`<span class="reading-date-chip">${dateLabel(date)}<button type="button" data-remove-date="${date}" aria-label="${date} 삭제">×</button></span>`).join(""):'<span class="reading-date-help">아직 추가한 날짜가 없어요.</span>';
}
function addReadingDate(date){
  if(!date)return;
  if(!editingReadingDates.includes(date))editingReadingDates.push(date);
  editingReadingDates.sort();
  $("readingDateInput").value="";
  renderReadingDates();
}
function addQuoteInput(text="",source=""){
  const row=document.createElement("div");row.className="quote-row";
  row.innerHTML=`<textarea rows="2" placeholder="인상 깊은 문장을 적어주세요.">${safe(text)}</textarea><input placeholder="출처 / 페이지 (선택)" value="${safe(source)}"><button type="button" class="remove-quote">이 문장 삭제</button>`;
  row.querySelector(".remove-quote").onclick=()=>{row.remove();if(!$("quoteInputs").children.length)addQuoteInput();};
  $("quoteInputs").appendChild(row);
}
function openDialog(book){
  $("bookForm").reset();$("bookId").value=book?.id||"";selectedRating=book?.rating||5;
  $("title").value=book?.title||"";$("author").value=book?.author||"";$("genre").value=book?.genre||"소설";
  editingReadingDates=book?readingDatesOf(book).slice():[];$("readingDateInput").value="";renderReadingDates();$("cover").value=book?.cover||"";
  $("review").value=book?.review||"";renderQuoteInputs(book?.quotes||[]);renderStars();$("bookDialog").showModal();
}
$("openAdd").onclick=()=>openDialog();$("openAddTop").onclick=()=>openDialog();$("closeDialog").onclick=()=>$("bookDialog").close();
$("addQuote").onclick=()=>addQuoteInput();
$("addReadingDate").onclick=()=>addReadingDate($("readingDateInput").value);
$("readingDateInput").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();addReadingDate(e.target.value);}});
$("readingDateList").addEventListener("click",e=>{const b=e.target.closest("[data-remove-date]");if(!b)return;editingReadingDates=editingReadingDates.filter(d=>d!==b.dataset.removeDate);renderReadingDates();});
$("starPicker").addEventListener("click",e=>{const b=e.target.closest("[data-star]");if(b){selectedRating=Number(b.dataset.star);renderStars();}});
$("filters").addEventListener("click",e=>{const b=e.target.closest("[data-genre]");if(!b)return;activeGenre=b.dataset.genre;document.querySelectorAll(".filter").forEach(x=>x.classList.toggle("active",x===b));render();});
$("bookGrid").addEventListener("click",e=>{
  const edit=e.target.closest("[data-edit]"),del=e.target.closest("[data-delete]");
  if(edit)openDialog(books.find(b=>b.id===edit.dataset.edit));
  if(del&&confirm("이 책의 기록을 삭제할까요?")){books=books.filter(b=>b.id!==del.dataset.delete);save();render();}
});
$("bookForm").addEventListener("submit",e=>{
  e.preventDefault();
  const id=$("bookId").value||("b"+Date.now());
  const quotes=[...$("quoteInputs").querySelectorAll(".quote-row")].map(row=>({text:row.querySelector("textarea").value.trim(),source:row.querySelector("input").value.trim()})).filter(q=>q.text);
  const readingDates=[...editingReadingDates].sort();const item={id,title:$("title").value.trim(),author:$("author").value.trim(),genre:$("genre").value,date:readingDates[0]||"",readingDates,rating:selectedRating,cover:$("cover").value.trim(),review:$("review").value.trim(),quotes};
  const idx=books.findIndex(b=>b.id===id);if(idx>=0)books[idx]=item;else books.push(item);
  save();$("bookDialog").close();activeGenre="전체";document.querySelectorAll(".filter").forEach(x=>x.classList.toggle("active",x.dataset.genre==="전체"));render();
});
$("prevMonth").onclick=()=>{calendarCursor.setMonth(calendarCursor.getMonth()-1);renderCalendar();};
$("nextMonth").onclick=()=>{calendarCursor.setMonth(calendarCursor.getMonth()+1);renderCalendar();};
$("todayMonth").onclick=()=>{const n=new Date();calendarCursor=new Date(n.getFullYear(),n.getMonth(),1);renderCalendar();};
$("calendarGrid").addEventListener("click",e=>{const b=e.target.closest("[data-date]");if(!b)return;selectedCalendarDate=b.dataset.date;calendarCursor=new Date(Number(selectedCalendarDate.slice(0,4)),Number(selectedCalendarDate.slice(5,7))-1,1);renderCalendar();});
render();