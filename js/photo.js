
async function saveImportedPhotos(files,target){
  const [project,type]=findProjectType(target.projectId,target.typeId);
  for(const file of files){
    await dbPut('photos',{id:uid(),projectId:target.projectId,typeId:target.typeId,pointNo:target.pointNo,pointKey:pointKey(target.projectId,target.typeId,target.pointNo),name:file.name||`${fullPointId(project,type,target.pointNo)}.jpg`,mime:file.type||'image/jpeg',blob:file,createdAt:Date.now()});
  }
}
async function removePhoto(photoId){await dbDelete('photos',photoId)}
async function movePhotoRecord(photoId,newPointKey){
  const photo=state.photos.find(p=>p.id===photoId);if(!photo)return;
  const [projectId,typeId,pointNo]=newPointKey.split('|');
  photo.projectId=projectId;photo.typeId=typeId;photo.pointNo=Number(pointNo);photo.pointKey=newPointKey;
  await dbPut('photos',photo);
}
