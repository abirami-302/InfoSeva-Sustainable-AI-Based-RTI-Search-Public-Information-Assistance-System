package com.infoseva.mongoRepository;

import com.infoseva.document.ApplicationLogDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ApplicationLogRepository extends MongoRepository<ApplicationLogDocument, String> {
}
