module.exports=function(conn){
    var schema = mongoose.Schema({
        ioType :{ type: Number,default: 1}, // 0 - cikis , 1- giris
        despatch: {type: mongoose.Schema.Types.ObjectId, ref: 'despatches', required: true},
        eIntegrator: {type: mongoose.Schema.Types.ObjectId, ref: 'integrators', required: true},
        profileId: { 
            value: { type: String,default: '', trim:true, enum:['TEMELIRSALIYE'], required: true}
        },
        ID: dbType.idType,
        uuid: dbType.valueType,
        issueDate: {value :{ type: String,  required: [true,'Teslim tarihi gereklidir']}},
        issueTime: {value :{ type: String,default: '00:00:00'}},
        receiptAdviceTypeCode: {value: { type: String,default: '', trim:true, enum:['SEVK','MATBUDAN'], required: true}},
        note:[dbType.valueType],
        despatchDocumentReference:dbType.documentReferenceType,
        additionalDocumentReference:[dbType.documentReferenceType],
        orderReference:[dbType.orderReferenceType],
        originatorDocumentReference:[dbType.documentReferenceType],
        despatchSupplierParty:{
            party:dbType.partyType,
            despatchContact:dbType.contactType
        },
        deliveryCustomerParty:{
            party:dbType.partyType,
            deliveryContact:dbType.contactType
        },
        sellerSupplierParty:{
            party:dbType.partyType,
            despatchContact:dbType.contactType
        },
        buyerCustomerParty:{
            party:dbType.partyType,
            deliveryContact:dbType.contactType
        },
        shipment:dbType.shipmentType,
        lineCountNumeric:dbType.numberValueType,
        receiptLine:[dbType.receiptLineType],
        localDocumentId: {type: String, default: ''},
        receiptStatus: {type: String, default: 'Draft',enum:['Draft','Pending','Queued', 'Processing','SentToGib','Success','Error']},
        receiptErrors:[{_date:{ type: Date,default: Date.now}, code:'',message:''}],
        receiptErrors:[{_date:{ type: Date,default: Date.now}, code:'',message:''}],
        createdDate: { type: Date,default: Date.now},
        modifiedDate:{ type: Date,default: Date.now}
    })

    

    schema.pre('save', function(next) {
        if(this.receiptLine){
            this.lineCountNumeric.value=this.receiptLine.length
        }
        

       
        next()
        //bir seyler ters giderse 
        // next(new Error('ters giden birseyler var'))
        
    })
    schema.pre('remove', function(next) {
        next()
    })

    schema.pre('remove', true, function(next, done) {
        next()
        //bir seyler ters giderse 
        // next(new Error('ters giden birseyler var'))
    })

    schema.on('init', function(model) {

    })
    

    schema.plugin(mongoosePaginate)
    schema.plugin(mongooseAggregatePaginate)
    
    schema.index({
        "ioType":1,
        "ID.value":1,
        "issueDate.value":1,
        "uuid.value":1,
        "eIntegrator":1,
        "profileId.value":1,
        "receiptAdviceTypeCode.value":1,
        "localDocumentId":1,
        "receiptStatus":1,
        "localStatus":1,
        "createdDate":1
    })


    var collectionName='despatches_receipt_advice'
    var model=conn.model(collectionName, schema)
    
    model.removeOne=(member, filter,cb)=>{ sendToTrash(conn,collectionName,member,filter,cb) }
    
    return model
}
