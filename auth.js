import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const $ = id => document.getElementById(id);
const gate = $("authGate"), form = $("authForm"), submit = $("authSubmit");
let mode = "login", auth, db, appStarted = false, stopSnapshot = null, saveTimer = null, lastSynced = "", dirty = false;
const KEYS = ["readingRoomBooks", "readingRoomWishlist", "readingRoomGenres", "readingRoomGenreColors", "readingRoomFavoriteBookId"];
const defaults = {
  readingRoomBooks: [], readingRoomWishlist: [],
  readingRoomGenres: ["소설","에세이","인문","시","역사","사회","과학","철학","예술","자기계발","경제·경영","여행","만화","기타"],
  readingRoomGenreColors: {"소설":"#78836b","에세이":"#a77b58","인문":"#8b4f4d","시":"#8c8aa2","역사":"#536b7a","사회":"#9a8758","과학":"#5e817e","철학":"#685b72","예술":"#b06d55","자기계발":"#718b75","경제·경영":"#526b59","여행":"#b27e50","만화":"#9a6b82","기타":"#81776b"},
  readingRoomFavoriteBookId: ""
};
function readLocal(){
  const out={};
  for(const key of KEYS){try{const raw=localStorage.getItem(key);out[key]=raw===null?defaults[key]:JSON.parse(raw)}catch{out[key]=defaults[key]}}
  return out;
}
function writeLocal(data){
  for(const key of KEYS){const value=data?.[key]??defaults[key];localStorage.setItem(key,JSON.stringify(value));}
}
function hasLegacyData(data){return (Array.isArray(data.readingRoomBooks)&&data.readingRoomBooks.length>0)||(Array.isArray(data.readingRoomWishlist)&&data.readingRoomWishlist.length>0)||!!localStorage.getItem("readingRoomGenres")||!!localStorage.getItem("readingRoomGenreColors");}
function mergeLegacy(cloud, local){
  const merged={...cloud};
  const byId=new Map((cloud.readingRoomBooks||[]).map(b=>[b.id,b]));
  (local.readingRoomBooks||[]).forEach(b=>{if(!byId.has(b.id))byId.set(b.id,b)});
  merged.readingRoomBooks=[...byId.values()];
  const wishes=new Map((cloud.readingRoomWishlist||[]).map(w=>[`${w.title}|${w.author||""}`,w]));
  (local.readingRoomWishlist||[]).forEach(w=>{const k=`${w.title}|${w.author||""}`;if(!wishes.has(k))wishes.set(k,w)});
  merged.readingRoomWishlist=[...wishes.values()];
  merged.readingRoomGenres=[...new Set([...(cloud.readingRoomGenres||[]),...(local.readingRoomGenres||[])])];
  merged.readingRoomGenreColors={...(cloud.readingRoomGenreColors||{}),...(local.readingRoomGenreColors||{})};
  if(!cloud.readingRoomFavoriteBookId)merged.readingRoomFavoriteBookId=local.readingRoomFavoriteBookId;
  return merged;
}
function payloadString(data){return JSON.stringify(Object.fromEntries(KEYS.map(k=>[k,data[k]??defaults[k]])));}
function userDoc(uid){return doc(db,"users",uid,"readingRoom","library");}
function showError(message){$("authError").textContent=message;$("authError").hidden=false;}
function friendlyError(error){
  const code=error?.code||"";
  if(code.includes("email-already-in-use"))return "이미 사용 중인 아이디예요. 다른 아이디를 선택해 주세요.";
  if(code.includes("invalid-credential")||code.includes("wrong-password")||code.includes("user-not-found"))return "아이디 또는 비밀번호가 올바르지 않아요.";
  if(code.includes("weak-password"))return "비밀번호는 6자 이상으로 설정해 주세요.";
  if(code.includes("network-request-failed"))return "네트워크 연결을 확인한 뒤 다시 시도해 주세요.";
  if(code.includes("operation-not-allowed"))return "Firebase Authentication에서 Email/Password 로그인을 활성화해 주세요.";
  if(code.includes("permission-denied"))return "데이터베이스 권한 설정을 확인해 주세요. README의 보안 규칙을 적용해야 해요.";
  return "처리 중 문제가 생겼어요. Firebase 설정과 연결 상태를 확인해 주세요.";
}
function setMode(next){
  mode=next;document.querySelectorAll("[data-auth-mode]").forEach(b=>b.classList.toggle("active",b.dataset.authMode===mode));
  submit.textContent=mode==="login"?"내 서재로 들어가기":"새 서재 만들기";
  $("authHint").textContent=mode==="login"?"가입할 때 만든 아이디와 비밀번호를 입력해 주세요.":"아이디는 영문·숫자·밑줄로 3~20자, 비밀번호는 6자 이상으로 만들어 주세요.";
  $("authPassword").autocomplete=mode==="login"?"current-password":"new-password";
  $("authError").hidden=true;
}
document.querySelectorAll("[data-auth-mode]").forEach(b=>b.addEventListener("click",()=>setMode(b.dataset.authMode)));
function usernameEmail(username){return `${username.toLowerCase()}@readingroom-account.com`;}
function validUsername(value){return /^[a-zA-Z0-9_]{3,20}$/.test(value);}
async function saveCloud(){
  if(!auth?.currentUser)return;
  const data=readLocal(), json=payloadString(data);
  if(json===lastSynced){dirty=false;return;}
  try{await setDoc(userDoc(auth.currentUser.uid),{...data,updatedAt:serverTimestamp()});lastSynced=json;dirty=false;}
  catch(error){console.error("Cloud save failed",error);lastSynced="";showError("서재 동기화에 실패했어요. 인터넷과 Firebase 보안 규칙을 확인해 주세요.");}
}
function scheduleSave(){dirty=true;clearTimeout(saveTimer);saveTimer=setTimeout(saveCloud,650);}
async function enterApp(user){
  if(stopSnapshot){stopSnapshot();stopSnapshot=null;}
  const ref=userDoc(user.uid), snap=await getDoc(ref), local=readLocal();
  let data;
  const previousUid=localStorage.getItem("readingRoomLastUid");
  if(snap.exists()){
    data=snap.data();
    // Import pre-login local records once on each device, but never copy another signed-in account's data.
    if(!previousUid&&hasLegacyData(local)){data=mergeLegacy(data,local);await setDoc(ref,{...data,updatedAt:serverTimestamp()});}
  }else{
    data=hasLegacyData(local)?local:defaults;
    await setDoc(ref,{...data,updatedAt:serverTimestamp()});
  }
  writeLocal(data);localStorage.setItem("readingRoomLastUid",user.uid);lastSynced=payloadString(data);
  $("accountName").textContent=user.displayName||localStorage.getItem("readingRoomUsername")||"내 서재";
  document.body.classList.remove("auth-locked");gate.hidden=true;
  if(!appStarted){appStarted=true;const script=document.createElement("script");script.src="script.js?v=9";document.body.appendChild(script);}
  stopSnapshot=onSnapshot(ref,docSnap=>{
    if(!docSnap.exists())return;
    const remote=docSnap.data(), remoteJson=payloadString(remote);
    if(remoteJson!==lastSynced&&!dirty){writeLocal(remote);lastSynced=remoteJson;window.dispatchEvent(new Event("readingroom:remote-data"));}
  },error=>{console.error("Cloud listener error",error);});
}
form.addEventListener("submit",async e=>{
  e.preventDefault();$("authError").hidden=true;
  const username=$("authUsername").value.trim(),password=$("authPassword").value;
  if(!validUsername(username)){showError("아이디는 영문·숫자·밑줄로 3~20자여야 해요.");return;}
  if(password.length<6){showError("비밀번호는 6자 이상이어야 해요.");return;}
  submit.disabled=true;submit.textContent="연결 중…";
  try{
    let credential;
    if(mode==="signup"){
      credential=await createUserWithEmailAndPassword(auth,usernameEmail(username),password);
      await (await import("https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js")).updateProfile(credential.user,{displayName:username});
      await setDoc(doc(db,"users",credential.user.uid,"profile","private"),{username,createdAt:serverTimestamp()});
    }else credential=await signInWithEmailAndPassword(auth,usernameEmail(username),password);
    localStorage.setItem("readingRoomUsername",username);
  }catch(error){showError(friendlyError(error));}
  finally{submit.disabled=false;submit.textContent=mode==="login"?"내 서재로 들어가기":"새 서재 만들기";}
});
window.addEventListener("readingroom:local-change",scheduleSave);
window.addEventListener("readingroom:logout",async()=>{clearTimeout(saveTimer);await saveCloud();if(stopSnapshot){stopSnapshot();stopSnapshot=null;}await signOut(auth);location.reload();});

const configured=typeof firebaseConfig.apiKey==="string"&&!firebaseConfig.apiKey.startsWith("PASTE_")&&typeof firebaseConfig.projectId==="string"&&!firebaseConfig.projectId.startsWith("PASTE_");
if(!configured){$("authConfigNotice").hidden=false;submit.disabled=true;$("authConfigNotice").textContent="Firebase 연결 설정이 아직 비어 있어요. README의 설정을 완료한 뒤 이용할 수 있어요.";}
else{
  try{
    const app=initializeApp(firebaseConfig);auth=getAuth(app);db=getFirestore(app);
    onAuthStateChanged(auth,async user=>{
      if(user){try{await enterApp(user)}catch(error){console.error(error);showError(friendlyError(error));}}
    });
  }catch(error){console.error(error);showError("Firebase 설정을 확인해 주세요.");}
}
