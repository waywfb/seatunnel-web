package org.apache.seatunnel.app.service.tag;

import org.apache.seatunnel.app.dal.entity.DataSourceTagGroup;
import org.apache.seatunnel.app.domain.request.group.GroupCreateDTO;
import org.apache.seatunnel.app.domain.request.group.GroupUpdateDTO;
import org.apache.seatunnel.app.domain.response.group.GroupResponse;

import java.util.List;
import java.util.Map;

public interface GroupService {
    List<DataSourceTagGroup> createGroups(Long datasourceId, List<GroupCreateDTO> groups);

    void updateGroup(Long groupId, GroupUpdateDTO dto);

    void deleteGroup(Long groupId);

    void batchDeleteByDatasourceId(Long datasourceId);

    List<GroupResponse> getGroups(Long datasourceId);

    Map<String, Long> buildPathToIdMap(Long datasourceId);

    String getPathById(Long groupId);
}
