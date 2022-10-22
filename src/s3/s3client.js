import { S3Client } from '@aws-sdk/client-s3';

export const s3 = new S3Client();

export const Bucket = "pollinations-ipfs";

export const getSignedUrl = async Key => {
    const command = new GetObjectCommand({
        Bucket,
        Key,
    });
    const url = await getSignedUrl(s3, command, { expiresIn: 60 });
    return url;
}