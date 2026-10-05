import sys
import uvicorn
from datetime import datetime

from app.config.settings import settings
from app.config.logging_config import get_logger

logger = get_logger("bootstrap")


def print_startup_banner() -> None:
    """
    Displays clean, non-sensitive startup banner to console.
    """
    banner = f"""
==================================================
              INFOSEVA AI SERVICE                
==================================================
 Status          : Launching
 Version         : 1.0.0
 Python Version  : {sys.version.split()[0]}
 Host            : {settings.APP_HOST}
 Port            : {settings.APP_PORT}
 Log Level       : {settings.LOG_LEVEL}
 Startup Time    : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
==================================================
"""
    print(banner)


def main() -> None:
    """
    Lightweight launcher entrypoint delegating lifecycle to FastAPI lifespan in app.main.
    """
    print_startup_banner()
    logger.info("Initializing Uvicorn server launcher for app.main:app...")

    # Determine reload flag based on Log Level / Environment
    reload_enabled = settings.LOG_LEVEL.upper() == "DEBUG"

    try:
        uvicorn.run(
            "app.main:app",
            host=settings.APP_HOST,
            port=settings.APP_PORT,
            reload=reload_enabled,
            log_level=settings.LOG_LEVEL.lower()
        )
    except KeyboardInterrupt:
        logger.info("Application stopped manually by user.")
    except Exception as e:
        logger.critical(f"Launcher-level fatal startup failure: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
