import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number.parseInt(process.env.PORT || '8080', 10);
const mimeTypes = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
};

const server = createServer(async (request, response) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        response.writeHead(405, { Allow: 'GET, HEAD' }).end('Method not allowed');
        return;
    }
    let pathname;
    try {
        pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    } catch {
        response.writeHead(400).end('Invalid URL');
        return;
    }
    const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const filePath = path.resolve(projectRoot, relativePath);
    if (filePath !== projectRoot && !filePath.startsWith(`${projectRoot}${path.sep}`)) {
        response.writeHead(403).end('Forbidden');
        return;
    }
    try {
        const details = await stat(filePath);
        if (!details.isFile()) throw new Error('Not a file');
        response.writeHead(200, {
            'Content-Type': mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
            'Content-Length': details.size,
            'X-Content-Type-Options': 'nosniff',
        });
        if (request.method === 'HEAD') response.end();
        else createReadStream(filePath).pipe(response);
    } catch {
        response.writeHead(404).end('Not found');
    }
});

server.listen(port, '127.0.0.1', () => {
    process.stdout.write(`Sky Dash dev server: http://127.0.0.1:${port}\n`);
});
