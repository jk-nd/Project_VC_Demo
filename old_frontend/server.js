const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');

const app = express();

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname)));

// Helper function to proxy requests
function proxyRequest(targetHost, targetPort, targetPath, req, res, additionalHeaders = {}) {
    const options = {
        hostname: targetHost,
        port: targetPort,
        path: targetPath,
        method: req.method,
        headers: {
            ...req.headers,
            host: `${targetHost}:${targetPort}`,
            ...additionalHeaders
        }
    };

    // Remove headers that might cause issues
    delete options.headers['content-length'];
    delete options.headers['host'];

    const proxyReq = http.request(options, (proxyRes) => {
        // Copy status code
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        // Pipe the response
        proxyRes.pipe(res);
    });

    proxyReq.on('error', (error) => {
        console.error('Proxy error:', error);
        res.status(500).json({ error: 'Proxy request failed' });
    });

    if (req.body && Object.keys(req.body).length > 0) {
        if (options.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
            const formData = new URLSearchParams(req.body).toString();
            proxyReq.write(formData);
        } else {
            proxyReq.write(JSON.stringify(req.body));
        }
    }

    proxyReq.end();
}

// Proxy endpoint for token
app.post('/proxy/token', async (req, res) => {
    const tokenData = new URLSearchParams();
    tokenData.append('username', req.body.username);
    tokenData.append('password', req.body.password);
    tokenData.append('grant_type', 'password');
    tokenData.append('client_id', 'engine-client');

    proxyRequest(
        'localhost',
        11000,
        '/realms/projectvc-realm/protocol/openid-connect/token',
        { 
            method: 'POST',
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            body: Object.fromEntries(tokenData)
        },
        res
    );
});

// Proxy all /npl requests to the engine
app.all('/npl/*', (req, res) => {
    const headers = {};
    if (req.headers.authorization) {
        headers.authorization = req.headers.authorization;
    }
    proxyRequest(
        'localhost',
        12000,
        req.url,
        req,
        res,
        headers
    );
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;

// First check if port is in use and kill the process if it is
const server = app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please kill the process and try again.`);
        process.exit(1);
    } else {
        console.error('Server error:', err);
    }
}); 