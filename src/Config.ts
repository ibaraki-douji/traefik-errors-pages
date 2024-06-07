import { config } from "dotenv";
import { Method, ParseInt, StatusCode } from "./Utils";

config();

export class Config {

    public static readonly PORT: number = parseInt(process.env.PORT || "3000");

    public static readonly PAGE_PATH: string = process.env.PAGE_PATH || "/pages";

    public static readonly PAGE_CONFIG: string = process.env.PAGE_CONFIG || "/config.json";

} 

export class PageConfig {

    constructor () {
        try {
            Object.assign(this, require(Config.PAGE_CONFIG));
        } catch (e) {
            throw new Error('Error while loading page configuration: ' + e.message);
        }
    }

    public readonly pages: {
        [status in StatusCode | '*' ]: {
            [host: string]: string; // relative path to the html file (PAGE_PATH + relativePath) | '*' = all non specified hosts
        }
    };

    public readonly redirects: {
        [status in StatusCode | '*' ]: {
            [host: string]: { // host to redirect ('*' = all non specified hosts)
                redirectHost: string;
                redirectPath: string;
                scheme: 'http' | 'https';
            } 
        };
    }

    public readonly reverseProxies: {
       [status in StatusCode | '*' ]: {
            [host: string]: { // host to redirect ('*' = all non specified hosts)
                proxyHost: string;
                proxyPath: string;
                sheme: 'http' | 'https';
            }
        }; 
    };

    public getReverseProxy (status: StatusCode, host?: string): { proxyHost: string, proxyPath: string, host: string, status: StatusCode | '*' , sheme: 'http' | 'https' } | null {
        if (!this.reverseProxies) return null;

        if (this.reverseProxies[status] && this.reverseProxies[status][host || '*']) {
            return {
                ...this.reverseProxies[status][host || '*'],
                host: host || '*',
                status
            }
        }

        if (this.reverseProxies['*'] && this.reverseProxies['*'][host || '*']) {
            return {
                ...this.reverseProxies['*'][host || '*'],
                host: host || '*',
                status: '*'
            }
        }
        
        
        return null;
    }

    public getRedirect (status: StatusCode, host?: string): { redirectHost: string, redirectPath: string, scheme: 'http' | 'https', host: string, status: StatusCode | '*' } | null {
        if (!this.redirects) return null;

        if (this.redirects[status] && this.redirects[status][host || '*']) {
            return {
                ...this.redirects[status][host || '*'],
                host: host || '*',
                status
            }
        }

        if (this.redirects['*'] && this.redirects['*'][host || '*']) {
            return {
                ...this.redirects['*'][host || '*'],
                host: host || '*',
                status: '*'
            }
        }
        
        return null;
    }

    public getErrorPage (status: StatusCode, host?: string): { host: string, status: StatusCode | '*', page: string } | null {
        if (!this.pages) return null;

        if (this.pages[status] && this.pages[status][host || '*']) {
            return {
                page: this.pages[status][host || '*'],
                host: host || '*',
                status
            }
        }

        if (this.pages['*'] && this.pages['*'][host || '*']) {
            return {
                page: this.pages['*'][host || '*'],
                host: host || '*',
                status: '*'
            }
        }
        
        return null;
    }

} 