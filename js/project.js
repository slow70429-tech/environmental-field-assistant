
const MONITOR_TYPES=[
{name:'河川',code:'W'},{name:'地下水',code:'WG'},{name:'放流水',code:'WU'},
{name:'噪音',code:'NV'},{name:'營建噪音',code:'BNV'},{name:'低頻噪音',code:'LFN'},
{name:'空氣',code:'A'},{name:'土壤',code:'S'},{name:'大腸桿菌',code:'WD'}];

function uid(){return crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random()}
function pointKey(projectId,typeId,pointNo){return `${projectId}|${typeId}|${pointNo}`}
function fullPointId(project,type,pointNo){return `${project.projectNo}${type.code}${type.occurrence}-${String(pointNo).padStart(2,'0')}`}
function projectStats(project,photos){
  let total=0,done=0;
  project.types.forEach(t=>{total+=t.pointCount;for(let n=1;n<=t.pointCount;n++){const count=photos.filter(p=>p.pointKey===pointKey(project.id,t.id,n)).length;if(count>=t.minPhotos)done++}})
  return {total,done,photoCount:photos.filter(p=>p.projectId===project.id).length}
}
