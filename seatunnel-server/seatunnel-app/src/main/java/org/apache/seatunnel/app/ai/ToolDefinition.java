package org.apache.seatunnel.app.ai;

import java.util.List;
import java.util.Map;

public class ToolDefinition {
    private String name;
    private String description;
    private Map<String, Object> parameters;
    private List<String> required;

    public ToolDefinition(
            String name,
            String description,
            Map<String, Object> parameters,
            List<String> required) {
        this.name = name;
        this.description = description;
        this.parameters = parameters;
        this.required = required;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public Map<String, Object> getParameters() {
        return parameters;
    }

    public List<String> getRequired() {
        return required;
    }
}
