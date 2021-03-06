module.exports = function(app) {
    low = require("lowdb")
    fileAsync = require("lowdb/lib/storages/file-async")
    DATA_PATH = "data/"
    DB_NAME = "mfin"
    SERVICE_PATH = "/services"
    dbSchema = require("../../data/schema");
    dbUtil = require("../../data/dbutil");
    Validator = require('jsonschema').Validator;
    v = new Validator();

    db = low(DATA_PATH + DB_NAME + ".json", {
        storage: fileAsync
    })
    tables = dbSchema.getTables();

    const init = function() {
        forAllTables(function(table) {
            if (!dbUtil.isMetaTable(table)) {
                let obj = {};
                obj[table] = [];
                db.defaults(obj).write()
            }
        })
        dbUtil.initCounter();
    }
    const handleGetTableRequest = function() {
        forAllTables(function(table) {
            app.get(SERVICE_PATH + "/" + table + "/:id", (req, res) => {
                let tdata = db.get(table)
                    .find({
                        id: req.params.id
                    })
                    .value()
                res.send(tdata)
            })
        });
    }
    const handlePostTableRequest = function() {
        forAllTables(function(table) {
            app.post(SERVICE_PATH + "/" + table, (req, res) => {
                req.body = dbUtil.assignId(req.body);
                console.log(req.body);
                let validated = v.validate(req.body, dbSchema[table]).errors;
                if (validated.length > 0) {
                    res.status(422).send(validated);
                } else {
                    dbUtil.pushRow(table, req.body).then(tdata => res.send(tdata))
                }
            })
        });
    }
const handleDeleteTableRequest = function() {
        forAllTables(function(table) {
          console.log('delete - '+table)
            app.delete(SERVICE_PATH + "/" + table + "/:id", (req, res) => {
              console.log(db.get(table))
                let tdata = db.get(table)
                    .remove({
                        id: new Number(req.params.id)
                    });
                    

                res.send(db.get(table).value());
            })
        });
    }



    const handleGetAllTableRequest = function() {
        forAllTables(function(table) {
            console.log(SERVICE_PATH + "/" + table);
            app.get(SERVICE_PATH + "/all/" + table, (req, res) => {
                console.log(dbUtil.isBlankObject(req.query));
                if (dbUtil.isBlankObject(req.query)) {
                    res.send(db.get(table).value());
                } else {
                    res.send(db.get(table).find(req.query).value());
                }

            })
        });
    }
    const validateTableInsert = function(table, payload) {
        //TODO - add validation for insert

        return payload;
    }
    const forAllTables = function(cb, specifiedTables) {
        specifiedTables = specifiedTables || tables;
        for (var i = tables.length - 1; i >= 0; i--) {
            cb(tables[i]);
        }
    }
    dbUtil.init(db);
    init();
    handleGetAllTableRequest();
    handleGetTableRequest();
    handlePostTableRequest();
handleDeleteTableRequest();

};