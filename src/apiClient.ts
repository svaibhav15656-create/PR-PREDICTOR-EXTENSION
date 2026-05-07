import * as https from 'https';
import * as http from 'http';

export interface PrInput {
    title:           string;
    additions:       number;
    deletions:       number;
    changed_files:   number;
    commits:         number;
    labels:          string;
    author:          string;
    day_of_week:     number;
    hour_of_day:     number;
    month:           number;
    draft:           number;
    comments:        number;
    review_comments: number;
    body?:           string;
}

export interface PrPrediction {
    predicted_hours:  number;
    lower_bound_hrs:  number;
    upper_bound_hrs:  number;
    category:         string;
    category_emoji:   string;
    confidence_pct:   number;
    top_signals:      string[];
    model_mae_hours:  number;
}

export async function getPrediction(
    apiUrl: string,
    input: PrInput
): Promise<PrPrediction> {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify(input);
        const url  = new URL(`${apiUrl}/predict`);
        const isHttps = url.protocol === 'https:';
        const lib = isHttps ? https : http;

        const options = {
            hostname: url.hostname,
            port:     url.port || (isHttps ? 443 : 80),
            path:     url.pathname,
            method:   'POST',
            headers: {
                'Content-Type':   'application/json',
                'Content-Length': Buffer.byteLength(body),
            },
            timeout: 10000,
        };

        const req = lib.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        resolve(JSON.parse(data));
                    } catch {
                        reject(new Error('Invalid response from API'));
                    }
                } else {
                    reject(new Error(`API returned ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error',   err => reject(err));
        req.on('timeout', ()  => { req.destroy(); reject(new Error('Request timed out')); });
        req.write(body);
        req.end();
    });
}

export async function checkApiHealth(apiUrl: string): Promise<boolean> {
    return new Promise((resolve) => {
        const url = new URL(`${apiUrl}/health`);
        const isHttps = url.protocol === 'https:';
        const lib = isHttps ? https : http;

        const req = lib.get(
            { hostname: url.hostname, port: url.port || (isHttps ? 443 : 80),
              path: url.pathname, timeout: 5000 },
            (res) => resolve(res.statusCode === 200)
        );
        req.on('error', () => resolve(false));
        req.on('timeout', () => { req.destroy(); resolve(false); });
    });
}
