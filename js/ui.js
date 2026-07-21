
function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function showToast(message){const t=document.querySelector('#toast');t.textContent=message;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}
function statusInfo(count,min){if(count===0)return['⚪','未開始'];if(count<min)return['🟡',`還缺 ${min-count} 張`];if(count===min)return['🟢','已完成'];return['🔵','已超過需求']}
