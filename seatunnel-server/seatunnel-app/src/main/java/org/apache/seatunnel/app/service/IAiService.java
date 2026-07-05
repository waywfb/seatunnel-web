package org.apache.seatunnel.app.service;

import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;

public interface IAiService {
    SseEmitter chat(List<Map<String, String>> messages);

    SseEmitter chatWithActions(List<Map<String, String>> messages, Integer userId);
}
