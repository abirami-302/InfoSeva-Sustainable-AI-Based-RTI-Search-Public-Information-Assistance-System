package com.infoseva.mongoRepository;

import com.infoseva.document.AuditLogDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditLogRepository extends MongoRepository<AuditLogDocument, String> {
}
