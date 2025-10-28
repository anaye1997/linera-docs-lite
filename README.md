# Linera Docs Lite

## Build Dev
```bash
npm install
npm run dev
```

visit http://localhost:5173/

```
  VITE v7.1.10  ready in 77 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```


## Build Production
```bash
npm install
npm run build
docker compose up
```

visit http://localhost:8080/

```
➜  linera-docs-lite git:(main) ✗ docker compose up
Attaching to nginx
nginx  | /docker-entrypoint.sh: /docker-entrypoint.d/ is not empty, will attempt to perform configuration
nginx  | /docker-entrypoint.sh: Looking for shell scripts in /docker-entrypoint.d/
nginx  | /docker-entrypoint.sh: Launching /docker-entrypoint.d/10-listen-on-ipv6-by-default.sh
nginx  | 10-listen-on-ipv6-by-default.sh: info: IPv6 listen already enabled
nginx  | /docker-entrypoint.sh: Sourcing /docker-entrypoint.d/15-local-resolvers.envsh
```
