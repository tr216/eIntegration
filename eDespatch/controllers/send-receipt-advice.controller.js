module.exports = (dbModel, req, res, next, cb)=>{
    switch(req.method){
        case 'POST':
        	sendReceiptAdvice(dbModel,req,res,next,cb)
        break
        
        default:
        error.method(req, next)
        break
    }

}

function sendReceiptAdvice(dbModel,req,res,next,cb){
	var filter={ioType:1}
	if(req.params.param1!=undefined){
		filter['_id']=req.params.param1
	}else{
		var list=req.body.list || []
		
		var idList=[]
		list.forEach((e)=>{
			if(typeof e=='string'){
				idList.push(e)
			}else if(typeof e=='object'){
				idList.push(e._id)
			}else{
				return next({code:'PARAMETER_ERROR',message:'gonderilecek evrak listesi hatali'})
			}
		})
		if(idList.length==0)
			return next({code:'PARAMETER_ERROR',message:'gonderilecek evrak listesi bos'})
		filter['_id']={$in:idList}
	}
	filter['despatchReceiptAdvice']={ $type: 7 }
	console.log(`filter:`,filter)
	dbModel.despatches.find(filter).select('_id ID uuid ioType issueDate issueTime despatchStatus eIntegrator despatchReceiptAdvice').populate(['eIntegrator','despatchReceiptAdvice']).exec((err,docs)=>{
		console.log(`err:`,err)
		if(dberr(err, next)){
			console.log(`docs.length:`,docs.length)
			iteration(docs, (doc,cb)=>{ addNewTaskList(dbModel,doc,cb) },0, false, (err)=>{
				if(!err){
					cb(`${docs.length} adet evrak kuyruga eklendi`)
				}else{
					console.log('iterasyon err:',err)
					next(err)
				}
			})
		}
	})
}

function addNewTaskList(dbModel,doc,cb){
	var taskData={
		taskType:'edespatch_send_receipt_advice',
		collectionName:'despatches',
		documentId:doc._id,
		document:doc.toJSON(),
		status:'pending'
	}
	
	taskHelper.newTask(dbModel,taskData,(err,taskDoc)=>{
		if(!err){
			dbModel.despatches_receipt_advice.updateMany({despatch:doc._id},{$set:{receiptAdviceStatus:'Pending'}},{multi:false},(err,c)=>{
				cb(null,{taskId:taskDoc._id,taskType:taskDoc.taskType,collectionName:taskDoc.collectionName,documentId:taskDoc.documentId,status:taskDoc.status})	
			})
			
		}else{
			cb(err)
		}
	})
}