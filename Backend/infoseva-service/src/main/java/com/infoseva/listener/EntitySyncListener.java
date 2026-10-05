package com.infoseva.listener;

import com.infoseva.event.EntitySyncEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

import jakarta.persistence.PostPersist;
import jakarta.persistence.PostRemove;
import jakarta.persistence.PostUpdate;
import org.springframework.beans.factory.annotation.Autowired;

@Component
public class EntitySyncListener {

    private static ApplicationEventPublisher publisher;

    @Autowired
    public void setPublisher(ApplicationEventPublisher publisher) {
        EntitySyncListener.publisher = publisher;
    }

    @PostPersist
    public void onPostPersist(Object entity) {
        if (publisher != null) {
            publisher.publishEvent(new EntitySyncEvent(this, entity, "CREATE"));
        }
    }

    @PostUpdate
    public void onPostUpdate(Object entity) {
        if (publisher != null) {
            publisher.publishEvent(new EntitySyncEvent(this, entity, "UPDATE"));
        }
    }

    @PostRemove
    public void onPostRemove(Object entity) {
        if (publisher != null) {
            publisher.publishEvent(new EntitySyncEvent(this, entity, "DELETE"));
        }
    }
}
