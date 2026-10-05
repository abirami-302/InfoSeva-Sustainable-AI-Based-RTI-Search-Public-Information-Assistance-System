import pytest
from unittest.mock import patch, AsyncMock
from app.services.notification_service import create_notification, NotificationEventType, NotificationSeverity


@pytest.mark.integration
@pytest.mark.asyncio
@patch("app.services.notification_service.get_notification_collection")
async def test_notification_workflow_resilience(mock_get_coll):
    mock_coll = AsyncMock()
    mock_coll.insert_one.side_effect = Exception("MongoDB Notification Failure")
    mock_get_coll.return_value = mock_coll

    # Notification service MUST NOT throw exception to caller when MongoDB fails
    res = await create_notification(
        event_type=NotificationEventType.DOCUMENT_UPLOADED,
        title="Document Upload",
        message="Uploaded document sample.",
        severity=NotificationSeverity.INFO
    )

    assert res is None
