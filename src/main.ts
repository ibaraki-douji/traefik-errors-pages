import Console, { Color } from "@ibaraki-douji/console";
import { createServer } from "http"
import { Config, PageConfig } from "./Config";
import { ParseInt, StatusCode } from "./Utils";
import { readFileSync } from "fs";
import { join } from "path";


(async () => {

    Console.info('Starting server...');

    Console.info('Loading configuration...');

    Console.success('Configuration loaded :\n' + Console.colors.success + Object.keys(Config).map(key => `${key}: ${Config[key]}`).join('\n' + Console.colors.success + ' > '));

    const pages = new PageConfig();

    const http = createServer((req, res) => {

        const serviceErrorCode = req.url.split('/')[1];
        const serviceHost = req.headers.host;

        const proxyPass = pages.getReverseProxy(serviceErrorCode as StatusCode, serviceHost) || pages.getReverseProxy(serviceErrorCode as StatusCode);
        const redirect = pages.getRedirect(serviceErrorCode as StatusCode, serviceHost) || pages.getRedirect(serviceErrorCode as StatusCode);
        const page = pages.getErrorPage(serviceErrorCode as StatusCode, serviceHost) || pages.getErrorPage(serviceErrorCode as StatusCode);

        let tester = 0; // loop to 4 (host/status | default/status | host/default | default/default)

        while (tester < 4) {
            tester++;

            const currentHost = tester % 2 === 0 ? serviceHost : '*';
            const currentStatus = tester < 2 ? serviceErrorCode : '*';

            if (proxyPass && currentHost === proxyPass.host && currentStatus === proxyPass.status) {
                const lib = require(proxyPass.sheme === 'https' ? 'https' : 'http');

                lib.get(`${proxyPass.sheme}://${proxyPass.proxyHost}${proxyPass.proxyPath}`, (response) => {
                    response.pipe(res);
                });
                Console.info(`Proxying: ${currentHost} ${currentStatus} -> ${proxyPass.proxyHost}${proxyPass.proxyPath}`);
                return;
            }
    
            if (redirect && currentHost === redirect.host && currentStatus === redirect.status) {
                if (redirect.redirectHost) {
                    res.end(`<html><head><meta http-equiv="refresh" content="0; url=${redirect.scheme}://${redirect.redirectHost}${redirect.redirectPath}"></head><body><a href="${redirect.scheme}://${redirect.redirectHost}${redirect.redirectPath}">Click here if you are not redirected</a></body></html>`);
                } else if (redirect.redirectPath) {
                    res.end(`<html><head><meta http-equiv="refresh" content="0; url=${redirect.redirectPath}"></head><body><a href="$${redirect.redirectPath}">Click here if you are not redirected</a></body></html>`);
                } else {
                    res.end('Invalid configuration');
                    throw new Error('Invalid redirect configuration, missing redirectHost or redirectPath');
                }
                Console.info(`Redirecting: ${currentHost} ${currentStatus} -> ${redirect.redirectHost || ''}${redirect.redirectPath || ''}`);
                return;
            }
    
            if (page && currentHost === page.host && currentStatus === page.status) {
                res.end(readFileSync(join(Config.PAGE_PATH, page.page)));
                Console.info(`Serving page: ${currentHost} ${currentStatus} -> ${page.page}`);
                return;
            }
        }

        res.writeHead(+serviceErrorCode, { 'Content-Type': 'text/plain' });
        res.end(`Service Error: ${serviceErrorCode} on ${serviceHost}`);

    });

    http.listen(Config.PORT, () => {
        Console.success('Server is running on port ' + Config.PORT);
    });

})()