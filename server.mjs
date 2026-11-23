import { execSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_DIR = path.join(__dirname, 'TCC-test');
const BACKEND_DIR = path.join(REPO_DIR, 'backend');
const FRONTEND_DIR = path.join(REPO_DIR, 'frontend');
const FRONTEND_DIST = path.join(FRONTEND_DIR, 'dist');
const VENV_PYTHON = path.join(BACKEND_DIR, '.venv', 'bin', 'python');

const PORT = Number(process.env.PORT || 3000);
const DJANGO_HOST = '127.0.0.1';
const DJANGO_PORT = 8001;

let djangoProcess = null;
let bootstrapPromise = null;
let ready = false;
let bootstrapError = null;

function getPythonBin() {
  return fs.existsSync(VENV_PYTHON) ? VENV_PYTHON : 'python3';
}

function hasPythonDeps(py) {
  try {
    execSync(
      `${py} -c "import django, rest_framework, corsheaders, storages, boto3, sklearn, psycopg2, openpyxl, reportlab, environ, drf_spectacular, django_filters, PIL"`,
      { stdio: 'ignore' },
    );
    return true;
  } catch {
    return false;
  }
}

function runAsync(command, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn('sh', ['-c', command], { cwd, stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed (${code}): ${command}`));
    });
  });
}

async function ensureEnvironmentAndStartDjango() {
  let py = getPythonBin();

  const mediaDir = path.join(BACKEND_DIR, 'media');
  if (!fs.existsSync(mediaDir)) {
    fs.mkdirSync(mediaDir, { recursive: true });
  }

  if (!hasPythonDeps(py)) {
    console.log('[bootstrap] Installing Python dependencies...');
    await runAsync(
      'curl -sS https://bootstrap.pypa.io/get-pip.py -o /tmp/get-pip.py && python3 /tmp/get-pip.py --break-system-packages -q && python3 -m pip install --break-system-packages -q -r requirements.txt',
      BACKEND_DIR,
    );
    py = getPythonBin();
  }

  if (!fs.existsSync(path.join(FRONTEND_DIST, 'index.html'))) {
    console.log('[bootstrap] Building frontend...');
    await runAsync('npm install --silent && npm run build', FRONTEND_DIR);
  }

  const dbPath = path.join(BACKEND_DIR, 'db.sqlite3');
  const envPath = path.join(BACKEND_DIR, '.env');
  if (!fs.existsSync(envPath) && !fs.existsSync(dbPath)) {
    console.log('[bootstrap] Initializing local SQLite database...');
    await runAsync(`${py} manage.py migrate --noinput`, BACKEND_DIR);
  }

  djangoProcess = spawn(
    py,
    ['manage.py', 'runserver', `${DJANGO_HOST}:${DJANGO_PORT}`, '--noreload'],
    {
      cwd: BACKEND_DIR,
      env: {
        ...process.env,
        PYTHONUNBUFFERED: '1',
        DEBUG: process.env.DEBUG || 'True',
      },
      stdio: 'inherit',
    },
  );

  djangoProcess.on('error', (err) => {
    console.error('[django] failed to start:', err.message);
  });

  djangoProcess.on('exit', (code, signal) => {
    console.log(`[django] exited (code=${code}, signal=${signal})`);
    djangoProcess = null;
  });

  ready = true;
}

function ensureBootstrapped() {
  if (!bootstrapPromise) {
    bootstrapPromise = ensureEnvironmentAndStartDjango().catch((err) => {
      bootstrapError = err;
      console.error('[bootstrap] error:', err);
    });
  }
  return bootstrapPromise;
}

function isBackendPath(urlPath) {
  return (
    urlPath.startsWith('/api') ||
    urlPath.startsWith('/media') ||
    urlPath.startsWith('/admin') ||
    urlPath.startsWith('/static')
  );
}

function forwardToDjango(req, res, retriesLeft = 20) {
  const headers = { ...req.headers };
  headers.host = `${DJANGO_HOST}:${DJANGO_PORT}`;

  const proxyReq = http.request(
    {
      hostname: DJANGO_HOST,
      port: DJANGO_PORT,
      path: req.url || '/',
      method: req.method,
      headers,
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    },
  );

  proxyReq.on('error', (err) => {
    if (err.code === 'ECONNREFUSED' && retriesLeft > 0 && !res.headersSent) {
      setTimeout(() => {
        forwardToDjango(req, res, retriesLeft - 1);
      }, 300);
      return;
    }
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
    }
    res.end(`Django upstream unavailable: ${err.message}`);
  });

  req.pipe(proxyReq, { end: true });
}

const app = express();

app.use((req, res, next) => {
  if (bootstrapError) {
    res.status(500).send(`Startup error: ${bootstrapError.message}`);
    return;
  }
  if (!ready) {
    if (isBackendPath(req.url || '/')) {
      res.status(503).json({ detail: 'Server is initializing, please retry shortly.' });
    } else {
      res
        .status(503)
        .set('Retry-After', '3')
        .send(
          '<!doctype html><html><head><meta http-equiv="refresh" content="3"><title>Starting Appliety...</title></head><body style="font-family:sans-serif;padding:2rem;">Starting Appliety server... Refreshing automatically.</body></html>',
        );
    }
    return;
  }
  if (isBackendPath(req.url || '/')) {
    forwardToDjango(req, res);
    return;
  }
  next();
});

app.use((req, res, next) => {
  if (fs.existsSync(FRONTEND_DIST)) {
    express.static(FRONTEND_DIST)(req, res, next);
  } else {
    next();
  }
});

app.get('*', (_req, res) => {
  const indexFile = path.join(FRONTEND_DIST, 'index.html');
  if (fs.existsSync(indexFile)) {
    res.sendFile(indexFile);
  } else {
    res.status(503).send('Frontend build not found.');
  }
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(
    `[server] Listening on http://0.0.0.0:${PORT} -> static frontend + Django (:${DJANGO_PORT})`,
  );
  ensureBootstrapped();
});

function shutdown() {
  server.close();
  if (djangoProcess && !djangoProcess.killed) {
    djangoProcess.kill('SIGTERM');
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
