package com.infoseva.mongoRepository;

import com.infoseva.document.AnalyticsDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AnalyticsRepository extends MongoRepository<AnalyticsDocument, String> {
}
