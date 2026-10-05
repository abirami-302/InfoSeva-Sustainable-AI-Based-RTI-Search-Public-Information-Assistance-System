import logging
import sys
from app.config.settings import settings


def get_logger(name: str) -> logging.Logger:
    """
    Returns a configured logger with standard output stream formatting
    and log level loaded from application settings.
    """
    logger = logging.getLogger(name)

    if not logger.handlers:
        logger.setLevel(settings.LOG_LEVEL.upper())

        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(settings.LOG_LEVEL.upper())

        formatter = logging.Formatter(
            fmt="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)

        logger.propagate = False

    return logger
