
require('colors')
var request=require('request')
var parseString = require('xml2js').parseString
var js2xmlparser = require("js2xmlparser")
global.os=require('os')
global.uuid=require('uuid');

Date.prototype.yyyymmdd = function () {
	var yyyy = this.getFullYear().toString()
    var mm = (this.getMonth() + 1).toString() // getMonth() is zero-based
    var dd = this.getDate().toString()
    var HH = this.getHours().toString()
    var min = this.getMinutes().toString()
    var sec = this.getSeconds().toString()
    return yyyy + '-' + (mm[1]?mm:"0" + mm[0]) + '-' + (dd[1]?dd:"0" + dd[0]) 
  }

  Date.prototype.yyyymmddhhmmss = function (middleChar) {
  	var yyyy = this.getFullYear().toString()
    var mm = (this.getMonth() + 1).toString() // getMonth() is zero-based
    var dd = this.getDate().toString()
    var HH = this.getHours().toString()
    var min = this.getMinutes().toString()
    var sec = this.getSeconds().toString()
    return yyyy + '-' + (mm[1]?mm:"0" + mm[0]) + '-' + (dd[1]?dd:"0" + dd[0]) + (middleChar?middleChar:' ') + (HH[1]?HH:"0" + HH[0]) + ':' + (min[1]?min:"0" + min[0]) + ':' + (sec[1]?sec:"0" + sec[0]) 
  }

  Date.prototype.yyyymmddmilisecond = function () {
  	var yyyy = this.getFullYear().toString()
    var mm = (this.getMonth() + 1).toString() // getMonth() is zero-based
    var dd = this.getDate().toString()
    var HH = this.getHours().toString()
    var min = this.getMinutes().toString()
    var sec = this.getSeconds().toString()
    var msec = this.getMilliseconds().toString()
    return yyyy + '-' + (mm[1]?mm:"0" + mm[0]) + '-' + (dd[1]?dd:"0" + dd[0]) + ' ' + (HH[1]?HH:"0" + HH[0]) + ':' + (min[1]?min:"0" + min[0]) + ':' + (sec[1]?sec:"0" + sec[0]) + '.' + msec 
  }


  Date.prototype.addDays = function(days)
  {
  	var dat = new Date(this.valueOf())
  	dat.setDate(dat.getDate() + days)
  	return dat
  }



exports.timeStamp = function () { return (new Date).yyyymmddhhmmss() }  //UTC time stamp


exports.datefromyyyymmdd = function (text) {
	var yyyy = Number(text.substring(0,4))
	var mm = Number(text.substring(5,7))
	var dd = Number(text.substring(8,10))
	var tarih=new Date(yyyy,mm-1,dd,5,0,0)
	return tarih
}


String.prototype.replaceAll = function (search, replacement) {
	var target = this
	return target.split(search).join(replacement)
}

exports.replaceAll= function (search, replacement) {
	var target = this
	return target.replace(new RegExp(search, 'g'), replacement)
}


global.atob=require('atob')
global.btoa=require('btoa')

global.tempLog=(fileName,text)=>{
	if(config.status!='development')
		return
	var tmpDir=os.tmpdir()
	if(config){
		if(config.tmpDir){
			tmpDir=config.tmpDir
		}
	}
	fs.writeFileSync(path.join(tmpDir,fileName),text,'utf8')
}

global.moduleLoader=(folder,suffix,expression,cb)=>{
	try{
		var moduleHolder={}
		var files=fs.readdirSync(folder)

		files.forEach((e)=>{
			let f = path.join(folder, e)
			if(!fs.statSync(f).isDirectory()){
				var fileName = path.basename(f)
				var apiName = fileName.substr(0, fileName.length - suffix.length)
				if (apiName != '' && (apiName + suffix) == fileName) {
					moduleHolder[apiName] = require(f)
				}
			}
		})

		cb(null,moduleHolder)
	}catch(e){
		errorLog(
		         `moduleLoader Error:
		         folder:${folder} 
		         suffix:${suffix}
		         expression:${expression}
		         `)
		cb(e)
	}
}

global.sendFileId=(dbModel,fileId,req,res,next)=>{
	if(fileId){
		dbModel.files.findOne({_id:fileId},(err,doc)=>{
			if(dberr(err,next)){
				if(dbnull(doc,next)){
					sendFile(doc,req,res,next)
				}
			}
		})
	}else{
		next({code:'WRONG_ID',message:'fileId bos'})
	}
}

global.sendFile=(file,req,res,next)=>{
	var tmpFile=path.join(os.tmpdir(),`${uuid.v4()}.api`)
	try{
		if(file.data){
			var fileName=file.fileName || 'file'
			var data=file.data
			if(file.data.indexOf('data:')==0 && file.data.indexOf('base64,')>-1){
				data=b64DecodeUnicode(file.data.split('base64,')[1])
			}else{
				data=file.data
			}

			fs.writeFileSync(tmpFile,data,'utf8')

			res.sendFile(tmpFile,{},(err)=>{
				fs.unlinkSync(tmpFile)
				if(err)
					next(err)
			})


		}else{
			next({code:'FILE_EMPTY',message:'Dosya icerigi bos'})
		}

	}catch(tryErr){
		if(fs.existsSync(tmpFile)){
			fs.unlinkSync(tmpFile)
		}
		next(tryErr)
	}

}


global.downloadFileId=(dbModel,fileId,req,res,next)=>{
	if(fileId){
		dbModel.files.findOne({_id:fileId},(err,doc)=>{
			if(dberr(err,next)){
				if(dbnull(doc,next)){
					downloadFile(doc,req,res,next)
				}
			}
		})
	}else{
		next({code:'WRONG_ID',message:'fileId bos'})
	}
}

global.downloadFile=(file,req,res,next)=>{
	var tmpFile=path.join(os.tmpdir(),`${uuid.v4()}.api`)
	try{
		if(file.data){
			var fileName=file.fileName || 'file'
			var data=file.data
			if(file.data.indexOf('data:')==0 && file.data.indexOf('base64,')>-1){
				data=b64DecodeUnicode(file.data.split('base64,')[1])
			}else{
				data=file.data
			}

			fs.writeFileSync(tmpFile,data,'utf8')

			res.download(tmpFile,fileName,(err)=>{
				fs.unlinkSync(tmpFile)
				if(err)
					next(err)
			})


		}else{
			next({code:'FILE_EMPTY',message:'Dosya icerigi bos'})
		}

	}catch(tryErr){
		if(fs.existsSync(tmpFile)){
			fs.unlinkSync(tmpFile)
		}
		next(tryErr)
	}

}

global.b64EncodeUnicode=(str)=>{
	return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
	                                            function toSolidBytes(match, p1) {
	                                            	return String.fromCharCode('0x' + p1)
	                                            }))
}

global.b64DecodeUnicode=(str)=>{
	return decodeURIComponent(atob(str).split('').map(function(c) {
		return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
	}).join(''))
}


global.clone=(obj)=>{
	return JSON.parse(JSON.stringify(obj))
}

global.iteration=(dizi, fonksiyon, interval=0, errContinue=false, callback)=>{
	var index=0
	var result=[]
	var errors=''

	function tekrar(cb){
		if(index>=dizi.length)
			return cb(null)
		if(config.status=='dev' && index>=3){
			return cb(null)
		}
		fonksiyon(dizi[index],(err,data)=>{
			if(!err){
				if(data) result.push(result)
					index++
				setTimeout(tekrar,interval,cb)
			}else{
				errorLog(`iteration():`,err)
				if(errContinue){
					errors +=`iteration(): ${err.message}\n`
					index++
					setTimeout(tekrar,interval,cb)
				}else{
					cb(err)
				}

			}
		})
	}

	tekrar((err)=>{
		if(!err){
			if(errContinue && errors!=''){
				callback({code:'IterationError',message:errors},result)
			}else{
				callback(null,result)
			}
		}else{
			callback(err,result)
		}

	})
}


exports.renameKey=(key)=>{
	switch(key){
		case 'UUID': return 'uuid'
		case 'ID': return 'ID'
		case 'URI': return 'URI'
		case '$': return 'attr'
	}
	if(key.length<2) return key
		key=key[0].toLowerCase() + key.substr(1,key.length-1)
	if(key.substr(key.length-2,2)=='ID' && key.length>2){
		key=key.substr(0,key.length-2) + 'Id'
	}
	return key
}

exports.renameInvoiceObjects=(obj,renameFunction)=>{

	if(Array.isArray(obj)){
		var newObj=[]
		obj.forEach((e)=>{
			newObj.push(exports.renameInvoiceObjects(e,renameFunction))
		})

		return newObj
	}else if (typeof obj==='object'){
		var newObj={}

		var keys=Object.keys(obj)
		keys.forEach((key)=>{
			var newKey=renameFunction(key)
			if((Array.isArray(obj[key]) || typeof obj==='object') && (key!='$')){
				newObj[newKey]=exports.renameInvoiceObjects(obj[key],renameFunction)
			}else{
				newObj[newKey]=obj[key]
			}
		})
		return newObj
	}else{
		return obj
	}
}




exports.e_despatch2xml=function(doc,rootName='DespatchAdvice'){
	try{


		var jsObject=JSON.parse(JSON.stringify(doc))

		jsObject=exports.deleteObjectFields(jsObject,[
		                                    "_id","createdDate","modifiedDate","deleted","__v",
		                                    "eIntegrator",'ioType','despatchErrors','despatchStatus',
		                                    'localStatus','localErrors','pdf','html','despatchXslt','despatchXsltFiles',
		                                    'location','location2','subLocation','subLocation2','despatchPeriod',
		                                    'originatorCustomerParty','localDocumentId','receiptAdvice'
		                                    ])
		jsObject=exports.deleteObjectProperty(jsObject,'_id')
		jsObject=exports.deleteObjectProperty(jsObject,'identityDocumentReference')
		jsObject=exports.deleteObjectProperty(jsObject,'financialAccount')
		jsObject=exports.deleteObjectProperty(jsObject,'otherCommunication')
		jsObject=exports.deleteObjectProperty(jsObject,'images')
		jsObject=exports.deleteObjectProperty(jsObject,'files')
		jsObject=exports.deleteObjectProperty(jsObject,'passive')
		jsObject=exports.deleteObjectProperty(jsObject,'localDocumentId')

		if(jsObject.shipment!=undefined){
			jsObject.shipment['ID']={value:'1'}
		}
		jsObject=exports.cleanElementWhoHasEmptyID(jsObject)

		if(jsObject.issueTime!=undefined){
			if(jsObject.issueTime.value==''){
				jsObject.issueTime.value=='13:00:00'
			}
			if(jsObject.issueTime.value.length==5){
				jsObject.issueTime.value+=':00'
			}
		}
		
		if(jsObject.deliveryCustomerParty.party.partyIdentification){
			jsObject.deliveryCustomerParty.party.partyIdentification.forEach((e)=>{
				e.ID.value=e.ID.value.replace(/\D/g, '')
			})
		}

		if(jsObject.despatchLine){
			jsObject.despatchLine.forEach((line,index)=>{
				if(line.item.originCountry!=undefined){
					if(line.item.originCountry.name.value==''){
						line.item.originCountry=undefined
						delete line.item.originCountry
					}
				}
				if(line.orderLineReference){
					if(line.orderLineReference.lineId){
						if(line.orderLineReference.lineId.value=''){
							line.orderLineReference=undefined
							delete line.orderLineReference
						}
					}
				}
				
				if(line.outstandingQuantity!=undefined){
					line.outstandingQuantity.attr.unitCode=line.deliveredQuantity.attr.unitCode
				}
				if(line.oversupplyQuantity!=undefined){
					line.oversupplyQuantity.attr.unitCode=line.deliveredQuantity.attr.unitCode
				}
			})
		}
		tempLog('jsObject.json',JSON.stringify(jsObject,null,2))

		jsObject=eIntegrationPrepareXml(jsObject)

		var options={
			attributeString:'attr',
			valueString:'value',
			declaration:{
				include:false,
				encoding:'UTF-8',
				version:'1.0'
			},
			format:{
				doubleQuotes:true
			}
		}

		var despatchAttr={
			'xmlns:ds' : 'http://www.w3.org/2000/09/xmldsig#',
			'xmlns:qdt' : 'urn:oasis:names:specification:ubl:schema:xsd:QualifiedDatatypes-2',
			'xmlns:cctc' : 'urn:un:unece:uncefact:documentation:2',
			'xmlns:ubltr' : 'urn:oasis:names:specification:ubl:schema:xsd:TurkishCustomizationExtensionComponents',
			'xmlns:xsi' : 'http://www.w3.org/2001/XMLSchema-instance',
			'xmlns:udt' : 'urn:un:unece:uncefact:data:specification:UnqualifiedDataTypesSchemaModule:2',
			'xmlns' : 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
			'xmlns:cac' : 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
			'xmlns:ext' : 'urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2' ,
			'xmlns:cbc' : 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2' ,
			'xmlns:xades' : 'http://uri.etsi.org/01903/v1.3.2#',
			'xsi:schemaLocation':'urn:oasis:names:specification:ubl:schema:xsd:DespatchAdvice-2 UBL-DespatchAdvice-2.1.xsd',
			'xmlns:q1' : 'urn:oasis:names:specification:ubl:schema:xsd:DespatchAdvice-2'
		}

		var obj={
			'attr':despatchAttr,
			'cbc:UBLVersionID':'2.1',
			'cbc:CustomizationID':'TR1.2.1',
			'cbc:CopyIndicator':'false'
		}
		Object.keys(jsObject).forEach((key)=>{
			if(Object.keys(obj).indexOf(key)<0){
				obj[key]=jsObject[key]
			}
		})
		var xmlString=js2xmlparser.parse(rootName, obj, options)
		xmlString=xmlString.replaceAll('<cbc:TaxExemptionReason/>','')
		xmlString=xmlString.replaceAll('<cbc:TaxExemptionReasonCode/>','')
		xmlString=xmlString.replaceAll('<cbc:IssueDate/>','')
		xmlString=xmlString.replaceAll('[object Object]','')
		return xmlString
	}catch(tryErr){
		tempLog(`hatali_despatch_${doc._id.toString()}.json`,JSON.stringify(doc,null,2))
		console.error('e_despatch2xml.tryErr',tryErr)
	}
}

exports.e_receiptAdvice2xml=function(doc,rootName='ReceiptAdviceInfo'){
	try{
		var jsObject=JSON.parse(JSON.stringify(doc))

		jsObject=exports.deleteObjectFields(jsObject,[
		                                    "_id","createdDate","modifiedDate","deleted","__v",
		                                    "despatch",'receiptAdviceStatus','receiptAdviceErrors'
		                                    ])
		jsObject=exports.deleteObjectProperty(jsObject,'_id')
		jsObject=exports.deleteObjectProperty(jsObject,'identityDocumentReference')
		jsObject=exports.deleteObjectProperty(jsObject,'financialAccount')
		jsObject=exports.deleteObjectProperty(jsObject,'otherCommunication')
		

		jsObject=eIntegrationPrepareXml(jsObject)

		var options={
			attributeString:'attr',
			valueString:'value',
			declaration:{
				include:false,
				encoding:'UTF-8',
				version:'1.0'
			},
			format:{
				doubleQuotes:true
			}
		}

		var receiptAdviceAttr={
			'xmlns:ds' : 'http://www.w3.org/2000/09/xmldsig#',
			'xmlns:qdt' : 'urn:oasis:names:specification:ubl:schema:xsd:QualifiedDatatypes-2',
			'xmlns:cctc' : 'urn:un:unece:uncefact:documentation:2',
			'xmlns:ubltr' : 'urn:oasis:names:specification:ubl:schema:xsd:TurkishCustomizationExtensionComponents',
			'xmlns:xsi' : 'http://www.w3.org/2001/XMLSchema-instance',
			'xmlns:udt' : 'urn:un:unece:uncefact:data:specification:UnqualifiedDataTypesSchemaModule:2',
			'xmlns' : 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
			'xmlns:cac' : 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
			'xmlns:ext' : 'urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2' ,
			'xmlns:cbc' : 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2' ,
			'xmlns:xades' : 'http://uri.etsi.org/01903/v1.3.2#',
			'xsi:schemaLocation':'urn:oasis:names:specification:ubl:schema:xsd:DespatchAdvice-2 UBL-DespatchAdvice-2.1.xsd',
			'xmlns:q2' : 'urn:oasis:names:specification:ubl:schema:xsd:ReceiptAdvice-2'
		}

		var obj={
			'attr':receiptAdviceAttr,
			'cbc:UBLVersionID':'2.1',
			'cbc:CustomizationID':'TR1.2.1',
			'cbc:CopyIndicator':'false'
		}

		Object.keys(jsObject).forEach((key)=>{
			if(Object.keys(obj).indexOf(key)<0){
				obj[key]=jsObject[key]
			}
		})
		var xmlString=js2xmlparser.parse(rootName, obj, options)
		xmlString=xmlString.replace('</cbc:ID>','</cbc:ID><cbc:CopyIndicator>false</cbc:CopyIndicator>')
		xmlString=xmlString.replaceAll('[object Object]','')
		return xmlString
	}catch(tryErr){
		console.error('e_receiptAdvice2xml.tryErr',tryErr)
	}

}



function receiptAdvicePrepareXml(obj){
	if(Array.isArray(obj)){
		var newObj=[]
		obj.forEach((e)=>{
			newObj.push(receiptAdvicePrepareXml(e))
		})

		return newObj
	}else if (typeof obj==='object'){
		var newObj={}


		var keys=Object.keys(obj)

		keys.forEach((key)=>{
			if(key!='attr' && key!='value'){
				var key2=key
				if((Array.isArray(obj[key]) || typeof obj[key]==='object' )){
					key2=renameKeyForReceiptAdvice(key)
					if(typeof obj[key]==='object'){
						if(Object.keys(obj[key]).indexOf('value')>-1){
							key2=renameKeyForReceiptAdvice(key)
						}
					}
					newObj[key2]=receiptAdvicePrepareXml(obj[key])
				}else{
					key2=renameKeyForReceiptAdvice(key)
					newObj[key2]=obj[key]
				}
			}else{
				newObj[key]=obj[key]
			}

		})


		return newObj
	}else{
		return obj
	}
}

function renameKeyForReceiptAdvice(key){

	switch(key){
		case 'uuid': return 'UUID'
		case 'id': return 'ID'
		case 'uri': return 'URI'
	}
	if(key.length<2) return key
		key=key[0].toUpperCase() + key.substr(1,key.length-1)
	if(key.substr(key.length-2,2)=='Id' && key.length>2){
		key=key.substr(0,key.length-2) + 'Id'
	}
	return key
}

exports.amountValueFixed2Digit=function(obj,parentKeyName){
	if ( typeof(obj) === 'undefined' || obj === null )
		return obj
	if(Array.isArray(obj)){
		obj.forEach((e)=>{
			e=exports.amountValueFixed2Digit(e,parentKeyName)
		})

		return obj
	}else if (typeof obj=='object'){
		var keys=Object.keys(obj)

		keys.forEach((key)=>{
			if ( typeof(obj) !== 'undefined' && obj !== null ){
				if(Array.isArray(obj[key]) || typeof obj[key]=='object'){
					obj[key]=exports.amountValueFixed2Digit(obj[key],key)
				}else{
					if(parentKeyName.toLowerCase().indexOf('amount')>-1){
						if(key=='value'){
							if(!isNaN(obj[key])){
								obj[key]=Number(obj[key]).toFixed(2)
							}

						}
					}
				}
			}
		})
		return obj
	}else{
		return obj
	}
}

function eIntegrationPrepareXml(obj){
	if(Array.isArray(obj)){
		var newObj=[]
		obj.forEach((e)=>{
			newObj.push(eIntegrationPrepareXml(e))
		})

		return newObj
	}else if (typeof obj==='object'){
		var newObj={}


		var keys=Object.keys(obj)

		keys.forEach((key)=>{
			if(key!='attr' && key!='value'){
				var key2=key
				if((Array.isArray(obj[key]) || typeof obj[key]==='object' )){
					key2='cac:' + exports.eInvoiceRenameKeys(key)
					if(typeof obj[key]==='object'){
						if(Object.keys(obj[key]).indexOf('value')>-1){
							key2='cbc:' + exports.eInvoiceRenameKeys(key)
						}
					}
					newObj[key2]=eIntegrationPrepareXml(obj[key])
				}else{
					key2='cbc:' + exports.eInvoiceRenameKeys(key)
					newObj[key2]=obj[key]
				}
			}else{
				newObj[key]=obj[key]
			}

		})


		return newObj
	}else{
		return obj
	}
}

exports.deleteObjectFields = function (obj,fields) {
	if(obj!=undefined){
		if(typeof obj['limit']!='undefined' && typeof obj['totalDocs']!='undefined' && typeof obj['totalPages']!='undefined' && typeof obj['page']!='undefined'){
			obj['pageSize']=obj.limit
			obj.limit=undefined
			delete obj.limit

			obj['recordCount']=obj.totalDocs
			obj.totalDocs=undefined
			delete obj.totalDocs

			obj['pageCount']=obj.totalPages
			obj.totalPages=undefined
			delete obj.totalPages

		}
	}

	if(obj==undefined || fields==undefined)
		return obj
	if(obj==null || fields==null)
		return obj

	for(var key in obj){

		if(fields.indexOf(key.toString())>=0){
			obj[key]=undefined
			delete obj[key]
		}

	}

	return obj
}



exports.deleteObjectProperty=function(obj,propertyName){
	if(obj==null)
		return {}

	if(Array.isArray(obj)){
		var newObj=[]
		obj.forEach((e)=>{
			newObj.push(exports.deleteObjectProperty(e,propertyName))
		})
		return newObj
	}else if (typeof obj==='object'){
		var newObj={}

		if(obj[propertyName]!=undefined){
			obj[propertyName]=undefined
			delete obj[propertyName]
		}
		if(propertyName.indexOf('*')>-1){
			var keys=Object.keys(obj)
			var s=propertyName.replaceAll('*','')
			keys.forEach((e)=>{
				if(e.indexOf(s)>-1){
					obj[e]=undefined
					delete obj[e]
				}
			})
		}

		var keys=Object.keys(obj)
		keys.forEach((key)=>{
            // eventLog('key:',key)
            if(Array.isArray(obj[key]) || typeof obj[key]==='object'){
                // eventLog('typeof obj:',(typeof obj),key)
                newObj[key]=exports.deleteObjectProperty(obj[key],propertyName)
              }else{
              	newObj[key]=obj[key]
              }
            })

		return newObj
	}else{
		return obj
	}
}

exports.eInvoiceRenameKeys=(key)=>{

	switch(key){
		case 'uuid': return 'UUID'
		case 'id': return 'ID'
		case 'uri': return 'URI'
	}
	if(key.length<2) return key
		key=key[0].toUpperCase() + key.substr(1,key.length-1)
	if(key.substr(key.length-2,2)=='Id' && key.length>2){
		key=key.substr(0,key.length-2) + 'ID'
	}
	return key
}


global.b64EncodeUnicode=(str)=>{
	return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
	                                            function toSolidBytes(match, p1) {
	                                            	return String.fromCharCode('0x' + p1)
	                                            }))
}

global.b64DecodeUnicode=(str)=>{
	return decodeURIComponent(atob(str).split('').map(function(c) {
		return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
	}).join(''))
}


global.encodeURIComponent2=(str)=>{
	return encodeURIComponent(str).replace(/[!'()*]/g, escape)
}

global.ioBox=(ioType)=>{ return ioType==0?'Outbox':'Inbox'}


exports.cleanElementWhoHasEmptyID=function(obj){
	if(obj==null)
		return {}

	if(Array.isArray(obj)){
		var newObj=[]
		obj.forEach((e)=>{
			var b=exports.cleanElementWhoHasEmptyID(e)
			if(b){
				newObj.push(b)
			}
		})
		return newObj
	}else if (typeof obj==='object'){
		var newObj={}
		if(obj.hasOwnProperty('ID')){
			if(obj.ID.value==''){
				return undefined
			}
			//console.log(`obj.ID:`,obj.ID)
		}

		var keys=Object.keys(obj)
		keys.forEach((key)=>{
			if(Array.isArray(obj[key]) || typeof obj[key]==='object'){
				newObj[key]=exports.cleanElementWhoHasEmptyID(obj[key])
			}else{
				newObj[key]=obj[key]
			}
		})

		return newObj
	}else{
		return obj
	}
}