/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.apache.seatunnel.app.controller;

import org.apache.seatunnel.app.common.Result;
import org.apache.seatunnel.app.domain.request.alert.AlertRuleReq;
import org.apache.seatunnel.app.domain.response.PageInfo;
import org.apache.seatunnel.app.domain.response.alert.AlertEventRes;
import org.apache.seatunnel.app.domain.response.alert.AlertRuleRes;
import org.apache.seatunnel.app.service.IAlertService;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;

import javax.annotation.Resource;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/seatunnel/api/v1/alert")
@Api(tags = "告警管理")
public class AlertController extends BaseController {

    @Resource private IAlertService alertService;

    @PostMapping("/rule")
    @ApiOperation(value = "create alert rule", httpMethod = "POST")
    public Result<Long> createRule(@RequestBody AlertRuleReq req) {
        return Result.success(alertService.createRule(req));
    }

    @PutMapping("/rule/{ruleId}")
    @ApiOperation(value = "update alert rule", httpMethod = "PUT")
    public Result<Void> updateRule(
            @ApiParam(value = "rule id", required = true) @PathVariable Long ruleId,
            @RequestBody AlertRuleReq req) {
        alertService.updateRule(ruleId, req);
        return Result.success();
    }

    @DeleteMapping("/rule/{ruleId}")
    @ApiOperation(value = "delete alert rule", httpMethod = "DELETE")
    public Result<Void> deleteRule(
            @ApiParam(value = "rule id", required = true) @PathVariable Long ruleId) {
        alertService.deleteRule(ruleId);
        return Result.success();
    }

    @GetMapping("/rule")
    @ApiOperation(value = "page alert rules", httpMethod = "GET")
    public Result<PageInfo<AlertRuleRes>> pageRule(
            @ApiParam(value = "page no", required = true) @RequestParam Integer pageNo,
            @ApiParam(value = "page size", required = true) @RequestParam Integer pageSize,
            @ApiParam(value = "status, 0-disabled 1-enabled") @RequestParam(required = false)
                    Integer status,
            @ApiParam(value = "rule name") @RequestParam(required = false) String name) {
        return Result.success(alertService.pageRule(pageNo, pageSize, status, name));
    }

    @PostMapping("/rule/{ruleId}/test")
    @ApiOperation(value = "send a test message to the rule webhook", httpMethod = "POST")
    public Result<Map<String, Object>> sendTestWebhook(
            @ApiParam(value = "rule id", required = true) @PathVariable Long ruleId) {
        boolean success = alertService.sendTestWebhook(ruleId);
        Map<String, Object> data = new HashMap<>(2);
        data.put("success", success);
        return Result.success(data);
    }

    @GetMapping("/event")
    @ApiOperation(value = "page alert events", httpMethod = "GET")
    public Result<PageInfo<AlertEventRes>> pageEvent(
            @ApiParam(value = "page no", required = true) @RequestParam Integer pageNo,
            @ApiParam(value = "page size", required = true) @RequestParam Integer pageSize,
            @ApiParam(value = "send status, 0-pending 1-success 2-failed")
                    @RequestParam(required = false)
                    Integer sendStatus,
            @ApiParam(value = "rule id") @RequestParam(required = false) Long ruleId,
            @ApiParam(value = "job define name") @RequestParam(required = false)
                    String jobDefineName) {
        return Result.success(
                alertService.pageEvent(pageNo, pageSize, sendStatus, ruleId, jobDefineName));
    }
}
