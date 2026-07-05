package org.apache.seatunnel.app.controller;

import org.apache.seatunnel.app.security.UserContext;
import org.apache.seatunnel.app.security.UserContextHolder;
import org.apache.seatunnel.app.service.IAiService;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;

import javax.annotation.Resource;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/seatunnel/api/v1/ai")
public class AiController {

    @Resource private IAiService aiService;

    @PostMapping(value = "/chat", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @ApiOperation(value = "AI 对话（SSE 流式）", httpMethod = "POST")
    public SseEmitter chat(
            @ApiParam(value = "消息列表", required = true) @RequestBody Map<String, Object> request) {
        @SuppressWarnings("unchecked")
        List<Map<String, String>> messages = (List<Map<String, String>>) request.get("messages");
        return aiService.chat(messages);
    }

    @PostMapping(value = "/action", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @ApiOperation(value = "AI 意图识别与动作执行（SSE 流式）", httpMethod = "POST")
    public SseEmitter action(
            @ApiParam(value = "消息列表", required = true) @RequestBody Map<String, Object> request) {
        @SuppressWarnings("unchecked")
        List<Map<String, String>> messages = (List<Map<String, String>>) request.get("messages");
        UserContext userContext = null;
        try {
            userContext = UserContextHolder.getUserContext();
        } catch (Exception ignored) {
        }
        return aiService.chatWithActions(messages, userContext);
    }
}
