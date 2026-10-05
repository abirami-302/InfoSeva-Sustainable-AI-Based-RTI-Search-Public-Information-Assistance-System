package com.infoseva;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class InfosevaApplication {
    public static void main(String[] args) {
        SpringApplication.run(InfosevaApplication.class, args);
    }
}
