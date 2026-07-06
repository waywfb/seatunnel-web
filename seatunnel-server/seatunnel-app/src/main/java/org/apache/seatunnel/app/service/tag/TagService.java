package org.apache.seatunnel.app.service.tag;

import org.apache.seatunnel.app.dal.entity.DataSourceTag;
import org.apache.seatunnel.app.dal.entity.TagStatus;
import org.apache.seatunnel.app.domain.request.tag.TagCreateDTO;
import org.apache.seatunnel.app.domain.request.tag.TagUpdateDTO;
import org.apache.seatunnel.app.domain.response.tag.TagResponse;

import java.util.List;

public interface TagService {
    List<DataSourceTag> createTags(
            Long datasourceId, List<TagCreateDTO> tags, java.util.Map<String, Long> pathToIdMap);

    void updateTag(Long tagId, TagUpdateDTO dto);

    void deleteTag(Long tagId);

    void batchDeleteByDatasourceId(Long datasourceId);

    DataSourceTag getTag(Long tagId);

    List<TagResponse> getTags(Long datasourceId);

    List<TagResponse> getTagsByGroup(Long datasourceId, Long groupId);

    List<DataSourceTag> getActiveTags(Long datasourceId);

    void updateStatus(Long tagId, TagStatus status);
}
