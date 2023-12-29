import * as cheerio from 'cheerio';
import { Request, Response } from 'express';
import { IncomingMessage } from 'http';
import { createProxyMiddleware } from 'http-proxy-middleware';
import zlib from 'zlib';
import { shouldIgnorePath } from './ignore-config';

const targetMetaName: string = process.env.TARGET_META_NAME || 'app:status';

/**
 * Filters incoming proxy responses based on the request and response criteria.
 *
 * @param proxyRes - The incoming message from the proxy.
 * @param req - The express request object.
 * @returns A boolean indicating whether the response should be processed further.
 */
function filter(proxyRes: IncomingMessage, req: Request): boolean {
  const path: string = req.path;

  if (shouldIgnorePath(path)) {
    return false;
  }

  return Boolean(
    req.method === 'GET' &&
      proxyRes.headers['content-type']?.includes('text/html') &&
      proxyRes.headers['content-encoding']?.includes('gzip')
  );
}

/**
 * Processes the body of the response to extract a specific meta tag content.
 *
 * @param body - The body of the response as a string.
 * @returns The content of the meta tag if found, otherwise undefined.
 */
function processBody(body: string): string | undefined {
  if (body.includes(targetMetaName)) {
    const $ = cheerio.load(body);
    return $(`meta[name="${targetMetaName}"]`).attr('content');
  }
}

/**
 * Proxy middleware that processes responses from a Next.js server and streams them to the client.
 * It inspects the streamed response for a specific meta tag ('app:response') and, if present,
 * uses its content to modify the response's status code. This allows for dynamic status code
 * manipulation based on the server's response, while preserving the streaming functionality of Next.js.
 *
 */
const proxyMiddleware = createProxyMiddleware({
  target: process.env.TARGET_URL,
  selfHandleResponse: true,
  onProxyRes: (proxyRes: IncomingMessage, req: Request, res: Response) => {
    console.log('Current path : ' + req.path);

    Object.keys(proxyRes.headers).forEach((key) => {
      const headerValue = proxyRes.headers[key];
      if (headerValue !== undefined) {
        res.setHeader(key, headerValue);
      }
    });

    proxyRes.statusCode && res.status(proxyRes.statusCode);

    if (filter(proxyRes, req)) {
      console.log('Filtered path : ' + req.path);
      let statusCodeSet: boolean = false;

      const gunzip: zlib.Gunzip = zlib.createGunzip();
      const gzip: zlib.Gzip = zlib.createGzip();

      proxyRes.pipe(gunzip);
      gzip.pipe(res);

      let body: Buffer[] = [];

      gunzip.on('data', (data: Buffer) => {
        body.push(data);
        if (!statusCodeSet) {
          const statusCode = processBody(body.toString());
          if (!statusCode) return;
          res.status(parseInt(statusCode));
          statusCodeSet = true;
        }
        gzip.write(Buffer.concat(body));
        body = [];
      });

      gunzip.on('end', () => {
        if (body.length > 0) {
          gzip.write(Buffer.concat(body));
        }
        gzip.end();
      });

      gunzip.on('error', (err) => {
        console.log('unzip error');
        gzip.emit('error', err);
      });
    } else {
      // Directly pipe proxy response to express response for non-filtered paths
      proxyRes.pipe(res);
    }
  }
});

export default proxyMiddleware;
