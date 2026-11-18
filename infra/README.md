# Infrastructure

Production traffic enters through Nginx. The configuration is `nginx/nginx.conf`.

| Public path | Destination |
| --- | --- |
| `/` | Frontend container |
| `/api/` | Backend container |
| `/docs` | Backend API documentation |

Development does not use Nginx. `make dev` publishes the frontend on port 3000 and the backend on port 8000.
