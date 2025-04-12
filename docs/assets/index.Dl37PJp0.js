import{r as ge,a as we}from"./react.CvRECnwm.js";import{o as xe,y as p,r as m,L as _e,m as je}from"./vendor.DOUekRLu.js";(function(){const s=document.createElement("link").relList;if(s&&s.supports&&s.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))n(o);new MutationObserver(o=>{for(const a of o)if(a.type==="childList")for(const i of a.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&n(i)}).observe(document,{childList:!0,subtree:!0});function r(o){const a={};return o.integrity&&(a.integrity=o.integrity),o.referrerPolicy&&(a.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?a.credentials="include":o.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function n(o){if(o.ep)return;o.ep=!0;const a=r(o);fetch(o.href,a)}})();var J={exports:{}},P={};/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var te;function be(){if(te)return P;te=1;var e=ge(),s=Symbol.for("react.element"),r=Symbol.for("react.fragment"),n=Object.prototype.hasOwnProperty,o=e.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,a={key:!0,ref:!0,__self:!0,__source:!0};function i(u,c,f){var l,d={},h=null,y=null;f!==void 0&&(h=""+f),c.key!==void 0&&(h=""+c.key),c.ref!==void 0&&(y=c.ref);for(l in c)n.call(c,l)&&!a.hasOwnProperty(l)&&(d[l]=c[l]);if(u&&u.defaultProps)for(l in c=u.defaultProps,c)d[l]===void 0&&(d[l]=c[l]);return{$$typeof:s,type:u,key:h,ref:y,props:d,_owner:o.current}}return P.Fragment=r,P.jsx=i,P.jsxs=i,P}var se;function Ie(){return se||(se=1,J.exports=be()),J.exports}var t=Ie(),T={},ne;function Se(){if(ne)return T;ne=1;var e=we();return T.createRoot=e.createRoot,T.hydrateRoot=e.hydrateRoot,T}var De=Se();class A extends Error{}A.prototype.name="InvalidTokenError";function Ne(e){return decodeURIComponent(atob(e).replace(/(.)/g,(s,r)=>{let n=r.charCodeAt(0).toString(16).toUpperCase();return n.length<2&&(n="0"+n),"%"+n}))}function Ee(e){let s=e.replace(/-/g,"+").replace(/_/g,"/");switch(s.length%4){case 0:break;case 2:s+="==";break;case 3:s+="=";break;default:throw new Error("base64 string is not of the correct length")}try{return Ne(s)}catch{return atob(s)}}function oe(e,s){if(typeof e!="string")throw new A("Invalid token specified: must be a string");s||(s={});const r=s.header===!0?0:1,n=e.split(".")[r];if(typeof n!="string")throw new A(`Invalid token specified: missing part #${r+1}`);let o;try{o=Ee(n)}catch(a){throw new A(`Invalid token specified: invalid base64 for part #${r+1} (${a.message})`)}try{return JSON.parse(o)}catch(a){throw new A(`Invalid token specified: invalid json for part #${r+1} (${a.message})`)}}const Ce={DB_NAME:"money",DB_VERSION:1},{DB_NAME:ke,DB_VERSION:Re}=window.DB_CONFIG||Ce;let V=null;async function b(){return V||(V=await xe(ke,Re,{upgrade(e,s,r,n){let o;e.objectStoreNames.contains("invests")?o=n.objectStore("invests"):(o=e.createObjectStore("invests",{keyPath:"id",autoIncrement:!0}),o.createIndex("isActiveIdx","isActive",{unique:!1}),o.createIndex("updatedAtIdx","updatedAt",{unique:!1}));let a;e.objectStoreNames.contains("payments")?a=n.objectStore("payments"):(a=e.createObjectStore("payments",{keyPath:"id",autoIncrement:!0}),a.createIndex("investIdIdx","investId",{unique:!1}),a.createIndex("updatedAtIdx","updatedAt",{unique:!1})),a&&!a.indexNames.contains("isPayedIdx")&&a.createIndex("isPayedIdx","isPayed",{unique:!1})},blocked(){console.log("База данных заблокирована другой вкладкой")},blocking(){console.log("Эта вкладка блокирует обновление базы данных в другой вкладке")},terminated(){console.log("База данных была неожиданно закрыта")}})),V}async function $(e={}){const n=(await b()).transaction("payments").objectStore("payments");return e.id!==void 0?n.index("investIdIdx").getAll(e.id):e.updatedAt!==void 0?n.index("updatedAtIdx").getAll(IDBKeyRange.lowerBound(e.updatedAt)):e.isPayed!==void 0?n.index("isPayedIdx").getAll(e.isPayed):n.getAll()}async function Pe(e,s,r,n){const i=(await b()).transaction("payments","readwrite").objectStore("payments"),u={investId:e,money:Math.round(s*r),paymentDate:n,isPayed:0,updatedAt:new Date};return i.add(u)}async function de(e){const n=(await b()).transaction("payments","readwrite").objectStore("payments"),o=await n.get(e);if(!o)throw new Error("Payment not found");return o.isPayed=1,o.updatedAt=new Date,n.put(o)}async function Fe(e,s){const o=(await b()).transaction(["payments"],"readwrite").objectStore("payments"),a=await o.get(e);if(!a)throw new Error("Платеж не найден");const i={...a,...s,updatedAt:new Date},u=await o.put(i);return window.dispatchEvent(new CustomEvent("fetchInvests")),u}async function U(e={}){const n=(await b()).transaction("invests").objectStore("invests");return e.filterOnlyActive===1?n.index("isActiveIdx").getAll(1):e.updatedAt!==void 0?n.index("updatedAtIdx").getAll(IDBKeyRange.lowerBound(e.updatedAt)):n.getAll()}async function Ae(e,s,r){const a=(await b()).transaction("invests","readwrite").objectStore("invests"),i={money:e,incomeRatio:s,createdDate:r,closedDate:null,isActive:1,updatedAt:new Date};return a.add(i)}async function $e(e){const n=(await b()).transaction("invests","readwrite").objectStore("invests"),o=await n.get(e);if(!o)throw new Error("Invest not found");return o.isActive=0,o.closedDate=new Date,o.updatedAt=new Date,n.put(o)}async function Be(e,s){const r=s.money!==void 0?await $({id:e,isPayed:0}):[],o=(await b()).transaction(["invests","payments"],"readwrite"),a=o.objectStore("invests"),i=await a.get(e);if(!i)throw new Error("Инвестиция не найдена");const u={...i,...s,updatedAt:new Date};if(await a.put(u),s.money!==void 0){const c=o.objectStore("payments");for(const f of r){const l={...f,money:s.money*(i.incomeRatio||X),updatedAt:new Date};await c.put(l)}}return await o.done,window.dispatchEvent(new CustomEvent("fetchInvests")),e}const Q="https://perkin.alwaysdata.net/money/api";class L extends Error{constructor(s,r,n){super(s),this.status=r,this.statusText=n,this.name="ApiError"}}const re={retries:3,retryDelay:1e3};async function ue(e,s={}){const{retries:r=re.retries,retryDelay:n=re.retryDelay,...o}=s;let a=null;for(let i=0;i<=r;i++)try{const u=localStorage.getItem("token");if(!u)throw new L("Токен не найден",401);const c=await fetch(Q+e,{...o,headers:{"Content-Type":"application/json",Authorization:`Bearer ${u}`,...o.headers}});if(!c.ok){const l=new L(`HTTP ошибка: ${c.status}`,c.status,c.statusText);throw c.status===401?(p.error("Сессия истекла. Пожалуйста, авторизуйтесь заново"),l):(c.status<500&&c.status!==429,l)}return await c.json()}catch(u){if(a=u,i===r||u instanceof L&&u.status&&u.status<500&&u.status!==429){const c=u instanceof L?u.message:"Произошла сетевая ошибка";throw p.error(c),u}await new Promise(c=>setTimeout(c,n*(i+1)))}throw a||new Error("Неизвестная ошибка")}async function qe(e,s={}){return ue(e,{method:"GET",...s})}async function Te(e,s,r={}){return ue(e,{method:"POST",body:JSON.stringify(s),...r})}const X=.05;async function me(){const e=await U({filterOnlyActive:1});if(e.length)for(const s of e){let r=s.createdDate;const o=[...await $({id:s.id})].sort((v,g)=>v.paymentDate.getTime()-g.paymentDate.getTime()),a=o.length>0?o[o.length-1]:null;if(a&&!a.isPayed)continue;a&&(r=a.paymentDate);const i=s.createdDate.getDate(),u=r.getMonth(),c=r.getFullYear();let f=u+1,l=c;f>11&&(f=0,l+=1);const d=new Date(l,f+1,0).getDate(),h=i>d?d:i,y=new Date(l,f,h,0,0,0,0);await Pe(s.id,s.money,s.incomeRatio||X,y)}}async function pe(e,s=!1){const n=(await b()).transaction(["invests","payments"],"readwrite"),o=n.objectStore("invests"),a=n.objectStore("payments");s&&(await o.clear(),await a.clear());for(const i of e.invests){const u={...i,createdDate:new Date(i.createdDate),updatedAt:new Date(i.updatedAt),closedDate:i.closedDate?new Date(i.closedDate):void 0};await o.put(u)}for(const i of e.payments){const u={...i,paymentDate:new Date(i.paymentDate),updatedAt:new Date(i.updatedAt)};await a.put(u)}}async function Le(){const e=await U(),s=await $(),r=JSON.stringify({invests:e,payments:s});try{await navigator.clipboard.writeText(r),p.success("Данные скопированы в буфер обмена")}catch{p.error("Не удалось скопировать данные в буфер обмена")}}async function fe(){if(!localStorage.getItem("token"))return;const e=localStorage.getItem("lastSyncDate")||"";p.info("Получаю обновления...");const s=await qe(`/updates?since=${e}`);if(s.status==="success"){const r={invests:s.invests||[],payments:s.payments||[]};await pe(r),p.success("Обновления успешно применены"),window.dispatchEvent(new CustomEvent("fetchInvests"))}else s.status==="no_updates"?p.info("Обновлений нет"):p.warn(s.status);localStorage.setItem("lastSyncDate",new Date().toISOString())}async function B(){if(!localStorage.getItem("token"))return;const e=localStorage.getItem("lastSyncDate");let s={},r={};e&&(s={updatedAt:new Date(e)},r={updatedAt:new Date(e)});const n=await U(s),o=await $(r);if(!n.length&&!o.length)return;const a={invests:n,payments:o},i=p.info("Отправляю данные...",{autoClose:!1});try{const u=await Te("/update",a);p.done(i),u.status==="success"&&p.success("Новые данные успешно отправлены на сервер")}catch{p.done(i)}}const ye=m.createContext(void 0),Me=({children:e})=>{const[s,r]=m.useState(null),n=a=>{localStorage.setItem("token",a);const i=oe(a);r(i)},o=()=>{localStorage.removeItem("token"),r(null)};return m.useEffect(()=>{const a=localStorage.getItem("token");if(a)try{const i=oe(a);r(i)}catch(i){console.error("Ошибка при декодировании JWT",i),o()}},[]),m.useEffect(()=>{s&&fe().then(()=>{window.dispatchEvent(new CustomEvent("fetchInvests"))}).catch(a=>{console.error("Ошибка при синхронизации:",a)})},[s]),t.jsx(ye.Provider,{value:{user:s,login:n,logout:o},children:e})},W=()=>{const e=m.useContext(ye);if(!e)throw new Error("useUser должен использоваться внутри UserProvider");return e},Oe="_menuContainer_1544v_1",Ge="_menuButton_1544v_8",Ue="_menuDropdownContent_1544v_16",Y={menuContainer:Oe,menuButton:Ge,menuDropdownContent:Ue},We="_menuButton_nj68m_1",Je={menuButton:We},N=({onClick:e,children:s})=>t.jsx("button",{className:Je.menuButton,type:"button",onClick:e,children:s}),Ve="_userName_1mfy7_1",Ye={userName:Ve},ze=()=>{const{user:e}=W();return t.jsx("div",{className:Ye.userName,children:e?e.username:""})},He="_importForm_1loee_1",Ke="_formGroup_1loee_15",Ze="_errorInput_1loee_40",Qe="_errorText_1loee_44",Xe="_formActions_1loee_50",z={importForm:He,formGroup:Ke,errorInput:Ze,errorText:Qe,formActions:Xe},et=({onSuccess:e})=>{const[s,r]=m.useState(""),n=async o=>{o.preventDefault();const a=s.trim();try{const i=JSON.parse(a);await pe(i,!0),p.success("Импорт завершен"),e(),window.dispatchEvent(new CustomEvent("fetchInvests"))}catch{p.error("Не удалось распарсить данные")}};return t.jsxs("form",{className:z.importForm,onSubmit:n,children:[t.jsx("h2",{children:"Импорт"}),t.jsxs("div",{className:z.formGroup,children:[t.jsx("label",{htmlFor:"import-string",children:"JSON:"}),t.jsx("textarea",{rows:10,id:"import-string",value:s,onChange:o=>r(o.target.value),required:!0})]}),t.jsx("div",{className:z.formActions,children:t.jsx("button",{type:"submit",children:"Импортировать"})})]})},tt="_overlay_skzxb_1",st="_popup_skzxb_14",ae={overlay:tt,popup:st},C=({children:e,onClose:s})=>(m.useEffect(()=>{const r=n=>{n.key==="Escape"&&s()};return document.addEventListener("keydown",r),()=>document.removeEventListener("keydown",r)},[s]),t.jsx("div",{className:ae.overlay,onClick:s,children:t.jsx("div",{className:ae.popup,onClick:r=>r.stopPropagation(),children:e})})),nt="_loginForm_1vymo_1",ot="_formGroup_1vymo_15",rt="_errorInput_1vymo_38",at="_errorText_1vymo_42",it="_formActions_1vymo_48",S={loginForm:nt,formGroup:ot,errorInput:rt,errorText:at,formActions:it},ct=({onSuccess:e})=>{const{login:s}=W(),[r,n]=m.useState(""),[o,a]=m.useState(""),[i,u]=m.useState({}),c=async l=>{if(l.preventDefault(),u({}),!r||!o){p.error("Заполните все поля");return}try{const d=await fetch(`${Q}/login`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:r,password:o})});if(!d.ok){const y=await d.json();if(y.error==="invalid_credentials"){p.error("Неверный email или пароль");return}if(y.error==="validation_errors"){u(y.errors);return}throw new Error(y.message||"Ошибка при входе")}const{token:h}=await d.json();s(h),p.success("Вход выполнен успешно"),e()}catch(d){p.error(`Ошибка: ${d instanceof Error?d.message:"Неизвестная ошибка"}`)}},f=l=>{var d;return((d=i[l])==null?void 0:d.length)>0?i[l][0]:""};return t.jsxs("form",{className:S.loginForm,onSubmit:c,children:[t.jsx("h2",{children:"Вход"}),t.jsxs("div",{className:S.formGroup,children:[t.jsx("label",{htmlFor:"email",children:"Email:"}),t.jsx("input",{type:"email",id:"email",value:r,onChange:l=>n(l.target.value),className:i.email?S.errorInput:"",required:!0}),f("email")&&t.jsx("div",{className:S.errorText,children:f("email")})]}),t.jsxs("div",{className:S.formGroup,children:[t.jsx("label",{htmlFor:"password",children:"Пароль:"}),t.jsx("input",{type:"password",id:"password",value:o,onChange:l=>a(l.target.value),className:i.password?S.errorInput:"",required:!0}),f("password")&&t.jsx("div",{className:S.errorText,children:f("password")})]}),t.jsx("div",{className:S.formActions,children:t.jsx("button",{type:"submit",children:"Войти"})})]})},lt="_registerForm_4l4og_1",dt="_formGroup_4l4og_15",ut="_errorInput_4l4og_38",mt="_errorText_4l4og_42",pt="_formActions_4l4og_48",w={registerForm:lt,formGroup:dt,errorInput:ut,errorText:mt,formActions:pt},ft=({onSuccess:e})=>{const{login:s}=W(),[r,n]=m.useState(""),[o,a]=m.useState(""),[i,u]=m.useState(""),[c,f]=m.useState(""),[l,d]=m.useState({}),h=async v=>{if(v.preventDefault(),d({}),!r||!o||!i||!c){p.error("Заполните все поля");return}if(i!==c){d({confirmPassword:["Пароли не совпадают"]});return}try{const g=await fetch(`${Q}/register`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:r,username:o,password:i})});if(!g.ok){const I=await g.json();if(I.error==="user_exists"){p.error("Такой пользователь уже существует");return}if(I.error==="validation_errors"){d(I.errors);return}throw new Error(I.message||"Ошибка при регистрации")}const{token:k}=await g.json();s(k),p.success("Регистрация выполнена успешно"),e()}catch(g){p.error(`Ошибка: ${g instanceof Error?g.message:"Неизвестная ошибка"}`)}},y=v=>{var g;return((g=l[v])==null?void 0:g.length)>0?l[v][0]:""};return t.jsxs("form",{className:w.registerForm,onSubmit:h,children:[t.jsx("h2",{children:"Регистрация"}),t.jsxs("div",{className:w.formGroup,children:[t.jsx("label",{htmlFor:"email",children:"Email:"}),t.jsx("input",{type:"email",id:"email",value:r,onChange:v=>n(v.target.value),className:l.email?w.errorInput:"",required:!0}),y("email")&&t.jsx("div",{className:w.errorText,children:y("email")})]}),t.jsxs("div",{className:w.formGroup,children:[t.jsx("label",{htmlFor:"username",children:"Имя пользователя:"}),t.jsx("input",{type:"text",id:"username",value:o,onChange:v=>a(v.target.value),className:l.username?w.errorInput:"",required:!0}),y("username")&&t.jsx("div",{className:w.errorText,children:y("username")})]}),t.jsxs("div",{className:w.formGroup,children:[t.jsx("label",{htmlFor:"password",children:"Пароль:"}),t.jsx("input",{type:"password",id:"password",value:i,onChange:v=>u(v.target.value),className:l.password?w.errorInput:"",required:!0}),y("password")&&t.jsx("div",{className:w.errorText,children:y("password")})]}),t.jsxs("div",{className:w.formGroup,children:[t.jsx("label",{htmlFor:"confirmPassword",children:"Подтвердите пароль:"}),t.jsx("input",{type:"password",id:"confirmPassword",value:c,onChange:v=>f(v.target.value),className:l.confirmPassword?w.errorInput:"",required:!0}),y("confirmPassword")&&t.jsx("div",{className:w.errorText,children:y("confirmPassword")})]}),t.jsx("div",{className:w.formActions,children:t.jsx("button",{type:"submit",children:"Зарегистрироваться"})})]})},yt="_settingsForm_qbsgj_1",ht="_formGroup_qbsgj_15",vt="_buttonGroup_qbsgj_38",gt="_saveButton_qbsgj_44",wt="_logoutButton_qbsgj_44",xt="_confirmButton_qbsgj_44",_t="_cancelButton_qbsgj_44",jt="_settingsButton_qbsgj_44",bt="_testButton_qbsgj_44",It="_confirmLogout_qbsgj_71",St="_notificationStatus_qbsgj_100",Dt="_notificationButtons_qbsgj_108",Nt="_appInfoBlock_qbsgj_148",Et="_appInfoRow_qbsgj_156",Ct="_appInfoLabel_qbsgj_166",kt="_appInfoValue_qbsgj_171",x={settingsForm:yt,formGroup:ht,buttonGroup:vt,saveButton:gt,logoutButton:wt,confirmButton:xt,cancelButton:_t,settingsButton:jt,testButton:bt,confirmLogout:It,notificationStatus:St,notificationButtons:Dt,appInfoBlock:Nt,appInfoRow:Et,appInfoLabel:Ct,appInfoValue:kt},ie=async()=>{if(!("serviceWorker"in navigator)){console.error("Service Worker не поддерживается");return}try{const e=await navigator.serviceWorker.ready;if(!e.active){console.log("Service Worker не активен");return}e.active.postMessage({type:"check-debts"}),console.log("Запрос на проверку долгов отправлен")}catch(e){console.error("Ошибка при проверке долгов:",e)}},Rt=async()=>{if(!("Notification"in window))return console.error("Уведомления не поддерживаются"),!1;try{return await Notification.requestPermission()==="granted"}catch(e){return console.error("Ошибка при запросе разрешения на уведомления:",e),!1}},Pt="1.0.3",Ft="2025-04-12T23:21:18.190Z",At=()=>{const[e,s]=m.useState(Notification.permission||"default"),r=async()=>{await Rt()?(s("granted"),p.success("Разрешение на уведомления получено"),await ie()):(s("denied"),p.error("Разрешение на уведомления не получено"))},n=async()=>{await ie(),p.info("Запрос на проверку долгов отправлен")},o=new Date(Ft).toLocaleString("ru-RU",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"});return t.jsxs("div",{className:x.settingsForm,children:[t.jsx("h2",{children:"Настройки"}),t.jsxs("div",{className:x.formGroup,children:[t.jsx("label",{children:"Уведомления"}),t.jsxs("div",{className:x.notificationStatus,children:["Статус: ",e==="granted"?"Разрешены":e==="denied"?"Заблокированы":"Не запрошены"]}),t.jsxs("div",{className:x.notificationButtons,children:[t.jsx("button",{onClick:r,disabled:e==="denied",className:x.settingsButton,children:e==="granted"?"Уведомления разрешены":"Разрешить уведомления"}),e==="granted"&&t.jsx("button",{onClick:n,className:x.testButton,children:"Проверить долги"})]})]}),t.jsxs("div",{className:x.formGroup,children:[t.jsx("label",{children:"О приложении"}),t.jsxs("div",{className:x.appInfoBlock,children:[t.jsxs("div",{className:x.appInfoRow,children:[t.jsx("span",{className:x.appInfoLabel,children:"Версия:"}),t.jsx("span",{className:x.appInfoValue,children:Pt})]}),t.jsxs("div",{className:x.appInfoRow,children:[t.jsx("span",{className:x.appInfoLabel,children:"Дата сборки:"}),t.jsx("span",{className:x.appInfoValue,children:o})]})]})]})]})},$t=()=>{const{user:e,logout:s}=W(),[r,n]=m.useState(!1),o=m.useRef(null),a=m.useRef(null);m.useEffect(()=>{const _=q=>{a.current&&!a.current.contains(q.target)&&o.current&&!o.current.contains(q.target)&&n(!1)};return document.addEventListener("click",_),()=>{document.removeEventListener("click",_)}},[]);const i=_=>{_.stopPropagation(),n(q=>!q)},[u,c]=m.useState(!1),[f,l]=m.useState(!1),[d,h]=m.useState(!1),[y,v]=m.useState(!1),g=async()=>{try{await Le(),p.success("Данные успешно экспортированы")}catch(_){p.error(`Ошибка экспорта: ${_ instanceof Error?_.message:"Неизвестная ошибка"}`)}},k=()=>{n(!1),c(!0)},I=()=>{n(!1),v(!0)},R=async()=>{try{localStorage.setItem("lastSyncDate",""),await fe(),p.success("Данные успешно синхронизированы")}catch(_){p.error(`Ошибка синхронизации: ${_ instanceof Error?_.message:"Неизвестная ошибка"}`)}},ve=()=>{s(),p.success("Вы успешно вышли")};return t.jsxs("div",{className:Y.menuContainer,children:[t.jsx(ze,{}),t.jsx("button",{className:Y.menuButton,ref:o,onClick:i,children:"☰"}),r&&t.jsxs("div",{className:Y.menuDropdownContent,ref:a,children:[t.jsx(N,{onClick:g,children:"Экспорт"}),t.jsx(N,{onClick:k,children:"Импорт"}),t.jsx(N,{onClick:I,children:"Настройки"}),e?t.jsxs(t.Fragment,{children:[t.jsx(N,{onClick:R,children:"Обновить данные"}),t.jsx(N,{onClick:ve,children:"Выход"})]}):t.jsxs(t.Fragment,{children:[t.jsx(N,{onClick:()=>h(!0),children:"Регистрация"}),t.jsx(N,{onClick:()=>l(!0),children:"Авторизация"})]})]}),f&&t.jsx(C,{onClose:()=>l(!1),children:t.jsx(ct,{onSuccess:()=>{l(!1),n(!1)}})}),d&&t.jsx(C,{onClose:()=>h(!1),children:t.jsx(ft,{onSuccess:()=>{h(!1),n(!1)}})}),y&&t.jsx(C,{onClose:()=>v(!1),children:t.jsx(At,{})}),u&&t.jsx(C,{onClose:()=>c(!1),children:t.jsx(et,{onSuccess:()=>c(!1)})})]})},Bt="_addInvestForm_xb664_1",qt="_moneyRow_xb664_5",Tt="_dateRow_xb664_27",Lt="_buttonRow_xb664_37",M={addInvestForm:Bt,moneyRow:qt,dateRow:Tt,buttonRow:Lt},Mt=()=>{const e=m.useRef(null),[s,r]=m.useState(0),[n,o]=m.useState(.025),[a,i]=m.useState(),u=async c=>{var f;if(c.preventDefault(),!s||!n||!a){p.error("Заполните все поля");return}a.setHours(0,0,0);try{const l=await Ae(s,n,a);Number.isInteger(l)?(await me(),await B(),(f=e.current)==null||f.reset(),p.success("Инвестиция добавлена"),window.dispatchEvent(new CustomEvent("fetchInvests"))):p.error("Не удалось добавить инвестицию")}catch(l){p.error(`Ошибка: ${l instanceof Error?l.message:"Неизвестная ошибка"}`)}};return t.jsxs("form",{className:M.addInvestForm,ref:e,onSubmit:u,children:[t.jsxs("div",{className:M.moneyRow,children:[t.jsx("input",{type:"text",placeholder:"Сколько инвестируем",onChange:c=>r(parseFloat(c.target.value)),required:!0}),t.jsxs("select",{onChange:c=>o(parseFloat(c.target.value)),required:!0,children:[t.jsx("option",{value:"0.025",children:"2.5%"}),t.jsx("option",{value:"0.05",children:"5%"})]})]}),t.jsx("div",{className:M.dateRow,children:t.jsx("input",{type:"date",placeholder:"Дата инвестиции",onChange:c=>i(new Date(c.target.value)),onClick:c=>c.currentTarget.showPicker(),required:!0})}),t.jsx("div",{className:M.buttonRow,children:t.jsx("button",{type:"submit",children:"Добавить"})})]})},Ot="_dataFilter_1s026_1",Gt="_filterItem_1s026_6",H={dataFilter:Ot,filterItem:Gt},Ut=({activeFilter:e,setActiveFilter:s,showPayed:r,setShowPayed:n})=>t.jsxs("div",{className:H.dataFilter,children:[t.jsx("div",{className:H.filterItem,children:t.jsxs("label",{children:[t.jsx("input",{type:"checkbox",checked:e,onChange:()=>s(!e)}),"С закрытыми"]})}),t.jsx("div",{className:H.filterItem,children:t.jsxs("label",{children:[t.jsx("input",{type:"checkbox",checked:r,onChange:()=>n(!r)}),"С оплаченными"]})})]}),Wt="_dataList_5dlll_1",Jt="_dataItem_5dlll_7",ce={dataList:Wt,dataItem:Jt},Vt="_dataItem_1wxo7_1",Yt="_even_1wxo7_12",zt="_closed_1wxo7_16",Ht="_itemMoney_1wxo7_20",Kt="_itemActions_1wxo7_24",Zt="_investCloseButton_1wxo7_30",Qt="_investEditButton_1wxo7_31",E={dataItem:Vt,even:Yt,closed:zt,itemMoney:Ht,itemActions:Kt,investCloseButton:Zt,investEditButton:Qt},Xt="_dataItem_13v5n_1",es="_emptyCell_13v5n_10",ts="_even_13v5n_14",ss="_debt_13v5n_18",ns="_payed_13v5n_22",os="_itemMoney_13v5n_26",rs="_itemActions_13v5n_30",as="_paymentCloseButton_13v5n_36",is="_paymentEditButton_13v5n_37",j={dataItem:Xt,emptyCell:es,even:ts,debt:ss,payed:ns,itemMoney:os,itemActions:rs,paymentCloseButton:as,paymentEditButton:is},cs=new Intl.NumberFormat("default",{style:"currency",currency:"RUB",useGrouping:!0,maximumSignificantDigits:9,currencyDisplay:"symbol"}),Z=e=>{if(!e)return"";if(!(e instanceof Date))return e;let s=e.getFullYear()+"",r=e.toLocaleString("default",{month:"short"}).replace(".",""),n=e.getDate()+"";return e.getDate()<10&&(n="0"+n),`${s}-${r}-${n}`},ee=e=>cs.format(e).replace(/RUB\s*([0-9,.-]+)/,"$1 ₽"),ls="_editPaymentForm_17xt4_1",ds="_formRow_17xt4_9",us="_buttonRow_17xt4_37",F={editPaymentForm:ls,formRow:ds,buttonRow:us},ms=e=>{const s=e.getFullYear(),r=String(e.getMonth()+1).padStart(2,"0"),n=String(e.getDate()).padStart(2,"0");return`${s}-${r}-${n}`},ps=({payment:e,onClose:s})=>{const r=m.useRef(null),[n,o]=m.useState(e.money),[a,i]=m.useState(e.paymentDate),[u,c]=m.useState(e.isPayed),f=async l=>{if(l.preventDefault(),!n||n<=0||!a){p.error("Заполните все поля");return}try{await Fe(e.id,{money:n,paymentDate:a,isPayed:u}),await B(),p.success("Платёж обновлен"),s()}catch(d){p.error(`Ошибка: ${d instanceof Error?d.message:"Неизвестная ошибка"}`)}};return t.jsxs("form",{className:F.editPaymentForm,ref:r,onSubmit:f,children:[t.jsxs("div",{className:F.formRow,children:[t.jsx("label",{children:"Сумма:"}),t.jsx("input",{type:"number",value:n,onChange:l=>o(parseFloat(l.target.value)),required:!0})]}),t.jsxs("div",{className:F.formRow,children:[t.jsx("label",{children:"Дата платежа:"}),t.jsx("input",{type:"date",value:ms(a),onChange:l=>{const d=l.target.value;if(d){const[h,y,v]=d.split("-"),g=parseInt(h,10),k=parseInt(y,10)-1,I=parseInt(v,10),R=new Date;R.setFullYear(g,k,I),R.setHours(0,0,0,0),i(R)}},required:!0})]}),t.jsxs("div",{className:F.formRow,children:[t.jsx("label",{children:"Статус:"}),t.jsxs("select",{value:u,onChange:l=>c(parseInt(l.target.value)),children:[t.jsx("option",{value:0,children:"Не оплачен"}),t.jsx("option",{value:1,children:"Оплачен"})]})]}),t.jsxs("div",{className:F.buttonRow,children:[t.jsx("button",{type:"submit",children:"Сохранить"}),t.jsx("button",{type:"button",onClick:s,children:"Отмена"})]})]})},fs=({payment:e,isEven:s,isDebt:r,onClosePayment:n})=>{const[o,a]=m.useState(!1),i=async u=>{try{const c=await de(u);Number.isInteger(c)&&c===u?(p.success("Долг оплачен"),await me(),n(),await B()):p.error("Не удалось оплатить платеж")}catch(c){p.error(`Ошибка: ${c instanceof Error?c.message:"Неизвестная ошибка"}`)}};return t.jsxs(t.Fragment,{children:[t.jsxs("div",{className:`${j.dataItem} ${s?j.even:""} ${r?j.debt:""} ${e.isPayed==1?j.payed:""}`,children:[t.jsx("div",{className:j.emptyCell}),t.jsx("div",{children:Z(e.paymentDate)}),t.jsx("div",{className:j.itemMoney,children:ee(e.money)}),t.jsxs("div",{className:j.itemActions,children:[t.jsx("button",{className:j.paymentEditButton,title:"Редактировать платёж",onClick:()=>a(!0),children:"✎"}),e.isPayed==0&&t.jsx("button",{className:j.paymentCloseButton,title:"Оплата произведена",onClick:()=>i(e.id),children:"✓"})]})]}),o&&t.jsx(C,{onClose:()=>a(!1),children:t.jsx(ps,{payment:e,onClose:()=>{a(!1),n()}})})]})},ys="_editInvestForm_xk5rx_1",hs="_formRow_xk5rx_9",vs="_buttonRow_xk5rx_37",O={editInvestForm:ys,formRow:hs,buttonRow:vs},gs=e=>e.toISOString().split("T")[0],ws=({invest:e,onClose:s})=>{const r=m.useRef(null),[n,o]=m.useState(e.money),[a,i]=m.useState(e.createdDate),u=async c=>{if(c.preventDefault(),!n||!a){p.error("Заполните все поля");return}try{await Be(e.id,{money:n,createdDate:a}),await B(),p.success("Инвестиция обновлена"),s()}catch(f){p.error(`Ошибка: ${f instanceof Error?f.message:"Неизвестная ошибка"}`)}};return t.jsxs("form",{className:O.editInvestForm,ref:r,onSubmit:u,children:[t.jsxs("div",{className:O.formRow,children:[t.jsx("label",{htmlFor:"money-input",children:"Сумма:"}),t.jsx("input",{id:"money-input",type:"number",value:n,onChange:c=>o(parseFloat(c.target.value)),required:!0})]}),t.jsxs("div",{className:O.formRow,children:[t.jsx("label",{htmlFor:"date-input",children:"Дата создания:"}),t.jsx("input",{id:"date-input",type:"date",value:gs(a),onChange:c=>i(new Date(c.target.value)),required:!0})]}),t.jsxs("div",{className:O.buttonRow,children:[t.jsx("button",{type:"submit",children:"Сохранить"}),t.jsx("button",{type:"button",onClick:s,children:"Отмена"})]})]})},xs=({invest:e,isEven:s,payments:r,onRefreshData:n})=>{const o=new Date,[a,i]=m.useState(!1),u=async c=>{if(!(!c||!confirm("Точно закрыть?")))try{const f=await $e(c);if(Number.isInteger(f)&&f===c){for(const l of r)if(!l.isPayed&&l.id!==void 0)try{const d=await de(l.id);Number.isInteger(d)&&d===l.id?p.info("Долг автоматически оплачен"):p.error("Не удалось закрыть активный долг")}catch(d){p.error(`Ошибка: ${d instanceof Error?d.message:"Неизвестная ошибка"}`)}p.success("Инвестиция закрыта"),n(),await B()}else p.error("Не удалось закрыть инвестицию")}catch(f){p.error(`Ошибка: ${f instanceof Error?f.message:"Неизвестная ошибка"}`)}};return t.jsxs(t.Fragment,{children:[t.jsxs("div",{className:`${E.dataItem} ${s?E.even:""} ${e.closedDate?E.closed:""}`,children:[t.jsx("div",{children:Z(e.createdDate)}),t.jsx("div",{children:Z(e.closedDate)}),t.jsxs("div",{className:E.itemMoney,children:[ee(e.money)," (",100*(e.incomeRatio||X),"%)"]}),t.jsx("div",{className:E.itemActions,children:e.isActive==1&&t.jsxs(t.Fragment,{children:[t.jsx("button",{className:E.investEditButton,title:"Редактировать инвестицию",onClick:()=>i(!0),children:"✎"}),t.jsx("button",{className:E.investCloseButton,title:"Закрыть инвестицию",onClick:()=>e.id!==void 0&&u(e.id),children:"✕"})]})})]}),a&&t.jsx(C,{onClose:()=>i(!1),children:t.jsx(ws,{invest:e,onClose:()=>{i(!1),n()}})}),r.map(c=>c.id!==void 0?t.jsx(fs,{payment:c,isEven:s,isDebt:!c.isPayed&&c.paymentDate<o,onClosePayment:n},c.id):null)]})},_s="_curDateItem_70h4h_1",js={curDateItem:_s},le=()=>t.jsx("div",{className:js.curDateItem}),bs="_dataItem_11qg2_1",Is="_itemMoney_11qg2_12",Ss="_itemActions_11qg2_16",Ds="_debt_11qg2_22",G={dataItem:bs,itemMoney:Is,itemActions:Ss,debt:Ds},K=({amount:e,title:s,isDebt:r=!1})=>t.jsxs("div",{className:`${G.dataItem} ${r?G.debt:""}`,children:[t.jsx("div",{children:s}),t.jsx("div",{}),t.jsx("div",{className:G.itemMoney,children:ee(e)}),t.jsx("div",{className:G.itemActions})]}),Ns=({invests:e,showPayed:s})=>{const r=new Date,n=r.getDate(),[o,a]=m.useState({});m.useEffect(()=>{(async()=>{const d={};for(const h of e)if(h.id!==void 0){const v=(await $({id:h.id})).filter(g=>s||!g.isPayed);d[h.id]=v}a(d)})().catch(d=>{console.error("Ошибка при загрузке платежей:",d)})},[e,s]);const i=m.useMemo(()=>e.reduce((l,d)=>l+(d.isActive?d.money:0),0),[e]),u=m.useMemo(()=>e.reduce((l,d)=>l+(d.isActive?d.money*(d.incomeRatio||.05):0),0),[e]),c=m.useMemo(()=>{let l=0;return Object.entries(o).forEach(([,d])=>{d.forEach(h=>{!h.isPayed&&h.paymentDate<r&&(l+=h.money)})}),l},[o,r]),f=m.useMemo(()=>e.map((l,d)=>{const h=l.createdDate.getDate();let y=[];if(d===0&&h>=n&&y.push(t.jsx(le,{},"current-date-first")),l.id!==void 0){const v=o[l.id]||[];y.push(t.jsx(xs,{invest:l,isEven:d%2===0,payments:v,onRefreshData:()=>window.dispatchEvent(new CustomEvent("fetchInvests"))},l.id))}return d<e.length-1&&h<n&&e[d+1].createdDate.getDate()>=n&&y.push(t.jsx(le,{},"current-date-middle")),y}).flat(),[e,o,n]);return t.jsxs("div",{className:ce.dataList,children:[t.jsx("div",{children:t.jsxs("div",{className:ce.dataItem,children:[t.jsx("div",{children:"Создано"}),t.jsx("div",{children:"Закрыто/Оплата"}),t.jsx("div",{children:"Сумма"}),t.jsx("div",{children:"Действия"})]})}),t.jsxs("div",{children:[f,t.jsx(K,{title:"Итого",amount:i}),t.jsx(K,{title:"Прибыль",amount:u}),c>0&&t.jsx(K,{title:"Долг",amount:c,isDebt:!0})]})]})},Es="_container_1b0su_29",Cs={container:Es},ks=()=>{const[e,s]=m.useState(!1),[r,n]=m.useState(!1),[o,a]=m.useState([]),i=m.useCallback(async()=>{const f=(await U({filterOnlyActive:e?0:1})).sort((l,d)=>{const h=l.createdDate.getDate(),y=d.createdDate.getDate();return h-y});a(f)},[e]);return m.useEffect(()=>(i().catch(u=>{console.error("Ошибка в fetchInvests:",u)}),window.addEventListener("fetchInvests",i),()=>window.removeEventListener("fetchInvests",i)),[i]),t.jsxs(Me,{children:[t.jsx(_e,{position:"top-center",closeButton:!1,autoClose:3e3,hideProgressBar:!1,newestOnTop:!0,transition:je,theme:"dark"}),t.jsxs("div",{className:Cs.container,children:[t.jsx("h1",{children:"Инвестиции"}),t.jsx($t,{}),t.jsx(Mt,{}),t.jsx(Ut,{activeFilter:e,setActiveFilter:s,showPayed:r,setShowPayed:n}),t.jsx(Ns,{invests:o,showPayed:r})]})]})};function he(){document.body.classList.add("app-loaded"),console.log("Приложение загружено")}function D(e){const s=document.getElementById("app-loading-status");s&&(s.textContent=e)}const Rs=De.createRoot(document.getElementById("root"));Rs.render(t.jsx(m.StrictMode,{children:t.jsx(ks,{})}));window.requestAnimationFrame(()=>{setTimeout(he,500)});"serviceWorker"in navigator&&navigator.serviceWorker.addEventListener("message",e=>{console.log("Получено сообщение от ServiceWorker:",e.data),e.data&&e.data.type==="app-version"?console.log(`Service Worker версия: ${e.data.version}`):e.data&&e.data.type==="status"?D(e.data.message):e.data&&e.data.type==="activated"?setTimeout(he,500):e.data&&e.data.type==="error"&&console.error("Ошибка Service Worker:",e.data.message)});"serviceWorker"in navigator&&window.addEventListener("load",async()=>{var e,s,r;try{D("Регистрация Service Worker...");const n=await navigator.serviceWorker.register("/money3/service-worker.js",{updateViaCache:"none"});if(console.log("ServiceWorker успешно зарегистрирован:",n.scope),D("Service Worker зарегистрирован"),n.addEventListener("updatefound",()=>{const o=n.installing;o&&(console.log("Обнаружена новая версия ServiceWorker"),D("Обнаружена новая версия приложения"),o.addEventListener("statechange",()=>{o.state==="installed"&&navigator.serviceWorker.controller?(console.log("Новый Service Worker установлен и готов к использованию"),D("Обновление готово к установке"),confirm("Доступна новая версия приложения. Обновить сейчас?")&&(D("Применяю обновление..."),window.location.reload())):o.state==="installing"?D("Установка обновления..."):o.state==="activated"&&D("Обновление активировано")}))}),"Notification"in window){const o=await Notification.requestPermission();console.log("Разрешение на уведомления:",o)}if(n.periodicSync)try{(await navigator.permissions.query({name:"periodic-background-sync"})).state==="granted"?(await n.periodicSync.register("check-debts",{minInterval:20*60*60*1e3}),console.log("Периодическая синхронизация успешно зарегистрирована")):(console.log("Нет разрешения на периодическую синхронизацию"),(e=n.active)==null||e.postMessage({type:"check-debts"}))}catch(o){console.error("Ошибка при регистрации периодической синхронизации:",o),(s=n.active)==null||s.postMessage({type:"check-debts"})}else if(console.log("Периодическая синхронизация не поддерживается"),(r=n.active)==null||r.postMessage({type:"check-debts"}),n.sync)try{await n.sync.register("check-debts"),console.log("Фоновая синхронизация успешно зарегистрирована")}catch(o){console.error("Ошибка при регистрации фоновой синхронизации:",o)}}catch(n){console.error("Ошибка при регистрации ServiceWorker:",n)}});
