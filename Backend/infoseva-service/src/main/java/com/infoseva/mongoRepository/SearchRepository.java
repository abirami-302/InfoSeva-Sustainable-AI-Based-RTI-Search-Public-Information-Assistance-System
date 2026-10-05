package com.infoseva.mongoRepository;

import com.infoseva.document.SearchDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SearchRepository extends MongoRepository<SearchDocument, String> {
    Optional<SearchDocument> findBySourceTypeAndSourceId(String sourceType, Long sourceId);
}
