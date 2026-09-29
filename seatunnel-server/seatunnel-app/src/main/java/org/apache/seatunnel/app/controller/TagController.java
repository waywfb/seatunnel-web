package org.apache.seatunnel.app.controller;

import org.apache.seatunnel.app.common.Result;
import org.apache.seatunnel.app.dal.entity.DataSourceTag;
import org.apache.seatunnel.app.dal.entity.SyncTaskStatus;
import org.apache.seatunnel.app.dal.entity.TagStatus;
import org.apache.seatunnel.app.domain.request.group.GroupCreateDTO;
import org.apache.seatunnel.app.domain.request.group.GroupUpdateDTO;
import org.apache.seatunnel.app.domain.request.tag.DiscoverRequestDTO;
import org.apache.seatunnel.app.domain.request.tag.ImportTagsRequest;
import org.apache.seatunnel.app.domain.request.tag.ReadTagsRequest;
import org.apache.seatunnel.app.domain.request.tag.RefreshTagsRequest;
import org.apache.seatunnel.app.domain.request.tag.TagCreateDTO;
import org.apache.seatunnel.app.domain.request.tag.TagUpdateDTO;
import org.apache.seatunnel.app.domain.response.group.GroupResponse;
import org.apache.seatunnel.app.domain.response.tag.DiscoverResponseDTO;
import org.apache.seatunnel.app.domain.response.tag.TagResponse;
import org.apache.seatunnel.app.domain.response.tag.TagValueDTO;
import org.apache.seatunnel.app.service.bridge.BridgeClient;
import org.apache.seatunnel.app.service.sync.SyncService;
import org.apache.seatunnel.app.service.sync.impl.AsyncSyncTrigger;
import org.apache.seatunnel.app.service.tag.GroupService;
import org.apache.seatunnel.app.service.tag.TagService;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/seatunnel/api/v1/datasource")
public class TagController extends BaseController {

    private final TagService tagService;
    private final GroupService groupService;
    private final SyncService syncService;
    private final AsyncSyncTrigger asyncSyncTrigger;
    private final BridgeClient bridgeClient;

    public TagController(
            TagService tagService,
            GroupService groupService,
            SyncService syncService,
            AsyncSyncTrigger asyncSyncTrigger,
            BridgeClient bridgeClient) {
        this.tagService = tagService;
        this.groupService = groupService;
        this.syncService = syncService;
        this.asyncSyncTrigger = asyncSyncTrigger;
        this.bridgeClient = bridgeClient;
    }

    @PostMapping("/tags/discover")
    public Result<DiscoverResponseDTO> discover(@Valid @RequestBody DiscoverRequestDTO request) {
        DiscoverResponseDTO response = bridgeClient.discover(request);
        return success(response);
    }

    @PostMapping("/tags/read")
    public Result<List<TagValueDTO>> readValues(@Valid @RequestBody ReadTagsRequest request) {
        return success(bridgeClient.read(request));
    }

    @PostMapping("/{id}/tags/import")
    public Result<List<TagResponse>> importTags(
            @PathVariable("id") Long datasourceId, @Valid @RequestBody ImportTagsRequest request) {
        List<TagCreateDTO> dtoList = request.getTags();
        if (request.getGroups() != null && !request.getGroups().isEmpty()) {
            groupService.createGroups(datasourceId, request.getGroups());
        }
        Map<String, Long> pathToIdMap = groupService.buildPathToIdMap(datasourceId);
        tagService.createTags(datasourceId, dtoList, pathToIdMap);
        List<TagResponse> tags = tagService.getTags(datasourceId);
        return success(tags);
    }

    @PostMapping("/{id}/tags/refresh")
    public Result refreshTags(
            @PathVariable("id") Long datasourceId, @RequestBody RefreshTagsRequest request) {
        asyncSyncTrigger.triggerSync(datasourceId);
        return success("Sync started");
    }

    @GetMapping("/sync-tasks/{taskId}")
    public Result<SyncTaskStatus> getTaskStatus(@PathVariable("taskId") String taskId) {
        SyncTaskStatus status = syncService.getTaskStatus(taskId);
        if (status == null) {
            return error(404, "Task not found: " + taskId);
        }
        return success(status);
    }

    @GetMapping("/tags")
    public Result<List<TagResponse>> getTags(@RequestParam("datasourceId") Long datasourceId) {
        return success(tagService.getTags(datasourceId));
    }

    @GetMapping("/tags/{tagId}")
    public Result<TagResponse> getTag(@PathVariable("tagId") Long tagId) {
        DataSourceTag tag = tagService.getTag(tagId);
        if (tag == null) {
            return error(404, "Tag not found");
        }
        TagResponse response = new TagResponse();
        response.setId(tag.getId());
        response.setDatasourceId(tag.getDatasourceId());
        response.setGroupId(tag.getGroupId());
        response.setNativeId(tag.getNativeId());
        response.setTagAddress(tag.getTagAddress());
        response.setTagName(tag.getTagName());
        response.setStatus(TagStatus.fromCode(tag.getStatus()));
        return success(response);
    }

    @PutMapping("/tags/{tagId}")
    public Result updateTag(
            @PathVariable("tagId") Long tagId, @Valid @RequestBody TagUpdateDTO dto) {
        tagService.updateTag(tagId, dto);
        return success();
    }

    @DeleteMapping("/tags/{tagId}")
    public Result deleteTag(@PathVariable("tagId") Long tagId) {
        tagService.deleteTag(tagId);
        return success();
    }

    @GetMapping("/groups")
    public Result<List<GroupResponse>> getGroups(@RequestParam("datasourceId") Long datasourceId) {
        return success(groupService.getGroups(datasourceId));
    }

    @PostMapping("/groups")
    public Result<List<GroupResponse>> createGroups(
            @RequestParam("datasourceId") Long datasourceId,
            @Valid @RequestBody List<GroupCreateDTO> dtos) {
        groupService.createGroups(datasourceId, dtos);
        return success(groupService.getGroups(datasourceId));
    }

    @PutMapping("/groups/{groupId}")
    public Result updateGroup(
            @PathVariable("groupId") Long groupId, @Valid @RequestBody GroupUpdateDTO dto) {
        groupService.updateGroup(groupId, dto);
        return success();
    }

    @DeleteMapping("/groups/{groupId}")
    public Result deleteGroup(@PathVariable("groupId") Long groupId) {
        groupService.deleteGroup(groupId);
        return success();
    }
}
