from app.config.logging_config import get_logger

# Pre-initialized default application logger
logger = get_logger("infoseva_ai")

__all__ = ["logger", "get_logger"]
