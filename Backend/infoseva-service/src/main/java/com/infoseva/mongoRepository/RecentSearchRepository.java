package com.infoseva.mongoRepository;

import com.infoseva.document.RecentSearchDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RecentSearchRepository extends MongoRepository<RecentSearchDocument, String> {
}
