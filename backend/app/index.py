"""ASGI entrypoint for uvicorn and Vercel."""

from pitaya.platform.web.app import create_app

app = create_app()
