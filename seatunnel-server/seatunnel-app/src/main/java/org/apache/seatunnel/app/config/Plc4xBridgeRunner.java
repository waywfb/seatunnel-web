package org.apache.seatunnel.app.config;

import org.apache.seatunnel.plc4x.bridge.Plc4xBridgeApplication;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class Plc4xBridgeRunner {

    private static final Logger LOG = LoggerFactory.getLogger(Plc4xBridgeRunner.class);

    @EventListener(ApplicationReadyEvent.class)
    public void startBridge() {
        String savedPort = System.setProperty("server.port", "0");
        String savedExclude = System.setProperty("spring.autoconfigure.exclude",
                DataSourceAutoConfiguration.class.getName());
        LOG.info("Starting embedded Plc4xBridge on random port...");
        try {
            SpringApplication app = new SpringApplication(Plc4xBridgeApplication.class);
            app.setRegisterShutdownHook(false);
            int port = Integer.parseInt(
                    app.run().getEnvironment().getProperty("local.server.port"));
            System.setProperty("plc4x.bridge.url", "http://localhost:" + port);
            LOG.info("Plc4xBridge started on port {}", port);
        } catch (Exception e) {
            LOG.error("Failed to start Plc4xBridge", e);
        } finally {
            if (savedPort != null) System.setProperty("server.port", savedPort);
            else System.clearProperty("server.port");
            if (savedExclude != null) System.setProperty("spring.autoconfigure.exclude", savedExclude);
            else System.clearProperty("spring.autoconfigure.exclude");
        }
    }
}
