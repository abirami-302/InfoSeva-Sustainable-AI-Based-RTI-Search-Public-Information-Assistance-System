package com.infoseva.mongoRepository;

import com.infoseva.document.NotificationDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRepository extends MongoRepository<NotificationDocument, String> {
    java.util.List<NotificationDocument> findByUserEmailOrderByCreatedAtDesc(String userEmail);
    long countByUserEmailAndReadFalse(String userEmail);
}
