var r = db.wanteds.updateMany({status: {$exists: false}}, {$set: {status: "active"}});
printjson(r);
