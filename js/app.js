
const app=document.querySelector('#app');
const modal=document.querySelector('#modal');
const photoInput=document.querySelector('#photoInput');
let state={view:'projects',projects:[],photos:[],activeTarget:null};

async function init(){
  await openDB();
  state.projects=await dbGetAll('projects');
  state.photos=await dbGetAll('photos');
  render();
}
function findProjectType(projectId,typeId){const p=state.projects.find(x=>x.id===projectId);return[p,p?.types.find(x=>x.id===typeId)]}
function countPhotos(key){return state.photos.filter(p=>p.pointKey===key).length}
function render(){
  document.querySelectorAll('.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===state.view));
  if(state.view==='projects')renderProjects();
  if(state.view==='check')renderCheck();
  if(state.view==='export')renderExport();
}
function renderProjects(){
  app.innerHTML=`<div class="toolbar"><div><strong>今日案件</strong><div class="muted">${state.projects.length} 個案號</div></div><button class="primary" onclick="openProjectModal()">＋ 新增案號</button></div>
  ${state.projects.length?state.projects.map(renderProjectCard).join(''):`<div class="card empty">尚未建立案件<br><br><button class="primary" onclick="openProjectModal()">建立第一個案號</button></div>`}`;
}
function renderProjectCard(project){
  const stats=projectStats(project,state.photos);
  return `<section class="card"><div class="card-head"><div><h2>${esc(project.projectNo)}</h2><div class="muted">${esc(project.note||'未填備註')}</div></div><div><button class="ghost" onclick="openProjectModal('${project.id}')">編輯</button> <button class="danger" onclick="deleteProject('${project.id}')">刪除</button></div></div>
  <div class="chips"><span class="chip">${stats.done}/${stats.total} 點完成</span><span class="chip">${stats.photoCount} 張照片</span></div>
  ${project.types.map(type=>renderType(project,type)).join('')}</section>`;
}
function renderType(project,type){
  let done=0;for(let n=1;n<=type.pointCount;n++)if(countPhotos(pointKey(project.id,type.id,n))>=type.minPhotos)done++;
  return `<div class="type-section"><div class="type-head"><div><strong>${esc(type.name)} (${esc(type.code)})</strong><div class="muted">次數：${esc(type.occurrence)}｜${done}/${type.pointCount} 完成</div></div></div>
  <div class="point-grid">${Array.from({length:type.pointCount},(_,i)=>renderPoint(project,type,i+1)).join('')}</div></div>`;
}
function renderPoint(project,type,n){
  const key=pointKey(project.id,type.id,n),count=countPhotos(key),[icon,label]=statusInfo(count,type.minPhotos);
  return `<div class="point-card"><div class="point-id">${esc(fullPointId(project,type,n))}</div><div class="point-status">${icon} ${label}｜${count}/${type.minPhotos}</div><div class="point-actions">
  <button onclick="openTimeCamera('${project.id}','${type.id}',${n})">📷 時間相機</button>
  <button onclick="importPhotos('${project.id}','${type.id}',${n})">📥 導入</button>
  <button onclick="viewPhotos('${project.id}','${type.id}',${n})">🖼 ${count}</button></div></div>`;
}
function openProjectModal(editId=''){
  const project=editId?state.projects.find(p=>p.id===editId):null;
  document.querySelector('#modalBody').innerHTML=`<h2>${project?'編輯案件':'新增案件'}</h2>
  <div class="field"><label>5 碼專案編號</label><input id="projectNo" maxlength="5" inputmode="numeric" value="${esc(project?.projectNo||'')}" placeholder="例如 09009"></div>
  <div class="field"><label>備註（選填）</label><input id="projectNote" value="${esc(project?.note||'')}" placeholder="客戶、地點或日期"></div>
  <div class="field"><label>監測類型</label><div class="type-config-grid">${MONITOR_TYPES.map(mt=>{
    const old=project?.types.find(t=>t.code===mt.code);
    return `<div class="type-config"><label><input class="type-enable" data-code="${mt.code}" type="checkbox" ${old?'checked':''}> ${mt.name} (${mt.code})</label>
    <div class="mini-grid"><input class="occ" data-code="${mt.code}" value="${esc(old?.occurrence||'001')}" placeholder="次數"><input class="points" data-code="${mt.code}" type="number" min="1" max="99" value="${old?.pointCount||1}" placeholder="點位"><input class="minp" data-code="${mt.code}" type="number" min="1" max="10" value="${old?.minPhotos||2}" placeholder="最低照片"></div></div>`}).join('')}</div></div>
  <input id="editId" type="hidden" value="${editId}">
  <p class="muted">次數完全保留輸入格式：1、01、001、0001 都會照原樣顯示。</p>`;
  modal.showModal();
}
async function saveProject(){
  const projectNo=document.querySelector('#projectNo').value.trim();
  const editId=document.querySelector('#editId').value;
  if(!/^\d{5}$/.test(projectNo)){showToast('專案編號請輸入 5 碼數字');return false}
  const types=[];
  document.querySelectorAll('.type-enable:checked').forEach(ch=>{
    const code=ch.dataset.code,meta=MONITOR_TYPES.find(x=>x.code===code);
    const old=editId?state.projects.find(p=>p.id===editId)?.types.find(t=>t.code===code):null;
    types.push({id:old?.id||uid(),name:meta.name,code,occurrence:document.querySelector(`.occ[data-code="${code}"]`).value,pointCount:Number(document.querySelector(`.points[data-code="${code}"]`).value)||1,minPhotos:Number(document.querySelector(`.minp[data-code="${code}"]`).value)||2});
  });
  if(!types.length){showToast('請至少選一種監測類型');return false}
  await dbPut('projects',{id:editId||uid(),projectNo,note:document.querySelector('#projectNote').value.trim(),types,updatedAt:Date.now()});
  state.projects=await dbGetAll('projects');render();return true;
}
async function deleteProject(id){
  if(!confirm('確定刪除此案件？助手內照片會刪除，但不會刪除 iPhone 相簿原圖。'))return;
  for(const photo of state.photos.filter(p=>p.projectId===id))await dbDelete('photos',photo.id);
  await dbDelete('projects',id);
  state.projects=await dbGetAll('projects');state.photos=await dbGetAll('photos');render();
}
async function openTimeCamera(projectId,typeId,pointNo){
  state.activeTarget={projectId,typeId,pointNo};
  const cfg=await dbGet('settings','cameraUrl');
  if(cfg?.value){location.href=cfg.value;showToast('拍完後回到助手，再按「導入」')}
  else showToast('請手動開啟時間相機，拍完後回來按「導入」');
}
function importPhotos(projectId,typeId,pointNo){state.activeTarget={projectId,typeId,pointNo};photoInput.value='';photoInput.click()}
photoInput.addEventListener('change',async e=>{
  if(!state.activeTarget)return;
  await saveImportedPhotos([...e.target.files],state.activeTarget);
  state.photos=await dbGetAll('photos');render();showToast(`已導入 ${e.target.files.length} 張照片`);
});
async function viewPhotos(projectId,typeId,pointNo){
  const [p,t]=findProjectType(projectId,typeId),key=pointKey(projectId,typeId,pointNo),photos=state.photos.filter(x=>x.pointKey===key);
  document.querySelector('#viewerTitle').textContent=`${fullPointId(p,t,pointNo)}｜${photos.length} 張`;
  document.querySelector('#viewerGrid').innerHTML=photos.length?photos.map(ph=>`<div class="photo-item"><img src="${URL.createObjectURL(ph.blob)}"><div class="photo-meta">${esc(ph.name)}<br>${new Date(ph.createdAt).toLocaleString('zh-TW')}</div><div class="photo-buttons"><button class="ghost" onclick="openMovePhoto('${ph.id}')">移動</button><button class="danger" onclick="deletePhotoUI('${ph.id}','${projectId}','${typeId}',${pointNo})">刪除</button></div></div>`).join(''):'<div class="empty">尚無照片</div>';
  document.querySelector('#photoViewer').showModal();
}
async function deletePhotoUI(id,projectId,typeId,pointNo){
  if(!confirm('從助手中移除此照片？不會刪除 iPhone 相簿原圖。'))return;
  await removePhoto(id);state.photos=await dbGetAll('photos');await viewPhotos(projectId,typeId,pointNo);render();
}
function openMovePhoto(photoId){
  const options=[];state.projects.forEach(p=>p.types.forEach(t=>{for(let n=1;n<=t.pointCount;n++)options.push({value:pointKey(p.id,t.id,n),label:fullPointId(p,t,n)})}));
  document.querySelector('#photoViewer').close();
  document.querySelector('#modalBody').innerHTML=`<h2>移動照片</h2><div class="field"><label>移動到</label><select id="moveTarget">${options.map(o=>`<option value="${o.value}">${esc(o.label)}</option>`).join('')}</select></div><input id="movePhotoId" type="hidden" value="${photoId}">`;
  modal.showModal();
}
async function saveMove(){
  const id=document.querySelector('#movePhotoId')?.value;if(!id)return false;
  await movePhotoRecord(id,document.querySelector('#moveTarget').value);state.photos=await dbGetAll('photos');render();showToast('照片已移動');return true;
}
function renderCheck(){
  const missing=[];state.projects.forEach(p=>p.types.forEach(t=>{for(let n=1;n<=t.pointCount;n++){const c=countPhotos(pointKey(p.id,t.id,n));if(c<t.minPhotos)missing.push({id:fullPointId(p,t,n),count:c,min:t.minPhotos})}}));
  app.innerHTML=`<div class="toolbar"><div><strong>完成檢查</strong><div class="muted">匯出前確認缺照片點位</div></div></div>${missing.length?`<div class="card warning"><h3>尚有 ${missing.length} 個點位未完成</h3>${missing.map(x=>`<p><strong>${esc(x.id)}</strong>｜${x.count}/${x.min}，缺 ${x.min-x.count} 張</p>`).join('')}</div>`:`<div class="card success"><h3>🟢 全部完成</h3><p>所有點位均已達最低照片需求。</p></div>`}`;
}
function renderExport(){
  app.innerHTML=`<div class="toolbar"><div><strong>匯出 ZIP</strong><div class="muted">依案號／類型／點位整理</div></div></div>${state.projects.map(p=>`<div class="card"><div class="card-head"><div><h3>${esc(p.projectNo)}</h3><div class="muted">${state.photos.filter(x=>x.projectId===p.id).length} 張照片</div></div><button class="primary" onclick="exportProjectZip('${p.id}')">📦 匯出</button></div></div>`).join('')||'<div class="card empty">尚無案件可匯出</div>'}`;
}
async function openSettings(){
  const cfg=await dbGet('settings','cameraUrl');
  document.querySelector('#modalBody').innerHTML=`<h2>設定</h2><div class="field"><label>時間相機開啟網址（選填）</label><input id="cameraUrl" value="${esc(cfg?.value||'')}" placeholder="若 App 有 URL Scheme 可填入"></div><p class="muted">不知道可留白，先手動開啟時間相機。拍完回助手按「導入」。</p><input id="settingsMode" type="hidden" value="1">`;
  modal.showModal();
}
async function saveSettings(){
  if(!document.querySelector('#settingsMode'))return false;
  await dbPut('settings',{key:'cameraUrl',value:document.querySelector('#cameraUrl').value.trim()});showToast('設定已儲存');return true;
}

document.querySelectorAll('.bottom-nav button').forEach(b=>b.addEventListener('click',()=>{state.view=b.dataset.view;render()}));
document.querySelector('#settingsBtn').addEventListener('click',openSettings);
document.querySelector('#closeViewer').addEventListener('click',()=>document.querySelector('#photoViewer').close());
document.querySelector('#modalForm').addEventListener('submit',async e=>{e.preventDefault();const ok=(await saveSettings())||(await saveMove())||(await saveProject());if(ok)modal.close()});
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
init();
