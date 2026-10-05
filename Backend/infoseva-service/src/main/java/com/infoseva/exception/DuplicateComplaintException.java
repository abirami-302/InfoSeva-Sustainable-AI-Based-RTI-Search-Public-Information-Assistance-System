package com.infoseva.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class DuplicateComplaintException extends RuntimeException {

    public DuplicateComplaintException(String message) {
        super(message);
    }
}
