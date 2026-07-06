package org.apache.seatunnel.app.service.sync.impl;

import org.apache.seatunnel.app.dal.entity.DataSourceTagGroup;
import org.apache.seatunnel.app.dal.entity.SyncTaskStatus;
import org.apache.seatunnel.app.domain.request.group.GroupCreateDTO;
import org.apache.seatunnel.app.domain.request.tag.DiscoverRequestDTO;
import org.apache.seatunnel.app.domain.request.tag.TagCreateDTO;
import org.apache.seatunnel.app.domain.response.tag.BrowseNodeDTO;
import org.apache.seatunnel.app.domain.response.tag.DiscoverResponseDTO;
import org.apache.seatunnel.app.service.bridge.BridgeClient;
import org.apache.seatunnel.app.service.sync.SyncService;
import org.apache.seatunnel.app.service.sync.SyncTaskRepository;
import org.apache.seatunnel.app.service.tag.GroupService;
import org.apache.seatunnel.app.service.tag.TagService;
import org.apache.seatunnel.server.common.SeatunnelErrorEnum;
import org.apache.seatunnel.server.common.SeatunnelException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SyncServiceImpl implements SyncService {

    private static final Logger log = LoggerFactory.getLogger(SyncServiceImpl.class);

    private final BridgeClient bridgeClient;
    private final GroupService groupService;
    private final TagService tagService;
    private final SyncTaskRepository taskRepository;

    private final Map<Long, String> runningTasks = new ConcurrentHashMap<>();

    public SyncServiceImpl(
            BridgeClient bridgeClient,
            GroupService groupService,
            TagService tagService,
            SyncTaskRepository taskRepository) {
        this.bridgeClient = bridgeClient;
        this.groupService = groupService;
        this.tagService = tagService;
        this.taskRepository = taskRepository;
    }

    @Override
    public CompletableFuture<Void> syncTagsAsync(Long datasourceId) {
        return doSync(datasourceId);
    }

    @Override
    public void startSync(Long datasourceId) {
        if (runningTasks.containsKey(datasourceId)) {
            throw new SeatunnelException(
                    SeatunnelErrorEnum.ILLEGAL_STATE,
                    "Sync already running for datasource " + datasourceId);
        }
        doSync(datasourceId);
    }

    private CompletableFuture<Void> doSync(Long datasourceId) {
        String taskId = Long.toString(System.currentTimeMillis());
        runningTasks.put(datasourceId, taskId);
        SyncTaskStatus status = SyncTaskStatus.pending(taskId);
        taskRepository.save(taskId, status);

        try {
            status.setState(SyncTaskStatus.State.RUNNING);
            status.setProgress(0);
            taskRepository.save(taskId, status);

            log.info("Starting sync for datasource {}", datasourceId);

            // Build connectionId and discover
            DiscoverRequestDTO discReq = new DiscoverRequestDTO();
            discReq.setConnectionId(buildConnectionId(datasourceId));
            discReq.setParentNodeId(null);

            DiscoverResponseDTO discResp = bridgeClient.discover(discReq);
            List<BrowseNodeDTO> nodes = discResp.getNodes();

            if (nodes == null || nodes.isEmpty()) {
                status.setState(SyncTaskStatus.State.COMPLETED);
                status.setProgress(100);
                status.setMessage("No tags found");
                taskRepository.save(taskId, status);
                return CompletableFuture.completedFuture(null);
            }

            log.info("Discovered {} root nodes for datasource {}", nodes.size(), datasourceId);

            // Convert nodes to groups and tags
            status.setProgress(20);
            status.setMessage("Processing groups...");
            taskRepository.save(taskId, status);

            saveBrowseResult(datasourceId, "/root", nodes);

            status.setState(SyncTaskStatus.State.COMPLETED);
            status.setProgress(100);
            status.setMessage("Sync completed");
            taskRepository.save(taskId, status);
            log.info("Sync completed for datasource {}", datasourceId);

        } catch (Exception e) {
            log.error("Sync failed for datasource {}", datasourceId, e);
            status.setState(SyncTaskStatus.State.FAILED);
            status.setMessage("Sync failed: " + e.getMessage());
            taskRepository.save(taskId, status);
        } finally {
            runningTasks.remove(datasourceId);
        }

        return CompletableFuture.completedFuture(null);
    }

    @Override
    public SyncTaskStatus getTaskStatus(String taskId) {
        return taskRepository.get(taskId);
    }

    @Transactional
    protected void saveBrowseResult(
            Long datasourceId, String parentPath, List<BrowseNodeDTO> nodes) {
        List<GroupCreateDTO> groups = new ArrayList<>();
        List<TagCreateDTO> tags = new ArrayList<>();

        for (BrowseNodeDTO node : nodes) {
            if (node.getLeaf() != null && node.getLeaf()) {
                // Leaf node = tag
                TagCreateDTO tagDto = new TagCreateDTO();
                tagDto.setNativeId(node.getNativeId());
                tagDto.setTagAddress(node.getAddress());
                tagDto.setTagName(node.getDisplayName());
                tagDto.setGroupPath(parentPath);
                tagDto.setSource("browse");
                tagDto.setDisplayName(node.getDisplayName());
                if (node.getAttributes() != null) {
                    tagDto.setProperties(node.getAttributes());
                }
                tags.add(tagDto);
            } else {
                // Non-leaf = group
                GroupCreateDTO groupDto = new GroupCreateDTO();
                groupDto.setGroupName(
                        node.getDisplayName() != null ? node.getDisplayName() : node.getNativeId());
                groupDto.setParentPath(parentPath);
                groups.add(groupDto);
            }
        }

        // Save groups first to get IDs
        List<DataSourceTagGroup> savedGroups = groupService.createGroups(datasourceId, groups);

        // Build path->id map including parent path
        Map<String, Long> pathToIdMap = groupService.buildPathToIdMap(datasourceId);

        // Recursively process children for non-leaf nodes
        int groupIdx = 0;
        for (BrowseNodeDTO node : nodes) {
            if (node.getLeaf() != null && node.getLeaf()) continue;

            if (node.getChildren() != null && !node.getChildren().isEmpty()) {
                DataSourceTagGroup savedGroup =
                        groupIdx < savedGroups.size() ? savedGroups.get(groupIdx) : null;
                String childPath = savedGroup != null ? savedGroup.getPath() : parentPath;
                saveBrowseResult(datasourceId, childPath, node.getChildren());
            }
            groupIdx++;
        }

        // Save tags
        tagService.createTags(datasourceId, tags, pathToIdMap);
    }

    private String buildConnectionId(Long datasourceId) {
        // In production, this would look up the datasource and build connectionId from its config.
        // For now, this is a placeholder that works with the datasource's pluginName and config.
        // The actual connectionId format is "protocol://host:port"
        throw new SeatunnelException(
                SeatunnelErrorEnum.ILLEGAL_STATE,
                "Connection ID building not yet implemented - must be called with a connectionId directly");
    }
}
