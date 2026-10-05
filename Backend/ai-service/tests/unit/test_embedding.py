import pytest
from unittest.mock import patch, MagicMock

from app.services.embedding_service import (
    embed_document,
    reembed_document,
    delete_document_embeddings,
    validate_embedding_metadata
)


@pytest.mark.unit
def test_validate_embedding_metadata_valid(sample_document_metadata):
    # Should not raise exception
    validate_embedding_metadata(sample_document_metadata)


@pytest.mark.unit
def test_validate_embedding_metadata_missing_field(sample_document_metadata):
    invalid_metadata = sample_document_metadata.copy()
    invalid_metadata.pop("title")

    with pytest.raises(ValueError) as exc_info:
        validate_embedding_metadata(invalid_metadata)
    assert "Missing required metadata fields" in str(exc_info.value)


@pytest.mark.unit
@patch("app.services.embedding_service.embed_batch")
@patch("app.services.embedding_service.add_documents")
def test_embed_document_success(mock_add_documents, mock_embed_batch, sample_document_text, sample_document_metadata):
    mock_embed_batch.return_value = [[0.1, 0.2, 0.3]]

    result = embed_document(sample_document_text, sample_document_metadata)

    assert result.success is True
    assert result.chunksProcessed >= 1
    assert result.documentId == sample_document_metadata["documentId"]
    mock_embed_batch.assert_called_once()
    mock_add_documents.assert_called_once()


@pytest.mark.unit
@patch("app.services.embedding_service.delete_document")
def test_delete_document_embeddings_success(mock_delete_document):
    delete_document_embeddings("doc_test_123")
    mock_delete_document.assert_called_once_with("doc_test_123")


@pytest.mark.unit
def test_delete_document_embeddings_empty_id():
    with pytest.raises(ValueError):
        delete_document_embeddings("")


@pytest.mark.unit
@patch("app.services.embedding_service.delete_document_embeddings")
@patch("app.services.embedding_service.embed_document")
def test_reembed_document_success(mock_embed_doc, mock_delete_embeddings, sample_document_text, sample_document_metadata):
    reembed_document(sample_document_text, sample_document_metadata)
    mock_delete_embeddings.assert_called_once_with(sample_document_metadata["documentId"])
    mock_embed_doc.assert_called_once_with(sample_document_text, sample_document_metadata)
