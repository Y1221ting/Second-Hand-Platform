db.wanteds.find({}, {name:1, budget:1, status:1, description:1}).forEach(function(d) { print(d.name + " | " + d.budget + " | " + (d.status || "none") + " | " + (d.description||"").substring(0,30)); });
print("--- total: " + db.wanteds.countDocuments({}));
