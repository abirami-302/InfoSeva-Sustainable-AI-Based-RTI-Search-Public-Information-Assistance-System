package com.infoseva.event;

import com.infoseva.document.SearchDocument;
import com.infoseva.entity.Document;
import com.infoseva.entity.FAQ;
import com.infoseva.entity.Notice;
import com.infoseva.mongoRepository.SearchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class EntitySyncEventListener {

    private final SearchRepository searchRepository;

    @Async
    @EventListener
    public void handleEntitySyncEvent(EntitySyncEvent event) {
        Object entity = event.getEntity();
        String op = event.getOperation();
        
        try {
            if (entity instanceof Notice notice) {
                syncNotice(notice, op);
            } else if (entity instanceof FAQ faq) {
                syncFAQ(faq, op);
            } else if (entity instanceof Document doc) {
                syncDocument(doc, op);
            }
        } catch (Exception e) {
            log.error("Failed to sync entity to MongoDB: {}", e.getMessage());
        }
    }

    private void syncNotice(Notice notice, String op) {
        if (!notice.isActive() || "DELETE".equals(op)) {
            searchRepository.findBySourceTypeAndSourceId("NOTICE", notice.getNoticeId())
                    .ifPresent(searchRepository::delete);
            return;
        }
        SearchDocument doc = searchRepository.findBySourceTypeAndSourceId("NOTICE", notice.getNoticeId())
                .orElseGet(() -> SearchDocument.builder().sourceType("NOTICE").sourceId(notice.getNoticeId()).build());
        
        doc.setTitle(notice.getTitle());
        doc.setContent(notice.getContent());
        doc.setDepartmentName(notice.getDepartmentRef() != null ? notice.getDepartmentRef().getDepartmentName() : null);
        searchRepository.save(doc);
    }

    private void syncFAQ(FAQ faq, String op) {
        if (!faq.isActive() || "DELETE".equals(op)) {
            searchRepository.findBySourceTypeAndSourceId("FAQ", faq.getFaqId())
                    .ifPresent(searchRepository::delete);
            return;
        }
        SearchDocument doc = searchRepository.findBySourceTypeAndSourceId("FAQ", faq.getFaqId())
                .orElseGet(() -> SearchDocument.builder().sourceType("FAQ").sourceId(faq.getFaqId()).build());
        
        doc.setTitle(faq.getQuestion());
        doc.setContent(faq.getAnswer());
        doc.setDepartmentName(faq.getDepartment() != null ? faq.getDepartment().getDepartmentName() : null);
        searchRepository.save(doc);
    }

    private void syncDocument(Document document, String op) {
        if (!document.isActive() || "DELETE".equals(op)) {
            searchRepository.findBySourceTypeAndSourceId("DOCUMENT", document.getDocumentId())
                    .ifPresent(searchRepository::delete);
            return;
        }
        SearchDocument doc = searchRepository.findBySourceTypeAndSourceId("DOCUMENT", document.getDocumentId())
                .orElseGet(() -> SearchDocument.builder().sourceType("DOCUMENT").sourceId(document.getDocumentId()).build());
        
        doc.setTitle(document.getTitle());
        doc.setContent(document.getDescription());
        doc.setUrl(document.getFileUrl());
        doc.setDepartmentName(document.getDepartment() != null ? document.getDepartment().getDepartmentName() : null);
        searchRepository.save(doc);
    }
}
