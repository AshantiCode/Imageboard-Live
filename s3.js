const knox = require("knox");
const fs = require("fs");
const aws = require("aws-sdk");

let secrets;

// let s3 = new aws.S3({
//   accessKeyId: process.env.S3_KEY,
//   secretAccessKey: process.env.S3_SECRET,
// });

// if (process.env.NODE_ENV == "production") {
//   secrets = process.env; // in prod the secrets are environment variables
// } else {
//   secrets = require("./secrets"); // secrets.json is in .gitignore
// }
//  new
if (process.env.NODE_ENV == “production”) {
  secrets = {
    AWS_ACCESS_KEYS: process.env.AWS_ACCESS_KEYS,
    S3_KEY: process.env.S3_KEY
  }
  else {
    secrets = require(“. / secrets”);

    // hab ich eingefügt (muss bucket auch aendern??)
    const client = knox.createClient({
      key: secrets.S3_KEY,
      secret: secrets.S3_SECRET,
      bucket: secrets.S3_BUCKET_NAME
    });

    // const client = knox.createClient({
    //   key: secrets.AWS_KEY,
    //   secret: secrets.AWS_SECRET,
    //   bucket: "spicedling"
    // });

    module.exports.upload = (req, res, next) => {
      if (!req.file) {
        console.log("multer failed");
        return res.sendStatus(500);
      }
      const s3Request = client.put(req.file.filename, {
        "Content-Type": req.file.mimetype,
        "Content-Length": req.file.size,
        "x-amz-acl": "public-read"
      });

      const readStream = fs.createReadStream(req.file.path);
      readStream.pipe(s3Request);

      s3Request.on("response", s3Response => {
        if (s3Response.statusCode == 200) {
          next();
          fs.unlink(req.file.path, () => {});
        } else {
          console.log("Error inS3Request:", s3Response.statusCode);
          res.sendStatus(500);
        }
      });
    }; //closes upload