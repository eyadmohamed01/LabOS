# LabOS

LabOS is a starter monorepo for a research-group web application. Product features are not included yet. Development and production both run through Docker Compose.

## Technologies

- **Frontend:** Next.js, React, TypeScript
- **Backend:** Python, FastAPI, Uvicorn, Pydantic
- **Database:** Supabase, accessed through SQLAlchemy
- **Tests:** pytest
- **Production proxy:** Nginx
- **Containers:** Docker and Docker Compose
- **Commands:** Make
- **Documentation:** Docusaurus

## First installation

Install Git, Docker, and Make. On Windows, use WSL. Start Docker and wait until `docker info` works.

```bash
git clone git@github.com:eyadmohamed01/LabOS.git
cd LabOS
make build
```

The first run downloads the dependencies, starts the application in the background, and builds the documentation.

- Application: http://localhost
- Health: http://localhost/api/health
- API docs: http://localhost/docs
- Documentation: open `docs/build/index.html`

For day-to-day work with live reload, run `make dev`. 
After updating the docs, run `make docs-build` and open `docs/build/index.html` again.

To see all available commands, run `make help`
