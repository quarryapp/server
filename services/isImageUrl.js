import { URL } from 'url';
import path from 'path';

export default (url: string) => {
    const URI = new URL(url);
    const ext = path.extname(path.basename(URI.pathname));
    
    switch(ext) {
        case '.png':
        case '.jpg':
        case '.jpeg':
        case '.gif':
            return true;
        default:
            return false;
    }
};