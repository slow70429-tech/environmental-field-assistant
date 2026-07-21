
async function exportProjectZip(projectId){
  const project=state.projects.find(p=>p.id===projectId);
  if(!project||typeof JSZip==='undefined'){showToast('ZIP 模組尚未載入');return}
  const zip=new JSZip();
  for(const type of project.types){
    for(let n=1;n<=type.pointCount;n++){
      const folder=zip.folder(`${project.projectNo}/${type.name}/${fullPointId(project,type,n)}`);
      const photos=state.photos.filter(p=>p.pointKey===pointKey(project.id,type.id,n));
      photos.forEach((photo,index)=>{
        const ext=(photo.name.split('.').pop()||'jpg').replace(/[^a-z0-9]/gi,'');
        folder.file(`${fullPointId(project,type,n)}_${String(index+1).padStart(2,'0')}.${ext}`,photo.blob);
      });
    }
  }
  const blob=await zip.generateAsync({type:'blob'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${project.projectNo}_現場照片.zip`;a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),5000);
  showToast('ZIP 已建立，可儲存到「檔案」或用 Outlook 分享');
}
