package com.lansphere;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import com.lansphere.network.NetworkProperties;

@SpringBootApplication
@EnableScheduling
@EnableConfigurationProperties(NetworkProperties.class)
public class LanSphereApplication {

    public static void main(String[] args) {
        SpringApplication.run(LanSphereApplication.class, args);
    }
}
