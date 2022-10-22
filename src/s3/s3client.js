import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const s3 = new S3Client();

export const Bucket = "pollinations-ipfs";

export const getSignedURL = async Key => {
    const command = new PutObjectCommand({
        Bucket,
        Key,
    });
    const url = await getSignedUrl(s3, command, { expiresIn: 60 });
    return url;
}