import { extension } from 'mime-types';
import fs from 'fs';
import path from 'path';
import appConfig from '../config.json';
import promisify from 'es6-promisify';
import logger from '../logger';

const stat = promisify(fs.stat);

export default async (url: string): Promise<?string> => {
    const response = await fetch(url);

    if (!response.ok) {
        return null;
    }

    // todo hopefully replace all this with digitalocean object storage when it's out

    const contentType = response.headers.get('content-type');
    const ext = extension(contentType);
    logger.debug(contentType, ext);
    const filename = path.basename(url, ext) + '.' + ext;
    const fullpath = `${__dirname}/../public/cdn/${filename}`;
    let exists = false;
    try {
        exists = (await stat(fullpath)).isFile();
    }
    catch(ex) {
        // kind of nasty but fs.exists is deprecated so this is the only way to check for existence of a file
        if(ex.code !== 'ENOENT') {
            throw ex;
        }
    }
    
    if (!exists) {
        const dest = fs.createWriteStream(fullpath);
        response.body.pipe(dest);
    }
    return appConfig.url + 'cdn/' + filename;
}