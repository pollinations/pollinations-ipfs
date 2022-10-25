import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Bucket } from './config.js';
let _s3client = null;

export const getSignedURL = async Key => {

    if (!_s3client)
        _s3client = new S3Client();

    const command = new PutObjectCommand({
        Bucket,
        Key,
    });
    const url = await getSignedUrl(_s3client, command, { expiresIn: 60 });
    return url;
}