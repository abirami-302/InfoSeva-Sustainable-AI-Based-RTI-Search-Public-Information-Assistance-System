import pytest
from unittest.mock import patch, AsyncMock

from app.services.notification_service import (
    create_notification,
    get_notifications,
    mark_as_read,
    delete_notification,
    NotificationEventType,
    NotificationSeverity
)


@pytest.mark.unit
@pytest.mark.asyncio
@patch("app.services.notification_service.get_notification_collection")
async def test_create_notification_success(mock_get_coll):
    mock_coll = AsyncMock()
    mock_get_coll.return_value = mock_coll

    res = await create_notification(
        event_type=NotificationEventType.DOCUMENT_UPLOADED,
        title="Document Uploaded",
        message="PM Kisan guidelines uploaded.",
        severity=NotificationSeverity.SUCCESS,
        metadata={"filename": "pm_kisan.pdf", "secret_key": "MUST_BE_FILTERED"}
    )

    assert res is not None
    assert res.eventType == NotificationEventType.DOCUMENT_UPLOADED
    assert res.severity == NotificationSeverity.SUCCESS
    assert "secret_key" not in res.metadata
    mock_coll.insert_one.assert_called_once()


@pytest.mark.unit
@pytest.mark.asyncio
@patch("app.services.notification_service.get_notification_collection")
async def test_create_notification_resilience_on_mongo_failure(mock_get_coll):
    mock_coll = AsyncMock()
    mock_coll.insert_one.side_effect = RuntimeError("MongoDB connection error")
    mock_get_coll.return_value = mock_coll

    # Should not throw exception to calling code
    res = await create_notification(
        event_type=NotificationEventType.SYSTEM_ERROR,
        title="System Failure",
        message="Error occurred."
    )

    assert res is None


@pytest.mark.unit
@pytest.mark.asyncio
@patch("app.services.notification_service.get_notification_collection")
async def test_mark_as_read_success(mock_get_coll):
    mock_coll = AsyncMock()
    mock_coll.update_one.return_value.modified_count = 1
    mock_get_coll.return_value = mock_coll

    success = await mark_as_read("notif_123")
    assert success is True
    mock_coll.update_one.assert_called_once()


@pytest.mark.unit
@pytest.mark.asyncio
@patch("app.services.notification_service.get_notification_collection")
async def test_delete_notification_success(mock_get_coll):
    mock_coll = AsyncMock()
    mock_coll.delete_one.return_value.deleted_count = 1
    mock_get_coll.return_value = mock_coll

    success = await delete_notification("notif_123")
    assert success is True
    mock_coll.delete_one.assert_called_once()
