const starterBooks = [
  {id:"b1",title:"파반느",author:"박민규",genre:"소설",date:"2026-11-09",readingDates:["2026-11-09"],rating:5,publisher:"",pages:320,currentPage:320,status:"finished",review:"사랑과 상실, 그리고 서로의 삶에 남긴 흔적을 생각하게 한 이야기.",quotes:[{text:"우리는 서로의 삶에 어떤 흔적을 남기며 살아가는 걸까.",source:"나의 독서 노트"}],cover:""},
  {id:"b2",title:"노르웨이의 숲",author:"무라카미 하루키",genre:"소설",date:"2026-10-20",readingDates:["2026-10-20"],rating:4,publisher:"",pages:280,currentPage:280,status:"finished",review:"상실과 기억을 따라가며 청춘의 불완전함을 돌아보게 하는 작품.",quotes:[{text:"기억은 사람을 조용히 다른 곳으로 데려간다.",source:"나의 독서 노트"}],cover:""},
  {id:"b3",title:"이방인",author:"알베르 카뮈",genre:"인문",date:"2026-09-14",readingDates:["2026-09-14"],rating:4,publisher:"",pages:160,currentPage:160,status:"finished",review:"당연하다고 여겼던 감정과 사회의 기준을 낯설게 바라보게 했다.",quotes:[{text:"오늘 엄마가 죽었다. 어쩌면 어제였는지도 모른다.",source:"첫 문장"}],cover:""}
];
const $=id=>document.getElementById(id), safe=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let books=JSON.parse(localStorage.getItem("readingRoomBooks")||"null")||starterBooks;
books=books.map(b=>({...b,readingDates:Array.isArray(b.readingDates)?b.readingDates:(b.date?[b.date]:[]),quotes:Array.isArray(b.quotes)?b.quotes:(b.quote?[{text:b.quote,source:b.quoteSource||""}]:[]),publisher:b.publisher||"",pages:Number(b.pages)||0,status:b.status||"finished",currentPage:Number(b.currentPage)||Number(b.pages)||0}));
let wishlist=JSON.parse(localStorage.getItem("readingRoomWishlist")||"[]");
let genres=JSON.parse(localStorage.getItem("readingRoomGenres")||"null")||["소설","에세이","인문","시","역사","사회","과학","철학","예술","자기계발","경제·경영","여행","만화","기타"];
let genreColors=JSON.parse(localStorage.getItem("readingRoomGenreColors")||"null")||{"소설":"#78836b","에세이":"#a77b58","인문":"#8b4f4d","시":"#8c8aa2","역사":"#536b7a","사회":"#9a8758","과학":"#5e817e","철학":"#685b72","예술":"#b06d55","자기계발":"#718b75","경제·경영":"#526b59","여행":"#b27e50","만화":"#9a6b82","기타":"#81776b"};
let selectedRating=5,activeGenre="전체",activeStatus="all",calendarCursor=new Date(new Date().getFullYear(),new Date().getMonth(),1),selectedCalendarDate="",editingReadingDates=[],selectedQuoteBook="";
const save=()=>localStorage.setItem("readingRoomBooks",JSON.stringify(books));
const saveGenres=()=>localStorage.setItem("readingRoomGenres",JSON.stringify(genres));
const saveGenreColors=()=>localStorage.setItem("readingRoomGenreColors",JSON.stringify(genreColors));
const saveWishlist=()=>localStorage.setItem("readingRoomWishlist",JSON.stringify(wishlist));
const readingDatesOf=b=>Array.isArray(b.readingDates)?b.readingDates:(b.date?[b.date]:[]);
const dateLabel=d=>d?new Date(d+"T00:00:00").toLocaleDateString("ko-KR",{year:"numeric",month:"long",day:"numeric"}):"날짜 미기록";
const coverMarkup=b=>b.cover?`<img src="${safe(b.cover)}" alt="${safe(b.title)} 표지" onerror="this.style.display='none'">`:`<span class="spine-title">${safe(b.title)}</span>`;
const starText=n=>"★".repeat(Math.floor(n))+(n%1?"½":"")+"☆".repeat(5-Math.ceil(n));
function render(){
 renderFilters();let visible=books.filter(b=>activeStatus==="all"||b.status===activeStatus);
 const sort=$("shelfSort")?.value||"default";
 if(sort==="rating-desc")visible.sort((a,b)=>(b.rating||0)-(a.rating||0));else if(sort==="rating-asc")visible.sort((a,b)=>(a.rating||0)-(b.rating||0));else if(sort==="genre")visible.sort((a,b)=>(a.genre||"").localeCompare(b.genre||"ko"));else if(sort==="date-desc")visible.sort((a,b)=>(readingDatesOf(b).slice(-1)[0]||"").localeCompare(readingDatesOf(a).slice(-1)[0]||""));else if(sort==="date-asc")visible.sort((a,b)=>(readingDatesOf(a)[0]||"").localeCompare(readingDatesOf(b)[0]||""));else visible.sort((a,b)=>(Number(a.pages)||180)-(Number(b.pages)||180));
 const shelf=$("bookGrid");shelf.innerHTML=visible.map(b=>{
  const width=Math.max(25,Math.min(78,22+(Number(b.pages)||180)*0.075)),color=genreColors[b.genre]||"#78836b",pct=Number(b.pages)?Math.min(100,Math.round((Number(b.currentPage)||0)/Number(b.pages)*100)):0;
  let meta=`<div class="shelf-paused">중단</div>`;
  if(b.status==="reading")meta=`<div class="shelf-progress"><span>${pct}%</span><i><b style="width:${pct}%"></b></i></div>`;
  else if(b.status==="finished")meta=`<div class="shelf-rating">${Number(b.rating||0).toFixed(1)} ★</div>`;
  return `<article class="shelf-book" style="--spine-width:${width}px;--genre-color:${safe(color)}"><button class="book-spine" data-view="${safe(b.id)}" title="${safe(b.title)}"><span class="spine-title">${safe(b.title)}</span></button>${meta}</article>`
 }).join("");
 shelf.style.setProperty("--shelf-rows",Math.max(1,Math.ceil(visible.length/10)));
 $("emptyState").hidden=visible.length>0;$("bookCount").textContent=String(books.length).padStart(2,"0");$("quoteCount").textContent=String(books.reduce((n,b)=>n+b.quotes.length,0)).padStart(2,"0");$("yearCount").textContent=new Date().getFullYear();
 renderCalendar();renderQuoteBooks();renderWishlist();
}
function renderFilters(){
 $("genre").innerHTML=genres.map(g=>`<option>${safe(g)}</option>`).join("");
 $("wishGenre").innerHTML=genres.map(g=>`<option value="${safe(g)}">${safe(g)}</option>`).join("");
}
function renderCalendar(){
 const y=calendarCursor.getFullYear(),m=calendarCursor.getMonth(),dated=books.filter(b=>readingDatesOf(b).length);
 $("calendarMonthLabel").textContent=`${y}년 ${m+1}월`;
 const entries=dated.flatMap(b=>readingDatesOf(b).filter(d=>Number(d.slice(0,4))===y).map(date=>({book:b,date})));
 $("calendarYearTotal").textContent=new Set(entries.map(x=>x.book.id)).size;$("calendarDayTotal").textContent=new Set(entries.map(x=>x.date)).size;$("calendarMonthTotal").textContent=new Set(entries.map(x=>x.date.slice(0,7))).size;
 const first=new Date(y,m,1),last=new Date(y,m+1,0),start=first.getDay(),count=Math.ceil((start+last.getDate())/7)*7,now=new Date(),today=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
 let out="";for(let i=0;i<count;i++){const d=new Date(y,m,1-start+i),key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`,list=dated.filter(b=>readingDatesOf(b).includes(key)),covers=list.slice(0,3).map(b=>b.cover?`<img class="calendar-cover" src="${safe(b.cover)}" alt="">`:`<span class="calendar-cover-fallback">${safe(b.title.slice(0,4))}</span>`).join("");out+=`<button class="calendar-day ${d.getMonth()!==m?"muted":""} ${key===selectedCalendarDate?"selected":""} ${key===today?"today":""}" data-date="${key}"><span class="day-number">${d.getDate()}</span><span class="calendar-covers">${covers}${list.length>3?`<span class="more-cover">+${list.length-3}</span>`:""}</span></button>`}
 $("calendarGrid").innerHTML=out;renderSelectedDay();
}
function renderSelectedDay(){
 if(!selectedCalendarDate){$("selectedDayLabel").textContent="날짜를 선택해 주세요";$("selectedDayBooks").innerHTML='<p class="day-empty">달력에서 날짜를 선택하면 그날 읽은 책의 표지가 표시됩니다.</p>';return}
 const [y,m,d]=selectedCalendarDate.split("-"),list=books.filter(b=>readingDatesOf(b).includes(selectedCalendarDate));$("selectedDayLabel").textContent=`${y}년 ${Number(m)}월 ${Number(d)}일`;
 $("selectedDayBooks").innerHTML=list.length?list.map(b=>`<article class="day-book">${b.cover?`<img src="${safe(b.cover)}" alt="">`:`<div class="day-cover-fallback">${safe(b.title)}</div>`}<p>${safe(b.title)}</p></article>`).join(""):'<p class="day-empty">이날 기록된 책이 없어요.</p>';
}
let quoteAnimate=false;
const HL_COLORS=["yellow","pink","mint"];
function applyHL(text,hl,s0,e0,c){
 const n=text.length,arr=new Array(n).fill(null);
 (hl||[]).forEach(h=>{for(let i=Math.max(0,h.s);i<Math.min(n,h.e);i++)arr[i]=h.c});
 for(let i=Math.max(0,s0);i<Math.min(n,e0);i++)arr[i]=c;
 const runs=[];let i=0;
 while(i<n){if(!arr[i]){i++;continue}let j=i;while(j<n&&arr[j]===arr[i])j++;runs.push({s:i,e:j,c:arr[i]});i=j}
 return runs;
}
function quoteTextHTML(q){
 const t=q.text||"",runs=applyHL(t,q.highlights,0,0,null);let out="",pos=0;
 runs.forEach(r=>{out+=safe(t.slice(pos,r.s))+`<mark class="hl hl-${safe(r.c)}">${safe(t.slice(r.s,r.e))}</mark>`;pos=r.e});
 return out+safe(t.slice(pos));
}
function renderQuoteBooks(){
 const withQuotes=books.filter(b=>b.quotes.length);
 if(!withQuotes.some(x=>x.id===selectedQuoteBook))selectedQuoteBook="";
 $("quoteBookGrid").innerHTML=withQuotes.length?withQuotes.map(b=>`<button class="quote-book-card ${selectedQuoteBook===b.id?"active":""}" aria-expanded="${selectedQuoteBook===b.id}" data-quote-book="${safe(b.id)}">${b.cover?`<img src="${safe(b.cover)}" alt="">`:`<span class="quote-cover-fallback">${safe(b.title)}</span>`}<span><strong>${safe(b.title)}</strong><small>${b.quotes.length}개의 문장</small></span></button>`).join(""):'<p class="empty-state">아직 문장을 모아둔 책이 없어요. 책을 기록할 때 문장을 추가해 보세요.</p>';
 const b=withQuotes.find(x=>x.id===selectedQuoteBook),box=$("quoteDetail");
 $("quoteHint").hidden=!!b||!withQuotes.length;
 if(!b){box.hidden=true;box.innerHTML="";return}
 box.innerHTML=`<div class="quote-detail-heading"><div><p class="eyebrow">QUOTES FROM THIS BOOK</p><h3>${safe(b.title)}</h3><p>${safe(b.author||"")} · ${b.quotes.length}개의 문장</p></div><button class="text-button" data-edit-quotes="${safe(b.id)}">문장 편집</button></div><p class="hl-tip">문장을 드래그하면 형광펜 도구가 나타나요.</p><div class="saved-quotes">${b.quotes.map((q,i)=>`<blockquote class="${quoteAnimate?"pop":""}" style="--i:${i}"><span class="q-mark">“</span><span class="quote-text" data-qi="${i}">${quoteTextHTML(q)}</span><span class="q-mark">”</span><cite>${safe(q.source||"출처 미기록")}</cite></blockquote>`).join("")}</div>`;
 box.hidden=false;
 if(quoteAnimate){quoteAnimate=false;setTimeout(()=>box.scrollIntoView({behavior:"smooth",block:"nearest"}),60)}
}
/* ---- highlighter ---- */
const hlBar=document.createElement("div");hlBar.id="hlToolbar";hlBar.hidden=true;
hlBar.innerHTML=HL_COLORS.map(c=>`<button type="button" class="hl-dot hl-dot-${c}" data-hl="${c}" aria-label="${c} 형광펜"></button>`).join("")+'<button type="button" class="hl-erase" data-hl="erase">지우기</button>';
document.body.appendChild(hlBar);
let pendingSel=null,selTimer=null;
function getSelInfo(){
 const sel=window.getSelection();if(!sel||!sel.rangeCount||sel.isCollapsed)return null;
 const r=sel.getRangeAt(0),node=r.commonAncestorContainer,el=(node.nodeType===1?node:node.parentElement)?.closest(".quote-text");
 if(!el||!$("quoteDetail").contains(el))return null;
 const pre=document.createRange();pre.selectNodeContents(el);pre.setEnd(r.startContainer,r.startOffset);
 const s0=pre.toString().length,len=r.toString().length;if(!len)return null;
 return{el,s:s0,e:s0+len,rect:r.getBoundingClientRect(),qi:Number(el.dataset.qi)};
}
function updateHlBar(){
 const info=getSelInfo();pendingSel=info;
 if(!info){hlBar.hidden=true;return}
 hlBar.hidden=false;
 const w=hlBar.offsetWidth,coarse=matchMedia("(pointer:coarse)").matches;
 let left=info.rect.left+info.rect.width/2-w/2;left=Math.max(8,Math.min(window.innerWidth-w-8,left));
 let top=coarse?info.rect.bottom+14:info.rect.top-hlBar.offsetHeight-10;if(top<8)top=info.rect.bottom+12;
 hlBar.style.left=left+"px";hlBar.style.top=top+"px";
}
document.addEventListener("selectionchange",()=>{clearTimeout(selTimer);selTimer=setTimeout(updateHlBar,140)});
window.addEventListener("scroll",()=>{if(!hlBar.hidden)updateHlBar()},{passive:true});
hlBar.addEventListener("pointerdown",e=>e.preventDefault());
hlBar.addEventListener("click",e=>{
 const btn=e.target.closest("[data-hl]");if(!btn||!pendingSel)return;
 const info=pendingSel,book=books.find(x=>x.id===selectedQuoteBook),q=book?.quotes[info.qi];if(!q)return;
 const c=btn.dataset.hl==="erase"?null:btn.dataset.hl;
 q.highlights=applyHL(q.text,q.highlights,info.s,info.e,c);
 save();info.el.innerHTML=quoteTextHTML(q);
 window.getSelection().removeAllRanges();hlBar.hidden=true;pendingSel=null;
});
function renderWishlist(){
 $("wishList").innerHTML=wishlist.length?wishlist.map((w,i)=>`<article class="wish-item"><div><strong>${safe(w.title)}</strong><small>${safe(w.author||"저자 미기록")} · ${safe(w.genre||"기타")}</small></div><button data-remove-wish="${i}">목록에서 삭제</button></article>`).join(""):'<p class="empty-state">아직 담아둔 책이 없어요.</p>';
}
function updateWishSearch(){
 const q=$("wishSearchInput").value.trim(),enc=encodeURIComponent(q);$("kyoboSearch").href=`https://search.kyobobook.co.kr/search?keyword=${enc}`;$("librarySearch").href=`https://www.library.kr/`;$("librarySearch").title="경기도서관 홈페이지에서 도서 검색";
}
function renderStars(){$("starPicker").innerHTML=Array.from({length:10},(_,i)=>{const v=(i+1)/2;return `<button type="button" class="${v<=selectedRating?"selected":""}" data-star="${v}" aria-label="${v.toFixed(1)}점">${v%1?"◐":"★"}</button>`}).join("");$("ratingValue").textContent=`${selectedRating.toFixed(1)} / 5`;}
function renderQuoteInputs(quotes=[]){$("quoteInputs").innerHTML="";(quotes.length?quotes:[{text:"",source:""}]).forEach(q=>addQuoteInput(q.text,q.source,q.highlights))}
function addQuoteInput(text="",source="",hl=[]){const row=document.createElement("div");row.className="quote-row";row.dataset.orig=text;row._hl=Array.isArray(hl)?hl:[];row.innerHTML=`<textarea rows="2" placeholder="인상 깊은 문장을 적어주세요.">${safe(text)}</textarea><input placeholder="출처 / 페이지 (선택)" value="${safe(source)}"><button type="button" class="remove-quote">이 문장 삭제</button>`;row.querySelector("button").onclick=()=>{row.remove();if(!$("quoteInputs").children.length)addQuoteInput()};$("quoteInputs").appendChild(row)}
function renderReadingDates(){$("readingDateList").innerHTML=editingReadingDates.length?editingReadingDates.map(d=>`<span class="reading-date-chip">${dateLabel(d)}<button type="button" data-remove-date="${d}">×</button></span>`).join(""):'<span class="reading-date-help">아직 추가한 날짜가 없어요.</span>'}
function addReadingDate(d){if(!d)return;if(!editingReadingDates.includes(d))editingReadingDates.push(d);editingReadingDates.sort();$("readingDateInput").value="";renderReadingDates()}
function openView(b){
 if(!b)return;const color=genreColors[b.genre]||"#78836b",pct=Number(b.pages)?Math.min(100,Math.round((Number(b.currentPage)||0)/Number(b.pages)*100)):0;
 let status="";
 if(b.status==="finished")status=`<div class="view-rating"><span class="star-rating" style="--r:${Math.max(0,Math.min(5,Number(b.rating)||0))/5*100}%" aria-hidden="true">★★★★★</span><b>${Number(b.rating||0).toFixed(1)}</b></div>`;
 else status=`<div class="view-status">${b.status==="reading"?`읽는 중 · ${pct}%`:"잠시 쉬는 중"}</div>`;
 $("viewBody").innerHTML=`<div class="view-book"><div class="view-cover" style="--genre-color:${safe(color)}"><span class="view-cover-title">${safe(b.title)}</span>${b.cover?`<img src="${safe(b.cover)}" alt="${safe(b.title)} 표지" onerror="this.remove()">`:""}</div><div class="view-info"><h2>${safe(b.title)}</h2>${b.author?`<p class="view-author">${safe(b.author)}</p>`:""}${status}</div></div><div class="view-review"><p class="eyebrow">MY REVIEW</p>${b.review?`<p class="view-review-text">${safe(b.review)}</p>`:'<p class="view-review-empty">아직 남긴 독서평이 없어요.</p>'}</div><button type="button" class="quiet-edit" data-edit-from-view="${safe(b.id)}">정보 수정</button>`;
 $("viewDialog").showModal();
}
function openDialog(book){$("bookForm").reset();$("bookId").value=book?.id||"";$("deleteBook").hidden=!book;selectedRating=Number(book?.rating??5);$("title").value=book?.title||"";$("author").value=book?.author||"";renderFilters();$("genre").value=book?.genre||genres[0];editingReadingDates=book?readingDatesOf(book).slice():[];$("readingDateInput").value="";renderReadingDates();$("publisher").value=book?.publisher||"";$("pages").value=book?.pages||"";$("bookStatus").value=book?.status||"reading";$("currentPage").value=book?.currentPage||"";$("cover").value=book?.cover||"";$("review").value=book?.review||"";renderQuoteInputs(book?.quotes||[]);renderStars();$("bookDialog").showModal()}
$("openAdd").onclick=()=>openDialog();$("openAddTop").onclick=()=>openDialog();$("closeDialog").onclick=()=>$("bookDialog").close();
$("addQuote").onclick=()=>addQuoteInput();$("addReadingDate").onclick=()=>addReadingDate($("readingDateInput").value);$("readingDateInput").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();addReadingDate(e.target.value)}});
$("readingDateList").addEventListener("click",e=>{const b=e.target.closest("[data-remove-date]");if(b){editingReadingDates=editingReadingDates.filter(d=>d!==b.dataset.removeDate);renderReadingDates()}});
$("starPicker").addEventListener("click",e=>{const b=e.target.closest("[data-star]");if(b){selectedRating=Number(b.dataset.star);renderStars()}});
$("shelfTabs").addEventListener("click",e=>{const b=e.target.closest("[data-status]");if(!b)return;activeStatus=b.dataset.status;document.querySelectorAll("#shelfTabs button").forEach(x=>x.classList.toggle("active",x===b));render()});
$("shelfSort").addEventListener("change",render);
$("bookGrid").addEventListener("click",e=>{const v=e.target.closest("[data-view]");if(v)openView(books.find(b=>b.id===v.dataset.view))});
$("closeView").onclick=()=>$("viewDialog").close();
$("viewDialog").addEventListener("click",e=>{if(e.target===$("viewDialog"))$("viewDialog").close();const ed=e.target.closest("[data-edit-from-view]");if(ed){const b=books.find(x=>x.id===ed.dataset.editFromView);$("viewDialog").close();openDialog(b)}});
$("deleteBook").onclick=()=>{const id=$("bookId").value;if(id&&confirm("이 책의 기록을 삭제할까요? 되돌릴 수 없어요.")){books=books.filter(b=>b.id!==id);if(selectedQuoteBook===id)selectedQuoteBook="";save();$("bookDialog").close();render()}};
$("bookForm").addEventListener("submit",e=>{e.preventDefault();const id=$("bookId").value||("b"+Date.now()),quotes=[...$("quoteInputs").querySelectorAll(".quote-row")].map(r=>{const text=r.querySelector("textarea").value.trim();return{text,source:r.querySelector("input").value.trim(),highlights:text===(r.dataset.orig||"").trim()?(r._hl||[]):[]}}).filter(q=>q.text),readingDates=[...editingReadingDates].sort(),item={id,title:$("title").value.trim(),author:$("author").value.trim(),genre:$("genre").value,date:readingDates[0]||"",readingDates,rating:selectedRating,publisher:$("publisher").value.trim(),pages:Number($("pages").value)||0,status:$("bookStatus").value,currentPage:Number($("currentPage").value)||0,cover:$("cover").value.trim(),review:$("review").value.trim(),quotes};const i=books.findIndex(b=>b.id===id);if(i>=0)books[i]=item;else books.push(item);save();$("bookDialog").close();activeGenre="전체";render()});
$("prevMonth").onclick=()=>{calendarCursor.setMonth(calendarCursor.getMonth()-1);renderCalendar()};$("nextMonth").onclick=()=>{calendarCursor.setMonth(calendarCursor.getMonth()+1);renderCalendar()};$("todayMonth").onclick=()=>{const n=new Date();calendarCursor=new Date(n.getFullYear(),n.getMonth(),1);renderCalendar()};
$("calendarGrid").addEventListener("click",e=>{const b=e.target.closest("[data-date]");if(b){selectedCalendarDate=b.dataset.date;calendarCursor=new Date(Number(selectedCalendarDate.slice(0,4)),Number(selectedCalendarDate.slice(5,7))-1,1);renderCalendar()}});
$("quoteBookGrid").addEventListener("click",e=>{const b=e.target.closest("[data-quote-book]");if(!b)return;const id=b.dataset.quoteBook;selectedQuoteBook=selectedQuoteBook===id?"":id;quoteAnimate=!!selectedQuoteBook;hlBar.hidden=true;renderQuoteBooks()});
$("quoteDetail").addEventListener("click",e=>{const b=e.target.closest("[data-edit-quotes]");if(b){openDialog(books.find(x=>x.id===b.dataset.editQuotes));return}const m=e.target.closest("mark.hl");if(m&&window.getSelection().isCollapsed)window.getSelection().selectAllChildren(m)});
$("wishSearchInput").addEventListener("input",updateWishSearch);$("wishSearchButton").onclick=()=>{updateWishSearch();if(!$("wishSearchInput").value.trim()){$("wishSearchInput").focus();return}window.open($("kyoboSearch").href,"_blank","noopener")};
$("addWish").onclick=()=>{const title=$("wishTitle").value.trim();if(!title)return;wishlist.push({title,author:$("wishAuthor").value.trim(),genre:$("wishGenre").value});saveWishlist();$("wishTitle").value="";$("wishAuthor").value="";$("wishGenre").value=genres[0]||"기타";renderWishlist()};
$("wishList").addEventListener("click",e=>{const b=e.target.closest("[data-remove-wish]");if(b){wishlist.splice(Number(b.dataset.removeWish),1);saveWishlist();renderWishlist()}});
$("manageGenres").onclick=()=>{$("genreManageList").innerHTML=genres.map(g=>`<div class="genre-manage-item"><span>${safe(g)}</span><input type="color" value="${safe(genreColors[g]||"#78836b")}" data-genre-color="${safe(g)}"><button data-delete-genre="${safe(g)}">삭제</button></div>`).join("");$("genreDialog").showModal()};
$("closeGenreDialog").onclick=()=>$("genreDialog").close();$("addGenre").onclick=()=>{const g=$("newGenre").value.trim();if(g&&!genres.includes(g)){genres.push(g);genreColors[g]=$("newGenreColor").value;saveGenres();saveGenreColors();$("newGenre").value="";$("genreDialog").close();render();$("manageGenres").click()}};
$("genreManageList").addEventListener("input",e=>{const c=e.target.closest("[data-genre-color]");if(c){genreColors[c.dataset.genreColor]=c.value;saveGenreColors();render()}});
$("genreManageList").addEventListener("click",e=>{const b=e.target.closest("[data-delete-genre]");if(!b)return;const g=b.dataset.deleteGenre;if(books.some(x=>x.genre===g)&&!confirm(`'${g}' 장르의 책이 있어요. 삭제하면 해당 책은 '기타'로 이동합니다. 삭제할까요?`))return;books.forEach(x=>{if(x.genre===g)x.genre="기타"});if(!genres.includes("기타"))genres.push("기타");genres=genres.filter(x=>x!==g);delete genreColors[g];saveGenres();saveGenreColors();save();$("genreDialog").close();render();$("manageGenres").click()});
updateWishSearch();render();
