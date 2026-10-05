package com.infoseva.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class EntitySyncEvent extends ApplicationEvent {
    
    private final Object entity;
    private final String operation; // CREATE, UPDATE, DELETE

    public EntitySyncEvent(Object source, Object entity, String operation) {
        super(source);
        this.entity = entity;
        this.operation = operation;
    }
}
