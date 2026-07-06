package org.apache.seatunnel.app.domain.request.tag;

import org.apache.seatunnel.app.domain.request.group.GroupCreateDTO;

import java.util.List;

public class ImportTagsRequest {
    private Long datasourceId;
    private String groupPath;
    private String importType;
    private List<TagCreateDTO> tags;
    private List<GroupCreateDTO> groups;
    private String csvContent;
    private String jsonContent;

    public Long getDatasourceId() {
        return datasourceId;
    }

    public void setDatasourceId(Long datasourceId) {
        this.datasourceId = datasourceId;
    }

    public String getGroupPath() {
        return groupPath;
    }

    public void setGroupPath(String groupPath) {
        this.groupPath = groupPath;
    }

    public String getImportType() {
        return importType;
    }

    public void setImportType(String importType) {
        this.importType = importType;
    }

    public List<TagCreateDTO> getTags() {
        return tags;
    }

    public void setTags(List<TagCreateDTO> tags) {
        this.tags = tags;
    }

    public List<GroupCreateDTO> getGroups() {
        return groups;
    }

    public void setGroups(List<GroupCreateDTO> groups) {
        this.groups = groups;
    }

    public String getCsvContent() {
        return csvContent;
    }

    public void setCsvContent(String csvContent) {
        this.csvContent = csvContent;
    }

    public String getJsonContent() {
        return jsonContent;
    }

    public void setJsonContent(String jsonContent) {
        this.jsonContent = jsonContent;
    }
}
