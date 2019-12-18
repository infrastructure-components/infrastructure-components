import middleware from "../middleware/middleware-component";

const path = require ("path");
const fs = require("fs");

const LOCAL_ENDPOINT = 'http://localhost:3002';

export const STORAGE_ACTION = {
    UPLOAD: "UPLOAD",
    LIST: "LIST"

};

const getBucket = () => process.env.BUCKET_ID;

const isOffline = () => !(getBucket().startsWith("infrcomp"));

const getS3 = () => {
    //AWS.config.update({region: 'eu-west-1'});
    const AWS = require('aws-sdk');

    return new AWS.S3(Object.assign({
            apiVersion: '2006-03-01'
        },
        isOffline() ? {
            s3ForcePathStyle: true,
            accessKeyId: 'S3RVER', // This specific key is required when working offline
            secretAccessKey: 'S3RVER',
            endpoint: new AWS.Endpoint(LOCAL_ENDPOINT),
        } : {}
    ));
};

function prepareLocalFs () {
    const getTempName = isOffline() ? () => {


        const targetFolder = ".s3";
        //check if folder needs to be created or integrated
        if ( !fs.existsSync( targetFolder ) ) {
            fs.mkdirSync( targetFolder, {recursive: true} );

        }
        fs.chmodSync( targetFolder, 0o777);

        return targetFolder;
    } : () => "/tmp";

    return getTempName();
}


export const uploadMiddleware = (storageId) => middleware({
    callback: async function (req, res, next) {

        const parsedBody = JSON.parse(req.body);

        if (parsedBody.action !== STORAGE_ACTION.UPLOAD) {
            return next();
        }
        //console.log("this is the storage-service: ", parsedBody.part, " of ", parsedBody.total_parts, ", offline: ", isOffline());

        //console.log("data: ", parsedBody.data);

        const s3 = getS3();

        // prepare file data
        const buffer = Buffer.from(parsedBody.file_data.match(/^data:.+\/(.+);base64,(.*)$/)[2], 'base64');
        const tmpName = path.join(prepareLocalFs(),parsedBody.file);

        await new Promise((resolve, reject) => {
            fs.writeFile(tmpName, buffer,
                (err) => {
                    if (err) {
                        //console.log(err);
                        reject(err);
                    } else {
                        //console.log("Successfully Written File to tmp.");
                        resolve();
                    }
                });
        });

        const prefix = parsedBody.prefix !== undefined && parsedBody.prefix.replace(/(^\/)|(\/$)/g, "").length > 0 ?
            parsedBody.prefix.replace(/(^\/)|(\/$)/g, "") + "/" : "";

        const getFilePartKey = (idx) => storageId + "/" + prefix + parsedBody.file + "_ICPART_" + idx;


        await s3.upload({
            Bucket: getBucket(),
            Key: getFilePartKey(parsedBody.part),
            Body: fs.createReadStream(tmpName),
            //Expires:expiryDate
        }).promise().then(
            function (data) {
                //console.log("file uploaded: ", data);
            },
            function (error) {
                console.log("could not upload to s3 ", error);
            }
        );

        if (parseInt(parsedBody.part) + 1 == parseInt(parsedBody.total_parts)) {

            const parts = Buffer.concat(await Promise.all(Array.apply(null, Array(parseInt(parsedBody.total_parts))).map(
                function (part, idx) {
                    return new Promise((resolve, reject) => {
                        const partParams = {
                            Bucket: getBucket(),
                            Key: getFilePartKey(idx)
                        };

                        return s3.getObject(partParams).promise().then(
                            async function (data) {
                                //console.log("file downloaded: ", data);

                                await s3.deleteObject(partParams).promise().then(
                                    ok => ok,
                                    err => {
                                        console.log("could not delete part ", idx, err);
                                    }
                                );

                                resolve(Buffer.from(data.Body, 'base64'));

                            },
                            function (error) {
                                console.log("could not load part ", idx, error);
                                reject(error);
                            }
                        );

                    });

                }
            )));

            //console.log("upload to: ", storageId + "/" +prefix + parsedBody.fil);

            const finalparams = {
                Bucket: getBucket(),
                Key: storageId + "/" +prefix + parsedBody.file,
                Body: parts,
                //Expires:expiryDate
            };

            await s3.upload(finalparams).promise().then(
                function (data) {
                    //console.log("file uploaded: ", data);

                    res.status(200)
                        .set({
                            "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
                            "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
                        })
                        .send(JSON.stringify({uri: data.Location }));

                    return;

                },
                function (error) {
                    console.log("could not upload to s3 ", error);

                    res.status(500).set({
                        "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
                        "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
                    }).send("error");

                    return
                }
            );

        } else {
            res.status(200).set({
                "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
                "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
            }).send(JSON.stringify({part: parsedBody.part, total_parts: parsedBody.total_parts }));
        }


    }
});

/**
 * User-function to upload a file from the front-end
 *
 * @param storageId
 * @param file
 * @param onProgess
 * @param onComplete
 * @param onError
 */
export const uploadFile = (
    storageId: string,
    prefix: string | undefined,
    file,
    data,
    onProgess: (uploaded: number) => Boolean,
    onComplete: (uri: string) => void,
    onError: (err: string) => void
) => {


    if (!file) {
        onError("not a valid file!");
        return;
    }


    const slice_size = 100 * 1024;
    const reader = new FileReader();

    function upload_file( start, part ) {

        const next_slice = start + slice_size + 1;
        const totalParts = Math.ceil(file.size / slice_size);

        const blob = file.slice( start, next_slice );


        reader.onload = function( event ) {
            if ( event.target.readyState !== FileReader.DONE ) {
                return;
            }

            require("infrastructure-components").callService(
                storageId,
                Object.assign({
                    action: STORAGE_ACTION.UPLOAD,
                    file_data: event.target.result,
                    file: file.name,
                    file_type: file.type,
                    prefix: prefix,
                    part: part,
                    total_parts: totalParts,
                }, part +1 == totalParts ? {
                    data: data
                } : {}),
                (data: any) => {

                    data.json().then(parsedBody => {
                        //console.log("parsedBody: ", parsedBody);

                        const size_done = start + slice_size;

                        if ( next_slice < file.size ) {
                            if (onProgess(size_done)) {
                                // More to upload, call function recursively
                                upload_file( next_slice, part+1 );
                            } else {
                                onError("cancelled");
                            }

                        } else {
                            // Update upload progress
                            onComplete(parsedBody.uri);
                        }
                    });





                },
                (error) => {
                    onError(error);
                }
            );

        };

        reader.readAsDataURL( blob );
    }

    upload_file(0, 0);

};

export const LISTFILES_MODE = {
    FILES: "FILES",
    FOLDERS: "FOLDERS",
    ALL: "ALL"
}

/**
 * User-function to get a list of the files. Call from the front-end
 *
 */
export const listFiles = (
    storageId: string,
    prefix: string,
    listMode: string,
    data: any,
    onComplete: (data: any,  files: any) => void,
    onError: (err: string) => void,
    config: any = undefined,
    isOffline: Boolean = false
) => {

    //console.log("listFiles")
    require("infrastructure-components").callService(
        storageId,
        {
            action: STORAGE_ACTION.LIST,
            prefix: prefix,
            listMode: listMode,
            data: data
        },
        (data) => {
            data.json().then(parsedBody => {
                //console.log(parsedBody);
                onComplete(parsedBody.data, parsedBody.files)
            });
        },
        (error) => {
            //console.log("error: ", error);
            onError(error);
        },
        config,
        isOffline
    );
}


export const listMiddleware = (storageId) => middleware({
    callback: async function (req, res, next) {

        const parsedBody = JSON.parse(req.body);

        if (parsedBody.action !== STORAGE_ACTION.LIST) {
            return next();
        }

        const s3 = getS3();
        //const getFilePartKey = (idx) =>  + parsedBody.file + "_ICPART_" + idx;


        await s3.listObjectsV2({
            Bucket: getBucket(),
            Prefix: storageId + "/"  + (parsedBody.prefix ? parsedBody.prefix : "").replace(/(^\/)|(\/$)/g, "")
        }).promise().then(
            function (data) {
                //console.log("listed: ", data);

                const filesList = data.Contents.map(item => ({
                    file: item.Key.substring(item.Key.lastIndexOf("/")+1),
                    url: (isOffline() ? LOCAL_ENDPOINT + "/"+data.Name+"/" : "https://"+data.Name+".s3.amazonaws.com/")+item.Key,
                    lastModified: item.LastModified,
                    itemKey: item.Key.substring(item.Key.indexOf(storageId)+storageId.length)
                })).filter(
                    item => {
                        if (parsedBody.listMode === LISTFILES_MODE.ALL) {
                            return true;
                        }

                        const temp = path.join(storageId, parsedBody.prefix ? parsedBody.prefix : "").replace(/(^\/)|(\/$)/g, "");
                        const isInThisFolder =  item.url.indexOf(temp)+temp.length+1 == item.url.indexOf(item.file);

                        //console.log(temp, " | ", item.url, " | ", item.file);

                        return (parsedBody.listMode === LISTFILES_MODE.FILES && isInThisFolder) ||
                            (parsedBody.listMode === LISTFILES_MODE.FOLDERS && !isInThisFolder)
                    }
                );


                res.status(200)
                    .set({
                        "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
                        "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
                    })
                    .send({
                        data: res.locals,
                        files: parsedBody.listMode !== LISTFILES_MODE.FOLDERS ? filesList : Object.values(filesList.reduce(
                            (result, current) => {
                                // if we want a list of folders, map the result
                                //console.log(current.itemKey);
                                const folder = current.itemKey.substring(0,current.itemKey.lastIndexOf("/")).replace(/(^\/)|(\/$)/g, "");
                                //console.log("key: ", folder);
                                const obj = {};
                                obj[folder] = Object.assign({
                                    folder: folder.indexOf("/") >= 0 ? folder.substring(0,folder.indexOf("/")) : folder
                                }, current);
                                return Object.assign(obj, result)

                            }, {} // starting with an empty list
                    ))});

                return;
            },
            function (error) {
                console.log("could not list s3 ", error);

                res.status(500).set({
                    "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
                    "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
                }).send("error");

                return
            }
        );

    }
});