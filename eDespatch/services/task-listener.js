var taskInterval=5000

exports.start=(dbModel)=>{
	listen_sendReceiptAdvice(dbModel)
	listen_sentToGib(dbModel)
}


function listen_sendReceiptAdvice(dbModel){
	var serviceName=`[eDespatch][listen_sendReceiptAdvice]`.yellow
	dbModel.tasks.find({taskType:'edespatch_send_receipt_advice',status:'pending'},(err,docs)=>{
		if(!err){
			if(docs.length>0){
				eventLog(`${serviceName} task count:${docs.length}`)

				iteration(docs,(item,cb)=>{ 
					eDespatch.sendReceiptAdvice(dbModel,(item.toJSON()).document,(err)=>{
						if(!err){
							dbModel.tasks.updateMany({_id:item._id},{$set:{status:'completed'}},(err)=>{
								cb(err)
							})
						}else{
							dbModel.tasks.updateMany({_id:item._id},{$set:{status:'error',error:[{code:(err.code || err.name || 'TASK_ERROR'),message:err.message}]}},{multi:false},(err2)=>{
								dbModel.despatches_receipt_advice.updateMany({_id:item.documentId},{$set:{receiptStatus:'Error',receiptErrors:[{code:(err.code || err.name || 'TASK_ERROR'),message:err.message}]}},{multi:false},(err2)=>{
									cb(null)
								})
							})
						}
					})
				},0,true,(err,result)=>{
					if(!err){
						eventLog(`${serviceName} sendToGib:${dbModel.dbName}\tOK`)
					}else{
						errorLog(`${serviceName} sendToGib:${dbModel.dbName} \tError`,err)
					}
					setTimeout(()=>{
						listen_sendReceiptAdvice(dbModel)
					},taskInterval)
				})
			}else{
				setTimeout(()=>{
					listen_sendReceiptAdvice(dbModel)
				},taskInterval)
			}


		}else{
			errorLog(`${serviceName} Hata:\n`,err)
			setTimeout(()=>{
				listen_sendReceiptAdvice(dbModel)
			},taskInterval)
		}
	})
}

function listen_sentToGib(dbModel){
	var serviceName=`[eDespatch][listen_sentToGib]`.yellow
	dbModel.tasks.find({taskType:'edespatch_send_to_gib',status:'pending'},(err,docs)=>{
		if(!err){
			if(docs.length>0){
				eventLog(`${serviceName} task count:${docs.length}`)
				iteration(docs,(item,cb)=>{ 
					eDespatch.sendToGib(dbModel,item.document,(err)=>{
						if(!err){
							dbModel.tasks.updateMany({_id:item._id},{$set:{status:'completed'}},(err)=>{
								cb(err)
							})
						}else{
							dbModel.tasks.updateMany({_id:item._id},{$set:{status:'error',error:[{code:(err.code || err.name || 'TASK_ERROR'),message:err.message}]}},{multi:false},(err2)=>{
								dbModel.despatches.updateMany({_id:item.documentId},{$set:{despatchStatus:'Error',despatchErrors:[{code:(err.code || err.name || 'TASK_ERROR'),message:err.message}]}},{multi:false},(err2)=>{
									cb(null)
								})
							})
						}
					})
				},0,true,(err,result)=>{
					if(!err){
						eventLog(`${serviceName} sendToGib:${dbModel.dbName}\tOK`)
					}else{
						errorLog(`${serviceName} sendToGib:${dbModel.dbName} \tError`,err)
					}
					setTimeout(()=>{
						listen_sentToGib(dbModel)
					},taskInterval)
				})
			}else{
				setTimeout(()=>{
					listen_sentToGib(dbModel)
				},taskInterval)
			}


		}else{
			errorLog(`${serviceName} Hata:\n`,err)
			setTimeout(()=>{
				listen_sentToGib(dbModel)
			},taskInterval)
		}
	})
}
