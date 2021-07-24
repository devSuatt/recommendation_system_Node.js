const AWS = require('aws-sdk');
const uuid = require('uuid').v4();
const fs = require('fs');
const express = require('express');
const Recommendation = require('../models/recommendation_model');
const app = express();

AWS.config.update({
    accessKeyId: process.env.AWS_ID,
    secretAccessKey: process.env.AWS_SECRET,
    region: process.env.AWS_REGION,
});
var personalize = new AWS.Personalize({ apiVersion: '2018-05-22' });
var personalizeruntime = new AWS.PersonalizeRuntime({ apiVersion: '2018-05-22' });

let interactionsSchema = fs.readFileSync('./public/admin/interactions_schema.json');
let jsonInteractionsSchema = JSON.parse(interactionsSchema);
let schemaInteractions = JSON.stringify(jsonInteractionsSchema);
let itemsSchema = fs.readFileSync('./public/admin/items_schema.json');
let jsonItemsSchema = JSON.parse(itemsSchema);
let schemaItems = JSON.stringify(jsonItemsSchema);
let usersSchema = fs.readFileSync('./public/admin/users_schema.json');
let jsonUsersSchema = JSON.parse(usersSchema);
let schemaUsers = JSON.stringify(jsonUsersSchema);

var interactions = "Interactions";
var items = "Items";
var users = "Users";

const S3 = new AWS.S3({
    accessKeyId: process.env.AWS_ID,
    secretAccessKey: process.env.AWS_SECRET,
    region: process.env.AWS_REGION
});

function _createSchema(schemaName, schema) {
    var schemaParams = {
        name: `${schemaName}_schema`,
        schema: schema,
    };
    return personalize.createSchema(schemaParams).promise();
}

const _createDatasetGroup = (name) => {
    var datasetGroupParams = {
        name: name
    };
    return personalize.createDatasetGroup(datasetGroupParams).promise();
};

const _describeDatasetGroup = (datasetGroupArn) => {
    var params = {
        datasetGroupArn: datasetGroupArn
    };
    return personalize.describeDatasetGroup(params).promise();
}

const _listDatasetGroups = () => {
    var params = {
        maxResults: '10'
    };
    return personalize.listDatasetGroups(params).promise();
}

const _createDataset = (schemaArn, datasetGroupArn, datasetType, datasetName) => {
    var datasetParams = {
        datasetGroupArn: datasetGroupArn,
        datasetType: datasetType,
        name: datasetName,
        schemaArn: schemaArn
    };
    return personalize.createDataset(datasetParams).promise();
};

const _createDatasetImportJob = (dataLocation, datasetArn, jobName) => {
    var params = {
        dataSource: {
            dataLocation: dataLocation
        },
        datasetArn: datasetArn,
        jobName: jobName,
        roleArn: 'arn:aws:iam::674204907607:role/PersonalizeRole'
    };
    return personalize.createDatasetImportJob(params).promise();
};

const _createSolution = (datasetGroupArn, solutionName, recipe) => {
    var recipeArn = "";
    console.log("Recipe " + recipe);
    if (recipe == 'User-Personalization') {
        recipeArn = 'arn:aws:personalize:::recipe/aws-user-personalization';
    } else {
        recipeArn = 'arn:aws:personalize:::recipe/aws-popularity-count';
    }
    console.log("RecipeArn " + recipeArn);
    var params = {
        datasetGroupArn: datasetGroupArn,
        name: solutionName,
        recipeArn: recipeArn,
    };
    return personalize.createSolution(params).promise();
}

const _createSolutionVersion = (solutionArn) => {
    var params = {
        solutionArn: solutionArn, /* required */
        trainingMode: "FULL"
    };
    return personalize.createSolutionVersion(params).promise();
}

const _listSolutions = (datasetGroupArn) => {
    var params = {
        datasetGroupArn: datasetGroupArn,
        maxResults: '10',
    };
    return personalize.listSolutions(params).promise();
}

const _listSolutionVersions = (solutionArn) => {
    var params = {
        maxResults: '10',
        solutionArn: solutionArn
    };
    return personalize.listSolutionVersions(params).promise();
}

const _createCampaign = (solutionVersionArn, name) => {
    var params = {
        minProvisionedTPS: '1',
        name: name,
        solutionVersionArn: solutionVersionArn,
    };
    return personalize.createCampaign(params).promise();
}

const _listCampaign = (solutionArn) => {
    var params = {
        maxResults: '10',
        solutionArn: solutionArn
    };
    return personalize.listCampaigns(params).promise();
}

const _getRecommendationResults = (campaignArn, numResults, userId) => {
    var params = {
        campaignArn: campaignArn,
        numResults: numResults,
        userId: userId
    };
    return personalizeruntime.getRecommendations(params).promise();
}

function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}

function _datasetOperations(schemaName, schema, datasetType, datasetName, s3Location, jobName) {
    _createSchema(schemaName, schema).then((sData) => {
        console.log(sData.schemaArn);
        _listDatasetGroups().then((listData) => {
            let list = listData.datasetGroups;
            let dgArn = list[list.length - 1].datasetGroupArn;
            console.log(dgArn);
            _createDataset(sData.schemaArn, dgArn, datasetType, datasetName).then((dData) => {
                console.log(dData.datasetArn);
                _createDatasetImportJob(s3Location, dData.datasetArn, jobName).then((dijData) => {
                    console.log(dijData.datasetImportJobArn);
                }).catch(err => console.log(err));
            }).catch(err => console.log(err));
        });
    }).catch(err => console.log(err));
}

const waiter = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

function loop(dgArn, index) {
    return new Promise((resolve, reject) => {
        let dsgArn = dgArn;
        setTimeout(function () {
            _describeDatasetGroup(dsgArn).then((describedsg) => {
                console.log("STATUS = " + describedsg.datasetGroup.status);
                resolve(describedsg.datasetGroup.status);
                reject('a problemm');

                loop(dgArn);

            }).catch(err => console.log(err));

        }, 1000 * index);
    });
};

const createDSGroup = (req, res, next) => {
    let abort = true;
    // console.log(req.body.dsgroupname);
    _createDatasetGroup(req.body.dsgroupname).then((dgData) => {
        let dgArn = dgData.datasetGroupArn;
        console.log(dgArn);
        console.log("ARN = " + dgArn);
        for (let i = 1; i < 30 && abort; i++) {
            loop(dgArn, i).then((status) => {
                if (status === 'ACTIVE') {
                    res.redirect('/upload/usersFile');
                    abort = false;
                }
            }).catch(err => console.log(err));

        }

    }).catch(err => console.log(err));

}

const usersUploadFile = (req, res, next) => {
    var dataLoc;
    if (!req.files) {
        var file = req.files.file;
        let fileName = file.name.split('.');
        const fileType = fileName[fileName.length - 1];
        console.log("FileType: " + fileType);

        file.mv('./uploads/' + fileName, (err) => {
            if (err) console.log("File has not been uploaded");
            else console.log("File uploaded");
        });

        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `users1${uuid}.${fileType}`,       // for example: unique_id.csv
            Body: file.data,
        }


        S3.upload(params).promise().then((s3Data) => {
            console.log(s3Data.Location);

            _datasetOperations("users1", schemaUsers, "Users", "userDataset1", s3Data.Location, "usersJob1");

        }).catch(err => console.log(err));
        sleep(10000);
        res.redirect('/upload/itemsFile');
    } else {
        sleep(5000);
        res.redirect('/upload/itemsFile');
    }
    next();
};

const itemsUploadFile = (req, res, next) => {
    var dataLoc;
    if (!req.files) {
        var file = req.files.file;
        let fileName = file.name.split('.');
        const fileType = fileName[fileName.length - 1];
        console.log("FileType: " + fileType);

        file.mv('./uploads/' + fileName, (err) => {
            if (err) console.log("File has not been uploaded");
            else console.log("File uploaded");
        });

        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `items1${uuid}.${fileType}`,       // for example: unique_id.csv
            Body: file.data,
        }

        S3.upload(params).promise().then((s3Data) => {
            console.log(s3Data.Location);

            _datasetOperations("items1", schemaItems, "Items", "itemsDataset1", s3Data.Location, "itemsJob1");

        }).catch(err => console.log(err));
        sleep(5000);
        res.redirect('/upload/interactionsFile');
    } else {
        sleep(5000);
        res.redirect('/upload/interactionsFile');
    }
    next();
};

const interactionsUploadFile = (req, res, next) => {
    var dataLoc;
    if (req.files) {
        var file = req.files.file;
        let fileName = file.name.split('.');
        const fileType = fileName[fileName.length - 1];
        console.log("FileType: " + fileType);

        file.mv('./uploads/' + fileName, (err) => {
            if (err) console.log("File has not been uploaded");
            else console.log("File uploaded");
        });

        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `interactions1${uuid}.${fileType}`,       // for example: unique_id.csv
            Body: file.data,
        }

        S3.upload(params).promise().then((s3Data) => {
            console.log(s3Data.Location);

            _datasetOperations("interactions1", schemaInteractions, "Interactions", "interactionDataset1", s3Data.Location, "interactionJob1");

        }).catch(err => console.log(err));
        res.redirect('/upload/solution');
    } else {
        sleep(10000);
        res.redirect('/upload/solution');
    }
    next();
};

const createSolution = (req, res, next) => {
    _listDatasetGroups().then((listDG) => {
        let list = listDG.datasetGroups;
        let dgArn = list[list.length - 1].datasetGroupArn;
        console.log(dgArn);
        _createSolution(dgArn, req.body.solutionName, req.body.recipe).then((solData) => {
            console.log(solData.solutionArn);
            console.log(solData.solutionArn);
            sleep(20000);
            _createSolutionVersion(solData.solutionArn).then((solVersion) => {
                console.log(solVersion.solutionVersionArn);
            }).catch((err) => console.log(err));

        }).catch((err) => console.log(err));
    });

    sleep(20000);
    res.redirect('/upload/campaign');
}

const createCampaign = (req, res, next) => {
    _listDatasetGroups().then((listDG) => {
        let list = listDG.datasetGroups;
        let dgArn = list[list.length - 1].datasetGroupArn;
        console.log(dgArn);
        _listSolutions(dgArn).then(listSols => {
            var solList = listSols.solutions;
            var solArn = solList[0].solutionArn;
            console.log(solArn);
            _listSolutionVersions(solArn).then(solVersion => {
                let arr = solVersion.solutionVersions;
                let solVersionArn = arr[0].solutionVersionArn;
                console.log(solVersionArn);
                _createCampaign(solVersionArn, req.body.campaignName).then(camData => {
                    console.log(camData.campaignArn);
                }).catch(err => console.log(err));
            }).catch(err => console.log(err));
        }).catch(err => console.log(err));

    }).catch(err => console.log(err));

    sleep(20000);
    res.render('campaign', { layout: 'layout/management_layout.ejs' });
    next();
}

const getResults = (req, res, next) => {
    var itemList = [];
    _listDatasetGroups().then(dgData => {
        var list = dgData.datasetGroups;
        var dgArn = list[0].datasetGroupArn;
        _listSolutions(dgArn).then(solData => {
            var solList = solData.solutions;
            var solArn = solList[solList.length - 1].solutionArn;
            _listCampaign(solArn).then(camData => {
                var camList = camData.campaigns;
                res.render('get_recommendations', { layout: 'layout/management_layout.ejs', solList, itemList });
                next();

            }).catch(err => console.log(err));
        }).catch(err => console.log(err));
    }).catch(err => console.log(err));

};

const getRecommendations = (req, res, next) => {
    var solList = [];
    var solArn = 'arn:aws:personalize:eu-central-1:674204907607:solution/' + req.body.solutionName;
    console.log(solArn);
    _listCampaign(solArn).then(camData => {
        var camList = camData.campaigns;
        var camArn = camList[camList.length - 1].campaignArn;
        console.log(camArn);
        _getRecommendationResults(camArn, req.body.numberOfResults, req.body.userId).then((recData) => {
            console.log(req.body.numberOfResults + ' & ' + req.body.userId);
            console.log('itemId = ' + recData.itemList[0].itemId);
            console.log('score = ' + recData.itemList[0].score);
            res.render('get_recommendations', { layout: 'layout/management_layout.ejs', solList, itemList: recData.itemList });
            next();
        }).catch(err => console.log(err));
    }).catch(err => console.log(err));
    // res.redirect('/upload/getResults');
};

const getCampaign = (req, res, next) => {
    res.render('campaign', { layout: 'layout/management_layout.ejs' });
    next();
};

const getUploadFile = (req, res, next) => {
    res.render('upload_file', { layout: './layout/management_layout.ejs' });
    next();
};

const getDSGroup = (req, res, next) => {
    res.render('ds_group', { layout: 'layout/management_layout.ejs' });
    next();
};

const getUsersUploadFile = (req, res, next) => {
    res.render('upload_users', { layout: 'layout/management_layout.ejs' });
    next();
};

const getItemsUploadFile = (req, res, next) => {
    res.render('upload_items', { layout: './layout/management_layout.ejs' });
    next();
};

const getInteractionsUploadFile = (req, res, next) => {
    res.render('upload_interactions', { layout: './layout/management_layout.ejs' });
    next();
};

const getSolution = (req, res, next) => {
    res.render('solution', { layout: 'layout/management_layout.ejs' });
    next();
};

module.exports = {
    createDSGroup,
    getUploadFile,
    getDSGroup,
    getUsersUploadFile,
    getItemsUploadFile,
    getInteractionsUploadFile,
    usersUploadFile,
    itemsUploadFile,
    interactionsUploadFile,
    getSolution,
    getCampaign,
    getRecommendations,
    getResults,
    createSolution,
    createCampaign
}
