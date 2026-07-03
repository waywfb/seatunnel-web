package org.apache.seatunnel.plc4x.bridge.controller;

import org.apache.seatunnel.plc4x.bridge.model.*;
import org.apache.seatunnel.plc4x.bridge.service.Plc4xConnectionManager;
import org.apache.seatunnel.plc4x.bridge.service.Plc4xSubscribeService;
import org.apache.seatunnel.plc4x.bridge.service.Plc4xTagService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class Plc4xController {

    private static final Logger log = LoggerFactory.getLogger(Plc4xController.class);

    private final Plc4xConnectionManager connectionManager;
    private final Plc4xTagService tagService;
    private final Plc4xSubscribeService subscribeService;

    @Value("${bridge.version:1.0.0}")
    private String version;

    public Plc4xController(Plc4xConnectionManager connectionManager,
                           Plc4xTagService tagService,
                           Plc4xSubscribeService subscribeService) {
        this.connectionManager = connectionManager;
        this.tagService = tagService;
        this.subscribeService = subscribeService;
    }

    @GetMapping("/version")
    public ApiResponse<String> getVersion() {
        return ApiResponse.success("version", version);
    }

    @PostMapping("/connect")
    public ApiResponse<String> connect(@RequestBody PlcConnectionRequest request) {
        try {
            String connectionId = connectionManager.connect(
                    request.getProtocol(), request.getHost(),
                    request.getPort(), request.getParams());
            return ApiResponse.success("Connected", connectionId);
        } catch (Exception e) {
            log.error("Connect failed", e);
            return ApiResponse.serverError(e.getMessage());
        }
    }

    @PostMapping("/disconnect")
    public ApiResponse<Void> disconnect(@RequestBody Map<String, String> body) {
        String connectionId = body.get("connectionId");
        if (connectionId == null) {
            return ApiResponse.badRequest("connectionId is required");
        }
        connectionManager.disconnect(connectionId);
        return ApiResponse.success(null);
    }

    @GetMapping("/databases")
    public ApiResponse<List<String>> getDatabases() {
        return ApiResponse.success(List.of("default"));
    }

    @GetMapping("/tables")
    public ApiResponse<List<String>> getTables(
            @RequestParam("connectionId") String connectionId) {
        try {
            List<Map<String, Object>> groups = tagService.browseTags(connectionId);
            List<String> tableNames = groups.stream()
                    .map(g -> (String) g.get("groupName"))
                    .toList();
            return ApiResponse.success(tableNames);
        } catch (Exception e) {
            log.error("Browse tags failed", e);
            return ApiResponse.serverError(e.getMessage());
        }
    }

    @GetMapping("/fields")
    public ApiResponse<List<Map<String, Object>>> getFields(
            @RequestParam("connectionId") String connectionId,
            @RequestParam(value = "groupName", required = false) String groupName) {
        try {
            List<Map<String, Object>> groups = tagService.browseTags(connectionId);
            return ApiResponse.success(groups);
        } catch (Exception e) {
            log.error("Browse fields failed", e);
            return ApiResponse.serverError(e.getMessage());
        }
    }

    @PostMapping("/preview")
    public ApiResponse<Map<String, Object>> preview(@RequestBody PlcPreviewRequest request) {
        try {
            Map<String, Object> values = tagService.readTags(
                    request.getConnectionId(), request.getTagAddresses());
            return ApiResponse.success(values);
        } catch (Exception e) {
            log.error("Preview failed", e);
            return ApiResponse.serverError(e.getMessage());
        }
    }

    @PostMapping("/subscribe")
    public ApiResponse<String> subscribe(@RequestBody SubscribeRequest request) {
        try {
            String subscriptionId = subscribeService.startSubscription(request);
            return ApiResponse.success("Subscription started", subscriptionId);
        } catch (Exception e) {
            log.error("Subscribe failed", e);
            return ApiResponse.serverError(e.getMessage());
        }
    }

    @PostMapping("/unsubscribe")
    public ApiResponse<Void> unsubscribe(@RequestBody Map<String, String> body) {
        String subscriptionId = body.get("subscriptionId");
        if (subscriptionId == null) {
            return ApiResponse.badRequest("subscriptionId is required");
        }
        subscribeService.stopSubscription(subscriptionId);
        return ApiResponse.success(null);
    }

    @GetMapping("/subscriptions")
    public ApiResponse<List<Map<String, Object>>> listSubscriptions() {
        return ApiResponse.success(subscribeService.listSubscriptions());
    }
}
