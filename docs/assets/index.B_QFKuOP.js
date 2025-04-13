import{r as we,a as ge}from"./react.CvRECnwm.js";import{o as xe,y as f,r as m,L as _e,m as je}from"./vendor.DOUekRLu.js";(function(){const s=document.createElement("link").relList;if(s&&s.supports&&s.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))n(o);new MutationObserver(o=>{for(const a of o)if(a.type==="childList")for(const i of a.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&n(i)}).observe(document,{childList:!0,subtree:!0});function r(o){const a={};return o.integrity&&(a.integrity=o.integrity),o.referrerPolicy&&(a.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?a.credentials="include":o.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function n(o){if(o.ep)return;o.ep=!0;const a=r(o);fetch(o.href,a)}})();var z={exports:{}},P={};/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var te;function Ie(){if(te)return P;te=1;var e=we(),s=Symbol.for("react.element"),r=Symbol.for("react.fragment"),n=Object.prototype.hasOwnProperty,o=e.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,a={key:!0,ref:!0,__self:!0,__source:!0};function i(u,c,p){var l,d={},h=null,y=null;p!==void 0&&(h=""+p),c.key!==void 0&&(h=""+c.key),c.ref!==void 0&&(y=c.ref);for(l in c)n.call(c,l)&&!a.hasOwnProperty(l)&&(d[l]=c[l]);if(u&&u.defaultProps)for(l in c=u.defaultProps,c)d[l]===void 0&&(d[l]=c[l]);return{$$typeof:s,type:u,key:h,ref:y,props:d,_owner:o.current}}return P.Fragment=r,P.jsx=i,P.jsxs=i,P}var se;function be(){return se||(se=1,z.exports=Ie()),z.exports}var t=be(),T={},ne;function Se(){if(ne)return T;ne=1;var e=ge();return T.createRoot=e.createRoot,T.hydrateRoot=e.hydrateRoot,T}var De=Se();class A extends Error{}A.prototype.name="InvalidTokenError";function Ne(e){return decodeURIComponent(atob(e).replace(/(.)/g,(s,r)=>{let n=r.charCodeAt(0).toString(16).toUpperCase();return n.length<2&&(n="0"+n),"%"+n}))}function Ee(e){let s=e.replace(/-/g,"+").replace(/_/g,"/");switch(s.length%4){case 0:break;case 2:s+="==";break;case 3:s+="=";break;default:throw new Error("base64 string is not of the correct length")}try{return Ne(s)}catch{return atob(s)}}function oe(e,s){if(typeof e!="string")throw new A("Invalid token specified: must be a string");s||(s={});const r=s.header===!0?0:1,n=e.split(".")[r];if(typeof n!="string")throw new A(`Invalid token specified: missing part #${r+1}`);let o;try{o=Ee(n)}catch(a){throw new A(`Invalid token specified: invalid base64 for part #${r+1} (${a.message})`)}try{return JSON.parse(o)}catch(a){throw new A(`Invalid token specified: invalid json for part #${r+1} (${a.message})`)}}const Ce={DB_NAME:"money",DB_VERSION:1},{DB_NAME:Re,DB_VERSION:ke}=window.DB_CONFIG||Ce;let J=null;async function I(){return J||(J=await xe(Re,ke,{upgrade(e,s,r,n){let o;e.objectStoreNames.contains("invests")?o=n.objectStore("invests"):(o=e.createObjectStore("invests",{keyPath:"id",autoIncrement:!0}),o.createIndex("isActiveIdx","isActive",{unique:!1}),o.createIndex("updatedAtIdx","updatedAt",{unique:!1}));let a;e.objectStoreNames.contains("payments")?a=n.objectStore("payments"):(a=e.createObjectStore("payments",{keyPath:"id",autoIncrement:!0}),a.createIndex("investIdIdx","investId",{unique:!1}),a.createIndex("updatedAtIdx","updatedAt",{unique:!1})),a&&!a.indexNames.contains("isPayedIdx")&&a.createIndex("isPayedIdx","isPayed",{unique:!1})},blocked(){console.log("База данных заблокирована другой вкладкой")},blocking(){console.log("Эта вкладка блокирует обновление базы данных в другой вкладке")},terminated(){console.log("База данных была неожиданно закрыта")}})),J}async function B(e={}){const n=(await I()).transaction("payments").objectStore("payments");return e.id!==void 0?n.index("investIdIdx").getAll(e.id):e.updatedAt!==void 0?n.index("updatedAtIdx").getAll(IDBKeyRange.lowerBound(e.updatedAt)):e.isPayed!==void 0?n.index("isPayedIdx").getAll(e.isPayed):n.getAll()}async function Pe(e,s,r,n){const i=(await I()).transaction("payments","readwrite").objectStore("payments"),u={investId:e,money:Math.round(s*r),paymentDate:n,isPayed:0,updatedAt:new Date};return i.add(u)}async function de(e){const n=(await I()).transaction("payments","readwrite").objectStore("payments"),o=await n.get(e);if(!o)throw new Error("Payment not found");return o.isPayed=1,o.updatedAt=new Date,n.put(o)}async function Fe(e,s){const o=(await I()).transaction(["payments"],"readwrite").objectStore("payments"),a=await o.get(e);if(!a)throw new Error("Платеж не найден");const i={...a,...s,updatedAt:new Date},u=await o.put(i);return window.dispatchEvent(new CustomEvent("fetchInvests")),u}async function U(e={}){const n=(await I()).transaction("invests").objectStore("invests");return e.filterOnlyActive===1?n.index("isActiveIdx").getAll(1):e.updatedAt!==void 0?n.index("updatedAtIdx").getAll(IDBKeyRange.lowerBound(e.updatedAt)):n.getAll()}async function Ae(e,s,r){const a=(await I()).transaction("invests","readwrite").objectStore("invests"),i={money:e,incomeRatio:s,createdDate:r,closedDate:null,isActive:1,updatedAt:new Date};return a.add(i)}async function Be(e){const n=(await I()).transaction("invests","readwrite").objectStore("invests"),o=await n.get(e);if(!o)throw new Error("Invest not found");return o.isActive=0,o.closedDate=new Date,o.updatedAt=new Date,n.put(o)}async function $e(e,s){const r=s.money!==void 0?await B({id:e,isPayed:0}):[],o=(await I()).transaction(["invests","payments"],"readwrite"),a=o.objectStore("invests"),i=await a.get(e);if(!i)throw new Error("Инвестиция не найдена");const u={...i,...s,updatedAt:new Date};if(await a.put(u),s.money!==void 0){const c=o.objectStore("payments");for(const p of r){const l={...p,money:s.money*(i.incomeRatio||X),updatedAt:new Date};await c.put(l)}}return await o.done,window.dispatchEvent(new CustomEvent("fetchInvests")),e}const Q="https://perkin.alwaysdata.net/money/api";class L extends Error{constructor(s,r,n){super(s),this.status=r,this.statusText=n,this.name="ApiError"}}const re={retries:3,retryDelay:1e3};async function ue(e,s={}){const{retries:r=re.retries,retryDelay:n=re.retryDelay,...o}=s;let a=null;for(let i=0;i<=r;i++)try{const u=localStorage.getItem("token");if(!u)throw new L("Токен не найден",401);const c=await fetch(Q+e,{...o,headers:{"Content-Type":"application/json",Authorization:`Bearer ${u}`,...o.headers}});if(!c.ok){const l=new L(`HTTP ошибка: ${c.status}`,c.status,c.statusText);throw c.status===401?(f.error("Сессия истекла. Пожалуйста, авторизуйтесь заново"),l):(c.status<500&&c.status!==429,l)}return await c.json()}catch(u){if(a=u,i===r||u instanceof L&&u.status&&u.status<500&&u.status!==429){const c=u instanceof L?u.message:"Произошла сетевая ошибка";throw f.error(c),u}await new Promise(c=>setTimeout(c,n*(i+1)))}throw a||new Error("Неизвестная ошибка")}async function qe(e,s={}){return ue(e,{method:"GET",...s})}async function Te(e,s,r={}){return ue(e,{method:"POST",body:JSON.stringify(s),...r})}const X=.05;async function me(){const e=await U({filterOnlyActive:1});if(e.length)for(const s of e){let r=s.createdDate;const o=[...await B({id:s.id})].sort((v,w)=>v.paymentDate.getTime()-w.paymentDate.getTime()),a=o.length>0?o[o.length-1]:null;if(a&&!a.isPayed)continue;a&&(r=a.paymentDate);const i=s.createdDate.getDate(),u=r.getMonth(),c=r.getFullYear();let p=u+1,l=c;p>11&&(p=0,l+=1);const d=new Date(l,p+1,0).getDate(),h=i>d?d:i,y=new Date(l,p,h,0,0,0,0);await Pe(s.id,s.money,s.incomeRatio||X,y)}}async function fe(e,s=!1){const n=(await I()).transaction(["invests","payments"],"readwrite"),o=n.objectStore("invests"),a=n.objectStore("payments");s&&(await o.clear(),await a.clear());for(const i of e.invests){const u={...i,createdDate:new Date(i.createdDate),updatedAt:new Date(i.updatedAt),closedDate:i.closedDate?new Date(i.closedDate):void 0};await o.put(u)}for(const i of e.payments){const u={...i,paymentDate:new Date(i.paymentDate),updatedAt:new Date(i.updatedAt)};await a.put(u)}}async function Le(){const e=await U(),s=await B(),r=JSON.stringify({invests:e,payments:s});try{await navigator.clipboard.writeText(r),f.success("Данные скопированы в буфер обмена")}catch{f.error("Не удалось скопировать данные в буфер обмена")}}async function pe(){if(!localStorage.getItem("token"))return;const e=localStorage.getItem("lastSyncDate")||"";f.info("Получаю обновления...");const s=await qe(`/updates?since=${e}`);if(s.status==="success"){const r={invests:s.invests||[],payments:s.payments||[]};await fe(r),f.success("Обновления успешно применены"),window.dispatchEvent(new CustomEvent("fetchInvests"))}else s.status==="no_updates"?f.info("Обновлений нет"):f.warn(s.status);localStorage.setItem("lastSyncDate",new Date().toISOString())}async function $(){if(!localStorage.getItem("token"))return;const e=localStorage.getItem("lastSyncDate");let s={},r={};e&&(s={updatedAt:new Date(e)},r={updatedAt:new Date(e)});const n=await U(s),o=await B(r);if(!n.length&&!o.length)return;const a={invests:n,payments:o},i=f.info("Отправляю данные...",{autoClose:!1});try{const u=await Te("/update",a);f.done(i),u.status==="success"&&f.success("Новые данные успешно отправлены на сервер")}catch{f.done(i)}}const ye=m.createContext(void 0),Me=({children:e})=>{const[s,r]=m.useState(null),n=a=>{localStorage.setItem("token",a);const i=oe(a);r(i)},o=()=>{localStorage.removeItem("token"),r(null)};return m.useEffect(()=>{const a=localStorage.getItem("token");if(a)try{const i=oe(a);r(i)}catch(i){console.error("Ошибка при декодировании JWT",i),o()}},[]),m.useEffect(()=>{s&&pe().then(()=>{window.dispatchEvent(new CustomEvent("fetchInvests"))}).catch(a=>{console.error("Ошибка при синхронизации:",a)})},[s]),t.jsx(ye.Provider,{value:{user:s,login:n,logout:o},children:e})},W=()=>{const e=m.useContext(ye);if(!e)throw new Error("useUser должен использоваться внутри UserProvider");return e},Oe="_menuContainer_1544v_1",Ge="_menuButton_1544v_8",Ue="_menuDropdownContent_1544v_16",V={menuContainer:Oe,menuButton:Ge,menuDropdownContent:Ue},We="_menuButton_nj68m_1",ze={menuButton:We},N=({onClick:e,children:s})=>t.jsx("button",{className:ze.menuButton,type:"button",onClick:e,children:s}),Je="_userName_1mfy7_1",Ve={userName:Je},Ye=()=>{const{user:e}=W();return t.jsx("div",{className:Ve.userName,children:e?e.username:""})},He="_importForm_1loee_1",Ke="_formGroup_1loee_15",Ze="_errorInput_1loee_40",Qe="_errorText_1loee_44",Xe="_formActions_1loee_50",Y={importForm:He,formGroup:Ke,errorInput:Ze,errorText:Qe,formActions:Xe},et=({onSuccess:e})=>{const[s,r]=m.useState(""),n=async o=>{o.preventDefault();const a=s.trim();try{const i=JSON.parse(a);await fe(i,!0),f.success("Импорт завершен"),e(),window.dispatchEvent(new CustomEvent("fetchInvests"))}catch{f.error("Не удалось распарсить данные")}};return t.jsxs("form",{className:Y.importForm,onSubmit:n,children:[t.jsx("h2",{children:"Импорт"}),t.jsxs("div",{className:Y.formGroup,children:[t.jsx("label",{htmlFor:"import-string",children:"JSON:"}),t.jsx("textarea",{rows:10,id:"import-string",value:s,onChange:o=>r(o.target.value),required:!0})]}),t.jsx("div",{className:Y.formActions,children:t.jsx("button",{type:"submit",children:"Импортировать"})})]})},tt="_overlay_skzxb_1",st="_popup_skzxb_14",ae={overlay:tt,popup:st},C=({children:e,onClose:s})=>(m.useEffect(()=>{const r=n=>{n.key==="Escape"&&s()};return document.addEventListener("keydown",r),()=>document.removeEventListener("keydown",r)},[s]),t.jsx("div",{className:ae.overlay,onClick:s,children:t.jsx("div",{className:ae.popup,onClick:r=>r.stopPropagation(),children:e})})),nt="_loginForm_1vymo_1",ot="_formGroup_1vymo_15",rt="_errorInput_1vymo_38",at="_errorText_1vymo_42",it="_formActions_1vymo_48",S={loginForm:nt,formGroup:ot,errorInput:rt,errorText:at,formActions:it},ct=({onSuccess:e})=>{const{login:s}=W(),[r,n]=m.useState(""),[o,a]=m.useState(""),[i,u]=m.useState({}),c=async l=>{if(l.preventDefault(),u({}),!r||!o){f.error("Заполните все поля");return}try{const d=await fetch(`${Q}/login`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:r,password:o})});if(!d.ok){const y=await d.json();if(y.error==="invalid_credentials"){f.error("Неверный email или пароль");return}if(y.error==="validation_errors"){u(y.errors);return}throw new Error(y.message||"Ошибка при входе")}const{token:h}=await d.json();s(h),f.success("Вход выполнен успешно"),e()}catch(d){f.error(`Ошибка: ${d instanceof Error?d.message:"Неизвестная ошибка"}`)}},p=l=>{var d;return((d=i[l])==null?void 0:d.length)>0?i[l][0]:""};return t.jsxs("form",{className:S.loginForm,onSubmit:c,children:[t.jsx("h2",{children:"Вход"}),t.jsxs("div",{className:S.formGroup,children:[t.jsx("label",{htmlFor:"email",children:"Email:"}),t.jsx("input",{type:"email",id:"email",value:r,onChange:l=>n(l.target.value),className:i.email?S.errorInput:"",required:!0}),p("email")&&t.jsx("div",{className:S.errorText,children:p("email")})]}),t.jsxs("div",{className:S.formGroup,children:[t.jsx("label",{htmlFor:"password",children:"Пароль:"}),t.jsx("input",{type:"password",id:"password",value:o,onChange:l=>a(l.target.value),className:i.password?S.errorInput:"",required:!0}),p("password")&&t.jsx("div",{className:S.errorText,children:p("password")})]}),t.jsx("div",{className:S.formActions,children:t.jsx("button",{type:"submit",children:"Войти"})})]})},lt="_registerForm_4l4og_1",dt="_formGroup_4l4og_15",ut="_errorInput_4l4og_38",mt="_errorText_4l4og_42",ft="_formActions_4l4og_48",g={registerForm:lt,formGroup:dt,errorInput:ut,errorText:mt,formActions:ft},pt=({onSuccess:e})=>{const{login:s}=W(),[r,n]=m.useState(""),[o,a]=m.useState(""),[i,u]=m.useState(""),[c,p]=m.useState(""),[l,d]=m.useState({}),h=async v=>{if(v.preventDefault(),d({}),!r||!o||!i||!c){f.error("Заполните все поля");return}if(i!==c){d({confirmPassword:["Пароли не совпадают"]});return}try{const w=await fetch(`${Q}/register`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:r,username:o,password:i})});if(!w.ok){const b=await w.json();if(b.error==="user_exists"){f.error("Такой пользователь уже существует");return}if(b.error==="validation_errors"){d(b.errors);return}throw new Error(b.message||"Ошибка при регистрации")}const{token:R}=await w.json();s(R),f.success("Регистрация выполнена успешно"),e()}catch(w){f.error(`Ошибка: ${w instanceof Error?w.message:"Неизвестная ошибка"}`)}},y=v=>{var w;return((w=l[v])==null?void 0:w.length)>0?l[v][0]:""};return t.jsxs("form",{className:g.registerForm,onSubmit:h,children:[t.jsx("h2",{children:"Регистрация"}),t.jsxs("div",{className:g.formGroup,children:[t.jsx("label",{htmlFor:"email",children:"Email:"}),t.jsx("input",{type:"email",id:"email",value:r,onChange:v=>n(v.target.value),className:l.email?g.errorInput:"",required:!0}),y("email")&&t.jsx("div",{className:g.errorText,children:y("email")})]}),t.jsxs("div",{className:g.formGroup,children:[t.jsx("label",{htmlFor:"username",children:"Имя пользователя:"}),t.jsx("input",{type:"text",id:"username",value:o,onChange:v=>a(v.target.value),className:l.username?g.errorInput:"",required:!0}),y("username")&&t.jsx("div",{className:g.errorText,children:y("username")})]}),t.jsxs("div",{className:g.formGroup,children:[t.jsx("label",{htmlFor:"password",children:"Пароль:"}),t.jsx("input",{type:"password",id:"password",value:i,onChange:v=>u(v.target.value),className:l.password?g.errorInput:"",required:!0}),y("password")&&t.jsx("div",{className:g.errorText,children:y("password")})]}),t.jsxs("div",{className:g.formGroup,children:[t.jsx("label",{htmlFor:"confirmPassword",children:"Подтвердите пароль:"}),t.jsx("input",{type:"password",id:"confirmPassword",value:c,onChange:v=>p(v.target.value),className:l.confirmPassword?g.errorInput:"",required:!0}),y("confirmPassword")&&t.jsx("div",{className:g.errorText,children:y("confirmPassword")})]}),t.jsx("div",{className:g.formActions,children:t.jsx("button",{type:"submit",children:"Зарегистрироваться"})})]})},yt="_settingsForm_1iuzq_1",ht="_formGroup_1iuzq_15",vt="_buttonGroup_1iuzq_38",wt="_saveButton_1iuzq_44",gt="_logoutButton_1iuzq_44",xt="_confirmButton_1iuzq_44",_t="_cancelButton_1iuzq_44",jt="_settingsButton_1iuzq_44",It="_testButton_1iuzq_44",bt="_confirmLogout_1iuzq_71",St="_notificationStatus_1iuzq_100",Dt="_notificationButtons_1iuzq_108",Nt="_appInfoBlock_1iuzq_148",Et="_appInfoRow_1iuzq_156",Ct="_appInfoLabel_1iuzq_166",Rt="_appInfoValue_1iuzq_171",kt="_cleanupButton_1iuzq_176",x={settingsForm:yt,formGroup:ht,buttonGroup:vt,saveButton:wt,logoutButton:gt,confirmButton:xt,cancelButton:_t,settingsButton:jt,testButton:It,confirmLogout:bt,notificationStatus:St,notificationButtons:Dt,appInfoBlock:Nt,appInfoRow:Et,appInfoLabel:Ct,appInfoValue:Rt,cleanupButton:kt},ie=async(e=!1)=>{if(!("Notification"in window)){console.error("Уведомления не поддерживаются");return}if(Notification.permission!=="granted"){console.log("Нет разрешения на отправку уведомлений");return}try{if("serviceWorker"in navigator)try{const s=await navigator.serviceWorker.ready;if(s.active){s.active.postMessage({type:"check-debts",force:e}),console.log("Запрос на проверку долгов отправлен через Service Worker");return}}catch(s){console.warn("Service Worker не активен, используем обычные уведомления:",s)}console.log("Запрос на проверку долгов выполнен через обычные уведомления")}catch(s){console.error("Ошибка при проверке долгов:",s)}},Pt=async()=>{if(!("Notification"in window))return console.error("Уведомления не поддерживаются"),!1;try{return await Notification.requestPermission()==="granted"}catch(e){return console.error("Ошибка при запросе разрешения на уведомления:",e),!1}},Ft="1.0.6",At="2025-04-13T01:24:20.331Z",Bt=()=>{const[e,s]=m.useState(Notification.permission||"default"),r=async()=>{await Pt()?(s("granted"),f.success("Разрешение на уведомления получено"),await ie()):(s("denied"),f.error("Разрешение на уведомления не получено"))},n=async()=>{await ie(!0),f.info("Запрос на проверку долгов отправлен")},o=new Date(At).toLocaleString("ru-RU",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"});return t.jsxs("div",{className:x.settingsForm,children:[t.jsx("h2",{children:"Настройки"}),t.jsxs("div",{className:x.formGroup,children:[t.jsx("label",{children:"Управление уведомлениями"}),t.jsxs("div",{className:x.notificationStatus,children:["Статус: ",e==="granted"?"Разрешены":e==="denied"?"Заблокированы":"Не запрошены"]}),t.jsxs("div",{className:x.notificationButtons,children:[t.jsx("button",{onClick:r,disabled:e==="denied",className:x.settingsButton,children:e==="granted"?"Уведомления разрешены":"Разрешить уведомления"}),e==="granted"&&t.jsx("button",{onClick:n,className:x.testButton,children:"Проверить долги"})]})]}),t.jsxs("div",{className:x.formGroup,children:[t.jsx("label",{children:"О приложении"}),t.jsxs("div",{className:x.appInfoBlock,children:[t.jsxs("div",{className:x.appInfoRow,children:[t.jsx("span",{className:x.appInfoLabel,children:"Версия:"}),t.jsx("span",{className:x.appInfoValue,children:Ft})]}),t.jsxs("div",{className:x.appInfoRow,children:[t.jsx("span",{className:x.appInfoLabel,children:"Дата сборки:"}),t.jsx("span",{className:x.appInfoValue,children:o})]})]})]})]})},$t=()=>{const{user:e,logout:s}=W(),[r,n]=m.useState(!1),o=m.useRef(null),a=m.useRef(null);m.useEffect(()=>{const _=q=>{a.current&&!a.current.contains(q.target)&&o.current&&!o.current.contains(q.target)&&n(!1)};return document.addEventListener("click",_),()=>{document.removeEventListener("click",_)}},[]);const i=_=>{_.stopPropagation(),n(q=>!q)},[u,c]=m.useState(!1),[p,l]=m.useState(!1),[d,h]=m.useState(!1),[y,v]=m.useState(!1),w=async()=>{try{await Le(),f.success("Данные успешно экспортированы")}catch(_){f.error(`Ошибка экспорта: ${_ instanceof Error?_.message:"Неизвестная ошибка"}`)}},R=()=>{n(!1),c(!0)},b=()=>{n(!1),v(!0)},k=async()=>{try{localStorage.setItem("lastSyncDate",""),await pe(),f.success("Данные успешно синхронизированы")}catch(_){f.error(`Ошибка синхронизации: ${_ instanceof Error?_.message:"Неизвестная ошибка"}`)}},ve=()=>{s(),f.success("Вы успешно вышли")};return t.jsxs("div",{className:V.menuContainer,children:[t.jsx(Ye,{}),t.jsx("button",{className:V.menuButton,ref:o,onClick:i,children:"☰"}),r&&t.jsxs("div",{className:V.menuDropdownContent,ref:a,children:[t.jsx(N,{onClick:w,children:"Экспорт"}),t.jsx(N,{onClick:R,children:"Импорт"}),t.jsx(N,{onClick:b,children:"Настройки"}),e?t.jsxs(t.Fragment,{children:[t.jsx(N,{onClick:k,children:"Обновить данные"}),t.jsx(N,{onClick:ve,children:"Выход"})]}):t.jsxs(t.Fragment,{children:[t.jsx(N,{onClick:()=>h(!0),children:"Регистрация"}),t.jsx(N,{onClick:()=>l(!0),children:"Авторизация"})]})]}),p&&t.jsx(C,{onClose:()=>l(!1),children:t.jsx(ct,{onSuccess:()=>{l(!1),n(!1)}})}),d&&t.jsx(C,{onClose:()=>h(!1),children:t.jsx(pt,{onSuccess:()=>{h(!1),n(!1)}})}),y&&t.jsx(C,{onClose:()=>v(!1),children:t.jsx(Bt,{})}),u&&t.jsx(C,{onClose:()=>c(!1),children:t.jsx(et,{onSuccess:()=>c(!1)})})]})},qt="_addInvestForm_xb664_1",Tt="_moneyRow_xb664_5",Lt="_dateRow_xb664_27",Mt="_buttonRow_xb664_37",M={addInvestForm:qt,moneyRow:Tt,dateRow:Lt,buttonRow:Mt},Ot=()=>{const e=m.useRef(null),[s,r]=m.useState(0),[n,o]=m.useState(.025),[a,i]=m.useState(),u=async c=>{var p;if(c.preventDefault(),!s||!n||!a){f.error("Заполните все поля");return}a.setHours(0,0,0);try{const l=await Ae(s,n,a);Number.isInteger(l)?(await me(),await $(),(p=e.current)==null||p.reset(),f.success("Инвестиция добавлена"),window.dispatchEvent(new CustomEvent("fetchInvests"))):f.error("Не удалось добавить инвестицию")}catch(l){f.error(`Ошибка: ${l instanceof Error?l.message:"Неизвестная ошибка"}`)}};return t.jsxs("form",{className:M.addInvestForm,ref:e,onSubmit:u,children:[t.jsxs("div",{className:M.moneyRow,children:[t.jsx("input",{type:"text",placeholder:"Сколько инвестируем",onChange:c=>r(parseFloat(c.target.value)),required:!0}),t.jsxs("select",{onChange:c=>o(parseFloat(c.target.value)),required:!0,children:[t.jsx("option",{value:"0.025",children:"2.5%"}),t.jsx("option",{value:"0.05",children:"5%"})]})]}),t.jsx("div",{className:M.dateRow,children:t.jsx("input",{type:"date",placeholder:"Дата инвестиции",onChange:c=>i(new Date(c.target.value)),onClick:c=>c.currentTarget.showPicker(),required:!0})}),t.jsx("div",{className:M.buttonRow,children:t.jsx("button",{type:"submit",children:"Добавить"})})]})},Gt="_dataFilter_1s026_1",Ut="_filterItem_1s026_6",H={dataFilter:Gt,filterItem:Ut},Wt=({activeFilter:e,setActiveFilter:s,showPayed:r,setShowPayed:n})=>t.jsxs("div",{className:H.dataFilter,children:[t.jsx("div",{className:H.filterItem,children:t.jsxs("label",{children:[t.jsx("input",{type:"checkbox",checked:e,onChange:()=>s(!e)}),"С закрытыми"]})}),t.jsx("div",{className:H.filterItem,children:t.jsxs("label",{children:[t.jsx("input",{type:"checkbox",checked:r,onChange:()=>n(!r)}),"С оплаченными"]})})]}),zt="_dataList_5dlll_1",Jt="_dataItem_5dlll_7",ce={dataList:zt,dataItem:Jt},Vt="_dataItem_1wxo7_1",Yt="_even_1wxo7_12",Ht="_closed_1wxo7_16",Kt="_itemMoney_1wxo7_20",Zt="_itemActions_1wxo7_24",Qt="_investCloseButton_1wxo7_30",Xt="_investEditButton_1wxo7_31",E={dataItem:Vt,even:Yt,closed:Ht,itemMoney:Kt,itemActions:Zt,investCloseButton:Qt,investEditButton:Xt},es="_dataItem_13v5n_1",ts="_emptyCell_13v5n_10",ss="_even_13v5n_14",ns="_debt_13v5n_18",os="_payed_13v5n_22",rs="_itemMoney_13v5n_26",as="_itemActions_13v5n_30",is="_paymentCloseButton_13v5n_36",cs="_paymentEditButton_13v5n_37",j={dataItem:es,emptyCell:ts,even:ss,debt:ns,payed:os,itemMoney:rs,itemActions:as,paymentCloseButton:is,paymentEditButton:cs},ls=new Intl.NumberFormat("default",{style:"currency",currency:"RUB",useGrouping:!0,maximumSignificantDigits:9,currencyDisplay:"symbol"}),Z=e=>{if(!e)return"";if(!(e instanceof Date))return e;let s=e.getFullYear()+"",r=e.toLocaleString("default",{month:"short"}).replace(".",""),n=e.getDate()+"";return e.getDate()<10&&(n="0"+n),`${s}-${r}-${n}`},ee=e=>ls.format(e).replace(/RUB\s*([0-9,.-]+)/,"$1 ₽"),ds="_editPaymentForm_17xt4_1",us="_formRow_17xt4_9",ms="_buttonRow_17xt4_37",F={editPaymentForm:ds,formRow:us,buttonRow:ms},fs=e=>{const s=e.getFullYear(),r=String(e.getMonth()+1).padStart(2,"0"),n=String(e.getDate()).padStart(2,"0");return`${s}-${r}-${n}`},ps=({payment:e,onClose:s})=>{const r=m.useRef(null),[n,o]=m.useState(e.money),[a,i]=m.useState(e.paymentDate),[u,c]=m.useState(e.isPayed),p=async l=>{if(l.preventDefault(),!n||n<=0||!a){f.error("Заполните все поля");return}try{await Fe(e.id,{money:n,paymentDate:a,isPayed:u}),await $(),f.success("Платёж обновлен"),s()}catch(d){f.error(`Ошибка: ${d instanceof Error?d.message:"Неизвестная ошибка"}`)}};return t.jsxs("form",{className:F.editPaymentForm,ref:r,onSubmit:p,children:[t.jsxs("div",{className:F.formRow,children:[t.jsx("label",{children:"Сумма:"}),t.jsx("input",{type:"number",value:n,onChange:l=>o(parseFloat(l.target.value)),required:!0})]}),t.jsxs("div",{className:F.formRow,children:[t.jsx("label",{children:"Дата платежа:"}),t.jsx("input",{type:"date",value:fs(a),onChange:l=>{const d=l.target.value;if(d){const[h,y,v]=d.split("-"),w=parseInt(h,10),R=parseInt(y,10)-1,b=parseInt(v,10),k=new Date;k.setFullYear(w,R,b),k.setHours(0,0,0,0),i(k)}},required:!0})]}),t.jsxs("div",{className:F.formRow,children:[t.jsx("label",{children:"Статус:"}),t.jsxs("select",{value:u,onChange:l=>c(parseInt(l.target.value)),children:[t.jsx("option",{value:0,children:"Не оплачен"}),t.jsx("option",{value:1,children:"Оплачен"})]})]}),t.jsxs("div",{className:F.buttonRow,children:[t.jsx("button",{type:"submit",children:"Сохранить"}),t.jsx("button",{type:"button",onClick:s,children:"Отмена"})]})]})},ys=({payment:e,isEven:s,isDebt:r,onClosePayment:n})=>{const[o,a]=m.useState(!1),i=async u=>{try{const c=await de(u);Number.isInteger(c)&&c===u?(f.success("Долг оплачен"),await me(),n(),await $()):f.error("Не удалось оплатить платеж")}catch(c){f.error(`Ошибка: ${c instanceof Error?c.message:"Неизвестная ошибка"}`)}};return t.jsxs(t.Fragment,{children:[t.jsxs("div",{className:`${j.dataItem} ${s?j.even:""} ${r?j.debt:""} ${e.isPayed==1?j.payed:""}`,children:[t.jsx("div",{className:j.emptyCell}),t.jsx("div",{children:Z(e.paymentDate)}),t.jsx("div",{className:j.itemMoney,children:ee(e.money)}),t.jsxs("div",{className:j.itemActions,children:[t.jsx("button",{className:j.paymentEditButton,title:"Редактировать платёж",onClick:()=>a(!0),children:"✎"}),e.isPayed==0&&t.jsx("button",{className:j.paymentCloseButton,title:"Оплата произведена",onClick:()=>i(e.id),children:"✓"})]})]}),o&&t.jsx(C,{onClose:()=>a(!1),children:t.jsx(ps,{payment:e,onClose:()=>{a(!1),n()}})})]})},hs="_editInvestForm_xk5rx_1",vs="_formRow_xk5rx_9",ws="_buttonRow_xk5rx_37",O={editInvestForm:hs,formRow:vs,buttonRow:ws},gs=e=>e.toISOString().split("T")[0],xs=({invest:e,onClose:s})=>{const r=m.useRef(null),[n,o]=m.useState(e.money),[a,i]=m.useState(e.createdDate),u=async c=>{if(c.preventDefault(),!n||!a){f.error("Заполните все поля");return}try{await $e(e.id,{money:n,createdDate:a}),await $(),f.success("Инвестиция обновлена"),s()}catch(p){f.error(`Ошибка: ${p instanceof Error?p.message:"Неизвестная ошибка"}`)}};return t.jsxs("form",{className:O.editInvestForm,ref:r,onSubmit:u,children:[t.jsxs("div",{className:O.formRow,children:[t.jsx("label",{htmlFor:"money-input",children:"Сумма:"}),t.jsx("input",{id:"money-input",type:"number",value:n,onChange:c=>o(parseFloat(c.target.value)),required:!0})]}),t.jsxs("div",{className:O.formRow,children:[t.jsx("label",{htmlFor:"date-input",children:"Дата создания:"}),t.jsx("input",{id:"date-input",type:"date",value:gs(a),onChange:c=>i(new Date(c.target.value)),required:!0})]}),t.jsxs("div",{className:O.buttonRow,children:[t.jsx("button",{type:"submit",children:"Сохранить"}),t.jsx("button",{type:"button",onClick:s,children:"Отмена"})]})]})},_s=({invest:e,isEven:s,payments:r,onRefreshData:n})=>{const o=new Date,[a,i]=m.useState(!1),u=async c=>{if(!(!c||!confirm("Точно закрыть?")))try{const p=await Be(c);if(Number.isInteger(p)&&p===c){for(const l of r)if(!l.isPayed&&l.id!==void 0)try{const d=await de(l.id);Number.isInteger(d)&&d===l.id?f.info("Долг автоматически оплачен"):f.error("Не удалось закрыть активный долг")}catch(d){f.error(`Ошибка: ${d instanceof Error?d.message:"Неизвестная ошибка"}`)}f.success("Инвестиция закрыта"),n(),await $()}else f.error("Не удалось закрыть инвестицию")}catch(p){f.error(`Ошибка: ${p instanceof Error?p.message:"Неизвестная ошибка"}`)}};return t.jsxs(t.Fragment,{children:[t.jsxs("div",{className:`${E.dataItem} ${s?E.even:""} ${e.closedDate?E.closed:""}`,children:[t.jsx("div",{children:Z(e.createdDate)}),t.jsx("div",{children:Z(e.closedDate)}),t.jsxs("div",{className:E.itemMoney,children:[ee(e.money)," (",100*(e.incomeRatio||X),"%)"]}),t.jsx("div",{className:E.itemActions,children:e.isActive==1&&t.jsxs(t.Fragment,{children:[t.jsx("button",{className:E.investEditButton,title:"Редактировать инвестицию",onClick:()=>i(!0),children:"✎"}),t.jsx("button",{className:E.investCloseButton,title:"Закрыть инвестицию",onClick:()=>e.id!==void 0&&u(e.id),children:"✕"})]})})]}),a&&t.jsx(C,{onClose:()=>i(!1),children:t.jsx(xs,{invest:e,onClose:()=>{i(!1),n()}})}),r.map(c=>c.id!==void 0?t.jsx(ys,{payment:c,isEven:s,isDebt:!c.isPayed&&c.paymentDate<o,onClosePayment:n},c.id):null)]})},js="_curDateItem_70h4h_1",Is={curDateItem:js},le=()=>t.jsx("div",{className:Is.curDateItem}),bs="_dataItem_11qg2_1",Ss="_itemMoney_11qg2_12",Ds="_itemActions_11qg2_16",Ns="_debt_11qg2_22",G={dataItem:bs,itemMoney:Ss,itemActions:Ds,debt:Ns},K=({amount:e,title:s,isDebt:r=!1})=>t.jsxs("div",{className:`${G.dataItem} ${r?G.debt:""}`,children:[t.jsx("div",{children:s}),t.jsx("div",{}),t.jsx("div",{className:G.itemMoney,children:ee(e)}),t.jsx("div",{className:G.itemActions})]}),Es=({invests:e,showPayed:s})=>{const r=new Date,n=r.getDate(),[o,a]=m.useState({});m.useEffect(()=>{(async()=>{const d={};for(const h of e)if(h.id!==void 0){const v=(await B({id:h.id})).filter(w=>s||!w.isPayed);d[h.id]=v}a(d)})().catch(d=>{console.error("Ошибка при загрузке платежей:",d)})},[e,s]);const i=m.useMemo(()=>e.reduce((l,d)=>l+(d.isActive?d.money:0),0),[e]),u=m.useMemo(()=>e.reduce((l,d)=>l+(d.isActive?d.money*(d.incomeRatio||.05):0),0),[e]),c=m.useMemo(()=>{let l=0;return Object.entries(o).forEach(([,d])=>{d.forEach(h=>{!h.isPayed&&h.paymentDate<r&&(l+=h.money)})}),l},[o,r]),p=m.useMemo(()=>e.map((l,d)=>{const h=l.createdDate.getDate();let y=[];if(d===0&&h>=n&&y.push(t.jsx(le,{},"current-date-first")),l.id!==void 0){const v=o[l.id]||[];y.push(t.jsx(_s,{invest:l,isEven:d%2===0,payments:v,onRefreshData:()=>window.dispatchEvent(new CustomEvent("fetchInvests"))},l.id))}return d<e.length-1&&h<n&&e[d+1].createdDate.getDate()>=n&&y.push(t.jsx(le,{},"current-date-middle")),y}).flat(),[e,o,n]);return t.jsxs("div",{className:ce.dataList,children:[t.jsx("div",{children:t.jsxs("div",{className:ce.dataItem,children:[t.jsx("div",{children:"Создано"}),t.jsx("div",{children:"Закрыто/Оплата"}),t.jsx("div",{children:"Сумма"}),t.jsx("div",{children:"Действия"})]})}),t.jsxs("div",{children:[p,t.jsx(K,{title:"Итого",amount:i}),t.jsx(K,{title:"Прибыль",amount:u}),c>0&&t.jsx(K,{title:"Долг",amount:c,isDebt:!0})]})]})},Cs="_container_1b0su_29",Rs={container:Cs},ks=()=>{const[e,s]=m.useState(!1),[r,n]=m.useState(!1),[o,a]=m.useState([]),i=m.useCallback(async()=>{const p=(await U({filterOnlyActive:e?0:1})).sort((l,d)=>{const h=l.createdDate.getDate(),y=d.createdDate.getDate();return h-y});a(p)},[e]);return m.useEffect(()=>(i().catch(u=>{console.error("Ошибка в fetchInvests:",u)}),window.addEventListener("fetchInvests",i),()=>window.removeEventListener("fetchInvests",i)),[i]),t.jsxs(Me,{children:[t.jsx(_e,{position:"top-center",closeButton:!1,autoClose:3e3,hideProgressBar:!1,newestOnTop:!0,transition:je,theme:"dark"}),t.jsxs("div",{className:Rs.container,children:[t.jsx("h1",{children:"Инвестиции"}),t.jsx($t,{}),t.jsx(Ot,{}),t.jsx(Wt,{activeFilter:e,setActiveFilter:s,showPayed:r,setShowPayed:n}),t.jsx(Es,{invests:o,showPayed:r})]})]})};function he(){document.body.classList.add("app-loaded"),console.log("Приложение загружено")}function D(e){const s=document.getElementById("app-loading-status");s&&(s.textContent=e)}const Ps=De.createRoot(document.getElementById("root"));Ps.render(t.jsx(m.StrictMode,{children:t.jsx(ks,{})}));window.requestAnimationFrame(()=>{setTimeout(he,500)});"serviceWorker"in navigator&&navigator.serviceWorker.addEventListener("message",e=>{console.log("Получено сообщение от ServiceWorker:",e.data),e.data&&e.data.type==="status"?D(e.data.message):e.data&&e.data.type==="activated"?(console.log("Service Worker активирован, версия:",e.data.version),he()):e.data&&e.data.type==="error"&&console.error("Ошибка Service Worker:",e.data.message)});"serviceWorker"in navigator&&window.addEventListener("load",async()=>{try{D("Регистрация Service Worker...");const e=await navigator.serviceWorker.register("/money3/service-worker.js",{updateViaCache:"none"});if(console.log("ServiceWorker успешно зарегистрирован:",e.scope),D("Service Worker зарегистрирован"),e.addEventListener("updatefound",()=>{const s=e.installing;s&&(console.log("Обнаружена новая версия ServiceWorker"),D("Обнаружена новая версия приложения"),s.addEventListener("statechange",()=>{s.state==="installed"&&navigator.serviceWorker.controller?(console.log("Новый Service Worker установлен и готов к использованию"),D("Обновление готово к установке"),confirm("Доступна новая версия приложения. Обновить сейчас?")&&(D("Применяю обновление..."),window.location.reload())):s.state==="installing"?D("Установка обновления..."):s.state==="activated"&&D("Обновление активировано")}))}),"Notification"in window){let s=Notification.permission;s!=="granted"&&s!=="denied"&&(s=await Notification.requestPermission()),console.log("Разрешение на уведомления:",s)}if(e.periodicSync)try{(await navigator.permissions.query({name:"periodic-background-sync"})).state==="granted"?(await e.periodicSync.register("check-debts",{minInterval:20*60*60*1e3}),console.log("Периодическая синхронизация успешно зарегистрирована")):console.log("Нет разрешения на периодическую синхронизацию")}catch(s){console.error("Ошибка при регистрации периодической синхронизации:",s)}else if(console.log("Периодическая синхронизация не поддерживается"),e.sync)try{await e.sync.register("check-debts"),console.log("Фоновая синхронизация успешно зарегистрирована")}catch(s){console.error("Ошибка при регистрации фоновой синхронизации:",s)}}catch(e){console.error("Ошибка при регистрации ServiceWorker:",e)}});
