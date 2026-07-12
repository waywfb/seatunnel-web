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
import org.apache.seatunnel.app.domain.request.datastandard.DataStandardFieldMappingReq;
import org.apache.seatunnel.app.domain.request.datastandard.DataStandardFieldReq;
import org.apache.seatunnel.app.domain.request.datastandard.DataStandardFormatReq;
import org.apache.seatunnel.app.domain.request.datastandard.DataStandardReq;
import org.apache.seatunnel.app.domain.request.datastandard.DataStandardVersionReq;
import org.apache.seatunnel.app.domain.response.PageInfo;
import org.apache.seatunnel.app.domain.response.datastandard.DataStandardDetailRes;
import org.apache.seatunnel.app.domain.response.datastandard.DataStandardFieldMappingRes;
import org.apache.seatunnel.app.domain.response.datastandard.DataStandardFieldRes;
import org.apache.seatunnel.app.domain.response.datastandard.DataStandardFormatRes;
import org.apache.seatunnel.app.domain.response.datastandard.DataStandardRelationRes;
import org.apache.seatunnel.app.domain.response.datastandard.DataStandardRes;
import org.apache.seatunnel.app.domain.response.datastandard.DataStandardVersionDetailRes;
import org.apache.seatunnel.app.domain.response.datastandard.DataStandardVersionRes;
import org.apache.seatunnel.app.domain.response.datastandard.VirtualTableStandardRes;
import org.apache.seatunnel.app.service.IDataStandardFieldMappingService;
import org.apache.seatunnel.app.service.IDataStandardFieldService;
import org.apache.seatunnel.app.service.IDataStandardFormatService;
import org.apache.seatunnel.app.service.IDataStandardService;
import org.apache.seatunnel.app.service.IDataStandardVersionService;
import org.apache.seatunnel.app.service.IVirtualTableStandardService;

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

import javax.annotation.Resource;

import java.util.List;

@RestController
@RequestMapping("/seatunnel/api/v1/data-standard")
@Api(tags = "数据标准管理")
public class DataStandardController extends BaseController {

    @Resource private IDataStandardService dataStandardService;

    @Resource private IDataStandardVersionService dataStandardVersionService;

    @Resource private IDataStandardFieldService dataStandardFieldService;

    @Resource private IDataStandardFormatService dataStandardFormatService;

    @Resource private IDataStandardFieldMappingService dataStandardFieldMappingService;

    @Resource private IVirtualTableStandardService virtualTableStandardService;

    @ApiOperation("创建数据标准")
    @PostMapping("/create")
    Result<Long> createDataStandard(@RequestBody DataStandardReq req) {
        return Result.success(dataStandardService.createDataStandard(req));
    }

    @ApiOperation("更新数据标准")
    @PutMapping("/{id}")
    Result<Boolean> updateDataStandard(
            @PathVariable("id") Long id, @RequestBody DataStandardReq req) {
        return Result.success(dataStandardService.updateDataStandard(id, req));
    }

    @ApiOperation("删除数据标准")
    @DeleteMapping("/{id}")
    Result<Boolean> deleteDataStandard(@PathVariable("id") Long id) {
        return Result.success(dataStandardService.deleteDataStandard(id));
    }

    @ApiOperation("获取数据标准详情")
    @GetMapping("/{id}")
    Result<DataStandardDetailRes> getDataStandardDetail(@PathVariable("id") Long id) {
        return Result.success(dataStandardService.getDataStandardDetail(id));
    }

    @ApiOperation("分页查询数据标准列表")
    @GetMapping("/page")
    Result<PageInfo<DataStandardRes>> getDataStandardPage(
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "status", required = false) Integer status,
            @RequestParam(value = "pageNo", defaultValue = "1") Integer pageNo,
            @RequestParam(value = "pageSize", defaultValue = "10") Integer pageSize) {
        return Result.success(
                dataStandardService.getDataStandardPage(name, type, status, pageNo, pageSize));
    }

    @ApiOperation("启用数据标准")
    @PostMapping("/{id}/enable")
    Result<Boolean> enableDataStandard(@PathVariable("id") Long id) {
        return Result.success(dataStandardService.enableDataStandard(id));
    }

    @ApiOperation("停用数据标准")
    @PostMapping("/{id}/disable")
    Result<Boolean> disableDataStandard(@PathVariable("id") Long id) {
        return Result.success(dataStandardService.disableDataStandard(id));
    }

    @ApiOperation("复制数据标准")
    @PostMapping("/{id}/copy")
    Result<Long> copyDataStandard(@PathVariable("id") Long id) {
        return Result.success(dataStandardService.copyDataStandard(id));
    }

    @ApiOperation("创建数据标准版本")
    @PostMapping("/{standardId}/version/create")
    Result<Long> createVersion(
            @PathVariable("standardId") Long standardId, @RequestBody DataStandardVersionReq req) {
        return Result.success(dataStandardVersionService.createVersion(standardId, req));
    }

    @ApiOperation("更新数据标准版本")
    @PutMapping("/{standardId}/version/{versionId}")
    Result<Boolean> updateVersion(
            @PathVariable("standardId") Long standardId,
            @PathVariable("versionId") Long versionId,
            @RequestBody DataStandardVersionReq req) {
        return Result.success(dataStandardVersionService.updateVersion(standardId, versionId, req));
    }

    @ApiOperation("删除数据标准版本")
    @DeleteMapping("/{standardId}/version/{versionId}")
    Result<Boolean> deleteVersion(
            @PathVariable("standardId") Long standardId,
            @PathVariable("versionId") Long versionId) {
        return Result.success(dataStandardVersionService.deleteVersion(standardId, versionId));
    }

    @ApiOperation("获取数据标准版本详情")
    @GetMapping("/{standardId}/version/{versionId}")
    Result<DataStandardVersionDetailRes> getVersionDetail(
            @PathVariable("standardId") Long standardId,
            @PathVariable("versionId") Long versionId) {
        return Result.success(dataStandardVersionService.getVersionDetail(standardId, versionId));
    }

    @ApiOperation("获取数据标准版本列表")
    @GetMapping("/{standardId}/version/list")
    Result<List<DataStandardVersionRes>> getVersionList(
            @PathVariable("standardId") Long standardId) {
        return Result.success(dataStandardVersionService.getVersionList(standardId));
    }

    @ApiOperation("发布数据标准版本")
    @PostMapping("/{standardId}/version/{versionId}/publish")
    Result<Boolean> publishVersion(
            @PathVariable("standardId") Long standardId,
            @PathVariable("versionId") Long versionId) {
        return Result.success(dataStandardVersionService.publishVersion(standardId, versionId));
    }

    @ApiOperation("归档数据标准版本")
    @PostMapping("/{standardId}/version/{versionId}/archive")
    Result<Boolean> archiveVersion(
            @PathVariable("standardId") Long standardId,
            @PathVariable("versionId") Long versionId) {
        return Result.success(dataStandardVersionService.archiveVersion(standardId, versionId));
    }

    @ApiOperation("获取字段列表")
    @GetMapping("/{standardId}/version/{versionId}/field/list")
    Result<List<DataStandardFieldRes>> getFieldList(
            @PathVariable("standardId") Long standardId,
            @PathVariable("versionId") Long versionId) {
        return Result.success(dataStandardFieldService.getFieldList(standardId, versionId));
    }

    @ApiOperation("批量更新字段")
    @PostMapping("/{standardId}/version/{versionId}/field/batch")
    Result<List<DataStandardFieldRes>> batchUpdateFields(
            @PathVariable("standardId") Long standardId,
            @PathVariable("versionId") Long versionId,
            @RequestBody List<DataStandardFieldReq> fieldReqs) {
        return Result.success(
                dataStandardFieldService.batchUpdateFields(standardId, versionId, fieldReqs));
    }

    @ApiOperation("获取格式列表")
    @GetMapping("/{standardId}/version/{versionId}/format/list")
    Result<List<DataStandardFormatRes>> getFormatList(
            @PathVariable("standardId") Long standardId,
            @PathVariable("versionId") Long versionId) {
        return Result.success(dataStandardFormatService.getFormatList(standardId, versionId));
    }

    @ApiOperation("批量更新格式")
    @PostMapping("/{standardId}/version/{versionId}/format/batch")
    Result<List<DataStandardFormatRes>> batchUpdateFormats(
            @PathVariable("standardId") Long standardId,
            @PathVariable("versionId") Long versionId,
            @RequestBody List<DataStandardFormatReq> formatReqs) {
        return Result.success(
                dataStandardFormatService.batchUpdateFormats(standardId, versionId, formatReqs));
    }

    @ApiOperation("获取字段映射列表")
    @GetMapping("/{standardId}/version/{versionId}/mapping/list")
    Result<List<DataStandardFieldMappingRes>> getMappingList(
            @PathVariable("standardId") Long standardId,
            @PathVariable("versionId") Long versionId) {
        return Result.success(
                dataStandardFieldMappingService.getMappingList(standardId, versionId));
    }

    @ApiOperation("批量更新字段映射")
    @PostMapping("/{standardId}/version/{versionId}/mapping/batch")
    Result<List<DataStandardFieldMappingRes>> batchUpdateMappings(
            @PathVariable("standardId") Long standardId,
            @PathVariable("versionId") Long versionId,
            @RequestBody List<DataStandardFieldMappingReq> mappingReqs) {
        return Result.success(
                dataStandardFieldMappingService.batchUpdateMappings(
                        standardId, versionId, mappingReqs));
    }

    @ApiOperation("绑定虚拟表到数据标准")
    @PostMapping("/virtual-table/{virtualTableId}/bind")
    Result<Boolean> bindVirtualTable(
            @PathVariable("virtualTableId") Long virtualTableId,
            @RequestParam("standardId") Long standardId,
            @RequestParam("versionId") Long versionId,
            @RequestParam(value = "snapshot", required = false) String snapshot) {
        return Result.success(
                virtualTableStandardService.bindVirtualTable(
                        virtualTableId, standardId, versionId, snapshot));
    }

    @ApiOperation("解绑虚拟表")
    @PostMapping("/virtual-table/{virtualTableId}/unbind")
    Result<Boolean> unbindVirtualTable(@PathVariable("virtualTableId") Long virtualTableId) {
        return Result.success(virtualTableStandardService.unbindVirtualTable(virtualTableId));
    }

    @ApiOperation("获取虚拟表绑定的数据标准")
    @GetMapping("/virtual-table/{virtualTableId}/binding")
    Result<VirtualTableStandardRes> getBindingByVirtualTableId(
            @PathVariable("virtualTableId") Long virtualTableId) {
        return Result.success(
                virtualTableStandardService.getBindingByVirtualTableId(virtualTableId));
    }

    @ApiOperation("获取数据标准关联的虚拟表列表")
    @GetMapping("/{standardId}/relation/list")
    Result<List<DataStandardRelationRes>> getRelationList(
            @PathVariable("standardId") Long standardId) {
        return Result.success(virtualTableStandardService.getRelationList(standardId));
    }

    @ApiOperation("获取数据标准指定版本的关联列表")
    @GetMapping("/{standardId}/version/{versionId}/relation/list")
    Result<List<DataStandardRelationRes>> getRelationListByStandardIdAndVersionId(
            @PathVariable("standardId") Long standardId,
            @PathVariable("versionId") Long versionId) {
        return Result.success(
                virtualTableStandardService.getRelationListByStandardIdAndVersionId(
                        standardId, versionId));
    }
}
